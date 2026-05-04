const repository = require('./rutas.repository');

const TURNOS_VALIDOS = ['Mañana', 'Tarde', 'Ambos'];

const crearError = (mensaje, status = 400) => {
  const error = new Error(mensaje);
  error.status = status;
  return error;
};

const esVacio = (valor) => {
  return valor === undefined || valor === null || String(valor).trim() === '';
};

const validarIdNumerico = (valor, nombreCampo, requerido = false) => {
  if (esVacio(valor)) {
    if (requerido) throw crearError(`${nombreCampo} es obligatorio.`);
    return null;
  }

  const numero = Number(valor);

  if (!Number.isInteger(numero) || numero <= 0) {
    throw crearError(`${nombreCampo} debe ser un identificador válido.`);
  }

  return numero;
};

const validarCapacidad = (valor) => {
  if (esVacio(valor)) {
    throw crearError('La capacidad máxima es obligatoria.');
  }

  const numero = Number(valor);

  if (!Number.isInteger(numero) || numero <= 0) {
    throw crearError('La capacidad máxima debe ser un número entero mayor que cero.');
  }

  if (numero > 255) {
    throw crearError('La capacidad máxima no puede ser mayor a 255.');
  }

  return numero;
};

const validarDatosRuta = (datos) => {
  if (!datos || typeof datos !== 'object') {
    throw crearError('Datos de ruta inválidos.');
  }

  if (esVacio(datos.NombreRuta)) {
    throw crearError('El nombre de la ruta es obligatorio.');
  }

  if (String(datos.NombreRuta).trim().length < 3) {
    throw crearError('El nombre de la ruta debe tener al menos 3 caracteres.');
  }

  const turno = datos.Turno || 'Mañana';

  if (!TURNOS_VALIDOS.includes(turno)) {
    throw crearError('El turno debe ser Mañana, Tarde o Ambos.');
  }

  validarCapacidad(datos.CapacidadMaxima);
  validarIdNumerico(datos.ConductorID, 'El conductor', false);
  validarIdNumerico(datos.VehiculoID, 'El vehículo', false);
};

const listarRutas = async () => {
  const datos = await repository.obtenerTodos();

  return {
    ok: true,
    data: datos,
    mensaje: 'Rutas obtenidas'
  };
};

const listarOpciones = async () => {
  const datos = await repository.obtenerOpciones();

  return {
    ok: true,
    data: datos,
    mensaje: 'Opciones obtenidas'
  };
};

const registrarRuta = async (datos) => {
  validarDatosRuta(datos);

  const insertado = await repository.crear(datos);

  return {
    ok: true,
    data: insertado,
    mensaje: 'Ruta creada exitosamente'
  };
};

const modificarRuta = async (id, datos) => {
  validarIdNumerico(id, 'La ruta', true);
  validarDatosRuta(datos);

  const actualizada = await repository.actualizar(id, datos);

  if (!actualizada) {
    throw crearError('Ruta no encontrada o eliminada.', 404);
  }

  return {
    ok: true,
    data: null,
    mensaje: 'Ruta actualizada exitosamente'
  };
};

const alternarEstado = async (id, estado) => {
  validarIdNumerico(id, 'La ruta', true);

  if (typeof estado !== 'boolean') {
    throw crearError('El estado debe ser verdadero o falso.');
  }

  const actualizada = await repository.cambiarEstado(id, estado);

  if (!actualizada) {
    throw crearError('Ruta no encontrada o eliminada.', 404);
  }

  return {
    ok: true,
    data: null,
    mensaje: 'Estado de ruta actualizado'
  };
};

const eliminarRuta = async (id) => {
  validarIdNumerico(id, 'La ruta', true);

  const eliminada = await repository.eliminar(id);

  if (!eliminada) {
    throw crearError('Ruta no encontrada.', 404);
  }

  return {
    ok: true,
    data: null,
    mensaje: 'Ruta eliminada correctamente'
  };
};

module.exports = {
  listarRutas,
  listarOpciones,
  registrarRuta,
  modificarRuta,
  alternarEstado,
  eliminarRuta
};
