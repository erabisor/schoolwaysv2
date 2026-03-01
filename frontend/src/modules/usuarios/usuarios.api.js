import api from '../../api/axios';

// Centraliza las peticiones de este módulo
export const getUsuarios = () => api.get('/usuarios');
export const crearUsuario = (datos) => api.post('/usuarios', datos);
export const editarUsuario = (id, datos) => api.put(`/usuarios/${id}`, datos);
export const toggleEstadoUsuario = (id, estado) => api.patch(`/usuarios/${id}/estado`, { estado });
export const eliminarUsuarioFisico = (id) => api.delete(`/usuarios/${id}`);