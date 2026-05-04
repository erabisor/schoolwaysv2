import React from 'react';
import DataTable from '../components/DataTable';
import ReportSection from '../components/ReportSection';
import { formatDate, formatDateTime } from '../reportes.utils';

const TurnosReport = ({ data }) => (
  <ReportSection title="Turnos de conductores" filename="turnos.csv" exportRows={data?.detalle || []}>
    <DataTable rows={data?.detalle || []} columns={[
      { key: 'Fecha', label: 'Fecha', render: r => formatDate(r.Fecha) }, { key: 'Conductor', label: 'Conductor' },
      { key: 'NombreRuta', label: 'Ruta' }, { key: 'TurnoRuta', label: 'Turno' }, { key: 'EstadoTurno', label: 'Estado' },
      { key: 'HoraApertura', label: 'Apertura', render: r => formatDateTime(r.HoraApertura) },
      { key: 'HoraCierre', label: 'Cierre', render: r => formatDateTime(r.HoraCierre) },
      { key: 'DuracionMinutos', label: 'Duración min' }, { key: 'ViajesRealizados', label: 'Viajes' }
    ]} />
  </ReportSection>
);

export default TurnosReport;
