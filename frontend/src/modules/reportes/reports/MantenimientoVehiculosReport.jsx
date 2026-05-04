import React from 'react';
import DataTable from '../components/DataTable';
import ReportSection from '../components/ReportSection';
import { formatDate, formatMoney } from '../reportes.utils';

const MantenimientoVehiculosReport = ({ data }) => (
  <>
    <ReportSection title="Resumen por vehículo" filename="mantenimiento_resumen.csv" exportRows={data?.resumen || []}>
      <DataTable rows={data?.resumen || []} columns={[
        { key: 'Placa', label: 'Placa' }, { key: 'Marca', label: 'Marca' }, { key: 'Modelo', label: 'Modelo' },
        { key: 'TotalMantenimientos', label: 'Total' }, { key: 'EnProceso', label: 'En proceso' }, { key: 'Criticos', label: 'Críticos' },
        { key: 'CostoTotal', label: 'Costo', render: r => formatMoney(r.CostoTotal) }
      ]} />
    </ReportSection>
    <ReportSection title="Detalle de mantenimientos" filename="mantenimiento_detalle.csv" exportRows={data?.detalle || []}>
      <DataTable rows={data?.detalle || []} columns={[
        { key: 'Placa', label: 'Vehículo' }, { key: 'TipoMantenimiento', label: 'Tipo' }, { key: 'EstadoMantenimiento', label: 'Estado' },
        { key: 'Prioridad', label: 'Prioridad' }, { key: 'FechaProgramada', label: 'Programada', render: r => formatDate(r.FechaProgramada) },
        { key: 'Costo', label: 'Costo', render: r => formatMoney(r.Costo) }, { key: 'Taller', label: 'Taller' }, { key: 'Responsable', label: 'Responsable' }
      ]} />
    </ReportSection>
  </>
);

export default MantenimientoVehiculosReport;
