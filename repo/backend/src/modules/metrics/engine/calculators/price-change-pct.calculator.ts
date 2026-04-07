import { IMetricCalculator, MetricInput, MetricResult } from '../calculator.interface';

/**
 * Calculates the percentage change in average rent from the previous period to the current period.
 * The period is split in half: first half = previous, second half = current.
 */
export class PriceChangePctCalculator implements IMetricCalculator {
  calculate(input: MetricInput): MetricResult {
    const { listings, periodStart, periodEnd } = input;

    if (listings.length === 0) {
      return { value: 0 };
    }

    const midpoint = new Date(
      (periodStart.getTime() + periodEnd.getTime()) / 2,
    );

    const previousListings = listings.filter(
      (l) => l.listedAt >= periodStart && l.listedAt < midpoint,
    );
    const currentListings = listings.filter(
      (l) => l.listedAt >= midpoint && l.listedAt <= periodEnd,
    );

    if (previousListings.length === 0 || currentListings.length === 0) {
      return { value: 0 };
    }

    const previousAvg =
      previousListings.reduce((sum, l) => sum + Number(l.rentPrice), 0) /
      previousListings.length;

    const currentAvg =
      currentListings.reduce((sum, l) => sum + Number(l.rentPrice), 0) /
      currentListings.length;

    if (previousAvg === 0) {
      return { value: 0 };
    }

    const pctChange = ((currentAvg - previousAvg) / previousAvg) * 100;

    return { value: Math.round(pctChange * 10000) / 10000 };
  }
}
