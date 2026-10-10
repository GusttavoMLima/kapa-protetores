import { readFileSync } from 'node:fs';
import type { PoolConfig } from 'pg';

export function databaseConnectionConfig(connectionString: string, nodeEnv?: string): PoolConfig {
  let url: URL;
  try { url = new URL(connectionString); } catch { throw new Error('DATABASE_URL must be a valid PostgreSQL URL.'); }
  if (!['postgres:', 'postgresql:'].includes(url.protocol)) {
    throw new Error('DATABASE_URL must use the PostgreSQL protocol.');
  }
  const local = ['localhost', '127.0.0.1', '[::1]', 'database', 'kapa-database'].includes(url.hostname);
  const secure = !local || nodeEnv === 'production';
  if (!secure) return { connectionString, max: 5, idleTimeoutMillis: 30000, connectionTimeoutMillis: 15000 };

  const mode = url.searchParams.get('sslmode');
  if (mode && !['require', 'verify-ca', 'verify-full'].includes(mode)) {
    throw new Error('Remote PostgreSQL connections require verified TLS.');
  }
  if (url.searchParams.has('sslcert') || url.searchParams.has('sslkey') || url.searchParams.has('ssl')) {
    throw new Error('Unsupported TLS parameters in DATABASE_URL.');
  }
  const certificatePath = url.searchParams.get('sslrootcert');
  let ca: string | undefined;
  if (certificatePath) {
    try { ca = readFileSync(certificatePath, 'utf8'); } catch { throw new Error('Unable to read the PostgreSQL CA certificate.'); }
  }
  // pg replaces explicit TLS options when sslmode appears in the URL.
  url.searchParams.delete('sslmode');
  url.searchParams.delete('sslrootcert');
  return {
    connectionString: url.toString(), max: 5, idleTimeoutMillis: 30000, connectionTimeoutMillis: 15000,
    ssl: { rejectUnauthorized: true, ...(ca ? { ca } : {}) },
  };
}
