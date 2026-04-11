const rateLimit = require('express-rate-limit');

// Limita los intentos de login: máx 10 por IP cada 15 minutos
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    ok: false,
    data: null,
    mensaje: 'Demasiados intentos de inicio de sesión. Espera 15 minutos antes de volver a intentarlo.'
  }
});

// Limiter general para la API: máx 300 req por IP cada 15 minutos
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    ok: false,
    data: null,
    mensaje: 'Demasiadas peticiones desde esta IP. Intenta más tarde.'
  }
});

module.exports = { loginLimiter, apiLimiter };
