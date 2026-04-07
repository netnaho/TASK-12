import api from '../client';

export const getUsers = (params?: any) =>
  api.get('/v1/users', { params });

export const getUser = (id: string) =>
  api.get(`/v1/users/${id}`);

export const createUser = (data: any) =>
  api.post('/v1/users', data);

export const updateUser = (id: string, data: any) =>
  api.patch(`/v1/users/${id}`, data);

export const assignRole = (id: string, data: { role: string }) =>
  api.post(`/v1/users/${id}/roles`, data);

export const removeRole = (id: string, roleName: string) =>
  api.delete(`/v1/users/${id}/roles/${roleName}`);

export const deactivateUser = (id: string) =>
  api.patch(`/v1/users/${id}/deactivate`);
