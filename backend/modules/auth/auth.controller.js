const authService = require('./auth.service');
const jwt = require('jsonwebtoken');
const sql = require('mssql');
const bcryptjs = require('bcryptjs');
const { poolPromise } = require('../../config/db');
const { enviarCorreoRecuperacion } = require('../../utils/email.service');

// Recibe credenciales, llama al service y responde
const login = async (req, res) => {
  try {
    const { correo, password } = req.body;
    if (!correo || !password) {
      return res.status(400).json({ ok: false, data: null, mensaje: 'Faltan datos' });
    }
    const resultado = await authService.login(correo, password);
    if (!resultado.ok) return res.status(401).json(resultado);
    return res.status(200).json(resultado);
  } catch (error) {
    console.error('Error en login:', error);
    return res.status(500).json({ ok: false, data: null, mensaje: 'Error en el servidor' });
  }
};

// Genera token y manda el correo de recuperación
const olvidePassword = async (req, res) => {
  try {
    const { correo } = req.body;
    if (!correo) {
      return res.status(400).json({ ok: false, data: null, mensaje: 'El correo es requerido' });
    }

    const pool = await poolPromise;
    const result = await pool.request()
      .input('correo', sql.VarChar, correo)
      .query('SELECT UsuarioID, CorreoElectronico FROM Usuarios WHERE CorreoElectronico = @correo AND Eliminado = 0');

    // Siempre respondemos igual para no revelar si el correo existe
    const respuestaGenerica = {
      ok: true,
      data: null,
      mensaje: 'Si el correo existe en nuestro sistema, recibirás un enlace de recuperación pronto.'
    };

    if (result.recordset.length === 0) return res.status(200).json(respuestaGenerica);

    const usuario = result.recordset[0];
    const resetToken = jwt.sign(
      { UsuarioID: usuario.UsuarioID },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    await enviarCorreoRecuperacion(usuario.CorreoElectronico, resetToken);
    return res.status(200).json(respuestaGenerica);

  } catch (error) {
    console.error('Error en olvidePassword:', error);
    return res.status(500).json({ ok: false, data: null, mensaje: 'Error al procesar la solicitud' });
  }
};

// Valida el token, verifica historial y actualiza la contraseña
const resetPassword = async (req, res) => {
  try {
    const { token, nuevaPassword } = req.body;
    if (!token || !nuevaPassword) {
      return res.status(400).json({ ok: false, data: null, mensaje: 'Token y nueva contraseña son requeridos' });
    }

    // 1. Verificar que el token sea válido y no haya expirado
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({
        ok: false,
        data: null,
        mensaje: 'El enlace de recuperación es inválido o ha expirado. Solicita uno nuevo.'
      });
    }

    const usuarioID = decoded.UsuarioID;
    const pool = await poolPromise;

    // 2. Verificar que la nueva contraseña no sea igual a las últimas 3
    const historial = await pool.request()
      .input('uId', sql.Int, usuarioID)
      .query(`
        SELECT TOP 3 PasswordHash 
        FROM HistorialContrasenas 
        WHERE UsuarioID = @uId 
        ORDER BY FechaCambio DESC
      `);

    for (const registro of historial.recordset) {
      const esIgual = await bcryptjs.compare(nuevaPassword, registro.PasswordHash);
      if (esIgual) {
        return res.status(400).json({
          ok: false,
          data: null,
          mensaje: 'No puedes usar una de tus últimas 3 contraseñas. Elige una diferente.'
        });
      }
    }

    // 3. Encriptar y guardar la nueva contraseña
    const salt = await bcryptjs.genSalt(10);
    const nuevoHash = await bcryptjs.hash(nuevaPassword, salt);

    await pool.request()
      .input('hash', sql.VarChar, nuevoHash)
      .input('uId', sql.Int, usuarioID)
      .query('UPDATE Usuarios SET PasswordHash = @hash WHERE UsuarioID = @uId');

    // 4. Guardar en el historial para futuras validaciones
    await pool.request()
      .input('uId', sql.Int, usuarioID)
      .input('hash', sql.VarChar, nuevoHash)
      .query('INSERT INTO HistorialContrasenas (UsuarioID, PasswordHash) VALUES (@uId, @hash)');

    return res.status(200).json({
      ok: true,
      data: null,
      mensaje: 'Tu contraseña fue actualizada exitosamente. Ya puedes iniciar sesión.'
    });

  } catch (error) {
    console.error('Error en resetPassword:', error);
    return res.status(500).json({ ok: false, data: null, mensaje: 'Error al procesar la solicitud' });
  }
};

module.exports = { login, olvidePassword, resetPassword };