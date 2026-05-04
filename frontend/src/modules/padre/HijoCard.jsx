import React from 'react';
import { GraduationCap, MapPin, Bus, UserRound } from 'lucide-react';

const detalleStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  color: 'var(--text-muted)',
  fontSize: '14px',
  marginTop: '8px'
};

const HijoCard = ({ hijo }) => {
  const vehiculo = hijo.Placa
    ? `${hijo.Placa}${hijo.Marca ? ` · ${hijo.Marca}` : ''}${hijo.Modelo ? ` ${hijo.Modelo}` : ''}`
    : 'Vehículo no asignado';

  return (
    <div className="card" style={{ height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px' }}>
        <div>
          <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#0f172a' }}>
            {hijo.NombreCompleto}
          </h3>
          <p style={detalleStyle}>
            <GraduationCap size={16} />
            {hijo.Grado || 'Grado no definido'} {hijo.Seccion ? `· Sección ${hijo.Seccion}` : ''}
          </p>
        </div>

        <span style={{
          background: hijo.Estado ? '#d1fae5' : '#fee2e2',
          color: hijo.Estado ? '#059669' : '#dc2626',
          padding: '6px 10px',
          borderRadius: '999px',
          fontSize: '12px',
          fontWeight: '800',
          height: 'fit-content'
        }}>
          {hijo.Estado ? 'Activo' : 'Inactivo'}
        </span>
      </div>

      <div style={{ marginTop: '18px' }}>
        <p style={detalleStyle}><MapPin size={16} /> {hijo.NombreRuta || 'Sin ruta asignada'}</p>
        <p style={detalleStyle}><Bus size={16} /> {vehiculo}</p>
        <p style={detalleStyle}><UserRound size={16} /> {hijo.NombreConductor || 'Conductor no asignado'}</p>
      </div>

      <div style={{
        marginTop: '18px',
        padding: '10px 12px',
        borderRadius: '12px',
        background: '#f8fafc',
        color: '#334155',
        fontWeight: '700',
        fontSize: '13px'
      }}>
        Servicio: {hijo.TipoServicio || 'Ambos'} · Turno: {hijo.Turno || 'No definido'}
      </div>
    </div>
  );
};

export default HijoCard;
