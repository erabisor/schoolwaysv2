const repository = require('./asistencias.repository');

const postAbrirTurno = async (req, res) => {
  try {
    const turno = await repository.abrirTurno(req.body.conductorId, req.body.rutaId);
    res.status(201).json({ ok: true, data: turno, mensaje: 'Turno abierto correctamente' });
  } catch (error) {
    console.error('[asistencias] postAbrirTurno:', error.message);
    res.status(400).json({ ok: false, data: null, mensaje: error.message });
  }
};

const putCerrarTurno = async (req, res) => {
  try {
    const turno = await repository.cerrarTurno(req.params.id);
    res.json({ ok: true, data: turno, mensaje: 'Turno cerrado correctamente' });
  } catch (error) {
    console.error('[asistencias] putCerrarTurno:', error.message);
    res.status(400).json({ ok: false, data: null, mensaje: error.message });
  }
};

const postIniciarViaje = async (req, res) => {
  try {
    const { turnoId, rutaId, sentido } = req.body;
    const viaje   = await repository.iniciarViaje(turnoId, rutaId, sentido);
    const alumnos = await repository.obtenerAlumnosPorSentido(rutaId, sentido);
    res.status(201).json({ ok: true, data: { viaje, alumnos }, mensaje: 'Viaje iniciado' });
  } catch (error) {
    console.error('[asistencias] postIniciarViaje:', error.message);
    res.status(500).json({ ok: false, data: null, mensaje: error.message });
  }
};

const putFinalizarViaje = async (req, res) => {
  try {
    const viaje = await repository.finalizarViaje(req.params.id);
    res.json({ ok: true, data: viaje, mensaje: 'Viaje finalizado' });
  } catch (error) {
    console.error('[asistencias] putFinalizarViaje:', error.message);
    res.status(500).json({ ok: false, data: null, mensaje: error.message });
  }
};

const postRegistrarEvento = async (req, res) => {
  try {
    const evento = await repository.registrarEvento(req.body);
    res.status(201).json({ ok: true, data: evento, mensaje: 'Evento registrado' });
  } catch (error) {
    console.error('[asistencias] postRegistrarEvento:', error.message);
    res.status(400).json({ ok: false, data: null, mensaje: error.message });
  }
};

const deleteDeshacerEvento = async (req, res) => {
  try {
    const { alumnoId, rutaId, sentido, tipoEvento } = req.body;
    await repository.deshacerEvento(alumnoId, rutaId, sentido, tipoEvento);
    res.json({ ok: true, data: null, mensaje: 'Evento cancelado' });
  } catch (error) {
    console.error('[asistencias] deleteDeshacerEvento:', error.message);
    res.status(500).json({ ok: false, data: null, mensaje: error.message });
  }
};

const getRecuperarSesion = async (req, res) => {
  try {
    const sesion = await repository.recuperarSesion(req.params.conductorId);
    res.json({ ok: true, data: sesion });
  } catch (error) {
    console.error('[asistencias] getRecuperarSesion:', error.message);
    res.status(500).json({ ok: false, data: null, mensaje: error.message });
  }
};

// Guarda la ubicación GPS del conductor y la emite por socket.io a los clientes
const postUbicacionConductor = async (req, res) => {
  try {
    const { viajeId, lat, lng } = req.body;
    if (!viajeId || !lat || !lng) {
      return res.status(400).json({ ok: false, data: null, mensaje: 'Se requiere viajeId, lat y lng' });
    }

    // Persistir en BD (para consultas históricas / padre sin socket)
    await repository.guardarUbicacion(viajeId, parseFloat(lat), parseFloat(lng));

    // Emitir en tiempo real si socket.io está disponible
    const { io } = require('../../server');
    if (io) {
      io.to(`viaje-${viajeId}`).emit('bus:posicion', {
        viajeId, lat: parseFloat(lat), lng: parseFloat(lng), timestamp: Date.now()
      });
      // También emite a la sala de monitoreo del admin
      io.to('admin-monitoreo').emit('bus:posicion', {
        viajeId, lat: parseFloat(lat), lng: parseFloat(lng), timestamp: Date.now()
      });
    }

    res.json({ ok: true, data: null, mensaje: 'Ubicación guardada' });
  } catch (error) {
    console.error('[asistencias] postUbicacionConductor:', error.message);
    res.status(500).json({ ok: false, data: null, mensaje: error.message });
  }
};

const getUltimaUbicacion = async (req, res) => {
  try {
    const ubicacion = await repository.obtenerUltimaUbicacion(req.params.viajeId);
    res.json({ ok: true, data: ubicacion });
  } catch (error) {
    console.error('[asistencias] getUltimaUbicacion:', error.message);
    res.status(500).json({ ok: false, data: null, mensaje: error.message });
  }
};

const getTurnosAbiertos = async (req, res) => {
  try {
    const turnos = await repository.obtenerTurnosAbiertos();
    res.json({ ok: true, data: turnos });
  } catch (error) {
    console.error('[asistencias] getTurnosAbiertos:', error.message);
    res.status(500).json({ ok: false, data: null, mensaje: error.message });
  }
};

const putReasignarTurno = async (req, res) => {
  try {
    const turno = await repository.reasignarTurno(req.params.id, req.body.nuevoConductorId);
    res.json({ ok: true, data: turno, mensaje: 'Turno reasignado' });
  } catch (error) {
    console.error('[asistencias] putReasignarTurno:', error.message);
    res.status(500).json({ ok: false, data: null, mensaje: error.message });
  }
};

const putForzarCierreTurno = async (req, res) => {
  try {
    const turno = await repository.forzarCierreTurno(req.params.id);
    res.json({ ok: true, data: turno, mensaje: 'Turno cerrado forzosamente' });
  } catch (error) {
    console.error('[asistencias] putForzarCierreTurno:', error.message);
    res.status(500).json({ ok: false, data: null, mensaje: error.message });
  }
};

const getHistorialTurnos = async (req, res) => {
  try {
    const { fechaInicio, fechaFin, rutaId } = req.query;
    const turnos = await repository.obtenerHistorialTurnos(fechaInicio, fechaFin, rutaId);
    res.json({ ok: true, data: turnos });
  } catch (error) {
    console.error('[asistencias] getHistorialTurnos:', error.message);
    res.status(500).json({ ok: false, data: null, mensaje: error.message });
  }
};

const getDetalleTurno = async (req, res) => {
  try {
    const detalle = await repository.obtenerDetalleTurno(req.params.id);
    res.json({ ok: true, data: detalle });
  } catch (error) {
    console.error('[asistencias] getDetalleTurno:', error.message);
    res.status(500).json({ ok: false, data: null, mensaje: error.message });
  }
};

module.exports = {
  postAbrirTurno, putCerrarTurno, postIniciarViaje, putFinalizarViaje,
  postRegistrarEvento, deleteDeshacerEvento, getRecuperarSesion,
  postUbicacionConductor, getUltimaUbicacion,
  getTurnosAbiertos, putReasignarTurno, putForzarCierreTurno,
  getHistorialTurnos, getDetalleTurno
};