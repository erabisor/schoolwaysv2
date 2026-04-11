import { useContext } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Bus, Users, LayoutDashboard, LogOut,
  UserSquare2, MapPin, GraduationCap, Map, Activity, History
} from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

const NOMBRE_ROL = { 1: 'Administrador', 2: 'Conductor', 3: 'Padre', 4: 'Estudiante' };

const getIniciales = (nombre = '') => {
  const partes = nombre.trim().split(' ');
  return partes.length >= 2
    ? `${partes[0][0]}${partes[1][0]}`.toUpperCase()
    : nombre.substring(0, 2).toUpperCase();
};

const Sidebar = ({ abierto, onCerrar }) => {
  const { logout, user } = useContext(AuthContext);
  const esAdmin     = user?.rol === 1;
  const esConductor = user?.rol === 2;

  const navClass = ({ isActive }) => isActive ? 'nav-item active' : 'nav-item';

  // Cierra el sidebar al navegar en móvil
  const handleNavClick = () => { if (onCerrar) onCerrar(); };

  return (
    <aside className={`sidebar-nav${abierto ? ' abierto' : ''}`}>

      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px', color: 'white' }}>
        <div style={{ background: 'white', padding: '8px', borderRadius: '10px' }}>
          <Bus color="var(--primary)" size={24} />
        </div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: '800' }}>SchoolWay</h2>
      </div>

      {/* Menú filtrado por rol */}
      <nav style={{ flex: 1 }}>

        {esAdmin && <>
          <NavLink to="/dashboard"   className={navClass} onClick={handleNavClick}><LayoutDashboard size={22} /> Dashboard</NavLink>
          <NavLink to="/usuarios"    className={navClass} onClick={handleNavClick}><Users size={22} /> Usuarios</NavLink>
          <NavLink to="/vehiculos"   className={navClass} onClick={handleNavClick}><Bus size={22} /> Vehículos</NavLink>
          <NavLink to="/conductores" className={navClass} onClick={handleNavClick}><UserSquare2 size={22} /> Conductores</NavLink>
          <NavLink to="/rutas"       className={navClass} onClick={handleNavClick}><MapPin size={22} /> Rutas</NavLink>
          <NavLink to="/alumnos"     className={navClass} onClick={handleNavClick}><GraduationCap size={22} /> Alumnos</NavLink>
          <NavLink to="/asistencias" className={navClass} onClick={handleNavClick}><Map size={22} /> Asistencia</NavLink>
          <NavLink to="/monitoreo"   className={navClass} onClick={handleNavClick}><Activity size={22} /> Monitoreo en Vivo</NavLink>
          <NavLink to="/historial"   className={navClass} onClick={handleNavClick}><History size={22} /> Reportes Históricos</NavLink>
        </>}

        {esConductor && <>
          <NavLink to="/conductor" className={navClass} onClick={handleNavClick}><LayoutDashboard size={22} /> Mi Panel</NavLink>
        </>}

      </nav>

      {/* Perfil del usuario */}
      <div style={{
        borderTop: '1px solid rgba(255,255,255,0.15)',
        paddingTop: '16px', marginBottom: '12px',
        display: 'flex', alignItems: 'center', gap: '12px'
      }}>
        <div style={{
          width: '40px', height: '40px', borderRadius: '50%',
          background: 'rgba(255,255,255,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: '800', fontSize: '14px', color: 'white', flexShrink: 0
        }}>
          {getIniciales(user?.nombre)}
        </div>
        <div style={{ overflow: 'hidden' }}>
          <p style={{
            color: 'white', fontWeight: '700', fontSize: '13px',
            margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
          }}>
            {user?.nombre}
          </p>
          <p style={{ color: '#bfdbfe', fontSize: '11px', margin: 0, fontWeight: '500' }}>
            {NOMBRE_ROL[user?.rol] || 'Usuario'}
          </p>
        </div>
      </div>

      <button onClick={logout} className="logout-btn">
        <LogOut size={20} /> Cerrar Sesión
      </button>
    </aside>
  );
};

export default Sidebar;
