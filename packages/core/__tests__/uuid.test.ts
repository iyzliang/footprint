import { describe, it, expect } from 'vitest';
import { generateUUID } from '../src/utils/uuid';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

describe('generateUUID', () => {
  it('should return a valid UUID v4 format', () => {
    const uuid = generateUUID();
    expect(uuid).toMatch(UUID_REGEX);
  });

  it('should generate unique IDs', () => {
    const ids = new Set(Array.from({ length: 1000 }, () => generateUUID()));
    expect(ids.size).toBe(1000);
  });

  it('should have version 4 indicator', () => {
    const uuid = generateUUID();
    expect(uuid[14]).toBe('4');
  });

  it('should have correct variant bits', () => {
    const uuid = generateUUID();
    const variantChar = uuid[19];
    expect(['8', '9', 'a', 'b']).toContain(variantChar);
  });
});
