const service = require('./vehiculos.service');

const listar = async (req, res) => {
  try {
    const resultado = await service.listarVehiculos();
    res.status(200).json(resultado);
  } catch (error) {
    console.error('[vehiculos] listar:', error.message);
    res.status(500).json({ ok: false, data: null, mensaje: 'Error al listar vehículos' });
  }
};

const crear = async (req, res) => {
  try {
    const resultado = await service.registrarVehiculo(req.body);
    res.status(201).json(resultado);
  } catch (error) {
    console.error('[vehiculos] crear:', error.message);
    if (error.number === 2627) return res.status(400).json({ ok: false, data: null, mensaje: 'La placa ya está registrada' });
    res.status(500).json({ ok: false, data: null, mensaje: 'Error al registrar vehículo' });
  }
};

const editar = async (req, res) => {
  try {
    const resultado = await service.modificarVehiculo(req.params.id, req.body);
    res.status(200).json(resultado);
  } catch (error) {
    console.error('[vehiculos] editar:', error.message);
    if (error.number === 2627) return res.status(400).json({ ok: false, data: null, mensaje: 'La placa ya está en uso' });
    res.status(500).json({ ok: false, data: null, mensaje: 'Error al actualizar vehículo' });
  }
};

const cambiarEstado = async (req, res) => {
  try {
    const resultado = await service.alternarEstado(req.params.id, req.body.estado);
    res.status(200).json(resultado);
  } catch (error) {
    console.error('[vehiculos] cambiarEstado:', error.message);
    res.status(500).json({ ok: false, data: null, mensaje: 'Error al actualizar estado' });
  }
};

const eliminar = async (req, res) => {
  try {
    const resultado = await service.eliminarVehiculo(req.params.id);
    res.status(200).json(resultado);
  } catch (error) {
    console.error('[vehiculos] eliminar:', error.message);
    res.status(500).json({ ok: false, data: null, mensaje: 'Error al eliminar vehículo' });
  }
};

module.exports = { listar, crear, editar, cambiarEstado, eliminar };
