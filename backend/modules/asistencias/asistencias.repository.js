const { sql, poolPromise } = require('../../config/db');
let emailService = {};
try { emailService = require('../../utils/email.service'); } catch (_) { emailService = {}; }

const EVENTO_MENSAJE = {
  'Abordó': 'abordó el bus',
  'Bajó': 'bajó del bus',
  Ausente: 'fue marcado ausente',
  AvisóAusencia: 'avisó ausencia'
};

const EVENTOS_VALIDOS = ['Abordó', 'Bajó', 'Ausente', 'AvisóAusencia'];
const SENTIDOS_VALIDOS = ['Ida', 'Vuelta'];

const crearError = (mensaje, status = 400) => {
  const error = new Error(mensaje);
  error.status = status;
  return error;
};

const normalizarId = (valor, nombreCampo) => {
  const numero = Number(valor);
  if (!Number.isInteger(numero) || numero <= 0) throw crearError(`${nombreCampo} debe ser un identificador válido.`);
  return numero;
};

const normalizarSentido = (sentido) => {
  if (!SENTIDOS_VALIDOS.includes(sentido)) throw crearError('El sentido del viaje debe ser Ida o Vuelta.');
  return sentido;
};

const normalizarEvento = (tipoEvento) => {
  if (!EVENTOS_VALIDOS.includes(tipoEvento)) throw crearError('Tipo de evento inválido.');
  return tipoEvento;
};

const obtenerRolActor = (actor = {}) => Number(actor.rol || actor.RolID || actor.rolId || actor.role || 0);
const obtenerUsuarioIdActor = (actor = {}) => Number(actor.id || actor.UsuarioID || actor.usuarioId || 0);
const obtenerConductorIdActor = (actor = {}) => Number(actor.conductorId || actor.ConductorID || actor.conductorID || 0);
const esConductorActor = (actor = {}) => obtenerRolActor(actor) === 2;
const esPadreActor = (actor = {}) => obtenerRolActor(actor) === 3;

const obtenerConductorIdDesdeActor = async (request, actor = {}) => {
  const conductorIdDirecto = obtenerConductorIdActor(actor);
  if (conductorIdDirecto) return conductorIdDirecto;
  const usuarioId = obtenerUsuarioIdActor(actor);
  if (!usuarioId) return null;
  const result = await request.input('actorUsuarioId', sql.Int, usuarioId).query(`
    SELECT ConductorID FROM Conductores WHERE UsuarioID = @actorUsuarioId AND Eliminado = 0
  `);
  return result.recordset[0]?.ConductorID || null;
};

const validarActorConductor = async (request, actor, conductorIdOperacion) => {
  if (!esConductorActor(actor)) return;
  const conductorIdActor = await obtenerConductorIdDesdeActor(request, actor);
  if (!conductorIdActor || Number(conductorIdActor) !== Number(conductorIdOperacion)) {
    throw crearError('No tienes permiso para operar esta ruta o viaje.', 403);
  }
};

const validarCoordenadas = (lat, lng) => {
  const latNumero = Number(lat);
  const lngNumero = Number(lng);
  if (!Number.isFinite(latNumero) || !Number.isFinite(lngNumero)) throw crearError('Latitud y longitud deben ser números válidos.');
  if (latNumero < -90 || latNumero > 90) throw crearError('La latitud debe estar entre -90 y 90.');
  if (lngNumero < -180 || lngNumero > 180) throw crearError('La longitud debe estar entre -180 y 180.');
  return { latNumero, lngNumero };
};

