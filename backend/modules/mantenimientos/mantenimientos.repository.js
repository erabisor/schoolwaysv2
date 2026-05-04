const { sql, poolPromise } = require('../../config/db');

const ESTADOS_BLOQUEANTES_SQL = `
  EstadoMantenimiento = 'En Proceso'
  OR (
    Prioridad = 'Crítica'
    AND EstadoMantenimiento IN ('Programado', 'En Proceso')
  )
`;

const normalizarTexto = (valor) => {
  if (valor === undefined || valor === null || valor === '') return null;
  return String(valor).trim();
};

const normalizarFecha = (valor) => {
  if (valor === undefined || valor === null || valor === '') return null;
  return valor;
};

const normalizarNumero = (valor) => {
  if (valor === undefined || valor === null || valor === '') return null;
  const numero = Number(valor);
  return Number.isFinite(numero) ? numero : null;
};

const esEstadoBloqueante = (estado, prioridad) => {
  return estado === 'En Proceso' || (prioridad === 'Crítica' && ['Programado', 'En Proceso'].includes(estado));
};

const sincronizarEstadoVehiculo = async (transaction, vehiculoId) => {
  if (!vehiculoId) return;

  const bloqueo = await new sql.Request(transaction)
    .input('vehiculoId', sql.Int, vehiculoId)
    .query(`
      SELECT COUNT(*) AS Total
      FROM MantenimientosVehiculos
      WHERE VehiculoID = @vehiculoId
        AND Eliminado = 0
        AND (${ESTADOS_BLOQUEANTES_SQL})
    `);

  const tieneBloqueo = bloqueo.recordset[0].Total > 0;

  await new sql.Request(transaction)
    .input('vehiculoId', sql.Int, vehiculoId)
    .input('estado', sql.Bit, tieneBloqueo ? 0 : 1)
    .query(`
      UPDATE Vehiculos
      SET Estado = @estado
      WHERE VehiculoID = @vehiculoId
        AND Eliminado = 0
    `);
};

const existeVehiculo = async (vehiculoId) => {
  const pool = await poolPromise;

  const result = await pool.request()
    .input('vehiculoId', sql.Int, vehiculoId)
    .query(`
      SELECT VehiculoID
      FROM Vehiculos
      WHERE VehiculoID = @vehiculoId
        AND Eliminado = 0
    `);

  return result.recordset.length > 0;
};

const obtenerPorId = async (id) => {
  const pool = await poolPromise;

  const result = await pool.request()
    .input('id', sql.Int, id)
    .query(`
      SELECT TOP 1
        MantenimientoID,
        VehiculoID,
        EstadoMantenimiento,
        Prioridad,
        Eliminado
      FROM MantenimientosVehiculos
      WHERE MantenimientoID = @id
        AND Eliminado = 0
    `);

  return result.recordset[0] || null;
};

const validarDuplicadoBloqueante = async (transaction, vehiculoId, estado, prioridad, idExcluir = null) => {
  if (!esEstadoBloqueante(estado, prioridad)) return;

  const request = new sql.Request(transaction)
    .input('vehiculoId', sql.Int, vehiculoId);

  let query = `
    SELECT TOP 1 MantenimientoID
    FROM MantenimientosVehiculos
    WHERE VehiculoID = @vehiculoId
      AND Eliminado = 0
      AND (${ESTADOS_BLOQUEANTES_SQL})
  `;

  if (idExcluir) {
    query += ' AND MantenimientoID <> @idExcluir';
    request.input('idExcluir', sql.Int, idExcluir);
  }

  const result = await request.query(query);

  if (result.recordset.length > 0) {
    const error = new Error('El vehículo ya tiene un mantenimiento bloqueante abierto.');
    error.status = 400;
    throw error;
  }
};

