import Database from 'better-sqlite3';
import * as path from 'path';
import { config } from '../config';
import { OfflineEntity } from '../types';
import { logger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

/**
 * Service for managing offline data storage using SQLite
 */
export class OfflineStorageService {
  private db: Database.Database;

  constructor() {
    this.db = this.initializeDatabase();
    this.createTables();
  }

  /**
   * Initialize SQLite database
   */
  private initializeDatabase(): Database.Database {
    try {
      const dbPath = config.storage.localDbPath;
      logger.info(`Initializing offline database at ${dbPath}`);

      // Ensure directory exists
      const fs = require('fs');
      const dir = path.dirname(dbPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      const db = new Database(dbPath);
      db.pragma('journal_mode = WAL'); // Write-Ahead Logging for better concurrency
      db.pragma('synchronous = NORMAL'); // Balance between safety and performance

      logger.info('Offline database initialized');
      return db;
    } catch (error) {
      logger.error('Failed to initialize offline database:', error);
      throw error;
    }
  }

  /**
   * Create database tables
   */
  private createTables(): void {
    try {
      // Offline entities table
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS offline_entities (
          id TEXT PRIMARY KEY,
          entity_type TEXT NOT NULL,
          data TEXT NOT NULL,
          version INTEGER NOT NULL DEFAULT 1,
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL,
          sync_status TEXT NOT NULL DEFAULT 'pending',
          deleted INTEGER NOT NULL DEFAULT 0,
          UNIQUE(entity_type, id)
        );

        CREATE INDEX IF NOT EXISTS idx_entity_type ON offline_entities(entity_type);
        CREATE INDEX IF NOT EXISTS idx_sync_status ON offline_entities(sync_status);
        CREATE INDEX IF NOT EXISTS idx_updated_at ON offline_entities(updated_at);
      `);

      // Sync operations table
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS sync_operations (
          operation_id TEXT PRIMARY KEY,
          device_id TEXT NOT NULL,
          operation_type TEXT NOT NULL,
          entity_type TEXT NOT NULL,
          entity_id TEXT NOT NULL,
          data TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'pending',
          retry_count INTEGER NOT NULL DEFAULT 0,
          created_at INTEGER NOT NULL,
          completed_at INTEGER,
          error TEXT
        );

        CREATE INDEX IF NOT EXISTS idx_sync_status ON sync_operations(status);
        CREATE INDEX IF NOT EXISTS idx_created_at ON sync_operations(created_at);
      `);

      // Inference cache table
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS inference_cache (
          request_id TEXT PRIMARY KEY,
          model_type TEXT NOT NULL,
          input_hash TEXT NOT NULL,
          output TEXT NOT NULL,
          confidence REAL NOT NULL,
          created_at INTEGER NOT NULL,
          UNIQUE(model_type, input_hash)
        );

        CREATE INDEX IF NOT EXISTS idx_model_type ON inference_cache(model_type);
        CREATE INDEX IF NOT EXISTS idx_input_hash ON inference_cache(input_hash);
      `);

      logger.info('Database tables created');
    } catch (error) {
      logger.error('Failed to create database tables:', error);
      throw error;
    }
  }

  /**
   * Save entity to offline storage
   */
  saveEntity(entityType: string, entityId: string, data: any): OfflineEntity {
    try {
      const now = Date.now();
      const entity: OfflineEntity = {
        id: entityId,
        entityType,
        data,
        version: 1,
        createdAt: new Date(now),
        updatedAt: new Date(now),
        syncStatus: 'pending',
        deleted: false,
      };

      const stmt = this.db.prepare(`
        INSERT OR REPLACE INTO offline_entities 
        (id, entity_type, data, version, created_at, updated_at, sync_status, deleted)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run(
        entity.id,
        entity.entityType,
        JSON.stringify(entity.data),
        entity.version,
        now,
        now,
        entity.syncStatus,
        entity.deleted ? 1 : 0
      );

      logger.info(`Entity saved: ${entityType}/${entityId}`);
      return entity;
    } catch (error) {
      logger.error('Failed to save entity:', error);
      throw error;
    }
  }

  /**
   * Get entity from offline storage
   */
  getEntity(entityType: string, entityId: string): OfflineEntity | null {
    try {
      const stmt = this.db.prepare(`
        SELECT * FROM offline_entities 
        WHERE entity_type = ? AND id = ? AND deleted = 0
      `);

      const row = stmt.get(entityType, entityId) as any;

      if (!row) {
        return null;
      }

      return this.rowToEntity(row);
    } catch (error) {
      logger.error('Failed to get entity:', error);
      throw error;
    }
  }

  /**
   * Get all entities of a specific type
   */
  getEntitiesByType(entityType: string, limit: number = 100): OfflineEntity[] {
    try {
      const stmt = this.db.prepare(`
        SELECT * FROM offline_entities 
        WHERE entity_type = ? AND deleted = 0
        ORDER BY updated_at DESC
        LIMIT ?
      `);

      const rows = stmt.all(entityType, limit) as any[];
      return rows.map((row) => this.rowToEntity(row));
    } catch (error) {
      logger.error('Failed to get entities by type:', error);
      throw error;
    }
  }

  /**
   * Get entities pending sync
   */
  getPendingSyncEntities(limit: number = 100): OfflineEntity[] {
    try {
      const stmt = this.db.prepare(`
        SELECT * FROM offline_entities 
        WHERE sync_status = 'pending'
        ORDER BY updated_at ASC
        LIMIT ?
      `);

      const rows = stmt.all(limit) as any[];
      return rows.map((row) => this.rowToEntity(row));
    } catch (error) {
      logger.error('Failed to get pending sync entities:', error);
      throw error;
    }
  }

  /**
   * Update entity sync status
   */
  updateSyncStatus(entityId: string, status: 'pending' | 'synced' | 'conflict'): void {
    try {
      const stmt = this.db.prepare(`
        UPDATE offline_entities 
        SET sync_status = ?, updated_at = ?
        WHERE id = ?
      `);

      stmt.run(status, Date.now(), entityId);
      logger.info(`Entity ${entityId} sync status updated to ${status}`);
    } catch (error) {
      logger.error('Failed to update sync status:', error);
      throw error;
    }
  }

  /**
   * Delete entity (soft delete)
   */
  deleteEntity(entityId: string): void {
    try {
      const stmt = this.db.prepare(`
        UPDATE offline_entities 
        SET deleted = 1, updated_at = ?, sync_status = 'pending'
        WHERE id = ?
      `);

      stmt.run(Date.now(), entityId);
      logger.info(`Entity ${entityId} marked as deleted`);
    } catch (error) {
      logger.error('Failed to delete entity:', error);
      throw error;
    }
  }

  /**
   * Cache inference result
   */
  cacheInference(modelType: string, inputHash: string, output: any, confidence: number): void {
    try {
      const stmt = this.db.prepare(`
        INSERT OR REPLACE INTO inference_cache 
        (request_id, model_type, input_hash, output, confidence, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `);

      stmt.run(uuidv4(), modelType, inputHash, JSON.stringify(output), confidence, Date.now());
      logger.info(`Inference result cached for ${modelType}`);
    } catch (error) {
      logger.error('Failed to cache inference:', error);
      throw error;
    }
  }

  /**
   * Get cached inference result
   */
  getCachedInference(modelType: string, inputHash: string): any | null {
    try {
      const stmt = this.db.prepare(`
        SELECT output, confidence FROM inference_cache 
        WHERE model_type = ? AND input_hash = ?
      `);

      const row = stmt.get(modelType, inputHash) as any;

      if (!row) {
        return null;
      }

      return {
        output: JSON.parse(row.output),
        confidence: row.confidence,
      };
    } catch (error) {
      logger.error('Failed to get cached inference:', error);
      return null;
    }
  }

  /**
   * Get storage statistics
   */
  getStorageStats(): any {
    try {
      const entityCount = this.db.prepare('SELECT COUNT(*) as count FROM offline_entities WHERE deleted = 0').get() as any;
      const pendingSync = this.db.prepare('SELECT COUNT(*) as count FROM offline_entities WHERE sync_status = "pending"').get() as any;
      const cacheSize = this.db.prepare('SELECT COUNT(*) as count FROM inference_cache').get() as any;

      return {
        totalEntities: entityCount.count,
        pendingSyncEntities: pendingSync.count,
        cachedInferences: cacheSize.count,
        databaseSizeMB: this.getDatabaseSize(),
      };
    } catch (error) {
      logger.error('Failed to get storage stats:', error);
      throw error;
    }
  }

  /**
   * Clear old cache entries
   */
  clearOldCache(maxAgeMs: number = 7 * 24 * 60 * 60 * 1000): void {
    try {
      const cutoffTime = Date.now() - maxAgeMs;
      const stmt = this.db.prepare('DELETE FROM inference_cache WHERE created_at < ?');
      const result = stmt.run(cutoffTime);
      logger.info(`Cleared ${result.changes} old cache entries`);
    } catch (error) {
      logger.error('Failed to clear old cache:', error);
      throw error;
    }
  }

  /**
   * Convert database row to OfflineEntity
   */
  private rowToEntity(row: any): OfflineEntity {
    return {
      id: row.id,
      entityType: row.entity_type,
      data: JSON.parse(row.data),
      version: row.version,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      syncStatus: row.sync_status,
      deleted: row.deleted === 1,
    };
  }

  /**
   * Get database file size in MB
   */
  private getDatabaseSize(): number {
    try {
      const fs = require('fs');
      const stats = fs.statSync(config.storage.localDbPath);
      return (stats.size / 1024 / 1024).toFixed(2);
    } catch (error) {
      return 0;
    }
  }

  /**
   * Close database connection
   */
  close(): void {
    this.db.close();
    logger.info('Offline database closed');
  }
}
