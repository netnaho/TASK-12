import api from '../client';
export const getAuditLogs = (params) => api.get('/v1/audit-logs', { params });
export const getAuditLog = (id) => api.get(`/v1/audit-logs/${id}`);
