import React, { useEffect } from 'react';
import { CheckCircle, AlertCircle } from 'lucide-react';

// Renderiza un mensaje flotante temporal
const Toast = ({ mensaje, tipo, onClose }) => {
  useEffect(() => {
    if (mensaje) {
      // Oculta el toast automáticamente a los 3 segundos
      const timer = setTimeout(() => onClose(), 3000);
      return () => clearTimeout(timer);
    }
  }, [mensaje, onClose]);

  if (!mensaje) return null;

  return (
    <div className={`toast-notification ${tipo}`}>
      {tipo === 'success' ? <CheckCircle size={24} /> : <AlertCircle size={24} />}
      <span>{mensaje}</span>
    </div>
  );
};

export default Toast;