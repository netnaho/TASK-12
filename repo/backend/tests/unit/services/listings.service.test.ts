/**
 * Unit tests for listingsService.
 * Covers: create, findAll (with filters), findById, update, getListingStats.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockPrisma, mockAudit } = vi.hoisted(() => ({
  mockPrisma: {
    property: { findUnique: vi.fn() },
    listing: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
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

import { listingsService } from '../../../src/modules/listings/listings.service';

beforeEach(() => {
  vi.resetAllMocks();
  mockAudit.create.mockResolvedValue({});
});

const property = { id: 'prop-1', name: 'Building A' };
const listing = {
  id: 'listing-1',
  propertyId: 'prop-1',
  unitNumber: '101',
  bedrooms: 2,
  bathrooms: 1,
  sqft: 850,
  rentPrice: 1500,
  isActive: true,
  listedAt: new Date('2024-01-01'),
  leasedAt: null,
  delistedAt: null,
};

// ─── create ───────────────────────────────────────────────────────────────────

describe('create', () => {
  it('creates listing and audits when property exists', async () => {
    mockPrisma.property.findUnique.mockResolvedValue(property);
    mockPrisma.listing.create.mockResolvedValue(listing);

    const result = await listingsService.create(
      {
        propertyId: 'prop-1',
        unitNumber: '101',
        bedrooms: 2,
        bathrooms: 1,
        sqft: 850,
        rentPrice: 1500,
        listedAt: '2024-01-01T00:00:00.000Z',
      },
      'actor-id',
    );

    expect(result.id).toBe('listing-1');
    expect(mockAudit.create).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'LISTING_CREATED' }),
    );
  });

  it('throws NotFoundError when property does not exist', async () => {
    mockPrisma.property.findUnique.mockResolvedValue(null);

    await expect(
      listingsService.create(
        { propertyId: 'ghost', unitNumber: '101', bedrooms: 1, bathrooms: 1, sqft: 500, rentPrice: 1000, listedAt: '2024-01-01T00:00:00.000Z' },
        'actor-id',
      ),
    ).rejects.toMatchObject({ statusCode: 404 });
  });
});

// ─── findAll ─────────────────────────────────────────────────────────────────

describe('findAll', () => {
  it('returns paginated list', async () => {
    mockPrisma.listing.findMany.mockResolvedValue([listing]);
    mockPrisma.listing.count.mockResolvedValue(1);

    const result = await listingsService.findAll({});
    expect(result.data).toHaveLength(1);
    expect(result.meta.total).toBe(1);
  });

  it('filters by propertyId', async () => {
    mockPrisma.listing.findMany.mockResolvedValue([]);
    mockPrisma.listing.count.mockResolvedValue(0);

    await listingsService.findAll({ propertyId: 'prop-1' });
    expect(mockPrisma.listing.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ propertyId: 'prop-1' }) }),
    );
  });

  it('filters by communityId', async () => {
    mockPrisma.listing.findMany.mockResolvedValue([]);
    mockPrisma.listing.count.mockResolvedValue(0);

    await listingsService.findAll({ communityId: 'comm-1' });
    expect(mockPrisma.listing.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ property: { communityId: 'comm-1' } }) }),
    );
  });

  it('filters by minRent and maxRent', async () => {
    mockPrisma.listing.findMany.mockResolvedValue([]);
    mockPrisma.listing.count.mockResolvedValue(0);

    await listingsService.findAll({ minRent: 1000, maxRent: 2000 });
    expect(mockPrisma.listing.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ rentPrice: { gte: 1000, lte: 2000 } }),
      }),
    );
  });

  it('filters by bedrooms', async () => {
    mockPrisma.listing.findMany.mockResolvedValue([]);
    mockPrisma.listing.count.mockResolvedValue(0);

    await listingsService.findAll({ bedrooms: 2 });
    expect(mockPrisma.listing.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ bedrooms: 2 }) }),
    );
  });

  it('filters by isActive', async () => {
    mockPrisma.listing.findMany.mockResolvedValue([]);
    mockPrisma.listing.count.mockResolvedValue(0);

    await listingsService.findAll({ isActive: true });
    expect(mockPrisma.listing.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ isActive: true }) }),
    );
  });
});

// ─── findById ────────────────────────────────────────────────────────────────

describe('findById', () => {
  it('returns listing when found', async () => {
    mockPrisma.listing.findUnique.mockResolvedValue({
      ...listing,
      property: { ...property, community: { id: 'comm-1', region: { id: 'r1' } } },
    });

    const result = await listingsService.findById('listing-1');
    expect(result.id).toBe('listing-1');
  });

  it('throws NotFoundError when listing not found', async () => {
    mockPrisma.listing.findUnique.mockResolvedValue(null);

    await expect(listingsService.findById('ghost')).rejects.toMatchObject({ statusCode: 404 });
  });
});

// ─── update ──────────────────────────────────────────────────────────────────

describe('update', () => {
  it('updates listing and creates LISTING_UPDATED audit', async () => {
    mockPrisma.listing.findUnique.mockResolvedValue(listing);
    mockPrisma.listing.update.mockResolvedValue({ ...listing, bedrooms: 3 });

    const result = await listingsService.update('listing-1', { bedrooms: 3 }, 'actor-id');
    expect(result.bedrooms).toBe(3);
    expect(mockAudit.create).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'LISTING_UPDATED' }),
    );
  });

  it('creates LISTING_LEASED audit when leasedAt is provided', async () => {
    mockPrisma.listing.findUnique.mockResolvedValue(listing);
    mockPrisma.listing.update.mockResolvedValue({ ...listing, leasedAt: new Date('2024-06-01') });

    await listingsService.update('listing-1', { leasedAt: '2024-06-01T00:00:00.000Z' }, 'actor-id');
    expect(mockAudit.create).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'LISTING_LEASED' }),
    );
  });

  it('creates LISTING_DELISTED audit when delistedAt is provided', async () => {
    mockPrisma.listing.findUnique.mockResolvedValue(listing);
    mockPrisma.listing.update.mockResolvedValue({ ...listing, delistedAt: new Date('2024-06-01') });

    await listingsService.update('listing-1', { delistedAt: '2024-06-01T00:00:00.000Z' }, 'actor-id');
    expect(mockAudit.create).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'LISTING_DELISTED' }),
    );
  });

  it('throws NotFoundError when listing does not exist', async () => {
    mockPrisma.listing.findUnique.mockResolvedValue(null);

    await expect(listingsService.update('ghost', {}, 'actor-id')).rejects.toMatchObject({ statusCode: 404 });
  });

  it('converts listedAt string to Date object', async () => {
    mockPrisma.listing.findUnique.mockResolvedValue(listing);
    mockPrisma.listing.update.mockResolvedValue(listing);

    await listingsService.update('listing-1', { listedAt: '2024-03-15T00:00:00.000Z' } as any, 'actor-id');
    expect(mockPrisma.listing.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ listedAt: expect.any(Date) }),
      }),
    );
  });

  it('clears leasedAt when null is passed', async () => {
    mockPrisma.listing.findUnique.mockResolvedValue(listing);
    mockPrisma.listing.update.mockResolvedValue({ ...listing, leasedAt: null });

    await listingsService.update('listing-1', { leasedAt: null } as any, 'actor-id');
    expect(mockPrisma.listing.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ leasedAt: null }) }),
    );
  });

  it('clears delistedAt when null is passed', async () => {
    mockPrisma.listing.findUnique.mockResolvedValue(listing);
    mockPrisma.listing.update.mockResolvedValue({ ...listing, delistedAt: null });

    await listingsService.update('listing-1', { delistedAt: null } as any, 'actor-id');
    expect(mockPrisma.listing.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ delistedAt: null }) }),
    );
  });
});

// ─── getListingStats ─────────────────────────────────────────────────────────

describe('getListingStats', () => {
  it('returns zeros when no listings exist', async () => {
    mockPrisma.listing.findMany.mockResolvedValue([]);

    const result = await listingsService.getListingStats();
    expect(result).toEqual({
      totalListings: 0,
      averageRent: 0,
      vacancyRate: 0,
      averageDaysOnMarket: 0,
    });
  });

  it('calculates stats correctly', async () => {
    const now = new Date();
    mockPrisma.listing.findMany.mockResolvedValue([
      { ...listing, rentPrice: 1000, isActive: true, listedAt: new Date(now.getTime() - 10 * 86400000), leasedAt: null },
      { ...listing, id: 'l2', rentPrice: 2000, isActive: false, listedAt: new Date(now.getTime() - 20 * 86400000), leasedAt: null },
    ]);

    const result = await listingsService.getListingStats();
    expect(result.totalListings).toBe(2);
    expect(result.averageRent).toBe(1500);
    expect(result.vacancyRate).toBe(0.5);
    expect(result.averageDaysOnMarket).toBeGreaterThan(0);
  });

  it('filters by propertyId when provided', async () => {
    mockPrisma.listing.findMany.mockResolvedValue([]);

    await listingsService.getListingStats('prop-1');
    expect(mockPrisma.listing.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { propertyId: 'prop-1' } }),
    );
  });
});
