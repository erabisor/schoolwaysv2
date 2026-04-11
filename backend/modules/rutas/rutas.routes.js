const express = require('express');
const router = express.Router();
const controller = require('./rutas.controller');
const { verificarToken } = require('../../middleware/auth');
const { verificarRol } = require('../../middleware/roles');

router.use(verificarToken);

// Admin y Conductor pueden ver rutas — el resto solo Admin
router.get('/', verificarRol([1, 2]), controller.listar);
router.get('/opciones', verificarRol([1]), controller.opciones);
router.post('/', verificarRol([1]), controller.crear);
router.put('/:id', verificarRol([1]), controller.editar);
router.patch('/:id/estado', verificarRol([1]), controller.cambiarEstado);
router.delete('/:id', verificarRol([1]), controller.eliminar);

module.exports = router;