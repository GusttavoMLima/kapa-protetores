/* global __ENV */
import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:4000/api';

export const options = {
  stages: [
    { duration: '15s', target: 10 },
    { duration: '30s', target: 20 },
    { duration: '15s', target: 0 },
    { duration: '15s', target: 10 },
    { duration: '30s', target: 20 },
    { duration: '15s', target: 0 },
    { duration: '15s', target: 10 },
    { duration: '30s', target: 20 },
    { duration: '15s', target: 30 },
    { duration: '15s', target: 40 },
    { duration: '30s', target: 50 },
    { duration: '15s', target: 100 },
  ],
  thresholds: {
    http_req_failed: ['rate<0.05'],
    'http_req_duration{scenario:default}': ['p(95)<500'],
  },
};

export function setup() {
  const loginRes = http.post(
    `${BASE_URL}/auth/login`,
    JSON.stringify({
      email: 'admin@kapa.com',
      password: '123456',
    }),
    {
      headers: { 'Content-Type': 'application/json' },
    },
  );

  const animalsRes = http.get(`${BASE_URL}/animals`, {
    headers: {
      Authorization: `Bearer ${loginRes.json('data.token')}`,
    },
  });

  check(loginRes, {
    'login returns 200': (r) => r.status === 200,
  });

  check(animalsRes, {
    'animals returns 200': (r) => r.status === 200,
  });

  const animalsData = animalsRes.json('data');
  const animalIds = Array.isArray(animalsData)
    ? animalsData.map((animal) => animal.id)
    : [];
  const token = loginRes.json('data.token');

  if (animalIds.length > 0) {
    http.batch(
      animalIds.map((id) => [
        'GET',
        `${BASE_URL}/animals/${id}`,
        null,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      ]),
    );
  }

  return {
    token,
    animalIds,
  };
}

export default function (data) {
  const animalIds = data.animalIds || [];
  const responses = http.batch(
    animalIds.map((id) => [
      'GET',
      `${BASE_URL}/animals/${id}`,
      null,
      {
        headers: {
          Authorization: `Bearer ${data.token}`,
        },
      },
    ]),
  );

  responses.forEach((response, index) => {
    check(response, {
      [`animal ${animalIds[index]} returns 200`]: (r) => r.status === 200,
    });
  });

  sleep(1);
}
