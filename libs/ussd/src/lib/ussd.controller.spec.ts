import { BadRequestException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AppConfigService } from '@afri-market/core-config';
import { UserOrmEntity } from '@afri-market/identity-infrastructure';
import { UssdController } from './ussd.controller';
import { UssdEngine } from './ussd.engine';
import { UssdSessionService } from './ussd-session.service';
import { UssdRequest } from './ussd.types';

const validRequest: UssdRequest = {
  sessionId: 'sess-1',
  phoneNumber: '+255754100003',
  text: '1',
  serviceCode: '*150*30#',
};

const initialRequest: UssdRequest = {
  ...validRequest,
  text: '',
};

describe('UssdController', () => {
  let controller: UssdController;
  const sessionService = {
    getOrCreateSession: jest.fn(),
    saveSession: jest.fn(),
  };
  const engine = {
    getMainMenu: jest.fn(),
    processInput: jest.fn(),
  };
  const userRepo = {
    findOne: jest.fn(),
  };
  const config = {
    ussd: { callbackSecret: '', simulateEnabled: true },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    config.ussd.callbackSecret = '';
    config.ussd.simulateEnabled = true;
    sessionService.getOrCreateSession.mockResolvedValue({
      sessionId: 'sess-1',
      phoneNumber: '+255754100003',
      tenantId: 'tenant-1',
      currentMenu: 'main',
      data: {},
      cart: [],
      createdAt: Date.now(),
      lastAccessedAt: Date.now(),
    });
    engine.getMainMenu.mockResolvedValue({ sessionId: 'sess-1', message: 'menu', continueSession: true });
    engine.processInput.mockResolvedValue({ sessionId: 'sess-1', message: 'next', continueSession: true });
    userRepo.findOne.mockResolvedValue(null);

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UssdController],
      providers: [
        { provide: UssdSessionService, useValue: sessionService },
        { provide: UssdEngine, useValue: engine },
        { provide: AppConfigService, useValue: config },
        { provide: getRepositoryToken(UserOrmEntity), useValue: userRepo },
      ],
    }).compile();

    controller = module.get<UssdController>(UssdController);
  });

  describe('callback', () => {
    it('processes the request when no gateway secret is configured', async () => {
      const response = await controller.handleCallback(initialRequest);

      expect(response.message).toBe('menu');
      expect(engine.getMainMenu).toHaveBeenCalledTimes(1);
      expect(sessionService.saveSession).toHaveBeenCalledTimes(1);
    });

    it('processes a non-initial interaction through the engine', async () => {
      const response = await controller.handleCallback({ ...validRequest, text: '1' });

      expect(response.message).toBe('next');
      expect(engine.processInput).toHaveBeenCalledTimes(1);
    });

    it('rejects when the gateway secret is configured but missing', async () => {
      config.ussd.callbackSecret = 'gw-secret';

      await expect(controller.handleCallback(validRequest)).rejects.toThrow(UnauthorizedException);
    });

    it('rejects when the gateway secret is wrong', async () => {
      config.ussd.callbackSecret = 'gw-secret';

      await expect(
        controller.handleCallback(validRequest, 'wrong-secret'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('accepts a matching gateway secret', async () => {
      config.ussd.callbackSecret = 'gw-secret';

      const response = await controller.handleCallback(initialRequest, 'gw-secret');

      expect(response.message).toBe('menu');
    });

    it('rejects an invalid phone number', async () => {
      await expect(
        controller.handleCallback({ ...validRequest, phoneNumber: 'not-a-phone' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects a missing sessionId', async () => {
      await expect(
        controller.handleCallback({ ...validRequest, sessionId: '' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects an oversized text payload', async () => {
      await expect(
        controller.handleCallback({ ...validRequest, text: 'x'.repeat(201) }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('simulate', () => {
    it('rejects when the simulator is disabled', async () => {
      config.ussd.simulateEnabled = false;

      await expect(controller.simulate(validRequest)).rejects.toThrow(NotFoundException);
    });

    it('processes the request when the simulator is enabled', async () => {
      const response = await controller.simulate(initialRequest);

      expect(response.message).toBe('menu');
    });

    it('enforces the gateway secret on simulate as well', async () => {
      config.ussd.callbackSecret = 'gw-secret';

      await expect(controller.simulate(validRequest, 'wrong')).rejects.toThrow(UnauthorizedException);
    });
  });
});
