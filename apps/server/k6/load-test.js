/* global __ENV */
import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:4000';

export const options = {
  stages: [
    { duration: '15s', target: 10 }, // Ramp-up to 10 VUs
    { duration: '30s', target: 20 }, // Sustain 20 VUs
    { duration: '15s', target: 0 },  // Ramp-down to 0 VUs
  ],
  thresholds: {
    http_req_failed: ['rate<0.05'], // Failure rate must be under 5%
    http_req_duration: ['p(95)<500'], // 95% of requests must complete within 500ms
  },
};

export default function () {
  const responses = http.batch([
    ['GET', `${BASE_URL}/health`],
    ['GET', `${BASE_URL}/users/count`],
    ['GET', `${BASE_URL}/animals`],
  ]);

  check(responses[0], {
    'health returns 200': (r) => r.status === 200,
  });

  check(responses[1], {
    'users/count returns 200': (r) => r.status === 200,
  });

  check(responses[2], {
    'animals returns 200': (r) => r.status === 200,
  });

  sleep(1);
}
