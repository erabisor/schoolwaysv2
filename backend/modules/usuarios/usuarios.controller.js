const service = require('./usuarios.service');

const listar = async (req, res) => {
  try {
    const resultado = await service.listarUsuarios();
    res.status(200).json(resultado);
  } catch (error) {
    console.error('[usuarios] listar:', error.message);
    res.status(500).json({ ok: false, data: null, mensaje: 'Error al listar usuarios' });
  }
};

const crear = async (req, res) => {
  try {
    const resultado = await service.registrarUsuario(req.body);
    res.status(201).json(resultado);
  } catch (error) {
    console.error('[usuarios] crear:', error.message);
    if (error.number === 2627) return res.status(400).json({ ok: false, data: null, mensaje: 'El correo ya está en uso' });
    res.status(500).json({ ok: false, data: null, mensaje: 'Error al crear usuario' });
  }
};

const editar = async (req, res) => {
  try {
    const resultado = await service.modificarUsuario(req.params.id, req.body);
    res.status(200).json(resultado);
  } catch (error) {
    console.error('[usuarios] editar:', error.message);
    if (error.number === 2627) return res.status(400).json({ ok: false, data: null, mensaje: 'El correo ya está en uso' });
    res.status(500).json({ ok: false, data: null, mensaje: 'Error al actualizar usuario' });
  }
};

const cambiarEstado = async (req, res) => {
  try {
    const resultado = await service.alternarEstado(req.params.id, req.body.estado);
    res.status(200).json(resultado);
  } catch (error) {
    console.error('[usuarios] cambiarEstado:', error.message);
    res.status(500).json({ ok: false, data: null, mensaje: 'Error al actualizar estado' });
  }
};

const eliminar = async (req, res) => {
  try {
    const resultado = await service.eliminarUsuario(req.params.id);
    res.status(200).json(resultado);
  } catch (error) {
    console.error('[usuarios] eliminar:', error.message);
    res.status(500).json({ ok: false, data: null, mensaje: 'Error al eliminar' });
  }
};

module.exports = { listar, crear, editar, cambiarEstado, eliminar };
