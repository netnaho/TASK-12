import api from '../client';

export const getListings = (params?: any) =>
  api.get('/v1/listings', { params });

export const getListing = (id: string) =>
  api.get(`/v1/listings/${id}`);

export const createListing = (data: any) =>
  api.post('/v1/listings', data);

export const updateListing = (id: string, data: any) =>
  api.patch(`/v1/listings/${id}`, data);

export const getListingStats = (params?: any) =>
  api.get('/v1/listings/stats', { params });
