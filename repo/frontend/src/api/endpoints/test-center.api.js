import api from '../client';
// Sites
export const getSites = (params) => api.get('/v1/test-center/sites', { params });
export const getSite = (id) => api.get(`/v1/test-center/sites/${id}`);
export const createSite = (data) => api.post('/v1/test-center/sites', data);
export const updateSite = (id, data) => api.patch(`/v1/test-center/sites/${id}`, data);
export const deleteSite = (id) => api.delete(`/v1/test-center/sites/${id}`);
// Rooms
export const getRooms = (siteId, params) => api.get(`/v1/test-center/sites/${siteId}/rooms`, { params });
export const createRoom = (siteId, data) => api.post(`/v1/test-center/sites/${siteId}/rooms`, data);
export const updateRoom = (siteId, roomId, data) => api.patch(`/v1/test-center/sites/${siteId}/rooms/${roomId}`, data);
export const deleteRoom = (siteId, roomId) => api.delete(`/v1/test-center/sites/${siteId}/rooms/${roomId}`);
// Seats
export const getSeats = (roomId, params) => api.get(`/v1/test-center/rooms/${roomId}/seats`, { params });
export const createSeat = (roomId, data) => api.post(`/v1/test-center/rooms/${roomId}/seats`, data);
export const updateSeat = (roomId, seatId, data) => api.patch(`/v1/test-center/rooms/${roomId}/seats/${seatId}`, data);
export const deleteSeat = (roomId, seatId) => api.delete(`/v1/test-center/rooms/${roomId}/seats/${seatId}`);
// Equipment
export const getEquipment = (params) => api.get('/v1/test-center/equipment', { params });
export const createEquipment = (data) => api.post('/v1/test-center/equipment', data);
export const updateEquipment = (id, data) => api.patch(`/v1/test-center/equipment/${id}`, data);
export const deleteEquipment = (id) => api.delete(`/v1/test-center/equipment/${id}`);
// Sessions
export const getSessions = (params) => api.get('/v1/test-center/sessions', { params });
export const getSession = (id) => api.get(`/v1/test-center/sessions/${id}`);
export const createSession = (data) => api.post('/v1/test-center/sessions', data);
export const updateSession = (id, data) => api.patch(`/v1/test-center/sessions/${id}`, data);
export const deleteSession = (id) => api.delete(`/v1/test-center/sessions/${id}`);
// Registrations
export const registerForSession = (sessionId, data) => api.post(`/v1/test-center/sessions/${sessionId}/register`, data);
export const cancelRegistration = (sessionId, registrationId) => api.delete(`/v1/test-center/sessions/${sessionId}/registrations/${registrationId}`);
// Utilization
export const getUtilization = (params) => api.get('/v1/test-center/utilization', { params });
