import { prisma } from '../config/database';
import { logger } from '../logging/logger';
import { metricEngine } from '../modules/metrics/engine/metric-engine';
import { MetricType } from '@prisma/client';

/**
 * Nightly metric recalculation job.
 * Runs at 2 AM daily. Recalculates all metric values for every active property
 * using the current (non-expired) metric definition versions.
 */
export async function nightlyMetricRecalc(): Promise<void> {
  const startTime = Date.now();
  logger.info('Nightly metric recalculation started');

  let valuesCalculated = 0;

  try {
    // Get all active properties with their listings
    const properties = await prisma.property.findMany({
      where: { isActive: true },
      include: { listings: true },
    });

    // Get all current metric definition versions (where effectiveTo is null)
    const currentVersions = await prisma.metricDefinitionVersion.findMany({
      where: { effectiveTo: null },
      include: { metricDefinition: true },
    });

    const now = new Date();
    const periodStart = new Date(now);
    periodStart.setDate(periodStart.getDate() - 1);
    periodStart.setHours(0, 0, 0, 0);
    const periodEnd = new Date(now);
    periodEnd.setHours(0, 0, 0, 0);

    for (const property of properties) {
      for (const version of currentVersions) {
        try {
          const metricType = version.metricDefinition.metricType as MetricType;

          const result = metricEngine.calculate(metricType, {
            propertyId: property.id,
            listings: property.listings,
            periodStart,
            periodEnd,
          });

          // Upsert the MetricValue for the current period
          const existing = await prisma.metricValue.findFirst({
            where: {
              propertyId: property.id,
              metricDefinitionVersionId: version.id,
              periodStart,
              periodEnd,
            },
          });

          if (existing) {
            await prisma.metricValue.update({
              where: { id: existing.id },
              data: {
                value: result.value,
                calculatedAt: now,
              },
            });
          } else {
            await prisma.metricValue.create({
              data: {
                propertyId: property.id,
                metricDefinitionVersionId: version.id,
                value: result.value,
                calculatedAt: now,
                periodStart,
                periodEnd,
              },
            });
          }

          valuesCalculated++;
        } catch (calcError) {
          logger.error(
            {
              propertyId: property.id,
              versionId: version.id,
              error: calcError,
            },
            'Failed to calculate metric for property/version',
          );
        }
      }
    }

    // Create a MetricCalcJob record with status COMPLETED
    await prisma.metricCalcJob.create({
      data: {
        triggeredBy: 'nightly-cron',
        status: 'COMPLETED',
        startedAt: new Date(startTime),
        completedAt: new Date(),
      },
    });

    const durationMs = Date.now() - startTime;
    logger.info(
      { valuesCalculated, durationMs, properties: properties.length },
      'Nightly metric recalculation completed',
    );
  } catch (error) {
    // Create a MetricCalcJob record with status FAILED
    await prisma.metricCalcJob.create({
      data: {
        triggeredBy: 'nightly-cron',
        status: 'FAILED',
        startedAt: new Date(startTime),
        completedAt: new Date(),
        errorLog: error instanceof Error ? error.message : String(error),
      },
    });

    logger.error({ error }, 'Nightly metric recalculation failed');
    throw error;
  }
}
