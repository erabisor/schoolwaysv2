const { sql, poolPromise } = require('../../config/db');

const abrirTurno = async (conductorId, rutaId) => {
  const pool = await poolPromise;
  const checkTurno = await pool.request()
    .input('cId', sql.Int, conductorId)
    .query("SELECT * FROM TurnosConductores WHERE ConductorID = @cId AND EstadoTurno = 'Abierto'");
    
  if (checkTurno.recordset.length > 0) throw new Error('Ya tienes un turno abierto actualmente.');

  const result = await pool.request()
    .input('cId', sql.Int, conductorId)
    .input('rId', sql.Int, rutaId)
    .query(`
      INSERT INTO TurnosConductores (ConductorID, RutaID, EstadoTurno, HoraApertura)
      OUTPUT INSERTED.*
      VALUES (@cId, @rId, 'Abierto', GETDATE())
    `);
  return result.recordset[0];
};

const cerrarTurno = async (turnoId) => {
  const pool = await poolPromise;
  const check = await pool.request()
    .input('tId', sql.Int, turnoId)
    .query("SELECT COUNT(*) as Pendientes FROM Viajes WHERE TurnoConductorID = @tId AND EstadoViaje = 'En Curso'");
    
  if (check.recordset[0].Pendientes > 0) throw new Error('Hay viajes en curso.');

  const result = await pool.request()
    .input('tId', sql.Int, turnoId)
    .query(`
      UPDATE TurnosConductores 
      SET EstadoTurno = 'Cerrado', HoraCierre = GETDATE() 
      OUTPUT INSERTED.*
      WHERE TurnoConductorID = @tId
    `);
  return result.recordset[0];
};

const iniciarViaje = async (turnoId, rutaId, sentido) => {
  const pool = await poolPromise;
  const result = await pool.request()
    .input('tId', sql.Int, turnoId)
    .input('rId', sql.Int, rutaId)
    .input('sentido', sql.VarChar, sentido)
    .query(`
      INSERT INTO Viajes (TurnoConductorID, RutaID, Sentido, Fecha, EstadoViaje, HoraInicio)
      OUTPUT INSERTED.*
      VALUES (@tId, @rId, @sentido, CAST(GETDATE() AS DATE), 'En Curso', GETDATE())
    `);
  return result.recordset[0];
};

const obtenerAlumnosPorSentido = async (rutaId, sentido) => {
  const pool = await poolPromise;
  const result = await pool.request()
    .input('rutaId', sql.Int, rutaId)
    .input('sentido', sql.VarChar, sentido)
    .query(`
      SELECT 
        AlumnoID, (Nombre + ' ' + Apellido) AS NombreCompleto, 
        Grado, Direccion, PuntoReferencia
      FROM Alumnos
      WHERE RutaID = @rutaId AND Estado = 1 AND Eliminado = 0
        AND (TipoServicio = 'Ambos' OR (@sentido = 'Ida' AND TipoServicio = 'Solo Ida') OR (@sentido = 'Vuelta' AND TipoServicio = 'Solo Vuelta'))
      ORDER BY Nombre ASC
    `);
  return result.recordset;
};

const registrarEvento = async (datos) => {
  const pool = await poolPromise;

  if (datos.TipoEvento === 'Bajó') {
    const validacion = await pool.request()
      .input('alumnoId', sql.Int, datos.AlumnoID)
      .input('rutaId', sql.Int, datos.RutaID)
      .input('sentido', sql.VarChar, datos.Sentido)
      .query(`
        SELECT COUNT(*) as Subidas FROM Asistencias 
        WHERE AlumnoID = @alumnoId AND RutaID = @rutaId AND Sentido = @sentido AND TipoEvento = 'Abordó' AND CAST(FechaHora AS DATE) = CAST(GETDATE() AS DATE)
      `);
    if (validacion.recordset[0].Subidas === 0) throw new Error('El alumno no ha subido al transporte.');
  }

  const result = await pool.request()
    .input('alumnoId', sql.Int, datos.AlumnoID)
    .input('conductorId', sql.Int, datos.ConductorID)
    .input('rutaId', sql.Int, datos.RutaID)
    .input('sentido', sql.VarChar, datos.Sentido)
    .input('tipoEvento', sql.VarChar, datos.TipoEvento)
    .input('turno', sql.VarChar, datos.Turno) 
    .input('obs', sql.VarChar, datos.Observaciones || '')
    .query(`
      INSERT INTO Asistencias (AlumnoID, ConductorID, RutaID, Sentido, FechaHora, TipoEvento, Turno, Observaciones, Estado)
      OUTPUT INSERTED.*
      VALUES (@alumnoId, @conductorId, @rutaId, @sentido, GETDATE(), @tipoEvento, @turno, @obs, 1)
    `);
  return result.recordset[0];
};

