const viajesService = require('./viajes.service');

const obtenerActor = (req) => req.usuario || req.user || {};

const responderError = (res, error, contexto) => {
  console.error(`[viajes] ${contexto}:`, error.message);

  return res.status(error.status || 500).json({
    ok: false,
    data: null,
    mensaje: error.status ? error.message : 'Error al calcular la ruta optimizada.'
  });
};

const obtenerRutaOptimizada = async (req, res) => {
  try {
    const { rutaId } = req.params;
    const { lat, lng, sentido } = req.query;

    const dataRuta = await viajesService.generarRutaOptimizada(
      rutaId,
      lat,
      lng,
      sentido,
      obtenerActor(req)
    );

    return res.status(200).json({
      ok: true,
      data: dataRuta,
      mensaje: dataRuta.paradas.length > 0 ? 'Ruta calculada.' : dataRuta.mensaje
    });
  } catch (error) {
    return responderError(res, error, 'obtenerRutaOptimizada');
  }
};

module.exports = { obtenerRutaOptimizada };
