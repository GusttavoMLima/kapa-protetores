import assert from 'node:assert/strict';
import test from 'node:test';
import type { AddressInfo } from 'node:net';
import { Router } from 'express';
import { App } from '../App';

test('CORS accepts every configured client origin and rejects other origins', async (t) => {
  const application = new App({ router: Router() }, {
    port: 0,
    clientUrl: 'http://localhost:8081, http://localhost:8082/',
  });
  const server = application.listen();
  await new Promise<void>((resolve) => server.once('listening', resolve));
  t.after(() => application.close());

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
    assert.equal(response.status, 204);
    assert.equal(response.headers.get('access-control-allow-origin'), origin);
  }

  const rejected = await request('https://malicious.example');
  assert.equal(rejected.status, 403);
  assert.equal(rejected.headers.get('access-control-allow-origin'), null);
});
