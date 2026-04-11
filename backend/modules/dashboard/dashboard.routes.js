const express = require('express');
const router = express.Router();
const controller = require('./dashboard.controller');
const { verificarToken } = require('../../middleware/auth');
const { verificarRol } = require('../../middleware/roles');

// Solo el admin puede ver el dashboard completo
router.get('/', verificarToken, verificarRol([1]), controller.getDashboard);

module.exports = router;