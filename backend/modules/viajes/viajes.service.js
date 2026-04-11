const viajesRepository = require('./viajes.repository');
const axios = require('axios');

const ORS_HEADERS = { 'Authorization': process.env.ORS_API_KEY };
const ORS_URL_OPT = 'https://api.openrouteservice.org/optimization';
const ORS_URL_DIR = 'https://api.openrouteservice.org/v2/directions/driving-car/geojson';

const generarRutaOptimizada = async (rutaId, latStr, lngStr, sentido) => {
    const fechaHoy = new Date().toISOString().split('T')[0];
    const alumnos = await viajesRepository.obtenerAlumnosParaRuta(rutaId, fechaHoy, sentido);
    
    if (alumnos.length === 0) {
        return { polilinea: [], paradas: [], mensaje: `No hay alumnos para el viaje de ${sentido} hoy.` };
    }

    const cLng = parseFloat(lngStr);
    const cLat = parseFloat(latStr);
    const paradasOrdenadas = [];
    const coordenadasRuta = [[cLng, cLat]]; 

    // Extraer colegios únicos
    const colegiosMap = new Map();
    alumnos.forEach(a => {
        const key = `${a.ColegioLongitud},${a.ColegioLatitud}`;
        colegiosMap.set(key, [parseFloat(a.ColegioLongitud), parseFloat(a.ColegioLatitud)]);
    });
    const colegiosUnicos = Array.from(colegiosMap.values());

    if (sentido === 'Ida') {
        // VIAJE DE IDA: Optimizar Casas -> Terminar en Colegios
        const payloadCasas = {
            jobs: alumnos.map(a => ({ id: a.AlumnoID, location: [parseFloat(a.CasaLongitud), parseFloat(a.CasaLatitud)] })),
            vehicles: [{ id: 1, profile: 'driving-car', start: [cLng, cLat] }]
        };
        const optCasas = await axios.post(ORS_URL_OPT, payloadCasas, { headers: ORS_HEADERS });
        optCasas.data.routes[0].steps.filter(s => s.type === 'job').forEach(paso => {
            const alumno = alumnos.find(a => a.AlumnoID === paso.job);
            paradasOrdenadas.push({ id: alumno.AlumnoID, nombre: alumno.Nombre, accion: 'Recoger en Casa', ubicacion: paso.location });
            coordenadasRuta.push(paso.location);
        });

        colegiosUnicos.forEach((ubicacion, i) => {
            paradasOrdenadas.push({ id: `col-${i}`, nombre: `Dejar en Colegio ${i + 1}`, accion: 'Dejar en Colegio', ubicacion });
            coordenadasRuta.push(ubicacion);
        });

    } else {
        // VIAJE DE VUELTA: Ir a Colegios -> Optimizar Casas
        colegiosUnicos.forEach((ubicacion, i) => {
            paradasOrdenadas.push({ id: `col-${i}`, nombre: `Recoger en Colegio ${i + 1}`, accion: 'Recoger en Colegio', ubicacion });
            coordenadasRuta.push(ubicacion);
        });

        // El vehículo arranca desde el último colegio para repartir a las casas
        const startLngLat = colegiosUnicos[colegiosUnicos.length - 1]; 
        const payloadCasas = {
            jobs: alumnos.map(a => ({ id: a.AlumnoID, location: [parseFloat(a.CasaLongitud), parseFloat(a.CasaLatitud)] })),
            vehicles: [{ id: 1, profile: 'driving-car', start: startLngLat }]
        };

        const optCasas = await axios.post(ORS_URL_OPT, payloadCasas, { headers: ORS_HEADERS });
        optCasas.data.routes[0].steps.filter(s => s.type === 'job').forEach(paso => {
            const alumno = alumnos.find(a => a.AlumnoID === paso.job);
            paradasOrdenadas.push({ id: alumno.AlumnoID, nombre: alumno.Nombre, accion: 'Dejar en Casa', ubicacion: paso.location });
            coordenadasRuta.push(paso.location);
        });
    }

    const dirRes = await axios.post(ORS_URL_DIR, { coordinates: coordenadasRuta }, { headers: ORS_HEADERS });

    return { polilinea: dirRes.data.features[0].geometry.coordinates, paradas: paradasOrdenadas };
};

module.exports = { generarRutaOptimizada };