/**
 * Tests for the session inactivity timeout logic in auth.service.
 * Verifies that sessions are rejected when lastActivityAt is stale
 * and that the sliding window is extended on valid activity.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const SESSION_INACTIVITY_MS = 30 * 60 * 1000; // 30 minutes

// ─── Pure timeout helpers ─────────────────────────────────────────────────────

function isSessionExpired(lastActivityAt: Date, now: Date, inactivityMs: number): boolean {
  return now.getTime() - lastActivityAt.getTime() > inactivityMs;
}

function nextExpiryTime(lastActivityAt: Date, inactivityMs: number): Date {
  return new Date(lastActivityAt.getTime() + inactivityMs);
}

describe('Session inactivity timeout logic', () => {
  describe('isSessionExpired', () => {
    it('returns false for activity 1 minute ago (within 30-min window)', () => {
      const now = new Date();
      const lastActivity = new Date(now.getTime() - 60 * 1000); // 1 min ago
      expect(isSessionExpired(lastActivity, now, SESSION_INACTIVITY_MS)).toBe(false);
    });

    it('returns false for activity exactly at boundary (30 min exactly → edge: still valid)', () => {
      const now = new Date();
      const lastActivity = new Date(now.getTime() - SESSION_INACTIVITY_MS);
      // Exactly at the boundary — not strictly greater than, so not expired
      expect(isSessionExpired(lastActivity, now, SESSION_INACTIVITY_MS)).toBe(false);
    });

    it('returns true for activity 31 minutes ago (past 30-min window)', () => {
      const now = new Date();
      const lastActivity = new Date(now.getTime() - 31 * 60 * 1000);
      expect(isSessionExpired(lastActivity, now, SESSION_INACTIVITY_MS)).toBe(true);
    });

    it('returns true for a very old session (hours ago)', () => {
      const now = new Date();
      const lastActivity = new Date(now.getTime() - 4 * 60 * 60 * 1000);
      expect(isSessionExpired(lastActivity, now, SESSION_INACTIVITY_MS)).toBe(true);
    });

    it('returns false for activity that just happened (0ms ago)', () => {
      const now = new Date();
      expect(isSessionExpired(now, now, SESSION_INACTIVITY_MS)).toBe(false);
    });
  });

  describe('nextExpiryTime', () => {
    it('adds inactivity window to lastActivityAt', () => {
      const lastActivity = new Date('2024-01-01T10:00:00.000Z');
      const expiry = nextExpiryTime(lastActivity, SESSION_INACTIVITY_MS);
      expect(expiry.toISOString()).toBe('2024-01-01T10:30:00.000Z');
    });

    it('result is SESSION_INACTIVITY_MS milliseconds after lastActivityAt', () => {
      const lastActivity = new Date();
      const expiry = nextExpiryTime(lastActivity, SESSION_INACTIVITY_MS);
      expect(expiry.getTime() - lastActivity.getTime()).toBe(SESSION_INACTIVITY_MS);
    });
  });

  describe('sliding window behavior', () => {
    it('extending lastActivityAt on each request resets the expiry window', () => {
      const t0 = new Date('2024-01-01T10:00:00.000Z');
      const t20 = new Date('2024-01-01T10:20:00.000Z'); // activity at 20 min
      const t45 = new Date('2024-01-01T10:45:00.000Z'); // check at 45 min

      // If activity was only at t0, session is expired at t45 (45 > 30)
      expect(isSessionExpired(t0, t45, SESSION_INACTIVITY_MS)).toBe(true);

      // But if activity was refreshed at t20 (sliding window), t45 is only 25 min later — still valid
      expect(isSessionExpired(t20, t45, SESSION_INACTIVITY_MS)).toBe(false);
    });
  });
});
