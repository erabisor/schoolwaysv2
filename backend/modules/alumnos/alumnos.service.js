const repository = require('./alumnos.repository');

const TIPOS_SERVICIO_VALIDOS = ['Ambos', 'Solo Ida', 'Solo Vuelta'];

const crearError = (mensaje, status = 400) => {
  const error = new Error(mensaje);
  error.status = status;
  return error;
};

const esVacio = (valor) => {
  return valor === undefined || valor === null || String(valor).trim() === '';
};

const normalizarNumero = (valor) => {
  if (valor === undefined || valor === null || valor === '') return null;

  const numero = Number(valor);
  return Number.isFinite(numero) ? numero : NaN;
};

const validarRangoCoordenada = (nombreCampo, valor, minimo, maximo) => {
  const numero = normalizarNumero(valor);

  if (numero === null) return;

  if (!Number.isFinite(numero)) {
    throw crearError(`${nombreCampo} debe ser un número válido.`);
  }

  if (numero < minimo || numero > maximo) {
    throw crearError(`${nombreCampo} debe estar entre ${minimo} y ${maximo}.`);
  }
};

const validarParCoordenadas = (latitud, longitud, etiqueta) => {
  const latVacia = esVacio(latitud);
  const lngVacia = esVacio(longitud);

  if (latVacia && lngVacia) return;

  if (latVacia || lngVacia) {
    throw crearError(`La ubicación de ${etiqueta} debe tener latitud y longitud.`);
  }
};

const validarIdNumerico = (valor, nombreCampo, requerido = false) => {
  if (esVacio(valor)) {
    if (requerido) throw crearError(`${nombreCampo} es obligatorio.`);
    return;
  }

  const numero = Number(valor);

  if (!Number.isInteger(numero) || numero <= 0) {
    throw crearError(`${nombreCampo} debe ser un identificador válido.`);
  }
};

const validarDatosAlumno = (datos) => {
  if (!datos || typeof datos !== 'object') {
    throw crearError('Datos del alumno inválidos.');
  }

  if (esVacio(datos.NombreCompleto)) {
    throw crearError('El nombre completo del alumno es obligatorio.');
  }

  if (String(datos.NombreCompleto).trim().length < 3) {
    throw crearError('El nombre completo del alumno debe tener al menos 3 caracteres.');
  }

  if (esVacio(datos.Grado)) {
    throw crearError('El grado escolar es obligatorio.');
  }

  if (esVacio(datos.Direccion)) {
    throw crearError('La dirección del alumno es obligatoria.');
  }

  validarIdNumerico(datos.UsuarioID, 'El padre/responsable', true);
  validarIdNumerico(datos.RutaID, 'La ruta asignada', false);

  const tipoServicio = datos.TipoServicio || 'Ambos';

  if (!TIPOS_SERVICIO_VALIDOS.includes(tipoServicio)) {
    throw crearError('Tipo de servicio inválido.');
  }

  validarParCoordenadas(datos.CasaLatitud, datos.CasaLongitud, 'casa');
  validarParCoordenadas(datos.ColegioLatitud, datos.ColegioLongitud, 'colegio');

  validarRangoCoordenada('CasaLatitud', datos.CasaLatitud, -90, 90);
  validarRangoCoordenada('CasaLongitud', datos.CasaLongitud, -180, 180);
  validarRangoCoordenada('ColegioLatitud', datos.ColegioLatitud, -90, 90);
  validarRangoCoordenada('ColegioLongitud', datos.ColegioLongitud, -180, 180);
};

const listarAlumnos = async () => ({
  ok: true,
  data: await repository.obtenerTodos(),
  mensaje: 'Alumnos obtenidos'
});

const listarOpciones = async () => ({
  ok: true,
  data: await repository.obtenerOpciones(),
  mensaje: 'Opciones cargadas'
});

const registrarAlumno = async (datos) => {
  validarDatosAlumno(datos);

  return {
    ok: true,
    data: await repository.crear(datos),
    mensaje: 'Alumno registrado'
  };
};

const modificarAlumno = async (id, datos) => {
  validarIdNumerico(id, 'El alumno', true);
  validarDatosAlumno(datos);

  const actualizado = await repository.actualizar(id, datos);

  if (!actualizado) {
    throw crearError('Alumno no encontrado o eliminado.', 404);
  }

  return {
    ok: true,
    data: null,
    mensaje: 'Alumno actualizado'
  };
};

const alternarEstado = async (id, estado) => {
  validarIdNumerico(id, 'El alumno', true);

  if (typeof estado !== 'boolean') {
    throw crearError('El estado debe ser verdadero o falso.');
  }

  const actualizado = await repository.cambiarEstado(id, estado);

  if (!actualizado) {
    throw crearError('Alumno no encontrado o eliminado.', 404);
  }

  return {
    ok: true,
    data: null,
    mensaje: 'Estado actualizado'
  };
};

const eliminarAlumno = async (id) => {
  validarIdNumerico(id, 'El alumno', true);

  const eliminado = await repository.eliminar(id);

  if (!eliminado) {
    throw crearError('Alumno no encontrado.', 404);
  }

  return {
    ok: true,
    data: null,
    mensaje: 'Alumno eliminado'
  };
};

module.exports = {
  listarAlumnos,
  listarOpciones,
  registrarAlumno,
  modificarAlumno,
  alternarEstado,
  eliminarAlumno
};
