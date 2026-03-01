const { sql, poolPromise } = require('../../config/db');

const obtenerHistorialViajes = async () => {
  const pool = await poolPromise;
  const result = await pool.request().query(`
    SELECT 
      v.ViajeID, 
      r.NombreRuta, 
      r.Turno,
      v.Fecha, 
      v.EstadoViaje, 
      v.HoraInicio, 
      v.HoraFin,
      DATEDIFF(MINUTE, v.HoraInicio, v.HoraFin) as DuracionMinutos
    FROM Viajes v
    JOIN Rutas r ON v.RutaID = r.RutaID
    ORDER BY v.Fecha DESC, v.HoraInicio DESC
  `);
  return result.recordset;
};

module.exports = { obtenerHistorialViajes };