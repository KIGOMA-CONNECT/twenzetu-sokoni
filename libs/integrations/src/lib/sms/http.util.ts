import * as https from 'https';
import * as http from 'http';

export interface HttpRequestOptions {
  readonly method: string;
  readonly url: string;
  readonly body?: string | Record<string, unknown>;
  readonly headers?: Record<string, string>;
  readonly formUrlEncoded?: boolean;
  readonly timeoutMs?: number;
}

export function httpRequest<T = Record<string, unknown>>(options: HttpRequestOptions): Promise<T> {
  const { method, url, body, headers = {}, formUrlEncoded = false, timeoutMs = 30000 } = options;

  return new Promise<T>((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;

    const requestHeaders: Record<string, string> = { ...headers };
    let payload: string | undefined;

    if (formUrlEncoded && typeof body === 'string') {
      requestHeaders['Content-Type'] = 'application/x-www-form-urlencoded';
      payload = body;
    } else if (body !== undefined) {
      requestHeaders['Content-Type'] = 'application/json';
      payload = typeof body === 'string' ? body : JSON.stringify(body);
    }

    const requestOptions: https.RequestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method,
      headers: requestHeaders,
    };

    const req = client.request(requestOptions, (res) => {
      let data = '';
      res.on('data', (chunk: string) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data) as T);
        } catch {
          resolve({ raw: data } as unknown as T);
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(timeoutMs, () => {
      req.destroy();
      reject(new Error('HTTP request timeout'));
    });

    if (payload) {
      req.write(payload);
    }
    req.end();
  });
}
