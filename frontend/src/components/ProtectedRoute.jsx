import { useContext, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import Sidebar from './Sidebar';

// Protege la ruta y dibuja el layout (Sidebar + Contenido)
const ProtectedRoute = ({ children, rolesPermitidos }) => {
  const { user, cargando } = useContext(AuthContext);
  const [sidebarAbierto, setSidebarAbierto] = useState(false);

  if (cargando) return null; // Previene parpadeos
  if (!user) return <Navigate to="/login" replace />;
  if (rolesPermitidos && !rolesPermitidos.includes(user.rol)) {
    return <Navigate to={user.rol === 2 ? '/conductor' : '/dashboard'} replace />;
  }

  return (
    <div className="dashboard-container">
      {/* Barra superior móvil — se oculta cuando el sidebar está abierto */}
      {!sidebarAbierto && (
        <div className="mobile-topbar">
          <button className="mobile-topbar-btn" onClick={() => setSidebarAbierto(true)}>
            <Menu size={22} />
          </button>
          <span className="mobile-topbar-title">SchoolWay</span>
        </div>
      )}

      {/* Overlay oscuro detrás del sidebar en móvil */}
      <div
        className={`sidebar-overlay${sidebarAbierto ? ' visible' : ''}`}
        onClick={() => setSidebarAbierto(false)}
      />

      <Sidebar abierto={sidebarAbierto} onCerrar={() => setSidebarAbierto(false)} />

      <main className="content-area">
        {children}
      </main>
    </div>
  );
};

export default ProtectedRoute;
