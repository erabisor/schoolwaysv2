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

const UsoRutasReport = ({ data, filters }) => {
  const chartRef = useRef(null);

  const resumen = data?.resumen || [];
  const detalle = data?.detalle || [];

  /* ── KPIs calculados ── */
  const totalViajes = resumen.reduce((s, r) => s + (r.Viajes || 0), 0);
  const totalAlumnos = resumen.reduce((s, r) => s + (r.AlumnosAsignados || 0), 0);
  const totalAusencias = resumen.reduce((s, r) => s + (r.Ausencias || 0), 0);

  /* ── Datos para gráfica ── */
  const chartData = resumen.map((r) => ({
    nombre: r.NombreRuta?.length > 20 ? r.NombreRuta.slice(0, 20) + '…' : r.NombreRuta,
    Viajes: r.Viajes || 0,
    Abordajes: r.Abordajes || 0,
    Ausencias: r.Ausencias || 0,
  }));

  /* ── Exportar PDF ── */
  const handleExportPDF = async () => {
    const doc = crearPDF();

    let y = agregarHeader(doc, {
      titulo: 'Reporte de Uso de Rutas',
      fechaInicio: filters?.fechaInicio,
      fechaFin: filters?.fechaFin,
    });

    y = agregarKPIs(doc, y, [
      { label: 'Rutas', value: resumen.length, color: [37, 99, 235] },
      { label: 'Total viajes', value: totalViajes, color: [5, 150, 105] },
      { label: 'Alumnos asignados', value: totalAlumnos, color: [124, 58, 237] },
      { label: 'Ausencias', value: totalAusencias, color: [220, 38, 38] },
    ]);

    y = await agregarGrafica(doc, y, chartRef);

    y = agregarTitulo(doc, y, 'Resumen por ruta');
    y = agregarTabla(doc, y, {
      columnas: [
        { key: 'NombreRuta', label: 'Ruta' },
        { key: 'Turno', label: 'Turno' },
        { key: 'Viajes', label: 'Viajes' },
        { key: 'AlumnosAsignados', label: 'Alumnos' },
        { key: 'Abordajes', label: 'Abordajes' },
        { key: 'Ausencias', label: 'Ausencias' },
        { key: 'AvisosAusencia', label: 'Avisos' },
      ],
      filas: resumen,
    });

    y = agregarTitulo(doc, y, 'Detalle de viajes');
    agregarTabla(doc, y, {
      columnas: [
        { key: 'Fecha', label: 'Fecha' },
        { key: 'NombreRuta', label: 'Ruta' },
        { key: 'Sentido', label: 'Sentido' },
        { key: 'EstadoViaje', label: 'Estado' },
        { key: 'Conductor', label: 'Conductor' },
        { key: 'Placa', label: 'Bus' },
      ],
      filas: detalle,
    });

    guardarPDF(doc, `UsoRutas_${filters?.fechaInicio || 'reporte'}.pdf`);
  };

  return (
    <>
      {/* ── KPIs en pantalla ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: '12px',
        marginBottom: '18px'
      }}>
        {[
          { label: 'Rutas', value: resumen.length, color: '#2563eb', bg: '#eff6ff' },
          { label: 'Total viajes', value: totalViajes, color: '#059669', bg: '#f0fdf4' },
          { label: 'Alumnos asignados', value: totalAlumnos, color: '#7c3aed', bg: '#f5f3ff' },
          { label: 'Ausencias', value: totalAusencias, color: '#dc2626', bg: '#fef2f2' },
        ].map((kpi) => (
          <div key={kpi.label} style={{
            background: kpi.bg,
            borderRadius: '12px',
            padding: '16px',
            textAlign: 'center'
          }}>
            <p style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', margin: 0 }}>{kpi.label}</p>
            <p style={{ fontSize: '1.6rem', fontWeight: '800', color: kpi.color, margin: '4px 0 0' }}>{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* ── Gráfica + botón PDF ── */}
      {chartData.length > 0 && (
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '18px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
        }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px'
          }}>
            <h4 style={{ margin: 0, fontWeight: '800' }}>Viajes por ruta</h4>
            <button
              type="button"
              className="btn-secondary"
              onClick={handleExportPDF}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <FileText size={16} />
              Exportar PDF
            </button>
          </div>

          <div ref={chartRef} style={{ background: 'white' }}>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="nombre" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    fontSize: '12px',
                    fontWeight: '700'
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', fontWeight: '700' }} />
                <Bar dataKey="Viajes" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Abordajes" fill="#22c55e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Ausencias" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ── Tablas (se conservan igual) ── */}
      <ReportSection
        title="Resumen de uso por ruta"
        description="Muestra viajes, alumnos asignados, abordajes y ausencias por ruta."
        filename="uso_rutas_resumen.csv"
        exportRows={resumen}
      >
        <DataTable
          rows={resumen}
          columns={[
            { key: 'NombreRuta', label: 'Ruta' },
            { key: 'Turno', label: 'Turno' },
            { key: 'Viajes', label: 'Viajes' },
            { key: 'AlumnosAsignados', label: 'Alumnos' },
            { key: 'Abordajes', label: 'Abordajes' },
            { key: 'Ausencias', label: 'Ausencias' },
            { key: 'AvisosAusencia', label: 'Avisos' },
          ]}
        />
      </ReportSection>

      <ReportSection
        title="Detalle de viajes por ruta"
        filename="uso_rutas_detalle.csv"
        exportRows={detalle}
      >
        <DataTable
          rows={detalle}
          columns={[
            { key: 'Fecha', label: 'Fecha' },
            { key: 'NombreRuta', label: 'Ruta' },
            { key: 'Sentido', label: 'Sentido' },
            { key: 'EstadoViaje', label: 'Estado' },
            { key: 'Conductor', label: 'Conductor' },
            { key: 'Placa', label: 'Bus' },
            { key: 'HoraInicio', label: 'Inicio', render: (r) => formatDateTime(r.HoraInicio) },
            { key: 'HoraFin', label: 'Fin', render: (r) => formatDateTime(r.HoraFin) },
          ]}
        />
      </ReportSection>
    </>
  );
};

export default UsoRutasReport;