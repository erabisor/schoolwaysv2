const rateLimit = require('express-rate-limit');

const getEnvNumber = (key, fallback) => {
  const value = Number(process.env[key]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
};

const createMessage = (mensaje) => ({
  ok: false,
  data: null,
  mensaje
});

const loginLimiter = rateLimit({
  windowMs: getEnvNumber('LOGIN_RATE_LIMIT_WINDOW_MS', 15 * 60 * 1000),
  max: getEnvNumber('LOGIN_RATE_LIMIT_MAX', 10),
  standardHeaders: true,
  legacyHeaders: false,
  message: createMessage(
    'Demasiados intentos de inicio de sesión. Espera antes de volver a intentarlo.'
  )
});

const trackingLimiter = rateLimit({
  windowMs: getEnvNumber('TRACKING_RATE_LIMIT_WINDOW_MS', 60 * 1000),
  max: getEnvNumber('TRACKING_RATE_LIMIT_MAX', 240),
  standardHeaders: true,
  legacyHeaders: false,
  message: createMessage(
    'Seguimiento pausado temporalmente por demasiadas actualizaciones.'
  )
});

const apiLimiter = rateLimit({
  windowMs: getEnvNumber('API_RATE_LIMIT_WINDOW_MS', 15 * 60 * 1000),
  max: getEnvNumber('API_RATE_LIMIT_MAX', 300),
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path.startsWith('/asistencias/ubicacion'),
  message: createMessage(
    'Demasiadas peticiones desde esta IP. Intenta más tarde.'
  )
});

module.exports = { loginLimiter, apiLimiter, trackingLimiter };