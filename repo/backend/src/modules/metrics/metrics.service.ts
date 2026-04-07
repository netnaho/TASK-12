import { MetricType, Prisma } from '@prisma/client';
import { prisma } from '../../config/database';
import { logger } from '../../logging/logger';
import { NotFoundError, BadRequestError } from '../../shared/errors';
import { parsePagination, buildMeta } from '../../shared/utils/pagination.util';
import { auditService } from '../audit/audit.service';
import { metricEngine } from './engine/metric-engine';
import {
  CreateMetricDefinitionBody,
  CreateMetricVersionBody,
  ListMetricsQuery,
} from './metrics.schemas';

// ─── Definitions ─────────────────────────────────────────────────────

async function listDefinitions() {
  const definitions = await prisma.metricDefinition.findMany({
    include: {
      versions: {
        orderBy: { versionNumber: 'desc' },
        take: 1,
      },
    },
    orderBy: { name: 'asc' },
  });

  return definitions;
}

async function getDefinition(id: string) {
  const definition = await prisma.metricDefinition.findUnique({
    where: { id },
    include: {
      versions: { orderBy: { versionNumber: 'desc' } },
    },
  });

  if (!definition) {
    throw new NotFoundError('Metric definition not found');
  }

  return definition;
}

async function createDefinition(data: CreateMetricDefinitionBody, actorId: string) {
  const definition = await prisma.metricDefinition.create({
    data: {
      metricType: data.metricType as MetricType,
      name: data.name,
      description: data.description,
    },
  });

  logger.info({ definitionId: definition.id }, 'Metric definition created');
  await auditService.create({
    action: 'METRIC_DEF_CREATED',
    actorId,
    entityType: 'metricDefinition',
    entityId: definition.id,
    afterJson: { metricType: data.metricType, name: data.name },
  });
  return definition;
}

// ─── Versions ────────────────────────────────────────────────────────

async function createVersion(data: CreateMetricVersionBody, actorId: string) {
  const definition = await prisma.metricDefinition.findUnique({
    where: { id: data.metricDefinitionId },
    include: {
      versions: { orderBy: { versionNumber: 'desc' }, take: 1 },
    },
  });

  if (!definition) {
    throw new NotFoundError('Metric definition not found');
  }

  const latestVersion = definition.versions[0];
  const nextVersionNumber = latestVersion ? latestVersion.versionNumber + 1 : 1;

  // Immutability guard: a locked version (one already referenced by a
  // PUBLISHED report) is part of the audit-grade history of that report and
  // MUST NOT be mutated — including its effectiveTo column. Refuse to create
  // a successor that would close out a locked predecessor; the operator must
  // create the new version with effectiveFrom AFTER the locked predecessor
  // already has an effectiveTo, or the locked predecessor must remain the
  // current open version.
  if (latestVersion && latestVersion.isLocked && latestVersion.effectiveTo === null) {
    throw new BadRequestError(
      `Cannot create a new version: predecessor version ${latestVersion.versionNumber} is locked ` +
        `(referenced by a published report) and its effectiveTo cannot be modified. ` +
        `Locked versions are immutable for audit traceability.`,
    );
  }

  const effectiveFrom = new Date(data.effectiveFrom);

  const version = await prisma.$transaction(async (tx) => {
    // Set effectiveTo on the previous version (only if not locked — guarded above)
    if (latestVersion && !latestVersion.isLocked) {
      await tx.metricDefinitionVersion.update({
        where: { id: latestVersion.id },
        data: { effectiveTo: effectiveFrom },
      });
    }

    // Create the new version
    return tx.metricDefinitionVersion.create({
      data: {
        metricDefinitionId: data.metricDefinitionId,
        versionNumber: nextVersionNumber,
        formulaJson: data.formulaJson as Prisma.InputJsonValue,
        effectiveFrom,
        createdBy: actorId,
      },
    });
  });

  logger.info(
    { versionId: version.id, definitionId: data.metricDefinitionId, versionNumber: nextVersionNumber },
    'Metric definition version created',
  );

  await auditService.create({
    action: 'METRIC_DEF_VERSION_CREATED',
    actorId,
    entityType: 'metricDefinitionVersion',
    entityId: version.id,
    afterJson: { definitionId: data.metricDefinitionId, versionNumber: nextVersionNumber, effectiveFrom: data.effectiveFrom },
  });

  return version;
}

// ─── Metric Values ───────────────────────────────────────────────────

