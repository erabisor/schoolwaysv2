const { sql, poolPromise } = require('../../config/db');

// Busca un usuario por su correo electrónico
const getUserByEmail = async (correo) => {
  const pool = await poolPromise;
  const result = await pool.request()
    .input('correo', sql.VarChar, correo)
    .query('SELECT * FROM Usuarios WHERE CorreoElectronico = @correo AND Estado = 1');
    
  return result.recordset[0];
};

module.exports = { getUserByEmail };