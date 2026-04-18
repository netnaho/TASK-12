import { describe, it, expect } from 'vitest';
import { cn } from '@/utils/cn';

describe('frontend/utils/cn.ts', () => {
  it('merges multiple class strings', () => {
    expect(cn('a', 'b')).toBe('a b');
  });

  it('drops falsy values', () => {
    expect(cn('a', false, null, undefined, 'b')).toBe('a b');
  });

  it('later tailwind classes win over earlier ones for the same utility', () => {
    // twMerge must resolve conflicting utilities; padding-2 beats padding-1
    expect(cn('p-1', 'p-2')).toBe('p-2');
  });

  it('accepts array + object forms', () => {
    expect(cn(['a', { b: true, c: false }])).toBe('a b');
  });
});
