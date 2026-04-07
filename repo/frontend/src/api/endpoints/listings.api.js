import api from '../client';
export const getListings = (params) => api.get('/v1/listings', { params });
export const getListing = (id) => api.get(`/v1/listings/${id}`);
export const createListing = (data) => api.post('/v1/listings', data);
export const updateListing = (id, data) => api.patch(`/v1/listings/${id}`, data);
export const getListingStats = (params) => api.get('/v1/listings/stats', { params });
