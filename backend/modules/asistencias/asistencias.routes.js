const express = require('express');
const router  = express.Router();
const controller = require('./asistencias.controller');
const { verificarToken }       = require('../../middleware/auth');
const { verificarRol }         = require('../../middleware/roles');
const { verificarPropietario } = require('../../middleware/ownership');

router.use(verificarToken);

// Gestión de jornada — Admin y Conductor
router.post('/turnos/abrir',            verificarRol([1, 2]), verificarPropietario, controller.postAbrirTurno);
router.put('/turnos/:id/cerrar',        verificarRol([1, 2]), controller.putCerrarTurno);
router.post('/viajes/iniciar',          verificarRol([1, 2]), controller.postIniciarViaje);
router.put('/viajes/:id/finalizar',     verificarRol([1, 2]), controller.putFinalizarViaje);
router.post('/evento',                  verificarRol([1, 2]), controller.postRegistrarEvento);
router.delete('/evento/deshacer',       verificarRol([1, 2]), controller.deleteDeshacerEvento);
router.get('/sesion/:conductorId',      verificarRol([1, 2]), verificarPropietario, controller.getRecuperarSesion);

// Ubicación GPS — conductor escribe, admin/padre/estudiante leen
router.post('/ubicacion',               verificarRol([1, 2]),          controller.postUbicacionConductor);
router.get('/ubicacion/:viajeId',       verificarRol([1, 2, 3, 4]),    controller.getUltimaUbicacion);

// Solo Admin — monitoreo
router.get('/turnos/abiertos',          verificarRol([1]), controller.getTurnosAbiertos);
router.put('/turnos/:id/reasignar',     verificarRol([1]), controller.putReasignarTurno);
router.put('/turnos/:id/forzar-cierre', verificarRol([1]), controller.putForzarCierreTurno);

// Reportes — solo Admin
router.get('/turnos/historial',         verificarRol([1]), controller.getHistorialTurnos);
router.get('/turnos/:id/detalle',       verificarRol([1]), controller.getDetalleTurno);

module.exports = router;