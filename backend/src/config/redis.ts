import Redis from 'ioredis';
import { config } from './index';
import logger from '../utils/logger';

// Main Redis client
const redisClient = new Redis(config.redis.url, {
  maxRetriesPerRequest: 3,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  reconnectOnError: (err) => {
    logger.error('Redis reconnect on error:', err);
    return true;
  },
});

// Pub/Sub client for real-time features
const redisPubClient = new Redis(config.redis.url);
const redisSubClient = new Redis(config.redis.url);

redisClient.on('connect', () => {
  logger.info('✅ Redis client connected');
});

redisClient.on('error', (err) => {
  logger.error('❌ Redis client error:', err);
});

redisClient.on('ready', () => {
  logger.info('✅ Redis client ready');
});

// Cache helper functions
export class RedisCache {
  private static TTL = config.redis.ttl;

  static async get<T>(key: string): Promise<T | null> {
    try {
      const data = await redisClient.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      logger.error(`Redis GET error for key ${key}:`, error);
      return null;
    }
  }

  static async set(key: string, value: any, ttl: number = this.TTL): Promise<void> {
    try {
      await redisClient.setex(key, ttl, JSON.stringify(value));
    } catch (error) {
      logger.error(`Redis SET error for key ${key}:`, error);
    }
  }

  static async del(key: string): Promise<void> {
    try {
      await redisClient.del(key);
    } catch (error) {
      logger.error(`Redis DEL error for key ${key}:`, error);
    }
  }

  static async delPattern(pattern: string): Promise<void> {
    try {
      const keys = await redisClient.keys(pattern);
      if (keys.length > 0) {
        await redisClient.del(...keys);
      }
    } catch (error) {
      logger.error(`Redis DEL pattern error for ${pattern}:`, error);
    }
  }

  static async exists(key: string): Promise<boolean> {
    try {
      const result = await redisClient.exists(key);
      return result === 1;
    } catch (error) {
      logger.error(`Redis EXISTS error for key ${key}:`, error);
      return false;
    }
  }

  static async incr(key: string, ttl?: number): Promise<number> {
    try {
      const value = await redisClient.incr(key);
      if (ttl) {
        await redisClient.expire(key, ttl);
      }
      return value;
    } catch (error) {
      logger.error(`Redis INCR error for key ${key}:`, error);
      return 0;
    }
  }

  // List operations for feed tracking
  static async lpush(key: string, value: any, ttl?: number): Promise<void> {
    try {
      await redisClient.lpush(key, JSON.stringify(value));
      if (ttl) {
        await redisClient.expire(key, ttl);
      }
    } catch (error) {
      logger.error(`Redis LPUSH error for key ${key}:`, error);
    }
  }

  static async lrange<T>(key: string, start: number, stop: number): Promise<T[]> {
    try {
      const data = await redisClient.lrange(key, start, stop);
      return data.map(item => JSON.parse(item));
    } catch (error) {
      logger.error(`Redis LRANGE error for key ${key}:`, error);
      return [];
    }
  }

  // Sorted set for location-based queries
  static async geoadd(key: string, longitude: number, latitude: number, member: string): Promise<void> {
    try {
      await redisClient.geoadd(key, longitude, latitude, member);
    } catch (error) {
      logger.error(`Redis GEOADD error for key ${key}:`, error);
    }
  }

  static async georadius(
    key: string,
    longitude: number,
    latitude: number,
    radius: number,
    unit: 'km' | 'm' = 'km'
  ): Promise<string[]> {
    try {
      const result = await redisClient.georadius(key, longitude, latitude, radius, unit);
      return (result || []) as string[];
    } catch (error) {
      logger.error(`Redis GEORADIUS error for key ${key}:`, error);
      return [];
    }
  }

  // Hash operations for user sessions
  static async hset(key: string, field: string, value: any): Promise<void> {
    try {
      await redisClient.hset(key, field, JSON.stringify(value));
    } catch (error) {
      logger.error(`Redis HSET error for key ${key}:`, error);
    }
  }

  static async hget<T>(key: string, field: string): Promise<T | null> {
    try {
      const data = await redisClient.hget(key, field);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      logger.error(`Redis HGET error for key ${key}:`, error);
      return null;
    }
  }

  static async hgetall<T>(key: string): Promise<Record<string, T>> {
    try {
      const data = await redisClient.hgetall(key);
      const result: Record<string, T> = {};
      for (const [field, value] of Object.entries(data)) {
        result[field] = JSON.parse(value);
      }
      return result;
    } catch (error) {
      logger.error(`Redis HGETALL error for key ${key}:`, error);
      return {};
    }
  }
}

export { redisClient, redisPubClient, redisSubClient };
export default redisClient;
