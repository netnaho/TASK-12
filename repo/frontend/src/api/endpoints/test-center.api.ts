import api from '../client';

// Sites
export const getSites = (params?: any) =>
  api.get('/v1/test-center/sites', { params });

export const getSite = (id: string) =>
  api.get(`/v1/test-center/sites/${id}`);

export const createSite = (data: any) =>
  api.post('/v1/test-center/sites', data);

export const updateSite = (id: string, data: any) =>
  api.patch(`/v1/test-center/sites/${id}`, data);

export const deleteSite = (id: string) =>
  api.delete(`/v1/test-center/sites/${id}`);

// Rooms
export const getRooms = (siteId: string, params?: any) =>
  api.get(`/v1/test-center/sites/${siteId}/rooms`, { params });

export const createRoom = (siteId: string, data: any) =>
  api.post(`/v1/test-center/sites/${siteId}/rooms`, data);

export const updateRoom = (siteId: string, roomId: string, data: any) =>
  api.patch(`/v1/test-center/sites/${siteId}/rooms/${roomId}`, data);

export const deleteRoom = (siteId: string, roomId: string) =>
  api.delete(`/v1/test-center/sites/${siteId}/rooms/${roomId}`);

// Seats
export const getSeats = (roomId: string, params?: any) =>
  api.get(`/v1/test-center/rooms/${roomId}/seats`, { params });

export const createSeat = (roomId: string, data: any) =>
  api.post(`/v1/test-center/rooms/${roomId}/seats`, data);

export const updateSeat = (roomId: string, seatId: string, data: any) =>
  api.patch(`/v1/test-center/rooms/${roomId}/seats/${seatId}`, data);

export const deleteSeat = (roomId: string, seatId: string) =>
  api.delete(`/v1/test-center/rooms/${roomId}/seats/${seatId}`);

// Equipment
export const getEquipment = (params?: any) =>
  api.get('/v1/test-center/equipment', { params });

export const createEquipment = (data: any) =>
  api.post('/v1/test-center/equipment', data);

export const updateEquipment = (id: string, data: any) =>
  api.patch(`/v1/test-center/equipment/${id}`, data);

export const deleteEquipment = (id: string) =>
  api.delete(`/v1/test-center/equipment/${id}`);

// Sessions
export const getSessions = (params?: any) =>
  api.get('/v1/test-center/sessions', { params });

export const getSession = (id: string) =>
  api.get(`/v1/test-center/sessions/${id}`);

export const createSession = (data: any) =>
  api.post('/v1/test-center/sessions', data);

export const updateSession = (id: string, data: any) =>
  api.patch(`/v1/test-center/sessions/${id}`, data);

export const deleteSession = (id: string) =>
  api.delete(`/v1/test-center/sessions/${id}`);

// Registrations
export const registerForSession = (sessionId: string, data: any) =>
  api.post(`/v1/test-center/sessions/${sessionId}/register`, data);

export const cancelRegistration = (sessionId: string, registrationId: string) =>
  api.delete(`/v1/test-center/sessions/${sessionId}/registrations/${registrationId}`);

// Utilization
export const getUtilization = (params?: any) =>
  api.get('/v1/test-center/utilization', { params });
