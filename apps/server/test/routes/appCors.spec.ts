import type { AddressInfo } from 'node:net';
import { Router } from 'express';
import { App } from '../../src/App';

describe('App CORS', () => {
  it('CORS accepts every configured client origin and rejects other origins', async () => {
    const application = new App({ router: Router() }, {
      port: 0,
      clientUrl: 'http://localhost:8081, http://localhost:8082/',
    });
    const server = application.listen();
    await new Promise<void>((resolve) => server.once('listening', resolve));

    try {
      const { port } = server.address() as AddressInfo;
      const request = (origin: string) =>
        fetch(`http://127.0.0.1:${port}/api/health`, {
          method: 'OPTIONS',
          headers: {
            origin,
            'access-control-request-method': 'GET',
          },
        });

      for (const origin of ['http://localhost:8081', 'http://localhost:8082']) {
        const response = await request(origin);
        expect(response.status).toBe(204);
        expect(response.headers.get('access-control-allow-origin')).toBe(origin);
      }

      const rejected = await request('https://malicious.example');
      expect(rejected.status).toBe(403);
      expect(rejected.headers.get('access-control-allow-origin')).toBeNull();
    } finally {
      await application.close();
    }
  });
});
