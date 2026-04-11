const express = require('express');
const router = express.Router();
const authController = require('./auth.controller');
const { loginLimiter } = require('../../middleware/rateLimit');

// Máximo 10 intentos de login por IP cada 15 minutos
router.post('/login', loginLimiter, authController.login);

router.post('/olvide-password', loginLimiter, authController.olvidePassword);
router.post('/reset-password', loginLimiter, authController.resetPassword);

module.exports = router;