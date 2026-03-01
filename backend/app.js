const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const authRoutes = require('./modules/auth/auth.routes');
const vehiculosRoutes = require('./modules/vehiculos/vehiculos.routes');
const conductoresRoutes = require('./modules/conductores/conductores.routes');
const rutasRoutes = require('./modules/rutas/rutas.routes');
const alumnosRoutes = require('./modules/alumnos/alumnos.routes');
const asistenciasRoutes = require('./modules/asistencias/asistencias.routes');

const app = express();

// Aplica middlewares de seguridad y parseo
app.use(helmet());
app.use(cors());
app.use(express.json());

// Registra las rutas de los módulos
app.use('/api/auth', authRoutes);
const usuariosRoutes = require('./modules/usuarios/usuarios.routes');
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/vehiculos', vehiculosRoutes);
app.use('/api/conductores', conductoresRoutes);
app.use('/api/rutas', rutasRoutes);
app.use('/api/alumnos', alumnosRoutes);
app.use('/api/asistencias', asistenciasRoutes);

module.exports = app;