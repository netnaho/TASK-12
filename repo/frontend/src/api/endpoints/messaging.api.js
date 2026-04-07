import api from '../client';
// Messages
export const enqueueMessage = (data) => api.post('/v1/messaging/messages', data);
export const getMessages = (params) => api.get('/v1/messaging/messages', { params });
export const getMessage = (id) => api.get(`/v1/messaging/messages/${id}`);
export const updateDelivery = (id, data) => api.patch(`/v1/messaging/messages/${id}/delivery`, data);
// Failures
export const getFailures = (params) => api.get('/v1/messaging/failures', { params });
// Blacklist
export const getBlacklist = (params) => api.get('/v1/messaging/blacklist', { params });
export const addToBlacklist = (data) => api.post('/v1/messaging/blacklist', data);
export const removeFromBlacklist = (id) => api.delete(`/v1/messaging/blacklist/${id}`);
// Quiet Hours
export const getQuietHours = () => api.get('/v1/messaging/quiet-hours');
export const updateQuietHours = (data) => api.put('/v1/messaging/quiet-hours', data);
