import api from '../../api/axios';

export const getAlumnos = () =>
  api.get('/alumnos');

export const getOpcionesAlumno = () =>
  api.get('/alumnos/opciones');

export const crearAlumno = (datos) =>
  api.post('/alumnos', datos);

export const editarAlumno = (id, datos) =>
  api.put(`/alumnos/${id}`, datos);

export const toggleEstadoAlumno = (id, estado) =>
  api.patch(`/alumnos/${id}/estado`, { estado });

export const eliminarAlumnoFisico = (id) =>
  api.delete(`/alumnos/${id}`);