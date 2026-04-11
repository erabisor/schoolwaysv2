import React, { useState, useEffect } from 'react';

// Modal para crear o editar un vehículo
const VehiculosModal = ({ onClose, onSave, vehiculoAEditar }) => {
  const [datos, setDatos] = useState({
    Placa: '', Marca: '', Modelo: '', Anio: new Date().getFullYear(),
    Capacidad: 20, Color: ''
  });

  // Si viene un vehículo a editar, carga sus datos en el formulario
  useEffect(() => {
    if (vehiculoAEditar) {
      setDatos({
        Placa: vehiculoAEditar.Placa,
        Marca: vehiculoAEditar.Marca,
        Modelo: vehiculoAEditar.Modelo,
        Anio: vehiculoAEditar.Anio,
        Capacidad: vehiculoAEditar.Capacidad,
        Color: vehiculoAEditar.Color
      });
    }
  }, [vehiculoAEditar]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(datos);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '24px' }}>
          {vehiculoAEditar ? 'Editar Vehículo' : 'Nuevo Vehículo'}
        </h2>

        <form onSubmit={handleSubmit}>
          <input
            type="text" placeholder="Placa (Ej: P123-456)" required className="form-input"
            value={datos.Placa}
            onChange={e => setDatos({ ...datos, Placa: e.target.value.toUpperCase() })}
          />

          <div style={{ display: 'flex', gap: '12px' }}>
            <input
              type="text" placeholder="Marca" required className="form-input"
              value={datos.Marca}
              onChange={e => setDatos({ ...datos, Marca: e.target.value })}
            />
            <input
              type="text" placeholder="Modelo" required className="form-input"
              value={datos.Modelo}
              onChange={e => setDatos({ ...datos, Modelo: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)' }}>
                Año
              </label>
              <input
                type="number" required className="form-input"
                min="1990" max={new Date().getFullYear() + 1}
                value={datos.Anio}
                onChange={e => setDatos({ ...datos, Anio: parseInt(e.target.value) })}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)' }}>
                Capacidad (asientos)
              </label>
              <input
                type="number" required className="form-input"
                min="1" max="80"
                value={datos.Capacidad}
                onChange={e => setDatos({ ...datos, Capacidad: parseInt(e.target.value) })}
              />
            </div>
          </div>

          <input
            type="text" placeholder="Color" required className="form-input"
            value={datos.Color}
            onChange={e => setDatos({ ...datos, Color: e.target.value })}
          />

          <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
            <button
              type="button" onClick={onClose}
              style={{ flex: 1, padding: '12px', background: '#f1f5f9', color: 'var(--text-muted)', borderRadius: '10px', border: 'none', fontWeight: '600', cursor: 'pointer' }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              style={{ flex: 1, padding: '12px', background: 'var(--primary)', color: 'white', borderRadius: '10px', border: 'none', fontWeight: '600', cursor: 'pointer' }}
            >
              {vehiculoAEditar ? 'Actualizar' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VehiculosModal;