import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { execSync } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';

export interface TestDatabaseContext {
  container: StartedPostgreSqlContainer;
  uri: string;
  prisma: PrismaClient;
  pool: Pool;
  cleanup: () => Promise<void>;
}

export async function setupTestDatabase(): Promise<TestDatabaseContext> {
  // 1. Inicia o contêiner PostgreSQL via Testcontainers com otimizações para testes
  const container = await new PostgreSqlContainer('postgres:16-alpine')
    .withDatabase('test')
    .withUsername('test')
    .withPassword('test')
    .withCommand([
      'postgres',
      '-c',
      'fsync=off',
      '-c',
      'synchronous_commit=off',
      '-c',
      'full_page_writes=off',
    ])
    .start();

  const uri = container.getConnectionUri();

  process.env.DIRECT_URL = uri;
  process.env.DATABASE_URL = uri;

  // 2. Aplica as migrações Prisma ao banco de dados no contêiner
  const serverRoot = path.resolve(__dirname, '../..');
  execSync('npx --no-install prisma migrate deploy', {
    env: { ...process.env, DIRECT_URL: uri, DATABASE_URL: uri },
    cwd: serverRoot,
    stdio: 'ignore',
  });

  // 3. Inicializa o pool pg e o PrismaClient configurado com PrismaPg adapter
  const pool = new Pool({ connectionString: uri });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  const cleanup = async () => {
    await prisma.$disconnect();
    await pool.end();
    await container.stop();
  };

  return {
    container,
    uri,
    prisma,
    pool,
    cleanup,
  };
}

export async function executeSqlFile(
  prisma: PrismaClient,
  filePath: string,
): Promise<void> {
  const content = fs.readFileSync(filePath, 'utf-8');
  await prisma.$executeRawUnsafe(content);
}
