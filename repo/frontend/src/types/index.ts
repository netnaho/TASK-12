import type { Component } from 'vue';
import type { Role } from './roles';

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface ApiErrorResponse {
  message: string;
  errors?: Record<string, string[]>;
  statusCode: number;
}

export interface PaginatedMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginatedMeta;
}

export interface NavItem {
  name: string;
  icon: string;
  route: string;
  roles: Role[];
}

export type { Role } from './roles';
export { roleLabels, roleColors } from './roles';
