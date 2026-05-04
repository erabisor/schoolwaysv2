import React from 'react';
import { AlertTriangle, Edit2, Power, Trash2, Wrench } from 'lucide-react';

const thStyle = {
  padding: '16px',
  borderBottom: '1px solid var(--border)',
  position: 'sticky',
  top: 0,
  backgroundColor: '#f8fafc',
  zIndex: 10,
  fontWeight: '800',
  fontSize: '14px',
  color: '#0f172a',
  textAlign: 'left',
  whiteSpace: 'nowrap'
};

const tdStyle = {
  padding: '16px',
  borderBottom: '1px solid var(--border)',
  verticalAlign: 'middle'
};

const badgeBase = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  padding: '6px 10px',
  borderRadius: '999px',
  fontSize: '12px',
  fontWeight: '800',
  whiteSpace: 'nowrap'
};

const estaEnMantenimiento = (ruta) => {
  return Boolean(
    ruta.VehiculoEnMantenimiento ||
    ruta.MantenimientoID ||
    ruta.EstadoMantenimiento === 'En Proceso'
  );
};

const RutasTabla = ({
  rutas,
  onToggleEstado,
  onEdit,
  onDelete,
  seleccionados,
  onSelect,
  onSelectAll
}) => {
  const todosSeleccionados = rutas.length > 0 && seleccionados.length === rutas.length;

  const renderConductor = (ruta) => {
    if (ruta.NombreConductor) {
      return <span style={{ color: '#334155', fontWeight: '700' }}>{ruta.NombreConductor}</span>;
    }

    return (
      <span
        title="Esta ruta activa no tiene conductor asignado"
        style={{ ...badgeBase, background: '#fef3c7', color: '#b45309' }}
      >
        <AlertTriangle size={14} />
        Sin conductor
      </span>
    );
  };

  const renderVehiculo = (ruta) => {
    const capacidadBus = ruta.CapacidadBus || '?';
    const capacidadMaxima = ruta.CapacidadMaxima ?? '?';
    const sobrecupo = Number(ruta.CapacidadMaxima) > Number(ruta.CapacidadBus || 0);
    const vehiculoFueraServicio = ruta.EstadoVehiculo === false || ruta.EstadoVehiculo === 0;
    const vehiculoEnMantenimiento = estaEnMantenimiento(ruta);

    return (
      <div>
        <div style={{ fontWeight: '800', color: '#0f172a' }}>{ruta.Placa || 'N/A'}</div>

        <div
          style={{
            color: sobrecupo ? '#dc2626' : 'var(--text-muted)',
            fontSize: '13px',
            marginTop: '4px',
            fontWeight: sobrecupo ? '800' : '600'
          }}
        >
          Cap: {capacidadMaxima}/{capacidadBus}
        </div>

        {sobrecupo && (
          <div
            style={{
              marginTop: '6px',
              color: '#dc2626',
              fontSize: '12px',
              fontWeight: '800',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}
          >
            <AlertTriangle size={13} />
            Sobrecupo
          </div>
        )}

        {vehiculoFueraServicio && (
          <div
            style={{
              marginTop: '6px',
              ...badgeBase,
              background: '#fee2e2',
              color: '#dc2626'
            }}
            title="Vehículo fuera de servicio"
          >
            <Wrench size={13} />
            Fuera de servicio
          </div>
        )}

        {vehiculoEnMantenimiento && (
          <div
            style={{
              marginTop: '6px',
              ...badgeBase,
              background: '#fee2e2',
              color: '#dc2626'
            }}
            title={ruta.PrioridadMantenimiento ? `Prioridad: ${ruta.PrioridadMantenimiento}` : 'Vehículo en mantenimiento'}
          >
            <Wrench size={13} />
            {ruta.EstadoMantenimiento || 'En mantenimiento'}
          </div>
        )}
      </div>
    );
  };

  const renderEstado = (ruta) => (
    <span
      style={{
        ...badgeBase,
        background: ruta.Estado ? '#d1fae5' : '#fee2e2',
        color: ruta.Estado ? '#059669' : '#dc2626'
      }}
    >
      {ruta.Estado ? 'Activa' : 'Inactiva'}
    </span>
  );

  if (!rutas.length) {
    return (
      <div
        style={{
          padding: '32px',
          textAlign: 'center',
          color: 'var(--text-muted)',
          fontWeight: '700'
        }}
      >
        No hay rutas para mostrar.
      </div>
    );
  }

  return (
    <div className="table-wrapper" style={{ width: '100%', overflowX: 'auto' }}>
      <table
        style={{
          width: '100%',
          minWidth: '1080px',
          borderCollapse: 'collapse',
          tableLayout: 'fixed'
        }}
      >
        <colgroup>
          <col style={{ width: '48px' }} />
          <col style={{ width: '30%' }} />
          <col style={{ width: '90px' }} />
          <col style={{ width: '190px' }} />
          <col style={{ width: '220px' }} />
          <col style={{ width: '110px' }} />
          <col style={{ width: '120px' }} />
        </colgroup>

        <thead>
          <tr>
            <th style={{ ...thStyle, textAlign: 'center' }}>
              <input
                type="checkbox"
                checked={todosSeleccionados}
                onChange={(event) => onSelectAll(event.target.checked)}
                style={{ cursor: 'pointer', transform: 'scale(1.1)' }}
              />
            </th>
            <th style={thStyle}>Ruta</th>
            <th style={thStyle}>Turno</th>
            <th style={thStyle}>Conductor</th>
            <th style={thStyle}>Vehículo</th>
            <th style={thStyle}>Estado</th>
            <th style={thStyle}>Acciones</th>
          </tr>
        </thead>

        <tbody>
          {rutas.map((ruta) => (
            <tr key={ruta.RutaID}>
              <td style={{ ...tdStyle, textAlign: 'center' }}>
                <input
                  type="checkbox"
                  checked={seleccionados.includes(ruta.RutaID)}
                  onChange={() => onSelect(ruta.RutaID)}
                  style={{ cursor: 'pointer', transform: 'scale(1.1)' }}
                />
              </td>

              <td style={tdStyle}>
                <div
                  style={{
                    fontWeight: '800',
                    color: '#0f172a',
                    lineHeight: 1.3,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                  title={ruta.NombreRuta}
                >
                  {ruta.NombreRuta}
                </div>

                <div
                  style={{
                    color: 'var(--text-muted)',
                    fontSize: '13px',
                    marginTop: '5px',
                    lineHeight: 1.35,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                  title={ruta.Descripcion || ''}
                >
                  {ruta.Descripcion || 'Sin descripción'}
                </div>
              </td>

              <td style={tdStyle}>
                <span style={{ fontWeight: '800', color: '#334155' }}>{ruta.Turno || '—'}</span>
              </td>

              <td style={tdStyle}>{renderConductor(ruta)}</td>
              <td style={tdStyle}>{renderVehiculo(ruta)}</td>
              <td style={tdStyle}>{renderEstado(ruta)}</td>

              <td style={tdStyle}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => onEdit(ruta)}
                    title="Editar"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)', padding: '4px' }}
                  >
                    <Edit2 size={18} />
                  </button>

                  <button
                    type="button"
                    onClick={() => onToggleEstado(ruta.RutaID, !ruta.Estado)}
                    title={ruta.Estado ? 'Desactivar' : 'Activar'}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: ruta.Estado ? 'var(--warning)' : 'var(--success)', padding: '4px' }}
                  >
                    <Power size={18} />
                  </button>

                  <button
                    type="button"
                    onClick={() => onDelete(ruta)}
                    title="Eliminar"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', padding: '4px' }}
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

export default RutasTabla;
