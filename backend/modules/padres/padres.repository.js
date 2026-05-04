const { sql, poolPromise } = require('../../config/db');

const existePadrePorUsuario = async (usuarioId) => {
  const pool = await poolPromise;

  const result = await pool.request()
    .input('usuarioId', sql.Int, usuarioId)
    .query(`
      SELECT PadreID
      FROM Padres
      WHERE UsuarioID = @usuarioId
        AND Eliminado = 0
    `);

  return result.recordset.length > 0;
};

const obtenerHijosPorUsuario = async (usuarioId) => {
  const pool = await poolPromise;

  const result = await pool.request()
    .input('usuarioId', sql.Int, usuarioId)
    .query(`
      SELECT
        a.AlumnoID,
        a.Nombre + ' ' + a.Apellido AS NombreCompleto,
        a.Grado,
        a.Seccion,
        a.Direccion,
        a.PuntoReferencia,
        a.TipoServicio,
        a.Estado,
        r.RutaID,
        r.NombreRuta,
        r.Turno,
        uc.NombreCompleto AS NombreConductor,
        v.Placa,
        v.Marca,
        v.Modelo
      FROM Padres p
      INNER JOIN Alumnos a ON p.PadreID = a.PadreID
      LEFT JOIN Rutas r ON a.RutaID = r.RutaID AND r.Eliminado = 0
      LEFT JOIN Conductores c ON r.ConductorID = c.ConductorID
      LEFT JOIN Usuarios uc ON c.UsuarioID = uc.UsuarioID
      LEFT JOIN Vehiculos v ON r.VehiculoID = v.VehiculoID AND v.Eliminado = 0
      WHERE p.UsuarioID = @usuarioId
        AND p.Eliminado = 0
        AND a.Eliminado = 0
      ORDER BY a.Nombre ASC, a.Apellido ASC
    `);

  return result.recordset;
};

const obtenerTransporteHoy = async (usuarioId) => {
  const pool = await poolPromise;

  const result = await pool.request()
    .input('usuarioId', sql.Int, usuarioId)
    .query(`
      SELECT
        a.AlumnoID,
        a.Nombre + ' ' + a.Apellido AS NombreCompleto,
        a.Grado,
        a.TipoServicio,
        r.RutaID,
        r.NombreRuta,
        r.Turno,
        uc.NombreCompleto AS NombreConductor,
        v.Placa,
        ultimo.AsistenciaID,
        ultimo.TipoEvento,
        ultimo.Sentido,
        ultimo.FechaHora,
        viaje.ViajeID,
        viaje.EstadoViaje,
        viaje.Sentido AS SentidoViaje,
        viaje.HoraInicio
      FROM Padres p
      INNER JOIN Alumnos a ON p.PadreID = a.PadreID
      LEFT JOIN Rutas r ON a.RutaID = r.RutaID AND r.Eliminado = 0
      LEFT JOIN Conductores c ON r.ConductorID = c.ConductorID
      LEFT JOIN Usuarios uc ON c.UsuarioID = uc.UsuarioID
      LEFT JOIN Vehiculos v ON r.VehiculoID = v.VehiculoID AND v.Eliminado = 0
      OUTER APPLY (
        SELECT TOP 1
          asi.AsistenciaID,
          asi.TipoEvento,
          asi.Sentido,
          asi.FechaHora
        FROM Asistencias asi
        WHERE asi.AlumnoID = a.AlumnoID
          AND CAST(asi.FechaHora AS DATE) = CAST(GETDATE() AS DATE)
          AND asi.Estado = 1
        ORDER BY asi.FechaHora DESC
      ) ultimo
      OUTER APPLY (
        SELECT TOP 1
          vi.ViajeID,
          vi.EstadoViaje,
          vi.Sentido,
          vi.HoraInicio
        FROM Viajes vi
        WHERE vi.RutaID = a.RutaID
          AND vi.Fecha = CAST(GETDATE() AS DATE)
          AND vi.EstadoViaje = 'En Curso'
          AND (
            a.TipoServicio = 'Ambos'
            OR (vi.Sentido = 'Ida' AND a.TipoServicio = 'Solo Ida')
            OR (vi.Sentido = 'Vuelta' AND a.TipoServicio = 'Solo Vuelta')
          )
        ORDER BY vi.HoraInicio DESC
      ) viaje
      WHERE p.UsuarioID = @usuarioId
        AND p.Eliminado = 0
        AND a.Eliminado = 0
      ORDER BY a.Nombre ASC, a.Apellido ASC
    `);

  return result.recordset;
};

