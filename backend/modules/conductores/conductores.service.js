const repository = require('./conductores.repository');

const listarConductores = async () => {
  const datos = await repository.obtenerTodos();
  return { ok: true, data: datos, mensaje: 'Conductores obtenidos' };
};

const listarUsuariosDisponibles = async () => {
  const datos = await repository.obtenerUsuariosDisponibles();
  return { ok: true, data: datos, mensaje: 'Usuarios disponibles obtenidos' };
};

const registrarConductor = async (datos) => {
  const insertado = await repository.crear(datos);
  return { ok: true, data: insertado, mensaje: 'Conductor registrado exitosamente' };
};

const modificarConductor = async (id, datos) => {
  await repository.actualizar(id, datos);
  return { ok: true, data: null, mensaje: 'Conductor actualizado exitosamente' };
};

const alternarEstado = async (id, estado) => {
  await repository.cambiarEstado(id, estado);
  return { ok: true, data: null, mensaje: 'Estado actualizado correctamente' };
};

const eliminarConductor = async (id) => {
  await repository.eliminar(id);
  return { ok: true, data: null, mensaje: 'Conductor eliminado correctamente' };
};

module.exports = { listarConductores, listarUsuariosDisponibles, registrarConductor, modificarConductor, alternarEstado, eliminarConductor };