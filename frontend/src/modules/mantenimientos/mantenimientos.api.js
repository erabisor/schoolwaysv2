import api from '../../api/axios';

export const getMantenimientos = (filtros = {}) =>
  api.get('/mantenimientos', { params: filtros });

export const getMantenimientosPorVehiculo = (vehiculoId) =>
  api.get(`/mantenimientos/vehiculo/${vehiculoId}`);

export const crearMantenimiento = (datos) =>
  api.post('/mantenimientos', datos);

export const editarMantenimiento = (id, datos) =>
  api.put(`/mantenimientos/${id}`, datos);

export const cambiarEstadoMantenimiento = (id, estado) =>
  api.patch(`/mantenimientos/${id}/estado`, { estado });

export const eliminarMantenimiento = (id) =>
  api.delete(`/mantenimientos/${id}`);

export const getVehiculosDisponibles = () =>
  api.get('/vehiculos');
