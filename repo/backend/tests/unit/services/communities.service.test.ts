/**
 * Unit tests for communitiesService.
 * Covers: regions (create/list/get/update/delete), communities, properties.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockPrisma, mockAudit } = vi.hoisted(() => ({
  mockPrisma: {
    region: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    community: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    property: {
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

import { communitiesService } from '../../../src/modules/communities/communities.service';

beforeEach(() => {
  vi.resetAllMocks();
  mockAudit.create.mockResolvedValue({});
});

const region = { id: 'region-1', name: 'Pacific Northwest' };
const community = { id: 'comm-1', name: 'Sunrise Villas', regionId: 'region-1', region };
const property = { id: 'prop-1', name: 'Building A', communityId: 'comm-1' };

// ─── Regions ─────────────────────────────────────────────────────────────────

describe('createRegion', () => {
  it('creates and returns a new region', async () => {
    mockPrisma.region.findUnique.mockResolvedValue(null);
    mockPrisma.region.create.mockResolvedValue(region);

    const result = await communitiesService.createRegion({ name: 'Pacific Northwest' });
    expect(result).toEqual(region);
    expect(mockPrisma.region.create).toHaveBeenCalled();
  });

  it('throws ConflictError when region name already exists', async () => {
    mockPrisma.region.findUnique.mockResolvedValue(region);

    await expect(communitiesService.createRegion({ name: 'Pacific Northwest' }))
      .rejects.toMatchObject({ statusCode: 409 });
  });
});

describe('listRegions', () => {
  it('returns paginated list', async () => {
    mockPrisma.region.findMany.mockResolvedValue([region]);
    mockPrisma.region.count.mockResolvedValue(1);

    const result = await communitiesService.listRegions({ page: 1, pageSize: 20 });
    expect(result.data).toHaveLength(1);
    expect(result.meta.total).toBe(1);
  });
});

describe('getRegion', () => {
  it('returns region with communities when found', async () => {
    mockPrisma.region.findUnique.mockResolvedValue({ ...region, communities: [] });

    const result = await communitiesService.getRegion('region-1');
    expect(result.id).toBe('region-1');
  });

  it('throws NotFoundError when region does not exist', async () => {
    mockPrisma.region.findUnique.mockResolvedValue(null);

    await expect(communitiesService.getRegion('ghost')).rejects.toMatchObject({ statusCode: 404 });
  });
});

describe('updateRegion', () => {
  it('updates region when no name conflict', async () => {
    mockPrisma.region.findUnique.mockResolvedValue({ ...region, communities: [] });
    mockPrisma.region.findFirst.mockResolvedValue(null);
    mockPrisma.region.update.mockResolvedValue({ ...region, name: 'New Name' });

    const result = await communitiesService.updateRegion('region-1', { name: 'New Name' });
    expect(result.name).toBe('New Name');
  });

  it('throws ConflictError when new name already taken by another region', async () => {
    mockPrisma.region.findUnique.mockResolvedValue({ ...region, communities: [] });
    mockPrisma.region.findFirst.mockResolvedValue({ id: 'region-2', name: 'New Name' });

    await expect(communitiesService.updateRegion('region-1', { name: 'New Name' }))
      .rejects.toMatchObject({ statusCode: 409 });
  });

  it('throws NotFoundError when region does not exist', async () => {
    mockPrisma.region.findUnique.mockResolvedValue(null);

    await expect(communitiesService.updateRegion('ghost', { name: 'X' }))
      .rejects.toMatchObject({ statusCode: 404 });
  });
});

describe('deleteRegion', () => {
  it('deletes region when no communities exist', async () => {
    mockPrisma.region.findUnique.mockResolvedValue({ ...region, communities: [] });
    mockPrisma.community.count.mockResolvedValue(0);
    mockPrisma.region.delete.mockResolvedValue(region);

    await communitiesService.deleteRegion('region-1');
    expect(mockPrisma.region.delete).toHaveBeenCalled();
  });

  it('throws ConflictError when region has communities', async () => {
    mockPrisma.region.findUnique.mockResolvedValue({ ...region, communities: [] });
    mockPrisma.community.count.mockResolvedValue(2);

    await expect(communitiesService.deleteRegion('region-1')).rejects.toMatchObject({ statusCode: 409 });
  });
});

// ─── Communities ─────────────────────────────────────────────────────────────

describe('createCommunity', () => {
  it('creates community when region exists', async () => {
    mockPrisma.region.findUnique.mockResolvedValue(region);
    mockPrisma.community.create.mockResolvedValue(community);

    const result = await communitiesService.createCommunity({
      name: 'Sunrise Villas',
      regionId: 'region-1',
    });
    expect(result.id).toBe('comm-1');
  });

  it('throws NotFoundError when region does not exist', async () => {
    mockPrisma.region.findUnique.mockResolvedValue(null);

    await expect(communitiesService.createCommunity({ name: 'X', regionId: 'ghost' }))
      .rejects.toMatchObject({ statusCode: 404 });
  });
});

describe('listCommunities', () => {
  it('returns paginated communities', async () => {
    mockPrisma.community.findMany.mockResolvedValue([community]);
    mockPrisma.community.count.mockResolvedValue(1);

    const result = await communitiesService.listCommunities({});
    expect(result.data).toHaveLength(1);
  });

  it('filters by regionId when provided', async () => {
    mockPrisma.community.findMany.mockResolvedValue([]);
    mockPrisma.community.count.mockResolvedValue(0);

    await communitiesService.listCommunities({ regionId: 'region-1' });
    expect(mockPrisma.community.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { regionId: 'region-1' } }),
    );
  });
});

describe('getCommunity', () => {
  it('returns community with related data', async () => {
    mockPrisma.community.findUnique.mockResolvedValue({ ...community, properties: [] });

    const result = await communitiesService.getCommunity('comm-1');
    expect(result.id).toBe('comm-1');
  });

  it('throws NotFoundError when community not found', async () => {
    mockPrisma.community.findUnique.mockResolvedValue(null);

    await expect(communitiesService.getCommunity('ghost')).rejects.toMatchObject({ statusCode: 404 });
  });
});

describe('updateCommunity', () => {
  it('updates community', async () => {
    mockPrisma.community.findUnique.mockResolvedValue({ ...community, properties: [] });
    mockPrisma.community.update.mockResolvedValue({ ...community, name: 'Updated' });

    const result = await communitiesService.updateCommunity('comm-1', { name: 'Updated' });
    expect(result.name).toBe('Updated');
  });

  it('validates new regionId when provided', async () => {
    mockPrisma.community.findUnique.mockResolvedValue({ ...community, properties: [] });
    mockPrisma.region.findUnique.mockResolvedValue(null);

    await expect(communitiesService.updateCommunity('comm-1', { regionId: 'ghost' }))
      .rejects.toMatchObject({ statusCode: 404 });
  });
});

describe('deleteCommunity', () => {
  it('deletes community when no properties exist', async () => {
    mockPrisma.community.findUnique.mockResolvedValue({ ...community, properties: [] });
    mockPrisma.property.count.mockResolvedValue(0);
    mockPrisma.community.delete.mockResolvedValue(community);

    await communitiesService.deleteCommunity('comm-1');
    expect(mockPrisma.community.delete).toHaveBeenCalled();
  });

  it('throws ConflictError when community has properties', async () => {
    mockPrisma.community.findUnique.mockResolvedValue({ ...community, properties: [] });
    mockPrisma.property.count.mockResolvedValue(3);

    await expect(communitiesService.deleteCommunity('comm-1')).rejects.toMatchObject({ statusCode: 409 });
  });
});

// ─── Properties ──────────────────────────────────────────────────────────────

describe('createProperty', () => {
  it('creates property and audits when community exists', async () => {
    mockPrisma.community.findUnique.mockResolvedValue(community);
    mockPrisma.property.create.mockResolvedValue(property);

    const result = await communitiesService.createProperty(
      { name: 'Building A', communityId: 'comm-1', address: '1 Main St' },
      'actor-id',
    );
    expect(result.id).toBe('prop-1');
    expect(mockAudit.create).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'PROPERTY_CREATED' }),
    );
  });

  it('throws NotFoundError when community does not exist', async () => {
    mockPrisma.community.findUnique.mockResolvedValue(null);

    await expect(
      communitiesService.createProperty({ name: 'X', communityId: 'ghost', address: 'Y' }, 'actor-id'),
    ).rejects.toMatchObject({ statusCode: 404 });
  });
});

describe('listProperties', () => {
  it('returns paginated properties', async () => {
    mockPrisma.property.findMany.mockResolvedValue([property]);
    mockPrisma.property.count.mockResolvedValue(1);

    const result = await communitiesService.listProperties({});
    expect(result.data).toHaveLength(1);
  });

  it('filters by communityId when provided', async () => {
    mockPrisma.property.findMany.mockResolvedValue([]);
    mockPrisma.property.count.mockResolvedValue(0);

    await communitiesService.listProperties({ communityId: 'comm-1' });
    expect(mockPrisma.property.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { communityId: 'comm-1' } }),
    );
  });
});

describe('getProperty', () => {
  it('returns property when found', async () => {
    mockPrisma.property.findUnique.mockResolvedValue({
      ...property,
      community: { ...community, region },
      listings: [],
    });

    const result = await communitiesService.getProperty('prop-1');
    expect(result.id).toBe('prop-1');
  });

  it('throws NotFoundError when property not found', async () => {
    mockPrisma.property.findUnique.mockResolvedValue(null);

    await expect(communitiesService.getProperty('ghost')).rejects.toMatchObject({ statusCode: 404 });
  });
});

describe('updateProperty', () => {
  it('updates property and audits the change', async () => {
    mockPrisma.property.findUnique.mockResolvedValue(property);
    mockPrisma.property.update.mockResolvedValue({ ...property, name: 'Updated' });

    const result = await communitiesService.updateProperty(
      'prop-1',
      { name: 'Updated' },
      'actor-id',
    );
    expect(result.name).toBe('Updated');
    expect(mockAudit.create).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'PROPERTY_UPDATED' }),
    );
  });

  it('throws NotFoundError when property does not exist', async () => {
    mockPrisma.property.findUnique.mockResolvedValue(null);

    await expect(communitiesService.updateProperty('ghost', { name: 'X' }, 'actor')).rejects.toMatchObject({
      statusCode: 404,
    });
  });

  it('throws NotFoundError when new communityId does not exist', async () => {
    mockPrisma.property.findUnique.mockResolvedValue(property);
    mockPrisma.community.findUnique.mockResolvedValue(null);

    await expect(
      communitiesService.updateProperty('prop-1', { communityId: 'ghost' }, 'actor'),
    ).rejects.toMatchObject({ statusCode: 404 });
  });
});