const deshacerEvento = async (alumnoId, rutaId, sentido, tipoEvento) => {
  const pool = await poolPromise;
  const result = await pool.request()
    .input('aId', sql.Int, alumnoId)
    .input('rId', sql.Int, rutaId)
    .input('sent', sql.VarChar, sentido)
    .input('tipo', sql.VarChar, tipoEvento)
    .query(`
      DELETE FROM Asistencias
      WHERE AlumnoID = @aId AND RutaID = @rId AND Sentido = @sent AND TipoEvento = @tipo
      AND CAST(FechaHora AS DATE) = CAST(GETDATE() AS DATE)
    `);
  return result.rowsAffected;
};

const finalizarViaje = async (viajeId) => {
  const pool = await poolPromise;
  const result = await pool.request()
    .input('viajeId', sql.Int, viajeId)
    .query("UPDATE Viajes SET EstadoViaje = 'Finalizado', HoraFin = GETDATE() OUTPUT INSERTED.* WHERE ViajeID = @viajeId");
  return result.recordset[0];
};

const recuperarSesion = async (conductorId) => {
  const pool = await poolPromise;
  const turnoRes = await pool.request().input('cId', sql.Int, conductorId)
    .query("SELECT * FROM TurnosConductores WHERE ConductorID = @cId AND EstadoTurno = 'Abierto'");
  
  const turno = turnoRes.recordset[0] || null;
  let viaje = null;
  let viajesRealizados = { Ida: false, Vuelta: false };
  let eventos = [];
  let alumnos = [];

  if (turno) {
    const viajesRes = await pool.request().input('tId', sql.Int, turno.TurnoConductorID)
      .query("SELECT Sentido, EstadoViaje, ViajeID FROM Viajes WHERE TurnoConductorID = @tId");
    
    viajesRes.recordset.forEach(v => {
      if (v.EstadoViaje === 'Finalizado') viajesRealizados[v.Sentido] = true;
      else if (v.EstadoViaje === 'En Curso') viaje = v;
    });

    if (viaje) {
      alumnos = await obtenerAlumnosPorSentido(turno.RutaID, viaje.Sentido);
      const eventosRes = await pool.request()
        .input('rutaId', sql.Int, turno.RutaID).input('sentido', sql.VarChar, viaje.Sentido)
        .query("SELECT AlumnoID, TipoEvento FROM Asistencias WHERE RutaID = @rutaId AND Sentido = @sentido AND CAST(FechaHora AS DATE) = CAST(GETDATE() AS DATE)");
      eventos = eventosRes.recordset;
    }
  }
  return { turno, viaje, viajesRealizados, eventos, alumnos };
};

const obtenerTurnosAbiertos = async () => {
  const pool = await poolPromise;
  const result = await pool.request().query(`
    SELECT 
      t.TurnoConductorID, t.Fecha, t.HoraApertura, t.ConductorID,
      ISNULL(u.NombreCompleto, 'Conductor ID: ' + CAST(t.ConductorID AS VARCHAR)) AS NombreConductor,
      r.NombreRuta, r.Turno AS TurnoRuta
    FROM TurnosConductores t
    JOIN Rutas r ON t.RutaID = r.RutaID
    LEFT JOIN Usuarios u ON t.ConductorID = u.UsuarioID
    WHERE t.EstadoTurno = 'Abierto'
    ORDER BY t.HoraApertura DESC
  `);
  return result.recordset;
};

