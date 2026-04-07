/**
 * SavedView module — reusable filter / pivot configurations.
 *
 * Authorization rules:
 *  - Anyone with reports:read can LIST public views and their own views.
 *  - Owner can read/update/delete their own views.
 *  - Public views are read-only for non-owners.
 *  - Only the owner (or SYSTEM_ADMIN) can mutate a view.
 *
 * All mutations write an audit log entry (CREATED/UPDATED/DELETED).
 */
import { Prisma, SavedViewType } from '@prisma/client';
import { prisma } from '../../config/database';
import { logger } from '../../logging/logger';
import { ForbiddenError, NotFoundError } from '../../shared/errors';
import { parsePagination, buildMeta } from '../../shared/utils/pagination.util';
import { auditService } from '../audit/audit.service';
import { ROLES } from '../../shared/constants/roles.constant';
import {
  CreateSavedViewBody,
  UpdateSavedViewBody,
  ListSavedViewsQuery,
} from './saved-views.schemas';

function isAdmin(roles: string[]): boolean {
  return roles.includes(ROLES.SYSTEM_ADMIN);
}

async function listSavedViews(
  userId: string,
  userRoles: string[],
  query: ListSavedViewsQuery,
) {
  const { skip, take, page, pageSize } = parsePagination(query);

  const where: Prisma.SavedViewWhereInput = {};

  if (query.viewType) {
    where.viewType = query.viewType as SavedViewType;
  }

  // Visibility filter
  if (query.scope === 'mine') {
    where.ownerId = userId;
  } else if (query.scope === 'public') {
    where.isPublic = true;
  } else {
    // "all" — own + public
    where.OR = [{ ownerId: userId }, { isPublic: true }];
  }

  const [views, total] = await Promise.all([
    prisma.savedView.findMany({
      where,
      skip,
      take,
      orderBy: { updatedAt: 'desc' },
      include: { owner: { select: { id: true, displayName: true } } },
    }),
    prisma.savedView.count({ where }),
  ]);

  return { data: views, meta: buildMeta(total, page, pageSize) };
}

async function getSavedView(id: string, userId: string, userRoles: string[]) {
  const view = await prisma.savedView.findUnique({
    where: { id },
    include: { owner: { select: { id: true, displayName: true } } },
  });

  if (!view) throw new NotFoundError('Saved view not found');

  const isOwner = view.ownerId === userId;
  if (!isOwner && !view.isPublic && !isAdmin(userRoles)) {
    throw new ForbiddenError('You do not have access to this saved view');
  }

  return view;
}

async function createSavedView(data: CreateSavedViewBody, actorId: string) {
  const view = await prisma.savedView.create({
    data: {
      name: data.name,
      description: data.description ?? null,
      viewType: data.viewType as SavedViewType,
      ownerId: actorId,
      config: data.config as Prisma.InputJsonValue,
      isPublic: data.isPublic ?? false,
    },
  });

  await auditService.create({
    action: 'SAVED_VIEW_CREATED',
    actorId,
    entityType: 'saved_view',
    entityId: view.id,
    afterJson: { name: view.name, viewType: view.viewType, isPublic: view.isPublic },
  });

  logger.info({ savedViewId: view.id, actorId }, 'Saved view created');
  return view;
}

async function updateSavedView(
  id: string,
  data: UpdateSavedViewBody,
  actorId: string,
  actorRoles: string[],
) {
  const existing = await prisma.savedView.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError('Saved view not found');

  if (existing.ownerId !== actorId && !isAdmin(actorRoles)) {
    throw new ForbiddenError('Only the owner can update this saved view');
  }

  const updated = await prisma.savedView.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.config !== undefined && { config: data.config as Prisma.InputJsonValue }),
      ...(data.isPublic !== undefined && { isPublic: data.isPublic }),
    },
  });

  await auditService.create({
    action: 'SAVED_VIEW_UPDATED',
    actorId,
    entityType: 'saved_view',
    entityId: id,
    beforeJson: { name: existing.name, isPublic: existing.isPublic },
    afterJson: { name: updated.name, isPublic: updated.isPublic },
  });

  logger.info({ savedViewId: id, actorId }, 'Saved view updated');
  return updated;
}

async function deleteSavedView(id: string, actorId: string, actorRoles: string[]) {
  const existing = await prisma.savedView.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError('Saved view not found');

  if (existing.ownerId !== actorId && !isAdmin(actorRoles)) {
    throw new ForbiddenError('Only the owner can delete this saved view');
  }

  await prisma.savedView.delete({ where: { id } });

  await auditService.create({
    action: 'SAVED_VIEW_DELETED',
    actorId,
    entityType: 'saved_view',
    entityId: id,
    beforeJson: { name: existing.name, viewType: existing.viewType },
  });

  logger.info({ savedViewId: id, actorId }, 'Saved view deleted');
}

export const savedViewsService = {
  listSavedViews,
  getSavedView,
  createSavedView,
  updateSavedView,
  deleteSavedView,
};