const validarRutaOperativa = async (request, rutaId) => {
  const result = await request.input('rutaIdValidacionVehiculo', sql.Int, rutaId).query(`
    SELECT TOP 1
      r.RutaID, r.NombreRuta, r.Estado AS EstadoRuta, r.ConductorID, r.VehiculoID,
      v.Placa, v.Estado AS EstadoVehiculo,
      bloqueo.MantenimientoID, bloqueo.EstadoMantenimiento, bloqueo.Prioridad
    FROM Rutas r
    LEFT JOIN Vehiculos v ON r.VehiculoID = v.VehiculoID
    OUTER APPLY (
      SELECT TOP 1 m.MantenimientoID, m.EstadoMantenimiento, m.Prioridad, m.FechaRegistro
      FROM MantenimientosVehiculos m
      WHERE m.VehiculoID = v.VehiculoID AND m.Eliminado = 0
        AND (m.EstadoMantenimiento = 'En Proceso'
          OR (m.Prioridad = 'Crítica' AND m.EstadoMantenimiento IN ('Programado','En Proceso')))
      ORDER BY CASE WHEN m.EstadoMantenimiento = 'En Proceso' THEN 0 ELSE 1 END, m.FechaRegistro DESC
    ) bloqueo
    WHERE r.RutaID = @rutaIdValidacionVehiculo AND r.Eliminado = 0
  `);

  const datos = result.recordset[0];
  if (!datos) throw crearError('La ruta indicada no existe o fue eliminada.', 404);
  if (datos.EstadoRuta === false || datos.EstadoRuta === 0) throw crearError('La ruta está inactiva. No se puede iniciar operación.');
  if (!datos.ConductorID) throw crearError('La ruta no tiene conductor asignado.');
  if (!datos.VehiculoID) throw crearError('La ruta no tiene un vehículo asignado. No se puede iniciar operación.');
  if (datos.EstadoVehiculo === false || datos.EstadoVehiculo === 0) throw crearError(`El vehículo ${datos.Placa || ''} está fuera de servicio o en taller.`);
  if (datos.MantenimientoID && datos.EstadoMantenimiento === 'En Proceso') throw crearError(`El vehículo ${datos.Placa || ''} está en mantenimiento. No se puede iniciar operación.`);
  if (datos.MantenimientoID && datos.Prioridad === 'Crítica') throw crearError(`El vehículo ${datos.Placa || ''} tiene un mantenimiento crítico pendiente.`);
  return datos;
};

const validarConductorActivo = async (request, conductorId) => {
  const result = await request.input('conductorActivoId', sql.Int, conductorId).query(`
    SELECT c.ConductorID
    FROM Conductores c
    INNER JOIN Usuarios u ON c.UsuarioID = u.UsuarioID
    WHERE c.ConductorID = @conductorActivoId
      AND c.Eliminado = 0 AND c.Estado = 1
      AND c.VencimientoLicencia >= CAST(GETDATE() AS DATE)
      AND u.Eliminado = 0 AND u.Estado = 1
  `);
  if (result.recordset.length === 0) throw crearError('El conductor no está activo o su licencia no está vigente.');
};

const validarAlumnoRutaSentido = async (request, alumnoId, rutaId, sentido) => {
  const result = await request
    .input('alumnoValidacionId', sql.Int, alumnoId)
    .input('rutaValidacionId', sql.Int, rutaId)
    .input('sentidoValidacion', sql.VarChar, sentido)
    .query(`
      SELECT AlumnoID FROM Alumnos
      WHERE AlumnoID = @alumnoValidacionId AND RutaID = @rutaValidacionId
        AND Estado = 1 AND Eliminado = 0
        AND (TipoServicio = 'Ambos'
          OR (@sentidoValidacion = 'Ida' AND TipoServicio = 'Solo Ida')
          OR (@sentidoValidacion = 'Vuelta' AND TipoServicio = 'Solo Vuelta'))
    `);
  if (result.recordset.length === 0) throw crearError('El alumno no pertenece a esta ruta o no tiene servicio para este sentido.');
};

const obtenerViajeEnCurso = async (request, rutaId, sentido, conductorId = null) => {
  let query = `
    SELECT TOP 1 v.ViajeID, v.TurnoConductorID, v.RutaID, v.Sentido, t.ConductorID
    FROM Viajes v
    INNER JOIN TurnosConductores t ON v.TurnoConductorID = t.TurnoConductorID
    WHERE v.RutaID = @viajeRutaId AND v.Sentido = @viajeSentido
      AND v.EstadoViaje = 'En Curso' AND t.EstadoTurno = 'Abierto'
  `;
  request.input('viajeRutaId', sql.Int, rutaId);
  request.input('viajeSentido', sql.VarChar, sentido);
  if (conductorId) { query += ' AND t.ConductorID = @viajeConductorId'; request.input('viajeConductorId', sql.Int, conductorId); }
  query += ' ORDER BY v.HoraInicio DESC';
  const result = await request.query(query);
  return result.recordset[0] || null;
};

