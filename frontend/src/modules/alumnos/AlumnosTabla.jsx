import React from 'react';
import { Edit2, Trash2, Power } from 'lucide-react';

const AlumnosTabla = ({ alumnos, onToggleEstado, onEdit, onDelete, seleccionados, onSelect, onSelectAll }) => {
  const thStyle = { padding: '16px', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, backgroundColor: '#f8fafc', zIndex: 10, fontWeight: '600' };

  // Verifica si todos los alumnos visibles están seleccionados
  const todosSeleccionados = alumnos.length > 0 && seleccionados.length === alumnos.length;

  return (
    <div className="table-card" style={{ background: 'white', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
      <div style={{ maxHeight: 'calc(100vh - 220px)', overflowY: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr>
              {/* Checkbox "Seleccionar Todos" */}
              <th style={{ ...thStyle, paddingLeft: '24px', width: '40px' }}>
                <input 
                  type="checkbox" 
                  checked={todosSeleccionados} 
                  onChange={(e) => onSelectAll(e.target.checked)} 
                  style={{ cursor: 'pointer', transform: 'scale(1.2)' }}
                />
              </th>
              <th style={thStyle}>Alumno</th>
              <th style={thStyle}>Dirección</th>
              <th style={thStyle}>Responsable</th>
              <th style={thStyle}>Ruta</th>
              <th style={thStyle}>Estado</th>
              <th style={{ ...thStyle, paddingRight: '24px' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {alumnos.map(a => (
              <tr key={a.AlumnoID} style={{ borderBottom: '1px solid #f1f5f9', backgroundColor: seleccionados.includes(a.AlumnoID) ? '#f0f9ff' : 'transparent' }}>
                
                {/* Checkbox Individual */}
                <td style={{ padding: '16px 16px 16px 24px' }}>
                  <input 
                    type="checkbox" 
                    checked={seleccionados.includes(a.AlumnoID)} 
                    onChange={() => onSelect(a.AlumnoID)} 
                    style={{ cursor: 'pointer', transform: 'scale(1.2)' }}
                  />
                </td>

                <td style={{ padding: '16px' }}>
                  <div style={{ fontWeight: '700', color: '#0f172a' }}>{a.NombreCompleto}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{a.Grado}</div>
                </td>
                <td style={{ padding: '16px', fontSize: '13px' }}>
                  {a.Direccion}<br/><span style={{ color: 'var(--text-muted)' }}>Ref: {a.PuntoReferencia}</span>
                </td>
                <td style={{ padding: '16px', fontWeight: '500' }}>{a.NombrePadre || 'No asignado'}</td>
                <td style={{ padding: '16px' }}>
                  {a.NombreRuta ? (
                    <span style={{ padding: '4px 8px', borderRadius: '6px', background: '#e0f2fe', color: '#0369a1', fontSize: '12px', fontWeight: '700' }}>
                      {a.NombreRuta}
                    </span>
                  ) : (
                    <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Sin ruta</span>
                  )}
                </td>
                <td style={{ padding: '16px' }}>
                  <span style={{ padding: '4px 12px', borderRadius: '99px', fontSize: '12px', fontWeight: '700', background: a.Estado ? '#d1fae5' : '#fee2e2', color: a.Estado ? '#059669' : '#dc2626' }}>
                    {a.Estado ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td style={{ padding: '16px 24px 16px 16px', display: 'flex', gap: '12px' }}>
                  <button onClick={() => onEdit(a)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)' }}><Edit2 size={20} /></button>
                  <button onClick={() => onToggleEstado(a.AlumnoID, !a.Estado)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: a.Estado ? 'var(--warning)' : 'var(--success)' }}><Power size={20} /></button>
                  <button onClick={() => onDelete(a)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)' }}><Trash2 size={20} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AlumnosTabla;