const repository = require('./padres.repository');

const crearError = (mensaje, status = 400) => {
  const error = new Error(mensaje);
  error.status = status;
  return error;
};

const validarId = (valor, nombreCampo) => {
  const numero = Number(valor);

  if (!Number.isInteger(numero) || numero <= 0) {
    throw crearError(`${nombreCampo} debe ser un identificador válido.`);
  }

  return numero;
};

const validarUsuarioPadre = async (usuarioId) => {
  const usuarioIdNum = validarId(usuarioId, 'El usuario');
  const existe = await repository.existePadrePorUsuario(usuarioIdNum);

  if (!existe) {
    throw crearError('No existe un perfil de padre asociado a este usuario.', 404);
  }

  return usuarioIdNum;
};

const listarHijos = async (usuarioId) => {
  const usuarioIdNum = await validarUsuarioPadre(usuarioId);
  const hijos = await repository.obtenerHijosPorUsuario(usuarioIdNum);

  return {
    ok: true,
    data: hijos,
    mensaje: hijos.length > 0 ? 'Hijos obtenidos' : 'No tienes hijos asignados'
  };
};

const obtenerTransporteHoy = async (usuarioId) => {
  const usuarioIdNum = await validarUsuarioPadre(usuarioId);
  const estados = await repository.obtenerTransporteHoy(usuarioIdNum);

  return {
    ok: true,
    data: estados,
    mensaje: estados.length > 0 ? 'Estado del transporte obtenido' : 'Sin transporte registrado hoy'
  };
};

const obtenerHistorialSemanal = async (usuarioId) => {
  const usuarioIdNum = await validarUsuarioPadre(usuarioId);
  const historial = await repository.obtenerHistorialSemanal(usuarioIdNum);

  return {
    ok: true,
    data: historial,
    mensaje: historial.length > 0 ? 'Historial semanal obtenido' : 'Sin historial reciente'
  };
};

const listarNotificaciones = async (usuarioId) => {
  const usuarioIdNum = await validarUsuarioPadre(usuarioId);
  const notificaciones = await repository.obtenerNotificaciones(usuarioIdNum);

  return {
    ok: true,
    data: notificaciones,
    mensaje: 'Notificaciones obtenidas'
  };
};

const obtenerResumenNotificaciones = async (usuarioId) => {
  const usuarioIdNum = await validarUsuarioPadre(usuarioId);
  const resumen = await repository.obtenerResumenNotificaciones(usuarioIdNum);

  return {
    ok: true,
    data: resumen,
    mensaje: 'Resumen de notificaciones obtenido'
  };
};

const marcarNotificacionLeida = async (usuarioId, notificacionId) => {
  const usuarioIdNum = await validarUsuarioPadre(usuarioId);
  const notificacionIdNum = validarId(notificacionId, 'La notificación');
  const actualizada = await repository.marcarNotificacionLeida(usuarioIdNum, notificacionIdNum);

  if (!actualizada) {
    throw crearError('Notificación no encontrada o no pertenece al usuario autenticado.', 404);
  }

  return {
    ok: true,
    data: null,
    mensaje: 'Notificación marcada como leída'
  };
};

const marcarTodasNotificacionesLeidas = async (usuarioId) => {
  const usuarioIdNum = await validarUsuarioPadre(usuarioId);
  const totalActualizadas = await repository.marcarTodasNotificacionesLeidas(usuarioIdNum);

  return {
    ok: true,
    data: { totalActualizadas },
    mensaje: 'Notificaciones marcadas como leídas'
  };
};

module.exports = {
  listarHijos,
  obtenerTransporteHoy,
  obtenerHistorialSemanal,
  listarNotificaciones,
  obtenerResumenNotificaciones,
  marcarNotificacionLeida,
  marcarTodasNotificacionesLeidas
};
