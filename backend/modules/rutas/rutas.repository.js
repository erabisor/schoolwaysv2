const { sql, poolPromise } = require('../../config/db');

// Trae las rutas con los datos de su conductor y vehículo asignado
const obtenerTodos = async () => {
  const pool = await poolPromise;
  const result = await pool.request().query(`
    SELECT r.*, u.NombreCompleto AS NombreConductor, v.Placa, v.Capacidad AS CapacidadBus
    FROM Rutas r
    LEFT JOIN Conductores c ON r.ConductorID = c.ConductorID
    LEFT JOIN Usuarios u ON c.UsuarioID = u.UsuarioID
    LEFT JOIN Vehiculos v ON r.VehiculoID = v.VehiculoID
    WHERE r.Eliminado = 0
    ORDER BY r.FechaRegistro DESC
  `);
  return result.recordset;
};

// LÓGICA DE SEGURIDAD: Trae solo conductores vigentes y vehículos activos
const obtenerOpciones = async () => {
  const pool = await poolPromise;
  
  const conductores = await pool.request().query(`
    SELECT c.ConductorID, u.NombreCompleto 
    FROM Conductores c INNER JOIN Usuarios u ON c.UsuarioID = u.UsuarioID 
    WHERE c.Eliminado = 0 AND c.Estado = 1 AND u.Eliminado = 0 
    AND c.VencimientoLicencia >= CAST(GETDATE() AS DATE)
  `);

  const vehiculos = await pool.request().query(`
    SELECT VehiculoID, Placa, Capacidad FROM Vehiculos 
    WHERE Eliminado = 0 AND Estado = 1
  `);

  return { conductores: conductores.recordset, vehiculos: vehiculos.recordset };
};

const crear = async (datos) => {
  const pool = await poolPromise;
  const result = await pool.request()
    .input('nombre', sql.VarChar, datos.NombreRuta)
    .input('desc', sql.VarChar, datos.Descripcion)
    .input('cap', sql.TinyInt, datos.CapacidadMaxima)
    .input('cond', sql.Int, datos.ConductorID)
    .input('veh', sql.Int, datos.VehiculoID)
    .input('turno', sql.VarChar, datos.Turno)
    .query(`
      INSERT INTO Rutas (NombreRuta, Descripcion, CapacidadMaxima, ConductorID, VehiculoID, Turno)
      OUTPUT INSERTED.RutaID
      VALUES (@nombre, @desc, @cap, @cond, @veh, @turno)
    `);
  return result.recordset[0];
};

const actualizar = async (id, datos) => {
  const pool = await poolPromise;
  await pool.request()
    .input('id', sql.Int, id)
    .input('nombre', sql.VarChar, datos.NombreRuta)
    .input('desc', sql.VarChar, datos.Descripcion)
    .input('cap', sql.TinyInt, datos.CapacidadMaxima)
    .input('cond', sql.Int, datos.ConductorID)
    .input('veh', sql.Int, datos.VehiculoID)
    .input('turno', sql.VarChar, datos.Turno)
    .query(`
      UPDATE Rutas SET NombreRuta = @nombre, Descripcion = @desc, CapacidadMaxima = @cap, 
      ConductorID = @cond, VehiculoID = @veh, Turno = @turno WHERE RutaID = @id
    `);
};

const cambiarEstado = async (id, estado) => {
  const pool = await poolPromise;
  await pool.request().input('id', sql.Int, id).input('estado', sql.Bit, estado)
    .query('UPDATE Rutas SET Estado = @estado WHERE RutaID = @id');
};

const eliminar = async (id) => {
  const pool = await poolPromise;
  await pool.request().input('id', sql.Int, id)
    .query('UPDATE Rutas SET Eliminado = 1 WHERE RutaID = @id');
};

module.exports = { obtenerTodos, obtenerOpciones, crear, actualizar, cambiarEstado, eliminar };