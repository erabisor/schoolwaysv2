import { useEffect, useState, useContext, useCallback, useRef } from 'react';
import { Bus, PlayCircle, StopCircle, CheckCircle, Clock, AlertCircle, MapPin, Navigation } from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';
import TarjetaAlumno from './TarjetaAlumno';
import Toast from '../../components/Toast';
import ConfirmarAccionModal from '../../components/ConfirmarAccionModal';
import useSocket from '../../hooks/useSocket';
import {
  getSesion, abrirTurno, cerrarTurno,
  iniciarViaje, finalizarViaje,
  registrarEvento, deshacerEvento,
  enviarUbicacion, getRutaOptimizada
} from './conductor.api';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';

// ── Icono del bus conductor ──────────────────────────────────
const iconoBus = new L.DivIcon({
  html: `<div style="background:#2563eb;color:white;border-radius:50%;width:36px;height:36px;
    display:flex;align-items:center;justify-content:center;
    font-size:18px;box-shadow:0 2px 8px rgba(0,0,0,0.3);border:3px solid white;">🚌</div>`,
  className: '',
  iconSize: [36, 36],
  iconAnchor: [18, 18]
});

const iconoAlumno = new L.DivIcon({
  html: `<div style="background:#10b981;color:white;border-radius:50%;width:28px;height:28px;
    display:flex;align-items:center;justify-content:center;
    font-size:14px;box-shadow:0 2px 6px rgba(0,0,0,0.2);border:2px solid white;">👤</div>`,
  className: '',
  iconSize: [28, 28],
  iconAnchor: [14, 14]
});

// Componente que centra el mapa en la posición del bus
const CentrarMapa = ({ posicion }) => {
  const map = useMap();
  useEffect(() => {
    if (posicion) map.setView(posicion, map.getZoom());
  }, [posicion, map]);
  return null;
};

// ── Mapa de ruta del conductor ───────────────────────────────
const MapaRutaConductor = ({ polilinea = [], paradas = [], posBus }) => {
  // Validar que haya algo que mostrar
  const tienePolilinea = Array.isArray(polilinea) && polilinea.length > 0;
  const tienePosBus    = Array.isArray(posBus) && posBus.length === 2 &&
                         typeof posBus[0] === 'number' && typeof posBus[1] === 'number' &&
                         !isNaN(posBus[0]) && !isNaN(posBus[1]);
 
  if (!tienePolilinea && !tienePosBus) {
    return (
      <div style={{
        height: '200px', borderRadius: '12px', background: '#f1f5f9',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'var(--text-muted)', fontSize: '14px', fontWeight: '600'
      }}>
        📍 Esperando señal GPS...
      </div>
    );
  }
 
  // La polilinea viene como [lng, lat] de ORS — Leaflet necesita [lat, lng]
  const coords = tienePolilinea
    ? polilinea
        .filter(p => Array.isArray(p) && p.length === 2 && !isNaN(p[0]) && !isNaN(p[1]))
        .map(([lng, lat]) => [lat, lng])
    : [];
 
  // Centro del mapa: preferir posición del bus, sino primer punto de ruta
  const centro = tienePosBus
    ? posBus
    : coords.length > 0
    ? coords[0]
    : [-13.7, -89.2]; // fallback El Salvador
 
  // Paradas válidas — filtrar las que no tienen ubicación o tienen coordenadas inválidas
  const paradasValidas = paradas.filter(p => {
    if (!p?.ubicacion || !Array.isArray(p.ubicacion) || p.ubicacion.length < 2) return false;
    const [lng, lat] = p.ubicacion;
    return typeof lat === 'number' && typeof lng === 'number' && !isNaN(lat) && !isNaN(lng);
  });
 
  return (
    <MapContainer
      center={centro}
      zoom={14}
      style={{ height: '300px', width: '100%', borderRadius: '12px' }}
      scrollWheelZoom={false}
    >
      <TileLayer
        attribution='&copy; OpenStreetMap'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
 
      {coords.length > 1 && (
        <Polyline positions={coords} color="#2563eb" weight={4} opacity={0.8} />
      )}
 
      {tienePosBus && (
        <Marker position={posBus} icon={iconoBus}>
          <Popup>📍 Tu posición actual</Popup>
        </Marker>
      )}
 
      {paradasValidas.map((p, i) => {
        const [lng, lat] = p.ubicacion;
        return (
          <Marker key={i} position={[lat, lng]} icon={iconoAlumno}>
            <Popup>
              <strong>{p.nombre || `Parada ${i + 1}`}</strong>
              <br />{p.accion}
            </Popup>
          </Marker>
        );
      })}
 
      {tienePosBus && <CentrarMapa posicion={posBus} />}
    </MapContainer>
  );
};

