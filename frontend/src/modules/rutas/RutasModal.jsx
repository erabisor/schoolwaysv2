import React, { useState, useEffect } from 'react';
import { getOpcionesRuta } from './rutas.api';

const RutasModal = ({ onClose, onSave, rutaAEditar }) => {
  const [opciones, setOpciones] = useState({ conductores: [], vehiculos: [] });
  const [datos, setDatos] = useState({
    NombreRuta: '', Descripcion: '', CapacidadMaxima: 20, ConductorID: '', VehiculoID: '', Turno: 'Mañana'
  });
  const [errorValidacion, setErrorValidacion] = useState('');

  useEffect(() => {
    getOpcionesRuta().then(res => {
      setOpciones(res.data.data);
      if (!rutaAEditar) {
        setDatos(d => ({
          ...d,
          ConductorID: res.data.data.conductores[0]?.ConductorID || '',
          VehiculoID: res.data.data.vehiculos[0]?.VehiculoID || ''
        }));
      }
    });

    if (rutaAEditar) setDatos(rutaAEditar);
  }, [rutaAEditar]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorValidacion('');
    
    // VALIDACIÓN ESTRICTA DE NEGOCIO: Sobrecupo
    const vehiculoSeleccionado = opciones.vehiculos.find(v => v.VehiculoID === datos.VehiculoID);
    
    if (vehiculoSeleccionado && datos.CapacidadMaxima > vehiculoSeleccionado.Capacidad) {
      setErrorValidacion(`Error: La ruta pide ${datos.CapacidadMaxima} cupos, pero el vehículo seleccionado solo tiene ${vehiculoSeleccionado.Capacidad} asientos.`);
      return; 
    }

    onSave(datos);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '24px' }}>
          {rutaAEditar ? 'Editar Ruta' : 'Nueva Ruta'}
        </h2>
        <form onSubmit={handleSubmit}>
          <input type="text" placeholder="Nombre de la Ruta (Ej: Escalón - Santa Tecla)" required className="form-input" 
            value={datos.NombreRuta} onChange={e => setDatos({...datos, NombreRuta: e.target.value})} />
          
          <input type="text" placeholder="Descripción breve" className="form-input" 
            value={datos.Descripcion} onChange={e => setDatos({...datos, Descripcion: e.target.value})} />

          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)' }}>Turno</label>
              <select className="form-input" value={datos.Turno} onChange={e => setDatos({...datos, Turno: e.target.value})}>
                <option value="Mañana">Mañana</option>
                <option value="Tarde">Tarde</option>
                <option value="Ambos">Ambos</option>
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)' }}>Capacidad Máx.</label>
              <input type="number" required className="form-input" min="1" max="100"
                value={datos.CapacidadMaxima} onChange={e => setDatos({...datos, CapacidadMaxima: parseInt(e.target.value)})} />
            </div>
          </div>
          
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)' }}>Conductor Asignado</label>
          <select required className="form-input" value={datos.ConductorID} onChange={e => setDatos({...datos, ConductorID: parseInt(e.target.value)})}>
            <option value="" disabled>Seleccione un conductor</option>
            {rutaAEditar && !opciones.conductores.find(c => c.ConductorID === rutaAEditar.ConductorID) && (
              <option value={rutaAEditar.ConductorID}>{rutaAEditar.NombreConductor} (Conservar actual)</option>
            )}
            {opciones.conductores.map(c => <option key={c.ConductorID} value={c.ConductorID}>{c.NombreCompleto}</option>)}
          </select>

          <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)' }}>Vehículo Asignado</label>
          <select required className="form-input" value={datos.VehiculoID} onChange={e => setDatos({...datos, VehiculoID: parseInt(e.target.value)})}>
            <option value="" disabled>Seleccione un vehículo</option>
            {rutaAEditar && !opciones.vehiculos.find(v => v.VehiculoID === rutaAEditar.VehiculoID) && (
              <option value={rutaAEditar.VehiculoID}>{rutaAEditar.Placa} (Conservar actual)</option>
            )}
            {opciones.vehiculos.map(v => <option key={v.VehiculoID} value={v.VehiculoID}>{v.Placa} - Cap: {v.Capacidad}</option>)}
          </select>

          {/* MENSAJE DE ERROR DE VALIDACIÓN */}
          {errorValidacion && (
            <div style={{ marginTop: '16px', padding: '12px', background: '#fee2e2', color: '#b91c1c', borderRadius: '8px', fontSize: '13px', fontWeight: '600' }}>
              {errorValidacion}
            </div>
          )}

          <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: '12px', background: '#f1f5f9', color: 'var(--text-muted)', borderRadius: '10px', border: 'none', fontWeight: '600', cursor: 'pointer' }}>Cancelar</button>
            <button type="submit" style={{ flex: 1, padding: '12px', background: 'var(--primary)', color: 'white', borderRadius: '10px', border: 'none', fontWeight: '600', cursor: 'pointer' }}>{rutaAEditar ? 'Actualizar' : 'Guardar'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RutasModal;