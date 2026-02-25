import { describe, it, expect, beforeEach } from 'vitest';
import { getAnonymousId, resetAnonymousId } from '../src/utils/anonymous-id';
import { storage } from '../src/utils/storage';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

describe('AnonymousId', () => {
  beforeEach(() => {
    localStorage.clear();
    storage._resetCache();
    resetAnonymousId();
  });

  it('should generate a valid UUID on first call', () => {
    const id = getAnonymousId();
    expect(id).toMatch(UUID_REGEX);
  });

  it('should return the same ID on subsequent calls', () => {
    const id1 = getAnonymousId();
    const id2 = getAnonymousId();
    expect(id1).toBe(id2);
  });

  it('should persist the ID to storage', () => {
    const id = getAnonymousId();
    expect(storage.get('anonymous_id')).toBe(id);
  });

  it('should restore the ID from storage', () => {
    resetAnonymousId();
    storage.set('anonymous_id', 'stored-uuid');
    const id = getAnonymousId();
    expect(id).toBe('stored-uuid');
  });

  it('should generate a new ID after reset', () => {
    const id1 = getAnonymousId();
    resetAnonymousId();
    const id2 = getAnonymousId();
    expect(id1).not.toBe(id2);
  });
});
