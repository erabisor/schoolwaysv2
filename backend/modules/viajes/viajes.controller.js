const viajesService = require('./viajes.service');

const obtenerRutaOptimizada = async (req, res) => {
    try {
        const { rutaId } = req.params;
        const { lat, lng, sentido } = req.query; 

        if (!rutaId || !lat || !lng || !sentido) {
            return res.status(400).json({ ok: false, data: null, mensaje: 'Se requiere rutaId, latitud, longitud y sentido (Ida o Vuelta).' });
        }

        const dataRuta = await viajesService.generarRutaOptimizada(rutaId, lat, lng, sentido);

        return res.status(200).json({ ok: true, data: dataRuta, mensaje: dataRuta.paradas.length > 0 ? 'Ruta calculada.' : dataRuta.mensaje });
    } catch (error) {
        console.error('[viajes] obtenerRutaOptimizada:', error.message);
        return res.status(500).json({ ok: false, data: null, mensaje: 'Error al calcular la ruta optimizada.' });
    }
};

module.exports = { obtenerRutaOptimizada };