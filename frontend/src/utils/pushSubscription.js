const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function suscribirPush(token) {
  try {
    // 1. Verificar soporte
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('[push] Push no soportado en este navegador');
      return false;
    }

    // 2. Pedir permiso
    const permiso = await Notification.requestPermission();
    if (permiso !== 'granted') {
      console.warn('[push] Permiso de notificaciones denegado');
      return false;
    }

    // 3. Obtener VAPID key del backend
    const resKey = await fetch(`${API_URL}/push/vapid-key`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const { data: vapidKey } = await resKey.json();
    if (!vapidKey) {
      console.warn('[push] VAPID key no disponible');
      return false;
    }

    // 4. Suscribirse
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidKey),
    });

    // 5. Enviar suscripción al backend
    await fetch(`${API_URL}/push/subscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(subscription.toJSON()),
    });

    console.log('[push] Suscripción push registrada correctamente');
    return true;
  } catch (error) {
    console.error('[push] Error al suscribir:', error.message);
    return false;
  }
}