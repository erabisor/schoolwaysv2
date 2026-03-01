const bcrypt = require('bcryptjs');
const repository = require('./usuarios.repository');

const listarUsuarios = async () => {
  const usuarios = await repository.obtenerTodos();
  return { ok: true, data: usuarios, mensaje: 'Usuarios obtenidos' };
};

const registrarUsuario = async (datos) => {
  const hash = await bcrypt.hash(datos.password, 10);
  const nuevoUsuario = { ...datos, PasswordHash: hash };
  const insertado = await repository.crear(nuevoUsuario);
  return { ok: true, data: insertado, mensaje: 'Usuario creado exitosamente' };
};

const modificarUsuario = async (id, datos) => {
  let hash = null;
  if (datos.password && datos.password.trim() !== '') {
    hash = await bcrypt.hash(datos.password, 10);
  }
  await repository.actualizar(id, { ...datos, PasswordHash: hash });
  return { ok: true, data: null, mensaje: 'Usuario actualizado exitosamente' };
};

const alternarEstado = async (id, estado) => {
  await repository.cambiarEstado(id, estado);
  return { ok: true, data: null, mensaje: 'Estado actualizado correctamente' };
};

const eliminarUsuario = async (id) => {
  await repository.eliminar(id);
  return { ok: true, data: null, mensaje: 'Usuario eliminado correctamente' };
};

module.exports = { listarUsuarios, registrarUsuario, modificarUsuario, alternarEstado, eliminarUsuario };