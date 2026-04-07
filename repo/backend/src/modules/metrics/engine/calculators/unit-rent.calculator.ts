import { IMetricCalculator, MetricInput, MetricResult } from '../calculator.interface';

/**
 * Calculates the average rent price across active listings for a property.
 */
export class UnitRentCalculator implements IMetricCalculator {
  calculate(input: MetricInput): MetricResult {
    const activeListings = input.listings.filter((l) => l.isActive);

    if (activeListings.length === 0) {
      return { value: 0 };
    }

    const totalRent = activeListings.reduce(
      (sum, listing) => sum + Number(listing.rentPrice),
      0,
    );

    const averageRent = totalRent / activeListings.length;

    return { value: Math.round(averageRent * 100) / 100 };
  }
}
