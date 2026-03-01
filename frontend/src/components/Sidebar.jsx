import React, { useContext } from 'react';
import { NavLink } from 'react-router-dom';
import { Bus, Users, LayoutDashboard, LogOut, UserSquare2, MapPin, GraduationCap } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { Map } from 'lucide-react';
import { Activity } from 'lucide-react';
import { History } from 'lucide-react';

const Sidebar = () => {
  const { logout } = useContext(AuthContext);

  return (
    <aside style={{ width: 'var(--sidebar-width)', height: '100vh', backgroundColor: 'var(--primary)', position: 'sticky', top: 0, display: 'flex', flexDirection: 'column', padding: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '40px', color: 'white' }}>
        <div style={{ background: 'white', padding: '8px', borderRadius: '10px' }}><Bus color="var(--primary)" size={24}/></div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: '800' }}>SchoolWay</h2>
      </div>
      
      <nav style={{ flex: 1 }}>
        <NavLink to="/dashboard" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
          <LayoutDashboard size={24} /> Dashboard
        </NavLink>
        <NavLink to="/usuarios" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
          <Users size={24} /> Usuarios
        </NavLink>
        <NavLink to="/vehiculos" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
            <Bus size={24} /> Vehículos
        </NavLink>
        <NavLink to="/conductores" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
            <UserSquare2 size={24} /> Conductores
        </NavLink>
        <NavLink to="/rutas" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
            <MapPin size={24} /> Rutas
        </NavLink>
        <NavLink to="/alumnos" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
            <GraduationCap size={24} /> Alumnos
        </NavLink>
        <NavLink to="/asistencias" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
            <Map size={24} /> Asistencia de Viajes
        </NavLink>
        <NavLink 
            to="/monitoreo" 
            className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}
        >
            <Activity size={24} /> Monitoreo en Vivo
        </NavLink>
        <NavLink 
          to="/historial" 
          className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}
        >
          <History size={24} />
          <span>Reportes Históricos</span>
        </NavLink>
      </nav>
      <button onClick={logout} className="logout-btn">
        <LogOut size={24} /> Cerrar Sesión
      </button>
    </aside>
  );
};

export default Sidebar;