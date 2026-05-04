const express = require('express');
const controller = require('./padres.controller');
const { ROL } = require('../../constants');
const { verificarToken } = require('../../middleware/auth');
const { verificarRol } = require('../../middleware/roles');

const router = express.Router();

router.use(verificarToken);
router.use(verificarRol([ROL.PADRE]));

router.get('/hijos', controller.getHijos);
router.get('/transporte-hoy', controller.getTransporteHoy);
router.get('/historial-semanal', controller.getHistorialSemanal);
router.get('/notificaciones', controller.getNotificaciones);
router.get('/notificaciones/resumen', controller.getResumenNotificaciones);
router.patch('/notificaciones/leidas', controller.patchNotificacionesLeidas);
router.patch('/notificaciones/:id/leida', controller.patchNotificacionLeida);

module.exports = router;
