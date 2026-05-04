import React from 'react';
import DataTable from '../components/DataTable';
import ReportSection from '../components/ReportSection';
import { formatDateTime } from '../reportes.utils';

const AsistenciaEstudianteReport = ({ data }) => (
  <>
    <ReportSection title="Resumen por estudiante" filename="asistencia_estudiante_resumen.csv" exportRows={data?.resumen || []}>
      <DataTable rows={data?.resumen || []} columns={[
        { key: 'Alumno', label: 'Estudiante' }, { key: 'Grado', label: 'Grado' }, { key: 'Seccion', label: 'Sección' },
        { key: 'NombreRuta', label: 'Ruta' }, { key: 'Abordajes', label: 'Abordó' }, { key: 'Bajadas', label: 'Bajó' },
        { key: 'Ausencias', label: 'Ausente' }, { key: 'AvisosAusencia', label: 'Avisó ausencia' }, { key: 'TotalEventos', label: 'Total' }
      ]} />
    </ReportSection>
    <ReportSection title="Detalle de eventos" filename="asistencia_estudiante_detalle.csv" exportRows={data?.detalle || []}>
      <DataTable rows={data?.detalle || []} columns={[
        { key: 'FechaHora', label: 'Fecha/hora', render: r => formatDateTime(r.FechaHora) }, { key: 'Alumno', label: 'Estudiante' },
        { key: 'NombreRuta', label: 'Ruta' }, { key: 'Conductor', label: 'Conductor' }, { key: 'Sentido', label: 'Sentido' },
        { key: 'TipoEvento', label: 'Evento' }, { key: 'Observaciones', label: 'Observaciones' }
      ]} />
    </ReportSection>
  </>
);

export default AsistenciaEstudianteReport;
