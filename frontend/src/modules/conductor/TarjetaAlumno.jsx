import React from 'react';
import { CheckCircle, LogOut, XCircle, BellOff, RotateCcw } from 'lucide-react';

const TarjetaAlumno = ({ alumno, evento, sentido, conductorId, rutaId, turno, onRegistrar, onDeshacer }) => {
  const tipoEvento = evento?.TipoEvento;
  const abordó     = tipoEvento === 'Abordó';
  const bajó       = tipoEvento === 'Bajó';
  const noAsistio  = tipoEvento === 'Ausente';
  const avisoPrev  = tipoEvento === 'AvisóAusencia';
  const hecho      = abordó || bajó || noAsistio || avisoPrev;

  // Color del borde y fondo según estado actual
  const estiloEstado = bajó       ? { bg: '#f0fdf4', border: '#10b981', label: 'Bajó / Llegó', labelColor: '#059669' }
    : abordó     ? { bg: '#eff6ff', border: '#2563eb', label: 'Abordó',       labelColor: '#1d4ed8' }
    : noAsistio  ? { bg: '#fef2f2', border: '#ef4444', label: 'No asistió',   labelColor: '#dc2626' }
    : avisoPrev  ? { bg: '#fffbeb', border: '#f59e0b', label: 'Avisó ausencia', labelColor: '#d97706' }
    : { bg: 'white', border: '#e2e8f0', label: '', labelColor: '' };

  const registrar = (tipo) => onRegistrar({
    AlumnoID: alumno.AlumnoID, ConductorID: conductorId,
    RutaID: rutaId, Sentido: sentido, TipoEvento: tipo,
    Turno: turno, Observaciones: ''
  });

  return (
    <div style={{
      background: estiloEstado.bg, border: `2px solid ${estiloEstado.border}`,
      borderRadius: '14px', padding: '14px 18px', transition: 'all 0.2s'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <p style={{ fontWeight: '800', color: '#0f172a', margin: 0, fontSize: '14px' }}>
              {alumno.NombreCompleto}
            </p>
            {hecho && (
              <span style={{
                padding: '2px 8px', borderRadius: '99px', fontSize: '11px', fontWeight: '700',
                background: estiloEstado.border, color: 'white'
              }}>
                {estiloEstado.label}
              </span>
            )}
          </div>
          <p style={{ color: 'var(--text-muted)', margin: '2px 0 0', fontSize: '12px' }}>
            {alumno.Grado} — {alumno.PuntoReferencia || alumno.Direccion}
          </p>
        </div>

        {/* Botones */}
        <div style={{ display: 'flex', gap: '6px', flexShrink: 0, flexWrap: 'wrap', justifyContent: 'flex-end' }}>

          {/* Deshacer — si ya tiene evento */}
          {hecho && (
            <button onClick={() => onDeshacer({ alumnoId: alumno.AlumnoID, rutaId, sentido, tipoEvento })}
              title="Deshacer" style={{
                background: '#f1f5f9', border: 'none', borderRadius: '8px',
                padding: '7px', cursor: 'pointer', color: 'var(--text-muted)'
              }}>
              <RotateCcw size={14} />
            </button>
          )}

          {/* Sin evento — mostrar todas las opciones */}
          {!hecho && <>
            <button onClick={() => registrar('Abordó')} title="Abordó el bus" style={{
              background: '#2563eb', color: 'white', border: 'none', borderRadius: '8px',
              padding: '7px 11px', fontWeight: '700', fontSize: '12px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '4px'
            }}>
              <CheckCircle size={13} /> Abordó
            </button>

            <button onClick={() => registrar('Ausente')} title="No asistió" style={{
              background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '8px',
              padding: '7px 11px', fontWeight: '700', fontSize: '12px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '4px'
            }}>
              <XCircle size={13} /> No asistió
            </button>

            <button onClick={() => registrar('AvisóAusencia')} title="Avisó ausencia" style={{
              background: '#fffbeb', color: '#d97706', border: '1px solid #fcd34d', borderRadius: '8px',
              padding: '7px 11px', fontWeight: '700', fontSize: '12px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '4px'
            }}>
              <BellOff size={13} /> Avisó
            </button>
          </>}

          {/* Abordó → mostrar Bajó/Llegó */}
          {abordó && (
            <button onClick={() => registrar('Bajó')}
              title={sentido === 'Ida' ? 'Llegó al colegio' : 'Llegó a casa'} style={{
                background: '#10b981', color: 'white', border: 'none', borderRadius: '8px',
                padding: '7px 11px', fontWeight: '700', fontSize: '12px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '4px'
              }}>
              <LogOut size={13} /> {sentido === 'Ida' ? 'Llegó' : 'Bajó'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TarjetaAlumno;