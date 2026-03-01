import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import Sidebar from './Sidebar';

// Protege la ruta y dibuja el layout (Sidebar + Contenido)
const ProtectedRoute = ({ children, rolesPermitidos }) => {
  const { user, cargando } = useContext(AuthContext);

  if (cargando) return null; // Previene parpadeos
  if (!user) return <Navigate to="/login" replace />;
  if (rolesPermitidos && !rolesPermitidos.includes(user.rol)) return <Navigate to="/dashboard" replace />;

  return (
    <div className="dashboard-container" style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-light)' }}>
      <Sidebar />
      <main className="content-area" style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>
        {children}
      </main>
    </div>
  );
};

export default ProtectedRoute;