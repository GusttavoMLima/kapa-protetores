import dotenv from 'dotenv';
import path from 'node:path';

export function loadServerEnv(): void {
  dotenv.config();
  dotenv.config({ path: path.resolve(__dirname, '../../.env'), override: true });
  dotenv.config({
    path: path.resolve(process.cwd(), 'apps/server/.env'),
    override: true,
  });
}

loadServerEnv();
