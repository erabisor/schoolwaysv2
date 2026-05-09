import React, { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';

const isIos = () => {
  const ua = window.navigator.userAgent.toLowerCase();
  return /iphone|ipad|ipod/.test(ua);
};

const isInStandaloneMode = () =>
  window.matchMedia('(display-mode: standalone)').matches ||
  window.navigator.standalone === true;

const InstallBanner = () => {
  const [mostrar, setMostrar] = useState(false);

  useEffect(() => {
    if (isIos() && !isInStandaloneMode()) {
      const descartado = localStorage.getItem('installBannerDismissed');
      if (!descartado) setMostrar(true);
    }
  }, []);

  const cerrar = () => {
    setMostrar(false);
    localStorage.setItem('installBannerDismissed', 'true');
  };

  if (!mostrar) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      background: 'white',
      borderTop: '1px solid #e2e8f0',
      padding: '16px 20px',
      zIndex: 9998,
      boxShadow: '0 -4px 12px rgba(0,0,0,0.1)',
      display: 'flex',
      alignItems: 'flex-start',
      gap: '12px',
    }}>
      <div style={{
        width: '44px', height: '44px', borderRadius: '12px',
        background: '#eff6ff', display: 'flex', alignItems: 'center',
        justifyContent: 'center', flexShrink: 0,
      }}>
        <Download size={22} color="#2563eb" />
      </div>

      <div style={{ flex: 1 }}>
        <p style={{ fontWeight: '800', fontSize: '14px', color: '#0f172a', margin: 0 }}>
          Instala SchoolWaySV
        </p>
        <p style={{ fontSize: '12px', color: '#64748b', margin: '4px 0 0', lineHeight: 1.4 }}>
          Toca <strong>Compartir</strong> <span style={{ fontSize: '16px' }}>⎋</span> y luego <strong>"Agregar a pantalla de inicio"</strong> para recibir notificaciones y acceso rápido.
        </p>
      </div>

      <button
        onClick={cerrar}
        style={{
          border: 'none', background: 'none', cursor: 'pointer',
          padding: '4px', flexShrink: 0,
        }}
      >
        <X size={18} color="#94a3b8" />
      </button>
    </div>
  );
};

export default InstallBanner;