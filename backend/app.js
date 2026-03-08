const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const authRoutes = require('./modules/auth/auth.routes');
const vehiculosRoutes = require('./modules/vehiculos/vehiculos.routes');
const conductoresRoutes = require('./modules/conductores/conductores.routes');
const rutasRoutes = require('./modules/rutas/rutas.routes');
const alumnosRoutes = require('./modules/alumnos/alumnos.routes');
const asistenciasRoutes = require('./modules/asistencias/asistencias.routes');
const usuariosRoutes = require('./modules/usuarios/usuarios.routes');

const app = express();

// 1. Definir la lista de dominios permitidos (Whitelist)
const dominiosPermitidos = [
  'https://www.schoolwaysv.online',
  'https://schoolwaysv.online', // Por si entran sin el www
  'http://localhost:3000'        // Para que sigan probando en su PC
];

const corsOptions = {
  origin: function (origin, callback) {
    // Permitir peticiones sin origen (como Postman o apps móviles)
    if (!origin) return callback(null, true);
    
    if (dominiosPermitidos.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('No permitido por CORS - SchoolWaySV Security'));
    }
  },
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true, // Crucial para que el token de recuperación viaje seguro
  optionsSuccessStatus: 204
};

// Aplica middlewares de seguridad y parseo
app.use(helmet());
app.use(cors());
app.use(express.json());

// Registra las rutas de los módulos
app.use('/api/auth', authRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/vehiculos', vehiculosRoutes);
app.use('/api/conductores', conductoresRoutes);
app.use('/api/rutas', rutasRoutes);
app.use('/api/alumnos', alumnosRoutes);
app.use('/api/asistencias', asistenciasRoutes);

module.exports = app;