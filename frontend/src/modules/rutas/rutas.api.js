import api from '../../api/axios';

export const getRutas = () => api.get('/rutas');
export const getOpcionesRuta = () => api.get('/rutas/opciones');
export const crearRuta = (datos) => api.post('/rutas', datos);
export const editarRuta = (id, datos) => api.put(`/rutas/${id}`, datos);
export const toggleEstadoRuta = (id, estado) => api.patch(`/rutas/${id}/estado`, { estado });
export const eliminarRuta = (id) => api.delete(`/rutas/${id}`);