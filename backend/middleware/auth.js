const jwt = require('jsonwebtoken');

// Verifica que la petición traiga un token válido en el header
const verificarToken = (req, res, next) => {
  const header = req.header('Authorization');
  if (!header) return res.status(401).json({ ok: false, data: null, mensaje: 'Acceso denegado. Token ausente.' });

  const token = header.split(' ')[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario = payload; // Guarda los datos decodificados para la siguiente capa
    next();
  } catch (error) {
    return res.status(401).json({ ok: false, data: null, mensaje: 'Token inválido o expirado' });
  }
};

module.exports = { verificarToken };