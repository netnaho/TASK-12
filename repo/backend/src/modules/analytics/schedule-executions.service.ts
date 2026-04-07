/**
 * Report schedule execution log.
 *
 * Wraps the daily/weekly/monthly scheduled report jobs with persisted
 * execution records that Administrators can audit. Each cron firing produces
 * exactly one ReportScheduleExecution row regardless of how many definitions
 * it processed.
 */
import {
  Prisma,
  ReportFrequency,
  ScheduleExecutionStatus,
} from '@prisma/client';
import { prisma } from '../../config/database';
import { logger } from '../../logging/logger';
import { auditService } from '../audit/audit.service';
import { parsePagination, buildMeta } from '../../shared/utils/pagination.util';
import { ListScheduleExecutionsQuery } from './schedule-executions.schemas';

export interface ExecutionRunResult {
  totalDefinitions: number;
  generatedCount: number;
  failedCount: number;
  errorMessage?: string | null;
}

/**
 * Run the supplied job function and persist a ReportScheduleExecution record
 * tracking start, end, success counts and failure counts.
 *
 * Status mapping:
 *  - all generated successfully → SUCCEEDED
 *  - some succeeded, some failed → PARTIAL
 *  - all failed (and at least one attempted) → FAILED
 *  - the job itself threw → FAILED with errorMessage
 */
async function runWithExecutionLog(
  frequency: ReportFrequency,
  triggeredBy: string,
  job: () => Promise<ExecutionRunResult>,
) {
  const execution = await prisma.reportScheduleExecution.create({
    data: {
      frequency,
      status: ScheduleExecutionStatus.RUNNING,
      triggeredBy,
    },
  });

  logger.info(
    { executionId: execution.id, frequency, triggeredBy },
    'Report schedule execution started',
  );

  try {
    const result = await job();

    let status: ScheduleExecutionStatus;
    if (result.totalDefinitions === 0) {
      status = ScheduleExecutionStatus.SUCCEEDED;
    } else if (result.failedCount === 0) {
      status = ScheduleExecutionStatus.SUCCEEDED;
    } else if (result.generatedCount === 0) {
      status = ScheduleExecutionStatus.FAILED;
    } else {
      status = ScheduleExecutionStatus.PARTIAL;
    }

    const updated = await prisma.reportScheduleExecution.update({
      where: { id: execution.id },
      data: {
        status,
        completedAt: new Date(),
        totalDefinitions: result.totalDefinitions,
        generatedCount: result.generatedCount,
        failedCount: result.failedCount,
        errorMessage: result.errorMessage ?? null,
      },
    });

    await auditService.create({
      action: 'REPORT_SCHEDULE_EXECUTED',
      entityType: 'report_schedule_execution',
      entityId: execution.id,
      metadata: {
        frequency,
        status,
        totalDefinitions: result.totalDefinitions,
        generatedCount: result.generatedCount,
        failedCount: result.failedCount,
      },
    });

    logger.info(
      {
        executionId: execution.id,
        status,
        generated: result.generatedCount,
        failed: result.failedCount,
      },
      'Report schedule execution completed',
    );

    return updated;
  } catch (err: any) {
    const updated = await prisma.reportScheduleExecution.update({
      where: { id: execution.id },
      data: {
        status: ScheduleExecutionStatus.FAILED,
        completedAt: new Date(),
        errorMessage: err?.message ?? String(err),
      },
    });

    await auditService.create({
      action: 'REPORT_SCHEDULE_EXECUTED',
      entityType: 'report_schedule_execution',
      entityId: execution.id,
      metadata: { frequency, status: 'FAILED', errorMessage: err?.message },
    });

    logger.error(
      { executionId: execution.id, err },
      'Report schedule execution failed',
    );

    return updated;
  }
}

async function listExecutions(filters: ListScheduleExecutionsQuery) {
  const { skip, take, page, pageSize } = parsePagination(filters);

  const where: Prisma.ReportScheduleExecutionWhereInput = {};
  if (filters.frequency) where.frequency = filters.frequency as ReportFrequency;
  if (filters.status) where.status = filters.status as ScheduleExecutionStatus;

  const [rows, total] = await Promise.all([
    prisma.reportScheduleExecution.findMany({
      where,
      skip,
      take,
      orderBy: { startedAt: 'desc' },
    }),
    prisma.reportScheduleExecution.count({ where }),
  ]);

  return { data: rows, meta: buildMeta(total, page, pageSize) };
}

export const scheduleExecutionsService = {
  runWithExecutionLog,
  listExecutions,
};
