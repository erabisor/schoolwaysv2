const service = require('./mantenimientos.service');

const obtenerUsuarioRegistroId = (req) => {
  const usuario = req.usuario || req.user || {};
  return usuario.id || usuario.UsuarioID || usuario.usuarioId || null;
};

const responderError = (res, error, contexto, mensajeGenerico = 'Error interno') => {
  console.error(`[mantenimientos] ${contexto}:`, error.message);

  return res.status(error.status || 500).json({
    ok: false,
    data: null,
    mensaje: error.status ? error.message : mensajeGenerico
  });
};

const listar = async (req, res) => {
  try {
    const resultado = await service.listar(req.query);
    return res.status(200).json(resultado);
  } catch (error) {
    return responderError(res, error, 'listar', 'Error al listar mantenimientos');
  }
};

const listarPorVehiculo = async (req, res) => {
  try {
    const resultado = await service.listarPorVehiculo(req.params.vehiculoId);
    return res.status(200).json(resultado);
  } catch (error) {
    return responderError(res, error, 'listarPorVehiculo', 'Error al listar mantenimientos del vehículo');
  }
};

const crear = async (req, res) => {
  try {
    const resultado = await service.crear(req.body, obtenerUsuarioRegistroId(req));
    return res.status(201).json(resultado);
  } catch (error) {
    return responderError(res, error, 'crear', 'Error al crear mantenimiento');
  }
};

const editar = async (req, res) => {
  try {
    const resultado = await service.editar(req.params.id, req.body);
    return res.status(200).json(resultado);
  } catch (error) {
    return responderError(res, error, 'editar', 'Error al actualizar mantenimiento');
  }
};

const cambiarEstado = async (req, res) => {
  try {
    const resultado = await service.cambiarEstado(req.params.id, req.body.estado);
    return res.status(200).json(resultado);
  } catch (error) {
    return responderError(res, error, 'cambiarEstado', 'Error al cambiar estado');
  }
};

const eliminar = async (req, res) => {
  try {
    const resultado = await service.eliminar(req.params.id);
    return res.status(200).json(resultado);
  } catch (error) {
    return responderError(res, error, 'eliminar', 'Error al eliminar mantenimiento');
  }
};

module.exports = {
  listar,
  listarPorVehiculo,
  crear,
  editar,
  cambiarEstado,
  eliminar
};
