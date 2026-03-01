// Verifica si el rol del usuario en sesión está dentro de los permitidos
const verificarRol = (rolesPermitidos) => {
  return (req, res, next) => {
    if (!req.usuario) return res.status(500).json({ ok: false, data: null, mensaje: 'Token no validado' });
    
    // Si el rol no hace match, bloquea la acción
    if (!rolesPermitidos.includes(req.usuario.rol)) {
      return res.status(403).json({ ok: false, data: null, mensaje: 'Permisos insuficientes' });
    }
    next();
  };
};

module.exports = { verificarRol };