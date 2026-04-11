const { sql, poolPromise } = require('../../config/db');

// Busca un usuario por su correo electrónico
const getUserByEmail = async (correo) => {
  const pool = await poolPromise;
  const result = await pool.request()
    .input('correo', sql.VarChar, correo)
    .query(`
      SELECT UsuarioID, NombreCompleto, CorreoElectronico, RolID, PasswordHash, Estado
      FROM Usuarios
      WHERE CorreoElectronico = @correo AND Estado = 1 AND Eliminado = 0
    `);
    
  return result.recordset[0];
};

// Busca el ID de conductor y su ruta asignada
const getDriverData = async (usuarioId) => {
  const pool = await poolPromise;
  const result = await pool.request()
    .input('uId', require('mssql').Int, usuarioId)
    .query(`
      SELECT c.ConductorID, r.RutaID, r.NombreRuta
      FROM Conductores c
      LEFT JOIN Rutas r ON c.ConductorID = r.ConductorID
      WHERE c.UsuarioID = @uId AND c.Eliminado = 0
    `);
  return result.recordset[0];
};

module.exports = { getUserByEmail, getDriverData };