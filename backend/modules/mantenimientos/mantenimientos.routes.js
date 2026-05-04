const express = require('express');
const controller = require('./mantenimientos.controller');
const { ROL } = require('../../constants');
const { verificarToken } = require('../../middleware/auth');
const { verificarRol } = require('../../middleware/roles');

const router = express.Router();

router.use(verificarToken);
router.use(verificarRol([ROL.ADMIN]));

router.get('/', controller.listar);
router.get('/vehiculo/:vehiculoId', controller.listarPorVehiculo);
router.post('/', controller.crear);
router.put('/:id', controller.editar);
router.patch('/:id/estado', controller.cambiarEstado);
router.delete('/:id', controller.eliminar);

module.exports = router;
``