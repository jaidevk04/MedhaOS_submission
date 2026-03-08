/**
 * Database Utility Functions
 * 
 * Helper functions for common database operations
 */

import { Prisma } from '@prisma/client';

/**
 * Build pagination parameters
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginationResult {
  skip: number;
  take: number;
}

export function buildPagination(
  params: PaginationParams = {}
): PaginationResult {
  const page = Math.max(1, params.page || 1);
  const limit = Math.min(100, Math.max(1, params.limit || 20));

  return {
    skip: (page - 1) * limit,
    take: limit,
  };
}

/**
 * Build search filter for text fields
 */
export function buildTextSearch(
  field: string,
  query?: string
): Record<string, unknown> | undefined {
  if (!query || query.trim().length === 0) {
    return undefined;
  }

  return {
    [field]: {
      contains: query.trim(),
      mode: 'insensitive',
    },
  };
}

/**
 * Build date range filter
 */
export interface DateRangeParams {
  startDate?: Date | string;
  endDate?: Date | string;
}

export function buildDateRange(
  field: string,
  params: DateRangeParams = {}
): Record<string, unknown> | undefined {
  const filters: Record<string, unknown> = {};

  if (params.startDate) {
    filters.gte = new Date(params.startDate);
  }

  if (params.endDate) {
    filters.lte = new Date(params.endDate);
  }

  if (Object.keys(filters).length === 0) {
    return undefined;
  }

  return { [field]: filters };
}

/**
 * Handle Prisma errors and convert to user-friendly messages
 */
export function handlePrismaError(error: unknown): Error {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002':
        return new Error(
          `Unique constraint violation: ${error.meta?.target || 'unknown field'}`
        );
      case 'P2003':
        return new Error('Foreign key constraint violation');
      case 'P2025':
        return new Error('Record not found');
      case 'P2014':
        return new Error('Invalid relation');
      default:
        return new Error(`Database error: ${error.message}`);
    }
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    return new Error('Invalid data provided');
  }

  if (error instanceof Error) {
    return error;
  }

  return new Error('Unknown database error');
}

/**
 * Transaction wrapper with retry logic
 */
export async function withTransaction<T>(
  callback: (tx: Prisma.TransactionClient) => Promise<T>,
  maxRetries = 3
): Promise<T> {
  const { prisma } = await import('./client');
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await prisma.$transaction(callback, {
        maxWait: 5000,
        timeout: 10000,
      });
    } catch (error) {
      lastError = handlePrismaError(error);
      
      if (attempt < maxRetries) {
        // Exponential backoff
        const delay = Math.pow(2, attempt) * 100;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError || new Error('Transaction failed after retries');
}

/**
 * Batch operation helper
 */
export async function batchOperation<T, R>(
  items: T[],
  operation: (item: T) => Promise<R>,
  batchSize = 100
): Promise<R[]> {
  const results: R[] = [];

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(operation));
    results.push(...batchResults);
  }

  return results;
}

/**
 * Soft delete helper (sets a deletedAt timestamp)
 */
export function buildSoftDeleteFilter(): Record<string, unknown> {
  return {
    deletedAt: null,
  };
}

/**
 * Calculate age from date of birth
 */
export function calculateAge(dateOfBirth: Date): number {
  const today = new Date();
  let age = today.getFullYear() - dateOfBirth.getFullYear();
  const monthDiff = today.getMonth() - dateOfBirth.getMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < dateOfBirth.getDate())
  ) {
    age--;
  }

  return age;
}

/**
 * Format patient name
 */
export function formatPatientName(
  firstName: string,
  lastName: string
): string {
  return `${firstName} ${lastName}`.trim();
}

/**
 * Validate ABHA ID format
 */
export function isValidAbhaId(abhaId: string): boolean {
  // ABHA ID format: 14 digits (e.g., 12345678901234)
  const abhaRegex = /^\d{14}$/;
  return abhaRegex.test(abhaId);
}

/**
 * Validate phone number format (Indian)
 */
export function isValidPhoneNumber(phone: string): boolean {
  // Indian phone number: 10 digits starting with 6-9
  const phoneRegex = /^[6-9]\d{9}$/;
  return phoneRegex.test(phone.replace(/\D/g, ''));
}

/**
 * Sanitize search query
 */
export function sanitizeSearchQuery(query: string): string {
  return query
    .trim()
    .replace(/[^\w\s]/gi, '')
    .substring(0, 100);
}
