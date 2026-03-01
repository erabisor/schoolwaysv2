const express = require('express');
const router = express.Router();
const authController = require('./auth.controller');

// Expone el endpoint POST para iniciar sesión
router.post('/login', authController.login);

module.exports = router;