const express = require('express');
const router = express.Router();
const controller = require('./vehiculos.controller');
const { verificarToken } = require('../../middleware/auth');
const { verificarRol } = require('../../middleware/roles');

// Exclusivo para administradores
router.use(verificarToken);
router.use(verificarRol([1]));

router.get('/', controller.listar);
router.post('/', controller.crear);
router.put('/:id', controller.editar);
router.patch('/:id/estado', controller.cambiarEstado);
router.delete('/:id', controller.eliminar);

module.exports = router;