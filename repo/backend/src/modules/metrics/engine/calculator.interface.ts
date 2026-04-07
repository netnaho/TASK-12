import { Listing } from '@prisma/client';

export interface MetricInput {
  propertyId: string;
  listings: Listing[];
  periodStart: Date;
  periodEnd: Date;
}

export interface MetricResult {
  value: number;
}

export interface IMetricCalculator {
  calculate(input: MetricInput): MetricResult;
}
