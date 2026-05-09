import React, { useRef } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { FileText } from 'lucide-react';
import DataTable from '../components/DataTable';
import ReportSection from '../components/ReportSection';
import { formatDateTime } from '../reportes.utils';
import {
  crearPDF, agregarHeader, agregarKPIs, agregarGrafica,
  agregarTitulo, agregarTabla, guardarPDF
} from '../utils/pdfExport';

const AsistenciaEstudianteReport = ({ data, filters }) => {
  const chartRef = useRef(null);

  const resumen = data?.resumen || [];
  const detalle = data?.detalle || [];

  /* ── KPIs ── */
  const totalAlumnos = resumen.length;
  const totalEventos = resumen.reduce((s, r) => s + (r.TotalEventos || 0), 0);
  const totalAbordajes = resumen.reduce((s, r) => s + (r.Abordajes || 0), 0);
  const totalAusencias = resumen.reduce((s, r) => s + (r.Ausencias || 0), 0);

  /* ── Datos gráfica (barras apiladas por alumno) ── */
  const chartData = resumen.slice(0, 15).map((r) => ({
    nombre: (r.Alumno || '').length > 18 ? r.Alumno.slice(0, 18) + '…' : r.Alumno,
    Abordajes: r.Abordajes || 0,
    Bajadas: r.Bajadas || 0,
    Ausencias: r.Ausencias || 0,
  }));

  /* ── PDF ── */
  const handleExportPDF = async () => {
    const doc = crearPDF();

    let y = agregarHeader(doc, {
      titulo: 'Reporte de Asistencia por Estudiante',
      fechaInicio: filters?.fechaInicio,
      fechaFin: filters?.fechaFin,
    });

    y = agregarKPIs(doc, y, [
      { label: 'Estudiantes', value: totalAlumnos, color: [37, 99, 235] },
      { label: 'Total eventos', value: totalEventos, color: [5, 150, 105] },
      { label: 'Abordajes', value: totalAbordajes, color: [34, 197, 94] },
      { label: 'Ausencias', value: totalAusencias, color: [220, 38, 38] },
    ]);

    y = await agregarGrafica(doc, y, chartRef);

    y = agregarTitulo(doc, y, 'Resumen por estudiante');
    y = agregarTabla(doc, y, {
      columnas: [
        { key: 'Alumno', label: 'Estudiante' }, { key: 'Grado', label: 'Grado' },
        { key: 'NombreRuta', label: 'Ruta' }, { key: 'Abordajes', label: 'Abordó' },
        { key: 'Bajadas', label: 'Bajó' }, { key: 'Ausencias', label: 'Ausente' },
        { key: 'AvisosAusencia', label: 'Avisó' }, { key: 'TotalEventos', label: 'Total' },
      ],
      filas: resumen,
    });

    y = agregarTitulo(doc, y, 'Detalle de eventos');
    agregarTabla(doc, y, {
      columnas: [
        { key: 'FechaHora', label: 'Fecha/hora', render: (r) => formatDateTime(r.FechaHora) },
        { key: 'Alumno', label: 'Estudiante' }, { key: 'NombreRuta', label: 'Ruta' },
        { key: 'Sentido', label: 'Sentido' }, { key: 'TipoEvento', label: 'Evento' },
      ],
      filas: detalle,
    });

    guardarPDF(doc, `Asistencia_${filters?.fechaInicio || 'reporte'}.pdf`);
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
          { label: 'Estudiantes', value: totalAlumnos, color: '#2563eb', bg: '#eff6ff' },
          { label: 'Total eventos', value: totalEventos, color: '#059669', bg: '#f0fdf4' },
          { label: 'Abordajes', value: totalAbordajes, color: '#22c55e', bg: '#f0fdf4' },
          { label: 'Ausencias', value: totalAusencias, color: '#dc2626', bg: '#fef2f2' },
        ].map((kpi) => (
          <div key={kpi.label} style={{
            background: kpi.bg, borderRadius: '12px', padding: '16px', textAlign: 'center'
          }}>
            <p style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', margin: 0 }}>{kpi.label}</p>
            <p style={{ fontSize: '1.6rem', fontWeight: '800', color: kpi.color, margin: '4px 0 0' }}>{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* ── Gráfica ── */}
      {chartData.length > 0 && (
        <div style={{
          background: 'white', borderRadius: '12px', padding: '20px', marginBottom: '18px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
        }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            marginBottom: '12px', flexWrap: 'wrap', gap: '8px'
          }}>
            <h4 style={{ margin: 0, fontWeight: '800' }}>Eventos por estudiante</h4>
            <button type="button" className="btn-secondary" onClick={handleExportPDF}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <FileText size={16} /> Exportar PDF
            </button>
          </div>

          <div ref={chartRef} style={{ background: 'white' }}>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="nombre" tick={{ fontSize: 10, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px', fontWeight: '700' }} />
                <Legend wrapperStyle={{ fontSize: '12px', fontWeight: '700' }} />
                <Bar dataKey="Abordajes" stackId="a" fill="#22c55e" radius={[0, 0, 0, 0]} />
                <Bar dataKey="Bajadas" stackId="a" fill="#3b82f6" radius={[0, 0, 0, 0]} />
                <Bar dataKey="Ausencias" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ── Tablas ── */}
      <ReportSection title="Resumen por estudiante" filename="asistencia_estudiante_resumen.csv" exportRows={resumen}>
        <DataTable rows={resumen} columns={[
          { key: 'Alumno', label: 'Estudiante' }, { key: 'Grado', label: 'Grado' },
          { key: 'Seccion', label: 'Sección' }, { key: 'NombreRuta', label: 'Ruta' },
          { key: 'Abordajes', label: 'Abordó' }, { key: 'Bajadas', label: 'Bajó' },
          { key: 'Ausencias', label: 'Ausente' }, { key: 'AvisosAusencia', label: 'Avisó ausencia' },
          { key: 'TotalEventos', label: 'Total' },
        ]} />
      </ReportSection>

      <ReportSection title="Detalle de eventos" filename="asistencia_estudiante_detalle.csv" exportRows={detalle}>
        <DataTable rows={detalle} columns={[
          { key: 'FechaHora', label: 'Fecha/hora', render: (r) => formatDateTime(r.FechaHora) },
          { key: 'Alumno', label: 'Estudiante' }, { key: 'NombreRuta', label: 'Ruta' },
          { key: 'Conductor', label: 'Conductor' }, { key: 'Sentido', label: 'Sentido' },
          { key: 'TipoEvento', label: 'Evento' }, { key: 'Observaciones', label: 'Observaciones' },
        ]} />
      </ReportSection>
    </>
  );
};

export default AsistenciaEstudianteReport;