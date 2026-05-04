import api from '../../api/axios';

export const getReporteResumen = (params) => api.get('/reportes/resumen', { params });
export const getReporteUsoRutas = (params) => api.get('/reportes/uso-rutas', { params });
export const getReporteMantenimientoVehiculos = (params) => api.get('/reportes/mantenimiento-vehiculos', { params });
export const getReporteAsistenciaEstudiante = (params) => api.get('/reportes/asistencia-estudiante', { params });
export const getReporteViajes = (params) => api.get('/reportes/viajes', { params });
export const getReporteTurnos = (params) => api.get('/reportes/turnos', { params });
