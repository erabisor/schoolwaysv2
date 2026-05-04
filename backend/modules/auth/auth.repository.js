const { sql, poolPromise } = require('../../config/db');

const getUserByEmail = async (correo) => {
  const pool = await poolPromise;

  const result = await pool.request()
    .input('correo', sql.VarChar, correo)
    .query(`
      SELECT
        UsuarioID,
        NombreCompleto,
        CorreoElectronico,
        RolID,
        PasswordHash,
        Estado
      FROM Usuarios
      WHERE CorreoElectronico = @correo
        AND Estado = 1
        AND Eliminado = 0
    `);

  return result.recordset[0];
};

const getDriverData = async (usuarioId) => {
  const pool = await poolPromise;

  const result = await pool.request()
    .input('uId', sql.Int, usuarioId)
    .query(`
      SELECT TOP 1
        c.ConductorID,
        r.RutaID,
        r.NombreRuta
      FROM Conductores c
      LEFT JOIN Rutas r ON c.ConductorID = r.ConductorID
        AND r.Eliminado = 0
        AND r.Estado = 1
      WHERE c.UsuarioID = @uId
        AND c.Eliminado = 0
        AND c.Estado = 1
      ORDER BY r.FechaRegistro DESC
    `);

  return result.recordset[0];
};

module.exports = { getUserByEmail, getDriverData };