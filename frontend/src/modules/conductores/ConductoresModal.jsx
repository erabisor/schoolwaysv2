import React, { useState, useEffect } from 'react';
import { getUsuariosDisponibles } from './conductores.api';

const ConductoresModal = ({ onClose, onSave, conductorAEditar }) => {
  const [usuariosDisponibles, setUsuariosDisponibles] = useState([]);
  const [datos, setDatos] = useState({ UsuarioID: '', NumeroLicencia: '', VencimientoLicencia: '' });

  useEffect(() => {
    // Si vamos a crear, cargamos los usuarios disponibles
    if (!conductorAEditar) {
      getUsuariosDisponibles().then(res => {
        setUsuariosDisponibles(res.data.data);
        if (res.data.data.length > 0) setDatos(d => ({ ...d, UsuarioID: res.data.data[0].UsuarioID }));
      });
    } else {
      // Si editamos, extraemos la fecha en formato YYYY-MM-DD para el input type="date"
      const fechaFormat = conductorAEditar.VencimientoLicencia ? conductorAEditar.VencimientoLicencia.split('T')[0] : '';
      setDatos({
        UsuarioID: conductorAEditar.UsuarioID,
        NumeroLicencia: conductorAEditar.NumeroLicencia,
        VencimientoLicencia: fechaFormat
      });
    }
  }, [conductorAEditar]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(datos);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '24px' }}>
          {conductorAEditar ? 'Editar Licencia' : 'Vincular Conductor'}
        </h2>
        <form onSubmit={handleSubmit}>
          
          {/* Solo se puede elegir usuario si es creación nueva */}
          {!conductorAEditar ? (
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: 'var(--text-muted)' }}>Usuario a vincular:</label>
              {usuariosDisponibles.length > 0 ? (
                <select required className="form-input" value={datos.UsuarioID} onChange={e => setDatos({...datos, UsuarioID: e.target.value})}>
                  {usuariosDisponibles.map(u => <option key={u.UsuarioID} value={u.UsuarioID}>{u.NombreCompleto}</option>)}
                </select>
              ) : (
                <p style={{ color: 'var(--danger)', fontSize: '14px' }}>No hay usuarios con rol de conductor disponibles. Crea uno primero en el módulo de Usuarios.</p>
              )}
            </div>
          ) : (
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: 'var(--text-muted)' }}>Conductor:</label>
              <input type="text" disabled className="form-input" value={conductorAEditar.NombreCompleto} style={{ backgroundColor: '#f1f5f9' }} />
            </div>
          )}

          <input type="text" placeholder="Número de Licencia" required className="form-input" 
            value={datos.NumeroLicencia} onChange={e => setDatos({...datos, NumeroLicencia: e.target.value.toUpperCase()})} />
          
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: 'var(--text-muted)' }}>Fecha de Vencimiento:</label>
          <input type="date" required className="form-input" 
            value={datos.VencimientoLicencia} onChange={e => setDatos({...datos, VencimientoLicencia: e.target.value})} />

          <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: '12px', background: '#f1f5f9', color: 'var(--text-muted)', borderRadius: '10px', border: 'none', fontWeight: '600', cursor: 'pointer' }}>Cancelar</button>
            <button type="submit" disabled={!conductorAEditar && usuariosDisponibles.length === 0} style={{ flex: 1, padding: '12px', background: 'var(--primary)', color: 'white', borderRadius: '10px', border: 'none', fontWeight: '600', cursor: 'pointer', opacity: (!conductorAEditar && usuariosDisponibles.length === 0) ? 0.5 : 1 }}>
              {conductorAEditar ? 'Actualizar' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ConductoresModal;