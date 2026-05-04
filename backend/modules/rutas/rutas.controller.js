const service = require('./rutas.service');

const responderError = (res, error, contexto, mensajeGenerico) => {
  console.error(`[rutas] ${contexto}:`, error.message);

  return res.status(error.status || 500).json({
    ok: false,
    data: null,
    mensaje: error.status ? error.message : mensajeGenerico
  });
};

const listar = async (_req, res) => {
  try {
    return res.status(200).json(await service.listarRutas());
  } catch (error) {
    return responderError(res, error, 'listar', 'Error al listar rutas');
  }
};

const opciones = async (_req, res) => {
  try {
    return res.status(200).json(await service.listarOpciones());
  } catch (error) {
    return responderError(res, error, 'opciones', 'Error al cargar opciones');
  }
};

const crear = async (req, res) => {
  try {
    return res.status(201).json(await service.registrarRuta(req.body));
  } catch (error) {
    return responderError(res, error, 'crear', 'Error al crear ruta');
  }
};

const editar = async (req, res) => {
  try {
    return res.status(200).json(await service.modificarRuta(req.params.id, req.body));
  } catch (error) {
    return responderError(res, error, 'editar', 'Error al actualizar ruta');
  }
};

const cambiarEstado = async (req, res) => {
  try {
    return res.status(200).json(await service.alternarEstado(req.params.id, req.body.estado));
  } catch (error) {
    return responderError(res, error, 'cambiarEstado', 'Error al cambiar estado');
  }
};

const eliminar = async (req, res) => {
  try {
    return res.status(200).json(await service.eliminarRuta(req.params.id));
  } catch (error) {
    return responderError(res, error, 'eliminar', 'Error al eliminar ruta');
  }
};

module.exports = {
  listar,
  opciones,
  crear,
  editar,
  cambiarEstado,
  eliminar
};
