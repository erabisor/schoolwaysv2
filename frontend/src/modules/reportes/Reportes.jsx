import React, { useEffect, useState } from 'react';
import { BarChart3 } from 'lucide-react';
import Toast from '../../components/Toast';
import ReportTabs from './components/ReportTabs';
import ReportFilterBar from './components/ReportFilterBar';
import { getDefaultFilters } from './reportes.constants';
import {
  getReporteAsistenciaEstudiante,
  getReporteMantenimientoVehiculos,
  getReporteResumen,
  getReporteTurnos,
  getReporteUsoRutas,
  getReporteViajes
} from './reportes.api';
import ResumenReport from './reports/ResumenReport';
import UsoRutasReport from './reports/UsoRutasReport';
import MantenimientoVehiculosReport from './reports/MantenimientoVehiculosReport';
import AsistenciaEstudianteReport from './reports/AsistenciaEstudianteReport';
import ViajesReport from './reports/ViajesReport';
import TurnosReport from './reports/TurnosReport';

const loaders = {
  resumen: getReporteResumen,
  'uso-rutas': getReporteUsoRutas,
  'mantenimiento-vehiculos': getReporteMantenimientoVehiculos,
  'asistencia-estudiante': getReporteAsistenciaEstudiante,
  viajes: getReporteViajes,
  turnos: getReporteTurnos
};

const renderReport = (activeTab, data, filters) => {
  if (activeTab === 'resumen') return <ResumenReport data={data} filters={filters} />;
  if (activeTab === 'uso-rutas') return <UsoRutasReport data={data} filters={filters} />;
  if (activeTab === 'mantenimiento-vehiculos') return <MantenimientoVehiculosReport data={data} filters={filters} />;
  if (activeTab === 'asistencia-estudiante') return <AsistenciaEstudianteReport data={data} filters={filters} />;
  if (activeTab === 'viajes') return <ViajesReport data={data} filters={filters} />;
  if (activeTab === 'turnos') return <TurnosReport data={data} filters={filters} />;
  return null;
};

const Reportes = () => {
  const [activeTab, setActiveTab] = useState('resumen');
  const [filters, setFilters] = useState(getDefaultFilters());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ mensaje: '', tipo: '' });

  const [rutas, setRutas] = useState([]);
  const [vehiculos, setVehiculos] = useState([]);
  const [conductores, setConductores] = useState([]);
  const [alumnos, setAlumnos] = useState([]);

  useEffect(() => {
    const cargarCatalogos = async () => {
      try {
        const api = (await import('../../api/axios')).default;
        const [resR, resV, resC, resA] = await Promise.allSettled([
          api.get('/rutas'),
          api.get('/vehiculos'),
          api.get('/conductores'),
          api.get('/alumnos'),
        ]);
        if (resR.status === 'fulfilled') setRutas(resR.value.data.data || []);
        if (resV.status === 'fulfilled') setVehiculos(resV.value.data.data || []);
        if (resC.status === 'fulfilled') setConductores(resC.value.data.data || []);
        if (resA.status === 'fulfilled') setAlumnos(resA.value.data.data || []);
      } catch (e) {
        console.warn('[Reportes] Error cargando catálogos:', e.message);
      }
    };
    cargarCatalogos();
  }, []);

  const cargar = async () => {
    setLoading(true);
    try {
      const res = await loaders[activeTab](filters);
      setData(res.data.data || {});
    } catch (error) {
      setToast({ mensaje: error.response?.data?.mensaje || 'No se pudo generar el reporte', tipo: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargar();
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [activeTab]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      <div className="page-header">
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <BarChart3 color="var(--primary)" />
            Reportes
          </h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '6px', fontWeight: '500' }}>
            Reportes detallados para rutas, mantenimientos, asistencia, viajes y turnos.
          </p>
        </div>
      </div>

      <ReportTabs active={activeTab} onChange={(tab) => { setActiveTab(tab); setData(null); }} />

      <ReportFilterBar
        filters={filters}
        onChange={setFilters}
        onRefresh={cargar}
        loading={loading}
        activeTab={activeTab}
        rutas={rutas}
        vehiculos={vehiculos}
        conductores={conductores}
        alumnos={alumnos}
      />

      {loading
        ? <div className="card" style={{ padding: '28px', fontWeight: '800', color: 'var(--text-muted)' }}>Generando reporte...</div>
        : renderReport(activeTab, data, filters)
      }

      <Toast mensaje={toast.mensaje} tipo={toast.tipo} onClose={() => setToast({ mensaje: '', tipo: '' })} />
    </div>
  );
};

export default Reportes;