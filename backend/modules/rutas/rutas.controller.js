const service = require('./rutas.service');

const listar = async (req, res) => {
  try { res.status(200).json(await service.listarRutas()); }
  catch (error) {
    console.error('[rutas] listar:', error.message);
    res.status(500).json({ ok: false, data: null, mensaje: 'Error al listar rutas' });
  }
};

const opciones = async (req, res) => {
  try { res.status(200).json(await service.listarOpciones()); }
  catch (error) {
    console.error('[rutas] opciones:', error.message);
    res.status(500).json({ ok: false, data: null, mensaje: 'Error al cargar opciones' });
  }
};

const crear = async (req, res) => {
  try { res.status(201).json(await service.registrarRuta(req.body)); }
  catch (error) {
    console.error('[rutas] crear:', error.message);
    res.status(500).json({ ok: false, data: null, mensaje: 'Error al crear ruta' });
  }
};

const editar = async (req, res) => {
  try { res.status(200).json(await service.modificarRuta(req.params.id, req.body)); }
  catch (error) {
    console.error('[rutas] editar:', error.message);
    res.status(500).json({ ok: false, data: null, mensaje: 'Error al actualizar ruta' });
  }
};

const cambiarEstado = async (req, res) => {
  try { res.status(200).json(await service.alternarEstado(req.params.id, req.body.estado)); }
  catch (error) {
    console.error('[rutas] cambiarEstado:', error.message);
    res.status(500).json({ ok: false, data: null, mensaje: 'Error al cambiar estado' });
  }
};

const eliminar = async (req, res) => {
  try { res.status(200).json(await service.eliminarRuta(req.params.id)); }
  catch (error) {
    console.error('[rutas] eliminar:', error.message);
    res.status(500).json({ ok: false, data: null, mensaje: 'Error al eliminar ruta' });
  }
};

module.exports = { listar, opciones, crear, editar, cambiarEstado, eliminar };
