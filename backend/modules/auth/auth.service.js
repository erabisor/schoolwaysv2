const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const authRepository = require('./auth.repository');

// Verifica credenciales y genera el token
const login = async (correo, password) => {
  const usuario = await authRepository.getUserByEmail(correo);

  if (!usuario) {
    return { ok: false, data: null, mensaje: 'Credenciales inválidas' };
  }

  // Revisa si la contraseña coincide con el hash
  const passValida = await bcrypt.compare(password, usuario.PasswordHash);
  if (!passValida) {
    return { ok: false, data: null, mensaje: 'Credenciales inválidas' };
  }

  // Arma el token con los datos básicos del usuario
  const token = jwt.sign(
    { id: usuario.UsuarioID, rol: usuario.RolID },
    process.env.JWT_SECRET,
    { expiresIn: '8h' }
  );

  return {
    ok: true,
    data: {
      token,
      usuario: { id: usuario.UsuarioID, nombre: usuario.NombreCompleto, rol: usuario.RolID }
    },
    mensaje: 'Login exitoso'
  };
};

module.exports = { login };