const crearNotificacionPadre = async (pool, datos, nombreRuta) => {
  const eventoTexto = EVENTO_MENSAJE[datos.TipoEvento];
  if (!eventoTexto) return;
  const result = await pool.request()
    .input('alumnoId', sql.Int, datos.AlumnoID)
    .input('titulo', sql.VarChar, 'Transporte escolar')
    .input('mensajeEvento', sql.VarChar, eventoTexto)
    .input('nombreRuta', sql.VarChar, nombreRuta)
    .input('tipo', sql.VarChar, 'Asistencia')
    .query(`
      INSERT INTO Notificaciones (UsuarioID, Titulo, Mensaje, Tipo)
      OUTPUT INSERTED.*
      SELECT u.UsuarioID, @titulo,
        a.Nombre + ' ' + a.Apellido + ' ' + @mensajeEvento + ' en ' + @nombreRuta + '.',
        @tipo
      FROM Alumnos a
      INNER JOIN Padres p ON a.PadreID = p.PadreID
      INNER JOIN Usuarios u ON p.UsuarioID = u.UsuarioID
      WHERE a.AlumnoID = @alumnoId AND u.Eliminado = 0 AND u.Estado = 1
    `);

  try {
    const { io } = require('../../server');
    if (io) (result.recordset || []).forEach(n => io.to(`usuario-${n.UsuarioID}`).emit('notificacion:nueva', n));
  } catch (e) { console.error('[socket notif padre]', e.message); }
};

const abrirTurno = async (conductorId, rutaId, actor = {}) => {
  const pool = await poolPromise;
  const conductorIdNum = normalizarId(conductorId, 'ConductorID');
  const rutaIdNum = normalizarId(rutaId, 'RutaID');
  await validarActorConductor(pool.request(), actor, conductorIdNum);
  await validarConductorActivo(pool.request(), conductorIdNum);
  const ruta = await validarRutaOperativa(pool.request(), rutaIdNum);
  if (Number(ruta.ConductorID) !== Number(conductorIdNum)) throw crearError('El conductor no está asignado a esta ruta.', 403);

  const check = await pool.request().input('cId', sql.Int, conductorIdNum).query(`
    SELECT TurnoConductorID FROM TurnosConductores WHERE ConductorID = @cId AND EstadoTurno = 'Abierto'
  `);
  if (check.recordset.length > 0) throw crearError('Ya tienes un turno abierto actualmente.');

  const turnoRuta = await pool.request().input('rId', sql.Int, rutaIdNum).query(`
    SELECT TurnoConductorID FROM TurnosConductores WHERE RutaID = @rId AND EstadoTurno = 'Abierto'
  `);
  if (turnoRuta.recordset.length > 0) throw crearError('Ya existe un turno abierto para esta ruta.');

  const result = await pool.request()
    .input('cId', sql.Int, conductorIdNum)
    .input('rId', sql.Int, rutaIdNum)
    .query(`INSERT INTO TurnosConductores (ConductorID, RutaID, EstadoTurno, HoraApertura) OUTPUT INSERTED.* VALUES (@cId, @rId, 'Abierto', GETDATE())`);
  return result.recordset[0];
};

const cerrarTurno = async (turnoId, actor = {}) => {
  const pool = await poolPromise;
  const turnoIdNum = normalizarId(turnoId, 'TurnoID');
  const turno = await pool.request().input('tId', sql.Int, turnoIdNum).query(`
    SELECT TurnoConductorID, ConductorID FROM TurnosConductores WHERE TurnoConductorID = @tId AND EstadoTurno = 'Abierto'
  `);
  if (turno.recordset.length === 0) throw crearError('No existe un turno abierto válido para cerrar.', 404);
  await validarActorConductor(pool.request(), actor, turno.recordset[0].ConductorID);
  const enCurso = await pool.request().input('tId', sql.Int, turnoIdNum).query(`SELECT COUNT(*) AS Total FROM Viajes WHERE TurnoConductorID = @tId AND EstadoViaje = 'En Curso'`);
  if (enCurso.recordset[0].Total > 0) throw crearError('Hay un viaje en curso. Finalízalo antes de cerrar el turno.');
  const result = await pool.request().input('tId', sql.Int, turnoIdNum).query(`
    UPDATE TurnosConductores SET EstadoTurno = 'Cerrado', HoraCierre = GETDATE() OUTPUT INSERTED.* WHERE TurnoConductorID = @tId AND EstadoTurno = 'Abierto'
  `);
  return result.recordset[0];
};

