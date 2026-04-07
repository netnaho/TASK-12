import { IMetricCalculator, MetricInput, MetricResult } from '../calculator.interface';

/**
 * Calculates the average days on market for listings.
 * Days on market = (leasedAt or now) - listedAt, in days.
 */
export class VacancyDurationCalculator implements IMetricCalculator {
  calculate(input: MetricInput): MetricResult {
    const { listings } = input;

    if (listings.length === 0) {
      return { value: 0 };
    }

    const now = new Date();
    const MS_PER_DAY = 1000 * 60 * 60 * 24;

    const totalDays = listings.reduce((sum, listing) => {
      const endDate = listing.leasedAt || now;
      const diffMs = endDate.getTime() - listing.listedAt.getTime();
      const days = Math.max(0, diffMs / MS_PER_DAY);
      return sum + days;
    }, 0);

    const averageDays = totalDays / listings.length;

    return { value: Math.round(averageDays * 100) / 100 };
  }
}
