import api from '../client';
export const getDefinitions = (params) => api.get('/v1/metrics/definitions', { params });
export const getDefinition = (id) => api.get(`/v1/metrics/definitions/${id}`);
export const createDefinition = (data) => api.post('/v1/metrics/definitions', data);
export const createVersion = (definitionId, data) => api.post(`/v1/metrics/definitions/${definitionId}/versions`, data);
export const getMetricValues = (params) => api.get('/v1/metrics/values', { params });
export const triggerRecalc = (data) => api.post('/v1/metrics/recalculate', data);
export const getCalcJobs = (params) => api.get('/v1/metrics/jobs', { params });
