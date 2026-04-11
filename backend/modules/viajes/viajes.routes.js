const express = require('express');
const router = express.Router();
const viajesController = require('./viajes.controller');

// Importaciones correctas basadas en tu arquitectura real
const { verificarToken } = require('../../middleware/auth');
const { verificarRol } = require('../../middleware/roles');

// Endpoint: GET /api/viajes/optimizada/:rutaId?lat=13.4833&lng=-88.1833
// NOTA: Reemplaza el [1, 2] por los IDs reales que correspondan a Admin y Conductor en tu BD
router.get(
    '/optimizada/:rutaId', 
    verificarToken, 
    verificarRol([1, 2]), // 1 = Admin, 2 = Conductor (Ajusta si tus IDs son distintos)
    viajesController.obtenerRutaOptimizada
);

module.exports = router;