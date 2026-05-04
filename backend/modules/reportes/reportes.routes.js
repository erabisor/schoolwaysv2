const express = require('express');
const controller = require('./reportes.controller');
const { verificarToken } = require('../../middleware/auth');
const { verificarRol } = require('../../middleware/roles');
const { ROL } = require('../../constants');

const router = express.Router();

router.use(verificarToken);
router.use(verificarRol([ROL.ADMIN]));

router.get('/resumen', controller.resumen);
router.get('/uso-rutas', controller.usoRutas);
router.get('/mantenimiento-vehiculos', controller.mantenimientoVehiculos);
router.get('/asistencia-estudiante', controller.asistenciaEstudiante);
router.get('/viajes', controller.viajes);
router.get('/turnos', controller.turnos);

module.exports = router;
