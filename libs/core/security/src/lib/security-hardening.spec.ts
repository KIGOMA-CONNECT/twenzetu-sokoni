import { AppConfigService } from '@abms/core-config';
import { INestApplication } from '@nestjs/common';
import { applySecurityHardening } from './security-hardening';

function fakeApp(): jest.Mocked<INestApplication> {
  return {
    use: jest.fn(),
    enableCors: jest.fn(),
  } as unknown as jest.Mocked<INestApplication>;
}

function fakeConfig(isProduction: boolean): AppConfigService {
  return { app: { isProduction } } as unknown as AppConfigService;
}

describe('applySecurityHardening', () => {
  it('registers the helmet middleware', () => {
    const app = fakeApp();

    applySecurityHardening(app, fakeConfig(false));

    expect(app.use).toHaveBeenCalledTimes(1);
  });

  it('fails closed on CORS origin in production', () => {
    const app = fakeApp();

    applySecurityHardening(app, fakeConfig(true));

    expect(app.enableCors).toHaveBeenCalledWith({ origin: false, credentials: true });
  });

  it('allows any origin outside production for developer convenience', () => {
    const app = fakeApp();

    applySecurityHardening(app, fakeConfig(false));

    expect(app.enableCors).toHaveBeenCalledWith({ origin: true, credentials: true });
  });
});
