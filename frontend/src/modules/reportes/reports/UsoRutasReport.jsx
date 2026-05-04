import React from 'react';
import DataTable from '../components/DataTable';
import ReportSection from '../components/ReportSection';
import { formatDateTime } from '../reportes.utils';

const UsoRutasReport = ({ data }) => (
  <>
    <ReportSection title="Resumen de uso por ruta" description="Muestra viajes, alumnos asignados, abordajes y ausencias por ruta." filename="uso_rutas_resumen.csv" exportRows={data?.resumen || []}>
      <DataTable rows={data?.resumen || []} columns={[
        { key: 'NombreRuta', label: 'Ruta' }, { key: 'Turno', label: 'Turno' }, { key: 'Viajes', label: 'Viajes' },
        { key: 'AlumnosAsignados', label: 'Alumnos' }, { key: 'Abordajes', label: 'Abordajes' }, { key: 'Ausencias', label: 'Ausencias' }, { key: 'AvisosAusencia', label: 'Avisos' }
      ]} />
    </ReportSection>
    <ReportSection title="Detalle de viajes por ruta" filename="uso_rutas_detalle.csv" exportRows={data?.detalle || []}>
      <DataTable rows={data?.detalle || []} columns={[
        { key: 'Fecha', label: 'Fecha' }, { key: 'NombreRuta', label: 'Ruta' }, { key: 'Sentido', label: 'Sentido' },
        { key: 'EstadoViaje', label: 'Estado' }, { key: 'Conductor', label: 'Conductor' }, { key: 'Placa', label: 'Bus' },
        { key: 'HoraInicio', label: 'Inicio', render: r => formatDateTime(r.HoraInicio) }, { key: 'HoraFin', label: 'Fin', render: r => formatDateTime(r.HoraFin) }
      ]} />
    </ReportSection>
  </>
);

export default UsoRutasReport;
