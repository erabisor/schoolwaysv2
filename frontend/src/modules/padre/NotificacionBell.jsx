import React, { useEffect, useRef, useState } from 'react';
import { Bell, ChevronRight, MailOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  getNotificacionesPadre,
  getResumenNotificacionesPadre,
  marcarNotificacionLeida
} from './padre.api';

const formatearFecha = (fecha) => {
  if (!fecha) return '';
  return new Date(fecha).toLocaleString('es-SV', {
    day: '2-digit', month: '2-digit',
    hour: '2-digit', minute: '2-digit'
  });
};

const NotificacionBell = () => {
  const [noLeidas, setNoLeidas] = useState(0);
  const [notificaciones, setNotificaciones] = useState([]);
  const [abierto, setAbierto] = useState(false);
  const [cargando, setCargando] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();

  /* Cargar contador */
  const cargarResumen = async () => {
    try {
      const res = await getResumenNotificacionesPadre();
      setNoLeidas(Number(res.data.data?.NoLeidas || 0));
    } catch (e) {
      console.warn('[Bell] resumen:', e.message);
    }
  };

  /* Cargar lista al abrir */
  const cargarLista = async () => {
    setCargando(true);
    try {
      const res = await getNotificacionesPadre();
      setNotificaciones((res.data.data || []).slice(0, 5));
    } catch (e) {
      console.warn('[Bell] lista:', e.message);
    } finally {
      setCargando(false);
    }
  };

  /* Al montar: cargar contador + escuchar evento custom del socket */
  useEffect(() => {
    cargarResumen();
    const intervalo = setInterval(cargarResumen, 30000);

    const handler = (e) => {
      const count = e.detail?.noLeidas;
      if (typeof count === 'number') setNoLeidas(count);
    };
    window.addEventListener('schoolway:notificaciones-count', handler);

    return () => {
      clearInterval(intervalo);
      window.removeEventListener('schoolway:notificaciones-count', handler);
    };
  }, []);

  /* Click fuera cierra */
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setAbierto(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const togglePanel = () => {
    if (!abierto) cargarLista();
    setAbierto(!abierto);
  };

  const handleMarcar = async (id, e) => {
    e.stopPropagation();
    try {
      await marcarNotificacionLeida(id);
      setNotificaciones((prev) =>
        prev.map((n) => n.NotificacionID === id ? { ...n, Leida: true } : n)
      );
      setNoLeidas((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.warn('[Bell] marcar:', err.message);
    }
  };

  const irANotificaciones = () => {
    setAbierto(false);
    navigate('/padre/notificaciones');
  };

  return (
    <div ref={ref} style={{ position: 'fixed', top: '12px', right: '16px', zIndex: 1150 }}>
      {/* Botón campana */}
      <button
        onClick={togglePanel}
        style={{
          position: 'relative',
          width: '42px', height: '42px',
          borderRadius: '50%',
          border: 'none',
          background: 'white',
          boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Bell size={20} color="#2563eb" />
        {noLeidas > 0 && (
          <span style={{
            position: 'absolute', top: '-2px', right: '-2px',
            background: '#ef4444', color: 'white',
            fontSize: '10px', fontWeight: '800',
            borderRadius: '999px',
            minWidth: '18px', height: '18px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '0 4px',
            border: '2px solid white',
          }}>
            {noLeidas > 9 ? '9+' : noLeidas}
          </span>
        )}
      </button>

      {/* Panel dropdown */}
      {abierto && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 8px)',
          right: 0,
          width: '320px',
          maxWidth: 'calc(100vw - 32px)',
          background: 'white',
          borderRadius: '16px',
          boxShadow: '0 12px 32px rgba(0,0,0,0.15)',
          overflow: 'hidden',
          border: '1px solid #e2e8f0',
        }}>
          {/* Header del panel */}
          <div style={{
            padding: '14px 16px',
            borderBottom: '1px solid #f1f5f9',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <div>
              <p style={{ fontWeight: '800', fontSize: '14px', color: '#0f172a', margin: 0 }}>
                Notificaciones
              </p>
              {noLeidas > 0 && (
                <p style={{ fontSize: '12px', color: '#2563eb', fontWeight: '700', margin: 0 }}>
                  {noLeidas} sin leer
                </p>
              )}
            </div>
            <button
              onClick={irANotificaciones}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: '#2563eb', fontWeight: '700', fontSize: '12px',
                display: 'flex', alignItems: 'center', gap: '4px',
              }}
            >
              Ver todas <ChevronRight size={14} />
            </button>
          </div>

          {/* Lista */}
          <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
            {cargando ? (
              <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
                Cargando...
              </div>
            ) : notificaciones.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
                No tienes notificaciones
              </div>
            ) : (
              notificaciones.map((n) => {
                const leida = n.Leida === true || n.Leida === 1;
                return (
                  <div
                    key={n.NotificacionID}
                    style={{
                      padding: '12px 16px',
                      borderBottom: '1px solid #f8fafc',
                      background: leida ? 'white' : '#eff6ff',
                      display: 'flex',
                      gap: '10px',
                      alignItems: 'flex-start',
                      cursor: 'pointer',
                    }}
                    onClick={irANotificaciones}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{
                        fontWeight: leida ? '600' : '800',
                        fontSize: '13px',
                        color: '#0f172a',
                        margin: 0,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}>
                        {n.Titulo}
                      </p>
                      <p style={{
                        fontSize: '12px',
                        color: '#64748b',
                        margin: '2px 0 0',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}>
                        {n.Mensaje}
                      </p>
                      <p style={{ fontSize: '11px', color: '#94a3b8', margin: '4px 0 0' }}>
                        {formatearFecha(n.FechaRegistro)}
                      </p>
                    </div>

                    {!leida && (
                      <button
                        onClick={(e) => handleMarcar(n.NotificacionID, e)}
                        title="Marcar como leída"
                        style={{
                          border: 'none', background: '#dbeafe',
                          color: '#2563eb', borderRadius: '8px',
                          width: '30px', height: '30px',
                          cursor: 'pointer', flexShrink: 0,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                      >
                        <MailOpen size={14} />
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div
            onClick={irANotificaciones}
            style={{
              padding: '12px 16px',
              borderTop: '1px solid #f1f5f9',
              textAlign: 'center',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: '700',
              color: '#2563eb',
            }}
          >
            Ver todas las notificaciones
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificacionBell;