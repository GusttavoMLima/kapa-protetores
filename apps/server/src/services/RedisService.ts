import { createClientPool, RedisClientPoolType } from 'redis';

const URL = `redis://localhost:${process.env.REDIS_PORT || 6379}`;
const PASSWORD = process.env.REDIS_PASSWORD;

const pool = createClientPool(
  {
    url: URL,
    password: PASSWORD,
  },
  {
    minimum: 5,
    maximum: 25,
  },
);

pool.on('error', (err: Error) => {
  console.error('Redis error:', err);
});

export class RedisService {
  private pool: RedisClientPoolType = pool;

  constructor() {
    this.connectRedis();
  }

  private async connectRedis() {
    try {
      await this.pool.connect();
      console.log('Successfully connected to Redis Pool');
    } catch (err) {
      console.error('Failed to initialize Redis Pool:', err);
    }
  }

  public async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    error?: string;
  }> {
    try {
      const response = await this.pool.ping();

      if (response === 'PONG') {
        return { status: 'healthy' };
      }

      return {
        status: 'unhealthy',
        error: `Unexpected PING reply: ${response}`,
      };
    } catch (err) {
      return {
        status: 'unhealthy',
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }

  public async setCache<T>(
    cacheKey: string,
    cacheData: T,
    EX: number = 3600,
  ): Promise<string | null | undefined> {
    try {
      if (!cacheKey || !cacheKey.includes(':')) {
        return;
      }

      const valueToStore =
        typeof cacheData === 'string' ? cacheData : JSON.stringify(cacheData);

      return await this.pool.set(cacheKey, valueToStore, {
        EX,
      });
    } catch (err) {
      console.error(`Error setting cache for key ${cacheKey}:`, err);
    }
  }

  public async getCache<T>(cacheKey: string): Promise<T | null> {
    try {
      if (!cacheKey) {
        return null;
      }

      const cachedData = await this.pool.get(cacheKey);

      if (!cachedData) {
        return null;
      }

      try {
        return JSON.parse(cachedData) satisfies T;
      } catch (parseError) {
        console.warn(
          `Cache key "${cacheKey}" could not be parsed as JSON. Returning raw string.`,
        );
        console.error(parseError);
        return cachedData as unknown as T;
      }
    } catch (err) {
      console.error(`Error retrieving cache for key ${cacheKey}:`, err);
      throw err;
    }
  }

  public async setHash<T>(key: string, data: T): Promise<void> {
    try {
      const value = typeof data === 'string' ? data : JSON.stringify(data);
      await this.pool.hSet(key, { data: value });
    } catch (err) {
      console.error(`Error setting hash for key ${key}:`, err);
      throw err;
    }
  }

  public async getHash<T>(key: string, field: string): Promise<T | null> {
    try {
      if (!key) {
        return null;
      }

      const data = await this.pool.hGet(key, field);

      if (!data) {
        return null;
      }

      try {
        return JSON.parse(data) satisfies T;
      } catch (err) {
        console.error(`Error on parsing data for key ${key}: `, err);
        return data as unknown as T;
      }
    } catch (err) {
      console.error(`Error on getting hash for key ${key}: `, err);
      throw err;
    }
  }

  public async getHashAll<T>(key: string): Promise<Record<string, T> | null> {
    try {
      if (!key) {
        return null;
      }
      const data = await this.pool.hGetAll(key);
      if (Object.keys(data).length === 0) {
        return null;
      }
      const parsedData: Record<string, T> = {};
      for (const [field, value] of Object.entries(data)) {
        try {
          parsedData[field] = JSON.parse(value) as T;
        } catch (err) {
          console.error(
            `Error parsing hash field "${field}" for key "${key}":`,
            err,
          );
          parsedData[field] = value as T;
        }
      }
      return parsedData;
    } catch (err) {
      console.error(`Error on getting hash for key ${key}:`, err);
      throw err;
    }
  }
}

export const redisService = new RedisService();
