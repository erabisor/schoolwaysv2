const { sql, poolPromise } = require('../../config/db');

const inputComun = (request, filtros) => {
  request.input('fechaInicio', sql.Date, filtros.fechaInicio);
  request.input('fechaFin', sql.Date, filtros.fechaFin);
  if (filtros.rutaId) request.input('rutaId', sql.Int, filtros.rutaId);
  if (filtros.alumnoId) request.input('alumnoId', sql.Int, filtros.alumnoId);
  if (filtros.conductorId) request.input('conductorId', sql.Int, filtros.conductorId);
  if (filtros.vehiculoId) request.input('vehiculoId', sql.Int, filtros.vehiculoId);
  if (filtros.tipoEvento) request.input('tipoEvento', sql.VarChar, filtros.tipoEvento);
  if (filtros.sentido) request.input('sentido', sql.VarChar, filtros.sentido);
  if (filtros.estado) request.input('estado', sql.VarChar, filtros.estado);
  return request;
};

const resumen = async (filtros) => {
  const pool = await poolPromise;
  const request = inputComun(pool.request(), filtros);
  const result = await request.query(`
    SELECT
      (SELECT COUNT(*) FROM Alumnos WHERE Estado = 1 AND Eliminado = 0) AS AlumnosActivos,
      (SELECT COUNT(*) FROM Rutas WHERE Estado = 1 AND Eliminado = 0) AS RutasActivas,
      (SELECT COUNT(*) FROM Vehiculos WHERE Estado = 1 AND Eliminado = 0) AS VehiculosDisponibles,
      (SELECT COUNT(*) FROM Vehiculos WHERE Estado = 0 AND Eliminado = 0) AS VehiculosFueraServicio,
      (SELECT COUNT(*) FROM Viajes WHERE Fecha BETWEEN @fechaInicio AND @fechaFin) AS TotalViajes,
      (SELECT COUNT(*) FROM TurnosConductores WHERE Fecha BETWEEN @fechaInicio AND @fechaFin) AS TotalTurnos,
      (SELECT COUNT(*) FROM Asistencias WHERE CAST(FechaHora AS DATE) BETWEEN @fechaInicio AND @fechaFin AND Estado = 1) AS TotalEventos,
      (SELECT COUNT(*) FROM Asistencias WHERE CAST(FechaHora AS DATE) BETWEEN @fechaInicio AND @fechaFin AND Estado = 1 AND TipoEvento = 'Abordó') AS TotalAbordajes,
      (SELECT COUNT(*) FROM Asistencias WHERE CAST(FechaHora AS DATE) BETWEEN @fechaInicio AND @fechaFin AND Estado = 1 AND TipoEvento = 'Bajó') AS TotalBajadas,
      (SELECT COUNT(*) FROM Asistencias WHERE CAST(FechaHora AS DATE) BETWEEN @fechaInicio AND @fechaFin AND Estado = 1 AND TipoEvento = 'Ausente') AS TotalAusencias,
      (SELECT COUNT(*) FROM Asistencias WHERE CAST(FechaHora AS DATE) BETWEEN @fechaInicio AND @fechaFin AND Estado = 1 AND TipoEvento = 'AvisóAusencia') AS TotalAvisosAusencia,
      (SELECT COUNT(*) FROM MantenimientosVehiculos WHERE Eliminado = 0 AND EstadoMantenimiento = 'En Proceso') AS MantenimientosProceso,
      (SELECT COUNT(*) FROM MantenimientosVehiculos WHERE Eliminado = 0 AND Prioridad = 'Crítica' AND EstadoMantenimiento IN ('Programado','En Proceso')) AS MantenimientosCriticos
  `);

  const eventosPorDia = await inputComun(pool.request(), filtros).query(`
    SELECT CAST(FechaHora AS DATE) AS Fecha, TipoEvento, COUNT(*) AS Total
    FROM Asistencias
    WHERE CAST(FechaHora AS DATE) BETWEEN @fechaInicio AND @fechaFin AND Estado = 1
    GROUP BY CAST(FechaHora AS DATE), TipoEvento
    ORDER BY Fecha ASC
  `);

  const rutasUso = await inputComun(pool.request(), filtros).query(`
    SELECT TOP 5 r.NombreRuta, COUNT(v.ViajeID) AS Viajes
    FROM Viajes v
    INNER JOIN Rutas r ON v.RutaID = r.RutaID
    WHERE v.Fecha BETWEEN @fechaInicio AND @fechaFin
    GROUP BY r.NombreRuta
    ORDER BY Viajes DESC
  `);

  return { kpis: result.recordset[0], eventosPorDia: eventosPorDia.recordset, topRutas: rutasUso.recordset };
};

