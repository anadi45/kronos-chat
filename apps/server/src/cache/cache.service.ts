import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, RedisClientType } from 'redis';

@Injectable()
export class CacheService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(CacheService.name);
  private client: RedisClientType;
  private isConnected = false;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit(): Promise<void> {
    try {
      this.client = createClient({
        username: this.configService.get<string>('REDIS_USERNAME'),
        password: this.configService.get<string>('REDIS_PASSWORD'),
        socket: {
          host: this.configService.get<string>('REDIS_HOST'),
          port: this.configService.get<number>('REDIS_PORT'),
        },
      });

      this.client.on('error', (err) => {
        this.logger.error('Redis Client Error:', err);
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        this.logger.log('Redis client connected');
        this.isConnected = true;
      });

      this.client.on('disconnect', () => {
        this.logger.warn('Redis client disconnected');
        this.isConnected = false;
      });

      await this.client.connect();
    } catch (error) {
      this.logger.error('Failed to initialize Redis cache service:', error);
      throw error;
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (this.client && this.isConnected) {
      await this.client.quit();
      this.logger.log('Redis client disconnected gracefully');
    }
  }

  /**
   * Check if Redis client is connected
   */
  isReady(): boolean {
    return this.isConnected && this.client !== undefined;
  }

  /**
   * Set a key-value pair in Redis
   * @param key - The key to set
   * @param value - The value to store
   * @param ttl - Time to live in seconds (optional)
   */
  async set(key: string, value: string, ttl?: number): Promise<void> {
    if (!this.isReady()) {
      throw new Error('Redis client is not connected');
    }

    try {
      if (ttl) {
        await this.client.setEx(key, ttl, value);
      } else {
        await this.client.set(key, value);
      }
    } catch (error) {
      this.logger.error(`Failed to set key ${key}:`, error);
      throw error;
    }
  }

  /**
   * Get a value from Redis by key
   * @param key - The key to retrieve
   * @returns The value or null if not found
   */
  async get(key: string): Promise<string | null> {
    if (!this.isReady()) {
      throw new Error('Redis client is not connected');
    }

    try {
      const result = await this.client.get(key);
      return typeof result === 'string' ? result : null;
    } catch (error) {
      this.logger.error(`Failed to get key ${key}:`, error);
      throw error;
    }
  }

  /**
   * Delete a key from Redis
   * @param key - The key to delete
   * @returns Number of keys deleted
   */
  async del(key: string): Promise<number> {
    if (!this.isReady()) {
      throw new Error('Redis client is not connected');
    }

    try {
      return await this.client.del(key);
    } catch (error) {
      this.logger.error(`Failed to delete key ${key}:`, error);
      throw error;
    }
  }

  /**
   * Check if a key exists in Redis
   * @param key - The key to check
   * @returns True if key exists, false otherwise
   */
  async exists(key: string): Promise<boolean> {
    if (!this.isReady()) {
      throw new Error('Redis client is not connected');
    }

    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      this.logger.error(`Failed to check existence of key ${key}:`, error);
      throw error;
    }
  }

  /**
   * Set expiration time for a key
   * @param key - The key to set expiration for
   * @param ttl - Time to live in seconds
   * @returns True if expiration was set, false if key doesn't exist
   */
  async expire(key: string, ttl: number): Promise<boolean> {
    if (!this.isReady()) {
      throw new Error('Redis client is not connected');
    }

    try {
      const result = await this.client.expire(key, ttl);
      return Boolean(result);
    } catch (error) {
      this.logger.error(`Failed to set expiration for key ${key}:`, error);
      throw error;
    }
  }

  /**
   * Get the time to live for a key
   * @param key - The key to check
   * @returns TTL in seconds, -1 if no expiration, -2 if key doesn't exist
   */
  async ttl(key: string): Promise<number> {
    if (!this.isReady()) {
      throw new Error('Redis client is not connected');
    }

    try {
      return await this.client.ttl(key);
    } catch (error) {
      this.logger.error(`Failed to get TTL for key ${key}:`, error);
      throw error;
    }
  }

  /**
   * Store a JSON object in Redis
   * @param key - The key to store under
   * @param value - The object to store
   * @param ttl - Time to live in seconds (optional)
   */
  async setJson(key: string, value: any, ttl?: number): Promise<void> {
    const jsonString = JSON.stringify(value);
    await this.set(key, jsonString, ttl);
  }

  /**
   * Retrieve and parse a JSON object from Redis
   * @param key - The key to retrieve
   * @returns The parsed object or null if not found
   */
  async getJson<T = any>(key: string): Promise<T | null> {
    const value = await this.get(key);
    if (value === null) {
      return null;
    }

    try {
      return JSON.parse(value) as T;
    } catch (error) {
      this.logger.error(`Failed to parse JSON for key ${key}:`, error);
      throw new Error(`Invalid JSON stored for key ${key}`);
    }
  }

  /**
   * Get multiple keys at once
   * @param keys - Array of keys to retrieve
   * @returns Array of values (null for non-existent keys)
   */
  async mget(keys: string[]): Promise<(string | null)[]> {
    if (!this.isReady()) {
      throw new Error('Redis client is not connected');
    }

    try {
      const result = await this.client.mGet(keys);
      return result.map(item => typeof item === 'string' ? item : null);
    } catch (error) {
      this.logger.error(`Failed to get multiple keys:`, error);
      throw error;
    }
  }

  /**
   * Set multiple key-value pairs at once
   * @param keyValuePairs - Object with key-value pairs
   */
  async mset(keyValuePairs: Record<string, string>): Promise<void> {
    if (!this.isReady()) {
      throw new Error('Redis client is not connected');
    }

    try {
      await this.client.mSet(keyValuePairs);
    } catch (error) {
      this.logger.error(`Failed to set multiple keys:`, error);
      throw error;
    }
  }

  /**
   * Get all keys matching a pattern
   * @param pattern - The pattern to match (e.g., 'user:*')
   * @returns Array of matching keys
   */
  async keys(pattern: string): Promise<string[]> {
    if (!this.isReady()) {
      throw new Error('Redis client is not connected');
    }

    try {
      return await this.client.keys(pattern);
    } catch (error) {
      this.logger.error(`Failed to get keys with pattern ${pattern}:`, error);
      throw error;
    }
  }

  /**
   * Flush all data from the current database
   */
  async flushAll(): Promise<void> {
    if (!this.isReady()) {
      throw new Error('Redis client is not connected');
    }

    try {
      await this.client.flushAll();
      this.logger.warn('All Redis data has been flushed');
    } catch (error) {
      this.logger.error('Failed to flush Redis data:', error);
      throw error;
    }
  }

  /**
   * Get Redis client info
   */
  async getInfo(): Promise<string> {
    if (!this.isReady()) {
      throw new Error('Redis client is not connected');
    }

    try {
      return await this.client.info();
    } catch (error) {
      this.logger.error('Failed to get Redis info:', error);
      throw error;
    }
  }
}
