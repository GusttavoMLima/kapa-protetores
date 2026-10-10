export interface HealthStatus {
  status: 'ok' | 'degraded';
  uptime: number;
  timestamp: string;
  commit: string;
}

function resolveCommit(): string {
  return process.env.GIT_SHA || process.env.RENDER_GIT_COMMIT || 'unknown';
}

export class HealthService {
  public getStatus(): HealthStatus {
    return {
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      commit: resolveCommit(),
    };
  }
}
