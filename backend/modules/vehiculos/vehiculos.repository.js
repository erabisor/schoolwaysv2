const { sql, poolPromise } = require('../../config/db');

// Trae todos los vehículos activos en el sistema
const obtenerTodos = async () => {
  const pool = await poolPromise;
  const result = await pool.request().query(`
    SELECT * FROM Vehiculos WHERE Eliminado = 0 ORDER BY FechaRegistro DESC
  `);
  return result.recordset;
};

// Guarda un vehículo validando parámetros
const crear = async (vehiculo) => {
  const pool = await poolPromise;
  const result = await pool.request()
    .input('placa', sql.VarChar, vehiculo.Placa)
    .input('marca', sql.VarChar, vehiculo.Marca)
    .input('modelo', sql.VarChar, vehiculo.Modelo)
    .input('anio', sql.SmallInt, vehiculo.Anio)
    .input('capacidad', sql.TinyInt, vehiculo.Capacidad)
    .input('color', sql.VarChar, vehiculo.Color)
    .query(`
      INSERT INTO Vehiculos (Placa, Marca, Modelo, Anio, Capacidad, Color)
      OUTPUT INSERTED.VehiculoID
      VALUES (@placa, @marca, @modelo, @anio, @capacidad, @color)
    `);
  return result.recordset[0];
};

// Sobrescribe los datos del bus
const actualizar = async (id, vehiculo) => {
  const pool = await poolPromise;
  await pool.request()
    .input('id', sql.Int, id)
    .input('placa', sql.VarChar, vehiculo.Placa)
    .input('marca', sql.VarChar, vehiculo.Marca)
    .input('modelo', sql.VarChar, vehiculo.Modelo)
    .input('anio', sql.SmallInt, vehiculo.Anio)
    .input('capacidad', sql.TinyInt, vehiculo.Capacidad)
    .input('color', sql.VarChar, vehiculo.Color)
    .query(`
      UPDATE Vehiculos 
      SET Placa = @placa, Marca = @marca, Modelo = @modelo, 
          Anio = @anio, Capacidad = @capacidad, Color = @color 
      WHERE VehiculoID = @id
    `);
};

// Cambia entre estado en ruta (1) o en taller/inactivo (0)
const cambiarEstado = async (id, estado) => {
  const pool = await poolPromise;
  await pool.request().input('id', sql.Int, id).input('estado', sql.Bit, estado)
    .query('UPDATE Vehiculos SET Estado = @estado WHERE VehiculoID = @id');
};

// Oculta el vehículo permanentemente de la vista
const eliminar = async (id) => {
  const pool = await poolPromise;
  await pool.request().input('id', sql.Int, id)
    .query('UPDATE Vehiculos SET Eliminado = 1 WHERE VehiculoID = @id');
};

module.exports = { obtenerTodos, crear, actualizar, cambiarEstado, eliminar };