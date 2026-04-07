import api from '../client';

export const getNotifications = (params?: any) =>
  api.get('/v1/notifications', { params });

export const getUnreadCount = () =>
  api.get('/v1/notifications/unread-count');

export const markRead = (id: string) =>
  api.patch(`/v1/notifications/${id}/read`);

export const markAllRead = () =>
  api.patch('/v1/notifications/read-all');

export const snooze = (id: string, data: { until: string }) =>
  api.patch(`/v1/notifications/${id}/snooze`, data);

export const dismiss = (id: string) =>
  api.patch(`/v1/notifications/${id}/dismiss`);

// Templates
export const getTemplates = (params?: any) =>
  api.get('/v1/notifications/templates', { params });

export const getTemplate = (id: string) =>
  api.get(`/v1/notifications/templates/${id}`);

export const createTemplate = (data: any) =>
  api.post('/v1/notifications/templates', data);

export const updateTemplate = (id: string, data: any) =>
  api.patch(`/v1/notifications/templates/${id}`, data);

export const deleteTemplate = (id: string) =>
  api.delete(`/v1/notifications/templates/${id}`);

export const previewTemplate = (data: any) =>
  api.post('/v1/notifications/templates/preview', data);