const obtenerHistorialSemanal = async (usuarioId) => {
  const pool = await poolPromise;

  const result = await pool.request()
    .input('usuarioId', sql.Int, usuarioId)
    .query(`
      SELECT
        asi.AsistenciaID,
        a.AlumnoID,
        a.Nombre + ' ' + a.Apellido AS NombreCompleto,
        r.NombreRuta,
        asi.Sentido,
        asi.TipoEvento,
        asi.FechaHora,
        asi.Turno,
        asi.Observaciones
      FROM Padres p
      INNER JOIN Alumnos a ON p.PadreID = a.PadreID
      INNER JOIN Asistencias asi ON a.AlumnoID = asi.AlumnoID
      LEFT JOIN Rutas r ON asi.RutaID = r.RutaID
      WHERE p.UsuarioID = @usuarioId
        AND p.Eliminado = 0
        AND a.Eliminado = 0
        AND asi.Estado = 1
        AND asi.FechaHora >= DATEADD(DAY, -6, CAST(GETDATE() AS DATE))
        AND asi.FechaHora < DATEADD(DAY, 1, CAST(GETDATE() AS DATE))
      ORDER BY asi.FechaHora DESC
    `);

  return result.recordset;
};

const obtenerNotificaciones = async (usuarioId) => {
  const pool = await poolPromise;

  const result = await pool.request()
    .input('usuarioId', sql.Int, usuarioId)
    .query(`
      SELECT TOP 30
        NotificacionID,
        Titulo,
        Mensaje,
        Tipo,
        Leida,
        FechaRegistro
      FROM Notificaciones
      WHERE UsuarioID = @usuarioId
        AND Estado = 1
      ORDER BY FechaRegistro DESC
    `);

  return result.recordset;
};

const obtenerResumenNotificaciones = async (usuarioId) => {
  const pool = await poolPromise;

  const result = await pool.request()
    .input('usuarioId', sql.Int, usuarioId)
    .query(`
      SELECT COUNT(*) AS NoLeidas
      FROM Notificaciones
      WHERE UsuarioID = @usuarioId
        AND Estado = 1
        AND Leida = 0
    `);

  return result.recordset[0] || { NoLeidas: 0 };
};

const marcarNotificacionLeida = async (usuarioId, notificacionId) => {
  const pool = await poolPromise;

  const result = await pool.request()
    .input('usuarioId', sql.Int, usuarioId)
    .input('notificacionId', sql.Int, notificacionId)
    .query(`
      UPDATE Notificaciones
      SET Leida = 1
      WHERE NotificacionID = @notificacionId
        AND UsuarioID = @usuarioId
        AND Estado = 1
    `);

  return result.rowsAffected[0] > 0;
};

const marcarTodasNotificacionesLeidas = async (usuarioId) => {
  const pool = await poolPromise;

  const result = await pool.request()
    .input('usuarioId', sql.Int, usuarioId)
    .query(`
      UPDATE Notificaciones
      SET Leida = 1
      WHERE UsuarioID = @usuarioId
        AND Estado = 1
        AND Leida = 0
    `);

  return result.rowsAffected[0] || 0;
};

module.exports = {
  existePadrePorUsuario,
  obtenerHijosPorUsuario,
  obtenerTransporteHoy,
  obtenerHistorialSemanal,
  obtenerNotificaciones,
  obtenerResumenNotificaciones,
  marcarNotificacionLeida,
  marcarTodasNotificacionesLeidas
};
