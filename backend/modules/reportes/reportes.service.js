const repository = require('./reportes.repository');

const EVENTOS_VALIDOS = ['Abordó', 'Bajó', 'Ausente', 'AvisóAusencia'];
const SENTIDOS_VALIDOS = ['Ida', 'Vuelta'];
const ESTADOS_MANTENIMIENTO = ['Programado', 'En Proceso', 'Completado', 'Cancelado'];

const crearError = (mensaje, status = 400) => {
  const error = new Error(mensaje);
  error.status = status;
  return error;
};

const fechaISO = (fecha) => fecha.toISOString().slice(0, 10);

const filtrosBase = (query = {}) => {
  const hoy = new Date();
  const hace30 = new Date();
  hace30.setDate(hoy.getDate() - 30);

  const fechaInicio = query.fechaInicio || fechaISO(hace30);
  const fechaFin = query.fechaFin || fechaISO(hoy);

  if (Number.isNaN(new Date(fechaInicio).getTime()) || Number.isNaN(new Date(fechaFin).getTime())) {
    throw crearError('Las fechas no tienen un formato válido. Usa YYYY-MM-DD.');
  }

  if (new Date(fechaFin) < new Date(fechaInicio)) {
    throw crearError('La fecha final no puede ser menor que la fecha inicial.');
  }

  return { ...query, fechaInicio, fechaFin };
};

const validarEvento = (tipoEvento) => {
  if (tipoEvento && !EVENTOS_VALIDOS.includes(tipoEvento)) throw crearError('Tipo de evento inválido.');
};

const validarSentido = (sentido) => {
  if (sentido && !SENTIDOS_VALIDOS.includes(sentido)) throw crearError('Sentido inválido.');
};

const validarEstadoMantenimiento = (estado) => {
  if (estado && !ESTADOS_MANTENIMIENTO.includes(estado)) throw crearError('Estado de mantenimiento inválido.');
};

const respuesta = (data, mensaje, filtros) => ({ ok: true, data: { filtros, ...data }, mensaje });

const resumen = async (query) => {
  const filtros = filtrosBase(query);
  const data = await repository.resumen(filtros);
  return respuesta(data, 'Resumen ejecutivo generado', filtros);
};

const usoRutas = async (query) => {
  const filtros = filtrosBase(query);
  validarSentido(filtros.sentido);
  const data = await repository.usoRutas(filtros);
  return respuesta(data, 'Reporte de uso de rutas generado', filtros);
};

const mantenimientoVehiculos = async (query) => {
  const filtros = filtrosBase(query);
  validarEstadoMantenimiento(filtros.estado);
  const data = await repository.mantenimientoVehiculos(filtros);
  return respuesta(data, 'Reporte de mantenimiento de vehículos generado', filtros);
};

const asistenciaEstudiante = async (query) => {
  const filtros = filtrosBase(query);
  validarEvento(filtros.tipoEvento);
  validarSentido(filtros.sentido);
  const data = await repository.asistenciaEstudiante(filtros);
  return respuesta(data, 'Reporte de asistencia por estudiante generado', filtros);
};

const viajes = async (query) => {
  const filtros = filtrosBase(query);
  validarSentido(filtros.sentido);
  const data = await repository.viajes(filtros);
  return respuesta(data, 'Reporte de viajes generado', filtros);
};

const turnos = async (query) => {
  const filtros = filtrosBase(query);
  const data = await repository.turnos(filtros);
  return respuesta(data, 'Reporte de turnos generado', filtros);
};

module.exports = {
  resumen,
  usoRutas,
  mantenimientoVehiculos,
  asistenciaEstudiante,
  viajes,
  turnos
};
