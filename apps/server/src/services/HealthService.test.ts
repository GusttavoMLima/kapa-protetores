import assert from 'node:assert/strict';
import test from 'node:test';
import { HealthService } from './HealthService';

function withEnv(vars: Record<string, string | undefined>, fn: () => void): void {
  const previous = new Map<string, string | undefined>();
  for (const [key, value] of Object.entries(vars)) {
    previous.set(key, process.env[key]);
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
  try {
    fn();
  } finally {
    for (const [key, value] of previous) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  }
}

test('HealthService reports ok with a numeric uptime', () => {
  const status = new HealthService().getStatus();
  assert.equal(status.status, 'ok');
  assert.equal(typeof status.uptime, 'number');
});

test('HealthService reports GIT_SHA when defined', () => {
  withEnv({ GIT_SHA: 'abc123', RENDER_GIT_COMMIT: undefined }, () => {
    assert.equal(new HealthService().getStatus().commit, 'abc123');
  });
});

test('HealthService falls back to RENDER_GIT_COMMIT', () => {
  withEnv({ GIT_SHA: undefined, RENDER_GIT_COMMIT: 'render456' }, () => {
    assert.equal(new HealthService().getStatus().commit, 'render456');
  });
});

test('HealthService reports unknown when no commit env is defined', () => {
  withEnv({ GIT_SHA: undefined, RENDER_GIT_COMMIT: undefined }, () => {
    assert.equal(new HealthService().getStatus().commit, 'unknown');
  });
});
