import React from 'react';
import DataTable from '../components/DataTable';
import ReportSection from '../components/ReportSection';
import { formatDate, formatDateTime } from '../reportes.utils';

const ViajesReport = ({ data }) => (
  <ReportSection title="Viajes realizados" filename="viajes.csv" exportRows={data?.detalle || []}>
    <DataTable rows={data?.detalle || []} columns={[
      { key: 'Fecha', label: 'Fecha', render: r => formatDate(r.Fecha) }, { key: 'NombreRuta', label: 'Ruta' },
      { key: 'Sentido', label: 'Sentido' }, { key: 'EstadoViaje', label: 'Estado' }, { key: 'Conductor', label: 'Conductor' },
      { key: 'Vehiculo', label: 'Vehículo' }, { key: 'HoraInicio', label: 'Inicio', render: r => formatDateTime(r.HoraInicio) },
      { key: 'HoraFin', label: 'Fin', render: r => formatDateTime(r.HoraFin) }, { key: 'DuracionMinutos', label: 'Duración min' }
    ]} />
  </ReportSection>
);

export default ViajesReport;
