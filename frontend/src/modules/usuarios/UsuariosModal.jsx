import React, { useState, useEffect } from 'react';

// Si recibe usuarioAEditar, se llena con sus datos; si no, queda en blanco
const UsuariosModal = ({ onClose, onSave, usuarioAEditar }) => {
  const [datos, setDatos] = useState({
    NombreCompleto: '', CorreoElectronico: '', password: '', RolID: 2, Telefono: ''
  });

  // Al abrir el modal, revisa si hay datos para cargar
  useEffect(() => {
    if (usuarioAEditar) {
      setDatos({
        NombreCompleto: usuarioAEditar.NombreCompleto,
        CorreoElectronico: usuarioAEditar.CorreoElectronico,
        password: '', // La dejamos vacía por seguridad
        RolID: usuarioAEditar.RolID,
        Telefono: usuarioAEditar.Telefono || ''
      });
    }
  }, [usuarioAEditar]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(datos);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '24px' }}>
          {usuarioAEditar ? 'Editar Usuario' : 'Nuevo Usuario'}
        </h2>
        <form onSubmit={handleSubmit}>
          <input type="text" placeholder="Nombre Completo" required className="form-input" 
            value={datos.NombreCompleto} onChange={e => setDatos({...datos, NombreCompleto: e.target.value})} />
          
          <input type="email" placeholder="Correo Electrónico" required className="form-input" 
            value={datos.CorreoElectronico} onChange={e => setDatos({...datos, CorreoElectronico: e.target.value})} />
          
          {/* Si estamos editando, la contraseña no es obligatoria */}
          <input type="password" placeholder={usuarioAEditar ? "Nueva Contraseña (opcional)" : "Contraseña Temporal"} 
            required={!usuarioAEditar} className="form-input" 
            value={datos.password} onChange={e => setDatos({...datos, password: e.target.value})} />
          
          <input type="text" placeholder="Teléfono (Ej: 7000-0000)" className="form-input" 
            value={datos.Telefono} onChange={e => setDatos({...datos, Telefono: e.target.value})} />
          
          <select className="form-input" value={datos.RolID} onChange={e => setDatos({...datos, RolID: parseInt(e.target.value)})}>
            <option value={1}>Administrador</option>
            <option value={2}>Conductor</option>
            <option value={3}>Padre</option>
            <option value={4}>Estudiante</option>
          </select>

          <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: '12px', background: '#f1f5f9', color: 'var(--text-muted)', borderRadius: '10px', border: 'none', fontWeight: '600', cursor: 'pointer' }}>
              Cancelar
            </button>
            <button type="submit" style={{ flex: 1, padding: '12px', background: 'var(--primary)', color: 'white', borderRadius: '10px', border: 'none', fontWeight: '600', cursor: 'pointer' }}>
              {usuarioAEditar ? 'Actualizar' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UsuariosModal;