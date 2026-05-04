import React, { useEffect, useState } from 'react';

const DEFAULT_FORM = {
  NombreCompleto: '',
  CorreoElectronico: '',
  password: '',
  RolID: 2,
  Telefono: ''
};

const UsuariosModal = ({ onClose, onSave, usuarioAEditar }) => {
  const [datos, setDatos] = useState(DEFAULT_FORM);

  useEffect(() => {
    if (!usuarioAEditar) {
      setDatos(DEFAULT_FORM);
      return;
    }

    setDatos({
      NombreCompleto: usuarioAEditar.NombreCompleto || '',
      CorreoElectronico: usuarioAEditar.CorreoElectronico || '',
      password: '',
      RolID: usuarioAEditar.RolID || 2,
      Telefono: usuarioAEditar.Telefono || ''
    });
  }, [usuarioAEditar]);

  const setCampo = (campo, valor) => {
    setDatos((prev) => ({ ...prev, [campo]: valor }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSave(datos);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '620px', width: 'min(620px, 96vw)' }}>
        <h3 style={{ fontSize: '1.45rem', fontWeight: '800', marginBottom: '18px', color: '#0f172a' }}>
          {usuarioAEditar ? 'Editar Usuario' : 'Nuevo Usuario'}
        </h3>

        <form onSubmit={handleSubmit}>
          <input
            className="form-input"
            type="text"
            placeholder="Nombre completo"
            value={datos.NombreCompleto}
            onChange={(event) => setCampo('NombreCompleto', event.target.value)}
            required
          />

          <input
            className="form-input"
            type="email"
            placeholder="Correo electrónico"
            value={datos.CorreoElectronico}
            onChange={(event) => setCampo('CorreoElectronico', event.target.value)}
            required
          />

          <input
            className="form-input"
            type="password"
            placeholder={usuarioAEditar ? 'Nueva contraseña (opcional)' : 'Contraseña'}
            value={datos.password}
            onChange={(event) => setCampo('password', event.target.value)}
            required={!usuarioAEditar}
          />

          <input
            className="form-input"
            type="text"
            placeholder="Teléfono"
            value={datos.Telefono}
            onChange={(event) => setCampo('Telefono', event.target.value)}
          />

          <select
            className="form-input"
            value={datos.RolID}
            onChange={(event) => setCampo('RolID', Number(event.target.value))}
            required
          >
            <option value={1}>Administrador</option>
            <option value={2}>Conductor</option>
            <option value={3}>Padre</option>
            <option value={4}>Estudiante</option>
          </select>

          <div style={{ display: 'flex', gap: '12px', marginTop: '22px' }}>
            <button type="button" onClick={onClose} className="btn-secondary" style={{ flex: 1, justifyContent: 'center' }}>
              Cancelar
            </button>

            <button type="submit" className="btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
              {usuarioAEditar ? 'Actualizar' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UsuariosModal;
