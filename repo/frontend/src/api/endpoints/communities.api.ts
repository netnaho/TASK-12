import api from '../client';

export const getRegions = (params?: any) =>
  api.get('/v1/regions', { params });

export const createRegion = (data: any) =>
  api.post('/v1/regions', data);

export const getCommunities = (params?: any) =>
  api.get('/v1/communities', { params });

export const createCommunity = (data: any) =>
  api.post('/v1/communities', data);

export const getProperties = (params?: any) =>
  api.get('/v1/properties', { params });

export const createProperty = (data: any) =>
  api.post('/v1/properties', data);

export const updateProperty = (id: string, data: any) =>
  api.patch(`/v1/properties/${id}`, data);
