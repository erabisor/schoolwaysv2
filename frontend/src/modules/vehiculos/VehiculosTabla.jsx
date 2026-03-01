import React from 'react';
import { Edit2, Trash2, Power } from 'lucide-react';

const VehiculosTabla = ({ vehiculos, onToggleEstado, onEdit, onDelete, seleccionados, onSelect, onSelectAll }) => {
  const thStyle = { padding: '16px', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, backgroundColor: '#f8fafc', zIndex: 10, fontWeight: '600' };
  const todosSeleccionados = vehiculos.length > 0 && seleccionados.length === vehiculos.length;

  return (
    <div style={{ background: 'white', borderRadius: '16px 16px 0 0', overflow: 'hidden' }}>
      <div style={{ maxHeight: 'calc(100vh - 220px)', overflowY: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr>
              <th style={{ ...thStyle, paddingLeft: '24px', width: '40px' }}><input type="checkbox" checked={todosSeleccionados} onChange={(e) => onSelectAll(e.target.checked)} style={{ cursor: 'pointer', transform: 'scale(1.2)' }} /></th>
              <th style={thStyle}>Placa</th><th style={thStyle}>Vehículo</th><th style={thStyle}>Año</th><th style={thStyle}>Asientos</th><th style={thStyle}>Estado</th><th style={{ ...thStyle, paddingRight: '24px' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {vehiculos.map(v => (
              <tr key={v.VehiculoID} style={{ borderBottom: '1px solid #f1f5f9', backgroundColor: seleccionados.includes(v.VehiculoID) ? '#f0f9ff' : 'transparent' }}>
                <td style={{ padding: '16px 16px 16px 24px' }}><input type="checkbox" checked={seleccionados.includes(v.VehiculoID)} onChange={() => onSelect(v.VehiculoID)} style={{ cursor: 'pointer', transform: 'scale(1.2)' }} /></td>
                <td style={{ padding: '16px', fontWeight: '700', color: '#0f172a' }}>{v.Placa}</td>
                <td style={{ padding: '16px', color: 'var(--text-muted)' }}>{v.Marca} {v.Modelo} ({v.Color})</td>
                <td style={{ padding: '16px' }}>{v.Anio}</td><td style={{ padding: '16px' }}>{v.Capacidad}</td>
                <td style={{ padding: '16px' }}><span style={{ padding: '4px 12px', borderRadius: '99px', fontSize: '12px', fontWeight: '700', background: v.Estado ? '#d1fae5' : '#fee2e2', color: v.Estado ? '#059669' : '#dc2626' }}>{v.Estado ? 'En Ruta' : 'En Taller'}</span></td>
                <td style={{ padding: '16px 24px 16px 16px', display: 'flex', gap: '12px' }}>
                  <button onClick={() => onEdit(v)} title="Editar" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)' }}><Edit2 size={20} /></button>
                  <button onClick={() => onToggleEstado(v.VehiculoID, !v.Estado)} title={v.Estado ? "Mandar a Taller" : "Poner en Ruta"} style={{ background: 'none', border: 'none', cursor: 'pointer', color: v.Estado ? 'var(--warning)' : 'var(--success)' }}><Power size={20} /></button>
                  <button onClick={() => onDelete(v)} title="Eliminar" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)' }}><Trash2 size={20} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
export default VehiculosTabla;