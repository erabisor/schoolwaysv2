import React from 'react';
import { Edit2, Trash2, Power } from 'lucide-react';

const UsuariosTabla = ({ usuarios, onToggleEstado, onEdit, onDelete, seleccionados, onSelect, onSelectAll }) => {
  const thStyle = { padding: '16px', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, backgroundColor: '#f8fafc', zIndex: 10, fontWeight: '600' };
  const todosSeleccionados = usuarios.length > 0 && seleccionados.length === usuarios.length;

  return (
    <div style={{ background: 'white', borderRadius: '16px 16px 0 0', overflow: 'hidden' }}>
      <div style={{ maxHeight: 'calc(100vh - 220px)', overflowY: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr>
              <th style={{ ...thStyle, paddingLeft: '24px', width: '40px' }}>
                <input type="checkbox" checked={todosSeleccionados} onChange={(e) => onSelectAll(e.target.checked)} style={{ cursor: 'pointer', transform: 'scale(1.2)' }} />
              </th>
              <th style={thStyle}>Nombre</th>
              <th style={thStyle}>Correo</th>
              <th style={thStyle}>Rol</th>
              <th style={thStyle}>Estado</th>
              <th style={{ ...thStyle, paddingRight: '24px' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map(u => (
              <tr key={u.UsuarioID} style={{ borderBottom: '1px solid #f1f5f9', backgroundColor: seleccionados.includes(u.UsuarioID) ? '#f0f9ff' : 'transparent' }}>
                <td style={{ padding: '16px 16px 16px 24px' }}>
                  <input type="checkbox" checked={seleccionados.includes(u.UsuarioID)} onChange={() => onSelect(u.UsuarioID)} style={{ cursor: 'pointer', transform: 'scale(1.2)' }} />
                </td>
                <td style={{ padding: '16px', fontWeight: '500' }}>{u.NombreCompleto}</td>
                <td style={{ padding: '16px', color: 'var(--text-muted)' }}>{u.CorreoElectronico}</td>
                <td style={{ padding: '16px' }}>{u.NombreRol}</td>
                <td style={{ padding: '16px' }}>
                  <span style={{ padding: '4px 12px', borderRadius: '99px', fontSize: '12px', fontWeight: '700', background: u.Estado ? '#d1fae5' : '#fee2e2', color: u.Estado ? '#059669' : '#dc2626' }}>
                    {u.Estado ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td style={{ padding: '16px 24px 16px 16px', display: 'flex', gap: '12px' }}>
                  <button onClick={() => onEdit(u)} title="Editar" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)' }}><Edit2 size={20} /></button>
                  <button onClick={() => onToggleEstado(u.UsuarioID, !u.Estado)} title={u.Estado ? "Desactivar" : "Activar"} style={{ background: 'none', border: 'none', cursor: 'pointer', color: u.Estado ? 'var(--warning)' : 'var(--success)' }}><Power size={20} /></button>
                  <button onClick={() => onDelete(u)} title="Eliminar" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)' }}><Trash2 size={20} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UsuariosTabla;