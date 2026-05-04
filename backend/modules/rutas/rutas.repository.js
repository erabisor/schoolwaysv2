const { sql, poolPromise } = require('../../config/db');

const crearError = (mensaje, status = 400) => {
  const error = new Error(mensaje);
  error.status = status;
  return error;
};

const normalizarTexto = (valor) => {
  if (valor === undefined || valor === null || valor === '') return null;
  return String(valor).trim();
};

const normalizarEntero = (valor) => {
  if (valor === undefined || valor === null || valor === '') return null;

  const numero = Number(valor);
  return Number.isInteger(numero) ? numero : null;
};

const obtenerTodos = async () => {
  const pool = await poolPromise;

  const result = await pool.request().query(`
    SELECT
      r.RutaID,
      r.NombreRuta,
      r.Descripcion,
      r.CapacidadMaxima,
      r.ConductorID,
      r.VehiculoID,
      r.Turno,
      r.Estado,
      r.Eliminado,
      r.FechaRegistro,
      u.NombreCompleto AS NombreConductor,
      v.Placa,
      v.Capacidad AS CapacidadBus,
      v.Estado AS EstadoVehiculo,
      bloqueo.MantenimientoID,
      bloqueo.EstadoMantenimiento,
      bloqueo.Prioridad AS PrioridadMantenimiento,
      CASE
        WHEN bloqueo.MantenimientoID IS NOT NULL THEN CAST(1 AS BIT)
        ELSE CAST(0 AS BIT)
      END AS VehiculoEnMantenimiento
    FROM Rutas r
    LEFT JOIN Conductores c ON r.ConductorID = c.ConductorID
    LEFT JOIN Usuarios u ON c.UsuarioID = u.UsuarioID
    LEFT JOIN Vehiculos v ON r.VehiculoID = v.VehiculoID
    OUTER APPLY (
      SELECT TOP 1
        m.MantenimientoID,
        m.EstadoMantenimiento,
        m.Prioridad,
        m.FechaRegistro
      FROM MantenimientosVehiculos m
      WHERE m.VehiculoID = v.VehiculoID
        AND m.Eliminado = 0
        AND (
          m.EstadoMantenimiento = 'En Proceso'
          OR (
            m.Prioridad = 'Crítica'
            AND m.EstadoMantenimiento IN ('Programado', 'En Proceso')
          )
        )
      ORDER BY
        CASE WHEN m.EstadoMantenimiento = 'En Proceso' THEN 0 ELSE 1 END,
        m.FechaRegistro DESC
    ) bloqueo
    WHERE r.Eliminado = 0
    ORDER BY r.FechaRegistro DESC
  `);

  return result.recordset;
};

const obtenerOpciones = async () => {
  const pool = await poolPromise;

  const conductores = await pool.request().query(`
    SELECT
      c.ConductorID,
      u.NombreCompleto,
      c.NumeroLicencia,
      c.VencimientoLicencia
    FROM Conductores c
    INNER JOIN Usuarios u ON c.UsuarioID = u.UsuarioID
    WHERE c.Eliminado = 0
      AND c.Estado = 1
      AND u.Eliminado = 0
      AND u.Estado = 1
      AND c.VencimientoLicencia >= CAST(GETDATE() AS DATE)
    ORDER BY u.NombreCompleto ASC
  `);

  const vehiculos = await pool.request().query(`
    SELECT
      v.VehiculoID,
      v.Placa,
      v.Capacidad,
      v.Marca,
      v.Modelo,
      v.Estado,
      bloqueo.MantenimientoID,
      bloqueo.EstadoMantenimiento,
      bloqueo.Prioridad AS PrioridadMantenimiento,
      CASE
        WHEN bloqueo.MantenimientoID IS NOT NULL THEN CAST(1 AS BIT)
        ELSE CAST(0 AS BIT)
      END AS VehiculoEnMantenimiento
    FROM Vehiculos v
    OUTER APPLY (
      SELECT TOP 1
        m.MantenimientoID,
        m.EstadoMantenimiento,
        m.Prioridad,
        m.FechaRegistro
      FROM MantenimientosVehiculos m
      WHERE m.VehiculoID = v.VehiculoID
        AND m.Eliminado = 0
        AND (
          m.EstadoMantenimiento = 'En Proceso'
          OR (
            m.Prioridad = 'Crítica'
            AND m.EstadoMantenimiento IN ('Programado', 'En Proceso')
          )
        )
      ORDER BY
        CASE WHEN m.EstadoMantenimiento = 'En Proceso' THEN 0 ELSE 1 END,
        m.FechaRegistro DESC
    ) bloqueo
    WHERE v.Eliminado = 0
      AND v.Estado = 1
      AND bloqueo.MantenimientoID IS NULL
    ORDER BY v.Placa ASC
  `);

  return {
    conductores: conductores.recordset,
    vehiculos: vehiculos.recordset
  };
};

