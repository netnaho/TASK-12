import api from '../client';
export const getUsers = (params) => api.get('/v1/users', { params });
export const getUser = (id) => api.get(`/v1/users/${id}`);
export const createUser = (data) => api.post('/v1/users', data);
export const updateUser = (id, data) => api.patch(`/v1/users/${id}`, data);
export const assignRole = (id, data) => api.post(`/v1/users/${id}/roles`, data);
export const removeRole = (id, roleName) => api.delete(`/v1/users/${id}/roles/${roleName}`);
export const deactivateUser = (id) => api.patch(`/v1/users/${id}/deactivate`);
