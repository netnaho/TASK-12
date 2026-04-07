import { describe, it, expect } from 'vitest';
import { UnitRentCalculator } from '../../../src/modules/metrics/engine/calculators/unit-rent.calculator';

describe('UnitRentCalculator', () => {
  const calculator = new UnitRentCalculator();
  const baseInput = {
    propertyId: 'prop-1',
    periodStart: new Date('2024-01-01'),
    periodEnd: new Date('2024-06-30'),
  };

  function makeListing(overrides: Partial<{ rentPrice: number; isActive: boolean }> = {}) {
    return {
      id: 'l-' + Math.random(),
      propertyId: 'prop-1',
      rentPrice: overrides.rentPrice ?? 1000,
      isActive: overrides.isActive ?? true,
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

  it('calculates average rent of active listings', () => {
    const listings = [
      makeListing({ rentPrice: 1000 }),
      makeListing({ rentPrice: 2000 }),
      makeListing({ rentPrice: 3000 }),
    ];
    const result = calculator.calculate({ ...baseInput, listings });
    expect(result.value).toBe(2000);
  });

  it('returns 0 for empty listings', () => {
    const result = calculator.calculate({ ...baseInput, listings: [] });
    expect(result.value).toBe(0);
  });

  it('handles single listing', () => {
    const listings = [makeListing({ rentPrice: 1500 })];
    const result = calculator.calculate({ ...baseInput, listings });
    expect(result.value).toBe(1500);
  });

  it('filters out inactive listings', () => {
    const listings = [
      makeListing({ rentPrice: 1000, isActive: true }),
      makeListing({ rentPrice: 5000, isActive: false }),
      makeListing({ rentPrice: 2000, isActive: true }),
    ];
    const result = calculator.calculate({ ...baseInput, listings });
    expect(result.value).toBe(1500);
  });

  it('returns 0 when all listings are inactive', () => {
    const listings = [
      makeListing({ rentPrice: 1000, isActive: false }),
      makeListing({ rentPrice: 2000, isActive: false }),
    ];
    const result = calculator.calculate({ ...baseInput, listings });
    expect(result.value).toBe(0);
  });

  it('rounds to 2 decimal places', () => {
    const listings = [
      makeListing({ rentPrice: 1000 }),
      makeListing({ rentPrice: 1001 }),
      makeListing({ rentPrice: 1002 }),
    ];
    const result = calculator.calculate({ ...baseInput, listings });
    expect(result.value).toBe(1001);
  });
});
