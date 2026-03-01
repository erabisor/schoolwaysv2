import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './modules/auth/Login';
import Usuarios from './modules/usuarios/Usuarios';
import './App.css';
import Vehiculos from './modules/vehiculos/Vehiculos';
import Conductores from './modules/conductores/Conductores';
import Rutas from './modules/rutas/Rutas';
import Alumnos from './modules/alumnos/Alumnos';
import Asistencias from './modules/asistencias/Asistencias';
import MonitoreoTurnos from './modules/asistencias/MonitoreoTurnos';
import HistorialTurnos from './modules/asistencias/HistorialTurnos'; // IMPORT NUEVO

const TempDashboard = () => (
  <div>
    <h1 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '16px' }}>Dashboard</h1>
    <p style={{ color: 'var(--text-muted)' }}>Contadores en construcción...</p>
  </div>
);

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<ProtectedRoute><TempDashboard /></ProtectedRoute>} />
          <Route path="/usuarios" element={<ProtectedRoute rolesPermitidos={[1]}><Usuarios /></ProtectedRoute>} />
          <Route path="/vehiculos" element={<ProtectedRoute rolesPermitidos={[1]}><Vehiculos /></ProtectedRoute>} />
          <Route path="/conductores" element={<ProtectedRoute rolesPermitidos={[1]}><Conductores /></ProtectedRoute>} />
          <Route path="/rutas" element={<ProtectedRoute rolesPermitidos={[1]}><Rutas /></ProtectedRoute>} />
          <Route path="/alumnos" element={<ProtectedRoute rolesPermitidos={[1]}><Alumnos /></ProtectedRoute>} />
          <Route path="/asistencias" element={<ProtectedRoute rolesPermitidos={[1]}><Asistencias /></ProtectedRoute>} />
          <Route path="/monitoreo" element={<ProtectedRoute rolesPermitidos={[1]}><MonitoreoTurnos /></ProtectedRoute>} />
          
          {/* RUTA NUEVA: El historial de viajes */}
          <Route path="/historial" element={<ProtectedRoute rolesPermitidos={[1]}><HistorialTurnos /></ProtectedRoute>} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;