import api from '../../api/axios';

export const getConductores = () => api.get('/conductores');
export const getUsuariosDisponibles = () => api.get('/conductores/disponibles');
export const crearConductor = (datos) => api.post('/conductores', datos);
export const editarConductor = (id, datos) => api.put(`/conductores/${id}`, datos);
export const toggleEstadoConductor = (id, estado) => api.patch(`/conductores/${id}/estado`, { estado });
export const eliminarConductor = (id) => api.delete(`/conductores/${id}`);
