import { describe, it, expect } from 'vitest';
import { spacesQuerySchema } from '../spaces';
import { decodeCursor, encodeCursor } from '../../../spaces/cursor';

describe('spacesQuerySchema', () => {
  it('parses defaults with no params', () => {
    const result = spacesQuerySchema.parse({});
    expect(result.limit).toBe(20);
    expect(result.sort).toBe('featured');
    expect(result.radius).toBe(5000);
  });

  it('coerces string numbers', () => {
    const result = spacesQuerySchema.parse({ limit: '10', price_min: '5000' });
    expect(result.limit).toBe(10);
    expect(result.price_min).toBe(5000);
  });

  it('rejects limit > 100', () => {
    expect(() => spacesQuerySchema.parse({ limit: '200' })).toThrow();
  });

  it('rejects invalid sort value', () => {
    expect(() => spacesQuerySchema.parse({ sort: 'random' })).toThrow();
  });

  it('accepts all valid sort values', () => {
    for (const sort of ['distance', 'price_asc', 'price_desc', 'newest', 'featured']) {
      expect(() => spacesQuerySchema.parse({ sort })).not.toThrow();
    }
  });

  it('accepts valid price_unit', () => {
    const result = spacesQuerySchema.parse({ price_unit: 'month' });
    expect(result.price_unit).toBe('month');
  });

  it('rejects invalid price_unit', () => {
    expect(() => spacesQuerySchema.parse({ price_unit: 'year' })).toThrow();
  });
});

describe('cursor encode/decode', () => {
  const at = '2025-01-15T10:30:00.000Z';
  const id = '550e8400-e29b-41d4-a716-446655440000';

  it('round-trips correctly', () => {
    const encoded = encodeCursor(at, id);
    const decoded = decodeCursor(encoded);
    expect(decoded?.at).toBe(at);
    expect(decoded?.id).toBe(id);
  });

  it('returns null for garbage input', () => {
    expect(decodeCursor('not!!!valid')).toBeNull();
  });

  it('returns null for valid base64 but wrong shape', () => {
    const bad = Buffer.from(JSON.stringify({ foo: 'bar' })).toString('base64url');
    expect(decodeCursor(bad)).toBeNull();
  });
});
