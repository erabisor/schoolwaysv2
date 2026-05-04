import { useContext, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import Sidebar from './Sidebar';

const ProtectedRoute = ({ children, rolesPermitidos }) => {
  const { user, cargando } = useContext(AuthContext);
  const [sidebarAbierto, setSidebarAbierto] = useState(false);

  if (cargando) return null;

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const rol = Number(user.rol);

  if (rolesPermitidos && !rolesPermitidos.includes(rol)) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="dashboard-container">
      {!sidebarAbierto && (
        <div className="mobile-topbar">
          <button
            type="button"
            className="mobile-topbar-btn"
            onClick={() => setSidebarAbierto(true)}
            aria-label="Abrir menú"
          >
            <Menu size={22} />
          </button>
          <span className="mobile-topbar-title">SchoolWay</span>
        </div>
      )}

      <div
        className={`sidebar-overlay ${sidebarAbierto ? 'visible' : ''}`}
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