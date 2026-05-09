const { sql, poolPromise } = require('../../config/db');

/* ── Parsear multi-valor (viene "5,12,8" o "5" o "") ── */
const parseIds = (valor) => {
  if (!valor) return [];
  return String(valor)
    .split(',')
    .map((v) => Number(v.trim()))
    .filter((n) => Number.isInteger(n) && n > 0);
};

/* ── Inyectar IDs como parámetros y generar condición IN ── */
const agregarFiltroIN = (request, ids, prefijo, columna) => {
  if (!ids.length) return '';
  const params = ids.map((id, i) => {
    const nombre = `${prefijo}${i}`;
    request.input(nombre, sql.Int, id);
    return `@${nombre}`;
  });
  return ` AND ${columna} IN (${params.join(',')})`;
};

const parseStrings = (valor) => {
  if (!valor) return [];
  return String(valor).split(',').map((v) => v.trim()).filter(Boolean);
};

const agregarFiltroINVarchar = (request, valores, prefijo, columna) => {
  if (!valores.length) return '';
  const params = valores.map((val, i) => {
    const nombre = `${prefijo}${i}`;
    request.input(nombre, sql.VarChar, val);
    return `@${nombre}`;
  });
  return ` AND ${columna} IN (${params.join(',')})`;
};

const inputComun = (request, filtros) => {
  request.input('fechaInicio', sql.Date, filtros.fechaInicio);
  request.input('fechaFin', sql.Date, filtros.fechaFin);
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

const usoRutas = async (filtros) => {
  const pool = await poolPromise;
  const rutaIds = parseIds(filtros.rutaId);

  // Resumen
  const reqResumen = inputComun(pool.request(), filtros);
  const filtroRutaResumen = agregarFiltroIN(reqResumen, rutaIds, 'rId', 'r.RutaID');

  const resumen = await reqResumen.query(`
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
    WHERE r.Eliminado = 0 ${filtroRutaResumen}
    GROUP BY r.RutaID, r.NombreRuta, r.Turno
    ORDER BY Viajes DESC, r.NombreRuta ASC
  `);

  // Detalle
  const reqDetalle = inputComun(pool.request(), filtros);
  let filtroViajes = 'WHERE v.Fecha BETWEEN @fechaInicio AND @fechaFin';
  filtroViajes += agregarFiltroIN(reqDetalle, rutaIds, 'rdId', 'v.RutaID');
  filtroViajes += agregarFiltroINVarchar(reqDetalle, parseStrings(filtros.sentido), 'sen', 'v.Sentido');

  const detalle = await reqDetalle.query(`
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
  const vehiculoIds = parseIds(filtros.vehiculoId);
  const rutaIds = parseIds(filtros.rutaId);

  // Resumen
  const reqResumen = inputComun(pool.request(), filtros);
  const filtroVehResumen = agregarFiltroIN(reqResumen, vehiculoIds, 'vId', 'v.VehiculoID');

  const resumen = await reqResumen.query(`
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
    WHERE v.Eliminado = 0 ${filtroVehResumen}
    GROUP BY v.VehiculoID, v.Placa, v.Marca, v.Modelo
    ORDER BY Criticos DESC, EnProceso DESC, CostoTotal DESC
  `);

  // Detalle
  const reqDetalle = inputComun(pool.request(), filtros);
  let whereDetalle = `WHERE m.Eliminado = 0 AND ISNULL(m.FechaProgramada, m.FechaRegistro) >= @fechaInicio AND ISNULL(m.FechaProgramada, m.FechaRegistro) < DATEADD(DAY, 1, @fechaFin)`;
  whereDetalle += agregarFiltroIN(reqDetalle, vehiculoIds, 'vdId', 'm.VehiculoID');
  whereDetalle += agregarFiltroINVarchar(reqDetalle, parseStrings(filtros.estado), 'est', 'm.EstadoMantenimiento');

  const detalle = await reqDetalle.query(`
    SELECT m.MantenimientoID, v.Placa, v.Marca, v.Modelo,
      m.TipoMantenimiento, m.EstadoMantenimiento, m.Prioridad, m.Descripcion,
      m.FechaProgramada, m.FechaInicio, m.FechaFinalizacion, m.ProximoMantenimiento,
      m.Kilometraje, m.Costo, m.Taller, m.Responsable, m.Observaciones
    FROM MantenimientosVehiculos m
    INNER JOIN Vehiculos v ON m.VehiculoID = v.VehiculoID
    ${whereDetalle}
    ORDER BY m.Prioridad DESC, m.FechaProgramada DESC
  `);

  return { resumen: resumen.recordset, detalle: detalle.recordset };
};

const asistenciaEstudiante = async (filtros) => {
  const pool = await poolPromise;
  const rutaIds = parseIds(filtros.rutaId);
  const alumnoIds = parseIds(filtros.alumnoId);

  // Resumen
  const reqResumen = inputComun(pool.request(), filtros);
  let whereResumen = `WHERE asi.Estado = 1 AND CAST(asi.FechaHora AS DATE) BETWEEN @fechaInicio AND @fechaFin AND a.Eliminado = 0`;
  whereResumen += agregarFiltroIN(reqResumen, rutaIds, 'rId', 'asi.RutaID');
  whereResumen += agregarFiltroIN(reqResumen, alumnoIds, 'aId', 'asi.AlumnoID');
  whereResumen += agregarFiltroINVarchar(reqResumen, parseStrings(filtros.tipoEvento), 'evt', 'asi.TipoEvento');
  whereResumen += agregarFiltroINVarchar(reqResumen, parseStrings(filtros.sentido), 'sen', 'asi.Sentido');

  const resumen = await reqResumen.query(`
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
    ${whereResumen}
    GROUP BY a.AlumnoID, a.Nombre, a.Apellido, a.Grado, a.Seccion, r.NombreRuta
    ORDER BY Alumno ASC
  `);

  // Detalle
  const reqDetalle = inputComun(pool.request(), filtros);
  let whereDetalle = `WHERE asi.Estado = 1 AND CAST(asi.FechaHora AS DATE) BETWEEN @fechaInicio AND @fechaFin AND a.Eliminado = 0`;
  whereDetalle += agregarFiltroIN(reqDetalle, rutaIds, 'rdId', 'asi.RutaID');
  whereDetalle += agregarFiltroIN(reqDetalle, alumnoIds, 'adId', 'asi.AlumnoID');
  whereDetalle += agregarFiltroINVarchar(reqDetalle, parseStrings(filtros.tipoEvento), 'devt', 'asi.TipoEvento');
  whereDetalle += agregarFiltroINVarchar(reqDetalle, parseStrings(filtros.sentido), 'dsen', 'asi.Sentido');

  const detalle = await reqDetalle.query(`
    SELECT asi.AsistenciaID, asi.FechaHora, a.Nombre + ' ' + a.Apellido AS Alumno,
      a.Grado, a.Seccion, r.NombreRuta, u.NombreCompleto AS Conductor,
      asi.Sentido, asi.TipoEvento, asi.Turno, asi.Observaciones
    FROM Asistencias asi
    INNER JOIN Alumnos a ON asi.AlumnoID = a.AlumnoID
    LEFT JOIN Rutas r ON asi.RutaID = r.RutaID
    LEFT JOIN Conductores c ON asi.ConductorID = c.ConductorID
    LEFT JOIN Usuarios u ON c.UsuarioID = u.UsuarioID
    ${whereDetalle}
    ORDER BY asi.FechaHora DESC
  `);

  return { resumen: resumen.recordset, detalle: detalle.recordset };
};

const viajes = async (filtros) => {
  const pool = await poolPromise;
  const rutaIds = parseIds(filtros.rutaId);
  const conductorIds = parseIds(filtros.conductorId);

  const request = inputComun(pool.request(), filtros);
  let where = 'WHERE v.Fecha BETWEEN @fechaInicio AND @fechaFin';
  where += agregarFiltroIN(request, rutaIds, 'rId', 'v.RutaID');
  where += agregarFiltroIN(request, conductorIds, 'cId', 't.ConductorID');
  where += agregarFiltroINVarchar(request, parseStrings(filtros.sentido), 'sen', 'v.Sentido');

  const detalle = await request.query(`
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
  const rutaIds = parseIds(filtros.rutaId);
  const conductorIds = parseIds(filtros.conductorId);

  const request = inputComun(pool.request(), filtros);
  let where = 'WHERE t.Fecha BETWEEN @fechaInicio AND @fechaFin';
  where += agregarFiltroIN(request, rutaIds, 'rId', 't.RutaID');
  where += agregarFiltroIN(request, conductorIds, 'cId', 't.ConductorID');

  const detalle = await request.query(`
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