const asistenciaEstudiante = async (filtros) => {
  const pool = await poolPromise;
  let where = `WHERE asi.Estado = 1 AND CAST(asi.FechaHora AS DATE) BETWEEN @fechaInicio AND @fechaFin AND a.Eliminado = 0`;
  if (filtros.rutaId) where += ' AND asi.RutaID = @rutaId';
  if (filtros.alumnoId) where += ' AND asi.AlumnoID = @alumnoId';
  if (filtros.tipoEvento) where += ' AND asi.TipoEvento = @tipoEvento';
  if (filtros.sentido) where += ' AND asi.Sentido = @sentido';

  const resumen = await inputComun(pool.request(), filtros).query(`
    SELECT a.AlumnoID, a.Nombre + ' ' + a.Apellido AS Alumno, a.Grado, a.Seccion,
      r.NombreRuta,
      SUM(CASE WHEN asi.TipoEvento = 'Abordó' THEN 1 ELSE 0 END) AS Abordajes,
      SUM(CASE WHEN asi.TipoEvento = 'Bajó' THEN 1 ELSE 0 END) AS Bajadas,
      SUM(CASE WHEN asi.TipoEvento = 'Ausente' THEN 1 ELSE 0 END) AS Ausencias,
      SUM(CASE WHEN asi.TipoEvento = 'AvisóAusencia' THEN 1 ELSE 0 END) AS AvisosAusencia,
      COUNT(*) AS TotalEventos
    FROM Asistencias asi
    INNER JOIN Alumnos a ON asi.AlumnoID = a.AlumnoID
    LEFT JOIN Rutas r ON asi.RutaID = r.RutaID
    ${where}
    GROUP BY a.AlumnoID, a.Nombre, a.Apellido, a.Grado, a.Seccion, r.NombreRuta
    ORDER BY Alumno ASC
  `);

  const detalle = await inputComun(pool.request(), filtros).query(`
    SELECT asi.AsistenciaID, asi.FechaHora, a.Nombre + ' ' + a.Apellido AS Alumno,
      a.Grado, a.Seccion, r.NombreRuta, u.NombreCompleto AS Conductor,
      asi.Sentido, asi.TipoEvento, asi.Turno, asi.Observaciones
    FROM Asistencias asi
    INNER JOIN Alumnos a ON asi.AlumnoID = a.AlumnoID
    LEFT JOIN Rutas r ON asi.RutaID = r.RutaID
    LEFT JOIN Conductores c ON asi.ConductorID = c.ConductorID
    LEFT JOIN Usuarios u ON c.UsuarioID = u.UsuarioID
    ${where}
    ORDER BY asi.FechaHora DESC
  `);

  return { resumen: resumen.recordset, detalle: detalle.recordset };
};

