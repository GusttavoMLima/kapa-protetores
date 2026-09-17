import { config } from 'dotenv';
import { defineConfig, env } from 'prisma/config';

config({ path: 'apps/server/.env' });

export default defineConfig({
  schema: 'apps/server/prisma/schema.prisma',
  datasource: {
    url: env('DATABASE_URL'),
  },
});
