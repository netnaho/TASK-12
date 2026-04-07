import api from '../client';

// Report Definitions
export const getDefinitions = (params?: any) =>
  api.get('/v1/analytics/definitions', { params });

export const getDefinition = (id: string) =>
  api.get(`/v1/analytics/definitions/${id}`);

export const createDefinition = (data: any) =>
  api.post('/v1/analytics/definitions', data);

export const updateDefinition = (id: string, data: any) =>
  api.patch(`/v1/analytics/definitions/${id}`, data);

export const deleteDefinition = (id: string) =>
  api.delete(`/v1/analytics/definitions/${id}`);

// Reports
export const generateReport = (data: any) =>
  api.post('/v1/analytics/reports', data);

export const getReports = (params?: any) =>
  api.get('/v1/analytics/reports', { params });

export const getReport = (id: string) =>
  api.get(`/v1/analytics/reports/${id}`);

// Sharing
export const shareReport = (reportId: string, data: any) =>
  api.post(`/v1/analytics/reports/${reportId}/shares`, data);

export const revokeShare = (reportId: string, shareId: string) =>
  api.delete(`/v1/analytics/reports/${reportId}/shares/${shareId}`);

export const getShares = (reportId: string) =>
  api.get(`/v1/analytics/reports/${reportId}/shares`);

// Export
export const exportReport = (reportId: string, data: any) =>
  api.post(`/v1/analytics/reports/${reportId}/export`, data);

export const downloadExport = (exportId: string) =>
  api.get(`/v1/analytics/exports/${exportId}/download`, { responseType: 'blob' });

// Pivot Query
export const pivotQuery = (data: any) =>
  api.post('/v1/analytics/pivot', data);

// Schedules
export const getSchedules = (params?: any) =>
  api.get('/v1/analytics/schedules', { params });

export const getSchedule = (id: string) =>
  api.get(`/v1/analytics/schedules/${id}`);

export const createSchedule = (data: any) =>
  api.post('/v1/analytics/schedules', data);

export const updateSchedule = (id: string, data: any) =>
  api.patch(`/v1/analytics/schedules/${id}`, data);

export const deleteSchedule = (id: string) =>
  api.delete(`/v1/analytics/schedules/${id}`);
