import { describe, it, expect, beforeEach } from 'vitest';
import { storage } from '../src/utils/storage';

describe('storage', () => {
  beforeEach(() => {
    localStorage.clear();
    storage._resetCache();
  });

  it('should set and get a value', () => {
    storage.set('testKey', 'testValue');
    expect(storage.get('testKey')).toBe('testValue');
  });

  it('should return null for non-existent key', () => {
    expect(storage.get('nonExistent')).toBeNull();
  });

  it('should remove a value', () => {
    storage.set('testKey', 'testValue');
    storage.remove('testKey');
    expect(storage.get('testKey')).toBeNull();
  });

  it('should prefix keys with __fp_', () => {
    storage.set('myKey', 'myValue');
    expect(localStorage.getItem('__fp_myKey')).toBe('myValue');
  });

  it('should overwrite existing values', () => {
    storage.set('key', 'value1');
    storage.set('key', 'value2');
    expect(storage.get('key')).toBe('value2');
  });
});
