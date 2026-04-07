import api from '../client';
export const getRegions = (params) => api.get('/v1/regions', { params });
export const createRegion = (data) => api.post('/v1/regions', data);
export const getCommunities = (params) => api.get('/v1/communities', { params });
export const createCommunity = (data) => api.post('/v1/communities', data);
export const getProperties = (params) => api.get('/v1/properties', { params });
export const createProperty = (data) => api.post('/v1/properties', data);
export const updateProperty = (id, data) => api.patch(`/v1/properties/${id}`, data);
