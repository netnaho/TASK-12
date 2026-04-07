import { describe, it, expect } from 'vitest';
import { SupplyDemandRatioCalculator } from '../../../src/modules/metrics/engine/calculators/supply-demand-ratio.calculator';

describe('SupplyDemandRatioCalculator', () => {
  const calculator = new SupplyDemandRatioCalculator();
  const baseInput = {
    propertyId: 'prop-1',
    periodStart: new Date('2024-01-01'),
    periodEnd: new Date('2024-06-30'),
  };

  function makeListing(isActive: boolean) {
    return {
      id: 'l-' + Math.random(),
      propertyId: 'prop-1',
      rentPrice: 1000,
      isActive,
      listedAt: new Date('2024-03-01'),
      leasedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      unitLabel: 'A1',
      description: null,
      bedroomCount: 1,
      bathroomCount: 1,
      squareFeet: null,
    } as any;
  }

  it('calculates correct ratio', () => {
    const listings = [
      makeListing(true),
      makeListing(true),
      makeListing(false),
    ];
    const result = calculator.calculate({ ...baseInput, listings, totalUnits: 10 });
    // 2 active / 10 total = 0.2
    expect(result.value).toBe(0.2);
  });

  it('returns 0 for no listings', () => {
    const result = calculator.calculate({ ...baseInput, listings: [], totalUnits: 10 });
    expect(result.value).toBe(0);
  });

  it('returns 0 when totalUnits is 0', () => {
    const listings = [makeListing(true)];
    const result = calculator.calculate({ ...baseInput, listings, totalUnits: 0 });
    expect(result.value).toBe(0);
  });

  it('returns 0 when totalUnits is undefined', () => {
    const listings = [makeListing(true)];
    const result = calculator.calculate({ ...baseInput, listings });
    expect(result.value).toBe(0);
  });

  it('returns 0 when totalUnits is negative', () => {
    const listings = [makeListing(true)];
    const result = calculator.calculate({ ...baseInput, listings, totalUnits: -5 });
    expect(result.value).toBe(0);
  });

  it('rounds to 4 decimal places', () => {
    const listings = [makeListing(true), makeListing(true), makeListing(true)];
    const result = calculator.calculate({ ...baseInput, listings, totalUnits: 7 });
    // 3/7 = 0.42857142... => rounded to 0.4286
    expect(result.value).toBe(0.4286);
  });
});
