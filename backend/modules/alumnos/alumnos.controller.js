const service = require('./alumnos.service');

const responderError = (res, error, contexto, mensajeGenerico) => {
  console.error(`[alumnos] ${contexto}:`, error.message);

  return res.status(error.status || 500).json({
    ok: false,
    data: null,
    mensaje: error.status ? error.message : mensajeGenerico
  });
};

const listar = async (_req, res) => {
  try {
    return res.status(200).json(await service.listarAlumnos());
  } catch (error) {
    return responderError(res, error, 'listar', 'Error al listar alumnos');
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
    return res.status(201).json(await service.registrarAlumno(req.body));
  } catch (error) {
    return responderError(res, error, 'crear', 'Error al registrar alumno');
  }
};

const editar = async (req, res) => {
  try {
    return res.status(200).json(await service.modificarAlumno(req.params.id, req.body));
  } catch (error) {
    return responderError(res, error, 'editar', 'Error al actualizar alumno');
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
    return res.status(200).json(await service.eliminarAlumno(req.params.id));
  } catch (error) {
    return responderError(res, error, 'eliminar', 'Error al eliminar alumno');
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
