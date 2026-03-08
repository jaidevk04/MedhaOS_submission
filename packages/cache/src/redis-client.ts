/**
 * Redis Client Singleton
 * Supports both standalone Redis and ElastiCache cluster mode
 */

import Redis, { Cluster, RedisOptions, ClusterOptions } from 'ioredis';
import { CacheConfig } from './types';
import { getCacheConfig } from './config';

class RedisClient {
  private static instance: RedisClient;
  private client: Redis | Cluster | null = null;
  private config: CacheConfig;
  private isConnected = false;

  private constructor() {
    this.config = getCacheConfig();
  }

  public static getInstance(): RedisClient {
    if (!RedisClient.instance) {
      RedisClient.instance = new RedisClient();
    }
    return RedisClient.instance;
  }

  public async connect(): Promise<void> {
    if (this.isConnected && this.client) {
      return;
    }

    try {
      if (this.config.clusterMode && this.config.clusterNodes) {
        // ElastiCache Cluster Mode
        this.client = await this.createClusterClient();
      } else {
        // Standalone Redis or ElastiCache with replication
        this.client = await this.createStandaloneClient();
      }

      this.setupEventHandlers();
      this.isConnected = true;
      console.log('✅ Redis client connected successfully');
    } catch (error) {
      console.error('❌ Failed to connect to Redis:', error);
      throw error;
    }
  }

  private async createStandaloneClient(): Promise<Redis> {
    const options: RedisOptions = {
      host: this.config.host,
      port: this.config.port,
      password: this.config.password,
      db: this.config.db || 0,
      retryStrategy: (times: number) => {
        if (times > (this.config.maxRetries || 3)) {
          return null; // Stop retrying
        }
        return Math.min(times * (this.config.retryDelay || 1000), 5000);
      },
      connectTimeout: this.config.connectionTimeout || 5000,
      commandTimeout: this.config.commandTimeout || 3000,
      enableReadyCheck: true,
      maxRetriesPerRequest: 3,
      lazyConnect: false,
    };

    if (this.config.tls) {
      options.tls = {
        rejectUnauthorized: true,
      };
    }

    return new Redis(options);
  }

  private async createClusterClient(): Promise<Cluster> {
    const nodes = this.config.clusterNodes!.map((node) => {
      const [host, port] = node.split(':');
      return { host, port: parseInt(port, 10) };
    });

    const options: ClusterOptions = {
      redisOptions: {
        password: this.config.password,
        tls: this.config.tls
          ? {
              rejectUnauthorized: true,
            }
          : undefined,
        connectTimeout: this.config.connectionTimeout || 5000,
        commandTimeout: this.config.commandTimeout || 3000,
      },
      clusterRetryStrategy: (times: number) => {
        if (times > (this.config.maxRetries || 3)) {
          return null;
        }
        return Math.min(times * (this.config.retryDelay || 1000), 5000);
      },
      enableReadyCheck: true,
      maxRedirections: 16,
      retryDelayOnFailover: 100,
      retryDelayOnClusterDown: 300,
    };

    return new Cluster(nodes, options);
  }

  private setupEventHandlers(): void {
    if (!this.client) return;

    this.client.on('connect', () => {
      console.log('📡 Redis client connecting...');
    });

    this.client.on('ready', () => {
      console.log('✅ Redis client ready');
      this.isConnected = true;
    });

    this.client.on('error', (error) => {
      console.error('❌ Redis client error:', error);
    });

    this.client.on('close', () => {
      console.log('🔌 Redis connection closed');
      this.isConnected = false;
    });

    this.client.on('reconnecting', () => {
      console.log('🔄 Redis client reconnecting...');
    });

    this.client.on('end', () => {
      console.log('🛑 Redis connection ended');
      this.isConnected = false;
    });
  }

  public getClient(): Redis | Cluster {
    if (!this.client || !this.isConnected) {
      throw new Error('Redis client is not connected. Call connect() first.');
    }
    return this.client;
  }

  public async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.quit();
      this.client = null;
      this.isConnected = false;
      console.log('✅ Redis client disconnected');
    }
  }

  public async healthCheck(): Promise<boolean> {
    try {
      if (!this.client || !this.isConnected) {
        return false;
      }
      const result = await this.client.ping();
      return result === 'PONG';
    } catch (error) {
      console.error('Redis health check failed:', error);
      return false;
    }
  }

  public isClientConnected(): boolean {
    return this.isConnected;
  }
}

export default RedisClient;
