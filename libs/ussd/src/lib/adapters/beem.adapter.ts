import { BadRequestException } from '@nestjs/common';
import { BeemCommand, BeemUssdRequest, BeemUssdResponse, UssdResponse } from '../ussd.types';

const BEEM_COMMANDS: BeemCommand[] = ['initiate', 'continue', 'terminate'];

/**
 * Maps between the Beem USSD Hub callback contract and the internal
 * UssdEngine types. See https://docs.beem.africa USSD Hub API reference.
 */
export class BeemUssdAdapter {
  static parse(body: Record<string, unknown>): BeemUssdRequest {
    const commandRaw = typeof body.command === 'string' ? body.command.toLowerCase() : '';
    if (!(BEEM_COMMANDS as string[]).includes(commandRaw)) {
      throw new BadRequestException('Invalid USSD command');
    }

    const msisdnRaw = typeof body.msisdn === 'string' ? body.msisdn.trim() : '';
    const phoneNumber = this.normalizeMsisdn(msisdnRaw);

    const sessionId = body.session_id != null ? String(body.session_id).trim() : '';
    if (!sessionId) {
      throw new BadRequestException('session_id is required');
    }

    const operator = typeof body.operator === 'string' ? body.operator : '';

    const payload =
      body.payload && typeof body.payload === 'object'
        ? (body.payload as Record<string, unknown>)
        : {};
    const requestId = typeof payload.request_id === 'number' ? payload.request_id : 0;
    const response = payload.response != null ? String(payload.response) : '';

    return {
      command: commandRaw as BeemCommand,
      msisdn: msisdnRaw,
      phoneNumber,
      operator,
      sessionId,
      requestId,
      response,
    };
  }

  static normalizeMsisdn(raw: string): string {
    const digits = raw.startsWith('+') ? raw.slice(1) : raw;
    if (!/^[1-9][0-9]{6,14}$/.test(digits)) {
      throw new BadRequestException('Invalid msisdn');
    }
    return `+${digits}`;
  }

  static toResponse(request: BeemUssdRequest, engine: UssdResponse): BeemUssdResponse {
    const command = engine.continueSession
      ? request.command === 'initiate'
        ? 'initiate'
        : 'continue'
      : 'terminate';
    return {
      msisdn: request.msisdn,
      operator: request.operator,
      session_id: request.sessionId,
      command,
      payload: {
        request_id: request.requestId,
        request: engine.message,
      },
    };
  }

  static terminateResponse(request: BeemUssdRequest): BeemUssdResponse {
    return {
      msisdn: request.msisdn,
      operator: request.operator,
      session_id: request.sessionId,
      command: 'terminate',
      payload: {
        request_id: request.requestId,
        request: '',
      },
    };
  }
}
