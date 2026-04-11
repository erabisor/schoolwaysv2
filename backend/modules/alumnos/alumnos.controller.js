const service = require('./alumnos.service');

const listar = async (req, res) => {
  try {
    res.status(200).json(await service.listarAlumnos());
  } catch (error) {
    console.error('[alumnos] listar:', error.message);
    res.status(500).json({ ok: false, data: null, mensaje: 'Error al listar alumnos' });
  }
};

const opciones = async (req, res) => {
  try {
    res.status(200).json(await service.listarOpciones());
  } catch (error) {
    console.error('[alumnos] opciones:', error.message);
    res.status(500).json({ ok: false, data: null, mensaje: 'Error al cargar opciones' });
  }
};

const crear = async (req, res) => {
  try {
    res.status(201).json(await service.registrarAlumno(req.body));
  } catch (error) {
    console.error('[alumnos] crear:', error.message);
    res.status(500).json({ ok: false, data: null, mensaje: 'Error al registrar alumno' });
  }
};

const editar = async (req, res) => {
  try {
    res.status(200).json(await service.modificarAlumno(req.params.id, req.body));
  } catch (error) {
    console.error('[alumnos] editar:', error.message);
    res.status(500).json({ ok: false, data: null, mensaje: 'Error al actualizar alumno' });
  }
};

const cambiarEstado = async (req, res) => {
  try {
    res.status(200).json(await service.alternarEstado(req.params.id, req.body.estado));
  } catch (error) {
    console.error('[alumnos] cambiarEstado:', error.message);
    res.status(500).json({ ok: false, data: null, mensaje: 'Error al cambiar estado' });
  }
};

const eliminar = async (req, res) => {
  try {
    res.status(200).json(await service.eliminarAlumno(req.params.id));
  } catch (error) {
    console.error('[alumnos] eliminar:', error.message);
    res.status(500).json({ ok: false, data: null, mensaje: 'Error al eliminar alumno' });
  }
};

module.exports = { listar, opciones, crear, editar, cambiarEstado, eliminar };
