import api from '../client';

export const getAuditLogs = (params?: any) =>
  api.get('/v1/audit-logs', { params });

export const getAuditLog = (id: string) =>
  api.get(`/v1/audit-logs/${id}`);
