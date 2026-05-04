import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  Bus,
  CheckCircle,
  Clock,
  MapPin,
  Navigation,
  PlayCircle,
  StopCircle
} from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';
import TarjetaAlumno from './TarjetaAlumno';
import Toast from '../../components/Toast';
import ConfirmarAccionModal from '../../components/ConfirmarAccionModal';
import useSocket from '../../hooks/useSocket';
import {
  abrirTurno,
  cerrarTurno,
  deshacerEvento,
  enviarUbicacion,
  finalizarViaje,
  getRutaOptimizada,
  getSesion,
  iniciarViaje,
  registrarEvento
} from './conductor.api';
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';

const CENTRO_EL_SALVADOR = [13.7012, -89.2243];
const INTERVALO_ENVIO_GPS_MS = 12000;

const iconoBus = new L.DivIcon({
  html: '<div style="font-size:32px;line-height:32px;">🚌</div>',
  className: '',
  iconSize: [36, 36],
  iconAnchor: [18, 18]
});

const iconoAlumno = new L.DivIcon({
  html: '<div style="font-size:24px;line-height:24px;">👤</div>',
  className: '',
  iconSize: [28, 28],
  iconAnchor: [14, 14]
});

const obtenerMensajeError = (error, mensajeDefault) => {
  return error?.response?.data?.mensaje || error?.message || mensajeDefault;
};

const obtenerMensajeGps = (error) => {
  if (!error) return 'No se pudo obtener la ubicación actual.';

  if (error.code === 1) return 'Permiso de ubicación denegado. Habilita el GPS para enviar la posición del bus.';
  if (error.code === 2) return 'No se pudo determinar la ubicación. Verifica la señal GPS del dispositivo.';
  if (error.code === 3) return 'La solicitud de ubicación tardó demasiado. Intenta de nuevo.';

  return 'No se pudo obtener la ubicación actual.';
};

const coordenadaValida = (posicion) => {
  return (
    Array.isArray(posicion) &&
    posicion.length === 2 &&
    Number.isFinite(posicion[0]) &&
    Number.isFinite(posicion[1])
  );
};

const CentrarMapa = ({ posicion }) => {
  const map = useMap();

  useEffect(() => {
    if (coordenadaValida(posicion)) {
      map.setView(posicion, map.getZoom());
    }
  }, [posicion, map]);

  return null;
};

const InvalidarTamanoMapa = () => {
  const map = useMap();

  useEffect(() => {
    const timeout = setTimeout(() => {
      map.invalidateSize();
    }, 150);

    return () => clearTimeout(timeout);
  }, [map]);

  return null;
};

