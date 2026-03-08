const { Resend } = require('resend');

// Inicializamos Resend con la variable de entorno
const resend = new Resend(process.env.RESEND_API_KEY);
const EMAIL_ORIGEN = 'SchoolWaySV <soporte@schoolwaysv.online>'; // Tu dominio verificado

/**
 * 1. Plantilla para Recuperación de Contraseña
 */
const enviarCorreoRecuperacion = async (emailDestino, token) => {
  const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

  try {
    const { data, error } = await resend.emails.send({
      from: EMAIL_ORIGEN,
      to: [emailDestino],
      subject: '🔒 Recuperación de Contraseña - SchoolWaySV',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #2563eb;">Restablecimiento de Contraseña</h2>
          <p>Hola,</p>
          <p>Hemos recibido una solicitud para restablecer la contraseña de tu cuenta en el sistema <strong>SchoolWaySV</strong>.</p>
          <p>Haz clic en el siguiente botón para crear una nueva contraseña. Este enlace es válido por 15 minutos.</p>
          <a href="${resetLink}" style="display: inline-block; padding: 10px 20px; margin: 20px 0; background-color: #2563eb; color: white; text-decoration: none; border-radius: 5px;">Restablecer mi contraseña</a>
          <p>Si no solicitaste este cambio, puedes ignorar este correo de forma segura.</p>
        </div>
      `,
    });

    if (error) throw new Error(error.message);
    return data;
  } catch (error) {
    console.error("Fallo al enviar correo de recuperación:", error);
    throw error;
  }
};

/**
 * 2. Plantilla para Notificaciones de Padres (Tracking)
 * @param {string} emailPadre - Correo del encargado
 * @param {string} nombreAlumno - Nombre del estudiante
 * @param {string} evento - "Abordó" o "Descendió"
 * @param {string} ruta - Nombre de la ruta o placas del vehículo
 */
const enviarNotificacionTracking = async (emailPadre, nombreAlumno, evento, ruta) => {
  const horaActual = new Date().toLocaleTimeString('es-SV', { hour: '2-digit', minute: '2-digit' });
  
  // Asignamos un color dependiendo del evento para que sea visualmente claro para el padre
  const colorEvento = evento === 'Abordó' ? '#10b981' : '#f59e0b'; // Verde para subir, Naranja para bajar

  try {
    const { data, error } = await resend.emails.send({
      from: EMAIL_ORIGEN,
      to: [emailPadre],
      subject: `📍 Actualización de Ruta: ${nombreAlumno} ha ${evento.toLowerCase()}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eaeaea; border-radius: 8px;">
          <h2 style="color: #333;">Notificación de Transporte</h2>
          <p>Hola, te informamos sobre el estado del viaje de <strong>${nombreAlumno}</strong>:</p>
          
          <div style="background-color: #f8fafc; padding: 15px; border-left: 4px solid ${colorEvento}; margin: 20px 0;">
            <p style="margin: 0; font-size: 16px;">
              <strong>Estado:</strong> ${evento} la unidad.<br/>
              <strong>Ruta/Vehículo:</strong> ${ruta}<br/>
              <strong>Hora:</strong> ${horaActual}
            </p>
          </div>
          
          <p style="font-size: 14px; color: #666;">Gracias por confiar en SchoolWaySV para el transporte seguro de tu hijo/a.</p>
        </div>
      `,
    });

    if (error) throw new Error(error.message);
    return data;
  } catch (error) {
    console.error("Fallo al enviar notificación de tracking:", error);
    throw error;
  }
};

// Exportamos ambas funciones para usarlas en sus respectivos controladores
module.exports = {
  enviarCorreoRecuperacion,
  enviarNotificacionTracking
};