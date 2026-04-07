import { describe, it, expect } from 'vitest';
import { buildWatermark } from '../../../src/utils/watermark';

describe('buildWatermark', () => {
  it('formats as "displayName | ISO timestamp"', () => {
    const at = new Date('2024-03-15T10:30:00.000Z');
    const result = buildWatermark('Alice Smith', at);
    expect(result).toBe('Alice Smith | 2024-03-15T10:30:00.000Z');
  });

  it('uses current time when no date is provided', () => {
    const before = new Date();
    const result = buildWatermark('Bob Jones');
    const after = new Date();

    expect(result).toMatch(/^Bob Jones \| /);
    const tsStr = result.split(' | ')[1];
    const ts = new Date(tsStr);
    expect(ts.getTime()).toBeGreaterThanOrEqual(before.getTime() - 50);
    expect(ts.getTime()).toBeLessThanOrEqual(after.getTime() + 50);
  });

  it('handles display names with pipes and special characters', () => {
    const at = new Date('2024-01-01T00:00:00.000Z');
    const result = buildWatermark('O\'Brien & Co.', at);
    expect(result).toBe("O'Brien & Co. | 2024-01-01T00:00:00.000Z");
  });

  it('contains the viewer identity for traceability', () => {
    const result = buildWatermark('Jane Doe', new Date('2024-06-01T12:00:00.000Z'));
    expect(result).toContain('Jane Doe');
    expect(result).toContain('2024-06-01T12:00:00.000Z');
  });

  it('works with an empty display name', () => {
    const at = new Date('2024-01-01T00:00:00.000Z');
    const result = buildWatermark('', at);
    expect(result).toBe(' | 2024-01-01T00:00:00.000Z');
  });
});
