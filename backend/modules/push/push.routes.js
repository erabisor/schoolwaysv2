const express = require('express');
const { verificarToken } = require('../../middleware/auth');
const pushService = require('../../utils/pushService');

const router = express.Router();
router.use(verificarToken);

// Guardar suscripción push
router.post('/subscribe', async (req, res) => {
  try {
    const usuarioId = req.usuario?.id || req.user?.id;
    if (!usuarioId) return res.status(401).json({ ok: false, mensaje: 'Usuario no identificado' });

    await pushService.guardarSuscripcion(usuarioId, req.body);
    return res.json({ ok: true, mensaje: 'Suscripción push guardada' });
  } catch (error) {
    console.error('[push] subscribe:', error.message);
    return res.status(500).json({ ok: false, mensaje: 'Error al guardar suscripción push' });
  }
});

// Eliminar suscripción push
router.post('/unsubscribe', async (req, res) => {
  try {
    await pushService.eliminarSuscripcion(req.body.endpoint);
    return res.json({ ok: true, mensaje: 'Suscripción push eliminada' });
  } catch (error) {
    console.error('[push] unsubscribe:', error.message);
    return res.status(500).json({ ok: false, mensaje: 'Error al eliminar suscripción' });
  }
});

// Obtener VAPID public key
router.get('/vapid-key', (_req, res) => {
  res.json({ ok: true, data: process.env.VAPID_PUBLIC_KEY || '' });
});

module.exports = router;