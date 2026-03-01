import React from 'react';
import { Edit2, Trash2, Power } from 'lucide-react';

const RutasTabla = ({ rutas, onToggleEstado, onEdit, onDelete, seleccionados, onSelect, onSelectAll }) => {
  const thStyle = { padding: '16px', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, backgroundColor: '#f8fafc', zIndex: 10, fontWeight: '600' };
  const todosSeleccionados = rutas.length > 0 && seleccionados.length === rutas.length;

  return (
    <div style={{ background: 'white', borderRadius: '16px 16px 0 0', overflow: 'hidden' }}>
      <div style={{ maxHeight: 'calc(100vh - 220px)', overflowY: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr>
              <th style={{ ...thStyle, paddingLeft: '24px', width: '40px' }}><input type="checkbox" checked={todosSeleccionados} onChange={(e) => onSelectAll(e.target.checked)} style={{ cursor: 'pointer', transform: 'scale(1.2)' }} /></th>
              <th style={thStyle}>Ruta</th><th style={thStyle}>Turno</th><th style={thStyle}>Conductor</th><th style={thStyle}>Vehículo</th><th style={thStyle}>Estado</th><th style={{ ...thStyle, paddingRight: '24px' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {rutas.map(r => {
              const sobrecupo = r.CapacidadMaxima > (r.CapacidadBus || 0);
              return (
                <tr key={r.RutaID} style={{ borderBottom: '1px solid #f1f5f9', backgroundColor: seleccionados.includes(r.RutaID) ? '#f0f9ff' : 'transparent' }}>
                  <td style={{ padding: '16px 16px 16px 24px' }}><input type="checkbox" checked={seleccionados.includes(r.RutaID)} onChange={() => onSelect(r.RutaID)} style={{ cursor: 'pointer', transform: 'scale(1.2)' }} /></td>
                  <td style={{ padding: '16px' }}><div style={{ fontWeight: '700', color: '#0f172a' }}>{r.NombreRuta}</div><div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{r.Descripcion}</div></td>
                  <td style={{ padding: '16px', fontWeight: '600' }}>{r.Turno}</td>
                  <td style={{ padding: '16px', color: 'var(--text-muted)' }}>{r.NombreConductor || 'Sin asignar'}</td>
                  <td style={{ padding: '16px' }}><span style={{ fontWeight: '600' }}>{r.Placa || 'N/A'}</span><br/><span style={{ fontSize: '12px', color: sobrecupo ? 'var(--danger)' : 'var(--text-muted)' }}>Cap: {r.CapacidadMaxima}/{r.CapacidadBus || '?'}</span></td>
                  <td style={{ padding: '16px' }}><span style={{ padding: '4px 12px', borderRadius: '99px', fontSize: '12px', fontWeight: '700', background: r.Estado ? '#d1fae5' : '#fee2e2', color: r.Estado ? '#059669' : '#dc2626' }}>{r.Estado ? 'Activa' : 'Inactiva'}</span></td>
                  <td style={{ padding: '16px 24px 16px 16px', display: 'flex', gap: '12px' }}>
                    <button onClick={() => onEdit(r)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)' }}><Edit2 size={20} /></button>
                    <button onClick={() => onToggleEstado(r.RutaID, !r.Estado)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: r.Estado ? 'var(--warning)' : 'var(--success)' }}><Power size={20} /></button>
                    <button onClick={() => onDelete(r)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)' }}><Trash2 size={20} /></button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
export default RutasTabla;