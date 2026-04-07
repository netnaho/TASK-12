import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockPrisma, mockAuditCreate } = vi.hoisted(() => ({
  mockPrisma: {
    savedView: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
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

import { savedViewsService } from '../../../src/modules/analytics/saved-views.service';
import { ForbiddenError, NotFoundError } from '../../../src/shared/errors';

beforeEach(() => {
  vi.resetAllMocks();
  mockAuditCreate.mockResolvedValue({ id: BigInt(1) });
});

const baseView = {
  id: 'view-1',
  name: 'My Region Pivot',
  ownerId: 'user-1',
  viewType: 'PIVOT',
  config: { dimensions: ['region'], measures: ['count'] },
  isPublic: false,
};

// ─── listSavedViews ──────────────────────────────────────────────────────────

describe('savedViewsService.listSavedViews', () => {
  it('returns own + public views by default (scope=all)', async () => {
    mockPrisma.savedView.findMany.mockResolvedValue([baseView]);
    mockPrisma.savedView.count.mockResolvedValue(1);

    await savedViewsService.listSavedViews('user-1', [], { scope: 'all' } as any);

    const findArgs = mockPrisma.savedView.findMany.mock.calls[0]?.[0];
    expect(findArgs.where.OR).toEqual([
      { ownerId: 'user-1' },
      { isPublic: true },
    ]);
  });

  it('filters to own only when scope=mine', async () => {
    mockPrisma.savedView.findMany.mockResolvedValue([]);
    mockPrisma.savedView.count.mockResolvedValue(0);

    await savedViewsService.listSavedViews('user-1', [], { scope: 'mine' } as any);

    const findArgs = mockPrisma.savedView.findMany.mock.calls[0]?.[0];
    expect(findArgs.where.ownerId).toBe('user-1');
  });

  it('filters to public only when scope=public', async () => {
    mockPrisma.savedView.findMany.mockResolvedValue([]);
    mockPrisma.savedView.count.mockResolvedValue(0);

    await savedViewsService.listSavedViews('user-1', [], { scope: 'public' } as any);

    const findArgs = mockPrisma.savedView.findMany.mock.calls[0]?.[0];
    expect(findArgs.where.isPublic).toBe(true);
  });

  it('filters by viewType', async () => {
    mockPrisma.savedView.findMany.mockResolvedValue([]);
    mockPrisma.savedView.count.mockResolvedValue(0);

    await savedViewsService.listSavedViews('user-1', [], {
      scope: 'all',
      viewType: 'PIVOT',
    } as any);

    const findArgs = mockPrisma.savedView.findMany.mock.calls[0]?.[0];
    expect(findArgs.where.viewType).toBe('PIVOT');
  });
});

// ─── getSavedView ────────────────────────────────────────────────────────────

describe('savedViewsService.getSavedView', () => {
  it('owner can read their own private view', async () => {
    mockPrisma.savedView.findUnique.mockResolvedValue(baseView);

    const result = await savedViewsService.getSavedView('view-1', 'user-1', []);

    expect(result.id).toBe('view-1');
  });

  it('non-owner CANNOT read a private view', async () => {
    mockPrisma.savedView.findUnique.mockResolvedValue(baseView);

    await expect(
      savedViewsService.getSavedView('view-1', 'other-user', ['ANALYST']),
    ).rejects.toThrow(ForbiddenError);
  });

  it('non-owner CAN read a public view', async () => {
    mockPrisma.savedView.findUnique.mockResolvedValue({
      ...baseView,
      isPublic: true,
    });

    const result = await savedViewsService.getSavedView('view-1', 'other-user', []);

    expect(result.isPublic).toBe(true);
  });

  it('SYSTEM_ADMIN can read any view', async () => {
    mockPrisma.savedView.findUnique.mockResolvedValue(baseView);

    const result = await savedViewsService.getSavedView('view-1', 'admin-user', [
      'SYSTEM_ADMIN',
    ]);

    expect(result.id).toBe('view-1');
  });

  it('throws NotFoundError for missing view', async () => {
    mockPrisma.savedView.findUnique.mockResolvedValue(null);

    await expect(
      savedViewsService.getSavedView('missing', 'user-1', []),
    ).rejects.toThrow(NotFoundError);
  });
});

// ─── createSavedView ─────────────────────────────────────────────────────────

describe('savedViewsService.createSavedView', () => {
  it('creates a saved view and audits SAVED_VIEW_CREATED', async () => {
    mockPrisma.savedView.create.mockResolvedValue({
      ...baseView,
      id: 'view-new',
    });

    await savedViewsService.createSavedView(
      {
        name: 'My View',
        viewType: 'PIVOT',
        config: { dimensions: ['region'] },
      } as any,
      'user-1',
    );

    expect(mockPrisma.savedView.create).toHaveBeenCalled();
    expect(mockAuditCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'SAVED_VIEW_CREATED',
        actorId: 'user-1',
      }),
    );
  });
});

// ─── updateSavedView ─────────────────────────────────────────────────────────

describe('savedViewsService.updateSavedView', () => {
  it('owner can update', async () => {
    mockPrisma.savedView.findUnique.mockResolvedValue(baseView);
    mockPrisma.savedView.update.mockResolvedValue({
      ...baseView,
      name: 'Renamed',
    });

    const result = await savedViewsService.updateSavedView(
      'view-1',
      { name: 'Renamed' } as any,
      'user-1',
      [],
    );

    expect(result.name).toBe('Renamed');
    expect(mockAuditCreate).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'SAVED_VIEW_UPDATED' }),
    );
  });

  it('non-owner CANNOT update', async () => {
    mockPrisma.savedView.findUnique.mockResolvedValue(baseView);

    await expect(
      savedViewsService.updateSavedView('view-1', { name: 'X' } as any, 'other', []),
    ).rejects.toThrow(ForbiddenError);
  });

  it('SYSTEM_ADMIN can update anyone\'s view', async () => {
    mockPrisma.savedView.findUnique.mockResolvedValue(baseView);
    mockPrisma.savedView.update.mockResolvedValue({ ...baseView, name: 'X' });

    await expect(
      savedViewsService.updateSavedView('view-1', { name: 'X' } as any, 'admin', [
        'SYSTEM_ADMIN',
      ]),
    ).resolves.toBeDefined();
  });

  it('throws NotFoundError when view does not exist', async () => {
    mockPrisma.savedView.findUnique.mockResolvedValue(null);

    await expect(
      savedViewsService.updateSavedView('ghost', {} as any, 'user-1', []),
    ).rejects.toThrow(NotFoundError);
  });

  it('updates all optional fields when provided', async () => {
    mockPrisma.savedView.findUnique.mockResolvedValue(baseView);
    mockPrisma.savedView.update.mockResolvedValue({ ...baseView, name: 'New', description: 'Desc', isPublic: true });

    const result = await savedViewsService.updateSavedView(
      'view-1',
      { name: 'New', description: 'Desc', config: { cols: [] }, isPublic: true } as any,
      'user-1',
      [],
    );

    expect(result.name).toBe('New');
  });
});

// ─── deleteSavedView ─────────────────────────────────────────────────────────

describe('savedViewsService.deleteSavedView', () => {
  it('owner can delete and audit', async () => {
    mockPrisma.savedView.findUnique.mockResolvedValue(baseView);
    mockPrisma.savedView.delete.mockResolvedValue({});

    await savedViewsService.deleteSavedView('view-1', 'user-1', []);

    expect(mockPrisma.savedView.delete).toHaveBeenCalled();
    expect(mockAuditCreate).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'SAVED_VIEW_DELETED' }),
    );
  });

  it('non-owner CANNOT delete', async () => {
    mockPrisma.savedView.findUnique.mockResolvedValue(baseView);

    await expect(
      savedViewsService.deleteSavedView('view-1', 'other', ['ANALYST']),
    ).rejects.toThrow(ForbiddenError);
  });

  it('throws NotFoundError when view does not exist', async () => {
    mockPrisma.savedView.findUnique.mockResolvedValue(null);

    await expect(
      savedViewsService.deleteSavedView('ghost', 'user-1', []),
    ).rejects.toThrow(NotFoundError);
  });
});
