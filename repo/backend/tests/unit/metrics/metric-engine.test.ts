import { describe, it, expect } from 'vitest';
import { MetricEngine } from '../../../src/modules/metrics/engine/metric-engine';
import type { MetricType } from '@prisma/client';

const sampleInput = {
  listings: [
    {
      id: 'l1',
      propertyId: 'p1',
      bedrooms: 2,
      bathrooms: 1,
      sqft: 900,
      rentPrice: 1500,
      listedAt: new Date('2024-01-01'),
      leasedAt: new Date('2024-01-15'),
      isActive: false,
    },
    {
      id: 'l2',
      propertyId: 'p1',
      bedrooms: 2,
      bathrooms: 1,
      sqft: 900,
      rentPrice: 1600,
      listedAt: new Date('2024-02-01'),
      leasedAt: null,
      isActive: true,
    },
  ],
  property: {
    id: 'p1',
    name: 'Test Property',
    totalUnits: 10,
  },
  periodStart: new Date('2024-01-01'),
  periodEnd: new Date('2024-03-01'),
};

describe('MetricEngine', () => {
  describe('calculate', () => {
    it('computes UNIT_RENT without throwing', () => {
      const engine = new MetricEngine();
      const result = engine.calculate('UNIT_RENT' as MetricType, sampleInput);
      expect(typeof result.value).toBe('number');
    });

    it('computes PRICE_CHANGE_PCT', () => {
      const engine = new MetricEngine();
      const result = engine.calculate('PRICE_CHANGE_PCT' as MetricType, sampleInput);
      expect(typeof result.value).toBe('number');
    });

    it('computes VOLATILITY_30D', () => {
      const engine = new MetricEngine();
      const result = engine.calculate('VOLATILITY_30D' as MetricType, sampleInput);
      expect(typeof result.value).toBe('number');
      expect(result.value).toBeGreaterThanOrEqual(0);
    });

    it('computes VACANCY_DAYS_ON_MARKET', () => {
      const engine = new MetricEngine();
      const result = engine.calculate('VACANCY_DAYS_ON_MARKET' as MetricType, sampleInput);
      expect(typeof result.value).toBe('number');
      expect(result.value).toBeGreaterThanOrEqual(0);
    });

    it('computes SUPPLY_DEMAND_RATIO', () => {
      const engine = new MetricEngine();
      const result = engine.calculate('SUPPLY_DEMAND_RATIO' as MetricType, sampleInput);
      expect(typeof result.value).toBe('number');
    });

    it('throws for unregistered metric type', () => {
      const engine = new MetricEngine();
      expect(() =>
        engine.calculate('UNKNOWN_METRIC' as MetricType, sampleInput),
      ).toThrow('No calculator registered for metric type: UNKNOWN_METRIC');
    });
  });

  describe('calculateAll', () => {
    it('returns a result for every registered type', () => {
      const engine = new MetricEngine();
      const results = engine.calculateAll(sampleInput);
      expect(results.size).toBeGreaterThanOrEqual(5);
    });

    it('all returned values are numbers', () => {
      const engine = new MetricEngine();
      const results = engine.calculateAll(sampleInput);
      for (const [, result] of results) {
        expect(typeof result.value).toBe('number');
      }
    });
  });

  describe('getRegisteredTypes', () => {
    it('returns at least 5 metric types', () => {
      const engine = new MetricEngine();
      const types = engine.getRegisteredTypes();
      expect(types.length).toBeGreaterThanOrEqual(5);
    });

    it('includes UNIT_RENT', () => {
      const engine = new MetricEngine();
      expect(engine.getRegisteredTypes()).toContain('UNIT_RENT');
    });
  });

  describe('registerCalculator', () => {
    it('allows overriding a registered calculator', () => {
      const engine = new MetricEngine();
      engine.registerCalculator('UNIT_RENT' as MetricType, {
        calculate: () => ({ value: 42, label: 'override' }),
      });
      const result = engine.calculate('UNIT_RENT' as MetricType, sampleInput);
      expect(result.value).toBe(42);
    });
  });
});
