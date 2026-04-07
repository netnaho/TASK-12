import { prisma } from '../config/database';
import type { PrismaClient } from '@prisma/client';
import type { PaginationParams, PaginatedResult } from '../domain/types';
import { buildPaginationMeta } from '../utils/pagination';

export abstract class BaseRepository {
  protected readonly db: PrismaClient = prisma;

  protected async paginate<T>(
    countFn: () => Promise<number>,
    findFn: (skip: number, take: number) => Promise<T[]>,
    params: PaginationParams,
  ): Promise<PaginatedResult<T>> {
    const { page, pageSize, skip, take } = params;

    const [total, items] = await Promise.all([countFn(), findFn(skip, take)]);

    return {
      items,
      meta: buildPaginationMeta(total, page, pageSize),
    };
  }
}
