import '../src/config/env';
import { PrismaService } from '../src/database/PrismaService';
import { Encrypt } from '../src/utils/Encypt';

function getRequiredEnvironmentVariable(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`${name} must be defined to populate development data.`);
  }

  return value;
}

async function main(): Promise<void> {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Database population must not run in production.');
  }

  const email = getRequiredEnvironmentVariable('SEED_ADMIN_EMAIL');
  const password = getRequiredEnvironmentVariable('SEED_ADMIN_PASSWORD');
  const passwordHash = Encrypt.saltHash(password).toString('hex');
  const prismaService = PrismaService.getInstance();

  try {
    await prismaService.client.user.upsert({
      where: { email },
      update: {
        username: 'Administrador Kapa',
        role: 'admin',
        rules: ['admin:*'],
        password: passwordHash,
      },
      create: {
        username: 'Administrador Kapa',
        email,
        role: 'admin',
        rules: ['admin:*'],
        password: passwordHash,
      },
    });

    console.log('Development administrator account is ready.');
  } finally {
    await prismaService.disconnect();
  }
}

void main().catch((error: unknown) => {
  console.error('Unable to populate development data.');
  if (error instanceof Error) {
    console.error(error.message);
  }
  process.exitCode = 1;
});
