import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { SessionManager } from '../src/utils/session';
import { storage } from '../src/utils/storage';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

describe('SessionManager', () => {
  beforeEach(() => {
    localStorage.clear();
    storage._resetCache();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should create a new session on first initialization', () => {
    const manager = new SessionManager();
    const sessionId = manager.getSessionId();
    expect(sessionId).toMatch(UUID_REGEX);
    manager.destroy();
  });

  it('should return the same session ID within timeout', () => {
    const manager = new SessionManager(30 * 60 * 1000);
    const id1 = manager.getSessionId();

    vi.advanceTimersByTime(10 * 60 * 1000); // 10 minutes
    const id2 = manager.getSessionId();

    expect(id1).toBe(id2);
    manager.destroy();
  });

  it('should create a new session after timeout', () => {
    const timeout = 30 * 60 * 1000;
    const manager = new SessionManager(timeout);
    const id1 = manager.getSessionId();

    vi.advanceTimersByTime(timeout + 1000);
    const id2 = manager.getSessionId();

    expect(id1).not.toBe(id2);
    manager.destroy();
  });

  it('should persist session ID to storage', () => {
    const manager = new SessionManager();
    const sessionId = manager.getSessionId();
    expect(storage.get('session_id')).toBe(sessionId);
    manager.destroy();
  });

  it('should restore session from storage if not expired', () => {
    storage.set('session_id', 'existing-session');
    storage.set('session_last_activity', String(Date.now()));

    const manager = new SessionManager();
    expect(manager.getSessionId()).toBe('existing-session');
    manager.destroy();
  });

  it('should create new session if stored session is expired', () => {
    const timeout = 30 * 60 * 1000;
    storage.set('session_id', 'old-session');
    storage.set('session_last_activity', String(Date.now() - timeout - 1000));

    const manager = new SessionManager(timeout);
    expect(manager.getSessionId()).not.toBe('old-session');
    manager.destroy();
  });

  it('should renew session on visibility change after timeout', () => {
    const timeout = 30 * 60 * 1000;
    const manager = new SessionManager(timeout);
    const id1 = manager.getSessionId();

    vi.advanceTimersByTime(timeout + 1000);
    storage.set('session_last_activity', String(Date.now() - timeout - 1000));

    Object.defineProperty(document, 'visibilityState', {
      value: 'visible',
      writable: true,
      configurable: true,
    });
    document.dispatchEvent(new Event('visibilitychange'));

    const id2 = manager.getSessionId();
    expect(id1).not.toBe(id2);
    manager.destroy();
  });

  it('should support custom timeout', () => {
    const customTimeout = 5 * 60 * 1000; // 5 minutes
    const manager = new SessionManager(customTimeout);
    const id1 = manager.getSessionId();

    vi.advanceTimersByTime(customTimeout + 1000);
    const id2 = manager.getSessionId();

    expect(id1).not.toBe(id2);
    manager.destroy();
  });
});
