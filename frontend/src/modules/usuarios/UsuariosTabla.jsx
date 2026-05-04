import React from 'react';
import { Edit2, Power, Trash2 } from 'lucide-react';

const thStyle = {
  padding: '16px',
  borderBottom: '1px solid var(--border)',
  position: 'sticky',
  top: 0,
  backgroundColor: '#f8fafc',
  zIndex: 10,
  fontWeight: '800',
  color: '#0f172a',
  textAlign: 'left',
  whiteSpace: 'nowrap'
};

const tdStyle = {
  padding: '16px',
  borderBottom: '1px solid var(--border)',
  verticalAlign: 'middle'
};

const UsuariosTabla = ({
  usuarios,
  onToggleEstado,
  onEdit,
  onDelete,
  seleccionados,
  onSelect,
  onSelectAll
}) => {
  const todosSeleccionados = usuarios.length > 0 && seleccionados.length === usuarios.length;

  if (!usuarios.length) {
    return (
      <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)', fontWeight: '700' }}>
        No hay usuarios para mostrar.
      </div>
    );
  }

  return (
    <div className="table-wrapper" style={{ width: '100%', overflowX: 'auto' }}>
      <table style={{ width: '100%', minWidth: '900px', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ ...thStyle, width: '48px', textAlign: 'center' }}>
              <input
                type="checkbox"
                checked={todosSeleccionados}
                onChange={(event) => onSelectAll(event.target.checked)}
                style={{ cursor: 'pointer', transform: 'scale(1.15)' }}
              />
            </th>
            <th style={thStyle}>Nombre</th>
            <th style={thStyle}>Correo</th>
            <th style={thStyle}>Teléfono</th>
            <th style={thStyle}>Rol</th>
            <th style={thStyle}>Estado</th>
            <th style={thStyle}>Acciones</th>
          </tr>
        </thead>

        <tbody>
          {usuarios.map((usuario) => (
            <tr key={usuario.UsuarioID}>
              <td style={{ ...tdStyle, textAlign: 'center' }}>
                <input
                  type="checkbox"
                  checked={seleccionados.includes(usuario.UsuarioID)}
                  onChange={() => onSelect(usuario.UsuarioID)}
                  style={{ cursor: 'pointer', transform: 'scale(1.15)' }}
                />
              </td>

              <td style={tdStyle}>
                <div style={{ fontWeight: '800', color: '#0f172a' }}>{usuario.NombreCompleto}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '4px' }}>
                  ID: {usuario.UsuarioID}
                </div>
              </td>

              <td style={tdStyle}>{usuario.CorreoElectronico}</td>
              <td style={tdStyle}>{usuario.Telefono || '—'}</td>
              <td style={tdStyle}>{usuario.NombreRol}</td>

              <td style={tdStyle}>
                <span
                  style={{
                    display: 'inline-flex',
                    padding: '6px 10px',
                    borderRadius: '999px',
                    background: usuario.Estado ? '#d1fae5' : '#fee2e2',
                    color: usuario.Estado ? '#059669' : '#dc2626',
                    fontSize: '12px',
                    fontWeight: '800'
                  }}
                >
                  {usuario.Estado ? 'Activo' : 'Inactivo'}
                </span>
              </td>

              <td style={tdStyle}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => onEdit(usuario)}
                    title="Editar"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)' }}
                  >
                    <Edit2 size={18} />
                  </button>

                  <button
                    type="button"
                    onClick={() => onToggleEstado(usuario.UsuarioID, !usuario.Estado)}
                    title={usuario.Estado ? 'Desactivar' : 'Activar'}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: usuario.Estado ? 'var(--warning)' : 'var(--success)' }}
                  >
                    <Power size={18} />
                  </button>

                  <button
                    type="button"
                    onClick={() => onDelete(usuario)}
                    title="Eliminar"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)' }}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default UsuariosTabla;
