import React, { useEffect, useState, useContext } from 'react';
import { Users, Bus, MapPin, UserSquare2, CheckCircle, Activity } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { getDashboard } from './dashboard.api';
import { AuthContext } from '../../context/AuthContext';

// Tarjeta individual de KPI
const KpiCard = ({ label, value, icon, color, bg }) => (
  <div style={{
    background: 'white', borderRadius: '16px', padding: '24px',
    display: 'flex', alignItems: 'center', gap: '20px',
    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
  }}>
    <div style={{ background: bg, padding: '16px', borderRadius: '12px' }}>
      {React.cloneElement(icon, { size: 28, color })}
    </div>
    <div>
      <p style={{ color: 'var(--text-muted)', fontSize: '13px', fontWeight: '600', margin: 0 }}>{label}</p>
      <h3 style={{ fontSize: '2rem', fontWeight: '800', margin: 0, color: '#0f172a' }}>{value ?? '—'}</h3>
    </div>
  </div>
);

// Fila de la tabla de actividad reciente
const FilaActividad = ({ turno }) => {
  const hora = turno.HoraApertura
    ? new Date(turno.HoraApertura).toLocaleTimeString('es-SV', { hour: '2-digit', minute: '2-digit' })
    : '—';

  return (
    <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
      <td style={{ padding: '14px 16px', fontWeight: '600' }}>{turno.NombreConductor}</td>
      <td style={{ padding: '14px 16px', color: 'var(--text-muted)' }}>{turno.NombreRuta}</td>
      <td style={{ padding: '14px 16px', color: 'var(--text-muted)' }}>{hora}</td>
      <td style={{ padding: '14px 16px' }}>
        <span style={{
          padding: '4px 10px', borderRadius: '99px', fontSize: '12px', fontWeight: '700',
          background: turno.EstadoTurno === 'Abierto' ? '#d1fae5' : '#f1f5f9',
          color: turno.EstadoTurno === 'Abierto' ? '#059669' : 'var(--text-muted)'
        }}>
          {turno.EstadoTurno}
        </span>
      </td>
    </tr>
  );
};

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cargar = async () => {
      try {
        const res = await getDashboard();
        setDatos(res.data.data);
      } catch (err) {
        console.error('Error cargando dashboard:', err);
      } finally {
        setCargando(false);
      }
    };
    cargar();
  }, []);

  // Formatea las fechas de la gráfica a día/mes
  const datosGrafica = (datos?.asistenciaSemanal || []).map(d => ({
    fecha: new Date(d.Fecha).toLocaleDateString('es-SV', { day: '2-digit', month: '2-digit' }),
    Abordajes: d.TotalAbordajes
  }));

  const kpis = datos?.kpis;

  return (
    <div>
      {/* Saludo personalizado */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: '800', color: '#0f172a', marginBottom: '4px' }}>
          Panel de Control
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '15px' }}>
          Bienvenido de nuevo, <strong style={{ color: 'var(--primary)' }}>{user?.nombre}</strong>
        </p>
      </div>

      {cargando ? (
        <p style={{ color: 'var(--text-muted)' }}>Cargando datos...</p>
      ) : (
        <>
          {/* Tarjetas KPI */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '32px' }}>
            <KpiCard label="Alumnos Activos"    value={kpis?.TotalAlumnos}      icon={<Users />}        color="#2563eb" bg="#dbeafe" />
            <KpiCard label="Rutas Activas"      value={kpis?.TotalRutas}        icon={<MapPin />}       color="#10b981" bg="#d1fae5" />
            <KpiCard label="Conductores"        value={kpis?.TotalConductores}  icon={<UserSquare2 />}  color="#f59e0b" bg="#fef3c7" />
            <KpiCard label="Vehículos"          value={kpis?.TotalVehiculos}    icon={<Bus />}          color="#8b5cf6" bg="#ede9fe" />
            <KpiCard label="Turnos Abiertos"    value={kpis?.TurnosAbiertosHoy} icon={<Activity />}     color="#ef4444" bg="#fee2e2" />
            <KpiCard label="Abordajes Hoy"      value={kpis?.AbordajesHoy}      icon={<CheckCircle />}  color="#059669" bg="#d1fae5" />
          </div>

          <div className="two-col-grid">
            {/* Gráfica de asistencia semanal */}
            <div style={{ background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: '800', marginBottom: '20px', color: '#0f172a' }}>
                Abordajes — Últimos 7 días
              </h2>
              {datosGrafica.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={datosGrafica}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="fecha" tick={{ fontSize: 12, fill: '#64748b' }} />
                    <YAxis tick={{ fontSize: 12, fill: '#64748b' }} allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="Abordajes" fill="#2563eb" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p style={{ color: 'var(--text-muted)', fontSize: '14px', textAlign: 'center', paddingTop: '60px' }}>
                  Sin registros esta semana
                </p>
              )}
            </div>

            {/* Tabla de actividad reciente */}
            <div style={{ background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: '800', marginBottom: '20px', color: '#0f172a' }}>
                Actividad Reciente
              </h2>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #f1f5f9', textAlign: 'left' }}>
                    <th style={{ padding: '8px 16px', color: 'var(--text-muted)', fontWeight: '600' }}>Conductor</th>
                    <th style={{ padding: '8px 16px', color: 'var(--text-muted)', fontWeight: '600' }}>Ruta</th>
                    <th style={{ padding: '8px 16px', color: 'var(--text-muted)', fontWeight: '600' }}>Hora</th>
                    <th style={{ padding: '8px 16px', color: 'var(--text-muted)', fontWeight: '600' }}>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {(datos?.actividad || []).length > 0
                    ? datos.actividad.map(t => <FilaActividad key={t.TurnoConductorID} turno={t} />)
                    : (
                      <tr><td colSpan="4" style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>
                        Sin actividad hoy
                      </td></tr>
                    )
                  }
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;