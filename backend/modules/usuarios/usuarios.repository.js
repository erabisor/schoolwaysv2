const { sql, poolPromise } = require('../../config/db');

const obtenerTodos = async () => {
  const pool = await poolPromise;
  const result = await pool.request().query(`
    SELECT u.UsuarioID, u.NombreCompleto, u.CorreoElectronico, u.Telefono, u.Estado, u.RolID, r.NombreRol 
    FROM Usuarios u INNER JOIN Roles r ON u.RolID = r.RolID
    WHERE u.Eliminado = 0 
    ORDER BY u.FechaRegistro DESC
  `);
  return result.recordset;
};

const crear = async (usr) => {
  const pool = await poolPromise;
  const result = await pool.request()
    .input('nombre', sql.VarChar, usr.NombreCompleto)
    .input('correo', sql.VarChar, usr.CorreoElectronico)
    .input('hash', sql.VarChar, usr.PasswordHash)
    .input('rol', sql.Int, usr.RolID)
    .input('tel', sql.VarChar, usr.Telefono)
    .query(`
      INSERT INTO Usuarios (NombreCompleto, CorreoElectronico, PasswordHash, RolID, Telefono)
      OUTPUT INSERTED.UsuarioID
      VALUES (@nombre, @correo, @hash, @rol, @tel)
    `);
  return result.recordset[0];
};

const actualizar = async (id, usr) => {
  const pool = await poolPromise;
  let query = `UPDATE Usuarios SET NombreCompleto = @nombre, CorreoElectronico = @correo, RolID = @rol, Telefono = @tel`;
  if (usr.PasswordHash) query += `, PasswordHash = @hash`;
  query += ` WHERE UsuarioID = @id`;

  const req = pool.request()
    .input('id', sql.Int, id)
    .input('nombre', sql.VarChar, usr.NombreCompleto)
    .input('correo', sql.VarChar, usr.CorreoElectronico)
    .input('rol', sql.Int, usr.RolID)
    .input('tel', sql.VarChar, usr.Telefono);

  if (usr.PasswordHash) req.input('hash', sql.VarChar, usr.PasswordHash);

  await req.query(query);
};

const cambiarEstado = async (id, estado) => {
  const pool = await poolPromise;
  await pool.request()
    .input('id', sql.Int, id)
    .input('estado', sql.Bit, estado)
    .query('UPDATE Usuarios SET Estado = @estado WHERE UsuarioID = @id');
};

const eliminar = async (id) => {
  const pool = await poolPromise;
  await pool.request()
    .input('id', sql.Int, id)
    .query('UPDATE Usuarios SET Eliminado = 1 WHERE UsuarioID = @id');
};

module.exports = { obtenerTodos, crear, actualizar, cambiarEstado, eliminar };