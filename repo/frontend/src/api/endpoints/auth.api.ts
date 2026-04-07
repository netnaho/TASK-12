import api from '../client';

export const login = (username: string, password: string) =>
  api.post('/v1/auth/login', { username, password });

export const logout = () =>
  api.post('/v1/auth/logout');

export const getCurrentUser = () =>
  api.get('/v1/auth/me');
