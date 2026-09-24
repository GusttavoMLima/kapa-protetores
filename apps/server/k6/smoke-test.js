/* global __ENV */
import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:4000';

export const options = {
  vus: 1,
  duration: '10s',
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<200'],
  },
};

export default function () {
  const healthRes = http.get(`${BASE_URL}/health`);
  check(healthRes, {
    'health status is 200': (r) => r.status === 200,
  });

  const redisRes = http.get(`${BASE_URL}/health/redis`);
  check(redisRes, {
    'redis status is valid (200 or 503)': (r) => [200, 503].includes(r.status),
  });

  const usersCountRes = http.get(`${BASE_URL}/users/count`);
  check(usersCountRes, {
    'users/count status is 200': (r) => r.status === 200,
  });

  sleep(1);
}