const MapaRutaConductor = ({ polilinea = [], paradas = [], posBus, mensajeMapa }) => {
  const tienePolilinea = Array.isArray(polilinea) && polilinea.length > 0;
  const tienePosBus = coordenadaValida(posBus);

  if (!tienePolilinea && !tienePosBus) {
    return (
      <div
        style={{
          minHeight: '260px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-muted)',
          fontWeight: '800',
          background: '#f8fafc',
          borderRadius: '16px',
          border: '1px dashed var(--border)'
        }}
      >
        📍 Esperando señal GPS...
      </div>
    );
  }

  const coords = tienePolilinea
    ? polilinea
      .filter((p) => Array.isArray(p) && p.length === 2 && Number.isFinite(Number(p[0])) && Number.isFinite(Number(p[1])))
      .map(([lng, lat]) => [Number(lat), Number(lng)])
    : [];

  const centro = tienePosBus ? posBus : coords.length > 0 ? coords[0] : CENTRO_EL_SALVADOR;

  const paradasValidas = paradas.filter((parada) => {
    if (!parada?.ubicacion || !Array.isArray(parada.ubicacion) || parada.ubicacion.length < 2) return false;
    const [lng, lat] = parada.ubicacion;
    return Number.isFinite(Number(lat)) && Number.isFinite(Number(lng));
  });

  return (
    <div>
      {mensajeMapa && (
        <div
          style={{
            marginBottom: '10px',
            padding: '10px 12px',
            borderRadius: '12px',
            background: '#fef3c7',
            color: '#92400e',
            fontWeight: '800',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <AlertCircle size={16} />
          {mensajeMapa}
        </div>
      )}

      <div style={{ height: '360px', width: '100%', borderRadius: '16px', overflow: 'hidden' }}>
        <MapContainer center={centro} zoom={15} style={{ height: '100%', width: '100%' }} scrollWheelZoom>
          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <InvalidarTamanoMapa />

          {coords.length > 1 && (
            <Polyline positions={coords} pathOptions={{ color: '#2563eb', weight: 5 }} />
          )}

          {tienePosBus && (
            <Marker position={posBus} icon={iconoBus}>
              <Popup>Tu posición actual</Popup>
            </Marker>
          )}

          {paradasValidas.map((parada, index) => {
            const [lng, lat] = parada.ubicacion;

            return (
              <Marker key={`${parada.id || 'parada'}-${index}`} position={[Number(lat), Number(lng)]} icon={iconoAlumno}>
                <Popup>
                  <strong>{parada.nombre || `Parada ${index + 1}`}</strong>
                  <br />
                  {parada.accion || 'Parada'}
                </Popup>
              </Marker>
            );
          })}

          {tienePosBus && <CentrarMapa posicion={posBus} />}
        </MapContainer>
      </div>
    </div>
  );
};

const DashboardConductor = () => {
  const { user } = useContext(AuthContext);
  const [sesion, setSesion] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [toast, setToast] = useState({ mensaje: '', tipo: '' });
  const [confirm, setConfirm] = useState(null);
  const [datosMapa, setDatosMapa] = useState({ polilinea: [], paradas: [] });
  const [mensajeMapa, setMensajeMapa] = useState('');
  const [posBus, setPosBus] = useState(null);
  const [gpsActivo, setGpsActivo] = useState(false);

  const watchIdRef = useRef(null);
  const intervaloRef = useRef(null);

  const mostrarToast = (mensaje, tipo) => setToast({ mensaje, tipo });

  const pedirConfirm = (titulo, mensaje, accion, tipo = 'warning') => {
    setConfirm({ titulo, mensaje, accion, tipo });
  };

  const ejecutarConfirm = async () => {
    const accion = confirm?.accion;
    setConfirm(null);
    if (accion) await accion();
  };

  const viajeId = sesion?.viaje?.ViajeID;

  const { emitir } = useSocket({
    activo: Boolean(viajeId),
    eventoUnirse: 'conductor:unirse',
    datosUnirse: { viajeId },
    escuchar: {}
  });

  const cargarSesion = useCallback(async () => {
    if (!user?.conductorId) {
      setCargando(false);
      return;
    }

    try {
      const res = await getSesion(user.conductorId);
      setSesion(res.data.data);
    } catch (error) {
      mostrarToast(obtenerMensajeError(error, 'Error al cargar la sesión'), 'error');
    } finally {
      setCargando(false);
    }
  }, [user?.conductorId]);

  useEffect(() => {
    cargarSesion();
  }, [cargarSesion]);

  useEffect(() => {
    const vId = sesion?.viaje?.ViajeID;
    const viajeEnCurso = sesion?.viaje?.EstadoViaje === 'En Curso';

    const limpiarGps = () => {
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
    };

    if (!viajeEnCurso || !vId) {
      limpiarGps();
      return limpiarGps;
    }

    if (!navigator.geolocation) {
      mostrarToast('GPS no disponible en este dispositivo.', 'error');
      return limpiarGps;
    }

    setGpsActivo(true);

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setPosBus([lat, lng]);
        emitir('conductor:ubicacion', { viajeId: vId, lat, lng });
      },
      (error) => {
        mostrarToast(obtenerMensajeGps(error), 'error');
      },
      {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 10000
      }
    );

    intervaloRef.current = setInterval(() => {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          try {
            await enviarUbicacion(vId, pos.coords.latitude, pos.coords.longitude);
          } catch (error) {
            console.warn('[GPS persistencia]', obtenerMensajeError(error, 'No se pudo guardar ubicación'));
          }
        },
        (error) => {
          console.warn('[GPS persistencia]', obtenerMensajeGps(error));
        },
        {
          enableHighAccuracy: true,
          maximumAge: 5000,
          timeout: 10000
        }
      );
    }, INTERVALO_ENVIO_GPS_MS);

    return limpiarGps;
  }, [sesion?.viaje?.ViajeID, sesion?.viaje?.EstadoViaje, emitir]);

  const cargarMapa = useCallback(async (rutaId, sentido) => {
    if (!navigator.geolocation) {
      setMensajeMapa('GPS no disponible. Se mostrará el panel sin ruta optimizada.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude: lat, longitude: lng } = pos.coords;
          setPosBus([lat, lng]);

          const res = await getRutaOptimizada(rutaId, lat, lng, sentido);

          if (res.data.ok && res.data.data?.polilinea?.length) {
            setDatosMapa(res.data.data);
            setMensajeMapa('');
            return;
          }

          setDatosMapa({ polilinea: [], paradas: res.data.data?.paradas || [] });
          setMensajeMapa(res.data.mensaje || 'Ruta optimizada no disponible. Se mostrará únicamente la ubicación actual.');
        } catch (error) {
          setDatosMapa({ polilinea: [], paradas: [] });
          setMensajeMapa(obtenerMensajeError(error, 'No se pudo calcular la ruta optimizada. Se mostrará únicamente la ubicación actual.'));
        }
      },
      (error) => {
        setMensajeMapa(obtenerMensajeGps(error));
      },
      {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 10000
      }
    );
  }, []);

  useEffect(() => {
    const viaje = sesion?.viaje;
    const turno = sesion?.turno;

    if (viaje?.EstadoViaje === 'En Curso' && turno?.RutaID) {
      cargarMapa(turno.RutaID, viaje.Sentido);
    } else {
      setDatosMapa({ polilinea: [], paradas: [] });
      setMensajeMapa('');
    }
  }, [sesion?.viaje?.ViajeID, sesion?.turno?.RutaID, cargarMapa]);

  const mapaEventos = (sesion?.eventos || []).reduce((acc, evento) => {
    acc[evento.AlumnoID] = evento;
    return acc;
  }, {});

  const alumnosPendientesBajar = (sesion?.alumnos || []).filter(
    (alumno) => mapaEventos[alumno.AlumnoID]?.TipoEvento === 'Abordó'
  );

  const handleAbrirTurno = async () => {
    try {
      await abrirTurno(user.conductorId, user.rutaId);
      mostrarToast('Turno abierto correctamente', 'success');
      await cargarSesion();
    } catch (error) {
      mostrarToast(obtenerMensajeError(error, 'Error al abrir turno'), 'error');
    }
  };

  const handleCerrarTurno = () => {
    pedirConfirm(
      'Cerrar turno del día',
      '¿Confirmas que deseas cerrar el turno? Esta acción finaliza tu jornada de hoy.',
      async () => {
        try {
          await cerrarTurno(sesion.turno.TurnoConductorID);
          mostrarToast('Turno cerrado. ¡Buen trabajo!', 'success');
          await cargarSesion();
        } catch (error) {
          mostrarToast(obtenerMensajeError(error, 'Error al cerrar turno'), 'error');
        }
      }
    );
  };

  const handleIniciarViaje = (sentido) => {
    pedirConfirm(
      `Iniciar viaje de ${sentido}`,
      sentido === 'Ida'
        ? '¿Confirmas el inicio del recorrido de recogida (Casa → Colegio)?'
        : '¿Confirmas el inicio del recorrido de regreso (Colegio → Casa)?',
      async () => {
        try {
          await iniciarViaje(sesion.turno.TurnoConductorID, user.rutaId, sentido);
          mostrarToast(`Viaje de ${sentido} iniciado`, 'success');
          await cargarSesion();
        } catch (error) {
          mostrarToast(obtenerMensajeError(error, 'Error al iniciar viaje'), 'error');
        }
      },
      'info'
    );
  };

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
          await cargarSesion();
        } catch (error) {
          mostrarToast(obtenerMensajeError(error, 'Error al finalizar viaje'), 'error');
        }
      }
    );
  };

  const handleRegistrarEvento = async (datos) => {
    try {
      await registrarEvento(datos);
      await cargarSesion();
    } catch (error) {
      mostrarToast(obtenerMensajeError(error, 'Error al registrar evento'), 'error');
    }
  };

  const handleDeshacerEvento = async (datos) => {
    try {
      await deshacerEvento(datos);
      await cargarSesion();
    } catch (error) {
      mostrarToast(obtenerMensajeError(error, 'Error al deshacer evento'), 'error');
    }
  };

  if (cargando) {
    return (
      <div style={{ padding: '32px', color: 'var(--text-muted)', fontWeight: '800' }}>
        Cargando tu sesión...
      </div>
    );
  }

  if (!user?.rutaId) {
    return (
      <div style={{ padding: '32px' }}>
        <h3>Sin ruta asignada</h3>
        <p>El administrador aún no ha asignado una ruta para este conductor.</p>
      </div>
    );
  }

  const { turno, viaje, viajesRealizados, alumnos } = sesion || {};
  const turnoAbierto = turno?.EstadoTurno === 'Abierto';
  const viajeEnCurso = viaje?.EstadoViaje === 'En Curso';
  const idaHecha = Boolean(viajesRealizados?.Ida);
  const vueltaHecha = Boolean(viajesRealizados?.Vuelta);
  const turnoLabel = user?.nombreRuta?.toLowerCase().includes('tarde') ? 'Tarde' : 'Mañana';
  const totalReg = Object.keys(mapaEventos).length;
  const totalAlumnos = alumnos?.length || 0;
  const hayPendientes = alumnosPendientesBajar.length > 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      <div className="page-header">
        <div>
          <h1>Mi Panel</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '4px', fontWeight: '700' }}>
            {user?.nombre} — Ruta: {user?.nombreRuta || '—'}
          </p>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '14px'
        }}
      >
        <div className="stat-card">
          <Bus size={22} color="var(--primary)" />
          <span>RUTA</span>
          <strong>{user?.nombreRuta || '—'}</strong>
        </div>

        <div className="stat-card">
          <Clock size={22} color="var(--primary)" />
          <span>TURNO</span>
          <strong>{turnoLabel}</strong>
        </div>

        <div className="stat-card">
          <Navigation size={22} color={gpsActivo ? '#059669' : 'var(--text-muted)'} />
          <span>GPS</span>
          <strong style={{ color: gpsActivo ? '#059669' : 'var(--text-muted)' }}>
            {gpsActivo ? 'Activo' : 'Inactivo'}
          </strong>
        </div>
      </div>

      <div className="table-card" style={{ padding: '20px' }}>
        <h3 style={{ marginBottom: '8px' }}>Estado del turno</h3>
        <h4 style={{ fontSize: '1.2rem', fontWeight: '800', color: turnoAbierto ? '#059669' : '#0f172a' }}>
          {turnoAbierto ? 'Turno Abierto' : 'Sin turno activo'}
        </h4>

        {turnoAbierto && turno?.HoraApertura && (
          <p style={{ color: 'var(--text-muted)', fontWeight: '700', marginTop: '4px' }}>
            Desde las {new Date(turno.HoraApertura).toLocaleTimeString('es-SV', { hour: '2-digit', minute: '2-digit' })}
          </p>
        )}

        <div style={{ display: 'flex', gap: '12px', marginTop: '16px', flexWrap: 'wrap' }}>
          {!turnoAbierto && (
            <button type="button" className="btn-primary" onClick={handleAbrirTurno}>
              <PlayCircle size={20} />
              Iniciar Turno
            </button>
          )}

          {turnoAbierto && !viajeEnCurso && (
            <button type="button" className="btn-secondary" onClick={handleCerrarTurno}>
              <StopCircle size={20} />
              Cerrar Turno
            </button>
          )}
        </div>
      </div>

      {turnoAbierto && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '14px'
          }}
        >
          {[
            { sentido: 'Ida', label: 'Viaje de Ida', sub: 'Casa → Colegio', hecho: idaHecha, color: 'var(--primary)' },
            { sentido: 'Vuelta', label: 'Viaje de Vuelta', sub: 'Colegio → Casa', hecho: vueltaHecha, color: '#10b981' }
          ].map(({ sentido, label, sub, hecho, color }) => {
            const esteEnCurso = viajeEnCurso && viaje?.Sentido === sentido;
            const bloqueado = sentido === 'Vuelta' && !idaHecha;

            return (
              <div key={sentido} className="table-card" style={{ padding: '18px' }}>
                <h3>{label}</h3>
                <p style={{ color: 'var(--text-muted)', fontWeight: '700', marginTop: '4px' }}>{sub}</p>

                <div style={{ marginTop: '16px' }}>
                  {hecho ? (
                    <span style={{ color: '#059669', fontWeight: '900', display: 'inline-flex', gap: '6px', alignItems: 'center' }}>
                      <CheckCircle size={18} />
                      Completado
                    </span>
                  ) : esteEnCurso ? (
                    <button type="button" className="btn-primary" onClick={handleFinalizarViaje}>
                      <StopCircle size={18} />
                      {hayPendientes ? `${alumnosPendientesBajar.length} pend.` : 'Finalizar'}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleIniciarViaje(sentido)}
                      disabled={viajeEnCurso || bloqueado}
                      style={{
                        background: viajeEnCurso || bloqueado ? '#f1f5f9' : color,
                        color: viajeEnCurso || bloqueado ? 'var(--text-muted)' : 'white',
                        border: 'none',
                        borderRadius: '10px',
                        padding: '8px 14px',
                        fontWeight: '800',
                        cursor: viajeEnCurso || bloqueado ? 'not-allowed' : 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <PlayCircle size={18} />
                      Iniciar
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {viajeEnCurso && (
        <div className="table-card" style={{ padding: '20px' }}>
          <h3 style={{ marginBottom: '12px' }}>Ruta optimizada — Viaje de {viaje?.Sentido}</h3>
          <MapaRutaConductor
            polilinea={datosMapa.polilinea}
            paradas={datosMapa.paradas}
            posBus={posBus}
            mensajeMapa={mensajeMapa}
          />
        </div>
      )}

      {viajeEnCurso && totalAlumnos > 0 && (
        <div className="table-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
            <h3>Alumnos — Viaje de {viaje?.Sentido}</h3>
            <span style={{ fontWeight: '900', color: 'var(--primary)' }}>{totalReg} / {totalAlumnos}</span>
          </div>

          {hayPendientes && (
            <div style={{ padding: '10px 12px', background: '#fef3c7', color: '#92400e', borderRadius: '12px', fontWeight: '800', marginBottom: '14px' }}>
              {alumnosPendientesBajar.length} alumno(s) sin registrar llegada — márcalos antes de finalizar.
            </div>
          )}

          <div style={{ display: 'grid', gap: '12px' }}>
            {alumnos.map((alumno) => (
              <TarjetaAlumno
                key={alumno.AlumnoID}
                alumno={alumno}
                evento={mapaEventos[alumno.AlumnoID]}
                conductorId={user.conductorId}
                rutaId={user.rutaId}
                sentido={viaje.Sentido}
                turno={turnoLabel}
                onRegistrar={handleRegistrarEvento}
                onDeshacer={handleDeshacerEvento}
              />
            ))}
          </div>
        </div>
      )}

      {viajeEnCurso && totalAlumnos === 0 && (
        <div className="table-card" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontWeight: '800' }}>
          No hay alumnos asignados para este sentido de viaje.
        </div>
      )}

      {turnoAbierto && !viajeEnCurso && (
        <div className="table-card" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontWeight: '800' }}>
          {idaHecha && vueltaHecha
            ? '✅ Ambos viajes completados. Puedes cerrar el turno.'
            : 'Inicia un viaje para registrar asistencia.'}
        </div>
      )}

      {confirm && (
        <ConfirmarAccionModal
          titulo={confirm.titulo}
          mensaje={confirm.mensaje}
          tipo={confirm.tipo}
          onClose={() => setConfirm(null)}
          onConfirm={ejecutarConfirm}
        />
      )}

      <Toast
        mensaje={toast.mensaje}
        tipo={toast.tipo}
        onClose={() => setToast({ mensaje: '', tipo: '' })}
      />
    </div>
  );
};

export default DashboardConductor;
