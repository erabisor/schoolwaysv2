const repository = require('./rutas.repository');

const listarRutas = async () => {
  const datos = await repository.obtenerTodos();
  return { ok: true, data: datos, mensaje: 'Rutas obtenidas' };
};

const listarOpciones = async () => {
  const datos = await repository.obtenerOpciones();
  return { ok: true, data: datos, mensaje: 'Opciones obtenidas' };
};

const registrarRuta = async (datos) => {
  const insertado = await repository.crear(datos);
  return { ok: true, data: insertado, mensaje: 'Ruta creada exitosamente' };
};

const modificarRuta = async (id, datos) => {
  await repository.actualizar(id, datos);
  return { ok: true, data: null, mensaje: 'Ruta actualizada exitosamente' };
};

const alternarEstado = async (id, estado) => {
  await repository.cambiarEstado(id, estado);
  return { ok: true, data: null, mensaje: 'Estado de ruta actualizado' };
};

const eliminarRuta = async (id) => {
  await repository.eliminar(id);
  return { ok: true, data: null, mensaje: 'Ruta eliminada correctamente' };
};

module.exports = { listarRutas, listarOpciones, registrarRuta, modificarRuta, alternarEstado, eliminarRuta };