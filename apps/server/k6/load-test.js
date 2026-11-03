/* global __ENV */
import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:4000/api';

export const options = {
  stages: [
    { duration: '15s', target: 10 }, 
    { duration: '30s', target: 20 }, 
    { duration: '15s', target: 0 },  
  ],
  thresholds: {
    http_req_failed: ['rate<0.05'], 
    'http_req_duration{scenario:default}': ['p(95)<500'],
  },
};

export function setup() {
  http.get(`${BASE_URL}/users/count`);
  http.get(`${BASE_URL}/animals`);
}

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
