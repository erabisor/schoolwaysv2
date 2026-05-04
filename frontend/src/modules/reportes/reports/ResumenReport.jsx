import React from 'react';
import KpiGrid from '../components/KpiGrid';
import DataTable from '../components/DataTable';
import ReportSection from '../components/ReportSection';

const ResumenReport = ({ data }) => {
  const k = data?.kpis || {};
  const items = [
    { label: 'Alumnos activos', value: k.AlumnosActivos, color: '#2563eb' },
    { label: 'Rutas activas', value: k.RutasActivas, color: '#059669' },
    { label: 'Viajes', value: k.TotalViajes, color: '#7c3aed' },
    { label: 'Eventos asistencia', value: k.TotalEventos, color: '#0f172a' },
    { label: 'Ausencias', value: k.TotalAusencias, color: '#dc2626' },
    { label: 'Mantenimientos críticos', value: k.MantenimientosCriticos, color: '#dc2626' }
  ];
  return (
    <>
      <KpiGrid items={items} />
      <ReportSection title="Top rutas por uso" filename="top_rutas.csv" exportRows={data?.topRutas || []}>
        <DataTable rows={data?.topRutas || []} columns={[{ key: 'NombreRuta', label: 'Ruta' }, { key: 'Viajes', label: 'Viajes' }]} />
      </ReportSection>
      <ReportSection title="Eventos por día" filename="eventos_por_dia.csv" exportRows={data?.eventosPorDia || []}>
        <DataTable rows={data?.eventosPorDia || []} columns={[{ key: 'Fecha', label: 'Fecha' }, { key: 'TipoEvento', label: 'Evento' }, { key: 'Total', label: 'Total' }]} />
      </ReportSection>
    </>
  );
};

export default ResumenReport;
