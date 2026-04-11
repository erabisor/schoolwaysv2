const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const authRepository = require('./auth.repository');

// Verifica credenciales y genera el token con todos los datos necesarios
const login = async (correo, password) => {
  const usuario = await authRepository.getUserByEmail(correo);
  if (!usuario) return { ok: false, data: null, mensaje: 'Credenciales inválidas' };

  const passValida = await bcrypt.compare(password, usuario.PasswordHash);
  if (!passValida) return { ok: false, data: null, mensaje: 'Credenciales inválidas' };

  // Datos base que van en el token y en la respuesta
  const datosUsuario = {
    id: usuario.UsuarioID,
    nombre: usuario.NombreCompleto,
    rol: usuario.RolID
  };

  // Si es conductor, anexamos su ConductorID y RutaID al token
  if (usuario.RolID === 2) {
    const driverData = await authRepository.getDriverData(usuario.UsuarioID);
    if (driverData) {
      datosUsuario.conductorId = driverData.ConductorID;
      datosUsuario.rutaId = driverData.RutaID;
      datosUsuario.nombreRuta = driverData.NombreRuta;
    }
  }

  // El token lleva los mismos datos para que los middlewares los tengan disponibles
  const token = jwt.sign(
    datosUsuario,
    process.env.JWT_SECRET,
    { expiresIn: '8h' }
  );

  return {
    ok: true,
    data: { token, usuario: datosUsuario },
    mensaje: 'Login exitoso'
  };
};

module.exports = { login };