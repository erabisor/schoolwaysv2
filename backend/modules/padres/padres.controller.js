const service = require('./padres.service');

const obtenerUsuarioId = (req) => {
  const usuario = req.usuario || req.user || {};
  return usuario.id || usuario.UsuarioID || usuario.usuarioId || null;
};

const responderError = (res, error, contexto, mensajeGenerico) => {
  console.error(`[padres] ${contexto}:`, error.message);

  return res.status(error.status || 500).json({
    ok: false,
    data: null,
    mensaje: error.status ? error.message : mensajeGenerico
  });
};

const getHijos = async (req, res) => {
  try {
    return res.status(200).json(await service.listarHijos(obtenerUsuarioId(req)));
  } catch (error) {
    return responderError(res, error, 'getHijos', 'Error al obtener los hijos del padre');
  }
};

const getTransporteHoy = async (req, res) => {
  try {
    return res.status(200).json(await service.obtenerTransporteHoy(obtenerUsuarioId(req)));
  } catch (error) {
    return responderError(res, error, 'getTransporteHoy', 'Error al obtener el estado del transporte');
  }
};

const getHistorialSemanal = async (req, res) => {
  try {
    return res.status(200).json(await service.obtenerHistorialSemanal(obtenerUsuarioId(req)));
  } catch (error) {
    return responderError(res, error, 'getHistorialSemanal', 'Error al obtener el historial semanal');
  }
};

const getNotificaciones = async (req, res) => {
  try {
    return res.status(200).json(await service.listarNotificaciones(obtenerUsuarioId(req)));
  } catch (error) {
    return responderError(res, error, 'getNotificaciones', 'Error al obtener notificaciones');
  }
};

const getResumenNotificaciones = async (req, res) => {
  try {
    return res.status(200).json(await service.obtenerResumenNotificaciones(obtenerUsuarioId(req)));
  } catch (error) {
    return responderError(res, error, 'getResumenNotificaciones', 'Error al obtener resumen de notificaciones');
  }
};

const patchNotificacionLeida = async (req, res) => {
  try {
    return res.status(200).json(await service.marcarNotificacionLeida(obtenerUsuarioId(req), req.params.id));
  } catch (error) {
    return responderError(res, error, 'patchNotificacionLeida', 'Error al actualizar notificación');
  }
};

const patchNotificacionesLeidas = async (req, res) => {
  try {
    return res.status(200).json(await service.marcarTodasNotificacionesLeidas(obtenerUsuarioId(req)));
  } catch (error) {
    return responderError(res, error, 'patchNotificacionesLeidas', 'Error al actualizar notificaciones');
  }
};

module.exports = {
  getHijos,
  getTransporteHoy,
  getHistorialSemanal,
  getNotificaciones,
  getResumenNotificaciones,
  patchNotificacionLeida,
  patchNotificacionesLeidas
};
