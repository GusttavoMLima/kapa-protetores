import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

export class PrismaService {
  private static instance: PrismaService;
  public readonly client: PrismaClient;
  private readonly pool: Pool;

  private constructor() {
    const connectionString = process.env.DATABASE_URL;

    this.pool = new Pool({
      connectionString,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });

    const adapter = new PrismaPg(this.pool);
    this.client = new PrismaClient({ adapter });
  }

  public static getInstance(): PrismaService {
    if (!PrismaService.instance) {
      PrismaService.instance = new PrismaService();
    }
    return PrismaService.instance;
  }

  public async connect(): Promise<void> {
    await this.client.$connect();
  }

  public async disconnect(): Promise<void> {
    await this.client.$disconnect();
    await this.pool.end();
  }
}

export const prisma = PrismaService.getInstance().client;
