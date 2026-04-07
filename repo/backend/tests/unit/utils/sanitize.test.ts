import { describe, it, expect } from 'vitest';
import {
  stripControlChars,
  escapeHtml,
  stripNulBytes,
  sanitizeText,
} from '../../../src/utils/sanitize';

describe('stripControlChars', () => {
  it('removes ASCII control chars but keeps \\t \\n \\r', () => {
    const input = '\x00Hello\x01\x02World\t\n\r';
    const result = stripControlChars(input);
    expect(result).toBe('HelloWorld\t\n\r');
  });

  it('removes DEL character (0x7F)', () => {
    expect(stripControlChars('abc\x7Fdef')).toBe('abcdef');
  });

  it('leaves normal printable characters untouched', () => {
    const s = 'Hello, World! 123 @#$';
    expect(stripControlChars(s)).toBe(s);
  });

  it('handles empty string', () => {
    expect(stripControlChars('')).toBe('');
  });
});

describe('escapeHtml', () => {
  it('escapes < > & " \'', () => {
    const input = '<script>alert("XSS")&\'</script>';
    const result = escapeHtml(input);
    expect(result).toBe('&lt;script&gt;alert(&quot;XSS&quot;)&amp;&#39;&lt;/script&gt;');
  });

  it('handles string with no special chars unchanged', () => {
    const s = 'Hello World 123';
    expect(escapeHtml(s)).toBe(s);
  });

  it('handles empty string', () => {
    expect(escapeHtml('')).toBe('');
  });

  it('escapes ampersand only once (idempotency of single pass)', () => {
    expect(escapeHtml('&amp;')).toBe('&amp;amp;');
  });
});

describe('stripNulBytes', () => {
  it('removes NUL bytes', () => {
    expect(stripNulBytes('hel\0lo')).toBe('hello');
  });

  it('removes multiple NUL bytes', () => {
    expect(stripNulBytes('\0\0\0')).toBe('');
  });

  it('leaves normal text unchanged', () => {
    expect(stripNulBytes('normal text')).toBe('normal text');
  });
});

describe('sanitizeText', () => {
  it('trims whitespace', () => {
    expect(sanitizeText('  hello  ')).toBe('hello');
  });

  it('removes NUL bytes and control chars (leading space remains after control char removal)', () => {
    // '\x00 \x01hello\x7F world\0' → trim() has no effect (leading \x00 is not whitespace)
    // → stripControlChars removes \x00, \x01, \x7F → ' hello world\0'
    // → stripNulBytes removes \0 → ' hello world'
    const input = '\x00 \x01hello\x7F world\0';
    expect(sanitizeText(input)).toBe(' hello world');
  });

  it('preserves \\n and \\t inside the string', () => {
    expect(sanitizeText('line1\nline2')).toBe('line1\nline2');
  });

  it('handles an already clean string', () => {
    expect(sanitizeText('clean input')).toBe('clean input');
  });

  it('handles empty string', () => {
    expect(sanitizeText('')).toBe('');
  });
});
