const repository = require('./vehiculos.repository');

const listarVehiculos = async () => {
  const vehiculos = await repository.obtenerTodos();
  return { ok: true, data: vehiculos, mensaje: 'Vehículos obtenidos' };
};

const registrarVehiculo = async (datos) => {
  const insertado = await repository.crear(datos);
  return { ok: true, data: insertado, mensaje: 'Vehículo registrado exitosamente' };
};

const modificarVehiculo = async (id, datos) => {
  await repository.actualizar(id, datos);
  return { ok: true, data: null, mensaje: 'Vehículo actualizado exitosamente' };
};

const alternarEstado = async (id, estado) => {
  await repository.cambiarEstado(id, estado);
  return { ok: true, data: null, mensaje: 'Estado actualizado correctamente' };
};

const eliminarVehiculo = async (id) => {
  await repository.eliminar(id);
  return { ok: true, data: null, mensaje: 'Vehículo eliminado correctamente' };
};

module.exports = { listarVehiculos, registrarVehiculo, modificarVehiculo, alternarEstado, eliminarVehiculo };