import api from '../client';
export const getNotifications = (params) => api.get('/v1/notifications', { params });
export const getUnreadCount = () => api.get('/v1/notifications/unread-count');
export const markRead = (id) => api.patch(`/v1/notifications/${id}/read`);
export const markAllRead = () => api.patch('/v1/notifications/read-all');
export const snooze = (id, data) => api.patch(`/v1/notifications/${id}/snooze`, data);
export const dismiss = (id) => api.patch(`/v1/notifications/${id}/dismiss`);
// Templates
export const getTemplates = (params) => api.get('/v1/notifications/templates', { params });
export const getTemplate = (id) => api.get(`/v1/notifications/templates/${id}`);
export const createTemplate = (data) => api.post('/v1/notifications/templates', data);
export const updateTemplate = (id, data) => api.patch(`/v1/notifications/templates/${id}`, data);
export const deleteTemplate = (id) => api.delete(`/v1/notifications/templates/${id}`);
export const previewTemplate = (data) => api.post('/v1/notifications/templates/preview', data);
