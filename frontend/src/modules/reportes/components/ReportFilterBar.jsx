import React from 'react';
import { Filter, RefreshCw } from 'lucide-react';
import { ESTADOS_MANTENIMIENTO, EVENTOS, SENTIDOS } from '../reportes.constants';
import FilterSearchSelect from './FilterSearchSelect';

const H = 36;

const inputStyle = {
  height: `${H}px`,
  padding: '0 12px',
  fontSize: '13px',
  fontWeight: '700',
  border: '1px solid #e2e8f0',
  borderRadius: '10px',
  background: 'white',
  color: '#0f172a',
  boxSizing: 'border-box',
  outline: 'none',
  maxWidth: '150px',
};

const btnStyle = {
  height: `${H}px`,
  padding: '0 16px',
  fontSize: '13px',
  fontWeight: '800',
  border: 'none',
  borderRadius: '10px',
  background: 'var(--primary, #2563eb)',
  color: 'white',
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  boxSizing: 'border-box',
  flexShrink: 0,
};

/* Convertir arrays de strings a objetos para FilterSearchSelect */
const toOpciones = (arr) => arr.filter(Boolean).map((v) => ({ id: v, label: v }));

const opcionesSentido = toOpciones(SENTIDOS);
const opcionesEvento = toOpciones(EVENTOS);
const opcionesEstado = toOpciones(ESTADOS_MANTENIMIENTO);

const ReportFilterBar = ({
  filters,
  onChange,
  onRefresh,
  loading,
  activeTab,
  rutas = [],
  vehiculos = [],
  conductores = [],
  alumnos = []
}) => {
  const set = (campo, valor) => onChange({ ...filters, [campo]: valor });

  const showRuta = ['resumen', 'uso-rutas', 'viajes', 'turnos'].includes(activeTab);
  const showSentido = ['uso-rutas', 'asistencia-estudiante', 'viajes'].includes(activeTab);
  const showEvento = activeTab === 'asistencia-estudiante';
  const showEstado = activeTab === 'mantenimiento-vehiculos';
  const showAlumno = activeTab === 'asistencia-estudiante';
  const showConductor = ['viajes', 'turnos'].includes(activeTab);
  const showVehiculo = activeTab === 'mantenimiento-vehiculos';

  return (
    <div style={{
      background: 'white',
      borderRadius: '16px',
      padding: '12px 16px',
      marginBottom: '18px',
      display: 'flex',
      gap: '10px',
      alignItems: 'center',
      flexWrap: 'wrap',
      boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    }}>
      <Filter size={18} color="#94a3b8" style={{ flexShrink: 0 }} />

      <input
        type="date"
        value={filters.fechaInicio}
        onChange={(e) => set('fechaInicio', e.target.value)}
        style={inputStyle}
      />
      <input
        type="date"
        value={filters.fechaFin}
        onChange={(e) => set('fechaFin', e.target.value)}
        style={inputStyle}
      />

      {showRuta && (
        <FilterSearchSelect
          value={filters.rutaId}
          options={rutas}
          placeholder="Todas las rutas"
          searchPlaceholder="Buscar ruta..."
          getKey={(r) => r.RutaID}
          getLabel={(r) => r.NombreRuta}
          onChange={(v) => set('rutaId', v)}
        />
      )}

      {showAlumno && (
        <FilterSearchSelect
          value={filters.alumnoId}
          options={alumnos}
          placeholder="Todos los alumnos"
          searchPlaceholder="Buscar alumno..."
          getKey={(a) => a.AlumnoID}
          getLabel={(a) => `${a.Nombre} ${a.Apellido}`}
          onChange={(v) => set('alumnoId', v)}
        />
      )}

      {showConductor && (
        <FilterSearchSelect
          value={filters.conductorId}
          options={conductores}
          placeholder="Todos los conductores"
          searchPlaceholder="Buscar conductor..."
          getKey={(c) => c.ConductorID}
          getLabel={(c) => c.NombreCompleto || `Conductor ${c.ConductorID}`}
          onChange={(v) => set('conductorId', v)}
        />
      )}

      {showVehiculo && (
        <FilterSearchSelect
          value={filters.vehiculoId}
          options={vehiculos}
          placeholder="Todos los vehículos"
          searchPlaceholder="Buscar placa..."
          getKey={(v) => v.VehiculoID}
          getLabel={(v) => `${v.Placa} — ${v.Marca} ${v.Modelo}`}
          onChange={(v) => set('vehiculoId', v)}
        />
      )}

      {showEvento && (
        <FilterSearchSelect
          value={filters.tipoEvento}
          options={opcionesEvento}
          placeholder="Todos los eventos"
          searchPlaceholder="Buscar evento..."
          getKey={(o) => o.id}
          getLabel={(o) => o.label}
          onChange={(v) => set('tipoEvento', v)}
        />
      )}

      {showSentido && (
        <FilterSearchSelect
          value={filters.sentido}
          options={opcionesSentido}
          placeholder="Todos los sentidos"
          searchPlaceholder="Buscar..."
          getKey={(o) => o.id}
          getLabel={(o) => o.label}
          onChange={(v) => set('sentido', v)}
        />
      )}

      {showEstado && (
        <FilterSearchSelect
          value={filters.estado}
          options={opcionesEstado}
          placeholder="Todos los estados"
          searchPlaceholder="Buscar estado..."
          getKey={(o) => o.id}
          getLabel={(o) => o.label}
          onChange={(v) => set('estado', v)}
        />
      )}

      <button
        type="button"
        onClick={onRefresh}
        disabled={loading}
        style={{ ...btnStyle, opacity: loading ? 0.7 : 1 }}
      >
        <RefreshCw size={16} className={loading ? 'spin' : ''} />
        Generar
      </button>
    </div>
  );
};

export default ReportFilterBar;