// ── Componente principal ─────────────────────────────────────
const DashboardConductor = () => {
  const { user } = useContext(AuthContext);

  const [sesion, setSesion]       = useState(null);
  const [cargando, setCargando]   = useState(true);
  const [toast, setToast]         = useState({ mensaje: '', tipo: '' });
  const [confirm, setConfirm]     = useState(null);
  const [datosMapa, setDatosMapa] = useState({ polilinea: [], paradas: [] });
  const [posBus, setPosBus]       = useState(null); // [lat, lng] actual del conductor
  const [gpsActivo, setGpsActivo] = useState(false);

  const watchIdRef    = useRef(null); // ID del watchPosition para limpiarlo
  const intervaloRef  = useRef(null); // Intervalo de envío al backend

  const mostrarToast = (m, t) => setToast({ mensaje: m, tipo: t });

  const pedirConfirm = (titulo, mensaje, accion, tipo = 'warning') =>
    setConfirm({ titulo, mensaje, accion, tipo });

  const ejecutarConfirm = async () => {
    const accion = confirm?.accion;
    setConfirm(null);
    if (accion) await accion();
  };

  // ── Socket.io — el conductor emite su posición, la sala escucha ──
  const viajeId = sesion?.viaje?.ViajeID;
  const { emitir } = useSocket({
    activo:       !!viajeId,
    eventoUnirse: 'conductor:unirse',
    datosUnirse:  { viajeId },
    escuchar: {}
  });

  // ── Cargar sesión ────────────────────────────────────────────
  const cargarSesion = useCallback(async () => {
    if (!user?.conductorId) return;
    try {
      const res = await getSesion(user.conductorId);
      setSesion(res.data.data);
    } catch {
      mostrarToast('Error al cargar la sesión', 'error');
    } finally {
      setCargando(false);
    }
  }, [user]);

  useEffect(() => { cargarSesion(); }, [cargarSesion]);

  // ── GPS — se activa cuando hay viaje en curso ─────────────────
  useEffect(() => {
    const vId = sesion?.viaje?.ViajeID;
    const viajeEnCurso = sesion?.viaje?.EstadoViaje === 'En Curso';

    if (viajeEnCurso && vId) {
      if (!navigator.geolocation) {
        mostrarToast('GPS no disponible en este dispositivo', 'error');
        return;
      }

      setGpsActivo(true);

      // Seguimiento continuo del GPS
      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          const { latitude: lat, longitude: lng } = pos.coords;
          setPosBus([lat, lng]);

          // Emitir por socket (tiempo real)
          emitir('conductor:ubicacion', { viajeId: vId, lat, lng });
        },
        (err) => console.warn('[GPS]', err.message),
        { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
      );

      // También enviar al backend cada 12 segundos (persistencia en BD)
      intervaloRef.current = setInterval(async () => {
        if (watchIdRef.current !== null) {
          navigator.geolocation.getCurrentPosition(
            async (pos) => {
              try {
                await enviarUbicacion(vId, pos.coords.latitude, pos.coords.longitude);
              } catch { /* silencioso */ }
            },
            () => {}
          );
        }
      }, 12000);

    } else {
      // Limpiar GPS al finalizar viaje
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      if (intervaloRef.current) {
        clearInterval(intervaloRef.current);
        intervaloRef.current = null;
      }
      setGpsActivo(false);
      setPosBus(null);
    }

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      if (intervaloRef.current) {
        clearInterval(intervaloRef.current);
        intervaloRef.current = null;
      }
    };
  }, [sesion?.viaje?.ViajeID, sesion?.viaje?.EstadoViaje, emitir]);

  // ── Cargar mapa cuando inicia viaje ──────────────────────────
  const cargarMapa = useCallback(async (rutaId, sentido) => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(async (pos) => {
      try {
        const { latitude: lat, longitude: lng } = pos.coords;
        setPosBus([lat, lng]);
        const res = await getRutaOptimizada(rutaId, lat, lng, sentido);
        if (res.data.ok && res.data.data?.polilinea?.length) {
          setDatosMapa(res.data.data);
        }
      } catch { /* si ORS falla, el mapa solo muestra la posición */ }
    }, () => {});
  }, []);

  useEffect(() => {
    const v = sesion?.viaje;
    const t = sesion?.turno;
    if (v?.EstadoViaje === 'En Curso' && t?.RutaID) {
      cargarMapa(t.RutaID, v.Sentido);
    } else {
      setDatosMapa({ polilinea: [], paradas: [] });
    }
  }, [sesion?.viaje?.ViajeID, cargarMapa]);

  // ── Mapa de eventos ───────────────────────────────────────────
  const mapaEventos = (sesion?.eventos || []).reduce((acc, e) => {
    acc[e.AlumnoID] = e;
    return acc;
  }, {});

  const alumnosPendientesBajar = (sesion?.alumnos || []).filter(
    a => mapaEventos[a.AlumnoID]?.TipoEvento === 'Abordó'
  );

  // ── Acciones ──────────────────────────────────────────────────
  const handleAbrirTurno = async () => {
    try {
      await abrirTurno(user.conductorId, user.rutaId);
      mostrarToast('Turno abierto correctamente', 'success');
      cargarSesion();
    } catch (err) {
      mostrarToast(err.response?.data?.mensaje || 'Error al abrir turno', 'error');
    }
  };

  const handleCerrarTurno = () => pedirConfirm(
    'Cerrar turno del día',
    '¿Confirmas que deseas cerrar el turno? Esta acción finaliza tu jornada de hoy.',
    async () => {
      try {
        await cerrarTurno(sesion.turno.TurnoConductorID);
        mostrarToast('Turno cerrado. ¡Buen trabajo!', 'success');
        cargarSesion();
      } catch (err) {
        mostrarToast(err.response?.data?.mensaje || 'Error al cerrar turno', 'error');
      }
    }
  );

  const handleIniciarViaje = (sentido) => pedirConfirm(
    `Iniciar viaje de ${sentido}`,
    sentido === 'Ida'
      ? '¿Confirmas el inicio del recorrido de recogida (Casa → Colegio)?'
      : '¿Confirmas el inicio del recorrido de regreso (Colegio → Casa)?',
    async () => {
      try {
        await iniciarViaje(sesion.turno.TurnoConductorID, user.rutaId, sentido);
        mostrarToast(`Viaje de ${sentido} iniciado`, 'success');
        cargarSesion();
      } catch (err) {
        mostrarToast('Error al iniciar viaje', 'error');
      }
    },
    'info'
  );

  const handleFinalizarViaje = () => {
    if (alumnosPendientesBajar.length > 0) {
      mostrarToast(`${alumnosPendientesBajar.length} alumno(s) sin registrar llegada`, 'error');
      return;
    }
    pedirConfirm(
      'Finalizar viaje',
      '¿Confirmas que el viaje ha concluido y todos los alumnos fueron atendidos?',
      async () => {
        try {
          await finalizarViaje(sesion.viaje.ViajeID);
          mostrarToast('Viaje finalizado correctamente', 'success');
          cargarSesion();
        } catch (err) {
          mostrarToast('Error al finalizar viaje', 'error');
        }
      }
    );
  };

  const handleRegistrarEvento = async (datos) => {
    try { await registrarEvento(datos); cargarSesion(); }
    catch (err) { mostrarToast(err.response?.data?.mensaje || 'Error al registrar', 'error'); }
  };

  const handleDeshacerEvento = async (datos) => {
    try { await deshacerEvento(datos); cargarSesion(); }
    catch { mostrarToast('Error al deshacer', 'error'); }
  };

  // ── Render ────────────────────────────────────────────────────
  if (cargando) return (
    <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
      Cargando tu sesión...
    </div>
  );

  if (!user?.rutaId) return (
    <div style={{ textAlign: 'center', paddingTop: '60px' }}>
      <Bus size={56} color="#cbd5e1" style={{ margin: '0 auto 12px' }} />
      <h2 style={{ color: '#0f172a', marginBottom: '8px' }}>Sin ruta asignada</h2>
      <p style={{ color: 'var(--text-muted)' }}>El administrador aún no te ha asignado a ninguna ruta.</p>
    </div>
  );

  const { turno, viaje, viajesRealizados, alumnos } = sesion || {};
  const turnoAbierto  = turno?.EstadoTurno === 'Abierto';
  const viajeEnCurso  = viaje?.EstadoViaje === 'En Curso';
  const idaHecha      = viajesRealizados?.Ida;
  const vueltaHecha   = viajesRealizados?.Vuelta;
  const turnoLabel    = user?.nombreRuta?.toLowerCase().includes('tarde') ? 'Tarde' : 'Mañana';
  const totalReg      = Object.keys(mapaEventos).length;
  const totalAlumnos  = alumnos?.length || 0;
  const hayPendientes = alumnosPendientesBajar.length > 0;

  return (
    <div>
      {/* Encabezado */}
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ fontSize: 'clamp(1.4rem, 5vw, 2rem)', fontWeight: '800', color: '#0f172a', marginBottom: '4px' }}>
          Mi Panel
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
          <strong>{user?.nombre}</strong> —
          Ruta: <strong style={{ color: 'var(--primary)' }}>{user?.nombreRuta || '—'}</strong>
        </p>
      </div>

      {/* Info de ruta y bus — visible siempre */}
      <div style={{
        background: 'white', borderRadius: '14px', padding: '16px 20px',
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', marginBottom: '16px',
        display: 'flex', gap: '24px', flexWrap: 'wrap'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <MapPin size={18} color="var(--primary)" />
          <div>
            <p style={{ margin: 0, fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)' }}>RUTA</p>
            <p style={{ margin: 0, fontWeight: '700', fontSize: '14px' }}>{user?.nombreRuta || '—'}</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Bus size={18} color="#10b981" />
          <div>
            <p style={{ margin: 0, fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)' }}>TURNO</p>
            <p style={{ margin: 0, fontWeight: '700', fontSize: '14px' }}>{turnoLabel}</p>
          </div>
        </div>
        {gpsActivo && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginLeft: 'auto' }}>
            <div style={{
              width: '8px', height: '8px', borderRadius: '50%',
              background: '#10b981', animation: 'pulse 1.5s infinite'
            }} />
            <span style={{ fontSize: '12px', fontWeight: '700', color: '#10b981' }}>GPS Activo</span>
          </div>
        )}
      </div>

      {/* Estado del turno */}
      <div style={{
        background: 'white', borderRadius: '16px', padding: '20px 24px',
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', marginBottom: '16px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ background: turnoAbierto ? '#d1fae5' : '#f1f5f9', padding: '12px', borderRadius: '12px', flexShrink: 0 }}>
            <Clock size={24} color={turnoAbierto ? '#059669' : '#94a3b8'} />
          </div>
          <div>
            <p style={{ margin: 0, fontWeight: '600', color: 'var(--text-muted)', fontSize: '12px' }}>Estado del turno</p>
            <h3 style={{ margin: 0, fontSize: 'clamp(1rem, 4vw, 1.3rem)', fontWeight: '800' }}>
              {turnoAbierto ? 'Turno Abierto' : 'Sin turno activo'}
            </h3>
            {turnoAbierto && turno?.HoraApertura && (
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>
                Desde las {new Date(turno.HoraApertura).toLocaleTimeString('es-SV', { hour: '2-digit', minute: '2-digit' })}
              </p>
            )}
          </div>
        </div>

        {!turnoAbierto ? (
          <button onClick={handleAbrirTurno} style={{
            background: 'var(--primary)', color: 'white', border: 'none',
            borderRadius: '12px', padding: '12px 20px', fontWeight: '800',
            fontSize: '14px', cursor: 'pointer', display: 'flex', gap: '8px', alignItems: 'center'
          }}>
            <PlayCircle size={18} /> Iniciar Turno
          </button>
        ) : !viajeEnCurso ? (
          <button onClick={handleCerrarTurno} style={{
            background: '#f1f5f9', color: 'var(--text-muted)', border: 'none',
            borderRadius: '12px', padding: '12px 20px', fontWeight: '700',
            fontSize: '14px', cursor: 'pointer', display: 'flex', gap: '8px', alignItems: 'center'
          }}>
            <StopCircle size={18} /> Cerrar Turno
          </button>
        ) : null}
      </div>

      {/* Tarjetas de viaje */}
      {turnoAbierto && (
        <div className="two-col-grid" style={{ marginBottom: '16px' }}>
          {[
            { sentido: 'Ida',    label: 'Viaje de Ida',    sub: 'Casa → Colegio', hecho: idaHecha,    color: 'var(--primary)' },
            { sentido: 'Vuelta', label: 'Viaje de Vuelta', sub: 'Colegio → Casa', hecho: vueltaHecha, color: '#10b981' }
          ].map(({ sentido, label, sub, hecho, color }) => {
            const esteEnCurso = viajeEnCurso && viaje?.Sentido === sentido;
            const bloqueado   = sentido === 'Vuelta' && !idaHecha;
            return (
              <div key={sentido} style={{
                background: 'white', borderRadius: '14px', padding: '18px 20px',
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', opacity: hecho ? 0.65 : 1
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                  <div>
                    <p style={{ margin: 0, fontWeight: '700', fontSize: '14px' }}>{label}</p>
                    <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>{sub}</p>
                  </div>
                  {hecho ? (
                    <span style={{ color: '#059669', fontWeight: '700', fontSize: '13px', display: 'flex', gap: '4px', alignItems: 'center' }}>
                      <CheckCircle size={14} /> Completado
                    </span>
                  ) : esteEnCurso ? (
                    <button onClick={handleFinalizarViaje} disabled={hayPendientes} style={{
                      background: hayPendientes ? '#fef2f2' : '#ef4444',
                      color: hayPendientes ? '#dc2626' : 'white',
                      border: hayPendientes ? '1px solid #fecaca' : 'none',
                      borderRadius: '10px', padding: '8px 14px', fontWeight: '700', fontSize: '13px',
                      cursor: hayPendientes ? 'not-allowed' : 'pointer',
                      display: 'flex', alignItems: 'center', gap: '5px'
                    }}>
                      {hayPendientes ? <><AlertCircle size={13} /> {alumnosPendientesBajar.length} pend.</> : 'Finalizar'}
                    </button>
                  ) : (
                    <button onClick={() => handleIniciarViaje(sentido)} disabled={viajeEnCurso || bloqueado} style={{
                      background: (viajeEnCurso || bloqueado) ? '#f1f5f9' : color,
                      color: (viajeEnCurso || bloqueado) ? 'var(--text-muted)' : 'white',
                      border: 'none', borderRadius: '10px', padding: '8px 14px',
                      fontWeight: '700', fontSize: '13px',
                      cursor: (viajeEnCurso || bloqueado) ? 'not-allowed' : 'pointer'
                    }}>
                      Iniciar
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Mapa — solo durante viaje en curso */}
      {viajeEnCurso && (
        <div style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <Navigation size={16} color="var(--primary)" />
            <span style={{ fontWeight: '700', fontSize: '14px' }}>
              Ruta optimizada — Viaje de {viaje?.Sentido}
            </span>
          </div>
          <MapaRutaConductor
            polilinea={datosMapa.polilinea}
            paradas={datosMapa.paradas}
            posBus={posBus}
          />
        </div>
      )}

      {/* Lista de alumnos */}
      {viajeEnCurso && totalAlumnos > 0 && (
        <div style={{ background: 'white', borderRadius: '16px', padding: '20px 24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: '800', margin: 0 }}>
              Alumnos — Viaje de {viaje?.Sentido}
            </h2>
            <span style={{
              fontSize: '13px', fontWeight: '700', padding: '4px 12px', borderRadius: '99px',
              background: totalReg === totalAlumnos ? '#d1fae5' : '#f1f5f9',
              color: totalReg === totalAlumnos ? '#059669' : 'var(--text-muted)'
            }}>
              {totalReg} / {totalAlumnos}
            </span>
          </div>

          {hayPendientes && (
            <div style={{
              background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px',
              padding: '10px 14px', marginBottom: '12px',
              display: 'flex', alignItems: 'center', gap: '8px',
              fontSize: '13px', color: '#dc2626', fontWeight: '600'
            }}>
              <AlertCircle size={15} />
              {alumnosPendientesBajar.length} alumno(s) sin registrar llegada — márcalos antes de finalizar.
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {alumnos.map(alumno => (
              <TarjetaAlumno
                key={alumno.AlumnoID}
                alumno={alumno}
                evento={mapaEventos[alumno.AlumnoID]}
                sentido={viaje?.Sentido}
                conductorId={user.conductorId}
                rutaId={user.rutaId}
                turno={turnoLabel}
                onRegistrar={handleRegistrarEvento}
                onDeshacer={handleDeshacerEvento}
              />
            ))}
          </div>
        </div>
      )}

      {/* Estado vacío */}
      {turnoAbierto && !viajeEnCurso && (
        <div style={{ background: 'white', borderRadius: '16px', padding: '40px', textAlign: 'center', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <Bus size={44} color="#cbd5e1" style={{ margin: '0 auto 12px' }} />
          <p style={{ color: 'var(--text-muted)', fontWeight: '600', fontSize: '14px' }}>
            {idaHecha && vueltaHecha
              ? '✅ Ambos viajes completados. Puedes cerrar el turno.'
              : 'Inicia un viaje para registrar asistencia.'}
          </p>
        </div>
      )}

      {confirm && (
        <ConfirmarAccionModal
          titulo={confirm.titulo}
          mensaje={confirm.mensaje}
          tipo={confirm.tipo || 'warning'}
          onConfirmar={ejecutarConfirm}
          onCancelar={() => setConfirm(null)}
        />
      )}

      <Toast mensaje={toast.mensaje} tipo={toast.tipo} onClose={() => setToast({ mensaje: '', tipo: '' })} />
    </div>
  );
};

export default DashboardConductor;
