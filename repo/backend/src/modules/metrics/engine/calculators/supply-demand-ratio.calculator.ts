import { IMetricCalculator, MetricInput, MetricResult } from '../calculator.interface';

/**
 * Calculates the ratio of active listings to total units in the property.
 * A higher ratio indicates more supply (vacancies) relative to capacity.
 * The MetricEngine passes totalUnits via an extended input field.
 */
export class SupplyDemandRatioCalculator implements IMetricCalculator {
  calculate(input: MetricInput & { totalUnits?: number }): MetricResult {
    const activeListings = input.listings.filter((l) => l.isActive);

    const totalUnits = input.totalUnits;
    if (!totalUnits || totalUnits <= 0) {
      return { value: 0 };
    }

    const ratio = activeListings.length / totalUnits;

    return { value: Math.round(ratio * 10000) / 10000 };
  }
}
