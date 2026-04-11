const repository = require('./dashboard.repository');

// Arma la respuesta completa del dashboard en un solo objeto
const obtenerDashboard = async () => {
  const [kpis, actividad, asistenciaSemanal] = await Promise.all([
    repository.obtenerKPIs(),
    repository.obtenerActividadReciente(),
    repository.obtenerAsistenciaSemanal()
  ]);

  return { ok: true, data: { kpis, actividad, asistenciaSemanal }, mensaje: 'Dashboard cargado' };
};

module.exports = { obtenerDashboard };