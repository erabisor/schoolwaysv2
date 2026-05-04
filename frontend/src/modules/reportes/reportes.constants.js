export const REPORT_TABS = [
  { id: 'resumen', label: 'Resumen ejecutivo' },
  { id: 'uso-rutas', label: 'Uso de rutas' },
  { id: 'mantenimiento-vehiculos', label: 'Mantenimiento de vehículos' },
  { id: 'asistencia-estudiante', label: 'Asistencia por estudiante' },
  { id: 'viajes', label: 'Viajes' },
  { id: 'turnos', label: 'Turnos' }
];

export const EVENTOS = ['', 'Abordó', 'Bajó', 'Ausente', 'AvisóAusencia'];
export const SENTIDOS = ['', 'Ida', 'Vuelta'];
export const ESTADOS_MANTENIMIENTO = ['', 'Programado', 'En Proceso', 'Completado', 'Cancelado'];

export const getDefaultFilters = () => {
  const hoy = new Date();
  const hace30 = new Date();
  hace30.setDate(hoy.getDate() - 30);
  return {
    fechaInicio: hace30.toISOString().slice(0, 10),
    fechaFin: hoy.toISOString().slice(0, 10),
    rutaId: '',
    alumnoId: '',
    conductorId: '',
    vehiculoId: '',
    tipoEvento: '',
    sentido: '',
    estado: ''
  };
};
