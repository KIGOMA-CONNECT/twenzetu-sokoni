import { Controller, Post, Body, HttpCode, Logger } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiTags, ApiOperation, ApiExcludeController } from '@nestjs/swagger';
import { UssdSessionService } from './ussd-session.service';
import { UssdEngine } from './ussd.engine';
import { UssdRequest, UssdResponse } from './ussd.types';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserOrmEntity } from '@afri-market/identity-infrastructure';
import { TENANT_DAR } from './ussd.constants';

@ApiTags('USSD')
@Throttle({ default: { limit: 600, ttl: 60000 } })
@Controller('ussd')
export class UssdController {
  private readonly logger = new Logger(UssdController.name);

  constructor(
    private readonly sessionService: UssdSessionService,
    private readonly engine: UssdEngine,
    @InjectRepository(UserOrmEntity)
    private readonly userRepo: Repository<UserOrmEntity>,
  ) {}

  @Post('callback')
  @HttpCode(200)
  @ApiOperation({ summary: 'USSD callback endpoint for carrier gateway' })
  async handleCallback(@Body() body: UssdRequest): Promise<UssdResponse> {
    this.logger.log(
      `USSD request: session=${body.sessionId} phone=${body.phoneNumber} text="${body.text}"`,
    );

    const tenantId = TENANT_DAR;
    const session = await this.sessionService.getOrCreateSession(
      body.phoneNumber,
      tenantId,
      body.sessionId,
    );

    if (!session.userId) {
      const user = await this.userRepo.findOne({
        where: { phoneNumber: body.phoneNumber, tenantId },
      });
      if (user) {
        session.userId = user.id;
        session.userRole = user.role;
      }
    }

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

  @Post('simulate')
  @HttpCode(200)
  @ApiOperation({ summary: 'USSD simulator for testing (no auth required)' })
  async simulate(@Body() body: UssdRequest): Promise<UssdResponse> {
    return this.handleCallback(body);
  }
}
