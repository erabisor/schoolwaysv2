const repository = require('./alumnos.repository');

const listarAlumnos = async () => ({ ok: true, data: await repository.obtenerTodos(), mensaje: 'Alumnos obtenidos' });
const listarOpciones = async () => ({ ok: true, data: await repository.obtenerOpciones(), mensaje: 'Opciones cargadas' });
const registrarAlumno = async (datos) => ({ ok: true, data: await repository.crear(datos), mensaje: 'Alumno registrado' });
const modificarAlumno = async (id, datos) => {
  await repository.actualizar(id, datos);
  return { ok: true, data: null, mensaje: 'Alumno actualizado' };
};
const alternarEstado = async (id, estado) => {
  await repository.cambiarEstado(id, estado);
  return { ok: true, data: null, mensaje: 'Estado actualizado' };
};
const eliminarAlumno = async (id) => {
  await repository.eliminar(id);
  return { ok: true, data: null, mensaje: 'Alumno eliminado' };
};

module.exports = { listarAlumnos, listarOpciones, registrarAlumno, modificarAlumno, alternarEstado, eliminarAlumno };