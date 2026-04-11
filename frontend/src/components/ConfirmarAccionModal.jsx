import React from 'react';
import { AlertTriangle, Info } from 'lucide-react';

// Reemplaza window.confirm — muestra un modal dentro del sistema
const ConfirmarAccionModal = ({ titulo, mensaje, onConfirmar, onCancelar, tipo = 'warning' }) => {
  const esWarning = tipo === 'warning';

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ textAlign: 'center', maxWidth: '380px' }}>

        <div style={{
          width: '56px', height: '56px', borderRadius: '50%',
          background: esWarning ? '#fee2e2' : '#dbeafe',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 16px'
        }}>
          {esWarning
            ? <AlertTriangle size={28} color="#ef4444" />
            : <Info size={28} color="#2563eb" />
          }
        </div>

        <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#0f172a', marginBottom: '8px' }}>
          {titulo}
        </h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '28px', lineHeight: '1.5' }}>
          {mensaje}
        </p>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={onCancelar}
            style={{
              flex: 1, padding: '12px', background: '#f1f5f9',
              color: 'var(--text-muted)', borderRadius: '10px',
              border: 'none', fontWeight: '600', cursor: 'pointer'
            }}
          >
            Cancelar
          </button>
          <button
            onClick={onConfirmar}
            style={{
              flex: 1, padding: '12px',
              background: esWarning ? '#ef4444' : 'var(--primary)',
              color: 'white', borderRadius: '10px',
              border: 'none', fontWeight: '700', cursor: 'pointer'
            }}
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmarAccionModal;