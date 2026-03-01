const repository = require('./asistencias.repository');

const postAbrirTurno = async (req, res) => {
  try {
    const turno = await repository.abrirTurno(req.body.conductorId, req.body.rutaId);
    res.status(201).json({ success: true, data: turno });
  } catch (error) { res.status(500).json({ success: false, mensaje: error.message || 'Error al abrir turno' }); }
};

const putCerrarTurno = async (req, res) => {
  try {
    const turno = await repository.cerrarTurno(req.params.id);
    res.json({ success: true, data: turno });
  } catch (error) { res.status(400).json({ success: false, mensaje: error.message }); }
};

const postIniciarViaje = async (req, res) => {
  try {
    const { turnoId, rutaId, sentido } = req.body;
    const viaje = await repository.iniciarViaje(turnoId, rutaId, sentido);
    const alumnos = await repository.obtenerAlumnosPorSentido(rutaId, sentido);
    res.status(201).json({ success: true, data: { viaje, alumnos } });
  } catch (error) { res.status(500).json({ success: false, mensaje: 'Error al iniciar viaje' }); }
};

const putFinalizarViaje = async (req, res) => {
  try {
    const viaje = await repository.finalizarViaje(req.params.id);
    res.json({ success: true, data: viaje });
  } catch (error) { res.status(500).json({ success: false, mensaje: 'Error al finalizar viaje' }); }
};

const postRegistrarEvento = async (req, res) => {
  try {
    const evento = await repository.registrarEvento(req.body);
    res.status(201).json({ success: true, data: evento });
  } catch (error) { res.status(400).json({ success: false, mensaje: error.message }); }
};

const deleteDeshacerEvento = async (req, res) => {
  try {
    const { alumnoId, rutaId, sentido, tipoEvento } = req.body;
    await repository.deshacerEvento(alumnoId, rutaId, sentido, tipoEvento);
    res.json({ success: true, mensaje: 'Evento cancelado' });
  } catch (error) { res.status(500).json({ success: false, mensaje: 'Error al deshacer evento' }); }
};

const getRecuperarSesion = async (req, res) => {
  try {
    const sesion = await repository.recuperarSesion(req.params.conductorId);
    res.json({ success: true, data: sesion });
  } catch (error) { res.status(500).json({ success: false, mensaje: 'Error al recuperar sesión' }); }
};

const getTurnosAbiertos = async (req, res) => {
  try {
    const turnos = await repository.obtenerTurnosAbiertos();
    res.json({ success: true, data: turnos });
  } catch (error) { res.status(500).json({ success: false, mensaje: 'Error al obtener turnos' }); }
};

const putReasignarTurno = async (req, res) => {
  try {
    const { nuevoConductorId } = req.body;
    const turno = await repository.reasignarTurno(req.params.id, nuevoConductorId);
    res.json({ success: true, data: turno });
  } catch (error) { res.status(500).json({ success: false, mensaje: 'Error al reasignar turno' }); }
};

const putForzarCierreTurno = async (req, res) => {
  try {
    const turno = await repository.forzarCierreTurno(req.params.id);
    res.json({ success: true, data: turno });
  } catch (error) { res.status(500).json({ success: false, mensaje: 'Error al forzar el cierre del turno' }); }
};

// --- CONTROLADORES PARA HISTORIAL ---
const getHistorialTurnos = async (req, res) => {
  try {
    const { fechaInicio, fechaFin, rutaId } = req.query;
    const turnos = await repository.obtenerHistorialTurnos(fechaInicio, fechaFin, rutaId);
    res.json({ success: true, data: turnos });
  } catch (error) { res.status(500).json({ success: false, mensaje: 'Error al obtener historial' }); }
};

const getDetalleTurno = async (req, res) => {
  try {
    const detalle = await repository.obtenerDetalleTurno(req.params.id);
    res.json({ success: true, data: detalle });
  } catch (error) { res.status(500).json({ success: false, mensaje: 'Error al obtener detalles del turno' }); }
};

module.exports = { 
  postAbrirTurno, putCerrarTurno, postIniciarViaje, putFinalizarViaje, 
  postRegistrarEvento, deleteDeshacerEvento, getRecuperarSesion,
  getTurnosAbiertos, putReasignarTurno, putForzarCierreTurno,
  getHistorialTurnos, getDetalleTurno
};