const validarConductorActivo = async (transaction, conductorId) => {
  if (!conductorId) return;

  const result = await new sql.Request(transaction)
    .input('conductorId', sql.Int, conductorId)
    .query(`
      SELECT c.ConductorID
      FROM Conductores c
      INNER JOIN Usuarios u ON c.UsuarioID = u.UsuarioID
      WHERE c.ConductorID = @conductorId
        AND c.Eliminado = 0
        AND c.Estado = 1
        AND c.VencimientoLicencia >= CAST(GETDATE() AS DATE)
        AND u.Eliminado = 0
        AND u.Estado = 1
    `);

  if (result.recordset.length === 0) {
    throw crearError('El conductor seleccionado no está activo o su licencia no está vigente.');
  }
};

const obtenerVehiculoDisponible = async (transaction, vehiculoId) => {
  if (!vehiculoId) return null;

  const result = await new sql.Request(transaction)
    .input('vehiculoId', sql.Int, vehiculoId)
    .query(`
      SELECT TOP 1
        v.VehiculoID,
        v.Placa,
        v.Capacidad,
        v.Estado,
        bloqueo.MantenimientoID,
        bloqueo.EstadoMantenimiento,
        bloqueo.Prioridad
      FROM Vehiculos v
      OUTER APPLY (
        SELECT TOP 1
          m.MantenimientoID,
          m.EstadoMantenimiento,
          m.Prioridad,
          m.FechaRegistro
        FROM MantenimientosVehiculos m
        WHERE m.VehiculoID = v.VehiculoID
          AND m.Eliminado = 0
          AND (
            m.EstadoMantenimiento = 'En Proceso'
            OR (
              m.Prioridad = 'Crítica'
              AND m.EstadoMantenimiento IN ('Programado', 'En Proceso')
            )
          )
        ORDER BY
          CASE WHEN m.EstadoMantenimiento = 'En Proceso' THEN 0 ELSE 1 END,
          m.FechaRegistro DESC
      ) bloqueo
      WHERE v.VehiculoID = @vehiculoId
        AND v.Eliminado = 0
    `);

  const vehiculo = result.recordset[0];

  if (!vehiculo) {
    throw crearError('El vehículo seleccionado no existe o fue eliminado.');
  }

  if (vehiculo.Estado === false || vehiculo.Estado === 0) {
    throw crearError(`El vehículo ${vehiculo.Placa || ''} está fuera de servicio.`);
  }

  if (vehiculo.MantenimientoID) {
    if (vehiculo.EstadoMantenimiento === 'En Proceso') {
      throw crearError(`El vehículo ${vehiculo.Placa || ''} está en mantenimiento.`);
    }

    if (
      vehiculo.Prioridad === 'Crítica' &&
      ['Programado', 'En Proceso'].includes(vehiculo.EstadoMantenimiento)
    ) {
      throw crearError(`El vehículo ${vehiculo.Placa || ''} tiene mantenimiento crítico pendiente.`);
    }
  }

  return vehiculo;
};

const validarCapacidadVehiculo = (capacidadMaxima, vehiculo) => {
  if (!vehiculo) return;

  if (Number(capacidadMaxima) > Number(vehiculo.Capacidad)) {
    throw crearError(
      `La ruta solicita ${capacidadMaxima} cupos, pero el vehículo ${vehiculo.Placa} solo tiene ${vehiculo.Capacidad} asientos.`
    );
  }
};

