import { describe, it, expect, vi, afterEach } from 'vitest';
import { VacancyDurationCalculator } from '../../../src/modules/metrics/engine/calculators/vacancy-duration.calculator';

describe('VacancyDurationCalculator', () => {
  const calculator = new VacancyDurationCalculator();
  const baseInput = {
    propertyId: 'prop-1',
    periodStart: new Date('2024-01-01'),
    periodEnd: new Date('2024-06-30'),
  };

  function makeListing(listedAt: Date, leasedAt: Date | null = null) {
    return {
      id: 'l-' + Math.random(),
      propertyId: 'prop-1',
      rentPrice: 1000,
      isActive: leasedAt === null,
      listedAt,
      leasedAt,
      createdAt: new Date(),
      updatedAt: new Date(),
      unitLabel: 'A1',
      description: null,
      bedroomCount: 1,
      bathroomCount: 1,
      squareFeet: null,
    } as any;
  }

  afterEach(() => {
    vi.useRealTimers();
  });

  it('calculates average days on market for leased listings', () => {
    const listings = [
      makeListing(new Date('2024-01-01'), new Date('2024-01-31')), // 30 days
      makeListing(new Date('2024-02-01'), new Date('2024-03-02')), // 30 days
    ];
    const result = calculator.calculate({ ...baseInput, listings });
    expect(result.value).toBe(30);
  });

  it('handles active listings using current date', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-04-01'));

    const listings = [
      makeListing(new Date('2024-03-01')), // no leasedAt => uses "now" (Apr 1) => 31 days
    ];
    const result = calculator.calculate({ ...baseInput, listings });
    expect(result.value).toBe(31);
  });

  it('returns 0 for empty listings', () => {
    const result = calculator.calculate({ ...baseInput, listings: [] });
    expect(result.value).toBe(0);
  });

  it('handles mix of leased and active listings', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-03-01'));

    const listings = [
      makeListing(new Date('2024-01-01'), new Date('2024-02-01')), // 31 days
      makeListing(new Date('2024-02-01')), // active, listedAt to now (Mar 1) => 29 days
    ];
    const result = calculator.calculate({ ...baseInput, listings });
    // avg = (31 + 29) / 2 = 30
    expect(result.value).toBe(30);
  });

  it('returns 0 for listing listed and leased on same day', () => {
    const sameDay = new Date('2024-03-01');
    const listings = [makeListing(sameDay, sameDay)];
    const result = calculator.calculate({ ...baseInput, listings });
    expect(result.value).toBe(0);
  });
});