const reasignarTurno = async (turnoId, nuevoUsuarioId) => {
  const pool = await poolPromise;
  const result = await pool.request()
    .input('tId', sql.Int, turnoId)
    // Forzamos el ID de usuario como un entero puro
    .input('uId', sql.Int, parseInt(nuevoUsuarioId)) 
    .query(`
      UPDATE TurnosConductores 
      SET ConductorID = @uId 
      OUTPUT INSERTED.* WHERE TurnoConductorID = @tId
    `);
  return result.recordset[0];
};

const forzarCierreTurno = async (turnoId) => {
  const pool = await poolPromise;
  await pool.request()
    .input('tId', sql.Int, turnoId)
    .query(`
      UPDATE Viajes 
      SET EstadoViaje = 'Finalizado', HoraFin = GETDATE() 
      WHERE TurnoConductorID = @tId AND EstadoViaje = 'En Curso'
    `);
  const result = await pool.request()
    .input('tId', sql.Int, turnoId)
    .query(`
      UPDATE TurnosConductores 
      SET EstadoTurno = 'Cerrado', HoraCierre = GETDATE() 
      OUTPUT INSERTED.* WHERE TurnoConductorID = @tId
    `);
  return result.recordset[0];
};

const obtenerHistorialTurnos = async (fechaInicio, fechaFin, rutaId) => {
  const pool = await poolPromise;
  let query = `
    SELECT 
      t.TurnoConductorID, t.Fecha, t.HoraApertura, t.HoraCierre,
      DATEDIFF(MINUTE, t.HoraApertura, t.HoraCierre) AS DuracionMinutos,
      ISNULL(u.NombreCompleto, 'Conductor ID: ' + CAST(t.ConductorID AS VARCHAR)) AS NombreConductor,
      r.NombreRuta, r.Turno AS TurnoRuta
    FROM TurnosConductores t
    JOIN Rutas r ON t.RutaID = r.RutaID
    LEFT JOIN Usuarios u ON t.ConductorID = u.UsuarioID
    WHERE t.EstadoTurno = 'Cerrado'
  `;

  const request = pool.request();

  if (fechaInicio && fechaFin) {
    query += ` AND t.Fecha BETWEEN @fechaInicio AND @fechaFin`;
    request.input('fechaInicio', sql.Date, fechaInicio);
    request.input('fechaFin', sql.Date, fechaFin);
  }
  
  if (rutaId && rutaId !== 'todas') {
    query += ` AND t.RutaID = @rutaId`;
    request.input('rutaId', sql.Int, rutaId);
  }

  query += ` ORDER BY t.Fecha DESC, t.HoraApertura DESC`;
  
  const result = await request.query(query);
  return result.recordset;
};

const obtenerDetalleTurno = async (turnoId) => {
  const pool = await poolPromise;
  
  const resViajes = await pool.request()
    .input('tId', sql.Int, turnoId)
    .query(`SELECT ViajeID, Sentido, HoraInicio, HoraFin, EstadoViaje FROM Viajes WHERE TurnoConductorID = @tId`);
  
  const viajes = resViajes.recordset;

  const resAsistencia = await pool.request()
    .input('tId', sql.Int, turnoId)
    .query(`
      SELECT a.Sentido, a.TipoEvento, a.FechaHora, (al.Nombre + ' ' + al.Apellido) as Alumno
      FROM Asistencias a
      JOIN Alumnos al ON a.AlumnoID = al.AlumnoID
      JOIN TurnosConductores t ON a.ConductorID = t.ConductorID AND a.RutaID = t.RutaID
      WHERE t.TurnoConductorID = @tId
        AND a.FechaHora >= t.HoraApertura
        AND (t.HoraCierre IS NULL OR a.FechaHora <= t.HoraCierre)
      ORDER BY a.FechaHora ASC
    `);

  return { viajes, asistencias: resAsistencia.recordset };
};

module.exports = { 
  abrirTurno, cerrarTurno, iniciarViaje, obtenerAlumnosPorSentido, 
  registrarEvento, deshacerEvento, finalizarViaje, recuperarSesion,
  obtenerTurnosAbiertos, reasignarTurno, forzarCierreTurno,
  obtenerHistorialTurnos, obtenerDetalleTurno
};