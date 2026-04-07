import { describe, it, expect } from 'vitest';
import { PriceChangePctCalculator } from '../../../src/modules/metrics/engine/calculators/price-change-pct.calculator';

describe('PriceChangePctCalculator', () => {
  const calculator = new PriceChangePctCalculator();

  function makeListing(rentPrice: number, listedAt: Date) {
    return {
      id: 'l-' + Math.random(),
      propertyId: 'prop-1',
      rentPrice,
      isActive: true,
      listedAt,
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

  const periodStart = new Date('2024-01-01');
  const periodEnd = new Date('2024-07-01');
  // Midpoint: 2024-04-01
  const baseInput = { propertyId: 'prop-1', periodStart, periodEnd };

  it('calculates correct percentage change', () => {
    const listings = [
      makeListing(1000, new Date('2024-02-01')), // previous period
      makeListing(1200, new Date('2024-05-01')), // current period
    ];
    const result = calculator.calculate({ ...baseInput, listings });
    // (1200 - 1000) / 1000 * 100 = 20
    expect(result.value).toBe(20);
  });

  it('returns 0 when no listings exist', () => {
    const result = calculator.calculate({ ...baseInput, listings: [] });
    expect(result.value).toBe(0);
  });

  it('returns 0 when no prior period data', () => {
    const listings = [
      makeListing(1200, new Date('2024-05-01')), // current period only
    ];
    const result = calculator.calculate({ ...baseInput, listings });
    expect(result.value).toBe(0);
  });

  it('returns 0 when no current period data', () => {
    const listings = [
      makeListing(1000, new Date('2024-02-01')), // previous period only
    ];
    const result = calculator.calculate({ ...baseInput, listings });
    expect(result.value).toBe(0);
  });

  it('handles negative changes', () => {
    const listings = [
      makeListing(2000, new Date('2024-02-01')), // previous
      makeListing(1500, new Date('2024-05-01')), // current
    ];
    const result = calculator.calculate({ ...baseInput, listings });
    // (1500 - 2000) / 2000 * 100 = -25
    expect(result.value).toBe(-25);
  });

  it('handles zero previous average', () => {
    const listings = [
      makeListing(0, new Date('2024-02-01')), // previous avg = 0
      makeListing(1000, new Date('2024-05-01')),
    ];
    const result = calculator.calculate({ ...baseInput, listings });
    expect(result.value).toBe(0); // guard against divide by zero
  });

  it('handles multiple listings per period', () => {
    const listings = [
      makeListing(1000, new Date('2024-02-01')),
      makeListing(1200, new Date('2024-03-01')),
      makeListing(1300, new Date('2024-05-01')),
      makeListing(1500, new Date('2024-06-01')),
    ];
    const result = calculator.calculate({ ...baseInput, listings });
    // previousAvg = (1000 + 1200) / 2 = 1100
    // currentAvg = (1300 + 1500) / 2 = 1400
    // pct = (1400 - 1100) / 1100 * 100 = 27.2727...
    expect(result.value).toBeCloseTo(27.2727, 2);
  });
});
