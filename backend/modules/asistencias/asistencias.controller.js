const repository = require('./asistencias.repository');

const obtenerActor = (req) => req.usuario || req.user || {};

const responderError = (res, error, contexto, mensajeGenerico = 'Error interno') => {
  console.error(`[asistencias] ${contexto}:`, error.message);

  return res.status(error.status || 400).json({
    ok: false,
    data: null,
    mensaje: error.status ? error.message : (error.message || mensajeGenerico)
  });
};

const postAbrirTurno = async (req, res) => {
  try {
    const turno = await repository.abrirTurno(req.body.conductorId, req.body.rutaId, obtenerActor(req));
    return res.status(201).json({ ok: true, data: turno, mensaje: 'Turno abierto correctamente' });
  } catch (error) {
    return responderError(res, error, 'postAbrirTurno', 'Error al abrir turno');
  }
};

const putCerrarTurno = async (req, res) => {
  try {
    const turno = await repository.cerrarTurno(req.params.id, obtenerActor(req));
    return res.json({ ok: true, data: turno, mensaje: 'Turno cerrado correctamente' });
  } catch (error) {
    return responderError(res, error, 'putCerrarTurno', 'Error al cerrar turno');
  }
};

const postIniciarViaje = async (req, res) => {
  try {
    const { turnoId, rutaId, sentido } = req.body;
    const viaje = await repository.iniciarViaje(turnoId, rutaId, sentido, obtenerActor(req));
    const alumnos = await repository.obtenerAlumnosPorSentido(rutaId, sentido);
    return res.status(201).json({ ok: true, data: { viaje, alumnos }, mensaje: 'Viaje iniciado' });
  } catch (error) {
    return responderError(res, error, 'postIniciarViaje', 'Error al iniciar viaje');
  }
};

const putFinalizarViaje = async (req, res) => {
  try {
    const viaje = await repository.finalizarViaje(req.params.id, obtenerActor(req));
    return res.json({ ok: true, data: viaje, mensaje: 'Viaje finalizado' });
  } catch (error) {
    return responderError(res, error, 'putFinalizarViaje', 'Error al finalizar viaje');
  }
};

const postRegistrarEvento = async (req, res) => {
  try {
    const evento = await repository.registrarEvento(req.body, obtenerActor(req));
    return res.status(201).json({ ok: true, data: evento, mensaje: 'Evento registrado' });
  } catch (error) {
    return responderError(res, error, 'postRegistrarEvento', 'Error al registrar evento');
  }
};

const deleteDeshacerEvento = async (req, res) => {
  try {
    const { alumnoId, rutaId, sentido, tipoEvento } = req.body;
    const rowsAffected = await repository.deshacerEvento(alumnoId, rutaId, sentido, tipoEvento, obtenerActor(req));
    return res.json({
      ok: true,
      data: { rowsAffected },
      mensaje: rowsAffected > 0 ? 'Evento cancelado' : 'No había evento para cancelar'
    });
  } catch (error) {
    return responderError(res, error, 'deleteDeshacerEvento', 'Error al deshacer evento');
  }
};

const getRecuperarSesion = async (req, res) => {
  try {
    const sesion = await repository.recuperarSesion(req.params.conductorId, obtenerActor(req));
    return res.json({ ok: true, data: sesion });
  } catch (error) {
    return responderError(res, error, 'getRecuperarSesion', 'Error al recuperar sesión');
  }
};

const postUbicacionConductor = async (req, res) => {
  try {
    const { viajeId, lat, lng } = req.body;

    if (viajeId === undefined || viajeId === null || lat === undefined || lat === null || lng === undefined || lng === null) {
      return res.status(400).json({ ok: false, data: null, mensaje: 'Se requiere viajeId, lat y lng' });
    }

    const latNumero = Number(lat);
    const lngNumero = Number(lng);
    await repository.guardarUbicacion(viajeId, latNumero, lngNumero, obtenerActor(req));

    try {
      const { io } = require('../../server');
      if (io) {
        const payload = { viajeId, lat: latNumero, lng: lngNumero, timestamp: Date.now() };
        io.to(`viaje-${viajeId}`).emit('bus:posicion', payload);
        io.to('admin-monitoreo').emit('bus:posicion', payload);
      }
    } catch (socketError) {
      console.error('[asistencias] socket ubicación:', socketError.message);
    }

    return res.json({ ok: true, data: null, mensaje: 'Ubicación guardada' });
  } catch (error) {
    return responderError(res, error, 'postUbicacionConductor', 'Error al guardar ubicación');
  }
};

const getUltimaUbicacion = async (req, res) => {
  try {
    const ubicacion = await repository.obtenerUltimaUbicacion(req.params.viajeId, obtenerActor(req));
    return res.json({ ok: true, data: ubicacion });
  } catch (error) {
    return responderError(res, error, 'getUltimaUbicacion', 'Error al consultar ubicación');
  }
};

const getTurnosAbiertos = async (_req, res) => {
  try {
    const turnos = await repository.obtenerTurnosAbiertos();
    return res.json({ ok: true, data: turnos });
  } catch (error) {
    return responderError(res, error, 'getTurnosAbiertos', 'Error al listar turnos abiertos');
  }
};

const putReasignarTurno = async (req, res) => {
  try {
    const turno = await repository.reasignarTurno(req.params.id, req.body.nuevoConductorId);
    return res.json({ ok: true, data: turno, mensaje: 'Turno reasignado' });
  } catch (error) {
    return responderError(res, error, 'putReasignarTurno', 'Error al reasignar turno');
  }
};

const putForzarCierreTurno = async (req, res) => {
  try {
    const turno = await repository.forzarCierreTurno(req.params.id);
    return res.json({ ok: true, data: turno, mensaje: 'Turno cerrado forzosamente' });
  } catch (error) {
    return responderError(res, error, 'putForzarCierreTurno', 'Error al forzar cierre de turno');
  }
};

const getHistorialTurnos = async (req, res) => {
  try {
    const { fechaInicio, fechaFin, rutaId } = req.query;
    const turnos = await repository.obtenerHistorialTurnos(fechaInicio, fechaFin, rutaId);
    return res.json({ ok: true, data: turnos });
  } catch (error) {
    return responderError(res, error, 'getHistorialTurnos', 'Error al consultar historial');
  }
};

const getDetalleTurno = async (req, res) => {
  try {
    const detalle = await repository.obtenerDetalleTurno(req.params.id);
    return res.json({ ok: true, data: detalle });
  } catch (error) {
    return responderError(res, error, 'getDetalleTurno', 'Error al consultar detalle de turno');
  }
};

module.exports = {
  postAbrirTurno,
  putCerrarTurno,
  postIniciarViaje,
  putFinalizarViaje,
  postRegistrarEvento,
  deleteDeshacerEvento,
  getRecuperarSesion,
  postUbicacionConductor,
  getUltimaUbicacion,
  getTurnosAbiertos,
  putReasignarTurno,
  putForzarCierreTurno,
  getHistorialTurnos,
  getDetalleTurno
};
