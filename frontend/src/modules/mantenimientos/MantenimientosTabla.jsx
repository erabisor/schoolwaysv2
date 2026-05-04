import React from 'react';
import { AlertTriangle, CheckCircle, Clock, Edit2, PlayCircle, Trash2, Wrench, XCircle } from 'lucide-react';

const SIGUIENTE_ESTADO = {
  Programado: 'En Proceso',
  'En Proceso': 'Completado'
};

const getEstadoStyle = (estado) => {
  const estilos = {
    Programado: { bg: '#dbeafe', color: '#2563eb', icon: <Clock size={14} /> },
    'En Proceso': { bg: '#fef3c7', color: '#d97706', icon: <Wrench size={14} /> },
    Completado: { bg: '#d1fae5', color: '#059669', icon: <CheckCircle size={14} /> },
    Cancelado: { bg: '#fee2e2', color: '#dc2626', icon: <XCircle size={14} /> }
  };

  return estilos[estado] || { bg: '#f1f5f9', color: '#64748b', icon: null };
};

const getPrioridadStyle = (prioridad) => {
  const estilos = {
    Baja: { bg: '#f1f5f9', color: '#64748b' },
    Media: { bg: '#dbeafe', color: '#2563eb' },
    Alta: { bg: '#fef3c7', color: '#d97706' },
    Crítica: { bg: '#fee2e2', color: '#dc2626' }
  };

  return estilos[prioridad] || estilos.Media;
};

const formatearFecha = (fecha) => {
  if (!fecha) return '—';
  return new Date(fecha).toLocaleDateString('es-SV', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const formatearCosto = (valor) => {
  if (valor === null || valor === undefined) return '—';
  return Number(valor).toLocaleString('es-SV', { style: 'currency', currency: 'USD' });
};

const thStyle = {
  padding: '16px',
  borderBottom: '1px solid var(--border)',
  background: '#f8fafc',
  color: 'var(--text-muted)',
  fontWeight: '800',
  fontSize: '13px',
  textAlign: 'left',
  position: 'sticky',
  top: 0,
  zIndex: 5,
  whiteSpace: 'nowrap'
};

const tdStyle = {
  padding: '16px',
  borderBottom: '1px solid var(--border)',
  verticalAlign: 'top'
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

const MantenimientosTabla = ({ mantenimientos, onEdit, onDelete, onCambiarEstado }) => {
  if (!mantenimientos.length) {
    return (
      <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)', fontWeight: '700' }}>
        No hay mantenimientos registrados con los filtros actuales.
      </div>
    );
  }

  return (
    <div className="table-wrapper" style={{ width: '100%', overflowX: 'auto' }}>
      <table style={{ width: '100%', minWidth: '1180px', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={thStyle}>Vehículo</th>
            <th style={thStyle}>Tipo</th>
            <th style={thStyle}>Estado</th>
            <th style={thStyle}>Prioridad</th>
            <th style={thStyle}>Programación</th>
            <th style={thStyle}>Kilometraje</th>
            <th style={thStyle}>Coste</th>
            <th style={thStyle}>Taller / Responsable</th>
            <th style={thStyle}>Acciones</th>
          </tr>
        </thead>

        <tbody>
          {mantenimientos.map((mantenimiento) => {
            const estadoStyle = getEstadoStyle(mantenimiento.EstadoMantenimiento);
            const prioridadStyle = getPrioridadStyle(mantenimiento.Prioridad);
            const siguienteEstado = SIGUIENTE_ESTADO[mantenimiento.EstadoMantenimiento];

            return (
              <tr key={mantenimiento.MantenimientoID}>
                <td style={tdStyle}>
                  <div style={{ fontWeight: '900', color: '#0f172a' }}>{mantenimiento.Placa || 'Sin placa'}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '4px' }}>
                    {[mantenimiento.Marca, mantenimiento.Modelo].filter(Boolean).join(' ') || 'Vehículo'}
                  </div>
                </td>

                <td style={tdStyle}>
                  <div style={{ fontWeight: '800', color: '#0f172a' }}>{mantenimiento.TipoMantenimiento}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '4px', maxWidth: '260px' }}>
                    {mantenimiento.Descripcion || 'Sin descripción'}
                  </div>
                </td>

                <td style={tdStyle}>
                  <span style={{ ...badgeBase, background: estadoStyle.bg, color: estadoStyle.color }}>
                    {estadoStyle.icon}
                    {mantenimiento.EstadoMantenimiento}
                  </span>
                </td>

                <td style={tdStyle}>
                  <span style={{ ...badgeBase, background: prioridadStyle.bg, color: prioridadStyle.color }}>
                    {mantenimiento.Prioridad === 'Crítica' && <AlertTriangle size={14} />}
                    {mantenimiento.Prioridad}
                  </span>
                </td>

                <td style={tdStyle}>
                  <div>Programada: {formatearFecha(mantenimiento.FechaProgramada)}</div>
                  <div>Inicio: {formatearFecha(mantenimiento.FechaInicio)}</div>
                  <div>Finalización: {formatearFecha(mantenimiento.FechaFinalizacion)}</div>
                  <div>Próximo: {formatearFecha(mantenimiento.ProximoMantenimiento)}</div>
                </td>

                <td style={tdStyle}>
                  {mantenimiento.Kilometraje !== null && mantenimiento.Kilometraje !== undefined
                    ? Number(mantenimiento.Kilometraje).toLocaleString('es-SV')
                    : '—'}
                </td>

                <td style={tdStyle}>{formatearCosto(mantenimiento.Costo)}</td>

                <td style={tdStyle}>
                  <div>Taller: {mantenimiento.Taller || '—'}</div>
                  <div>Responsable: {mantenimiento.Responsable || '—'}</div>
                  <div>Registró: {mantenimiento.UsuarioRegistro || '—'}</div>
                </td>

                <td style={tdStyle}>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                    {siguienteEstado && (
                      <button
                        type="button"
                        onClick={() => onCambiarEstado(mantenimiento, siguienteEstado)}
                        title={`Cambiar a ${siguienteEstado}`}
                        style={{ background: '#eff6ff', border: 'none', borderRadius: '8px', padding: '7px', cursor: 'pointer', color: 'var(--primary)' }}
                      >
                        <PlayCircle size={17} />
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => onEdit(mantenimiento)}
                      title="Editar"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)' }}
                    >
                      <Edit2 size={18} />
                    </button>

                    <button
                      type="button"
                      onClick={() => onDelete(mantenimiento)}
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

export default MantenimientosTabla;
