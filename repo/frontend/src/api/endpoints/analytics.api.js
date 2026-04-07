import api from '../client';
// Report Definitions
export const getDefinitions = (params) => api.get('/v1/analytics/definitions', { params });
export const getDefinition = (id) => api.get(`/v1/analytics/definitions/${id}`);
export const createDefinition = (data) => api.post('/v1/analytics/definitions', data);
export const updateDefinition = (id, data) => api.patch(`/v1/analytics/definitions/${id}`, data);
export const deleteDefinition = (id) => api.delete(`/v1/analytics/definitions/${id}`);
// Reports
export const generateReport = (data) => api.post('/v1/analytics/reports', data);
export const getReports = (params) => api.get('/v1/analytics/reports', { params });
export const getReport = (id) => api.get(`/v1/analytics/reports/${id}`);
// Sharing
export const shareReport = (reportId, data) => api.post(`/v1/analytics/reports/${reportId}/shares`, data);
export const revokeShare = (reportId, shareId) => api.delete(`/v1/analytics/reports/${reportId}/shares/${shareId}`);
export const getShares = (reportId) => api.get(`/v1/analytics/reports/${reportId}/shares`);
// Export
export const exportReport = (reportId, data) => api.post(`/v1/analytics/reports/${reportId}/export`, data);
export const downloadExport = (exportId) => api.get(`/v1/analytics/exports/${exportId}/download`, { responseType: 'blob' });
// Pivot Query
export const pivotQuery = (data) => api.post('/v1/analytics/pivot', data);
// Schedules
export const getSchedules = (params) => api.get('/v1/analytics/schedules', { params });
export const getSchedule = (id) => api.get(`/v1/analytics/schedules/${id}`);
export const createSchedule = (data) => api.post('/v1/analytics/schedules', data);
export const updateSchedule = (id, data) => api.patch(`/v1/analytics/schedules/${id}`, data);
export const deleteSchedule = (id) => api.delete(`/v1/analytics/schedules/${id}`);
