import { prisma } from '../../config/database';
import { logger } from '../../logging/logger';
import { NotFoundError, ConflictError } from '../../shared/errors';
import { parsePagination, buildMeta } from '../../shared/utils/pagination.util';
import { auditService } from '../audit/audit.service';
import {
  CreateRegionBody,
  UpdateRegionBody,
  CreateCommunityBody,
  UpdateCommunityBody,
  CreatePropertyBody,
  UpdatePropertyBody,
} from './communities.schemas';

// ─── Regions ─────────────────────────────────────────────────────────

async function createRegion(data: CreateRegionBody) {
  const existing = await prisma.region.findUnique({ where: { name: data.name } });
  if (existing) {
    throw new ConflictError(`Region with name "${data.name}" already exists`);
  }

  const region = await prisma.region.create({ data });
  logger.info({ regionId: region.id }, 'Region created');
  return region;
}

async function listRegions(query: { page?: number; pageSize?: number }) {
  const { skip, take, page, pageSize } = parsePagination(query);

  const [regions, total] = await Promise.all([
    prisma.region.findMany({ skip, take, orderBy: { name: 'asc' } }),
    prisma.region.count(),
  ]);

  return { data: regions, meta: buildMeta(total, page, pageSize) };
}

async function getRegion(id: string) {
  const region = await prisma.region.findUnique({
    where: { id },
    include: { communities: true },
  });

  if (!region) {
    throw new NotFoundError('Region not found');
  }
  return region;
}

async function updateRegion(id: string, data: UpdateRegionBody) {
  await getRegion(id);

  if (data.name) {
    const existing = await prisma.region.findFirst({
      where: { name: data.name, NOT: { id } },
    });
    if (existing) {
      throw new ConflictError(`Region with name "${data.name}" already exists`);
    }
  }

  const region = await prisma.region.update({ where: { id }, data });
  logger.info({ regionId: id }, 'Region updated');
  return region;
}

async function deleteRegion(id: string) {
  await getRegion(id);

  const communityCount = await prisma.community.count({ where: { regionId: id } });
  if (communityCount > 0) {
    throw new ConflictError('Cannot delete region with existing communities');
  }

  await prisma.region.delete({ where: { id } });
  logger.info({ regionId: id }, 'Region deleted');
}

// ─── Communities ─────────────────────────────────────────────────────

async function createCommunity(data: CreateCommunityBody) {
  const region = await prisma.region.findUnique({ where: { id: data.regionId } });
  if (!region) {
    throw new NotFoundError('Region not found');
  }

  const community = await prisma.community.create({ data });
  logger.info({ communityId: community.id }, 'Community created');
  return community;
}

async function listCommunities(query: { page?: number; pageSize?: number; regionId?: string }) {
  const { skip, take, page, pageSize } = parsePagination(query);

  const where: any = {};
  if (query.regionId) {
    where.regionId = query.regionId;
  }

  const [communities, total] = await Promise.all([
    prisma.community.findMany({
      where,
      skip,
      take,
      orderBy: { name: 'asc' },
      include: { region: true },
    }),
    prisma.community.count({ where }),
  ]);

  return { data: communities, meta: buildMeta(total, page, pageSize) };
}

async function getCommunity(id: string) {
  const community = await prisma.community.findUnique({
    where: { id },
    include: { region: true, properties: true },
  });

  if (!community) {
    throw new NotFoundError('Community not found');
  }
  return community;
}

async function updateCommunity(id: string, data: UpdateCommunityBody) {
  await getCommunity(id);

  if (data.regionId) {
    const region = await prisma.region.findUnique({ where: { id: data.regionId } });
    if (!region) {
      throw new NotFoundError('Region not found');
    }
  }

  const community = await prisma.community.update({ where: { id }, data });
  logger.info({ communityId: id }, 'Community updated');
  return community;
}

async function deleteCommunity(id: string) {
  await getCommunity(id);

  const propertyCount = await prisma.property.count({ where: { communityId: id } });
  if (propertyCount > 0) {
    throw new ConflictError('Cannot delete community with existing properties');
  }

  await prisma.community.delete({ where: { id } });
  logger.info({ communityId: id }, 'Community deleted');
}

// ─── Properties ──────────────────────────────────────────────────────

async function createProperty(data: CreatePropertyBody, actorId: string) {
  const community = await prisma.community.findUnique({ where: { id: data.communityId } });
  if (!community) {
    throw new NotFoundError('Community not found');
  }

  const property = await prisma.property.create({ data });
  logger.info({ propertyId: property.id }, 'Property created');
  await auditService.create({
    action: 'PROPERTY_CREATED',
    actorId,
    entityType: 'property',
    entityId: property.id,
    afterJson: { name: data.name, communityId: data.communityId },
  });
  return property;
}

async function listProperties(query: { page?: number; pageSize?: number; communityId?: string }) {
  const { skip, take, page, pageSize } = parsePagination(query);

  const where: any = {};
  if (query.communityId) {
    where.communityId = query.communityId;
  }

  const [properties, total] = await Promise.all([
    prisma.property.findMany({
      where,
      skip,
      take,
      orderBy: { name: 'asc' },
      include: { community: { include: { region: true } } },
    }),
    prisma.property.count({ where }),
  ]);

  return { data: properties, meta: buildMeta(total, page, pageSize) };
}

async function getProperty(id: string) {
  const property = await prisma.property.findUnique({
    where: { id },
    include: {
      community: { include: { region: true } },
      listings: { where: { isActive: true }, orderBy: { listedAt: 'desc' } },
    },
  });

  if (!property) {
    throw new NotFoundError('Property not found');
  }
  return property;
}

async function updateProperty(id: string, data: UpdatePropertyBody, actorId: string) {
  const existing = await prisma.property.findUnique({ where: { id } });
  if (!existing) {
    throw new NotFoundError('Property not found');
  }

  if (data.communityId) {
    const community = await prisma.community.findUnique({ where: { id: data.communityId } });
    if (!community) {
      throw new NotFoundError('Community not found');
    }
  }

  const property = await prisma.property.update({ where: { id }, data });
  logger.info({ propertyId: id }, 'Property updated');
  await auditService.create({
    action: 'PROPERTY_UPDATED',
    actorId,
    entityType: 'property',
    entityId: id,
    afterJson: data,
  });
  return property;
}

export const communitiesService = {
  createRegion,
  listRegions,
  getRegion,
  updateRegion,
  deleteRegion,
  createCommunity,
  listCommunities,
  getCommunity,
  updateCommunity,
  deleteCommunity,
  createProperty,
  listProperties,
  getProperty,
  updateProperty,
};

