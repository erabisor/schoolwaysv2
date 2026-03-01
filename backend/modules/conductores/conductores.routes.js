const express = require('express');
const router = express.Router();
const controller = require('./conductores.controller');
const { verificarToken } = require('../../middleware/auth');
const { verificarRol } = require('../../middleware/roles');

router.use(verificarToken);
router.use(verificarRol([1]));

router.get('/', controller.listar);
router.get('/disponibles', controller.listarDisponibles); // Endpoint para el select
router.post('/', controller.crear);
router.put('/:id', controller.editar);
router.patch('/:id/estado', controller.cambiarEstado);
router.delete('/:id', controller.eliminar);

module.exports = router;