const obtenerTodos = async (filtros = {}) => {
  const pool = await poolPromise;
  const request = pool.request();

  let query = `
    SELECT
      m.MantenimientoID,
      m.VehiculoID,
      v.Placa,
      v.Marca,
      v.Modelo,
      v.Estado AS EstadoVehiculo,
      m.TipoMantenimiento,
      m.EstadoMantenimiento,
      m.Prioridad,
      m.Descripcion,
      m.Taller,
      m.Responsable,
      m.FechaProgramada,
      m.FechaInicio,
      m.FechaFinalizacion,
      m.ProximoMantenimiento,
      m.Kilometraje,
      m.Costo,
      m.Observaciones,
      m.UsuarioRegistroID,
      u.NombreCompleto AS UsuarioRegistro,
      m.FechaRegistro,
      m.FechaActualizacion
    FROM MantenimientosVehiculos m
    INNER JOIN Vehiculos v ON m.VehiculoID = v.VehiculoID
    LEFT JOIN Usuarios u ON m.UsuarioRegistroID = u.UsuarioID
    WHERE m.Eliminado = 0
  `;

  if (filtros.vehiculoId) {
    query += ' AND m.VehiculoID = @vehiculoId';
    request.input('vehiculoId', sql.Int, filtros.vehiculoId);
  }

  if (filtros.estado) {
    query += ' AND m.EstadoMantenimiento = @estado';
    request.input('estado', sql.VarChar, filtros.estado);
  }

  if (filtros.tipo) {
    query += ' AND m.TipoMantenimiento = @tipo';
    request.input('tipo', sql.VarChar, filtros.tipo);
  }

  if (filtros.prioridad) {
    query += ' AND m.Prioridad = @prioridad';
    request.input('prioridad', sql.VarChar, filtros.prioridad);
  }

  if (filtros.fechaInicio && filtros.fechaFin) {
    query += ' AND m.FechaProgramada BETWEEN @fechaInicio AND @fechaFin';
    request.input('fechaInicio', sql.Date, filtros.fechaInicio);
    request.input('fechaFin', sql.Date, filtros.fechaFin);
  }

  query += ' ORDER BY m.FechaRegistro DESC';

  const result = await request.query(query);
  return result.recordset;
};

const obtenerPorVehiculo = async (vehiculoId) => {
  return obtenerTodos({ vehiculoId });
};

const prepararDatosEstado = (datos) => {
  const estado = datos.EstadoMantenimiento;
  const datosPreparados = { ...datos };

  if (estado === 'En Proceso' && !datosPreparados.FechaInicio) {
    datosPreparados.FechaInicio = new Date();
  }

  if (estado === 'Completado' && !datosPreparados.FechaFinalizacion) {
    datosPreparados.FechaFinalizacion = new Date();
  }

  return datosPreparados;
};

