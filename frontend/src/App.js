import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Leaflet
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './App.css';

// Auth
import Login from './modules/auth/Login';
import OlvidePassword from './modules/auth/OlvidePassword';
import ResetPassword from './modules/auth/ResetPassword';

// Admin
import Dashboard from './modules/dashboard/Dashboard';
import Usuarios from './modules/usuarios/Usuarios';
import Vehiculos from './modules/vehiculos/Vehiculos';
import Conductores from './modules/conductores/Conductores';
import Rutas from './modules/rutas/Rutas';
import Alumnos from './modules/alumnos/Alumnos';
import Asistencias from './modules/asistencias/Asistencias';
import MonitoreoTurnos from './modules/asistencias/MonitoreoTurnos';
import HistorialTurnos from './modules/asistencias/HistorialTurnos';

// Conductor
import DashboardConductor from './modules/conductor/DashboardConductor';

// Padre y Estudiante — placeholders hasta Bloques 4 y 5
const PortalPadre = () => (
  <div style={{ textAlign: 'center', paddingTop: '60px' }}>
    <h2 style={{ fontSize: '1.8rem', fontWeight: '800', color: '#0f172a', marginBottom: '8px' }}>
      Portal del Padre
    </h2>
    <p style={{ color: 'var(--text-muted)' }}>En construcción — próximamente.</p>
  </div>
);

const PortalEstudiante = () => (
  <div style={{ textAlign: 'center', paddingTop: '60px' }}>
    <h2 style={{ fontSize: '1.8rem', fontWeight: '800', color: '#0f172a', marginBottom: '8px' }}>
      Portal del Estudiante
    </h2>
    <p style={{ color: 'var(--text-muted)' }}>En construcción — próximamente.</p>
  </div>
);

// Configuración global de Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl:       'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl:     'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Públicas */}
          <Route path="/"                element={<Navigate to="/login" replace />} />
          <Route path="/login"           element={<Login />} />
          <Route path="/olvide-password" element={<OlvidePassword />} />
          <Route path="/reset-password"  element={<ResetPassword />} />

          {/* Admin — rol 1 */}
          <Route path="/dashboard"   element={<ProtectedRoute rolesPermitidos={[1]}><Dashboard /></ProtectedRoute>} />
          <Route path="/usuarios"    element={<ProtectedRoute rolesPermitidos={[1]}><Usuarios /></ProtectedRoute>} />
          <Route path="/vehiculos"   element={<ProtectedRoute rolesPermitidos={[1]}><Vehiculos /></ProtectedRoute>} />
          <Route path="/conductores" element={<ProtectedRoute rolesPermitidos={[1]}><Conductores /></ProtectedRoute>} />
          <Route path="/rutas"       element={<ProtectedRoute rolesPermitidos={[1]}><Rutas /></ProtectedRoute>} />
          <Route path="/alumnos"     element={<ProtectedRoute rolesPermitidos={[1]}><Alumnos /></ProtectedRoute>} />
          <Route path="/asistencias" element={<ProtectedRoute rolesPermitidos={[1]}><Asistencias /></ProtectedRoute>} />
          <Route path="/monitoreo"   element={<ProtectedRoute rolesPermitidos={[1]}><MonitoreoTurnos /></ProtectedRoute>} />
          <Route path="/historial"   element={<ProtectedRoute rolesPermitidos={[1]}><HistorialTurnos /></ProtectedRoute>} />

          {/* Conductor — rol 2 */}
          <Route path="/conductor" element={<ProtectedRoute rolesPermitidos={[2]}><DashboardConductor /></ProtectedRoute>} />

          {/* Padre — rol 3 */}
          <Route path="/padre" element={<ProtectedRoute rolesPermitidos={[3]}><PortalPadre /></ProtectedRoute>} />

          {/* Estudiante — rol 4 */}
          <Route path="/estudiante" element={<ProtectedRoute rolesPermitidos={[4]}><PortalEstudiante /></ProtectedRoute>} />

          {/* Ruta desconocida → login */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;