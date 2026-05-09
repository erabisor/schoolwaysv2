import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './App.css';

import Login from './modules/auth/Login';
import OlvidePassword from './modules/auth/OlvidePassword';
import ResetPassword from './modules/auth/ResetPassword';
import Dashboard from './modules/dashboard/Dashboard';
import Usuarios from './modules/usuarios/Usuarios';
import Vehiculos from './modules/vehiculos/Vehiculos';
import Conductores from './modules/conductores/Conductores';
import Rutas from './modules/rutas/Rutas';
import Alumnos from './modules/alumnos/Alumnos';
import Asistencias from './modules/asistencias/Asistencias';
import MonitoreoTurnos from './modules/asistencias/MonitoreoTurnos';
import HistorialTurnos from './modules/asistencias/HistorialTurnos';
import Mantenimientos from './modules/mantenimientos/Mantenimientos';
import Reportes from './modules/reportes/Reportes';
import DashboardConductor from './modules/conductor/DashboardConductor';
import PortalPadre from './modules/padre/PortalPadre';
import NotificacionesPadre from './modules/padre/NotificacionesPadre';
import HistorialSemanal from './modules/padre/HistorialSemanal';

const HistorialPadrePage = () => {
  const [historial, setHistorial] = React.useState([]);
  const [cargando, setCargando] = React.useState(true);

  React.useEffect(() => {
    const cargar = async () => {
      try {
        const { getHistorialSemanalPadre } = await import('./modules/padre/padre.api');
        const res = await getHistorialSemanalPadre();
        setHistorial(res.data.data || []);
      } catch (e) {
        console.error('[HistorialPadre]', e.message);
      } finally {
        setCargando(false);
      }
    };
    cargar();
  }, []);

  if (cargando) return <div style={{ padding: '32px', fontWeight: '800', color: '#94a3b8' }}>Cargando historial...</div>;

  return (
    <div>
      <div className="page-header" style={{ marginBottom: '18px' }}>
        <h1>Historial Semanal</h1>
      </div>
      <HistorialSemanal historial={historial} />
    </div>
  );
};

const PortalEstudiante = () => (
  <div className="card" style={{ padding: '24px' }}>
    <h3>Portal del Estudiante</h3>
    <p>En construcción — próximamente.</p>
  </div>
);

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png'
});

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/olvide-password" element={<OlvidePassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute rolesPermitidos={[1]}>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/usuarios"
            element={
              <ProtectedRoute rolesPermitidos={[1]}>
                <Usuarios />
              </ProtectedRoute>
            }
          />

          <Route
            path="/vehiculos"
            element={
              <ProtectedRoute rolesPermitidos={[1]}>
                <Vehiculos />
              </ProtectedRoute>
            }
          />

          <Route
            path="/conductores"
            element={
              <ProtectedRoute rolesPermitidos={[1]}>
                <Conductores />
              </ProtectedRoute>
            }
          />

          <Route
            path="/rutas"
            element={
              <ProtectedRoute rolesPermitidos={[1]}>
                <Rutas />
              </ProtectedRoute>
            }
          />

          <Route
            path="/alumnos"
            element={
              <ProtectedRoute rolesPermitidos={[1]}>
                <Alumnos />
              </ProtectedRoute>
            }
          />

          <Route
            path="/asistencias"
            element={
              <ProtectedRoute rolesPermitidos={[1]}>
                <Asistencias />
              </ProtectedRoute>
            }
          />

          <Route
            path="/mantenimientos"
            element={
              <ProtectedRoute rolesPermitidos={[1]}>
                <Mantenimientos />
              </ProtectedRoute>
            }
          />

          <Route
            path="/monitoreo"
            element={
              <ProtectedRoute rolesPermitidos={[1]}>
                <MonitoreoTurnos />
              </ProtectedRoute>
            }
          />

          <Route
            path="/historial-turnos"
            element={
              <ProtectedRoute rolesPermitidos={[1]}>
                <HistorialTurnos />
              </ProtectedRoute>
            }
          />

          <Route
            path="/reportes"
            element={
              <ProtectedRoute rolesPermitidos={[1]}>
                <Reportes />
              </ProtectedRoute>
            }
          />

          <Route
            path="/conductor"
            element={
              <ProtectedRoute rolesPermitidos={[2]}>
                <DashboardConductor />
              </ProtectedRoute>
            }
          />

          <Route
            path="/padre"
            element={
              <ProtectedRoute rolesPermitidos={[3]}>
                <PortalPadre />
              </ProtectedRoute>
            }
          />

          <Route
            path="/padre/notificaciones"
            element={
              <ProtectedRoute rolesPermitidos={[3]}>
                <NotificacionesPadre />
              </ProtectedRoute>
            }
          />

          <Route
            path="/padre/historial"
            element={
              <ProtectedRoute rolesPermitidos={[3]}>
                <HistorialPadrePage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/estudiante"
            element={
              <ProtectedRoute rolesPermitidos={[4]}>
                <PortalEstudiante />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
