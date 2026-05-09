const webpush = require('web-push');
const { sql, poolPromise } = require('../config/db');

// Configurar VAPID
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    process.env.VAPID_EMAIL || 'mailto:admin@schoolwaysv.online',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
  console.log('[push] VAPID configurado correctamente');
} else {
  console.warn('[push] VAPID no configurado — notificaciones push deshabilitadas');
}

/**
 * Guardar suscripción push de un usuario
 */
const guardarSuscripcion = async (usuarioId, subscription) => {
  const pool = await poolPromise;
  const { endpoint, keys } = subscription;

  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    throw new Error('Suscripción push inválida');
  }

  // Upsert: si el endpoint ya existe, actualizar
  await pool.request()
    .input('usuarioId', sql.Int, usuarioId)
    .input('endpoint', sql.VarChar, endpoint)
    .input('p256dh', sql.VarChar, keys.p256dh)
    .input('auth', sql.VarChar, keys.auth)
    .query(`
      MERGE PushSubscriptions AS target
      USING (SELECT @endpoint AS Endpoint) AS source
      ON target.Endpoint = source.Endpoint
      WHEN MATCHED THEN
        UPDATE SET UsuarioID = @usuarioId, KeyP256dh = @p256dh, KeyAuth = @auth, FechaRegistro = GETDATE()
      WHEN NOT MATCHED THEN
        INSERT (UsuarioID, Endpoint, KeyP256dh, KeyAuth)
        VALUES (@usuarioId, @endpoint, @p256dh, @auth);
    `);
};

/**
 * Eliminar suscripción push
 */
const eliminarSuscripcion = async (endpoint) => {
  const pool = await poolPromise;
  await pool.request()
    .input('endpoint', sql.VarChar, endpoint)
    .query('DELETE FROM PushSubscriptions WHERE Endpoint = @endpoint');
};

/**
 * Enviar push a un usuario específico
 */
const enviarPushAUsuario = async (usuarioId, payload) => {
  const pool = await poolPromise;
  const result = await pool.request()
    .input('usuarioId', sql.Int, usuarioId)
    .query('SELECT Endpoint, KeyP256dh, KeyAuth FROM PushSubscriptions WHERE UsuarioID = @usuarioId');

  const suscripciones = result.recordset;
  if (!suscripciones.length) return;

  const mensaje = JSON.stringify({
    title: payload.title || 'SchoolWaySV',
    body: payload.body || '',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-152x152.png',
    data: payload.data || {},
  });

  const envios = suscripciones.map(async (sub) => {
    const pushSubscription = {
      endpoint: sub.Endpoint,
      keys: { p256dh: sub.KeyP256dh, auth: sub.KeyAuth },
    };

    try {
      await webpush.sendNotification(pushSubscription, mensaje);
    } catch (error) {
      console.warn('[push] Error enviando a', sub.Endpoint.substring(0, 50), error.statusCode);
      // Si el endpoint ya no es válido (410 Gone o 404), eliminar
      if (error.statusCode === 410 || error.statusCode === 404) {
        await eliminarSuscripcion(sub.Endpoint);
      }
    }
  });

  await Promise.allSettled(envios);
};

/**
 * Enviar push a múltiples usuarios
 */
const enviarPushAUsuarios = async (usuarioIds = [], payload) => {
  const envios = usuarioIds.map((id) => enviarPushAUsuario(id, payload));
  await Promise.allSettled(envios);
};

module.exports = {
  guardarSuscripcion,
  eliminarSuscripcion,
  enviarPushAUsuario,
  enviarPushAUsuarios,
};