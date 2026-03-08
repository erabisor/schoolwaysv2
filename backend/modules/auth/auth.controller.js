const authService = require('./auth.service');
const jwt = require('jsonwebtoken');
const sql = require('mssql');
const bcryptjs = require('bcryptjs'); // Importación exacta de bcryptjs
const { poolPromise } = require('../../config/db');
const { enviarCorreoRecuperacion } = require('../../utils/email.service');

// Recibe la petición, llama al servicio y responde al cliente
const login = async (req, res) => {
  try {
    const { correo, password } = req.body;

    if (!correo || !password) {
      return res.status(400).json({ ok: false, data: null, mensaje: 'Faltan datos' });
    }

    const resultado = await authService.login(correo, password);

    if (!resultado.ok) {
      return res.status(401).json(resultado);
    }

    return res.status(200).json(resultado);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ ok: false, data: null, mensaje: 'Error en el servidor' });
  }
};

// Solicitar recuperación de contraseña
const olvidePassword = async (req, res) => {
  try {
    const { correo } = req.body;

    if (!correo) {
      return res.status(400).json({ ok: false, data: null, mensaje: 'El correo electrónico es requerido' });
    }

    const pool = await poolPromise;
    
    // Lectura de tabla usuarios para verificar si el correo existe y obtener su UsuarioID
    const result = await pool.request()
      .input('correo', sql.VarChar, correo)
      .query('SELECT UsuarioID, CorreoElectronico FROM Usuarios WHERE CorreoElectronico = @correo');

    if (result.recordset.length === 0) {
      return res.status(200).json({ 
        ok: true, 
        data: null, 
        mensaje: 'Si el correo existe en nuestro sistema, recibirás un enlace de recuperación pronto.' 
      });
    }

    const usuario = result.recordset[0];

    // Usamos UsuarioID para el token
    const resetToken = jwt.sign(
      { UsuarioID: usuario.UsuarioID },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    // Usamos CorreoElectronico para saber a dónde mandarlo
    await enviarCorreoRecuperacion(usuario.CorreoElectronico, resetToken);

    return res.status(200).json({ 
      ok: true, 
      data: null, 
      mensaje: 'Si el correo existe en nuestro sistema, recibirás un enlace de recuperación pronto.' 
    });

  } catch (error) {
    console.error('Error en olvidePassword:', error);
    return res.status(500).json({ ok: false, data: null, mensaje: 'Error en el servidor al procesar la solicitud' });
  }
};

// Restablecer la contraseña usando el Token
const resetPassword = async (req, res) => {
  try {
    const { token, nuevaPassword } = req.body;

    if (!token || !nuevaPassword) {
      return res.status(400).json({ ok: false, data: null, mensaje: 'El token y la nueva contraseña son requeridos' });
    }

    // 1. Verificar la validez del Token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ 
        ok: false, 
        data: null, 
        mensaje: 'El enlace de recuperación es inválido o ha expirado. Por favor, solicita uno nuevo.' 
      });
    }

    const usuarioID = decoded.UsuarioID;

    // 2. Encriptar la nueva contraseña con bcryptjs
    const salt = await bcryptjs.genSalt(10);
    const passwordHashEncriptada = await bcryptjs.hash(nuevaPassword, salt);

    const pool = await poolPromise;
    
    // 3. Actualizar la contraseña en la base de datos
    const result = await pool.request()
      .input('PasswordHash', sql.VarChar, passwordHashEncriptada)
      .input('UsuarioID', sql.Int, usuarioID)
      .query('UPDATE Usuarios SET PasswordHash = @PasswordHash WHERE UsuarioID = @UsuarioID');

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ ok: false, data: null, mensaje: 'Usuario no encontrado en el sistema.' });
    }

    return res.status(200).json({ 
      ok: true, 
      data: null, 
      mensaje: 'Tu contraseña ha sido actualizada exitosamente. Ya puedes iniciar sesión.' 
    });

  } catch (error) {
    console.error('Error en resetPassword:', error);
    return res.status(500).json({ ok: false, data: null, mensaje: 'Error en el servidor al procesar la solicitud' });
  }
};

// Exportamos todas las funciones
module.exports = { login, olvidePassword, resetPassword };