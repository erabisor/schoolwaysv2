import api from '../../api/axios';

export const getHijosPadre = () =>
  api.get('/padres/hijos');

export const getTransporteHoyPadre = () =>
  api.get('/padres/transporte-hoy');

export const getHistorialSemanalPadre = () =>
  api.get('/padres/historial-semanal');

export const getUltimaUbicacionBus = (viajeId) =>
  api.get(`/asistencias/ubicacion/${viajeId}`);

export const getNotificacionesPadre = () =>
  api.get('/padres/notificaciones');

export const getResumenNotificacionesPadre = () =>
  api.get('/padres/notificaciones/resumen');

export const marcarNotificacionLeida = (id) =>
  api.patch(`/padres/notificaciones/${id}/leida`);

export const marcarTodasNotificacionesLeidas = () =>
  api.patch('/padres/notificaciones/leidas');
