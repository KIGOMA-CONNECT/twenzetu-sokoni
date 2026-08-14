import { timingSafeEqual } from 'crypto';
import { BadRequestException, Body, Controller, Headers, HttpCode, Logger, NotFoundException, Post, UnauthorizedException } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AppConfigService } from '@afri-market/core-config';
import { SkipResponseTransform } from '@afri-market/core-http';
import { UssdSessionService } from './ussd-session.service';
import { UssdEngine } from './ussd.engine';
import { BeemUssdAdapter } from './adapters/beem.adapter';
import { BeemUssdResponse, UssdRequest, UssdResponse, UssdSession } from './ussd.types';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserOrmEntity } from '@afri-market/identity-infrastructure';
import { TENANT_DAR, USSD_PHONE_PATTERN, USSD_TEXT_MAX_LENGTH } from './ussd.constants';

@ApiTags('USSD')
@Throttle({ default: { limit: 600, ttl: 60000 } })
@Controller('ussd')
export class UssdController {
  private readonly logger = new Logger(UssdController.name);
  private secretWarningLogged = false;

  constructor(
    private readonly sessionService: UssdSessionService,
    private readonly engine: UssdEngine,
    private readonly config: AppConfigService,
    @InjectRepository(UserOrmEntity)
    private readonly userRepo: Repository<UserOrmEntity>,
  ) {}

  @Post('callback')
  @HttpCode(200)
  @ApiOperation({ summary: 'USSD callback endpoint for carrier gateway' })
  async handleCallback(
    @Body() body: UssdRequest,
    @Headers('x-ussd-secret') secret?: string,
  ): Promise<UssdResponse> {
    this.assertGatewaySecret(secret, this.config.ussd.callbackSecret);
    this.assertValidRequest(body);

    this.logger.log(
      `USSD request: session=${body.sessionId} phone=${body.phoneNumber} text="${body.text}"`,
    );

    const tenantId = TENANT_DAR;
    const session = await this.sessionService.getOrCreateSession(
      body.phoneNumber,
      tenantId,
      body.sessionId,
    );

    await this.attachUser(session, body.phoneNumber, tenantId);

    const isFirstInteraction = !body.text || body.text === '';
    let response: UssdResponse;

    if (isFirstInteraction) {
      response = await this.engine.getMainMenu(session);
    } else {
      response = await this.engine.processInput(session, body.text);
    }

    await this.sessionService.saveSession(session);

    this.logger.log(
      `USSD response: session=${response.sessionId} continue=${response.continueSession}`,
    );

    return response;
  }

  @Post('beem/callback')
  @HttpCode(200)
  @SkipResponseTransform()
  @ApiOperation({ summary: 'Beem USSD Hub callback endpoint' })
  async handleBeemCallback(
    @Body() body: Record<string, unknown>,
    @Headers('x-ussd-secret') secret?: string,
  ): Promise<BeemUssdResponse> {
    // Beem's USSD Hub cannot send custom headers, so the callback is gated by
    // an optional BEEM_CALLBACK_SECRET (unset = open, behind the TLS proxy).
    this.assertGatewaySecret(secret, this.config.beem.callbackSecret);

    const request = BeemUssdAdapter.parse(body);

    this.logger.log(
      `Beem USSD request: command=${request.command} session=${request.sessionId} phone=${request.msisdn} operator=${request.operator}`,
    );

    if (request.command === 'terminate') {
      await this.sessionService.endSession(request.sessionId, request.phoneNumber);
      this.logger.log(`Beem USSD session terminated: ${request.sessionId}`);
      return BeemUssdAdapter.terminateResponse(request);
    }

    const tenantId = TENANT_DAR;
    const session = await this.sessionService.getOrCreateSession(
      request.phoneNumber,
      tenantId,
      request.sessionId,
    );

    await this.attachUser(session, request.phoneNumber, tenantId);

    const engineResponse: UssdResponse =
      request.command === 'initiate'
        ? await this.engine.getMainMenu(session)
        : await this.engine.processInput(session, request.response);

    await this.sessionService.saveSession(session);

    this.logger.log(
      `Beem USSD response: session=${request.sessionId} command=${
        engineResponse.continueSession ? request.command : 'terminate'
      }`,
    );

    return BeemUssdAdapter.toResponse(request, engineResponse);
  }

  @Post('simulate')
  @HttpCode(200)
  @ApiOperation({ summary: 'USSD simulator for testing' })
  async simulate(
    @Body() body: UssdRequest,
    @Headers('x-ussd-secret') secret?: string,
  ): Promise<UssdResponse> {
    if (!this.config.ussd.simulateEnabled) {
      throw new NotFoundException('USSD simulator is disabled');
    }
    return this.handleCallback(body, secret);
  }

  private async attachUser(
    session: UssdSession,
    phoneNumber: string,
    tenantId: string,
  ): Promise<void> {
    if (session.userId) {
      return;
    }
    const user = await this.userRepo.findOne({
      where: { phoneNumber, tenantId },
    });
    if (user) {
      session.userId = user.id;
      session.userRole = user.role;
    }
  }

  private assertGatewaySecret(secret: string | undefined, configured: string): void {
    if (!configured) {
      if (!this.secretWarningLogged) {
        this.logger.warn('Gateway secret is not configured; USSD callback is unauthenticated');
        this.secretWarningLogged = true;
      }
      return;
    }
    if (!secret || !this.secureEquals(secret, configured)) {
      throw new UnauthorizedException('Invalid USSD gateway secret');
    }
  }

  private secureEquals(a: string, b: string): boolean {
    const aBuf = Buffer.from(a);
    const bBuf = Buffer.from(b);
    if (aBuf.length !== bBuf.length) {
      return false;
    }
    return timingSafeEqual(aBuf, bBuf);
  }

  private assertValidRequest(body: UssdRequest): void {
    const sessionId = typeof body.sessionId === 'string' ? body.sessionId.trim() : '';
    const phoneNumber = typeof body.phoneNumber === 'string' ? body.phoneNumber.trim() : '';
    const text = typeof body.text === 'string' ? body.text : '';

    if (!sessionId) {
      throw new BadRequestException('sessionId is required');
    }
    if (!USSD_PHONE_PATTERN.test(phoneNumber)) {
      throw new BadRequestException('Invalid phoneNumber');
    }
    if (text.length > USSD_TEXT_MAX_LENGTH) {
      throw new BadRequestException(`text exceeds ${USSD_TEXT_MAX_LENGTH} characters`);
    }
  }
}
