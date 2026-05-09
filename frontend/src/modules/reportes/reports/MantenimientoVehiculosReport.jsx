import React, { useRef } from 'react';
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';
import { FileText } from 'lucide-react';
import DataTable from '../components/DataTable';
import ReportSection from '../components/ReportSection';
import { formatDate, formatMoney } from '../reportes.utils';
import {
  crearPDF, agregarHeader, agregarKPIs, agregarGrafica,
  agregarTitulo, agregarTabla, guardarPDF
} from '../utils/pdfExport';

const COLORES_ESTADO = {
  Programado: '#3b82f6',
  'En Proceso': '#f59e0b',
  Completado: '#22c55e',
  Cancelado: '#94a3b8',
};

const MantenimientoVehiculosReport = ({ data, filters }) => {
  const pieRef = useRef(null);
  const barRef = useRef(null);

  const resumen = data?.resumen || [];
  const detalle = data?.detalle || [];

  /* ── KPIs ── */
  const totalMant = resumen.reduce((s, r) => s + (r.TotalMantenimientos || 0), 0);
  const totalEnProceso = resumen.reduce((s, r) => s + (r.EnProceso || 0), 0);
  const totalCriticos = resumen.reduce((s, r) => s + (r.Criticos || 0), 0);
  const costoTotal = resumen.reduce((s, r) => s + (Number(r.CostoTotal) || 0), 0);

  /* ── Datos gráfica pastel (por estado) ── */
  const conteoEstados = {};
  detalle.forEach((d) => {
    const est = d.EstadoMantenimiento || 'Otro';
    conteoEstados[est] = (conteoEstados[est] || 0) + 1;
  });
  const pieData = Object.entries(conteoEstados).map(([name, value]) => ({ name, value }));

  /* ── Datos gráfica barras (costo por vehículo) ── */
  const barData = resumen
    .filter((r) => Number(r.CostoTotal) > 0)
    .map((r) => ({
      nombre: r.Placa || 'Sin placa',
      Costo: Number(r.CostoTotal) || 0,
      Mantenimientos: r.TotalMantenimientos || 0,
    }))
    .slice(0, 15);

  /* ── PDF ── */
  const handleExportPDF = async () => {
    const doc = crearPDF();

    let y = agregarHeader(doc, {
      titulo: 'Reporte de Mantenimiento de Vehículos',
      fechaInicio: filters?.fechaInicio,
      fechaFin: filters?.fechaFin,
    });

    y = agregarKPIs(doc, y, [
      { label: 'Total manttos', value: totalMant, color: [37, 99, 235] },
      { label: 'En proceso', value: totalEnProceso, color: [245, 158, 11] },
      { label: 'Críticos', value: totalCriticos, color: [220, 38, 38] },
      { label: 'Costo total', value: formatMoney(costoTotal), color: [5, 150, 105] },
    ]);

    y = await agregarGrafica(doc, y, pieRef, 60);
    y = await agregarGrafica(doc, y, barRef, 60);

    y = agregarTitulo(doc, y, 'Resumen por vehículo');
    y = agregarTabla(doc, y, {
      columnas: [
        { key: 'Placa', label: 'Placa' }, { key: 'Marca', label: 'Marca' }, { key: 'Modelo', label: 'Modelo' },
        { key: 'TotalMantenimientos', label: 'Total' }, { key: 'EnProceso', label: 'En proceso' },
        { key: 'Criticos', label: 'Críticos' }, { key: 'CostoTotal', label: 'Costo', render: (r) => formatMoney(r.CostoTotal) },
      ],
      filas: resumen,
    });

    y = agregarTitulo(doc, y, 'Detalle de mantenimientos');
    agregarTabla(doc, y, {
      columnas: [
        { key: 'Placa', label: 'Vehículo' }, { key: 'TipoMantenimiento', label: 'Tipo' },
        { key: 'EstadoMantenimiento', label: 'Estado' }, { key: 'Prioridad', label: 'Prioridad' },
        { key: 'FechaProgramada', label: 'Programada', render: (r) => formatDate(r.FechaProgramada) },
        { key: 'Costo', label: 'Costo', render: (r) => formatMoney(r.Costo) },
        { key: 'Taller', label: 'Taller' },
      ],
      filas: detalle,
    });

    guardarPDF(doc, `Mantenimientos_${filters?.fechaInicio || 'reporte'}.pdf`);
  };

  return (
    <>
      {/* ── KPIs ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: '12px', marginBottom: '18px'
      }}>
        {[
          { label: 'Total manttos', value: totalMant, color: '#2563eb', bg: '#eff6ff' },
          { label: 'En proceso', value: totalEnProceso, color: '#d97706', bg: '#fffbeb' },
          { label: 'Críticos', value: totalCriticos, color: '#dc2626', bg: '#fef2f2' },
          { label: 'Costo total', value: formatMoney(costoTotal), color: '#059669', bg: '#f0fdf4' },
        ].map((kpi) => (
          <div key={kpi.label} style={{
            background: kpi.bg, borderRadius: '12px', padding: '16px', textAlign: 'center'
          }}>
            <p style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', margin: 0 }}>{kpi.label}</p>
            <p style={{ fontSize: '1.4rem', fontWeight: '800', color: kpi.color, margin: '4px 0 0' }}>{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* ── Gráficas ── */}
      {(pieData.length > 0 || barData.length > 0) && (
        <div style={{
          background: 'white', borderRadius: '12px', padding: '20px', marginBottom: '18px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
        }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            marginBottom: '12px', flexWrap: 'wrap', gap: '8px'
          }}>
            <h4 style={{ margin: 0, fontWeight: '800' }}>Análisis visual</h4>
            <button type="button" className="btn-secondary" onClick={handleExportPDF}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <FileText size={16} /> Exportar PDF
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
            {pieData.length > 0 && (
              <div ref={pieRef} style={{ background: 'white' }}>
                <p style={{ fontWeight: '700', fontSize: '13px', color: '#64748b', marginBottom: '8px' }}>Por estado</p>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%"
                      outerRadius={90} innerRadius={40} paddingAngle={3} label={({ name, value }) => `${name}: ${value}`}>
                      {pieData.map((entry) => (
                        <Cell key={entry.name} fill={COLORES_ESTADO[entry.name] || '#94a3b8'} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: '12px', fontWeight: '700' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}

            {barData.length > 0 && (
              <div ref={barRef} style={{ background: 'white' }}>
                <p style={{ fontWeight: '700', fontSize: '13px', color: '#64748b', marginBottom: '8px' }}>Costo por vehículo</p>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={barData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="nombre" tick={{ fontSize: 10, fill: '#64748b' }} />
                    <YAxis tick={{ fontSize: 10, fill: '#64748b' }} />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px', fontWeight: '700' }} />
                    <Bar dataKey="Costo" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Tablas ── */}
      <ReportSection title="Resumen por vehículo" filename="mantenimiento_resumen.csv" exportRows={resumen}>
        <DataTable rows={resumen} columns={[
          { key: 'Placa', label: 'Placa' }, { key: 'Marca', label: 'Marca' }, { key: 'Modelo', label: 'Modelo' },
          { key: 'TotalMantenimientos', label: 'Total' }, { key: 'EnProceso', label: 'En proceso' },
          { key: 'Criticos', label: 'Críticos' }, { key: 'CostoTotal', label: 'Costo', render: (r) => formatMoney(r.CostoTotal) },
        ]} />
      </ReportSection>

      <ReportSection title="Detalle de mantenimientos" filename="mantenimiento_detalle.csv" exportRows={detalle}>
        <DataTable rows={detalle} columns={[
          { key: 'Placa', label: 'Vehículo' }, { key: 'TipoMantenimiento', label: 'Tipo' },
          { key: 'EstadoMantenimiento', label: 'Estado' }, { key: 'Prioridad', label: 'Prioridad' },
          { key: 'FechaProgramada', label: 'Programada', render: (r) => formatDate(r.FechaProgramada) },
          { key: 'Costo', label: 'Costo', render: (r) => formatMoney(r.Costo) },
          { key: 'Taller', label: 'Taller' }, { key: 'Responsable', label: 'Responsable' },
        ]} />
      </ReportSection>
    </>
  );
};

export default MantenimientoVehiculosReport;