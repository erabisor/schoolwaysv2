import React, { useContext, useEffect, useRef, useState } from 'react';
import { Bell, CheckCheck, MailOpen, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { io } from 'socket.io-client';
import { AuthContext } from '../../context/AuthContext';
import {
  getNotificacionesPadre,
  getResumenNotificacionesPadre,
  marcarNotificacionLeida,
  marcarTodasNotificacionesLeidas
} from './padre.api';

const SOCKET_URL = process.env.REACT_APP_API_URL
  ? process.env.REACT_APP_API_URL.replace('/api', '')
  : 'http://localhost:5000';

const formatearFecha = (fecha) => {
  if (!fecha) return '';
  return new Date(fecha).toLocaleString('es-SV', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const normalizarNotificacion = (notificacion) => ({
  ...notificacion,
  Leida: notificacion.Leida === true || notificacion.Leida === 1
});

const emitirContador = (noLeidas) => {
  window.dispatchEvent(new CustomEvent('schoolway:notificaciones-count', {
    detail: { noLeidas }
  }));
};

const NotificacionesPadre = () => {
  const { user } = useContext(AuthContext);
  const [notificaciones, setNotificaciones] = useState([]);
  const [noLeidas, setNoLeidas] = useState(0);
  const [cargando, setCargando] = useState(false);
  const [conectado, setConectado] = useState(false);
  const [error, setError] = useState('');

  const socketRef = useRef(null);

  const cargar = async () => {
    setCargando(true);
    setError('');

    try {
      const [resLista, resResumen] = await Promise.all([
        getNotificacionesPadre(),
        getResumenNotificacionesPadre()
      ]);

      const lista = (resLista.data.data || []).map(normalizarNotificacion);
      const total = Number(resResumen.data.data?.NoLeidas || 0);

      setNotificaciones(lista);
      setNoLeidas(total);
      emitirContador(total);
    } catch (err) {
      setError(err.response?.data?.mensaje || 'No se pudieron cargar las notificaciones.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  useEffect(() => {
    if (!user?.id) return undefined;

    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1500
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setConectado(true);
      socket.emit('cliente:usuario', { usuarioId: user.id });
    });

    socket.on('disconnect', () => setConectado(false));
    socket.on('connect_error', () => setConectado(false));

    socket.on('notificacion:nueva', (notificacion) => {
      const nueva = normalizarNotificacion(notificacion);

      setNotificaciones((actuales) => {
        const existe = actuales.some((item) => Number(item.NotificacionID) === Number(nueva.NotificacionID));
        if (existe) return actuales;
        return [nueva, ...actuales].slice(0, 30);
      });

      if (!nueva.Leida) {
        setNoLeidas((totalActual) => {
          const nuevoTotal = totalActual + 1;
          emitirContador(nuevoTotal);
          return nuevoTotal;
        });
      }
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('connect_error');
      socket.off('notificacion:nueva');
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user?.id]);

  const marcarUna = async (id) => {
    try {
      await marcarNotificacionLeida(id);
      await cargar();
    } catch (err) {
      setError(err.response?.data?.mensaje || 'No se pudo marcar la notificación como leída.');
    }
  };

  const marcarTodas = async () => {
    try {
      await marcarTodasNotificacionesLeidas();
      await cargar();
    } catch (err) {
      setError(err.response?.data?.mensaje || 'No se pudieron marcar todas las notificaciones.');
    }
  };

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Bell size={20} color="var(--primary)" />
          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#0f172a' }}>Notificaciones</h2>
            <p style={{ color: conectado ? '#059669' : 'var(--text-muted)', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              {conectado ? <Wifi size={13} /> : <WifiOff size={13} />}
              {noLeidas} sin leer · {conectado ? 'en vivo' : 'sin conexión en vivo'}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button type="button" className="btn-secondary" onClick={cargar} disabled={cargando} style={{ padding: '8px 12px' }}>
            <RefreshCw size={16} color="var(--primary)" />
            Actualizar
          </button>

          <button type="button" className="btn-secondary" onClick={marcarTodas} disabled={cargando || noLeidas === 0} style={{ padding: '8px 12px' }}>
            <CheckCheck size={16} color="var(--primary)" />
            Marcar todas
          </button>
        </div>
      </div>

      {error && (
        <div style={{ padding: '12px 22px', background: '#fee2e2', color: '#b91c1c', fontWeight: '800' }}>
          {error}
        </div>
      )}

      {notificaciones.length === 0 ? (
        <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
          No tienes notificaciones todavía.
        </div>
      ) : (
        <div style={{ display: 'grid' }}>
          {notificaciones.map((notificacion) => (
            <div key={notificacion.NotificacionID} style={{ padding: '16px 22px', borderBottom: '1px solid var(--border)', background: notificacion.Leida ? 'white' : '#eff6ff' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '14px' }}>
                <div>
                  <div style={{ fontWeight: '800', color: '#0f172a', marginBottom: '4px' }}>{notificacion.Titulo}</div>
                  <div style={{ color: '#475569', fontSize: '14px', lineHeight: 1.45 }}>{notificacion.Mensaje}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '8px' }}>
                    {formatearFecha(notificacion.FechaRegistro)} · {notificacion.Tipo}
                  </div>
                </div>

                {!notificacion.Leida && (
                  <button type="button" onClick={() => marcarUna(notificacion.NotificacionID)} title="Marcar como leída" style={{ border: 'none', background: '#dbeafe', color: '#2563eb', borderRadius: '10px', width: '36px', height: '36px', cursor: 'pointer', flexShrink: 0 }}>
                    <MailOpen size={17} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificacionesPadre;
