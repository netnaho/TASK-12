/**
 * Unit tests for the metrics service layer.
 * All Prisma calls and external dependencies are mocked.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockPrisma, mockAudit } = vi.hoisted(() => ({
  mockPrisma: {
    metricDefinition: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    metricDefinitionVersion: {
      update: vi.fn(),
      create: vi.fn(),
    },
    metricValue: {
      findMany: vi.fn(),
      createMany: vi.fn(),
    },
    metricCalculationJob: {
      create: vi.fn(),
      update: vi.fn(),
    },
    property: {
      findMany: vi.fn(),
    },
    listing: {
      findMany: vi.fn(),
    },
    $transaction: vi.fn((fn: any) => fn(mockPrismaInner)),
  },
  mockAudit: { create: vi.fn() },
}));

// Inner prisma ref for transaction callbacks
const mockPrismaInner = {
  metricDefinitionVersion: {
    update: vi.fn(),
    create: vi.fn(),
  },
};

vi.mock('../../../src/config/database', () => ({ prisma: mockPrisma }));
vi.mock('../../../src/logging/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));
vi.mock('../../../src/modules/audit/audit.service', () => ({
  auditService: mockAudit,
}));

import { metricsService } from '../../../src/modules/metrics/metrics.service';
const { listDefinitions, getDefinition, createDefinition, createVersion } = metricsService;

beforeEach(() => {
  vi.resetAllMocks();
  mockPrisma.$transaction.mockImplementation((fn: any) => fn(mockPrismaInner));
  mockAudit.create.mockResolvedValue({});
});

describe('listDefinitions', () => {
  it('returns definitions ordered by name', async () => {
    const defs = [
      { id: '1', name: 'Unit Rent', metricType: 'UNIT_RENT', versions: [] },
    ];
    mockPrisma.metricDefinition.findMany.mockResolvedValue(defs);

    const result = await listDefinitions();
    expect(result).toEqual(defs);
    expect(mockPrisma.metricDefinition.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { name: 'asc' } }),
    );
  });
});

describe('getDefinition', () => {
  it('returns definition with versions when found', async () => {
    const def = { id: 'def-1', name: 'Unit Rent', versions: [] };
    mockPrisma.metricDefinition.findUnique.mockResolvedValue(def);

    const result = await getDefinition('def-1');
    expect(result).toEqual(def);
  });

  it('throws NotFoundError when definition does not exist', async () => {
    mockPrisma.metricDefinition.findUnique.mockResolvedValue(null);

    await expect(getDefinition('non-existent')).rejects.toMatchObject({
      statusCode: 404,
    });
  });
});

describe('createDefinition', () => {
  it('creates a definition and writes an audit log', async () => {
    const created = { id: 'def-new', metricType: 'UNIT_RENT', name: 'Rent' };
    mockPrisma.metricDefinition.create.mockResolvedValue(created);

    const result = await createDefinition(
      { metricType: 'UNIT_RENT', name: 'Rent' },
      'actor-1',
    );

    expect(result).toEqual(created);
    expect(mockAudit.create).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'METRIC_DEF_CREATED',
        actorId: 'actor-1',
        entityId: 'def-new',
      }),
    );
  });
});

describe('createVersion', () => {
  it('creates first version when no prior versions exist', async () => {
    mockPrisma.metricDefinition.findUnique.mockResolvedValue({
      id: 'def-1',
      versions: [],
    });

    const newVersion = { id: 'v1', versionNumber: 1 };
    mockPrismaInner.metricDefinitionVersion.create.mockResolvedValue(newVersion);

    const result = await createVersion(
      {
        metricDefinitionId: 'def-1',
        formulaJson: { formula: 'avg(rent)' },
        effectiveFrom: '2024-01-01T00:00:00.000Z',
      },
      'actor-1',
    );

    expect(result.versionNumber).toBe(1);
    expect(mockAudit.create).toHaveBeenCalled();
  });

  it('increments version number when prior version exists', async () => {
    mockPrisma.metricDefinition.findUnique.mockResolvedValue({
      id: 'def-1',
      versions: [{ id: 'v1', versionNumber: 3, effectiveTo: null }],
    });

    const newVersion = { id: 'v2', versionNumber: 4 };
    mockPrismaInner.metricDefinitionVersion.update.mockResolvedValue({});
    mockPrismaInner.metricDefinitionVersion.create.mockResolvedValue(newVersion);

    const result = await createVersion(
      {
        metricDefinitionId: 'def-1',
        formulaJson: { formula: 'avg(rent)' },
        effectiveFrom: '2024-06-01T00:00:00.000Z',
      },
      'actor-1',
    );

    expect(result.versionNumber).toBe(4);
    // Previous version's effectiveTo was set
    expect(mockPrismaInner.metricDefinitionVersion.update).toHaveBeenCalled();
  });

  it('throws NotFoundError when definition does not exist', async () => {
    mockPrisma.metricDefinition.findUnique.mockResolvedValue(null);

    await expect(
      createVersion(
        {
          metricDefinitionId: 'non-existent',
          formulaJson: {},
          effectiveFrom: '2024-01-01T00:00:00.000Z',
        },
        'actor-1',
      ),
    ).rejects.toMatchObject({ statusCode: 404 });
  });
});
