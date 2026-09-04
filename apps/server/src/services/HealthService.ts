export interface HealthStatus {
  status: 'ok' | 'degraded';
  uptime: number;
  timestamp: string;
}

export class HealthService {
  public getStatus(): HealthStatus {
    return {
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    };
  }
}