const usoRutas = async (filtros) => {
  const pool = await poolPromise;
  let filtroViajes = 'WHERE v.Fecha BETWEEN @fechaInicio AND @fechaFin';
  if (filtros.rutaId) filtroViajes += ' AND v.RutaID = @rutaId';
  if (filtros.sentido) filtroViajes += ' AND v.Sentido = @sentido';

  const resumen = await inputComun(pool.request(), filtros).query(`
    SELECT r.RutaID, r.NombreRuta, r.Turno,
      COUNT(DISTINCT v.ViajeID) AS Viajes,
      COUNT(DISTINCT al.AlumnoID) AS AlumnosAsignados,
      SUM(CASE WHEN asi.TipoEvento = 'Abordó' THEN 1 ELSE 0 END) AS Abordajes,
      SUM(CASE WHEN asi.TipoEvento = 'Ausente' THEN 1 ELSE 0 END) AS Ausencias,
      SUM(CASE WHEN asi.TipoEvento = 'AvisóAusencia' THEN 1 ELSE 0 END) AS AvisosAusencia
    FROM Rutas r
    LEFT JOIN Viajes v ON r.RutaID = v.RutaID AND v.Fecha BETWEEN @fechaInicio AND @fechaFin
    LEFT JOIN Alumnos al ON r.RutaID = al.RutaID AND al.Eliminado = 0
    LEFT JOIN Asistencias asi ON r.RutaID = asi.RutaID AND CAST(asi.FechaHora AS DATE) BETWEEN @fechaInicio AND @fechaFin AND asi.Estado = 1
    WHERE r.Eliminado = 0 ${filtros.rutaId ? 'AND r.RutaID = @rutaId' : ''}
    GROUP BY r.RutaID, r.NombreRuta, r.Turno
    ORDER BY Viajes DESC, r.NombreRuta ASC
  `);

  const detalle = await inputComun(pool.request(), filtros).query(`
    SELECT v.ViajeID, v.Fecha, r.NombreRuta, v.Sentido, v.EstadoViaje,
      v.HoraInicio, v.HoraFin,
      DATEDIFF(MINUTE, v.HoraInicio, ISNULL(v.HoraFin, GETDATE())) AS DuracionMinutos,
      u.NombreCompleto AS Conductor, ve.Placa
    FROM Viajes v
    INNER JOIN Rutas r ON v.RutaID = r.RutaID
    LEFT JOIN TurnosConductores t ON v.TurnoConductorID = t.TurnoConductorID
    LEFT JOIN Conductores c ON t.ConductorID = c.ConductorID
    LEFT JOIN Usuarios u ON c.UsuarioID = u.UsuarioID
    LEFT JOIN Vehiculos ve ON r.VehiculoID = ve.VehiculoID
    ${filtroViajes}
    ORDER BY v.Fecha DESC, v.HoraInicio DESC
  `);

  return { resumen: resumen.recordset, detalle: detalle.recordset };
};

const mantenimientoVehiculos = async (filtros) => {
  const pool = await poolPromise;
  let where = `WHERE m.Eliminado = 0 AND ISNULL(m.FechaProgramada, m.FechaRegistro) >= @fechaInicio AND ISNULL(m.FechaProgramada, m.FechaRegistro) < DATEADD(DAY, 1, @fechaFin)`;
  if (filtros.vehiculoId) where += ' AND m.VehiculoID = @vehiculoId';
  if (filtros.estado) where += ' AND m.EstadoMantenimiento = @estado';

  const resumen = await inputComun(pool.request(), filtros).query(`
    SELECT v.VehiculoID, v.Placa, v.Marca, v.Modelo,
      COUNT(m.MantenimientoID) AS TotalMantenimientos,
      SUM(CASE WHEN m.EstadoMantenimiento = 'En Proceso' THEN 1 ELSE 0 END) AS EnProceso,
      SUM(CASE WHEN m.Prioridad = 'Crítica' THEN 1 ELSE 0 END) AS Criticos,
      SUM(ISNULL(m.Costo, 0)) AS CostoTotal
    FROM Vehiculos v
    LEFT JOIN MantenimientosVehiculos m ON v.VehiculoID = m.VehiculoID
      AND m.Eliminado = 0
      AND ISNULL(m.FechaProgramada, m.FechaRegistro) >= @fechaInicio
      AND ISNULL(m.FechaProgramada, m.FechaRegistro) < DATEADD(DAY, 1, @fechaFin)
    WHERE v.Eliminado = 0 ${filtros.vehiculoId ? 'AND v.VehiculoID = @vehiculoId' : ''}
    GROUP BY v.VehiculoID, v.Placa, v.Marca, v.Modelo
    ORDER BY Criticos DESC, EnProceso DESC, CostoTotal DESC
  `);

  const detalle = await inputComun(pool.request(), filtros).query(`
    SELECT m.MantenimientoID, v.Placa, v.Marca, v.Modelo,
      m.TipoMantenimiento, m.EstadoMantenimiento, m.Prioridad, m.Descripcion,
      m.FechaProgramada, m.FechaInicio, m.FechaFinalizacion, m.ProximoMantenimiento,
      m.Kilometraje, m.Costo, m.Taller, m.Responsable, m.Observaciones
    FROM MantenimientosVehiculos m
    INNER JOIN Vehiculos v ON m.VehiculoID = v.VehiculoID
    ${where}
    ORDER BY m.Prioridad DESC, m.FechaProgramada DESC
  `);

  return { resumen: resumen.recordset, detalle: detalle.recordset };
};

