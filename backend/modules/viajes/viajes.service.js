const viajesRepository = require('./viajes.repository');
const axios = require('axios');

const ORS_URL_OPT = 'https://api.openrouteservice.org/optimization';
const ORS_URL_DIR = 'https://api.openrouteservice.org/v2/directions/driving-car/geojson';
const SENTIDOS_VALIDOS = ['Ida', 'Vuelta'];

const crearError = (mensaje, status = 400) => {
  const error = new Error(mensaje);
  error.status = status;
  return error;
};

const obtenerRolActor = (actor = {}) => Number(actor.rol || actor.RolID || actor.rolId || actor.role || 0);
const obtenerUsuarioIdActor = (actor = {}) => Number(actor.id || actor.UsuarioID || actor.usuarioId || 0);
const obtenerConductorIdActor = (actor = {}) => Number(actor.conductorId || actor.ConductorID || actor.conductorID || 0);

const normalizarId = (valor, nombreCampo) => {
  const numero = Number(valor);

  if (!Number.isInteger(numero) || numero <= 0) {
    throw crearError(`${nombreCampo} debe ser un identificador válido.`);
  }

  return numero;
};

const normalizarCoordenadas = (latStr, lngStr) => {
  const lat = Number(latStr);
  const lng = Number(lngStr);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    throw crearError('Latitud y longitud deben ser números válidos.');
  }

  if (lat < -90 || lat > 90) {
    throw crearError('La latitud debe estar entre -90 y 90.');
  }

  if (lng < -180 || lng > 180) {
    throw crearError('La longitud debe estar entre -180 y 180.');
  }

  return { lat, lng };
};

const validarSentido = (sentido) => {
  if (!SENTIDOS_VALIDOS.includes(sentido)) {
    throw crearError('El sentido debe ser Ida o Vuelta.');
  }

  return sentido;
};

const validarAccesoRuta = async (rutaId, actor = {}) => {
  const rol = obtenerRolActor(actor);

  if (rol !== 2) return;

  let conductorId = obtenerConductorIdActor(actor);

  if (!conductorId) {
    conductorId = await viajesRepository.obtenerConductorIdPorUsuario(obtenerUsuarioIdActor(actor));
  }

  const tieneAcceso = await viajesRepository.rutaPerteneceAConductor(rutaId, conductorId);

  if (!tieneAcceso) {
    throw crearError('No tienes permiso para consultar la ruta optimizada de esta ruta.', 403);
  }
};

const getOrsHeaders = () => {
  if (!process.env.ORS_API_KEY) {
    throw crearError('ORS_API_KEY no está configurada en el servidor.', 500);
  }

  return {
    Authorization: process.env.ORS_API_KEY
  };
};

const extraerColegiosUnicos = (alumnos) => {
  const colegiosMap = new Map();

  alumnos.forEach((alumno) => {
    const lng = Number(alumno.ColegioLongitud);
    const lat = Number(alumno.ColegioLatitud);

    if (Number.isFinite(lng) && Number.isFinite(lat)) {
      colegiosMap.set(`${lng},${lat}`, [lng, lat]);
    }
  });

  return Array.from(colegiosMap.values());
};

const generarRutaOptimizada = async (rutaIdParam, latStr, lngStr, sentidoParam, actor = {}) => {
  const rutaId = normalizarId(rutaIdParam, 'RutaID');
  const sentido = validarSentido(sentidoParam);
  const { lat, lng } = normalizarCoordenadas(latStr, lngStr);

  await validarAccesoRuta(rutaId, actor);

  const fechaHoy = new Date().toISOString().split('T')[0];
  const alumnos = await viajesRepository.obtenerAlumnosParaRuta(rutaId, fechaHoy, sentido);

  if (alumnos.length === 0) {
    return {
      polilinea: [],
      paradas: [],
      mensaje: `No hay alumnos para el viaje de ${sentido} hoy.`
    };
  }

  const headers = getOrsHeaders();
  const axiosConfig = {
    headers,
    timeout: 12000
  };

  const cLng = lng;
  const cLat = lat;
  const paradasOrdenadas = [];
  const coordenadasRuta = [[cLng, cLat]];
  const colegiosUnicos = extraerColegiosUnicos(alumnos);

  try {
    if (sentido === 'Ida') {
      const payloadCasas = {
        jobs: alumnos.map((alumno) => ({
          id: alumno.AlumnoID,
          location: [Number(alumno.CasaLongitud), Number(alumno.CasaLatitud)]
        })),
        vehicles: [{ id: 1, profile: 'driving-car', start: [cLng, cLat] }]
      };

      const optCasas = await axios.post(ORS_URL_OPT, payloadCasas, axiosConfig);

      optCasas.data.routes[0].steps
        .filter((step) => step.type === 'job')
        .forEach((paso) => {
          const alumno = alumnos.find((item) => item.AlumnoID === paso.job);
          if (!alumno) return;

          paradasOrdenadas.push({
            id: alumno.AlumnoID,
            nombre: `${alumno.Nombre} ${alumno.Apellido || ''}`.trim(),
            accion: 'Recoger en Casa',
            ubicacion: paso.location
          });

          coordenadasRuta.push(paso.location);
        });

      colegiosUnicos.forEach((ubicacion, index) => {
        paradasOrdenadas.push({
          id: `col-${index}`,
          nombre: `Dejar en Colegio ${index + 1}`,
          accion: 'Dejar en Colegio',
          ubicacion
        });

        coordenadasRuta.push(ubicacion);
      });
    } else {
      colegiosUnicos.forEach((ubicacion, index) => {
        paradasOrdenadas.push({
          id: `col-${index}`,
          nombre: `Recoger en Colegio ${index + 1}`,
          accion: 'Recoger en Colegio',
          ubicacion
        });

        coordenadasRuta.push(ubicacion);
      });

      const startLngLat = colegiosUnicos[colegiosUnicos.length - 1] || [cLng, cLat];

      const payloadCasas = {
        jobs: alumnos.map((alumno) => ({
          id: alumno.AlumnoID,
          location: [Number(alumno.CasaLongitud), Number(alumno.CasaLatitud)]
        })),
        vehicles: [{ id: 1, profile: 'driving-car', start: startLngLat }]
      };

      const optCasas = await axios.post(ORS_URL_OPT, payloadCasas, axiosConfig);

      optCasas.data.routes[0].steps
        .filter((step) => step.type === 'job')
        .forEach((paso) => {
          const alumno = alumnos.find((item) => item.AlumnoID === paso.job);
          if (!alumno) return;

          paradasOrdenadas.push({
            id: alumno.AlumnoID,
            nombre: `${alumno.Nombre} ${alumno.Apellido || ''}`.trim(),
            accion: 'Dejar en Casa',
            ubicacion: paso.location
          });

          coordenadasRuta.push(paso.location);
        });
    }

    if (coordenadasRuta.length < 2) {
      return {
        polilinea: [],
        paradas: paradasOrdenadas,
        mensaje: 'No hay suficientes puntos para trazar una ruta.'
      };
    }

    const dirRes = await axios.post(
      ORS_URL_DIR,
      { coordinates: coordenadasRuta },
      axiosConfig
    );

    return {
      polilinea: dirRes.data.features[0].geometry.coordinates,
      paradas: paradasOrdenadas
    };
  } catch (error) {
    const err = crearError('No se pudo calcular la ruta optimizada con el servicio externo.', 502);
    err.originalMessage = error.message;
    throw err;
  }
};

module.exports = { generarRutaOptimizada };
