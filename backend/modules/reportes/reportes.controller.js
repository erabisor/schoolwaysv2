const service = require('./reportes.service');

const responderError = (res, error, contexto, mensajeGenerico) => {
  console.error(`[reportes] ${contexto}:`, error.message);
  return res.status(error.status || 500).json({
    ok: false,
    data: null,
    mensaje: error.status ? error.message : mensajeGenerico
  });
};

const responder = async (req, res, contexto, accion) => {
  try {
    const resultado = await accion(req.query);
    return res.status(200).json(resultado);
  } catch (error) {
    return responderError(res, error, contexto, `Error al generar reporte: ${contexto}`);
  }
};

const resumen = (req, res) => responder(req, res, 'resumen', service.resumen);
const usoRutas = (req, res) => responder(req, res, 'uso-rutas', service.usoRutas);
const mantenimientoVehiculos = (req, res) => responder(req, res, 'mantenimiento-vehiculos', service.mantenimientoVehiculos);
const asistenciaEstudiante = (req, res) => responder(req, res, 'asistencia-estudiante', service.asistenciaEstudiante);
const viajes = (req, res) => responder(req, res, 'viajes', service.viajes);
const turnos = (req, res) => responder(req, res, 'turnos', service.turnos);

module.exports = {
  resumen,
  usoRutas,
  mantenimientoVehiculos,
  asistenciaEstudiante,
  viajes,
  turnos
};
