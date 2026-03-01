const express = require('express');
const router = express.Router();
const controller = require('./asistencias.controller');

router.post('/turnos/abrir', controller.postAbrirTurno);
router.put('/turnos/:id/cerrar', controller.putCerrarTurno);
router.post('/viajes/iniciar', controller.postIniciarViaje);
router.put('/viajes/:id/finalizar', controller.putFinalizarViaje);
router.post('/evento', controller.postRegistrarEvento);
router.delete('/evento/deshacer', controller.deleteDeshacerEvento);
router.get('/sesion/:conductorId', controller.getRecuperarSesion);

router.get('/turnos/abiertos', controller.getTurnosAbiertos);
router.put('/turnos/:id/reasignar', controller.putReasignarTurno);
router.put('/turnos/:id/forzar-cierre', controller.putForzarCierreTurno);

// Rutas de Reportes
router.get('/turnos/historial', controller.getHistorialTurnos);
router.get('/turnos/:id/detalle', controller.getDetalleTurno);

module.exports = router;