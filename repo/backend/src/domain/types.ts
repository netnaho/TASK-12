import type { RoleName, PermissionKey } from './roles';

export interface AuthenticatedUser {
  id: string;
  username: string;
  displayName: string;
  email: string;
  roles: RoleName[];
  permissions: PermissionKey[];
}

export interface SessionData {
  userId: string;
  roles: RoleName[];
  permissions: PermissionKey[];
  lastActivityAt: number;
}

export interface PaginationParams {
  page: number;
  pageSize: number;
  skip: number;
  take: number;
}

export interface PaginatedResult<T> {
  items: T[];
  meta: PaginationMeta;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface GeoPoint {
  latitude: number;
  longitude: number;
}

export type SortDirection = 'asc' | 'desc';

export interface SortParams {
  field: string;
  direction: SortDirection;
}

export interface DateRange {
  from: Date;
  to: Date;
}
