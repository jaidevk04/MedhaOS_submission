/**
 * Base Repository Interface
 * 
 * Defines common CRUD operations for all repositories
 */

export interface BaseRepository<T, CreateInput, UpdateInput> {
  /**
   * Find a record by ID
   */
  findById(id: string): Promise<T | null>;

  /**
   * Find all records with optional filtering and pagination
   */
  findMany(params?: FindManyParams): Promise<T[]>;

  /**
   * Count records with optional filtering
   */
  count(where?: Record<string, unknown>): Promise<number>;

  /**
   * Create a new record
   */
  create(data: CreateInput): Promise<T>;

  /**
   * Update a record by ID
   */
  update(id: string, data: UpdateInput): Promise<T>;

  /**
   * Delete a record by ID
   */
  delete(id: string): Promise<T>;

  /**
   * Check if a record exists by ID
   */
  exists(id: string): Promise<boolean>;
}

export interface FindManyParams {
  where?: Record<string, unknown>;
  skip?: number;
  take?: number;
  orderBy?: Record<string, 'asc' | 'desc'>;
  include?: Record<string, boolean | object>;
}

export interface RepositoryError extends Error {
  code?: string;
  meta?: Record<string, unknown>;
}
