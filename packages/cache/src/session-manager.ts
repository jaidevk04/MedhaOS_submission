/**
 * Session Manager
 * Manages user sessions with Redis backend
 */

import CacheService from './cache-service';
import { SessionData, CacheNamespace } from './types';
import { DEFAULT_TTL } from './config';

export class SessionManager {
  private cacheService: CacheService;

  constructor(cacheService: CacheService) {
    this.cacheService = cacheService;
  }

  /**
   * Create a new session
   */
  public async createSession(
    sessionId: string,
    data: SessionData
  ): Promise<void> {
    const expiresAt = Date.now() + DEFAULT_TTL.SESSION * 1000;
    const sessionData: SessionData = {
      ...data,
      expiresAt,
    };

    await this.cacheService.set(sessionId, sessionData, {
      prefix: CacheNamespace.SESSION,
      ttl: DEFAULT_TTL.SESSION,
    });
  }

  /**
   * Get session data
   */
  public async getSession(sessionId: string): Promise<SessionData | null> {
    return await this.cacheService.get<SessionData>(sessionId, {
      prefix: CacheNamespace.SESSION,
    });
  }

  /**
   * Update session data
   */
  public async updateSession(
    sessionId: string,
    data: Partial<SessionData>
  ): Promise<void> {
    const existing = await this.getSession(sessionId);
    if (!existing) {
      throw new Error('Session not found');
    }

    const updated: SessionData = {
      ...existing,
      ...data,
    };

    await this.cacheService.set(sessionId, updated, {
      prefix: CacheNamespace.SESSION,
      ttl: DEFAULT_TTL.SESSION,
    });
  }

  /**
   * Refresh session TTL
   */
  public async refreshSession(sessionId: string): Promise<boolean> {
    const session = await this.getSession(sessionId);
    if (!session) {
      return false;
    }

    const expiresAt = Date.now() + DEFAULT_TTL.SESSION * 1000;
    session.expiresAt = expiresAt;

    await this.cacheService.set(sessionId, session, {
      prefix: CacheNamespace.SESSION,
      ttl: DEFAULT_TTL.SESSION,
    });

    return true;
  }

  /**
   * Delete session
   */
  public async deleteSession(sessionId: string): Promise<boolean> {
    return await this.cacheService.delete(sessionId, {
      prefix: CacheNamespace.SESSION,
    });
  }

  /**
   * Check if session exists and is valid
   */
  public async isSessionValid(sessionId: string): Promise<boolean> {
    const session = await this.getSession(sessionId);
    if (!session) {
      return false;
    }

    return session.expiresAt > Date.now();
  }

  /**
   * Get all sessions for a user
   */
  public async getUserSessions(userId: string): Promise<SessionData[]> {
    // This is a simplified implementation
    // In production, you might want to maintain a separate index
    const pattern = `*`;
    const client = this.cacheService['redisClient'].getClient();
    const keys = await client.keys(
      `${CacheNamespace.SESSION}:${pattern}`
    );

    const sessions: SessionData[] = [];
    for (const key of keys) {
      const sessionId = key.replace(`${CacheNamespace.SESSION}:`, '');
      const session = await this.getSession(sessionId);
      if (session && session.userId === userId) {
        sessions.push(session);
      }
    }

    return sessions;
  }

  /**
   * Delete all sessions for a user
   */
  public async deleteUserSessions(userId: string): Promise<number> {
    const sessions = await this.getUserSessions(userId);
    let deleted = 0;

    for (const session of sessions) {
      // Extract session ID from the session data
      // This assumes you store the session ID in metadata
      const sessionId = session.metadata?.sessionId;
      if (sessionId) {
        const success = await this.deleteSession(sessionId);
        if (success) deleted++;
      }
    }

    return deleted;
  }
}

export default SessionManager;
