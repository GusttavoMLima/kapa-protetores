# k6 Load Testing

Performance and load testing scripts for the Kapa API using [Grafana k6](https://k6.io/) running via Docker.

## Scripts

- **`smoke-test.js`**: Quick sanity check (1 VU, 10s) ensuring core endpoints are responding.
- **`load-test.js`**: Staged load test (ramping to 20 VUs over 60s) assessing throughput and p95 latency.
- **`animals.js`**: Authenticated load test on `/animals` endpoint (ramping to 20 VUs over 60s).

## Prerequisites

- Docker installed and running.
- Backend server running locally (e.g., `npm run dev` at `http://localhost:4000`).

## Running Tests

From the monorepo root (or `apps/server`):

```bash
# Run smoke test via Docker Compose
npm run test:k6:smoke

# Run load test via Docker Compose
npm run test:k6:load

# Run animals load test via Docker Compose
npm run test:k6:animals
```

Or using Docker Compose directly (from `apps/server`):

```bash
docker compose run --rm k6 run /k6/smoke-test.js
docker compose run --rm k6 run /k6/load-test.js
docker compose run --rm k6 run /k6/animals.js
```

Or using Docker CLI directly:

```bash
docker run --rm -i --add-host="host.docker.internal:host-gateway" -e BASE_URL=http://host.docker.internal:4000/api -v $(pwd)/k6:/k6 grafana/k6 run /k6/smoke-test.js
```
