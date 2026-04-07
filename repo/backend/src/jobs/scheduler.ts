import cron from 'node-cron';
import { logger } from '../logging/logger';
import { nightlyMetricRecalc } from './nightly-metric-recalc.job';
import { dailyReportGeneration, weeklyReportGeneration, monthlyReportGeneration } from './report-generation.job';
import { sessionCleanup } from './session-cleanup.job';
import { messageRetry } from './message-retry.job';
import { auditRetentionCheck } from './audit-retention-check.job';

const tasks: cron.ScheduledTask[] = [];

/**
 * Wraps a job function in try/catch with error logging.
 */
function wrapJob(name: string, fn: () => Promise<void>): () => void {
  return () => {
    fn().catch((error) => {
      logger.error({ job: name, error }, `Scheduled job "${name}" failed`);
    });
  };
}

/**
 * Register and start all scheduled cron jobs.
 */
export function startScheduler(): void {
  logger.info('Starting job scheduler...');

  // Nightly metric recalculation - 2 AM daily
  tasks.push(
    cron.schedule('0 2 * * *', wrapJob('nightly-metric-recalc', nightlyMetricRecalc)),
  );
  logger.info('Registered job: nightly-metric-recalc (0 2 * * *)');

  // Daily report generation - 6 AM daily
  tasks.push(
    cron.schedule('0 6 * * *', wrapJob('daily-report-generation', dailyReportGeneration)),
  );
  logger.info('Registered job: daily-report-generation (0 6 * * *)');

  // Weekly report generation - Monday 7 AM
  tasks.push(
    cron.schedule('0 7 * * 1', wrapJob('weekly-report-generation', weeklyReportGeneration)),
  );
  logger.info('Registered job: weekly-report-generation (0 7 * * 1)');

  // Monthly report generation - 1st of month 8 AM
  tasks.push(
    cron.schedule('0 8 1 * *', wrapJob('monthly-report-generation', monthlyReportGeneration)),
  );
  logger.info('Registered job: monthly-report-generation (0 8 1 * *)');

  // Session cleanup - every 15 minutes
  tasks.push(
    cron.schedule('*/15 * * * *', wrapJob('session-cleanup', sessionCleanup)),
  );
  logger.info('Registered job: session-cleanup (*/15 * * * *)');

  // Message retry - every 5 minutes
  tasks.push(
    cron.schedule('*/5 * * * *', wrapJob('message-retry', messageRetry)),
  );
  logger.info('Registered job: message-retry (*/5 * * * *)');

  // Audit retention check - 3 AM daily (reports only, never deletes)
  tasks.push(
    cron.schedule('0 3 * * *', wrapJob('audit-retention-check', auditRetentionCheck)),
  );
  logger.info('Registered job: audit-retention-check (0 3 * * *)');

  logger.info({ jobCount: tasks.length }, 'Job scheduler started');
}

/**
 * Stop all scheduled cron jobs.
 */
export function stopScheduler(): void {
  logger.info({ jobCount: tasks.length }, 'Stopping job scheduler...');

  for (const task of tasks) {
    task.stop();
  }

  tasks.length = 0;
  logger.info('Job scheduler stopped');
}
