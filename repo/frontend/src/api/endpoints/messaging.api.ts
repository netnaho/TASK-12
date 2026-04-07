import api from '../client';

// Messages
export const enqueueMessage = (data: any) =>
  api.post('/v1/messaging/messages', data);

export const getMessages = (params?: any) =>
  api.get('/v1/messaging/messages', { params });

export const getMessage = (id: string) =>
  api.get(`/v1/messaging/messages/${id}`);

export const updateDelivery = (id: string, data: any) =>
  api.patch(`/v1/messaging/messages/${id}/delivery`, data);

// Failures
export const getFailures = (params?: any) =>
  api.get('/v1/messaging/failures', { params });

// Blacklist
export const getBlacklist = (params?: any) =>
  api.get('/v1/messaging/blacklist', { params });

export const addToBlacklist = (data: any) =>
  api.post('/v1/messaging/blacklist', data);

export const removeFromBlacklist = (id: string) =>
  api.delete(`/v1/messaging/blacklist/${id}`);

// Quiet Hours
export const getQuietHours = () =>
  api.get('/v1/messaging/quiet-hours');

export const updateQuietHours = (data: any) =>
  api.put('/v1/messaging/quiet-hours', data);
