import { Prisma } from '@prisma/client';
import { prisma } from '../../config/database';
import { logger } from '../../logging/logger';
import { NotFoundError } from '../../shared/errors';
import { parsePagination, buildMeta } from '../../shared/utils/pagination.util';
import { auditService } from '../audit/audit.service';
import { CreateListingBody, UpdateListingBody, ListListingsQuery } from './listings.schemas';

async function create(data: CreateListingBody, actorId: string) {
  const property = await prisma.property.findUnique({ where: { id: data.propertyId } });
  if (!property) {
    throw new NotFoundError('Property not found');
  }

  const listing = await prisma.listing.create({
    data: {
      propertyId: data.propertyId,
      unitNumber: data.unitNumber,
      bedrooms: data.bedrooms,
      bathrooms: data.bathrooms,
      sqft: data.sqft,
      rentPrice: data.rentPrice,
      listedAt: new Date(data.listedAt),
    },
  });

  logger.info({ listingId: listing.id }, 'Listing created');
  await auditService.create({
    action: 'LISTING_CREATED',
    actorId,
    entityType: 'listing',
    entityId: listing.id,
    afterJson: { propertyId: data.propertyId, unitNumber: data.unitNumber, rentPrice: data.rentPrice },
  });
  return listing;
}

async function findAll(query: ListListingsQuery) {
  const { skip, take, page, pageSize } = parsePagination(query);

  const where: Prisma.ListingWhereInput = {};

  if (query.propertyId) {
    where.propertyId = query.propertyId;
  }

  if (query.communityId) {
    where.property = { communityId: query.communityId };
  }

  if (query.minRent !== undefined || query.maxRent !== undefined) {
    where.rentPrice = {};
    if (query.minRent !== undefined) {
      where.rentPrice.gte = query.minRent;
    }
    if (query.maxRent !== undefined) {
      where.rentPrice.lte = query.maxRent;
    }
  }

  if (query.bedrooms !== undefined) {
    where.bedrooms = query.bedrooms;
  }

  if (query.isActive !== undefined) {
    where.isActive = query.isActive;
  }

  const [listings, total] = await Promise.all([
    prisma.listing.findMany({
      where,
      skip,
      take,
      orderBy: { listedAt: 'desc' },
      include: { property: { include: { community: true } } },
    }),
    prisma.listing.count({ where }),
  ]);

  return { data: listings, meta: buildMeta(total, page, pageSize) };
}

async function findById(id: string) {
  const listing = await prisma.listing.findUnique({
    where: { id },
    include: {
      property: {
        include: { community: { include: { region: true } } },
      },
    },
  });

  if (!listing) {
    throw new NotFoundError('Listing not found');
  }
  return listing;
}

async function update(id: string, data: UpdateListingBody, actorId: string) {
  const existing = await prisma.listing.findUnique({ where: { id } });
  if (!existing) {
    throw new NotFoundError('Listing not found');
  }

  const updateData: any = { ...data };

  // Convert date strings to Date objects
  if (data.listedAt) updateData.listedAt = new Date(data.listedAt);
  if (data.leasedAt) updateData.leasedAt = new Date(data.leasedAt);
  if (data.leasedAt === null) updateData.leasedAt = null;
  if (data.delistedAt) updateData.delistedAt = new Date(data.delistedAt);
  if (data.delistedAt === null) updateData.delistedAt = null;

  const listing = await prisma.listing.update({ where: { id }, data: updateData });
  logger.info({ listingId: id }, 'Listing updated');

  const action = data.leasedAt ? 'LISTING_LEASED' : data.delistedAt ? 'LISTING_DELISTED' : 'LISTING_UPDATED';
  await auditService.create({
    action,
    actorId,
    entityType: 'listing',
    entityId: id,
    beforeJson: { rentPrice: existing.rentPrice, isActive: existing.isActive },
    afterJson: data,
  });
  return listing;
}

async function getListingStats(propertyId?: string) {
  const where: Prisma.ListingWhereInput = {};
  if (propertyId) {
    where.propertyId = propertyId;
  }

  const listings = await prisma.listing.findMany({ where });

  const total = listings.length;
  if (total === 0) {
    return {
      totalListings: 0,
      averageRent: 0,
      vacancyRate: 0,
      averageDaysOnMarket: 0,
    };
  }

  const rentPrices = listings.map((l) => Number(l.rentPrice));
  const averageRent = rentPrices.reduce((sum, p) => sum + p, 0) / total;

  const activeCount = listings.filter((l) => l.isActive).length;
  const vacancyRate = total > 0 ? activeCount / total : 0;

  const now = new Date();
  const daysOnMarket = listings.map((l) => {
    const end = l.leasedAt || now;
    const diffMs = end.getTime() - l.listedAt.getTime();
    return Math.max(0, diffMs / (1000 * 60 * 60 * 24));
  });
  const averageDaysOnMarket =
    daysOnMarket.reduce((sum, d) => sum + d, 0) / daysOnMarket.length;

  return {
    totalListings: total,
    averageRent: Math.round(averageRent * 100) / 100,
    vacancyRate: Math.round(vacancyRate * 10000) / 10000,
    averageDaysOnMarket: Math.round(averageDaysOnMarket * 100) / 100,
  };
}

export const listingsService = {
  create,
  findAll,
  findById,
  update,
  getListingStats,
};

