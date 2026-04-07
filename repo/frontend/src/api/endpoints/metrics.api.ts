import api from '../client';

export const getDefinitions = (params?: any) =>
  api.get('/v1/metrics/definitions', { params });

export const getDefinition = (id: string) =>
  api.get(`/v1/metrics/definitions/${id}`);

export const createDefinition = (data: any) =>
  api.post('/v1/metrics/definitions', data);

export const createVersion = (definitionId: string, data: any) =>
  api.post(`/v1/metrics/definitions/${definitionId}/versions`, data);

export const getMetricValues = (params?: any) =>
  api.get('/v1/metrics/values', { params });

export const triggerRecalc = (data: any) =>
  api.post('/v1/metrics/recalculate', data);

export const getCalcJobs = (params?: any) =>
  api.get('/v1/metrics/jobs', { params });
