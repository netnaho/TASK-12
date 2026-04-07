import { describe, it, expect } from 'vitest';
import { VolatilityCalculator } from '../../../src/modules/metrics/engine/calculators/volatility.calculator';

describe('VolatilityCalculator', () => {
  const calculator = new VolatilityCalculator();

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

  it('calculates standard deviation correctly with multiple windows', () => {
    // Period: 90 days => 3 windows of 30 days each
    const periodStart = new Date('2024-01-01');
    const periodEnd = new Date('2024-04-01');

    const listings = [
      makeListing(1000, new Date('2024-01-15')), // window 1
      makeListing(1500, new Date('2024-02-15')), // window 2
      makeListing(2000, new Date('2024-03-15')), // window 3
    ];

    const result = calculator.calculate({ propertyId: 'p1', listings, periodStart, periodEnd });
    // Window averages: [1000, 1500, 2000]
    // Mean: 1500
    // Variance (sample): ((1000-1500)^2 + (1500-1500)^2 + (2000-1500)^2) / 2 = 250000
    // StdDev: 500
    expect(result.value).toBe(500);
  });

  it('returns 0 for single listing (only one window average)', () => {
    const periodStart = new Date('2024-01-01');
    const periodEnd = new Date('2024-02-01');
    const listings = [makeListing(1000, new Date('2024-01-15'))];

    const result = calculator.calculate({ propertyId: 'p1', listings, periodStart, periodEnd });
    expect(result.value).toBe(0);
  });

  it('returns 0 for empty listings', () => {
    const periodStart = new Date('2024-01-01');
    const periodEnd = new Date('2024-04-01');

    const result = calculator.calculate({ propertyId: 'p1', listings: [], periodStart, periodEnd });
    expect(result.value).toBe(0);
  });

  it('handles identical values (0 volatility)', () => {
    const periodStart = new Date('2024-01-01');
    const periodEnd = new Date('2024-04-01');

    const listings = [
      makeListing(1000, new Date('2024-01-15')),
      makeListing(1000, new Date('2024-02-15')),
      makeListing(1000, new Date('2024-03-15')),
    ];

    const result = calculator.calculate({ propertyId: 'p1', listings, periodStart, periodEnd });
    expect(result.value).toBe(0);
  });

  it('returns 0 when all listings fall in a single window', () => {
    const periodStart = new Date('2024-01-01');
    const periodEnd = new Date('2024-01-25');

    const listings = [
      makeListing(1000, new Date('2024-01-05')),
      makeListing(2000, new Date('2024-01-10')),
    ];

    const result = calculator.calculate({ propertyId: 'p1', listings, periodStart, periodEnd });
    // Only one window average => returns 0
    expect(result.value).toBe(0);
  });
});
