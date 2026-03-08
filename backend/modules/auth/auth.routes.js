const express = require('express');
const router = express.Router();
const authController = require('./auth.controller');

// Expone el endpoint POST para iniciar sesión
router.post('/login', authController.login);

// Expone el endpoint POST para solicitar el correo
router.post('/olvide-password', authController.olvidePassword);

// Expone el endpoint POST para recuperar contraseña
router.post('/reset-password', authController.resetPassword);

module.exports = router;