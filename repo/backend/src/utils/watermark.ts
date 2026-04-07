/**
 * Generates a secure export watermark string.
 * Format: "{displayName} | {ISO 8601 UTC timestamp}"
 *
 * This is embedded in every exported report (CSV header, Excel header/footer,
 * PDF overlay) so that any leaked file can be traced to the exporting user.
 */
export function buildWatermark(displayName: string, exportedAt?: Date): string {
  const ts = (exportedAt ?? new Date()).toISOString();
  return `${displayName} | ${ts}`;
}
