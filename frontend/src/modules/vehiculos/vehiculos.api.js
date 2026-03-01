import api from '../../api/axios';

export const getVehiculos = () => api.get('/vehiculos');
export const crearVehiculo = (datos) => api.post('/vehiculos', datos);
export const editarVehiculo = (id, datos) => api.put(`/vehiculos/${id}`, datos);
export const toggleEstadoVehiculo = (id, estado) => api.patch(`/vehiculos/${id}/estado`, { estado });
export const eliminarVehiculo = (id) => api.delete(`/vehiculos/${id}`);