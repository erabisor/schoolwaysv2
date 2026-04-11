const { poolPromise } = require('../../config/db');

// Trae todos los contadores para las tarjetas del dashboard
const obtenerKPIs = async () => {
  const pool = await poolPromise;

  const result = await pool.request().query(`
    SELECT
      (SELECT COUNT(*) FROM Alumnos   WHERE Estado = 1 AND Eliminado = 0) AS TotalAlumnos,
      (SELECT COUNT(*) FROM Rutas     WHERE Estado = 1 AND Eliminado = 0) AS TotalRutas,
      (SELECT COUNT(*) FROM Conductores WHERE Estado = 1 AND Eliminado = 0) AS TotalConductores,
      (SELECT COUNT(*) FROM Vehiculos WHERE Estado = 1 AND Eliminado = 0) AS TotalVehiculos,
      (SELECT COUNT(*) FROM TurnosConductores WHERE EstadoTurno = 'Abierto') AS TurnosAbiertosHoy,
      (SELECT COUNT(*) FROM Viajes WHERE Fecha = CAST(GETDATE() AS DATE)) AS ViajesHoy,
      (SELECT COUNT(*) FROM Viajes WHERE Fecha = CAST(GETDATE() AS DATE) AND EstadoViaje = 'Finalizado') AS ViajesCompletados,
      (SELECT COUNT(*) FROM Asistencias WHERE TipoEvento = 'Abordó' AND CAST(FechaHora AS DATE) = CAST(GETDATE() AS DATE)) AS AbordajesHoy
  `);

  return result.recordset[0];
};

// Trae los últimos 5 turnos abiertos para la tabla de actividad reciente
const obtenerActividadReciente = async () => {
  const pool = await poolPromise;
  const result = await pool.request().query(`
    SELECT TOP 5
      t.TurnoConductorID,
      t.HoraApertura,
      t.EstadoTurno,
      r.NombreRuta,
      u.NombreCompleto AS NombreConductor
    FROM TurnosConductores t
    JOIN Rutas r ON t.RutaID = r.RutaID
    JOIN Conductores c ON t.ConductorID = c.ConductorID
    LEFT JOIN Usuarios u ON c.UsuarioID = u.UsuarioID
    ORDER BY t.HoraApertura DESC
  `);
  return result.recordset;
};

// Asistencia de los últimos 7 días para la gráfica
const obtenerAsistenciaSemanal = async () => {
  const pool = await poolPromise;

  const result = await pool.request().query(`
    SELECT
      CAST(FechaHora AS DATE) AS Fecha,
      COUNT(*) AS TotalAbordajes
    FROM Asistencias
    WHERE TipoEvento = 'Abordó'
      AND FechaHora >= DATEADD(DAY, -6, CAST(GETDATE() AS DATE))
    GROUP BY CAST(FechaHora AS DATE)
    ORDER BY Fecha ASC
  `);

  return result.recordset;
};

module.exports = { obtenerKPIs, obtenerActividadReciente, obtenerAsistenciaSemanal };