import { createClientPool, RedisClientPoolType } from 'redis';
import { logger } from '../config/logger';

function getRedisConnection(): { url: string; password?: string } {
  const configuredUrl = process.env.REDIS_URL?.trim();

  if (configuredUrl) {
    const parsedUrl = new URL(configuredUrl);
    if (parsedUrl.protocol !== 'redis:' && parsedUrl.protocol !== 'rediss:') {
      throw new Error('REDIS_URL must use the redis or rediss protocol');
    }

    return { url: configuredUrl };
  }

  return {
    url: `redis://localhost:${process.env.REDIS_PORT || 6379}`,
    password: process.env.REDIS_PASSWORD,
  };
}

const redisConnection = getRedisConnection();

const pool = createClientPool(
  redisConnection,
  {
    minimum: 5,
    maximum: 25,
  },
);

pool.on('error', (err: Error) => {
  logger.error({ err }, 'Redis error');
});

export interface CacheProvider {
  getCache<T>(cacheKey: string): Promise<T | null>;
  setCache<T>(
    cacheKey: string,
    cacheData: T,
    EX?: number,
  ): Promise<string | null | undefined>;
  deleteCache(cacheKey: string): Promise<void>;
}

export class RedisService implements CacheProvider {
  private pool: RedisClientPoolType = pool;

  constructor() {
    if (process.env.NODE_ENV !== 'test') {
      void this.connectRedis();
    }
  }

  private async connectRedis() {
    try {
      await this.pool.connect();
      logger.info('Successfully connected to Redis Pool');
    } catch (err) {
      logger.error({ err }, 'Failed to initialize Redis Pool');
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
      logger.error({ err, cacheKey }, 'Error setting cache');
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
        logger.warn(
          { err: parseError, cacheKey },
          'Cache key could not be parsed as JSON. Returning raw string.',
        );
        return cachedData as unknown as T;
      }
    } catch (err) {
      logger.error({ err, cacheKey }, 'Error retrieving cache');
      return null;
    }
  }

  public async deleteCache(cacheKey: string): Promise<void> {
    try {
      if (!cacheKey) {
        return;
      }
      await this.pool.del(cacheKey);
    } catch (err) {
      logger.error({ err, cacheKey }, 'Error deleting cache');
    }
  }

  public async setHash<T>(key: string, data: T): Promise<void> {
    try {
      const value = typeof data === 'string' ? data : JSON.stringify(data);
      await this.pool.hSet(key, { data: value });
    } catch (err) {
      logger.error({ err, key }, 'Error setting hash');
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
        logger.error({ err, key }, 'Error parsing data for hash key');
        return data as unknown as T;
      }
    } catch (err) {
      logger.error({ err, key }, 'Error getting hash');
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
          logger.error(
            { err, key, field },
            'Error parsing hash field',
          );
          parsedData[field] = value as T;
        }
      }
      return parsedData;
    } catch (err) {
      logger.error({ err, key }, 'Error getting all hash fields');
      throw err;
    }
  }
}

export const redisService = new RedisService();
