/**
 * Scheduled report generation jobs.
 *
 * Each frequency (DAILY/WEEKLY/MONTHLY) wraps the underlying generator with
 * `scheduleExecutionsService.runWithExecutionLog()` so every cron firing
 * produces a persistent ReportScheduleExecution record visible to admins.
 */
import { prisma } from '../config/database';
import { logger } from '../logging/logger';
import { ReportFrequency } from '@prisma/client';
import {
  scheduleExecutionsService,
  ExecutionRunResult,
} from '../modules/analytics/schedule-executions.service';

/**
 * Helper: generate reports for all active ReportDefinitions matching the given frequency.
 * Returns counts so the surrounding execution log can record them.
 */
async function generateReportsForFrequency(
  frequency: ReportFrequency,
  periodStart: Date,
  periodEnd: Date,
): Promise<ExecutionRunResult> {
  const startTime = Date.now();
  logger.info(
    { frequency, periodStart, periodEnd },
    `Report generation started for ${frequency} reports`,
  );

  const definitions = await prisma.reportDefinition.findMany({
    where: { frequency, isActive: true },
  });

  let generated = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const definition of definitions) {
    try {
      // Query MetricValues for the period
      const metricValues = await prisma.metricValue.findMany({
        where: {
          periodStart: { gte: periodStart },
          periodEnd: { lte: periodEnd },
        },
        include: {
          metricDefinitionVersion: { include: { metricDefinition: true } },
          property: true,
        },
      });

      // Build report data
      const dataJson = metricValues.map((mv: any) => ({
        propertyId: mv.propertyId,
        propertyName: mv.property.name,
        metricType: mv.metricDefinitionVersion.metricDefinition.metricType,
        metricName: mv.metricDefinitionVersion.metricDefinition.name,
        versionId: mv.metricDefinitionVersionId,
        versionNumber: mv.metricDefinitionVersion.versionNumber,
        value: mv.value.toString(),
        calculatedAt: mv.calculatedAt.toISOString(),
        periodStart: mv.periodStart.toISOString(),
        periodEnd: mv.periodEnd.toISOString(),
      }));

      // Create Report record
      const report = await prisma.report.create({
        data: {
          definitionId: definition.id,
          generatedAt: new Date(),
          periodStart,
          periodEnd,
          dataJson,
          status: 'PUBLISHED',
          createdBy: definition.createdBy,
        },
      });

      // Lock metric versions used (insert snapshot + lock the version)
      const versionIds = [
        ...new Set(metricValues.map((mv: any) => mv.metricDefinitionVersionId)),
      ];

      for (const versionId of versionIds) {
        await prisma.reportMetricSnapshot.create({
          data: {
            reportId: report.id,
            metricDefinitionVersionId: versionId,
          },
        });

        await prisma.metricDefinitionVersion.update({
          where: { id: versionId },
          data: {
            isLocked: true,
            lockedAt: new Date(),
            lockedByReportId: report.id,
          },
        });
      }

      generated++;
    } catch (error: any) {
      failed++;
      errors.push(`def=${definition.id}: ${error?.message ?? error}`);
      logger.error(
        { definitionId: definition.id, error },
        `Failed to generate ${frequency} report for definition`,
      );
    }
  }

  const durationMs = Date.now() - startTime;
  logger.info(
    { frequency, generated, failed, total: definitions.length, durationMs },
    `Report generation completed for ${frequency} reports`,
  );

  return {
    totalDefinitions: definitions.length,
    generatedCount: generated,
    failedCount: failed,
    errorMessage: errors.length > 0 ? errors.join('; ') : null,
  };
}

/**
 * Daily report generation. Runs at 06:00 daily.
 * Generates reports covering the previous 24 hours (yesterday 00:00 → today 00:00).
 */
export async function dailyReportGeneration(): Promise<void> {
  await scheduleExecutionsService.runWithExecutionLog(
    ReportFrequency.DAILY,
    'cron:0 6 * * *',
    () => {
      const periodEnd = new Date();
      periodEnd.setHours(0, 0, 0, 0);
      const periodStart = new Date(periodEnd);
      periodStart.setDate(periodStart.getDate() - 1);
      return generateReportsForFrequency(ReportFrequency.DAILY, periodStart, periodEnd);
    },
  );
}

/**
 * Weekly report generation. Runs Monday at 07:00.
 * Generates reports for the previous 7 days.
 */
export async function weeklyReportGeneration(): Promise<void> {
  await scheduleExecutionsService.runWithExecutionLog(
    ReportFrequency.WEEKLY,
    'cron:0 7 * * 1',
    () => {
      const periodEnd = new Date();
      periodEnd.setHours(0, 0, 0, 0);
      const periodStart = new Date(periodEnd);
      periodStart.setDate(periodStart.getDate() - 7);
      return generateReportsForFrequency(ReportFrequency.WEEKLY, periodStart, periodEnd);
    },
  );
}

/**
 * Monthly report generation. Runs 1st of the month at 08:00.
 * Generates reports for the previous calendar month.
 */
export async function monthlyReportGeneration(): Promise<void> {
  await scheduleExecutionsService.runWithExecutionLog(
    ReportFrequency.MONTHLY,
    'cron:0 8 1 * *',
    () => {
      const now = new Date();
      const periodEnd = new Date(now.getFullYear(), now.getMonth(), 1);
      const periodStart = new Date(periodEnd);
      periodStart.setMonth(periodStart.getMonth() - 1);
      return generateReportsForFrequency(ReportFrequency.MONTHLY, periodStart, periodEnd);
    },
  );
}

/**
 * Exposed for tests / on-demand triggers.
 */
export const reportGenerationInternal = {
  generateReportsForFrequency,
};
