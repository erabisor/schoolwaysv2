const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

// Importación de rutas
const authRoutes = require('./modules/auth/auth.routes');
const vehiculosRoutes = require('./modules/vehiculos/vehiculos.routes');
const conductoresRoutes = require('./modules/conductores/conductores.routes');
const rutasRoutes = require('./modules/rutas/rutas.routes');
const alumnosRoutes = require('./modules/alumnos/alumnos.routes');
const asistenciasRoutes = require('./modules/asistencias/asistencias.routes');
const usuariosRoutes = require('./modules/usuarios/usuarios.routes');

const app = express();

// 1. Configuración de CORS
// Esta configuración permite que tu Frontend en www.schoolwaysv.online se comunique con la API
const corsOptions = {
  origin: [
    'https://www.schoolwaysv.online', 
    'https://schoolwaysv.online',
    'http://localhost:3000' // Para pruebas locales
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 204
};

// 2. Aplicación de Middlewares Globales
app.use(helmet()); // Seguridad en encabezados HTTP
app.use(cors(corsOptions)); // Aplicamos CORS con las opciones definidas arriba
app.use(express.json()); // Permite procesar JSON en el cuerpo de las peticiones

// 3. Registro de las rutas de los módulos
app.use('/api/auth', authRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/vehiculos', vehiculosRoutes);
app.use('/api/conductores', conductoresRoutes);
app.use('/api/rutas', rutasRoutes);
app.use('/api/alumnos', alumnosRoutes);
app.use('/api/asistencias', asistenciasRoutes);

// Exportación de la configuración para server.js
module.exports = app;