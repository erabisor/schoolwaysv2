import React from 'react';
import { AlertTriangle } from 'lucide-react';

const ConfirmarEliminarModal = ({ onClose, onConfirm, mensaje }) => {
  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ textAlign: 'center', maxWidth: '400px' }}>
        <AlertTriangle size={48} color="var(--danger)" style={{ margin: '0 auto 16px auto' }} />
        
        <h2 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '16px', color: '#0f172a' }}>
          ¿Estás seguro?
        </h2>
        
        <p style={{ color: 'var(--text-muted)', marginBottom: '32px' }}>
          {mensaje || 'Esta acción marcará el registro como eliminado en el sistema.'}
        </p>
        
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={onClose} style={{ flex: 1, padding: '12px', background: '#f1f5f9', color: 'var(--text-muted)', borderRadius: '10px', border: 'none', fontWeight: '600', cursor: 'pointer' }}>
            Cancelar
          </button>
          <button onClick={onConfirm} style={{ flex: 1, padding: '12px', background: 'var(--danger)', color: 'white', borderRadius: '10px', border: 'none', fontWeight: '600', cursor: 'pointer' }}>
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmarEliminarModal;