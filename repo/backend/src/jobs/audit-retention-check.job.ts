/**
 * Audit retention check job.
 *
 * Runs daily and reports on the state of the audit_logs table relative to the
 * 7-year retention policy. This job NEVER deletes audit rows — physical
 * removal is performed only via the documented offline DBA runbook (see
 * `src/modules/audit/audit-retention.policy.ts`).
 *
 * Output: a structured log line that observability tooling can scrape and
 * alert on. Operators are paged when there are entries past the retention
 * floor that have not yet been archived offline.
 */
import { prisma } from '../config/database';
import { logger } from '../logging/logger';
import {
  RETENTION_PERIOD_DAYS,
  RETENTION_WARNING_DAYS,
  getRetentionFloor,
  getRetentionWarningFloor,
} from '../modules/audit/audit-retention.policy';

export async function auditRetentionCheck(): Promise<void> {
  const now = new Date();
  const retentionFloor = getRetentionFloor(now);
  const warningFloor = getRetentionWarningFloor(now);

  const [pastRetention, approachingRetention, total] = await Promise.all([
    prisma.auditLog.count({ where: { createdAt: { lt: retentionFloor } } }),
    prisma.auditLog.count({
      where: { createdAt: { gte: retentionFloor, lt: warningFloor } },
    }),
    prisma.auditLog.count(),
  ]);

  logger.info(
    {
      job: 'audit-retention-check',
      retentionPeriodDays: RETENTION_PERIOD_DAYS,
      warningWindowDays: RETENTION_WARNING_DAYS,
      retentionFloor: retentionFloor.toISOString(),
      counts: {
        total,
        approachingRetention,
        pastRetention,
      },
    },
    'Audit retention policy check completed',
  );

  if (pastRetention > 0) {
    // Entries past the retention floor must be archived offline by a DBA via
    // the documented runbook. Surface the count loudly for ops alerting.
    logger.warn(
      {
        job: 'audit-retention-check',
        pastRetention,
        action: 'manual_archival_required',
      },
      `${pastRetention} audit log entries are past the 7-year retention floor and require offline archival`,
    );
  }
}