const liberarConductorEnOtrasRutas = async (request, conductorId, rutaIdExcluir = null) => {
  if (!conductorId) return;

  let query = `
    UPDATE Rutas
    SET ConductorID = NULL
    WHERE ConductorID = @conductorId
      AND Eliminado = 0
      AND Estado = 1
  `;

  request.input('conductorId', sql.Int, conductorId);

  if (rutaIdExcluir) {
    query += ' AND RutaID <> @rutaIdExcluir';
    request.input('rutaIdExcluir', sql.Int, rutaIdExcluir);
  }

  await request.query(query);
};

const crear = async (datos) => {
  const pool = await poolPromise;
  const transaction = new sql.Transaction(pool);

  await transaction.begin();

  try {
    const conductorId = normalizarEntero(datos.ConductorID);
    const vehiculoId = normalizarEntero(datos.VehiculoID);
    const capacidadMaxima = normalizarEntero(datos.CapacidadMaxima);

    await validarConductorActivo(transaction, conductorId);
    const vehiculo = await obtenerVehiculoDisponible(transaction, vehiculoId);
    validarCapacidadVehiculo(capacidadMaxima, vehiculo);

    if (conductorId) {
      await liberarConductorEnOtrasRutas(new sql.Request(transaction), conductorId);
    }

    const result = await new sql.Request(transaction)
      .input('nombre', sql.VarChar, normalizarTexto(datos.NombreRuta))
      .input('desc', sql.VarChar, normalizarTexto(datos.Descripcion))
      .input('cap', sql.Int, capacidadMaxima)
      .input('cond', sql.Int, conductorId)
      .input('veh', sql.Int, vehiculoId)
      .input('turno', sql.VarChar, normalizarTexto(datos.Turno) || 'Mañana')
      .query(`
        INSERT INTO Rutas
          (NombreRuta, Descripcion, CapacidadMaxima, ConductorID, VehiculoID, Turno)
        OUTPUT INSERTED.RutaID
        VALUES
          (@nombre, @desc, @cap, @cond, @veh, @turno)
      `);

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
    const rutaId = normalizarEntero(id);
    const conductorId = normalizarEntero(datos.ConductorID);
    const vehiculoId = normalizarEntero(datos.VehiculoID);
    const capacidadMaxima = normalizarEntero(datos.CapacidadMaxima);

    await validarConductorActivo(transaction, conductorId);
    const vehiculo = await obtenerVehiculoDisponible(transaction, vehiculoId);
    validarCapacidadVehiculo(capacidadMaxima, vehiculo);

    if (conductorId) {
      await liberarConductorEnOtrasRutas(new sql.Request(transaction), conductorId, rutaId);
    }

    const result = await new sql.Request(transaction)
      .input('id', sql.Int, rutaId)
      .input('nombre', sql.VarChar, normalizarTexto(datos.NombreRuta))
      .input('desc', sql.VarChar, normalizarTexto(datos.Descripcion))
      .input('cap', sql.Int, capacidadMaxima)
      .input('cond', sql.Int, conductorId)
      .input('veh', sql.Int, vehiculoId)
      .input('turno', sql.VarChar, normalizarTexto(datos.Turno) || 'Mañana')
      .query(`
        UPDATE Rutas
        SET NombreRuta = @nombre,
            Descripcion = @desc,
            CapacidadMaxima = @cap,
            ConductorID = @cond,
            VehiculoID = @veh,
            Turno = @turno
        WHERE RutaID = @id
          AND Eliminado = 0
      `);

    await transaction.commit();
    return result.rowsAffected[0] > 0;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

const cambiarEstado = async (id, estado) => {
  const pool = await poolPromise;

  const result = await pool.request()
    .input('id', sql.Int, id)
    .input('estado', sql.Bit, estado)
    .query(`
      UPDATE Rutas
      SET Estado = @estado
      WHERE RutaID = @id
        AND Eliminado = 0
    `);

  return result.rowsAffected[0] > 0;
};

const eliminar = async (id) => {
  const pool = await poolPromise;

  const result = await pool.request()
    .input('id', sql.Int, id)
    .query(`
      UPDATE Rutas
      SET Eliminado = 1,
          Estado = 0
      WHERE RutaID = @id
    `);

  return result.rowsAffected[0] > 0;
};

module.exports = {
  obtenerTodos,
  obtenerOpciones,
  crear,
  actualizar,
  cambiarEstado,
  eliminar
};
