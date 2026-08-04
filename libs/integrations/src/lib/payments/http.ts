import * as http from 'http';
import * as https from 'https';

export interface HttpRequestOptions {
  method: string;
  url: string;
  body?: unknown;
  headers?: Record<string, string>;
  timeoutMs?: number;
}

export class HttpStatusError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: string,
    public readonly parsed?: unknown,
  ) {
    super(`HTTP ${status}: ${body.substring(0, 200)}`);
    this.name = 'HttpStatusError';
  }
}

export function httpRequest<T = unknown>(options: HttpRequestOptions): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const urlObj = new URL(options.url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;

    const req = client.request(
      {
        hostname: urlObj.hostname,
        port: urlObj.port || (isHttps ? 443 : 80),
        path: urlObj.pathname + urlObj.search,
        method: options.method,
        headers: {
          'Content-Type': 'application/json',
          ...(options.headers ?? {}),
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          const status = res.statusCode || 0;
          if (status >= 400) {
            let parsed: unknown;
            try {
              parsed = JSON.parse(data);
            } catch {
              parsed = undefined;
            }
            reject(new HttpStatusError(status, data, parsed));
            return;
          }
          try {
            resolve(JSON.parse(data) as T);
          } catch {
            resolve({ raw: data } as T);
          }
        });
      },
    );

    req.on('error', reject);
    req.setTimeout(options.timeoutMs ?? 30000, () => {
      req.destroy(new Error('Request timeout'));
    });

    if (options.body !== undefined) {
      req.write(JSON.stringify(options.body));
    }
    req.end();
  });
}
