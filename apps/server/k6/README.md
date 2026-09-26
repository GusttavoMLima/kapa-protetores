# k6 Load Testing

Performance and load testing scripts for the Kapa API using [Grafana k6](https://k6.io/) running via Docker.

## Scripts

- **`smoke-test.js`**: Quick sanity check (1 VU, 10s) ensuring core endpoints are responding.
- **`load-test.js`**: Staged load test (ramping to 20 VUs over 60s) assessing throughput and p95 latency.

## Prerequisites

- Docker installed and running.
- Backend server running locally (e.g., `npm run dev` at `http://localhost:4000`).

## Running Tests

From `apps/server`:

```bash
# Run smoke test via Docker Compose
npm run test:k6:smoke

# Run load test via Docker Compose
npm run test:k6:load
```

Or using Docker Compose directly:

```bash
docker compose run --rm k6 run /scripts/smoke-test.js
docker compose run --rm k6 run /scripts/load-test.js
```

Or using Docker CLI directly:

```bash
docker run --rm -i --network="host" -v $(pwd)/k6:/scripts grafana/k6 run /scripts/smoke-test.js
```
