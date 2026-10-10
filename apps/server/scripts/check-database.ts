import '../src/config/env';
import { PrismaService } from '../src/database/PrismaService';

async function main(): Promise<void> {
  const service = PrismaService.getInstance();
  try {
    await service.client.$queryRaw`SELECT 1`;
    console.log(JSON.stringify({ event: 'database_connection_ok' }));
  } finally { await service.disconnect(); }
}

void main().catch(() => {
  console.error(JSON.stringify({ event: 'database_connection_failed', message: 'Confira DATABASE_URL, rede e certificado TLS.' }));
  process.exitCode = 1;
});
