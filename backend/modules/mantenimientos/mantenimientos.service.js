const repository = require('./mantenimientos.repository');

const TIPOS_VALIDOS = [
  'Preventivo',
  'Correctivo',
  'Revisión',
  'Cambio de aceite',
  'Frenos',
  'Llantas',
  'Motor',
  'Eléctrico',
  'Inspección',
  'Otro'
];

const ESTADOS_VALIDOS = [
  'Programado',
  'En Proceso',
  'Completado',
  'Cancelado'
];

const PRIORIDADES_VALIDAS = [
  'Baja',
  'Media',
  'Alta',
  'Crítica'
];

const ESTADOS_CERRADOS = ['Completado', 'Cancelado'];

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

const validarNumeroNoNegativo = (valor, nombreCampo) => {
  if (esVacio(valor)) return;

  const numero = Number(valor);

  if (!Number.isFinite(numero) || numero < 0) {
    throw crearError(`${nombreCampo} no puede ser negativo.`);
  }
};

const normalizarFecha = (valor) => {
  if (esVacio(valor)) return null;
  const fecha = new Date(valor);

  if (Number.isNaN(fecha.getTime())) {
    throw crearError('Una de las fechas no tiene un formato válido.');
  }

  return fecha;
};

const validarFechas = (datos) => {
  const fechaInicio = normalizarFecha(datos.FechaInicio);
  const fechaFinalizacion = normalizarFecha(datos.FechaFinalizacion);
  const fechaProgramada = normalizarFecha(datos.FechaProgramada);
  const proximoMantenimiento = normalizarFecha(datos.ProximoMantenimiento);

  if (fechaInicio && fechaFinalizacion && fechaFinalizacion < fechaInicio) {
    throw crearError('La fecha de finalización no puede ser menor que la fecha de inicio.');
  }

  if (fechaProgramada && proximoMantenimiento && proximoMantenimiento < fechaProgramada) {
    throw crearError('El próximo mantenimiento no puede ser anterior a la fecha programada.');
  }
};

const validarDatos = (datos, esEdicion = false) => {
  if (!datos || typeof datos !== 'object') {
    throw crearError('Datos de mantenimiento inválidos.');
  }

  validarIdNumerico(datos.VehiculoID, 'El vehículo', !esEdicion);

  if (!datos.TipoMantenimiento || !TIPOS_VALIDOS.includes(datos.TipoMantenimiento)) {
    throw crearError('Tipo de mantenimiento inválido.');
  }

  if (!datos.EstadoMantenimiento || !ESTADOS_VALIDOS.includes(datos.EstadoMantenimiento)) {
    throw crearError('Estado de mantenimiento inválido.');
  }

  if (!datos.Prioridad || !PRIORIDADES_VALIDAS.includes(datos.Prioridad)) {
    throw crearError('Prioridad inválida.');
  }

  validarNumeroNoNegativo(datos.Costo, 'El costo');
  validarNumeroNoNegativo(datos.Kilometraje, 'El kilometraje');
  validarFechas(datos);
};

const validarTransicionEstado = (estadoActual, nuevoEstado) => {
  if (!ESTADOS_VALIDOS.includes(nuevoEstado)) {
    throw crearError('Estado de mantenimiento inválido.');
  }

  if (!estadoActual) return;

  if (ESTADOS_CERRADOS.includes(estadoActual) && estadoActual !== nuevoEstado) {
    throw crearError(`No se puede cambiar el estado de un mantenimiento ${estadoActual}.`);
  }

  if (estadoActual === 'En Proceso' && nuevoEstado === 'Programado') {
    throw crearError('No se puede regresar un mantenimiento en proceso a Programado.');
  }
};

const listar = async (filtros) => {
  const data = await repository.obtenerTodos(filtros);
  return { ok: true, data, mensaje: 'Mantenimientos obtenidos' };
};

const listarPorVehiculo = async (vehiculoId) => {
  validarIdNumerico(vehiculoId, 'El vehículo', true);
  const data = await repository.obtenerPorVehiculo(vehiculoId);
  return { ok: true, data, mensaje: 'Mantenimientos del vehículo obtenidos' };
};

const crear = async (datos, usuarioRegistroId) => {
  validarDatos(datos, false);

  const vehiculoExiste = await repository.existeVehiculo(datos.VehiculoID);
  if (!vehiculoExiste) throw crearError('El vehículo seleccionado no existe o fue eliminado.', 404);

  const data = await repository.crear(datos, usuarioRegistroId);
  return { ok: true, data, mensaje: 'Mantenimiento registrado correctamente' };
};

const editar = async (id, datos) => {
  validarIdNumerico(id, 'El mantenimiento', true);
  validarDatos(datos, true);

  const actual = await repository.obtenerPorId(id);
  if (!actual) throw crearError('Mantenimiento no encontrado o eliminado.', 404);

  validarTransicionEstado(actual.EstadoMantenimiento, datos.EstadoMantenimiento);

  if (datos.VehiculoID) {
    const vehiculoExiste = await repository.existeVehiculo(datos.VehiculoID);
    if (!vehiculoExiste) throw crearError('El vehículo seleccionado no existe o fue eliminado.', 404);
  }

  const actualizado = await repository.actualizar(id, datos);
  if (!actualizado) throw crearError('Mantenimiento no encontrado o eliminado.', 404);

  return { ok: true, data: null, mensaje: 'Mantenimiento actualizado correctamente' };
};

const cambiarEstado = async (id, estado) => {
  validarIdNumerico(id, 'El mantenimiento', true);

  const actual = await repository.obtenerPorId(id);
  if (!actual) throw crearError('Mantenimiento no encontrado o eliminado.', 404);

  validarTransicionEstado(actual.EstadoMantenimiento, estado);

  const actualizado = await repository.cambiarEstado(id, estado);
  if (!actualizado) throw crearError('Mantenimiento no encontrado o eliminado.', 404);

  return { ok: true, data: null, mensaje: 'Estado actualizado correctamente' };
};

const eliminar = async (id) => {
  validarIdNumerico(id, 'El mantenimiento', true);

  const eliminado = await repository.eliminar(id);
  if (!eliminado) throw crearError('Mantenimiento no encontrado.', 404);

  return { ok: true, data: null, mensaje: 'Mantenimiento eliminado correctamente' };
};

module.exports = {
  listar,
  listarPorVehiculo,
  crear,
  editar,
  cambiarEstado,
  eliminar,
  TIPOS_VALIDOS,
  ESTADOS_VALIDOS,
  PRIORIDADES_VALIDAS
};
