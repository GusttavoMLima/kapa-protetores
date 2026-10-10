import { HealthService } from '../../src/services/HealthService';

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

describe('HealthService', () => {
  it('reports ok with a numeric uptime', () => {
    const status = new HealthService().getStatus();
    expect(status.status).toBe('ok');
    expect(typeof status.uptime).toBe('number');
  });

  it('reports GIT_SHA when defined', () => {
    withEnv({ GIT_SHA: 'abc123', RENDER_GIT_COMMIT: undefined }, () => {
      expect(new HealthService().getStatus().commit).toBe('abc123');
    });
  });

  it('falls back to RENDER_GIT_COMMIT', () => {
    withEnv({ GIT_SHA: undefined, RENDER_GIT_COMMIT: 'render456' }, () => {
      expect(new HealthService().getStatus().commit).toBe('render456');
    });
  });

  it('reports unknown when no commit env is defined', () => {
    withEnv({ GIT_SHA: undefined, RENDER_GIT_COMMIT: undefined }, () => {
      expect(new HealthService().getStatus().commit).toBe('unknown');
    });
  });
});
