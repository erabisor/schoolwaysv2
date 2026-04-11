const { ROL } = require('../constants');

/**
 * Verifica que un conductor solo pueda operar con su propio conductorId.
 * Admin puede operar con cualquiera.
 * Si el token no tiene conductorId (admin), pasa sin validar.
 */
const verificarPropietario = (req, res, next) => {
  // Protección: si el token no fue validado aún, cortamos aquí
  if (!req.usuario) {
    return res.status(401).json({ ok: false, data: null, mensaje: 'Token no validado' });
  }

  const { rol, conductorId: conductorIdToken } = req.usuario;

  // Admin puede hacer todo sin restricción
  if (rol === ROL.ADMIN) return next();

  // Si el token no tiene conductorId (no es conductor), dejamos pasar
  // El verificarRol ya habrá bloqueado si el rol no corresponde
  if (!conductorIdToken) return next();

  // El conductorId que viene en el request (body o params)
  const conductorIdRequest = parseInt(
    req.body?.conductorId || req.params?.conductorId,
    10
  );

  // Si el endpoint no requiere conductorId, dejamos pasar
  if (!conductorIdRequest) return next();

  // Verificar que el conductor solo opere con su propio ID
  if (conductorIdToken !== conductorIdRequest) {
    return res.status(403).json({
      ok: false,
      data: null,
      mensaje: 'No tienes permiso para operar sobre este recurso.'
    });
  }

  next();
};

module.exports = { verificarPropietario };