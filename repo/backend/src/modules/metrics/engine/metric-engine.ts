import { MetricType } from '@prisma/client';
import { IMetricCalculator, MetricInput, MetricResult } from './calculator.interface';
import { UnitRentCalculator } from './calculators/unit-rent.calculator';
import { PriceChangePctCalculator } from './calculators/price-change-pct.calculator';
import { VolatilityCalculator } from './calculators/volatility.calculator';
import { VacancyDurationCalculator } from './calculators/vacancy-duration.calculator';
import { SupplyDemandRatioCalculator } from './calculators/supply-demand-ratio.calculator';

export class MetricEngine {
  private registry = new Map<MetricType, IMetricCalculator>();

  constructor() {
    this.registerCalculator('UNIT_RENT', new UnitRentCalculator());
    this.registerCalculator('PRICE_CHANGE_PCT', new PriceChangePctCalculator());
    this.registerCalculator('VOLATILITY_30D', new VolatilityCalculator());
    this.registerCalculator('VACANCY_DAYS_ON_MARKET', new VacancyDurationCalculator());
    this.registerCalculator('LISTING_DURATION_DOM', new VacancyDurationCalculator());
    this.registerCalculator('SUPPLY_DEMAND_RATIO', new SupplyDemandRatioCalculator());
  }

  registerCalculator(type: MetricType, calculator: IMetricCalculator): void {
    this.registry.set(type, calculator);
  }

  calculate(metricType: MetricType, input: MetricInput): MetricResult {
    const calculator = this.registry.get(metricType);
    if (!calculator) {
      throw new Error(`No calculator registered for metric type: ${metricType}`);
    }
    return calculator.calculate(input);
  }

  calculateAll(input: MetricInput): Map<MetricType, MetricResult> {
    const results = new Map<MetricType, MetricResult>();

    for (const [type, calculator] of this.registry.entries()) {
      results.set(type, calculator.calculate(input));
    }

    return results;
  }

  getRegisteredTypes(): MetricType[] {
    return Array.from(this.registry.keys());
  }
}

export const metricEngine = new MetricEngine();
