/**
 * Lightweight input sanitisation helpers.
 *
 * Zod already handles structural validation. These helpers cover the
 * defense-in-depth cases: stripping control characters, NUL bytes,
 * and ensuring HTML entities are escaped in text that may end up in
 * notification templates or export files.
 */

const CONTROL_CHARS_RE = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g;

/** Strip ASCII control characters (keep \t \n \r). */
export function stripControlChars(input: string): string {
  return input.replace(CONTROL_CHARS_RE, '');
}

/** Escape HTML special characters to prevent injection in rendered templates. */
export function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Strip NUL bytes that can cause problems in MySQL TEXT columns. */
export function stripNulBytes(input: string): string {
  return input.replace(/\0/g, '');
}

/**
 * Full sanitise pass for free-text user input that will be stored.
 * Does NOT alter the semantic content — only strips dangerous characters.
 */
export function sanitizeText(input: string): string {
  return stripNulBytes(stripControlChars(input.trim()));
}
