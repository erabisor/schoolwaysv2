import api from '../../api/axios';

export const getRutasDisponibles = () => api.get('/rutas');
export const abrirTurno = (conductorId, rutaId) => api.post('/asistencias/turnos/abrir', { conductorId, rutaId });
export const cerrarTurno = (turnoId) => api.put(`/asistencias/turnos/${turnoId}/cerrar`);
export const iniciarViaje = (turnoId, rutaId, sentido) => api.post('/asistencias/viajes/iniciar', { turnoId, rutaId, sentido });
export const finalizarViaje = (viajeId) => api.put(`/asistencias/viajes/${viajeId}/finalizar`);
export const registrarEvento = (datos) => api.post('/asistencias/evento', datos);
export const deshacerEvento = (datos) => api.delete('/asistencias/evento/deshacer', { data: datos });
export const recuperarSesion = (conductorId) => api.get(`/asistencias/sesion/${conductorId}`);

export const getTurnosAbiertos = () => api.get('/asistencias/turnos/abiertos');
export const reasignarTurno = (turnoId, nuevoConductorId) => api.put(`/asistencias/turnos/${turnoId}/reasignar`, { nuevoConductorId });
export const forzarCierreTurno = (turnoId) => api.put(`/asistencias/turnos/${turnoId}/forzar-cierre`);
export const getConductores = () => api.get('/conductores');

// Reportes e Historial
export const getHistorialTurnos = (filtros) => api.get('/asistencias/turnos/historial', { params: filtros });
export const getDetalleTurno = (turnoId) => api.get(`/asistencias/turnos/${turnoId}/detalle`);