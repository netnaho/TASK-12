/**
 * Tests covering authorization, audit logging, and forwarding-prevention
 * for the analytics report sharing / export pipeline.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockPrisma, mockAuditCreate } = vi.hoisted(() => ({
  mockPrisma: {
    reportDefinition: { create: vi.fn(), findUnique: vi.fn(), update: vi.fn() },
    report: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
    reportShare: { findUnique: vi.fn(), upsert: vi.fn(), update: vi.fn() },
    exportRequest: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
    user: { findUnique: vi.fn() },
  },
  mockAuditCreate: vi.fn().mockResolvedValue({ id: BigInt(1) }),
}));

vi.mock('../../../src/config/database', () => ({ prisma: mockPrisma }));
vi.mock('../../../src/logging/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));
vi.mock('../../../src/modules/audit/audit.service', () => ({
  auditService: { create: mockAuditCreate },
}));

import { analyticsService } from '../../../src/modules/analytics/analytics.service';
import { ForbiddenError, NotFoundError, BadRequestError } from '../../../src/shared/errors';

beforeEach(() => {
  vi.resetAllMocks();
  mockAuditCreate.mockResolvedValue({ id: BigInt(1) });
});

// ─── createDefinition ────────────────────────────────────────────────────────

describe('analyticsService.createDefinition', () => {
  it('audits REPORT_DEFINITION_CREATED', async () => {
    mockPrisma.reportDefinition.create.mockResolvedValue({
      id: 'def-1',
      name: 'Daily Listings',
      frequency: 'DAILY',
    });

    await analyticsService.createDefinition(
      {
        name: 'Daily Listings',
        frequency: 'DAILY',
      } as any,
      'user-actor',
    );

    expect(mockAuditCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'REPORT_DEFINITION_CREATED',
        actorId: 'user-actor',
        entityType: 'report_definition',
        entityId: 'def-1',
      }),
    );
  });
});

// ─── shareReport authorization + audit ──────────────────────────────────────

describe('analyticsService.shareReport', () => {
  const baseReport = { id: 'rpt-1', createdBy: 'creator-id' };
  const targetUserWithReadPerm = {
    id: 'target-1',
    roles: [
      {
        role: {
          permissions: [
            { permission: { resource: 'reports', action: 'read' } },
          ],
        },
      },
    ],
  };
  const targetUserWithoutReadPerm = {
    id: 'target-2',
    roles: [{ role: { permissions: [] } }],
  };

  it('shares to a user with reports:read and audits REPORT_SHARED', async () => {
    mockPrisma.report.findUnique.mockResolvedValue(baseReport);
    mockPrisma.user.findUnique.mockResolvedValue(targetUserWithReadPerm);
    mockPrisma.reportShare.upsert.mockResolvedValue({
      id: 'share-1',
      reportId: 'rpt-1',
      userId: 'target-1',
    });

    await analyticsService.shareReport('rpt-1', 'target-1', 'creator-id');

    expect(mockAuditCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'REPORT_SHARED',
        entityId: 'rpt-1',
        metadata: expect.objectContaining({ targetUserId: 'target-1' }),
      }),
    );
  });

  it('blocks sharing to a user lacking reports:read', async () => {
    mockPrisma.report.findUnique.mockResolvedValue(baseReport);
    mockPrisma.user.findUnique.mockResolvedValue(targetUserWithoutReadPerm);

    await expect(
      analyticsService.shareReport('rpt-1', 'target-2', 'creator-id'),
    ).rejects.toThrow(ForbiddenError);

    // No share was created — and no audit log either
    expect(mockPrisma.reportShare.upsert).not.toHaveBeenCalled();
  });

  it('throws NotFoundError when report does not exist', async () => {
    mockPrisma.report.findUnique.mockResolvedValue(null);

    await expect(
      analyticsService.shareReport('missing', 'target-1', 'creator-id'),
    ).rejects.toThrow(NotFoundError);
  });

  it('throws NotFoundError when target user does not exist', async () => {
    mockPrisma.report.findUnique.mockResolvedValue(baseReport);
    mockPrisma.user.findUnique.mockResolvedValue(null);

    await expect(
      analyticsService.shareReport('rpt-1', 'missing', 'creator-id'),
    ).rejects.toThrow(NotFoundError);
  });
});

// ─── revokeShare audit ──────────────────────────────────────────────────────

describe('analyticsService.revokeShare', () => {
  it('audits REPORT_SHARE_REVOKED', async () => {
    mockPrisma.reportShare.findUnique.mockResolvedValue({
      id: 'share-1',
      reportId: 'rpt-1',
      userId: 'target-1',
      revokedAt: null,
    });
    mockPrisma.reportShare.update.mockResolvedValue({
      id: 'share-1',
      revokedAt: new Date(),
    });

    await analyticsService.revokeShare('rpt-1', 'target-1', 'creator-id');

    expect(mockAuditCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'REPORT_SHARE_REVOKED',
        entityId: 'rpt-1',
      }),
    );
  });

  it('throws when share is already revoked', async () => {
    mockPrisma.reportShare.findUnique.mockResolvedValue({
      id: 'share-1',
      revokedAt: new Date(),
    });

    await expect(
      analyticsService.revokeShare('rpt-1', 'target-1', 'creator-id'),
    ).rejects.toThrow(BadRequestError);
  });
});

// ─── requestExport authorization + audit ───────────────────────────────────

describe('analyticsService.requestExport — forwarding prevention', () => {
  function reportWithExportPerm(extra: any = {}) {
    return {
      id: 'rpt-1',
      createdBy: 'creator-id',
      status: 'PUBLISHED',
      definition: { name: 'Daily Listings' },
      shares: [],
      creator: { id: 'creator-id', displayName: 'Creator' },
      dataJson: [{ propertyName: 'P1', metrics: { UNIT_RENT: [{ value: '100' }] } }],
      generatedAt: new Date(),
      ...extra,
    };
  }

  function userWithRoles(perms: { resource: string; action: string }[]) {
    return {
      id: 'user-1',
      displayName: 'User One',
      roles: [
        {
          role: {
            permissions: perms.map((p) => ({ permission: p })),
          },
        },
      ],
    };
  }

  it('blocks export when user is not creator and has no share', async () => {
    mockPrisma.report.findUnique.mockResolvedValue(reportWithExportPerm());

    await expect(
      analyticsService.requestExport('rpt-1', 'CSV' as any, 'random-user'),
    ).rejects.toThrow(ForbiddenError);

    expect(mockAuditCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'REPORT_EXPORT_BLOCKED',
        actorId: 'random-user',
        metadata: expect.objectContaining({ reason: 'no_access' }),
      }),
    );
  });

  it('blocks export when user lacks reports:export permission', async () => {
    mockPrisma.report.findUnique.mockResolvedValue(reportWithExportPerm());
    mockPrisma.user.findUnique.mockResolvedValue(
      userWithRoles([{ resource: 'reports', action: 'read' }]), // read-only, no export
    );

    await expect(
      analyticsService.requestExport('rpt-1', 'CSV' as any, 'creator-id'),
    ).rejects.toThrow(ForbiddenError);

    expect(mockAuditCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'REPORT_EXPORT_BLOCKED',
        metadata: expect.objectContaining({ reason: 'missing_export_permission' }),
      }),
    );
  });

  it('blocks export of a non-PUBLISHED report', async () => {
    mockPrisma.report.findUnique.mockResolvedValue(
      reportWithExportPerm({ status: 'DRAFT' }),
    );
    mockPrisma.user.findUnique.mockResolvedValue(
      userWithRoles([
        { resource: 'reports', action: 'read' },
        { resource: 'reports', action: 'export' },
      ]),
    );

    await expect(
      analyticsService.requestExport('rpt-1', 'CSV' as any, 'creator-id'),
    ).rejects.toThrow(BadRequestError);
  });
});

// ─── downloadExport — forwarding prevention ─────────────────────────────────

describe('analyticsService.downloadExport — forwarding prevention', () => {
  it('blocks download by a user who is not the original requestor', async () => {
    mockPrisma.exportRequest.findUnique.mockResolvedValue({
      id: 'exp-1',
      requestedBy: 'creator-id',
      reportId: 'rpt-1',
      filePath: '/tmp/x.csv',
      format: 'CSV',
      status: 'READY',
      report: { createdBy: 'creator-id', shares: [] },
    });

    await expect(
      analyticsService.downloadExport('exp-1', 'someone-else'),
    ).rejects.toThrow(ForbiddenError);

    expect(mockAuditCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'REPORT_EXPORT_BLOCKED',
        metadata: expect.objectContaining({ reason: 'not_requestor' }),
      }),
    );
  });

  it('blocks download when share has been revoked since the request', async () => {
    mockPrisma.exportRequest.findUnique.mockResolvedValue({
      id: 'exp-1',
      requestedBy: 'shared-user',
      reportId: 'rpt-1',
      filePath: '/tmp/x.csv',
      format: 'CSV',
      status: 'READY',
      report: {
        createdBy: 'creator-id', // not the requestor
        shares: [], // share was revoked → shares list is empty when filtered by revokedAt: null
      },
    });

    await expect(
      analyticsService.downloadExport('exp-1', 'shared-user'),
    ).rejects.toThrow(ForbiddenError);

    expect(mockAuditCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'REPORT_EXPORT_BLOCKED',
        metadata: expect.objectContaining({ reason: 'share_revoked' }),
      }),
    );
  });

  it('audits successful download as REPORT_EXPORT_DOWNLOADED', async () => {
    mockPrisma.exportRequest.findUnique.mockResolvedValue({
      id: 'exp-1',
      requestedBy: 'creator-id',
      reportId: 'rpt-1',
      filePath: '/tmp/x.csv',
      format: 'CSV',
      status: 'READY',
      report: { createdBy: 'creator-id', shares: [] },
    });

    const result = await analyticsService.downloadExport('exp-1', 'creator-id');

    expect(result.filePath).toBe('/tmp/x.csv');
    expect(mockAuditCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'REPORT_EXPORT_DOWNLOADED',
        actorId: 'creator-id',
      }),
    );
  });

  it('throws BadRequestError if export is not READY', async () => {
    mockPrisma.exportRequest.findUnique.mockResolvedValue({
      id: 'exp-1',
      requestedBy: 'creator-id',
      reportId: 'rpt-1',
      filePath: null,
      format: 'CSV',
      status: 'GENERATING',
      report: { createdBy: 'creator-id', shares: [] },
    });

    await expect(
      analyticsService.downloadExport('exp-1', 'creator-id'),
    ).rejects.toThrow(BadRequestError);
  });
});

// ─── archiveReport ──────────────────────────────────────────────────────────

describe('analyticsService.archiveReport', () => {
  it('archives a report owned by the actor and audits REPORT_ARCHIVED', async () => {
    mockPrisma.report.findUnique.mockResolvedValue({
      id: 'rpt-1',
      createdBy: 'creator-id',
      status: 'PUBLISHED',
    });
    mockPrisma.report.update.mockResolvedValue({
      id: 'rpt-1',
      status: 'ARCHIVED',
    });

    const result = await analyticsService.archiveReport('rpt-1', 'creator-id', []);

    expect(result.status).toBe('ARCHIVED');
    expect(mockAuditCreate).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'REPORT_ARCHIVED', entityId: 'rpt-1' }),
    );
  });

  it('allows SYSTEM_ADMIN to archive someone else\'s report', async () => {
    mockPrisma.report.findUnique.mockResolvedValue({
      id: 'rpt-1',
      createdBy: 'someone-else',
      status: 'PUBLISHED',
    });
    mockPrisma.report.update.mockResolvedValue({
      id: 'rpt-1',
      status: 'ARCHIVED',
    });

    await expect(
      analyticsService.archiveReport('rpt-1', 'admin-id', ['SYSTEM_ADMIN']),
    ).resolves.toBeDefined();
  });

  it('blocks non-creator non-admin from archiving', async () => {
    mockPrisma.report.findUnique.mockResolvedValue({
      id: 'rpt-1',
      createdBy: 'someone-else',
      status: 'PUBLISHED',
    });

    await expect(
      analyticsService.archiveReport('rpt-1', 'random-user', ['ANALYST']),
    ).rejects.toThrow(ForbiddenError);
  });

  it('throws BadRequestError when already archived', async () => {
    mockPrisma.report.findUnique.mockResolvedValue({
      id: 'rpt-1',
      createdBy: 'creator-id',
      status: 'ARCHIVED',
    });

    await expect(
      analyticsService.archiveReport('rpt-1', 'creator-id', []),
    ).rejects.toThrow(BadRequestError);
  });

  it('throws NotFoundError for missing report', async () => {
    mockPrisma.report.findUnique.mockResolvedValue(null);

    await expect(
      analyticsService.archiveReport('missing', 'creator-id', []),
    ).rejects.toThrow(NotFoundError);
  });
});
