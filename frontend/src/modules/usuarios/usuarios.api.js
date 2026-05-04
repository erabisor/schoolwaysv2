import api from '../../api/axios';

export const getUsuarios = (params = {}) =>
  api.get('/usuarios', { params });

export const crearUsuario = (datos) =>
  api.post('/usuarios', datos);

export const editarUsuario = (id, datos) =>
  api.put(`/usuarios/${id}`, datos);

export const toggleEstadoUsuario = (id, estado) =>
  api.patch(`/usuarios/${id}/estado`, { estado });

export const eliminarUsuarioFisico = (id) =>
  api.delete(`/usuarios/${id}`);
