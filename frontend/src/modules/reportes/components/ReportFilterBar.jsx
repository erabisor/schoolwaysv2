import React from 'react';
import { Filter, RefreshCw } from 'lucide-react';
import { ESTADOS_MANTENIMIENTO, EVENTOS, SENTIDOS } from '../reportes.constants';

const ReportFilterBar = ({ filters, onChange, onRefresh, loading, activeTab }) => {
  const set = (campo, valor) => onChange({ ...filters, [campo]: valor });
  const showEvento = activeTab === 'asistencia-estudiante';
  const showEstado = activeTab === 'mantenimiento-vehiculos';
  const showSentido = ['uso-rutas', 'asistencia-estudiante', 'viajes'].includes(activeTab);

  return (
    <div className="card" style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
      <Filter size={18} color="var(--text-muted)" />
      <input className="form-input" type="date" value={filters.fechaInicio} onChange={(e) => set('fechaInicio', e.target.value)} style={{ maxWidth: '160px' }} />
      <input className="form-input" type="date" value={filters.fechaFin} onChange={(e) => set('fechaFin', e.target.value)} style={{ maxWidth: '160px' }} />
      <input className="form-input" placeholder="RutaID" value={filters.rutaId} onChange={(e) => set('rutaId', e.target.value)} style={{ maxWidth: '110px' }} />
      {activeTab === 'asistencia-estudiante' && <input className="form-input" placeholder="AlumnoID" value={filters.alumnoId} onChange={(e) => set('alumnoId', e.target.value)} style={{ maxWidth: '120px' }} />}
      {['viajes', 'turnos'].includes(activeTab) && <input className="form-input" placeholder="ConductorID" value={filters.conductorId} onChange={(e) => set('conductorId', e.target.value)} style={{ maxWidth: '140px' }} />}
      {activeTab === 'mantenimiento-vehiculos' && <input className="form-input" placeholder="VehiculoID" value={filters.vehiculoId} onChange={(e) => set('vehiculoId', e.target.value)} style={{ maxWidth: '130px' }} />}
      {showEvento && <select className="form-input" value={filters.tipoEvento} onChange={(e) => set('tipoEvento', e.target.value)} style={{ maxWidth: '170px' }}>{EVENTOS.map(e => <option key={e || 'todos'} value={e}>{e || 'Todos los eventos'}</option>)}</select>}
      {showSentido && <select className="form-input" value={filters.sentido} onChange={(e) => set('sentido', e.target.value)} style={{ maxWidth: '150px' }}>{SENTIDOS.map(s => <option key={s || 'todos'} value={s}>{s || 'Todos los sentidos'}</option>)}</select>}
      {showEstado && <select className="form-input" value={filters.estado} onChange={(e) => set('estado', e.target.value)} style={{ maxWidth: '190px' }}>{ESTADOS_MANTENIMIENTO.map(s => <option key={s || 'todos'} value={s}>{s || 'Todos los estados'}</option>)}</select>}
      <button type="button" className="btn-secondary" onClick={onRefresh} disabled={loading}>
        <RefreshCw size={17} color="var(--primary)" />
        Generar
      </button>
    </div>
  );
};

export default ReportFilterBar;
