import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Bus, History, RefreshCw, UsersRound } from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';
import Toast from '../../components/Toast';
import HijoCard from './HijoCard';
import EstadoTransporteCard from './EstadoTransporteCard';
import HistorialSemanal from './HistorialSemanal';
import MapaSeguimientoPadre from './MapaSeguimientoPadre';
import NotificacionesPadre from './NotificacionesPadre';
import {
  getHijosPadre,
  getHistorialSemanalPadre,
  getTransporteHoyPadre
} from './padre.api';

const KpiCard = ({ label, value, icon, bg, color }) => (
  <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
    <div
      style={{
        width: '44px',
        height: '44px',
        borderRadius: '14px',
        background: bg,
        color,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0
      }}
    >
      {icon}
    </div>

    <div>
      <p style={{ color: 'var(--text-muted)', fontSize: '13px', fontWeight: '800' }}>{label}</p>
      <h4 style={{ fontSize: '1.45rem', color: '#0f172a', fontWeight: '900' }}>{value}</h4>
    </div>
  </div>
);

const obtenerNombreAlumno = (estado) => {
  return estado.NombreAlumno || estado.Alumno || estado.NombreCompleto || 'Alumno';
};

const PortalPadre = () => {
  const { user } = useContext(AuthContext);
  const [hijos, setHijos] = useState([]);
  const [estados, setEstados] = useState([]);
  const [historial, setHistorial] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [toast, setToast] = useState({ mensaje: '', tipo: '' });

  const cargarDatos = useCallback(async () => {
    setCargando(true);

    try {
      const [resHijos, resEstados, resHistorial] = await Promise.all([
        getHijosPadre(),
        getTransporteHoyPadre(),
        getHistorialSemanalPadre()
      ]);

      setHijos(resHijos.data.data || []);
      setEstados(resEstados.data.data || []);
      setHistorial(resHistorial.data.data || []);
    } catch (error) {
      setToast({
        mensaje: error.response?.data?.mensaje || 'No se pudo cargar el portal del padre',
        tipo: 'error'
      });
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  const estadosActivos = useMemo(() => {
    return estados.filter((estado) => estado.EstadoViaje === 'En Curso' && estado.ViajeID);
  }, [estados]);

  const ultimoEvento = historial[0]?.TipoEvento || 'Sin eventos';

  if (cargando) {
    return (
      <div style={{ padding: '32px', color: 'var(--text-muted)', fontWeight: '800' }}>
        Cargando portal del padre...
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      <div className="page-header">
        <div>
          <h1>Portal del Padre</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '6px', fontWeight: '600' }}>
            Hola, {user?.nombre || user?.NombreCompleto || 'responsable'}. Aquí puedes consultar el transporte escolar de tus hijos.
          </p>
        </div>

        <div className="header-actions">
          <button type="button" onClick={cargarDatos} className="btn-secondary">
            <RefreshCw size={18} color="var(--primary)" />
            Actualizar
          </button>
        </div>
      </div>

      <div className="stats-grid">
        <KpiCard
          label="Hijos asignados"
          value={hijos.length}
          icon={<UsersRound size={22} />}
          bg="#dbeafe"
          color="#2563eb"
        />

        <KpiCard
          label="Transporte activo"
          value={estadosActivos.length}
          icon={<Bus size={22} />}
          bg="#d1fae5"
          color="#059669"
        />

        <KpiCard
          label="Último evento"
          value={ultimoEvento}
          icon={<History size={22} />}
          bg="#fef3c7"
          color="#d97706"
        />
      </div>

      <NotificacionesPadre />

      {hijos.length === 0 ? (
        <div className="card" style={{ padding: '24px', color: 'var(--text-muted)', fontWeight: '800', textAlign: 'center' }}>
          No tienes hijos asignados actualmente. Contacta al administrador del colegio.
        </div>
      ) : (
        <>
          {estadosActivos.length > 0 && (
            <section className="card" style={{ padding: '20px' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: '900', marginBottom: '14px', color: '#0f172a' }}>
                Seguimiento en vivo
              </h3>

              <div style={{ display: 'grid', gap: '16px' }}>
                {estadosActivos.map((estado) => (
                  <MapaSeguimientoPadre
                    key={`${estado.ViajeID}-${estado.AlumnoID || obtenerNombreAlumno(estado)}`}
                    viajeId={estado.ViajeID}
                    alumno={obtenerNombreAlumno(estado)}
                    ruta={estado.NombreRuta}
                  />
                ))}
              </div>
            </section>
          )}

          <section className="card" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: '900', marginBottom: '14px', color: '#0f172a' }}>
              Mis hijos
            </h3>

            <div style={{ display: 'grid', gap: '12px' }}>
              {hijos.map((hijo) => (
                <HijoCard key={hijo.AlumnoID || hijo.UsuarioID || hijo.NombreCompleto} hijo={hijo} />
              ))}
            </div>
          </section>

          <section className="card" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: '900', marginBottom: '14px', color: '#0f172a' }}>
              Estado del transporte hoy
            </h3>

            {estados.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', fontWeight: '700' }}>
                No hay movimientos de transporte registrados hoy.
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '12px' }}>
                {estados.map((estado, index) => (
                  <EstadoTransporteCard key={`${estado.AlumnoID || index}-${estado.Sentido || ''}`} estado={estado} />
                ))}
              </div>
            )}
          </section>

          <HistorialSemanal historial={historial} />
        </>
      )}

      <Toast
        mensaje={toast.mensaje}
        tipo={toast.tipo}
        onClose={() => setToast({ mensaje: '', tipo: '' })}
      />
    </div>
  );
};

export default PortalPadre;
