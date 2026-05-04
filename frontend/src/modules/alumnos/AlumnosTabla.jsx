import React from 'react';
import { Edit2, MapPin, Power, Trash2, AlertTriangle } from 'lucide-react';

const tieneUbicacionCompleta = (alumno) => {
  return Boolean(
    alumno.CasaLatitud &&
    alumno.CasaLongitud &&
    alumno.ColegioLatitud &&
    alumno.ColegioLongitud
  );
};

const AlumnosTabla = ({
  alumnos,
  onToggleEstado,
  onEdit,
  onDelete,
  seleccionados,
  onSelect,
  onSelectAll
}) => {
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

  const todosSeleccionados = alumnos.length > 0 && seleccionados.length === alumnos.length;

  if (!alumnos.length) {
    return (
      <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)', fontWeight: '700' }}>
        No hay alumnos para mostrar.
      </div>
    );
  }

  return (
    <div className="table-wrapper" style={{ width: '100%', overflowX: 'auto' }}>
      <table style={{ width: '100%', minWidth: '1050px', borderCollapse: 'collapse' }}>
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
            <th style={thStyle}>Alumno</th>
            <th style={thStyle}>Dirección</th>
            <th style={thStyle}>Responsable</th>
            <th style={thStyle}>Ruta</th>
            <th style={thStyle}>Ubicación</th>
            <th style={thStyle}>Estado</th>
            <th style={thStyle}>Acciones</th>
          </tr>
        </thead>

        <tbody>
          {alumnos.map((alumno) => {
            const ubicacionCompleta = tieneUbicacionCompleta(alumno);

            return (
              <tr key={alumno.AlumnoID}>
                <td style={{ ...tdStyle, textAlign: 'center' }}>
                  <input
                    type="checkbox"
                    checked={seleccionados.includes(alumno.AlumnoID)}
                    onChange={() => onSelect(alumno.AlumnoID)}
                    style={{ cursor: 'pointer', transform: 'scale(1.15)' }}
                  />
                </td>

                <td style={tdStyle}>
                  <div style={{ fontWeight: '800', color: '#0f172a' }}>
                    {alumno.NombreCompleto}
                  </div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '4px' }}>
                    {[alumno.Grado, alumno.Seccion].filter(Boolean).join(' · ')}
                  </div>
                </td>

                <td style={tdStyle}>
                  <div style={{ color: '#334155', fontWeight: '600', maxWidth: '280px' }}>
                    {alumno.Direccion || 'Sin dirección'}
                  </div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '4px' }}>
                    Ref: {alumno.PuntoReferencia || '—'}
                  </div>
                </td>

                <td style={tdStyle}>
                  {alumno.NombrePadre || 'No asignado'}
                </td>

                <td style={tdStyle}>
                  {alumno.NombreRuta ? (
                    <span
                      style={{
                        display: 'inline-flex',
                        padding: '6px 10px',
                        borderRadius: '999px',
                        background: '#e0f2fe',
                        color: '#0369a1',
                        fontSize: '12px',
                        fontWeight: '800'
                      }}
                    >
                      {alumno.NombreRuta}
                    </span>
                  ) : (
                    <span style={{ color: 'var(--text-muted)', fontWeight: '700' }}>Sin ruta</span>
                  )}
                </td>

                <td style={tdStyle}>
                  {ubicacionCompleta ? (
                    <span
                      title="Casa y colegio tienen ubicación configurada"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '6px 10px',
                        borderRadius: '999px',
                        background: '#d1fae5',
                        color: '#059669',
                        fontSize: '12px',
                        fontWeight: '800'
                      }}
                    >
                      <MapPin size={14} />
                      Completa
                    </span>
                  ) : (
                    <span
                      title="Faltan coordenadas de casa o colegio"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '6px 10px',
                        borderRadius: '999px',
                        background: '#fef3c7',
                        color: '#b45309',
                        fontSize: '12px',
                        fontWeight: '800'
                      }}
                    >
                      <AlertTriangle size={14} />
                      Pendiente
                    </span>
                  )}
                </td>

                <td style={tdStyle}>
                  <span
                    style={{
                      display: 'inline-flex',
                      padding: '6px 10px',
                      borderRadius: '999px',
                      background: alumno.Estado ? '#d1fae5' : '#fee2e2',
                      color: alumno.Estado ? '#059669' : '#dc2626',
                      fontSize: '12px',
                      fontWeight: '800'
                    }}
                  >
                    {alumno.Estado ? 'Activo' : 'Inactivo'}
                  </span>
                </td>

                <td style={tdStyle}>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <button
                      type="button"
                      onClick={() => onEdit(alumno)}
                      title="Editar"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)' }}
                    >
                      <Edit2 size={18} />
                    </button>

                    <button
                      type="button"
                      onClick={() => onToggleEstado(alumno.AlumnoID, !alumno.Estado)}
                      title={alumno.Estado ? 'Desactivar' : 'Activar'}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: alumno.Estado ? 'var(--warning)' : 'var(--success)' }}
                    >
                      <Power size={18} />
                    </button>

                    <button
                      type="button"
                      onClick={() => onDelete(alumno)}
                      title="Eliminar"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)' }}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default AlumnosTabla;