const crear = async (datos, usuarioRegistroId) => {
  const pool = await poolPromise;
  const transaction = new sql.Transaction(pool);

  await transaction.begin();

  try {
    const datosFinales = prepararDatosEstado(datos);

    await validarDuplicadoBloqueante(
      transaction,
      datosFinales.VehiculoID,
      datosFinales.EstadoMantenimiento,
      datosFinales.Prioridad
    );

    const result = await new sql.Request(transaction)
      .input('vehiculoId', sql.Int, datosFinales.VehiculoID)
      .input('tipo', sql.VarChar, datosFinales.TipoMantenimiento)
      .input('estado', sql.VarChar, datosFinales.EstadoMantenimiento)
      .input('prioridad', sql.VarChar, datosFinales.Prioridad)
      .input('descripcion', sql.VarChar, normalizarTexto(datosFinales.Descripcion))
      .input('taller', sql.VarChar, normalizarTexto(datosFinales.Taller))
      .input('responsable', sql.VarChar, normalizarTexto(datosFinales.Responsable))
      .input('fechaProgramada', sql.Date, normalizarFecha(datosFinales.FechaProgramada))
      .input('fechaInicio', sql.Date, normalizarFecha(datosFinales.FechaInicio))
      .input('fechaFinalizacion', sql.Date, normalizarFecha(datosFinales.FechaFinalizacion))
      .input('proximo', sql.Date, normalizarFecha(datosFinales.ProximoMantenimiento))
      .input('km', sql.Int, normalizarNumero(datosFinales.Kilometraje))
      .input('costo', sql.Decimal(10, 2), normalizarNumero(datosFinales.Costo))
      .input('obs', sql.VarChar, normalizarTexto(datosFinales.Observaciones))
      .input('usuarioId', sql.Int, usuarioRegistroId || null)
      .query(`
        INSERT INTO MantenimientosVehiculos
        (
          VehiculoID,
          TipoMantenimiento,
          EstadoMantenimiento,
          Prioridad,
          Descripcion,
          Taller,
          Responsable,
          FechaProgramada,
          FechaInicio,
          FechaFinalizacion,
          ProximoMantenimiento,
          Kilometraje,
          Costo,
          Observaciones,
          UsuarioRegistroID
        )
        OUTPUT INSERTED.MantenimientoID
        VALUES
        (
          @vehiculoId,
          @tipo,
          @estado,
          @prioridad,
          @descripcion,
          @taller,
          @responsable,
          @fechaProgramada,
          @fechaInicio,
          @fechaFinalizacion,
          @proximo,
          @km,
          @costo,
          @obs,
          @usuarioId
        )
      `);

    await sincronizarEstadoVehiculo(transaction, datosFinales.VehiculoID);
    await transaction.commit();

    return result.recordset[0];
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

const actualizar = async (id, datos) => {
  const pool = await poolPromise;
  const transaction = new sql.Transaction(pool);

  await transaction.begin();

  try {
    const actual = await new sql.Request(transaction)
      .input('id', sql.Int, id)
      .query(`
        SELECT VehiculoID
        FROM MantenimientosVehiculos
        WHERE MantenimientoID = @id
          AND Eliminado = 0
      `);

    const vehiculoAnteriorId = actual.recordset[0]?.VehiculoID || null;

    if (!vehiculoAnteriorId) {
      await transaction.rollback();
      return false;
    }

    const datosFinales = prepararDatosEstado(datos);
    const vehiculoNuevoId = datosFinales.VehiculoID || vehiculoAnteriorId;

    await validarDuplicadoBloqueante(
      transaction,
      vehiculoNuevoId,
      datosFinales.EstadoMantenimiento,
      datosFinales.Prioridad,
      id
    );

    const result = await new sql.Request(transaction)
      .input('id', sql.Int, id)
      .input('vehiculoId', sql.Int, vehiculoNuevoId)
      .input('tipo', sql.VarChar, datosFinales.TipoMantenimiento)
      .input('estado', sql.VarChar, datosFinales.EstadoMantenimiento)
      .input('prioridad', sql.VarChar, datosFinales.Prioridad)
      .input('descripcion', sql.VarChar, normalizarTexto(datosFinales.Descripcion))
      .input('taller', sql.VarChar, normalizarTexto(datosFinales.Taller))
      .input('responsable', sql.VarChar, normalizarTexto(datosFinales.Responsable))
      .input('fechaProgramada', sql.Date, normalizarFecha(datosFinales.FechaProgramada))
      .input('fechaInicio', sql.Date, normalizarFecha(datosFinales.FechaInicio))
      .input('fechaFinalizacion', sql.Date, normalizarFecha(datosFinales.FechaFinalizacion))
      .input('proximo', sql.Date, normalizarFecha(datosFinales.ProximoMantenimiento))
      .input('km', sql.Int, normalizarNumero(datosFinales.Kilometraje))
      .input('costo', sql.Decimal(10, 2), normalizarNumero(datosFinales.Costo))
      .input('obs', sql.VarChar, normalizarTexto(datosFinales.Observaciones))
      .query(`
        UPDATE MantenimientosVehiculos
        SET VehiculoID = @vehiculoId,
            TipoMantenimiento = @tipo,
            EstadoMantenimiento = @estado,
            Prioridad = @prioridad,
            Descripcion = @descripcion,
            Taller = @taller,
            Responsable = @responsable,
            FechaProgramada = @fechaProgramada,
            FechaInicio = @fechaInicio,
            FechaFinalizacion = @fechaFinalizacion,
            ProximoMantenimiento = @proximo,
            Kilometraje = @km,
            Costo = @costo,
            Observaciones = @obs,
            FechaActualizacion = GETDATE()
        WHERE MantenimientoID = @id
          AND Eliminado = 0
      `);

    await sincronizarEstadoVehiculo(transaction, vehiculoNuevoId);

    if (vehiculoAnteriorId && Number(vehiculoAnteriorId) !== Number(vehiculoNuevoId)) {
      await sincronizarEstadoVehiculo(transaction, vehiculoAnteriorId);
    }

    await transaction.commit();
    return result.rowsAffected[0] > 0;
  } catch (error) {
    if (transaction._aborted !== true) {
      await transaction.rollback();
    }
    throw error;
  }
};

const cambiarEstado = async (id, estado) => {
  const pool = await poolPromise;
  const transaction = new sql.Transaction(pool);

  await transaction.begin();

  try {
    const actual = await new sql.Request(transaction)
      .input('id', sql.Int, id)
      .query(`
        SELECT VehiculoID, Prioridad
        FROM MantenimientosVehiculos
        WHERE MantenimientoID = @id
          AND Eliminado = 0
      `);

    const registro = actual.recordset[0];

    if (!registro) {
      await transaction.rollback();
      return false;
    }

    await validarDuplicadoBloqueante(
      transaction,
      registro.VehiculoID,
      estado,
      registro.Prioridad,
      id
    );

    const fechaInicioSql = estado === 'En Proceso'
      ? ', FechaInicio = ISNULL(FechaInicio, GETDATE())'
      : '';

    const fechaFinalizacionSql = estado === 'Completado'
      ? ', FechaFinalizacion = ISNULL(FechaFinalizacion, GETDATE())'
      : '';

    const result = await new sql.Request(transaction)
      .input('id', sql.Int, id)
      .input('estado', sql.VarChar, estado)
      .query(`
        UPDATE MantenimientosVehiculos
        SET EstadoMantenimiento = @estado,
            FechaActualizacion = GETDATE()
            ${fechaInicioSql}
            ${fechaFinalizacionSql}
        WHERE MantenimientoID = @id
          AND Eliminado = 0
      `);

    await sincronizarEstadoVehiculo(transaction, registro.VehiculoID);
    await transaction.commit();

    return result.rowsAffected[0] > 0;
  } catch (error) {
    if (transaction._aborted !== true) {
      await transaction.rollback();
    }
    throw error;
  }
};

const eliminar = async (id) => {
  const pool = await poolPromise;
  const transaction = new sql.Transaction(pool);

  await transaction.begin();

  try {
    const actual = await new sql.Request(transaction)
      .input('id', sql.Int, id)
      .query(`
        SELECT VehiculoID
        FROM MantenimientosVehiculos
        WHERE MantenimientoID = @id
          AND Eliminado = 0
      `);

    const vehiculoId = actual.recordset[0]?.VehiculoID || null;

    if (!vehiculoId) {
      await transaction.rollback();
      return false;
    }

    const result = await new sql.Request(transaction)
      .input('id', sql.Int, id)
      .query(`
        UPDATE MantenimientosVehiculos
        SET Eliminado = 1,
            FechaActualizacion = GETDATE()
        WHERE MantenimientoID = @id
          AND Eliminado = 0
      `);

    await sincronizarEstadoVehiculo(transaction, vehiculoId);
    await transaction.commit();

    return result.rowsAffected[0] > 0;
  } catch (error) {
    if (transaction._aborted !== true) {
      await transaction.rollback();
    }
    throw error;
  }
};

module.exports = {
  obtenerTodos,
  obtenerPorVehiculo,
  obtenerPorId,
  existeVehiculo,
  crear,
  actualizar,
  cambiarEstado,
  eliminar
};