async function getMetricValues(query: ListMetricsQuery) {
  const { skip, take, page, pageSize } = parsePagination(query);

  const where: Prisma.MetricValueWhereInput = {};

  if (query.propertyId) {
    where.propertyId = query.propertyId;
  }

  if (query.metricType) {
    where.metricDefinitionVersion = {
      metricDefinition: {
        metricType: query.metricType as MetricType,
      },
    };
  }

  if (query.periodStart || query.periodEnd) {
    where.periodEnd = {};
    if (query.periodStart) {
      where.periodEnd.gte = new Date(query.periodStart);
    }
    if (query.periodEnd) {
      where.periodEnd.lte = new Date(query.periodEnd);
    }
  }

  const [values, total] = await Promise.all([
    prisma.metricValue.findMany({
      where,
      skip,
      take,
      orderBy: { calculatedAt: 'desc' },
      include: {
        property: true,
        metricDefinitionVersion: {
          include: { metricDefinition: true },
        },
      },
    }),
    prisma.metricValue.count({ where }),
  ]);

  return { data: values, meta: buildMeta(total, page, pageSize) };
}

// ─── Recalculation ───────────────────────────────────────────────────

async function triggerRecalculation(propertyIds: string[] | undefined, actorId: string) {
  const job = await prisma.metricCalcJob.create({
    data: {
      triggeredBy: 'manual',
      requestedBy: actorId,
      status: 'PENDING',
    },
  });

  logger.info({ jobId: job.id }, 'Metric recalculation job created');
  await auditService.create({
    action: 'METRIC_CALC_TRIGGERED',
    actorId,
    entityType: 'metricCalcJob',
    entityId: job.id,
    afterJson: { propertyIds: propertyIds ?? 'all' },
  });

  // Run calculation asynchronously
  runRecalculation(job.id, propertyIds).catch((err) => {
    logger.error({ jobId: job.id, error: err.message }, 'Metric recalculation failed');
  });

  return job;
}

async function runRecalculation(jobId: string, propertyIds?: string[]) {
  await prisma.metricCalcJob.update({
    where: { id: jobId },
    data: { status: 'RUNNING', startedAt: new Date() },
  });

  try {
    const whereProperty: Prisma.PropertyWhereInput = { isActive: true };
    if (propertyIds && propertyIds.length > 0) {
      whereProperty.id = { in: propertyIds };
    }

    const properties = await prisma.property.findMany({
      where: whereProperty,
      include: { listings: true },
    });

    const now = new Date();
    const periodStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
    const periodEnd = now;

    // Get latest versions for each metric type
    const definitions = await prisma.metricDefinition.findMany({
      include: {
        versions: {
          where: { effectiveTo: null },
          orderBy: { versionNumber: 'desc' },
          take: 1,
        },
      },
    });

    const versionMap = new Map<MetricType, string>();
    for (const def of definitions) {
      if (def.versions.length > 0) {
        versionMap.set(def.metricType, def.versions[0].id);
      }
    }

    const metricValues: Prisma.MetricValueCreateManyInput[] = [];

    for (const property of properties) {
      const input = {
        propertyId: property.id,
        listings: property.listings,
        periodStart,
        periodEnd,
        totalUnits: property.totalUnits,
      };

      const results = metricEngine.calculateAll(input as any);

      for (const [metricType, result] of results.entries()) {
        const versionId = versionMap.get(metricType);
        if (!versionId) continue;

        metricValues.push({
          propertyId: property.id,
          metricDefinitionVersionId: versionId,
          value: result.value,
          calculatedAt: now,
          periodStart,
          periodEnd,
        });
      }
    }

    if (metricValues.length > 0) {
      await prisma.metricValue.createMany({ data: metricValues });
    }

    await prisma.metricCalcJob.update({
      where: { id: jobId },
      data: { status: 'COMPLETED', completedAt: new Date() },
    });

    logger.info(
      { jobId, propertiesProcessed: properties.length, valuesCreated: metricValues.length },
      'Metric recalculation completed',
    );
  } catch (error: any) {
    await prisma.metricCalcJob.update({
      where: { id: jobId },
      data: { status: 'FAILED', completedAt: new Date(), errorLog: error.message },
    });
    throw error;
  }
}

async function recalculateAll() {
  const job = await prisma.metricCalcJob.create({
    data: {
      triggeredBy: 'cron',
      status: 'PENDING',
    },
  });

  logger.info({ jobId: job.id }, 'Scheduled metric recalculation started');
  await runRecalculation(job.id);
  return job;
}

// ─── Jobs ────────────────────────────────────────────────────────────

async function listJobs(query: { page?: number; pageSize?: number }) {
  const { skip, take, page, pageSize } = parsePagination(query);

  const [jobs, total] = await Promise.all([
    prisma.metricCalcJob.findMany({
      skip,
      take,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.metricCalcJob.count(),
  ]);

  return { data: jobs, meta: buildMeta(total, page, pageSize) };
}

export const metricsService = {
  listDefinitions,
  getDefinition,
  createDefinition,
  createVersion,
  getMetricValues,
  triggerRecalculation,
  recalculateAll,
  listJobs,
};
