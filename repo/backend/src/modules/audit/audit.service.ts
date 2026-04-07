import { AuditAction, Prisma } from '@prisma/client';
import { prisma } from '../../config/database';
import { logger } from '../../logging/logger';
import { NotFoundError } from '../../shared/errors';
import { parsePagination, buildMeta } from '../../shared/utils/pagination.util';
import { ListAuditLogsQuery } from './audit.schemas';

export interface CreateAuditLogData {
  action: AuditAction;
  actorId?: string;
  entityType: string;
  entityId: string;
  beforeJson?: any;
  afterJson?: any;
  metadata?: any;
  ipAddress?: string;
  requestId?: string;
}

export class AuditService {
  /**
   * Create an audit log entry. This is INSERT ONLY -- no update or delete
   * methods are exposed to guarantee an append-only audit trail.
   */
  async create(data: CreateAuditLogData) {
    const entry = await prisma.auditLog.create({
      data: {
        action: data.action,
        actorId: data.actorId ?? null,
        entityType: data.entityType,
        entityId: data.entityId,
        beforeJson: data.beforeJson ?? Prisma.JsonNull,
        afterJson: data.afterJson ?? Prisma.JsonNull,
        metadata: data.metadata ?? Prisma.JsonNull,
        ipAddress: data.ipAddress ?? null,
        requestId: data.requestId ?? null,
      },
    });

    logger.info(
      { auditId: entry.id.toString(), action: data.action, entityType: data.entityType, entityId: data.entityId },
      'Audit log entry created',
    );

    return entry;
  }

  /**
   * List audit logs with pagination and filtering. Ordered by createdAt desc.
   * Includes the actor's displayName.
   */
  async list(filters: ListAuditLogsQuery) {
    const { skip, take, page, pageSize } = parsePagination(filters);

    const where: Prisma.AuditLogWhereInput = {};

    if (filters.action) {
      where.action = filters.action as AuditAction;
    }

    if (filters.entityType) {
      where.entityType = filters.entityType;
    }

    if (filters.entityId) {
      where.entityId = filters.entityId;
    }

    if (filters.actorId) {
      where.actorId = filters.actorId;
    }

    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) {
        where.createdAt.gte = filters.dateFrom;
      }
      if (filters.dateTo) {
        where.createdAt.lte = filters.dateTo;
      }
    }

    const [entries, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          actor: {
            select: { displayName: true },
          },
        },
      }),
      prisma.auditLog.count({ where }),
    ]);

    // Serialize BigInt ids to strings for JSON compatibility
    const data = entries.map((entry) => ({
      ...entry,
      id: entry.id.toString(),
    }));

    return { data, meta: buildMeta(total, page, pageSize) };
  }

  /**
   * Get a single audit log entry by ID. Includes actor displayName.
   */
  async getById(id: string) {
    const entry = await prisma.auditLog.findUnique({
      where: { id: BigInt(id) },
      include: {
        actor: {
          select: { displayName: true },
        },
      },
    });

    if (!entry) {
      throw new NotFoundError('Audit log entry not found');
    }

    return {
      ...entry,
      id: entry.id.toString(),
    };
  }
}

export const auditService = new AuditService();
