/**
 * Audit log retention policy.
 *
 * COMPLIANCE REQUIREMENT
 * ----------------------
 * LeaseOps audit logs are subject to a SEVEN YEAR retention requirement
 * (industry standard for assessment / property compliance evidence).
 *
 * IMMUTABILITY GUARANTEE
 * ----------------------
 * The `audit_logs` table is protected by database triggers (see
 * `prisma/migrations/20240101000000_init/migration.sql`) that REJECT any
 * UPDATE or DELETE statement at the SQL level. This module DOES NOT and
 * MUST NOT bypass that guarantee — retention is enforced by REPORTING and
 * ARCHIVAL, never by deletion.
 *
 * POLICY MECHANISM
 * ----------------
 * 1. `RETENTION_PERIOD_DAYS` is the canonical retention window. It is read
 *    by the scheduled `audit-retention-check` job (see
 *    `src/jobs/audit-retention-check.job.ts`) which:
 *      a. Counts the audit log entries that have aged past the retention
 *         floor (entries older than retention - 30 days are considered
 *         "approaching expiry" and surfaced for archival).
 *      b. Counts entries already past the retention floor (which trigger
 *         operational alerts so an operator can perform an OFFLINE archival
 *         to cold storage in compliance with the immutability guarantee).
 *      c. Emits a structured metric / log line that can be scraped by
 *         observability tooling to prove the policy is being checked.
 * 2. Entries are NEVER deleted by application code. The append-only
 *    immutability triggers in MySQL guarantee a tamper-evident trail.
 * 3. To physically remove entries past 7 years, an operator must use a
 *    documented offline runbook (DBA-only) that:
 *      a. Suspends the immutability triggers under audit supervision
 *      b. Exports the to-be-removed rows to long-term cold storage
 *      c. Removes only the exported rows
 *      d. Re-enables the triggers
 *      e. Records the runbook execution as a fresh audit_log row
 *    The application has no API for this operation by design.
 */

/** Seven years expressed in days (365 * 7 = 2555). */
export const RETENTION_PERIOD_DAYS = 2555;

/** Number of days before retention expiry at which we begin warning. */
export const RETENTION_WARNING_DAYS = 30;

/** Convert the retention period to milliseconds. */
export const RETENTION_PERIOD_MS = RETENTION_PERIOD_DAYS * 24 * 60 * 60 * 1000;

/**
 * Compute the cutoff Date for the retention floor relative to `now`.
 * Entries with `createdAt < cutoff` are past the retention window.
 */
export function getRetentionFloor(now: Date = new Date()): Date {
  return new Date(now.getTime() - RETENTION_PERIOD_MS);
}

/**
 * Compute the cutoff Date for the warning band (entries within N days of
 * the retention floor — operators should plan archival for these).
 */
export function getRetentionWarningFloor(now: Date = new Date()): Date {
  return new Date(
    now.getTime() - (RETENTION_PERIOD_DAYS - RETENTION_WARNING_DAYS) * 24 * 60 * 60 * 1000,
  );
}