const viajes = async (filtros) => {
  const pool = await poolPromise;
  let where = 'WHERE v.Fecha BETWEEN @fechaInicio AND @fechaFin';
  if (filtros.rutaId) where += ' AND v.RutaID = @rutaId';
  if (filtros.conductorId) where += ' AND t.ConductorID = @conductorId';
  if (filtros.sentido) where += ' AND v.Sentido = @sentido';

  const detalle = await inputComun(pool.request(), filtros).query(`
    SELECT v.ViajeID, v.Fecha, r.NombreRuta, v.Sentido, v.EstadoViaje,
      v.HoraInicio, v.HoraFin,
      DATEDIFF(MINUTE, v.HoraInicio, ISNULL(v.HoraFin, GETDATE())) AS DuracionMinutos,
      u.NombreCompleto AS Conductor, ve.Placa AS Vehiculo
    FROM Viajes v
    INNER JOIN Rutas r ON v.RutaID = r.RutaID
    LEFT JOIN TurnosConductores t ON v.TurnoConductorID = t.TurnoConductorID
    LEFT JOIN Conductores c ON t.ConductorID = c.ConductorID
    LEFT JOIN Usuarios u ON c.UsuarioID = u.UsuarioID
    LEFT JOIN Vehiculos ve ON r.VehiculoID = ve.VehiculoID
    ${where}
    ORDER BY v.Fecha DESC, v.HoraInicio DESC
  `);

  return { detalle: detalle.recordset };
};

const turnos = async (filtros) => {
  const pool = await poolPromise;
  let where = 'WHERE t.Fecha BETWEEN @fechaInicio AND @fechaFin';
  if (filtros.rutaId) where += ' AND t.RutaID = @rutaId';
  if (filtros.conductorId) where += ' AND t.ConductorID = @conductorId';

  const detalle = await inputComun(pool.request(), filtros).query(`
    SELECT t.TurnoConductorID, t.Fecha, r.NombreRuta, r.Turno AS TurnoRuta,
      u.NombreCompleto AS Conductor, t.EstadoTurno, t.HoraApertura, t.HoraCierre,
      DATEDIFF(MINUTE, t.HoraApertura, ISNULL(t.HoraCierre, GETDATE())) AS DuracionMinutos,
      COUNT(v.ViajeID) AS ViajesRealizados
    FROM TurnosConductores t
    INNER JOIN Rutas r ON t.RutaID = r.RutaID
    INNER JOIN Conductores c ON t.ConductorID = c.ConductorID
    LEFT JOIN Usuarios u ON c.UsuarioID = u.UsuarioID
    LEFT JOIN Viajes v ON t.TurnoConductorID = v.TurnoConductorID
    ${where}
    GROUP BY t.TurnoConductorID, t.Fecha, r.NombreRuta, r.Turno, u.NombreCompleto, t.EstadoTurno, t.HoraApertura, t.HoraCierre
    ORDER BY t.Fecha DESC, t.HoraApertura DESC
  `);

  return { detalle: detalle.recordset };
};

module.exports = {
  resumen,
  asistenciaEstudiante,
  usoRutas,
  mantenimientoVehiculos,
  viajes,
  turnos
};