const iniciarViaje = async (turnoId, rutaId, sentido, actor = {}) => {
  const pool = await poolPromise;
  const transaction = new sql.Transaction(pool);
  const turnoIdNum = normalizarId(turnoId, 'TurnoID');
  const rutaIdNum = normalizarId(rutaId, 'RutaID');
  const sentidoValido = normalizarSentido(sentido);
  await transaction.begin();
  try {
    await validarRutaOperativa(new sql.Request(transaction), rutaIdNum);
    const turnoRes = await new sql.Request(transaction)
      .input('tId', sql.Int, turnoIdNum).input('rId', sql.Int, rutaIdNum).query(`
        SELECT TurnoConductorID, ConductorID FROM TurnosConductores
        WHERE TurnoConductorID = @tId AND RutaID = @rId AND EstadoTurno = 'Abierto'
      `);
    if (turnoRes.recordset.length === 0) throw crearError('No existe un turno abierto válido para esta ruta.');
    await validarActorConductor(new sql.Request(transaction), actor, turnoRes.recordset[0].ConductorID);
    const viajeAbierto = await new sql.Request(transaction).input('rId', sql.Int, rutaIdNum).query(`
      SELECT TOP 1 ViajeID FROM Viajes WHERE RutaID = @rId AND Fecha = CAST(GETDATE() AS DATE) AND EstadoViaje = 'En Curso'
    `);
    if (viajeAbierto.recordset.length > 0) throw crearError('Ya existe un viaje en curso para esta ruta. Finalízalo antes de iniciar otro.');
    const sentidoRealizado = await new sql.Request(transaction).input('tId', sql.Int, turnoIdNum).input('sentido', sql.VarChar, sentidoValido).query(`
      SELECT TOP 1 ViajeID FROM Viajes WHERE TurnoConductorID = @tId AND Fecha = CAST(GETDATE() AS DATE) AND Sentido = @sentido AND EstadoViaje IN ('En Curso','Finalizado')
    `);
    if (sentidoRealizado.recordset.length > 0) throw crearError(`El viaje de ${sentidoValido} ya fue iniciado para este turno.`);
    const result = await new sql.Request(transaction)
      .input('tId', sql.Int, turnoIdNum).input('rId', sql.Int, rutaIdNum).input('sentido', sql.VarChar, sentidoValido).query(`
        INSERT INTO Viajes (TurnoConductorID, RutaID, Sentido, Fecha, EstadoViaje, HoraInicio)
        OUTPUT INSERTED.* VALUES (@tId, @rId, @sentido, CAST(GETDATE() AS DATE), 'En Curso', GETDATE())
      `);
    await transaction.commit();
    return result.recordset[0];
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

const obtenerAlumnosPorSentido = async (rutaId, sentido) => {
  const pool = await poolPromise;
  const rutaIdNum = normalizarId(rutaId, 'RutaID');
  const sentidoValido = normalizarSentido(sentido);
  const result = await pool.request().input('rutaId', sql.Int, rutaIdNum).input('sentido', sql.VarChar, sentidoValido).query(`
    SELECT AlumnoID, Nombre + ' ' + Apellido AS NombreCompleto, Grado, Direccion, PuntoReferencia,
      CasaLatitud, CasaLongitud, ColegioLatitud, ColegioLongitud
    FROM Alumnos
    WHERE RutaID = @rutaId AND Estado = 1 AND Eliminado = 0
      AND (TipoServicio = 'Ambos' OR (@sentido = 'Ida' AND TipoServicio = 'Solo Ida') OR (@sentido = 'Vuelta' AND TipoServicio = 'Solo Vuelta'))
    ORDER BY Nombre ASC
  `);
  return result.recordset;
};

const registrarEvento = async (datos, actor = {}) => {
  const pool = await poolPromise;
  const alumnoId = normalizarId(datos.AlumnoID, 'AlumnoID');
  const conductorId = normalizarId(datos.ConductorID, 'ConductorID');
  const rutaId = normalizarId(datos.RutaID, 'RutaID');
  const sentido = normalizarSentido(datos.Sentido);
  const tipoEvento = normalizarEvento(datos.TipoEvento);

  await validarActorConductor(pool.request(), actor, conductorId);
  await validarAlumnoRutaSentido(pool.request(), alumnoId, rutaId, sentido);
  const viajeEnCurso = await obtenerViajeEnCurso(pool.request(), rutaId, sentido, conductorId);
  if (!viajeEnCurso) throw crearError('No existe un viaje en curso válido para registrar asistencia.');

  if (tipoEvento === 'Bajó') {
    const val = await pool.request().input('alumnoId', sql.Int, alumnoId).input('rutaId', sql.Int, rutaId).input('sentido', sql.VarChar, sentido).query(`
      SELECT COUNT(*) AS Subidas FROM Asistencias WHERE AlumnoID = @alumnoId AND RutaID = @rutaId AND Sentido = @sentido AND TipoEvento = 'Abordó' AND CAST(FechaHora AS DATE) = CAST(GETDATE() AS DATE)
    `);
    if (val.recordset[0].Subidas === 0) throw crearError('El alumno no ha abordado el transporte.');
  }

  if (tipoEvento === 'Abordó' || tipoEvento === 'Bajó') {
    const dup = await pool.request().input('alumnoId', sql.Int, alumnoId).input('rutaId', sql.Int, rutaId).input('sentido', sql.VarChar, sentido).input('tipo', sql.VarChar, tipoEvento).query(`
      SELECT COUNT(*) AS Total FROM Asistencias WHERE AlumnoID = @alumnoId AND RutaID = @rutaId AND Sentido = @sentido AND TipoEvento = @tipo AND CAST(FechaHora AS DATE) = CAST(GETDATE() AS DATE)
    `);
    if (dup.recordset[0].Total > 0) throw crearError(`El evento ${tipoEvento} ya fue registrado para este alumno.`);
  }

  if (tipoEvento === 'Ausente' || tipoEvento === 'AvisóAusencia') {
    const val = await pool.request().input('alumnoId', sql.Int, alumnoId).input('rutaId', sql.Int, rutaId).input('sentido', sql.VarChar, sentido).query(`
      SELECT COUNT(*) AS Total FROM Asistencias WHERE AlumnoID = @alumnoId AND RutaID = @rutaId AND Sentido = @sentido AND TipoEvento IN ('Abordó','Bajó') AND CAST(FechaHora AS DATE) = CAST(GETDATE() AS DATE)
    `);
    if (val.recordset[0].Total > 0) throw crearError('No se puede marcar ausencia porque el alumno ya tiene eventos de viaje.');
  }

  const rutaRes = await pool.request().input('rId', sql.Int, rutaId).query('SELECT NombreRuta FROM Rutas WHERE RutaID = @rId');
  const nombreRuta = rutaRes.recordset[0]?.NombreRuta || 'Ruta';
  const result = await pool.request()
    .input('alumnoId', sql.Int, alumnoId).input('conductorId', sql.Int, conductorId).input('rutaId', sql.Int, rutaId)
    .input('sentido', sql.VarChar, sentido).input('tipoEvento', sql.VarChar, tipoEvento).input('turno', sql.VarChar, datos.Turno || '').input('obs', sql.VarChar, datos.Observaciones || '')
    .query(`
      INSERT INTO Asistencias (AlumnoID, ConductorID, RutaID, Sentido, FechaHora, TipoEvento, Turno, Observaciones, Estado)
      OUTPUT INSERTED.* VALUES (@alumnoId, @conductorId, @rutaId, @sentido, GETDATE(), @tipoEvento, @turno, @obs, 1)
    `);

  crearNotificacionPadre(pool, { AlumnoID: alumnoId, TipoEvento: tipoEvento }, nombreRuta).catch(e => console.error('[notif padre]', e.message));
  return result.recordset[0];
};

const deshacerEvento = async (alumnoId, rutaId, sentido, tipoEvento, actor = {}) => {
  const pool = await poolPromise;
  const alumnoIdNum = normalizarId(alumnoId, 'AlumnoID');
  const rutaIdNum = normalizarId(rutaId, 'RutaID');
  const sentidoValido = normalizarSentido(sentido);
  const tipoValido = normalizarEvento(tipoEvento);
  const viajeEnCurso = await obtenerViajeEnCurso(pool.request(), rutaIdNum, sentidoValido);
  if (!viajeEnCurso) throw crearError('No existe un viaje en curso válido para deshacer eventos.');
  await validarActorConductor(pool.request(), actor, viajeEnCurso.ConductorID);
  const result = await pool.request().input('aId', sql.Int, alumnoIdNum).input('rId', sql.Int, rutaIdNum).input('sent', sql.VarChar, sentidoValido).input('tipo', sql.VarChar, tipoValido).query(`
    ;WITH UltimoEvento AS (
      SELECT TOP 1 AsistenciaID FROM Asistencias
      WHERE AlumnoID = @aId AND RutaID = @rId AND Sentido = @sent AND TipoEvento = @tipo AND CAST(FechaHora AS DATE) = CAST(GETDATE() AS DATE)
      ORDER BY FechaHora DESC, AsistenciaID DESC
    ) DELETE FROM Asistencias WHERE AsistenciaID IN (SELECT AsistenciaID FROM UltimoEvento)
  `);
  return result.rowsAffected[0] || 0;
};

const finalizarViaje = async (viajeId, actor = {}) => {
  const pool = await poolPromise;
  const viajeIdNum = normalizarId(viajeId, 'ViajeID');
  const viaje = await pool.request().input('viajeId', sql.Int, viajeIdNum).query(`
    SELECT v.ViajeID, t.ConductorID FROM Viajes v INNER JOIN TurnosConductores t ON v.TurnoConductorID = t.TurnoConductorID
    WHERE v.ViajeID = @viajeId AND v.EstadoViaje = 'En Curso' AND t.EstadoTurno = 'Abierto'
  `);
  if (viaje.recordset.length === 0) throw crearError('No existe un viaje en curso para finalizar.', 404);
  await validarActorConductor(pool.request(), actor, viaje.recordset[0].ConductorID);
  const result = await pool.request().input('viajeId', sql.Int, viajeIdNum).query(`
    UPDATE Viajes SET EstadoViaje = 'Finalizado', HoraFin = GETDATE() OUTPUT INSERTED.* WHERE ViajeID = @viajeId AND EstadoViaje = 'En Curso'
  `);
  return result.recordset[0];
};

const guardarUbicacion = async (viajeId, lat, lng, actor = {}) => {
  const pool = await poolPromise;
  const viajeIdNum = normalizarId(viajeId, 'ViajeID');
  const { latNumero, lngNumero } = validarCoordenadas(lat, lng);
  const viaje = await pool.request().input('vId', sql.Int, viajeIdNum).query(`
    SELECT v.ViajeID, t.ConductorID FROM Viajes v INNER JOIN TurnosConductores t ON v.TurnoConductorID = t.TurnoConductorID
    WHERE v.ViajeID = @vId AND v.EstadoViaje = 'En Curso' AND t.EstadoTurno = 'Abierto'
  `);
  if (viaje.recordset.length === 0) throw crearError('Solo se puede guardar ubicación para un viaje en curso.', 404);
  await validarActorConductor(pool.request(), actor, viaje.recordset[0].ConductorID);
  await pool.request().input('vId', sql.Int, viajeIdNum).input('lat', sql.Decimal(10, 7), latNumero).input('lng', sql.Decimal(10, 7), lngNumero).query(`
    INSERT INTO UbicacionBus (ViajeID, Latitud, Longitud) VALUES (@vId, @lat, @lng)
  `);
};

const validarAccesoUbicacionViaje = async (pool, viajeId, actor = {}) => {
  const rol = obtenerRolActor(actor);
  const usuarioId = obtenerUsuarioIdActor(actor);
  const viaje = await pool.request().input('viajeIdAuth', sql.Int, viajeId).query(`
    SELECT TOP 1 v.ViajeID, v.RutaID, v.Sentido, v.EstadoViaje, t.ConductorID
    FROM Viajes v LEFT JOIN TurnosConductores t ON v.TurnoConductorID = t.TurnoConductorID
    WHERE v.ViajeID = @viajeIdAuth
  `);
  const datosViaje = viaje.recordset[0];
  if (!datosViaje) throw crearError('El viaje indicado no existe.', 404);
  if (rol === 1) return;
  if (rol === 2) {
    const conductorIdActor = await obtenerConductorIdDesdeActor(pool.request(), actor);
    if (!conductorIdActor || Number(conductorIdActor) !== Number(datosViaje.ConductorID)) throw crearError('No tienes permiso para consultar la ubicación de este viaje.', 403);
    return;
  }
  if (rol === 3) {
    if (!usuarioId) throw crearError('No se pudo identificar al usuario autenticado.', 403);
    const acceso = await pool.request().input('viajeIdPadreAuth', sql.Int, viajeId).input('usuarioIdPadreAuth', sql.Int, usuarioId).query(`
      SELECT TOP 1 v.ViajeID
      FROM Viajes v
      INNER JOIN Alumnos a ON a.RutaID = v.RutaID AND a.Eliminado = 0 AND a.Estado = 1
        AND (a.TipoServicio = 'Ambos' OR (v.Sentido = 'Ida' AND a.TipoServicio = 'Solo Ida') OR (v.Sentido = 'Vuelta' AND a.TipoServicio = 'Solo Vuelta'))
      INNER JOIN Padres p ON a.PadreID = p.PadreID AND p.Eliminado = 0
      WHERE v.ViajeID = @viajeIdPadreAuth AND v.EstadoViaje = 'En Curso' AND p.UsuarioID = @usuarioIdPadreAuth
    `);
    if (acceso.recordset.length === 0) throw crearError('No tienes permiso para consultar la ubicación de este viaje.', 403);
    return;
  }
  throw crearError('No tienes permiso para consultar la ubicación de este viaje.', 403);
};

const obtenerUltimaUbicacion = async (viajeId, actor = {}) => {
  const pool = await poolPromise;
  const viajeIdNum = normalizarId(viajeId, 'ViajeID');
  await validarAccesoUbicacionViaje(pool, viajeIdNum, actor);
  const result = await pool.request().input('vId', sql.Int, viajeIdNum).query(`
    SELECT TOP 1 Latitud, Longitud, FechaHora FROM UbicacionBus WHERE ViajeID = @vId ORDER BY FechaHora DESC
  `);
  return result.recordset[0] || null;
};

const recuperarSesion = async (conductorId, actor = {}) => {
  const pool = await poolPromise;
  const conductorIdNum = normalizarId(conductorId, 'ConductorID');
  await validarActorConductor(pool.request(), actor, conductorIdNum);
  const turnoRes = await pool.request().input('cId', sql.Int, conductorIdNum).query(`SELECT * FROM TurnosConductores WHERE ConductorID = @cId AND EstadoTurno = 'Abierto'`);
  const turno = turnoRes.recordset[0] || null;
  let viaje = null;
  const viajesRealizados = { Ida: false, Vuelta: false };
  let eventos = [];
  let alumnos = [];
  if (turno) {
    const viajesRes = await pool.request().input('tId', sql.Int, turno.TurnoConductorID).query(`SELECT Sentido, EstadoViaje, ViajeID FROM Viajes WHERE TurnoConductorID = @tId ORDER BY HoraInicio DESC`);
    viajesRes.recordset.forEach(v => { if (v.EstadoViaje === 'Finalizado') viajesRealizados[v.Sentido] = true; if (v.EstadoViaje === 'En Curso' && !viaje) viaje = v; });
    if (viaje) {
      alumnos = await obtenerAlumnosPorSentido(turno.RutaID, viaje.Sentido);
      const eventosRes = await pool.request().input('rutaId', sql.Int, turno.RutaID).input('sentido', sql.VarChar, viaje.Sentido).input('horaApertura', sql.DateTime, turno.HoraApertura).query(`
        SELECT AlumnoID, TipoEvento FROM Asistencias WHERE RutaID = @rutaId AND Sentido = @sentido AND CAST(FechaHora AS DATE) = CAST(GETDATE() AS DATE) AND FechaHora >= @horaApertura
      `);
      eventos = eventosRes.recordset;
    }
  }
  return { turno, viaje, viajesRealizados, eventos, alumnos };
};

const obtenerTurnosAbiertos = async () => {
  const pool = await poolPromise;
  const result = await pool.request().query(`
    SELECT t.TurnoConductorID, t.Fecha, t.HoraApertura, t.ConductorID,
      ISNULL(u.NombreCompleto, 'Conductor ID: ' + CAST(t.ConductorID AS VARCHAR)) AS NombreConductor,
      r.NombreRuta, r.Turno AS TurnoRuta, v.ViajeID, v.Sentido AS SentidoActual
    FROM TurnosConductores t
    JOIN Rutas r ON t.RutaID = r.RutaID
    JOIN Conductores c ON t.ConductorID = c.ConductorID
    LEFT JOIN Usuarios u ON c.UsuarioID = u.UsuarioID
    LEFT JOIN Viajes v ON v.TurnoConductorID = t.TurnoConductorID AND v.EstadoViaje = 'En Curso'
    WHERE t.EstadoTurno = 'Abierto'
    ORDER BY t.HoraApertura DESC
  `);
  return result.recordset;
};

const reasignarTurno = async (turnoId, nuevoConductorId) => {
  const pool = await poolPromise;
  const turnoIdNum = normalizarId(turnoId, 'TurnoID');
  const nuevoConductorIdNum = normalizarId(nuevoConductorId, 'NuevoConductorID');
  await validarConductorActivo(pool.request(), nuevoConductorIdNum);
  const result = await pool.request().input('tId', sql.Int, turnoIdNum).input('cId', sql.Int, nuevoConductorIdNum).query(`
    UPDATE TurnosConductores SET ConductorID = @cId OUTPUT INSERTED.* WHERE TurnoConductorID = @tId AND EstadoTurno = 'Abierto'
  `);
  if (result.recordset.length === 0) throw crearError('Turno abierto no encontrado.', 404);
  return result.recordset[0];
};

const forzarCierreTurno = async (turnoId) => {
  const pool = await poolPromise;
  const turnoIdNum = normalizarId(turnoId, 'TurnoID');
  await pool.request().input('tId', sql.Int, turnoIdNum).query(`UPDATE Viajes SET EstadoViaje = 'Finalizado', HoraFin = GETDATE() WHERE TurnoConductorID = @tId AND EstadoViaje = 'En Curso'`);
  const result = await pool.request().input('tId', sql.Int, turnoIdNum).query(`
    UPDATE TurnosConductores SET EstadoTurno = 'Cerrado', HoraCierre = GETDATE() OUTPUT INSERTED.* WHERE TurnoConductorID = @tId AND EstadoTurno = 'Abierto'
  `);
  if (result.recordset.length === 0) throw crearError('Turno abierto no encontrado.', 404);
  return result.recordset[0];
};

const obtenerHistorialTurnos = async (fechaInicio, fechaFin, rutaId) => {
  const pool = await poolPromise;
  const request = pool.request();
  let query = `
    SELECT t.TurnoConductorID, t.Fecha, t.HoraApertura, t.HoraCierre,
      DATEDIFF(MINUTE, t.HoraApertura, t.HoraCierre) AS DuracionMinutos,
      ISNULL(u.NombreCompleto, 'Conductor ID: ' + CAST(t.ConductorID AS VARCHAR)) AS NombreConductor,
      r.NombreRuta, r.Turno AS TurnoRuta
    FROM TurnosConductores t
    JOIN Rutas r ON t.RutaID = r.RutaID
    JOIN Conductores c ON t.ConductorID = c.ConductorID
    LEFT JOIN Usuarios u ON c.UsuarioID = u.UsuarioID
    WHERE t.EstadoTurno = 'Cerrado'
  `;
  if (fechaInicio && fechaFin) { query += ' AND t.Fecha BETWEEN @fechaInicio AND @fechaFin'; request.input('fechaInicio', sql.Date, fechaInicio); request.input('fechaFin', sql.Date, fechaFin); }
  if (rutaId && rutaId !== 'todas') { query += ' AND t.RutaID = @rutaId'; request.input('rutaId', sql.Int, rutaId); }
  query += ' ORDER BY t.Fecha DESC, t.HoraApertura DESC';
  return (await request.query(query)).recordset;
};

const obtenerDetalleTurno = async (turnoId) => {
  const pool = await poolPromise;
  const turnoIdNum = normalizarId(turnoId, 'TurnoID');
  const resViajes = await pool.request().input('tId', sql.Int, turnoIdNum).query(`SELECT ViajeID, Sentido, HoraInicio, HoraFin, EstadoViaje FROM Viajes WHERE TurnoConductorID = @tId`);
  const resAsistencia = await pool.request().input('tId', sql.Int, turnoIdNum).query(`
    SELECT a.Sentido, a.TipoEvento, a.FechaHora, al.Nombre + ' ' + al.Apellido AS Alumno
    FROM Asistencias a
    JOIN Alumnos al ON a.AlumnoID = al.AlumnoID
    JOIN TurnosConductores t ON a.ConductorID = t.ConductorID AND a.RutaID = t.RutaID
    WHERE t.TurnoConductorID = @tId AND a.FechaHora >= t.HoraApertura AND (t.HoraCierre IS NULL OR a.FechaHora <= t.HoraCierre)
    ORDER BY a.FechaHora ASC
  `);
  return { viajes: resViajes.recordset, asistencias: resAsistencia.recordset };
};

module.exports = {
  abrirTurno,
  cerrarTurno,
  iniciarViaje,
  obtenerAlumnosPorSentido,
  registrarEvento,
  deshacerEvento,
  finalizarViaje,
  guardarUbicacion,
  obtenerUltimaUbicacion,
  recuperarSesion,
  obtenerTurnosAbiertos,
  reasignarTurno,
  forzarCierreTurno,
  obtenerHistorialTurnos,
  obtenerDetalleTurno
};
