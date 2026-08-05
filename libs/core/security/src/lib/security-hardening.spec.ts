import { AppConfigService } from '@afri-market/core-config';
import { INestApplication } from '@nestjs/common';
import { applySecurityHardening } from './security-hardening';

function fakeApp(): jest.Mocked<INestApplication> {
  return {
    use: jest.fn(),
    enableCors: jest.fn(),
  } as unknown as jest.Mocked<INestApplication>;
}

function fakeConfig(origins: string[]): AppConfigService {
  return { cors: { origins } } as unknown as AppConfigService;
}

describe('applySecurityHardening', () => {
  it('registers the helmet middleware', () => {
    const app = fakeApp();

    applySecurityHardening(app, fakeConfig(['http://localhost:3000']));

    expect(app.use).toHaveBeenCalledTimes(1);
  });

  it('enables CORS with the configured origins and credentials', () => {
    const app = fakeApp();

    applySecurityHardening(app, fakeConfig(['https://app.example.com']));

    expect(app.enableCors).toHaveBeenCalledWith({
      origin: ['https://app.example.com'],
      credentials: true,
    });
  });
});
