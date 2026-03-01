const express = require('express');
const router = express.Router();
const controller = require('./usuarios.controller');
const { verificarToken } = require('../../middleware/auth');
const { verificarRol } = require('../../middleware/roles');

// Protegemos todas las rutas de este router (Solo Admin = 1)
router.use(verificarToken);
router.use(verificarRol([1]));

// Definimos los endpoints
router.get('/', controller.listar);
router.post('/', controller.crear);
router.put('/:id', controller.editar);
router.patch('/:id/estado', controller.cambiarEstado);
router.delete('/:id', controller.eliminar);

module.exports = router;