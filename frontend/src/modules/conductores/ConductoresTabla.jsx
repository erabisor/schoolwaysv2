import React from 'react';
import { Edit2, Trash2, Power } from 'lucide-react';

const ConductoresTabla = ({ conductores, onToggleEstado, onEdit, onDelete, seleccionados, onSelect, onSelectAll }) => {
  const thStyle = { padding: '16px', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, backgroundColor: '#f8fafc', zIndex: 10, fontWeight: '600' };
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
  const todosSeleccionados = conductores.length > 0 && seleccionados.length === conductores.length;

  return (
    <div style={{ background: 'white', borderRadius: '16px 16px 0 0', overflow: 'hidden' }}>
      <div style={{ maxHeight: 'calc(100vh - 220px)', overflowY: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr>
              <th style={{ ...thStyle, paddingLeft: '24px', width: '40px' }}><input type="checkbox" checked={todosSeleccionados} onChange={(e) => onSelectAll(e.target.checked)} style={{ cursor: 'pointer', transform: 'scale(1.2)' }} /></th>
              <th style={thStyle}>Nombre</th><th style={thStyle}>Contacto</th><th style={thStyle}>Licencia</th><th style={thStyle}>Vencimiento</th><th style={thStyle}>Estado</th><th style={{ ...thStyle, paddingRight: '24px' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {conductores.map(c => {
              let fechaVencimiento = null; let estaVencida = false;
              if (c.VencimientoLicencia) { const fechaString = c.VencimientoLicencia.split('T')[0]; fechaVencimiento = new Date(`${fechaString}T00:00:00`); estaVencida = fechaVencimiento < hoy; }
              return (
                <tr key={c.ConductorID} style={{ borderBottom: '1px solid #f1f5f9', backgroundColor: seleccionados.includes(c.ConductorID) ? '#f0f9ff' : 'transparent' }}>
                  <td style={{ padding: '16px 16px 16px 24px' }}><input type="checkbox" checked={seleccionados.includes(c.ConductorID)} onChange={() => onSelect(c.ConductorID)} style={{ cursor: 'pointer', transform: 'scale(1.2)' }} /></td>
                  <td style={{ padding: '16px', fontWeight: '700', color: '#0f172a' }}>{c.NombreCompleto}</td>
                  <td style={{ padding: '16px', color: 'var(--text-muted)' }}>{c.CorreoElectronico}<br/>{c.Telefono || 'Sin teléfono'}</td>
                  <td style={{ padding: '16px', fontWeight: '500' }}>{c.NumeroLicencia}</td>
                  <td style={{ padding: '16px' }}>{fechaVencimiento ? fechaVencimiento.toLocaleDateString('es-ES') : 'N/A'}{estaVencida && <span style={{ marginLeft: '8px', padding: '4px 8px', borderRadius: '6px', background: '#fee2e2', color: '#dc2626', fontSize: '11px', fontWeight: '800' }}>VENCIDA</span>}</td>
                  <td style={{ padding: '16px' }}><span style={{ padding: '4px 12px', borderRadius: '99px', fontSize: '12px', fontWeight: '700', background: c.Estado ? '#d1fae5' : '#fee2e2', color: c.Estado ? '#059669' : '#dc2626' }}>{c.Estado ? 'Activo' : 'Inactivo'}</span></td>
                  <td style={{ padding: '16px 24px 16px 16px', display: 'flex', gap: '12px' }}>
                    <button onClick={() => onEdit(c)} title="Editar Licencia" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)' }}><Edit2 size={20} /></button>
                    <button onClick={() => onToggleEstado(c.ConductorID, !c.Estado)} title={c.Estado ? "Desactivar" : "Activar"} style={{ background: 'none', border: 'none', cursor: 'pointer', color: c.Estado ? 'var(--warning)' : 'var(--success)' }}><Power size={20} /></button>
                    <button onClick={() => onDelete(c)} title="Eliminar" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)' }}><Trash2 size={20} /></button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
export default ConductoresTabla;