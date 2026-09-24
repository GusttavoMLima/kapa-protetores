import dotenv from 'dotenv';
import path from 'node:path';

dotenv.config();

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

dotenv.config({ path: path.resolve(process.cwd(), 'apps/server/.env') });
