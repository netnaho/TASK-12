import { IMetricCalculator, MetricInput, MetricResult } from '../calculator.interface';

/**
 * Calculates the rolling 30-day standard deviation of rent prices.
 * Groups listings into 30-day windows from periodStart, computes the average
 * rent per window, then calculates the standard deviation of those averages.
 */
export class VolatilityCalculator implements IMetricCalculator {
  calculate(input: MetricInput): MetricResult {
    const { listings, periodStart, periodEnd } = input;

    if (listings.length === 0) {
      return { value: 0 };
    }

    const WINDOW_MS = 30 * 24 * 60 * 60 * 1000; // 30 days in ms
    const windowAverages: number[] = [];

    let windowStart = periodStart.getTime();
    const endMs = periodEnd.getTime();

    while (windowStart < endMs) {
      const windowEnd = Math.min(windowStart + WINDOW_MS, endMs);

      const windowListings = listings.filter((l) => {
        const listedMs = l.listedAt.getTime();
        return listedMs >= windowStart && listedMs < windowEnd;
      });

      if (windowListings.length > 0) {
        const avg =
          windowListings.reduce((sum, l) => sum + Number(l.rentPrice), 0) /
          windowListings.length;
        windowAverages.push(avg);
      }

      windowStart = windowEnd;
    }

    if (windowAverages.length < 2) {
      return { value: 0 };
    }

    const mean =
      windowAverages.reduce((sum, v) => sum + v, 0) / windowAverages.length;

    const variance =
      windowAverages.reduce((sum, v) => sum + (v - mean) ** 2, 0) /
      (windowAverages.length - 1);

    const stdDev = Math.sqrt(variance);

    return { value: Math.round(stdDev * 100) / 100 };
  }
}
