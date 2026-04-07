/**
 * Unit tests for analytics service — report generation, publishing, sharing,
 * pivot queries, and scheduled generation.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockPrisma, mockAudit } = vi.hoisted(() => ({
  mockPrisma: {
    reportDefinition: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    report: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    reportShare: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      upsert: vi.fn(),
      update: vi.fn(),
    },
    exportRequest: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    metricValue: { findMany: vi.fn(), count: vi.fn() },
    metricDefinitionVersion: { updateMany: vi.fn() },
    reportMetricSnapshot: { createMany: vi.fn() },
    user: { findUnique: vi.fn() },
  },
  mockAudit: { create: vi.fn() },
}));

vi.mock('../../../src/config/database', () => ({ prisma: mockPrisma }));
vi.mock('../../../src/logging/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));
vi.mock('../../../src/modules/audit/audit.service', () => ({
  auditService: mockAudit,
}));
// Mock file system operations
vi.mock('fs', () => ({
  promises: {
    mkdir: vi.fn().mockResolvedValue(undefined),
    writeFile: vi.fn().mockResolvedValue(undefined),
    readFile: vi.fn().mockResolvedValue(Buffer.from('file-data')),
    access: vi.fn().mockResolvedValue(undefined),
  },
}));
// Mock exporters
vi.mock('../../../src/modules/analytics/exporters/csv.exporter', () => ({
  CSVExporter: vi.fn().mockImplementation(() => ({
    export: vi.fn().mockResolvedValue(Buffer.from('csv-data')),
  })),
}));
vi.mock('../../../src/modules/analytics/exporters/excel.exporter', () => ({
  ExcelExporter: vi.fn().mockImplementation(() => ({
    export: vi.fn().mockResolvedValue(Buffer.from('excel-data')),
  })),
}));
vi.mock('../../../src/modules/analytics/exporters/pdf.exporter', () => ({
  PDFExporter: vi.fn().mockImplementation(() => ({
    export: vi.fn().mockResolvedValue(Buffer.from('pdf-data')),
  })),
}));

import { analyticsService } from '../../../src/modules/analytics/analytics.service';

beforeEach(() => {
  // clearAllMocks clears call history but preserves mock implementations
  // (vi.resetAllMocks would break module-level mocks like CSVExporter)
  vi.clearAllMocks();
  mockAudit.create.mockResolvedValue({});
  // Default stubs for prisma methods used in many tests
  mockPrisma.report.update.mockResolvedValue({});
  mockPrisma.reportDefinition.findUnique.mockResolvedValue(null);
});

const definition = {
  id: 'def-1',
  name: 'Monthly Rent Report',
  frequency: 'MONTHLY',
  isActive: true,
  createdBy: 'user-creator',
};

const report = {
  id: 'report-1',
  definitionId: 'def-1',
  status: 'PUBLISHED',
  createdBy: 'user-creator',
  periodStart: new Date('2024-01-01'),
  periodEnd: new Date('2024-01-31'),
  generatedAt: new Date(),
  dataJson: [],
};

// ─── generateReport ──────────────────────────────────────────────────────────

describe('analyticsService.generateReport', () => {
  it('throws NotFoundError when definition does not exist', async () => {
    mockPrisma.reportDefinition.findUnique.mockResolvedValue(null);

    await expect(
      analyticsService.generateReport('def-ghost', '2024-01-01T00:00:00Z', '2024-01-31T23:59:59Z', 'actor'),
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it('throws BadRequestError when periodStart >= periodEnd', async () => {
    mockPrisma.reportDefinition.findUnique.mockResolvedValue(definition);

    await expect(
      analyticsService.generateReport('def-1', '2024-02-01T00:00:00Z', '2024-01-01T00:00:00Z', 'actor'),
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it('generates report with PUBLISHED status when no metric values exist', async () => {
    mockPrisma.reportDefinition.findUnique.mockResolvedValue(definition);
    mockPrisma.report.create.mockResolvedValue({ id: 'report-new', status: 'GENERATING' });
    mockPrisma.metricValue.findMany.mockResolvedValue([]);
    mockPrisma.report.update.mockResolvedValue({ ...report, id: 'report-new' });

    const result = await analyticsService.generateReport(
      'def-1',
      '2024-01-01T00:00:00Z',
      '2024-01-31T23:59:59Z',
      'actor',
    );

    expect(mockPrisma.report.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'GENERATING' }) }),
    );
    expect(mockPrisma.report.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'PUBLISHED' }) }),
    );
    expect(mockAudit.create).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'REPORT_PUBLISHED' }),
    );
  });

  it('generates report and locks metric versions when metric values exist', async () => {
    const metricValues = [
      {
        id: 'mv-1',
        propertyId: 'prop-1',
        value: 1500,
        calculatedAt: new Date(),
        periodStart: new Date('2024-01-01'),
        periodEnd: new Date('2024-01-31'),
        metricDefinitionVersionId: 'ver-1',
        property: {
          name: 'Building A',
          community: { name: 'Sunrise Villas', region: { name: 'Pacific Northwest' } },
        },
        metricDefinitionVersion: {
          metricDefinition: { metricType: 'UNIT_RENT' },
        },
      },
    ];

    mockPrisma.reportDefinition.findUnique.mockResolvedValue(definition);
    mockPrisma.report.create.mockResolvedValue({ id: 'report-new', status: 'GENERATING' });
    mockPrisma.metricValue.findMany.mockResolvedValue(metricValues);
    mockPrisma.metricDefinitionVersion.updateMany.mockResolvedValue({ count: 1 });
    mockPrisma.reportMetricSnapshot.createMany.mockResolvedValue({ count: 1 });
    mockPrisma.report.update.mockResolvedValue({ ...report, id: 'report-new' });

    await analyticsService.generateReport(
      'def-1',
      '2024-01-01T00:00:00Z',
      '2024-01-31T23:59:59Z',
      'actor',
    );

    expect(mockPrisma.metricDefinitionVersion.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ isLocked: true }) }),
    );
    expect(mockPrisma.reportMetricSnapshot.createMany).toHaveBeenCalled();
  });

  it('marks report FAILED and re-throws on error during generation', async () => {
    mockPrisma.reportDefinition.findUnique.mockResolvedValue(definition);
    mockPrisma.report.create.mockResolvedValue({ id: 'report-fail', status: 'GENERATING' });
    mockPrisma.metricValue.findMany.mockRejectedValue(new Error('DB error'));
    mockPrisma.report.update.mockResolvedValue({ id: 'report-fail', status: 'FAILED' });

    await expect(
      analyticsService.generateReport('def-1', '2024-01-01T00:00:00Z', '2024-01-31T23:59:59Z', 'actor'),
    ).rejects.toThrow('DB error');

    expect(mockPrisma.report.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: 'FAILED' } }),
    );
  });
});

// ─── publishReport ────────────────────────────────────────────────────────────

describe('analyticsService.publishReport', () => {
  it('publishes a DRAFT report', async () => {
    mockPrisma.report.findUnique.mockResolvedValue({ ...report, status: 'DRAFT', createdBy: 'actor-1' });
    mockPrisma.report.update.mockResolvedValue({ ...report, status: 'PUBLISHED' });

    const result = await analyticsService.publishReport('report-1', 'actor-1');
    expect(mockPrisma.report.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'PUBLISHED' }) }),
    );
  });

  it('throws NotFoundError when report not found', async () => {
    mockPrisma.report.findUnique.mockResolvedValue(null);

    await expect(analyticsService.publishReport('ghost', 'actor')).rejects.toMatchObject({ statusCode: 404 });
  });

  it('throws ForbiddenError when user is not the creator', async () => {
    mockPrisma.report.findUnique.mockResolvedValue({ ...report, status: 'DRAFT', createdBy: 'other-user' });

    await expect(analyticsService.publishReport('report-1', 'actor-1')).rejects.toMatchObject({ statusCode: 403 });
  });

  it('throws BadRequestError when report is already ARCHIVED', async () => {
    mockPrisma.report.findUnique.mockResolvedValue({ ...report, status: 'ARCHIVED', createdBy: 'actor-1' });

    await expect(analyticsService.publishReport('report-1', 'actor-1')).rejects.toMatchObject({ statusCode: 400 });
  });
});

// ─── listShares ───────────────────────────────────────────────────────────────

describe('analyticsService.listShares', () => {
  it('returns active shares for the report creator', async () => {
    // The new ACL pre-loads shares filtered by the requesting user; for the
    // creator we don't need any matching share rows (creator passes by createdBy).
    mockPrisma.report.findUnique.mockResolvedValue({ ...report, shares: [] });
    mockPrisma.reportShare.findMany.mockResolvedValue([
      { id: 'share-1', reportId: 'report-1', userId: 'user-2', sharedAt: new Date() },
    ]);

    const result = await analyticsService.listShares('report-1', 'user-creator');
    expect(result).toHaveLength(1);
  });

  it('returns active shares for a sharee with an active share', async () => {
    mockPrisma.report.findUnique.mockResolvedValue({
      ...report,
      shares: [{ id: 'sharee-self' }],
    });
    mockPrisma.reportShare.findMany.mockResolvedValue([
      { id: 'share-1', reportId: 'report-1', userId: 'user-2', sharedAt: new Date() },
    ]);

    const result = await analyticsService.listShares('report-1', 'user-2');
    expect(result).toHaveLength(1);
  });

  it('throws NotFoundError when report not found', async () => {
    mockPrisma.report.findUnique.mockResolvedValue(null);

    await expect(analyticsService.listShares('ghost', 'user-creator')).rejects.toMatchObject({
      statusCode: 404,
    });
  });

  it('throws NotFoundError (BOLA-safe) when caller is neither creator nor sharee', async () => {
    mockPrisma.report.findUnique.mockResolvedValue({ ...report, shares: [] });

    await expect(
      analyticsService.listShares('report-1', 'unrelated-user'),
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it('allows SYSTEM_ADMIN to list shares regardless of ownership', async () => {
    mockPrisma.report.findUnique.mockResolvedValue({ ...report, shares: [] });
    mockPrisma.reportShare.findMany.mockResolvedValue([
      { id: 'share-1', reportId: 'report-1', userId: 'user-2', sharedAt: new Date() },
    ]);

    const result = await analyticsService.listShares('report-1', 'admin-user', true);
    expect(result).toHaveLength(1);
  });
});

// ─── pivotQuery ───────────────────────────────────────────────────────────────

describe('analyticsService.pivotQuery', () => {
  it('returns empty rows when no metric values match', async () => {
    mockPrisma.metricValue.findMany.mockResolvedValue([]);

    const result = await analyticsService.pivotQuery({
      dimensions: ['region'],
      measures: ['avg_value'],
      filters: {},
    });

    expect(result).toHaveProperty('rows');
    expect(result.rows).toEqual([]);
  });

  it('groups metric values by region dimension', async () => {
    mockPrisma.metricValue.findMany.mockResolvedValue([
      {
        id: 'mv-1',
        value: 1500,
        propertyId: 'prop-1',
        property: {
          name: 'Building A',
          community: { name: 'Sunrise Villas', region: { name: 'Pacific NW' } },
        },
        metricDefinitionVersion: {
          metricDefinition: { metricType: 'UNIT_RENT' },
        },
      },
      {
        id: 'mv-2',
        value: 1700,
        propertyId: 'prop-2',
        property: {
          name: 'Building B',
          community: { name: 'Sunset Villas', region: { name: 'Pacific NW' } },
        },
        metricDefinitionVersion: {
          metricDefinition: { metricType: 'UNIT_RENT' },
        },
      },
    ]);

    const result = await analyticsService.pivotQuery({
      dimensions: ['region'],
      measures: ['avg_value'],
      filters: {},
    });

    // Both properties are in same region → 1 group
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].region).toBe('Pacific NW');
    expect(result.rows[0].avg_value).toBe(1600); // avg(1500, 1700)
  });

  it('applies date filters to the query', async () => {
    mockPrisma.metricValue.findMany.mockResolvedValue([]);

    await analyticsService.pivotQuery({
      dimensions: ['community'],
      measures: ['avg'],
      filters: { dateFrom: '2024-01-01', dateTo: '2024-12-31' },
    });

    expect(mockPrisma.metricValue.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ periodEnd: expect.any(Object) }),
      }),
    );
  });

  it('applies regionId filter to the query', async () => {
    mockPrisma.metricValue.findMany.mockResolvedValue([]);

    await analyticsService.pivotQuery({
      dimensions: ['property'],
      measures: ['avg'],
      filters: { regionId: 'region-1' },
    });

    expect(mockPrisma.metricValue.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ property: expect.any(Object) }),
      }),
    );
  });

  it('applies metricType filter to the query', async () => {
    mockPrisma.metricValue.findMany.mockResolvedValue([]);

    await analyticsService.pivotQuery({
      dimensions: ['community'],
      measures: ['avg'],
      filters: { metricType: 'UNIT_RENT' },
    });

    expect(mockPrisma.metricValue.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ metricDefinitionVersion: expect.any(Object) }),
      }),
    );
  });
});

// ─── generateScheduledReports ─────────────────────────────────────────────────

describe('analyticsService.generateScheduledReports', () => {
  it('returns empty array when no active definitions for frequency', async () => {
    mockPrisma.reportDefinition.findMany.mockResolvedValue([]);

    const result = await analyticsService.generateScheduledReports('DAILY');
    expect(result).toEqual([]);
  });

  it('returns [] for unsupported frequency (default case)', async () => {
    mockPrisma.reportDefinition.findMany.mockResolvedValue([]);

    const result = await analyticsService.generateScheduledReports('YEARLY' as any);
    expect(result).toEqual([]);
  });

  it('generates reports for each DAILY definition', async () => {
    const dailyDef = { ...definition, frequency: 'DAILY', id: 'def-daily' };
    mockPrisma.reportDefinition.findMany.mockResolvedValue([dailyDef]);
    // generateReport internally calls reportDefinition.findUnique
    mockPrisma.reportDefinition.findUnique.mockResolvedValue(dailyDef);
    mockPrisma.report.create.mockResolvedValue({ id: 'r-sched', status: 'GENERATING' });
    mockPrisma.metricValue.findMany.mockResolvedValue([]);
    mockPrisma.report.update.mockResolvedValue({ id: 'r-sched', status: 'PUBLISHED' });

    const result = await analyticsService.generateScheduledReports('DAILY');
    expect(result).toHaveLength(1);
    expect(result[0]).toHaveProperty('status', 'success');
  });

  it('records failed status when individual report generation fails', async () => {
    const failDef = { ...definition, frequency: 'WEEKLY', id: 'def-fail' };
    mockPrisma.reportDefinition.findMany.mockResolvedValue([failDef]);
    mockPrisma.reportDefinition.findUnique.mockResolvedValue(failDef);
    mockPrisma.report.create.mockResolvedValue({ id: 'r-fail', status: 'GENERATING' });
    mockPrisma.metricValue.findMany.mockRejectedValue(new Error('DB failure'));

    const result = await analyticsService.generateScheduledReports('WEEKLY');
    expect(result).toHaveLength(1);
    expect(result[0]).toHaveProperty('status', 'failed');
    expect(result[0]).toHaveProperty('error', 'DB failure');
  });

  it('generates reports for MONTHLY definitions', async () => {
    const monthlyDef = { ...definition, frequency: 'MONTHLY', id: 'def-monthly' };
    mockPrisma.reportDefinition.findMany.mockResolvedValue([monthlyDef]);
    mockPrisma.reportDefinition.findUnique.mockResolvedValue(monthlyDef);
    mockPrisma.report.create.mockResolvedValue({ id: 'r-monthly', status: 'GENERATING' });
    mockPrisma.metricValue.findMany.mockResolvedValue([]);
    mockPrisma.report.update.mockResolvedValue({ id: 'r-monthly', status: 'PUBLISHED' });

    const result = await analyticsService.generateScheduledReports('MONTHLY');
    expect(result[0].status).toBe('success');
  });
});

// ─── requestExport (happy path) ───────────────────────────────────────────────

describe('analyticsService.requestExport — happy path', () => {
  const userWithExportPermission = {
    id: 'user-creator',
    displayName: 'Alice',
    roles: [
      {
        role: {
          permissions: [
            { permission: { resource: 'reports', action: 'export' } },
          ],
        },
      },
    ],
  };

  it('creates export record and generates CSV file', async () => {
    const publishedReport = {
      ...report,
      status: 'PUBLISHED',
      createdBy: 'user-creator',
      shares: [],
      definition: { name: 'Test Report' },
      creator: { displayName: 'Alice' },
      dataJson: [
        {
          propertyName: 'Building A',
          communityName: 'Sunrise Villas',
          regionName: 'Pacific NW',
          metrics: { UNIT_RENT: [{ value: '1500' }] },
        },
      ],
    };

    mockPrisma.report.findUnique.mockResolvedValue(publishedReport);
    mockPrisma.user.findUnique
      .mockResolvedValueOnce(userWithExportPermission) // permission check
      .mockResolvedValueOnce({ displayName: 'Alice' }); // watermark
    mockPrisma.exportRequest.create.mockResolvedValue({ id: 'exp-1', status: 'GENERATING' });
    mockPrisma.exportRequest.update.mockResolvedValue({ id: 'exp-1', status: 'READY', filePath: '/tmp/file.csv' });

    const result = await analyticsService.requestExport('report-1', 'CSV', 'user-creator');
    expect(result.status).toBe('READY');
    expect(mockAudit.create).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'REPORT_EXPORTED' }),
    );
  });
});
