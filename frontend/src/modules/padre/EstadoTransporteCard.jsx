import React from 'react';
import { Clock, Route, UserRound, CheckCircle, AlertTriangle } from 'lucide-react';

const EVENTO_CONFIG = {
  Abordó: { texto: 'Abordó el bus', bg: '#d1fae5', color: '#059669' },
  Bajó: { texto: 'Bajó del bus', bg: '#dbeafe', color: '#2563eb' },
  Ausente: { texto: 'Marcado ausente', bg: '#fee2e2', color: '#dc2626' },
  AvisóAusencia: { texto: 'Avisó ausencia', bg: '#fef3c7', color: '#d97706' }
};

const formatearHora = (fecha) => {
  if (!fecha) return 'Sin hora';
  return new Date(fecha).toLocaleTimeString('es-SV', {
    hour: '2-digit',
    minute: '2-digit'
  });
};

const EstadoTransporteCard = ({ estado }) => {
  const config = EVENTO_CONFIG[estado.TipoEvento] || {
    texto: estado.EstadoViaje === 'En Curso' ? 'Viaje en curso' : 'Sin actividad hoy',
    bg: estado.EstadoViaje === 'En Curso' ? '#e0f2fe' : '#f1f5f9',
    color: estado.EstadoViaje === 'En Curso' ? '#0369a1' : '#64748b'
  };

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px' }}>
        <div>
          <h3 style={{ fontSize: '1.05rem', fontWeight: '800', color: '#0f172a' }}>
            {estado.NombreCompleto}
          </h3>
          <p style={{ color: 'var(--text-muted)', marginTop: '4px', fontSize: '14px' }}>
            {estado.NombreRuta || 'Sin ruta asignada'}
          </p>
        </div>

        <span style={{
          background: config.bg,
          color: config.color,
          padding: '7px 11px',
          borderRadius: '999px',
          fontSize: '12px',
          fontWeight: '800',
          height: 'fit-content',
          whiteSpace: 'nowrap'
        }}>
          {config.texto}
        </span>
      </div>

      <div style={{ marginTop: '18px', display: 'grid', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#475569' }}>
          <Clock size={16} />
          <span>{estado.FechaHora ? formatearHora(estado.FechaHora) : 'Sin registro de evento'}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#475569' }}>
          <Route size={16} />
          <span>{estado.Sentido || estado.SentidoViaje || 'Sin sentido definido'}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#475569' }}>
          <UserRound size={16} />
          <span>{estado.NombreConductor || 'Conductor no asignado'}</span>
        </div>
      </div>

      {estado.EstadoViaje === 'En Curso' && (
        <div style={{
          marginTop: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          color: '#0369a1',
          fontWeight: '700'
        }}>
          <CheckCircle size={16} />
          Transporte activo en este momento
        </div>
      )}

      {!estado.TipoEvento && !estado.EstadoViaje && (
        <div style={{
          marginTop: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          color: '#64748b',
          fontWeight: '700'
        }}>
          <AlertTriangle size={16} />
          Aún no hay eventos registrados hoy
        </div>
      )}
    </div>
  );
};

export default EstadoTransporteCard;
