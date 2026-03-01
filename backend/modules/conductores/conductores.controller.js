const service = require('./conductores.service');

const listar = async (req, res) => {
  try { res.status(200).json(await service.listarConductores()); } 
  catch (error) { res.status(500).json({ ok: false, data: null, mensaje: 'Error al listar' }); }
};

const listarDisponibles = async (req, res) => {
  try { res.status(200).json(await service.listarUsuariosDisponibles()); } 
  catch (error) { res.status(500).json({ ok: false, data: null, mensaje: 'Error al buscar disponibles' }); }
};

const crear = async (req, res) => {
  try { res.status(201).json(await service.registrarConductor(req.body)); } 
  catch (error) { res.status(500).json({ ok: false, data: null, mensaje: 'Error al registrar' }); }
};

const editar = async (req, res) => {
  try { res.status(200).json(await service.modificarConductor(req.params.id, req.body)); } 
  catch (error) { res.status(500).json({ ok: false, data: null, mensaje: 'Error al actualizar' }); }
};

const cambiarEstado = async (req, res) => {
  try { res.status(200).json(await service.alternarEstado(req.params.id, req.body.estado)); } 
  catch (error) { res.status(500).json({ ok: false, data: null, mensaje: 'Error al cambiar estado' }); }
};

const eliminar = async (req, res) => {
  try { res.status(200).json(await service.eliminarConductor(req.params.id)); } 
  catch (error) { res.status(500).json({ ok: false, data: null, mensaje: 'Error al eliminar' }); }
};

module.exports = { listar, listarDisponibles, crear, editar, cambiarEstado, eliminar };