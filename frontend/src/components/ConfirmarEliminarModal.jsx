import React from 'react';
import ConfirmarAccionModal from './ConfirmarAccionModal';

// Wrapper del modal genérico — mantiene la interfaz anterior intacta
// para no romper Alumnos, Conductores, Usuarios, etc.
const ConfirmarEliminarModal = ({ onClose, onConfirm, mensaje }) => {
  return (
    <ConfirmarAccionModal
      titulo="¿Estás seguro?"
      mensaje={mensaje || 'Esta acción marcará el registro como eliminado en el sistema.'}
      onConfirmar={onConfirm}
      onCancelar={onClose}
      tipo="warning"
    />
  );
};

export default ConfirmarEliminarModal;