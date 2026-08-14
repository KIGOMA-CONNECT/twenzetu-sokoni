import { BadRequestException } from '@nestjs/common';
import { BeemUssdAdapter } from './beem.adapter';

const INITIATE = {
  command: 'initiate',
  msisdn: '255762089337',
  session_id: 4574,
  operator: 'vodacom',
  payload: { request_id: 0, response: 0 },
};

describe('BeemUssdAdapter', () => {
  describe('parse', () => {
    it('parses an initiate request', () => {
      const parsed = BeemUssdAdapter.parse(INITIATE);

      expect(parsed.command).toBe('initiate');
      expect(parsed.msisdn).toBe('255762089337');
      expect(parsed.phoneNumber).toBe('+255762089337');
      expect(parsed.sessionId).toBe('4574');
      expect(parsed.operator).toBe('vodacom');
      expect(parsed.requestId).toBe(0);
      expect(parsed.response).toBe('0');
    });

    it('parses a continue request with subscriber input', () => {
      const parsed = BeemUssdAdapter.parse({
        command: 'continue',
        msisdn: '255762089337',
        session_id: 4574,
        operator: 'tigo',
        payload: { request_id: 1, response: 2 },
      });

      expect(parsed.command).toBe('continue');
      expect(parsed.requestId).toBe(1);
      expect(parsed.response).toBe('2');
    });

    it('accepts mixed-case commands', () => {
      const parsed = BeemUssdAdapter.parse({ ...INITIATE, command: 'Initiate' });
      expect(parsed.command).toBe('initiate');
    });

    it('keeps a leading plus when already internationalised', () => {
      const parsed = BeemUssdAdapter.parse({ ...INITIATE, msisdn: '+255762089337' });
      expect(parsed.phoneNumber).toBe('+255762089337');
    });

    it('rejects an unknown command', () => {
      expect(() => BeemUssdAdapter.parse({ ...INITIATE, command: 'bogus' })).toThrow(
        BadRequestException,
      );
    });

    it('rejects a missing msisdn', () => {
      expect(() => BeemUssdAdapter.parse({ ...INITIATE, msisdn: '' })).toThrow(
        BadRequestException,
      );
    });

    it('rejects a missing session_id', () => {
      expect(() => BeemUssdAdapter.parse({ ...INITIATE, session_id: undefined })).toThrow(
        BadRequestException,
      );
    });
  });

  describe('toResponse', () => {
    it('echoes initiate for a fresh session', () => {
      const request = BeemUssdAdapter.parse(INITIATE);
      const response = BeemUssdAdapter.toResponse(request, {
        sessionId: '4574',
        message: 'Welcome to afriMarket\n\n1. Shop',
        continueSession: true,
      });

      expect(response).toEqual({
        msisdn: '255762089337',
        operator: 'vodacom',
        session_id: '4574',
        command: 'initiate',
        payload: { request_id: 0, request: 'Welcome to afriMarket\n\n1. Shop' },
      });
    });

    it('maps a live session to continue', () => {
      const request = BeemUssdAdapter.parse({
        ...INITIATE,
        command: 'continue',
        payload: { request_id: 1, response: 1 },
      });
      const response = BeemUssdAdapter.toResponse(request, {
        sessionId: '4574',
        message: 'Select Category:',
        continueSession: true,
      });

      expect(response.command).toBe('continue');
      expect(response.payload.request_id).toBe(1);
    });

    it('maps a finished session to terminate', () => {
      const request = BeemUssdAdapter.parse({ ...INITIATE, command: 'continue' });
      const response = BeemUssdAdapter.toResponse(request, {
        sessionId: '4574',
        message: 'Thank you for using afriMarket. Kwaheri!',
        continueSession: false,
      });

      expect(response.command).toBe('terminate');
      expect(response.payload.request).toBe('Thank you for using afriMarket. Kwaheri!');
    });
  });

  describe('terminateResponse', () => {
    it('builds a bare terminate response', () => {
      const request = BeemUssdAdapter.parse({ ...INITIATE, command: 'terminate' });
      const response = BeemUssdAdapter.terminateResponse(request);

      expect(response).toEqual({
        msisdn: '255762089337',
        operator: 'vodacom',
        session_id: '4574',
        command: 'terminate',
        payload: { request_id: 0, request: '' },
      });
    });
  });
});
