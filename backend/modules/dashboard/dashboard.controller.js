const service = require('./dashboard.service');

const getDashboard = async (req, res) => {
  try {
    res.status(200).json(await service.obtenerDashboard());
  } catch (error) {
    console.error('Error en dashboard:', error.message);
    res.status(500).json({ ok: false, data: null, mensaje: 'Error al cargar el dashboard' });
  }
};

module.exports = { getDashboard };