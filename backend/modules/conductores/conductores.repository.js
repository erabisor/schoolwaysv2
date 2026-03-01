const { sql, poolPromise } = require('../../config/db');

// Trae los conductores activos, asegurándose de que su Usuario base NO esté eliminado
const obtenerTodos = async () => {
  const pool = await poolPromise;
  const result = await pool.request().query(`
    SELECT c.ConductorID, c.UsuarioID, c.NumeroLicencia, c.VencimientoLicencia, c.Estado,
           u.NombreCompleto, u.Telefono, u.CorreoElectronico
    FROM Conductores c
    INNER JOIN Usuarios u ON c.UsuarioID = u.UsuarioID
    WHERE c.Eliminado = 0 AND u.Eliminado = 0 -- FILTRO CORREGIDO
    ORDER BY c.FechaRegistro DESC
  `);
  return result.recordset;
};

// Trae usuarios con RolID = 2 (Conductor) que aún NO están en la tabla Conductores
const obtenerUsuariosDisponibles = async () => {
  const pool = await poolPromise;
  const result = await pool.request().query(`
    SELECT UsuarioID, NombreCompleto 
    FROM Usuarios 
    WHERE RolID = 2 AND Eliminado = 0 
    AND UsuarioID NOT IN (SELECT UsuarioID FROM Conductores WHERE Eliminado = 0)
  `);
  return result.recordset;
};

const crear = async (datos) => {
  const pool = await poolPromise;
  const result = await pool.request()
    .input('usuarioId', sql.Int, datos.UsuarioID)
    .input('licencia', sql.VarChar, datos.NumeroLicencia)
    .input('vencimiento', sql.Date, datos.VencimientoLicencia)
    .query(`
      INSERT INTO Conductores (UsuarioID, NumeroLicencia, VencimientoLicencia)
      OUTPUT INSERTED.ConductorID
      VALUES (@usuarioId, @licencia, @vencimiento)
    `);
  return result.recordset[0];
};

const actualizar = async (id, datos) => {
  const pool = await poolPromise;
  await pool.request()
    .input('id', sql.Int, id)
    .input('licencia', sql.VarChar, datos.NumeroLicencia)
    .input('vencimiento', sql.Date, datos.VencimientoLicencia)
    .query(`
      UPDATE Conductores 
      SET NumeroLicencia = @licencia, VencimientoLicencia = @vencimiento 
      WHERE ConductorID = @id
    `);
};

const cambiarEstado = async (id, estado) => {
  const pool = await poolPromise;
  await pool.request().input('id', sql.Int, id).input('estado', sql.Bit, estado)
    .query('UPDATE Conductores SET Estado = @estado WHERE ConductorID = @id');
};

// Oculta al conductor y lo desvincula automáticamente de cualquier ruta
const eliminar = async (id) => {
  const pool = await poolPromise;
  
  // 1. Cascada: Si tenía rutas asignadas, las dejamos "Sin Conductor" (NULL)
  await pool.request()
    .input('id', sql.Int, id)
    .query('UPDATE Rutas SET ConductorID = NULL WHERE ConductorID = @id');

  // 2. Borrado lógico del conductor
  await pool.request()
    .input('id', sql.Int, id)
    .query('UPDATE Conductores SET Eliminado = 1 WHERE ConductorID = @id');
};

module.exports = { obtenerTodos, obtenerUsuariosDisponibles, crear, actualizar, cambiarEstado, eliminar };