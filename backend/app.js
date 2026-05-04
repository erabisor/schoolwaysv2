const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { apiLimiter, trackingLimiter } = require('./middleware/rateLimit');

const authRoutes = require('./modules/auth/auth.routes');
const vehiculosRoutes = require('./modules/vehiculos/vehiculos.routes');
const conductoresRoutes = require('./modules/conductores/conductores.routes');
const rutasRoutes = require('./modules/rutas/rutas.routes');
const alumnosRoutes = require('./modules/alumnos/alumnos.routes');
const asistenciasRoutes = require('./modules/asistencias/asistencias.routes');
const usuariosRoutes = require('./modules/usuarios/usuarios.routes');
const viajesRoutes = require('./modules/viajes/viajes.routes');
const dashboardRoutes = require('./modules/dashboard/dashboard.routes');
const padresRoutes = require('./modules/padres/padres.routes');
const mantenimientosRoutes = require('./modules/mantenimientos/mantenimientos.routes');


const app = express();

const origenesPermitidos = [
  'https://www.schoolwaysv.online',
  'https://schoolwaysv.online',
  'http://localhost:3000',
  'http://127.0.0.1:3000'
];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);

    if (origenesPermitidos.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error(`CORS bloqueado para: ${origin}`));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Authorization'],
  credentials: true,
  optionsSuccessStatus: 204,
  maxAge: 86400
};

app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

app.use((req, res, next) => {
  const origin = req.headers.origin;

  if (origin && origenesPermitidos.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Requested-With');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Max-Age', '86400');

  if (req.method === 'OPTIONS') return res.sendStatus(204);

  next();
});

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/api/asistencias/ubicacion', trackingLimiter);
app.use('/api', apiLimiter);

app.get('/api/health', (_req, res) =>
  res.status(200).json({ ok: true, mensaje: 'Servidor activo' })
);

app.use('/api/auth', authRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/vehiculos', vehiculosRoutes);
app.use('/api/conductores', conductoresRoutes);
app.use('/api/rutas', rutasRoutes);
app.use('/api/alumnos', alumnosRoutes);
app.use('/api/asistencias', asistenciasRoutes);
app.use('/api/viajes', viajesRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/padres', padresRoutes);
app.use('/api/mantenimientos', mantenimientosRoutes);


app.use((err, _req, res, _next) => {
  console.error('[app] Error:', err.message);

  if (err.message?.startsWith('CORS')) {
    return res.status(403).json({ ok: false, data: null, mensaje: err.message });
  }

  return res.status(500).json({
    ok: false,
    data: null,
    mensaje: 'Error interno del servidor'
  });
});

module.exports = app;