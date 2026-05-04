import React from 'react';
import { CalendarDays } from 'lucide-react';

const getBadgeStyle = (evento) => {
  const estilos = {
    Abordó: { background: '#d1fae5', color: '#059669' },
    Bajó: { background: '#dbeafe', color: '#2563eb' },
    Ausente: { background: '#fee2e2', color: '#dc2626' },
    AvisóAusencia: { background: '#fef3c7', color: '#d97706' }
  };

  return estilos[evento] || { background: '#f1f5f9', color: '#64748b' };
};

const formatearFecha = (fecha) => {
  if (!fecha) return 'Sin fecha';
  return new Date(fecha).toLocaleDateString('es-SV', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit'
  });
};

const formatearHora = (fecha) => {
  if (!fecha) return '--:--';
  return new Date(fecha).toLocaleTimeString('es-SV', {
    hour: '2-digit',
    minute: '2-digit'
  });
};

const HistorialSemanal = ({ historial }) => {
  if (!historial.length) {
    return (
      <div className="card" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
        <CalendarDays size={36} style={{ marginBottom: '10px' }} />
        <p style={{ fontWeight: '700' }}>No hay registros en los últimos 7 días.</p>
      </div>
    );
  }

  return (
    <div className="table-card">
      <div style={{
        padding: '18px 22px',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        fontWeight: '800'
      }}>
        <CalendarDays size={20} color="var(--primary)" />
        Historial semanal
      </div>

      <div className="table-wrapper">
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ background: '#f8fafc', color: 'var(--text-muted)' }}>
            <tr>
              <th style={{ padding: '14px', textAlign: 'left' }}>Fecha</th>
              <th style={{ padding: '14px', textAlign: 'left' }}>Alumno</th>
              <th style={{ padding: '14px', textAlign: 'left' }}>Ruta</th>
              <th style={{ padding: '14px', textAlign: 'left' }}>Sentido</th>
              <th style={{ padding: '14px', textAlign: 'left' }}>Evento</th>
              <th style={{ padding: '14px', textAlign: 'left' }}>Hora</th>
            </tr>
          </thead>

          <tbody>
            {historial.map((item) => {
              const badge = getBadgeStyle(item.TipoEvento);

              return (
                <tr key={item.AsistenciaID} style={{ borderTop: '1px solid var(--border)' }}>
                  <td style={{ padding: '14px', fontWeight: '700' }}>
                    {formatearFecha(item.FechaHora)}
                  </td>
                  <td style={{ padding: '14px' }}>{item.NombreCompleto}</td>
                  <td style={{ padding: '14px' }}>{item.NombreRuta || 'Sin ruta'}</td>
                  <td style={{ padding: '14px' }}>{item.Sentido || 'N/A'}</td>
                  <td style={{ padding: '14px' }}>
                    <span style={{
                      ...badge,
                      padding: '5px 10px',
                      borderRadius: '999px',
                      fontSize: '12px',
                      fontWeight: '800'
                    }}>
                      {item.TipoEvento}
                    </span>
                  </td>
                  <td style={{ padding: '14px' }}>{formatearHora(item.FechaHora)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default HistorialSemanal;
