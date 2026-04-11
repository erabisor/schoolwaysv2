import React, { useState, useEffect, useContext } from 'react';
import { 
  Bus, Sunrise, Sunset, Power, LogIn, LogOut, X, 
  MessageSquare, RotateCcw, Map as MapIcon, Square, AlertCircle
} from 'lucide-react';
import { 
  getRutasDisponibles, abrirTurno, cerrarTurno, iniciarViaje, 
  finalizarViaje, registrarEvento, deshacerEvento, recuperarSesion,
  getRutaOptimizada 
} from './asistencias.api';
import { AuthContext } from '../../context/AuthContext';
import MapaRuta from './MapaRuta'; 
import Toast from '../../components/Toast';

const Asistencias = () => {
  const { user } = useContext(AuthContext); 
  const [rutas, setRutas] = useState([]);
  const [rutaSeleccionada, setRutaSeleccionada] = useState('');
  
  const [turnoActivo, setTurnoActivo] = useState(null); 
  const [viajeActivo, setViajeActivo] = useState(null); 
  const [alumnos, setAlumnos] = useState([]);
  
  const [datosMapa, setDatosMapa] = useState({ polilinea: [], paradas: [] });
  const [eventosRegistrados, setEventosRegistrados] = useState({}); 
  const [viajesRealizados, setViajesRealizados] = useState({ Ida: false, Vuelta: false });
  const [modalAbierto, setModalAbierto] = useState({ mostrar: false, titulo: '', mensaje: '', colorBoton: '', accion: null });
  const [toast, setToast] = useState({ mensaje: '', tipo: '' });
  const [procesando, setProcesando] = useState(false); 

  const mostrarToast = (mensaje, tipo) => setToast({ mensaje, tipo });

  const esAdmin = user?.rol === 1;
  const idUsuario = user?.id; 
  const idConductorReal = user?.conductorId; 

useEffect(() => {
    const cargarDatosIniciales = async () => {
      try {
        const resRutas = await getRutasDisponibles();
        let activas = (resRutas.data.data || []).filter(r => r.Estado == 1 || r.Estado === true);

        // FIX: SECUESTRO DE RUTAS
        // Si es conductor (Rol 2), filtramos para que SOLO vea su ruta asignada
        if (user?.rol === 2 && idConductorReal) {
          activas = activas.filter(r => Number(r.ConductorID) === Number(idConductorReal));
        }
        setRutas(activas);

        if (user?.rol === 2 && idUsuario) {
          const resSesion = await recuperarSesion(idUsuario);
          if (resSesion.data.success && resSesion.data.data.turno) {
            const { turno, viaje, alumnos, eventos, historial } = resSesion.data.data;
            setTurnoActivo(turno);
            setRutaSeleccionada(turno.RutaID);
            
            if (viaje) {
              setViajeActivo(viaje);
              setAlumnos(alumnos || []);
              
              const eventosMap = {};
              (eventos || []).forEach(e => { eventosMap[e.AlumnoID] = e.TipoEvento; });
              setEventosRegistrados(eventosMap);

              if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(async (pos) => {
                  try {
                    const resMapa = await getRutaOptimizada(turno.RutaID, pos.coords.latitude, pos.coords.longitude, viaje.Sentido);
                    if (resMapa.data.ok) setDatosMapa(resMapa.data.data);
                  } catch (e) { console.error("Error recuperando mapa"); }
                });
              }
            }

            // FIX: BLOQUEO DE VIAJES HEREDADOS
            // Aseguramos que si el historial tiene un viaje, se bloquee el botón
            setViajesRealizados({
              Ida: (historial || []).some(v => v.Sentido === 'Ida'),
              Vuelta: (historial || []).some(v => v.Sentido === 'Vuelta')
            });
          }
        }
      } catch (error) {
        console.error("Error en carga:", error);
      }
    };
    cargarDatosIniciales();
  }, [user, idUsuario, idConductorReal]); // <-- Agrega idConductorReal a las dependencias

 const handleAbrirTurno = async () => {
  if (!rutaSeleccionada) return mostrarToast("Selecciona una ruta primero", "error");

  setProcesando(true);
  try {
    // Para el admin: obtener el ConductorID de la ruta seleccionada
    // Para el conductor: usar su propio conductorId del token
    let conductorIdParaUsar;

    if (esAdmin) {
      const rutaInfo = rutas.find(r => Number(r.RutaID) === Number(rutaSeleccionada));
      if (!rutaInfo?.ConductorID) {
        mostrarToast("La ruta seleccionada no tiene conductor asignado", "error");
        setProcesando(false);
        return;
      }
      conductorIdParaUsar = rutaInfo.ConductorID;
    } else {
      conductorIdParaUsar = idConductorReal;
      if (!conductorIdParaUsar) {
        mostrarToast("No tienes perfil de conductor asociado", "error");
        setProcesando(false);
        return;
      }
    }

    const res = await abrirTurno(conductorIdParaUsar, rutaSeleccionada);
    setTurnoActivo(res.data.data);
    mostrarToast("Turno iniciado exitosamente", "success");
  } catch (error) {
    mostrarToast(error.response?.data?.mensaje || "Error al abrir turno", "error");
  } finally {
    setProcesando(false);
  }
};

  const handleIniciarViaje = async (sentido) => {
    if (!navigator.geolocation) return mostrarToast("GPS no disponible", "error");

    setProcesando(true);
    navigator.geolocation.getCurrentPosition(async (pos) => {
      try {
        const { latitude, longitude } = pos.coords;
        const res = await iniciarViaje(turnoActivo.TurnoConductorID, turnoActivo.RutaID, sentido);
        const resMapa = await getRutaOptimizada(turnoActivo.RutaID, latitude, longitude, sentido);

        setViajeActivo(res.data.data.viaje);
        setAlumnos(res.data.data.alumnos || []);
        setDatosMapa(resMapa.data.data);
        setEventosRegistrados({});
        setModalAbierto({ mostrar: false });
        mostrarToast(`Viaje de ${sentido} iniciado`, 'success');
      } catch (error) {
        mostrarToast("Error al conectar con el servidor", 'error');
      } finally {
        setProcesando(false);
      }
    }, () => {
      setProcesando(false);
      mostrarToast("Activa el GPS para iniciar el viaje", "error");
    });
  };

  const handleRegistrarEvento = async (alumnoId, tipo) => {
    if (esAdmin) return mostrarToast("Solo los conductores pueden registrar asistencia", "error");

    try {
      const rutaActual = rutas.find(r => r.RutaID === turnoActivo.RutaID);
      const turnoRuta = rutaActual ? rutaActual.Turno : 'Mañana';

      const datos = {
        ViajeID: viajeActivo.ViajeID,
        AlumnoID: alumnoId, 
        TipoEvento: tipo,
        ConductorID: idConductorReal,
        RutaID: turnoActivo.RutaID,
        Sentido: viajeActivo.Sentido,
        Turno: turnoRuta 
      };
      
      await registrarEvento(datos);
      
      // Actualiza el estado en UI para avanzar al siguiente paso del flujo
      setEventosRegistrados(prev => ({ ...prev, [alumnoId]: tipo }));
    } catch (error) {
      mostrarToast(error.response?.data?.mensaje || "Error al registrar asistencia", 'error');
    }
  };

  const handleDeshacerEvento = async (alumnoId) => {
    if (esAdmin) return mostrarToast("Modo solo lectura para administradores", "error");

    try {
      const tipoActual = eventosRegistrados[alumnoId];
      await deshacerEvento({ 
        alumnoId: alumnoId, 
        rutaId: turnoActivo.RutaID, 
        sentido: viajeActivo.Sentido, 
        tipoEvento: tipoActual 
      });
      const newEventos = { ...eventosRegistrados };
      delete newEventos[alumnoId];
      setEventosRegistrados(newEventos);
    } catch (error) {
      mostrarToast("No se pudo deshacer el cambio", 'error');
    }
  };

  const handleFinalizarViaje = async () => {
    setProcesando(true);
    try {
      await finalizarViaje(viajeActivo.ViajeID);
      setViajesRealizados(prev => ({ ...prev, [viajeActivo.Sentido]: true }));
      setViajeActivo(null);
      setAlumnos([]);
      setDatosMapa({ polilinea: [], paradas: [] });
      setModalAbierto({ mostrar: false });
      mostrarToast("Trayecto finalizado", 'success');
    } catch (error) {
      mostrarToast("Error al finalizar", 'error');
    } finally {
      setProcesando(false);
    }
  };

  const handleCerrarTurno = async () => {
    setProcesando(true);
    try {
      await cerrarTurno(turnoActivo.TurnoConductorID);
      setTurnoActivo(null);
      setRutaSeleccionada('');
      setViajesRealizados({ Ida: false, Vuelta: false });
      setModalAbierto({ mostrar: false });
      mostrarToast("Jornada terminada", "success");
    } catch (error) {
      mostrarToast(error.response?.data?.mensaje || "Error", "error");
    } finally {
      setProcesando(false);
    }
  };

  const btnOutlineStyle = (disabled) => ({
    padding: '6px 12px',
    background: 'white',
    border: '1px solid var(--border)',
    borderRadius: '8px',
    fontWeight: '600',
    fontSize: '13px',
    color: '#334155',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.6 : 1,
    transition: 'all 0.2s'
  });

  const rutaInfo = rutas.find(r => r.RutaID === turnoActivo?.RutaID);

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '2.2rem', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '12px' }}>
             <Bus color="var(--primary)" size={32} /> Panel de Operaciones
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1rem', marginTop: '4px' }}>
            {turnoActivo ? `Turno Abierto - Ruta: ${rutaInfo?.NombreRuta || ''} - ${rutaInfo?.Turno || ''}` : `Hola, ${user?.nombre}. Selecciona una ruta para iniciar.`}
          </p>
        </div>
        {turnoActivo && !viajeActivo && (
          <button 
            onClick={() => setModalAbierto({ mostrar: true, titulo: '¿Cerrar Turno?', mensaje: 'Confirmas que has terminado todos los viajes del día.', colorBoton: 'var(--danger)', accion: handleCerrarTurno })}
            style={{ background: 'transparent', color: '#dc2626', border: '1px solid #fecaca', display: 'flex', gap: '8px', padding: '10px 20px', borderRadius: '10px', fontWeight: '600', cursor: 'pointer' }}
          >
            <Power size={18}/> Cerrar Turno
          </button>
        )}
      </div>

      {viajeActivo && (
        <div style={{ border: '1px solid var(--primary)', borderRadius: '12px', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', background: 'white' }}>
          <span style={{ background: '#d1fae5', color: '#059669', padding: '6px 12px', borderRadius: '20px', fontWeight: '800', fontSize: '12px', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '8px', height: '8px', background: '#059669', borderRadius: '50%', display: 'inline-block' }}></span>
              Viaje de {viajeActivo.Sentido} en curso
          </span>
          <button 
            onClick={() => setModalAbierto({ mostrar: true, titulo: '¿Finalizar Viaje?', mensaje: 'Confirmas que has llegado al destino y finalizado el trayecto.', colorBoton: '#dc2626', accion: handleFinalizarViaje })}
            style={{ background: '#dc2626', color: 'white', padding: '10px 20px', borderRadius: '8px', border: 'none', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Square size={16} /> Finalizar Viaje
          </button>
        </div>
      )}

      {viajeActivo && datosMapa.polilinea && datosMapa.polilinea.length > 0 && (
        <div style={{ marginBottom: '30px' }}>
          <MapaRuta polilinea={datosMapa.polilinea} paradas={datosMapa.paradas} />
        </div>
      )}

      {!turnoActivo && (
        <div className="table-card" style={{ padding: '80px 40px', textAlign: 'center', borderRadius: '30px' }}>
          <div style={{ background: '#f0f7ff', width: '90px', height: '90px', borderRadius: '25px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
            <Bus size={45} color="var(--primary)" />
          </div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: '800', marginBottom: '12px' }}>Iniciar Jornada de Transporte</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '40px', maxWidth: '500px', margin: '0 auto 40px' }}>
            Al abrir el turno, el sistema notificará a los padres que el bus está listo para iniciar las rutas.
          </p>
          <div style={{ maxWidth: '450px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <select className="form-input" value={rutaSeleccionada} onChange={(e) => setRutaSeleccionada(e.target.value)} style={{ textAlign: 'center', fontWeight: '600', fontSize: '1rem', height: '55px' }}>
              <option value="">-- Elige la Ruta Asignada --</option>
              {rutas.map(r => <option key={r.RutaID} value={r.RutaID}>{r.NombreRuta} ({r.Turno})</option>)}
            </select>
            <button onClick={handleAbrirTurno} disabled={procesando || !rutaSeleccionada}
              className="btn-primary"
              style={{
                width: '100%', padding: '18px', borderRadius: '15px',
                fontWeight: '700', fontSize: '1.1rem',
                justifyContent: 'center'   // ← centra el contenido del flex
              }}>
              {procesando ? 'Procesando...' : '🚌 Iniciar Turno'}
            </button>
          </div>
        </div>
      )}

      {turnoActivo && !viajeActivo && (
        <div className="two-col-grid" style={{ gap: '30px' }}>
          <div className="table-card" style={{ padding: '40px', borderRadius: '25px', opacity: viajesRealizados.Ida ? 0.5 : 1, transition: 'all 0.3s' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <Sunrise size={50} color="#f59e0b" />
              {viajesRealizados.Ida && <div style={{ background: '#d1fae5', color: '#059669', padding: '5px 15px', borderRadius: '20px', fontWeight: '800', fontSize: '12px' }}>COMPLETADO</div>}
            </div>
            <h3 style={{ fontSize: '1.4rem', fontWeight: '800', marginBottom: '10px' }}>Viaje de Ida</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '30px' }}>Trayecto desde las casas hacia el colegio.</p>
            <button disabled={viajesRealizados.Ida || procesando} onClick={() => setModalAbierto({ mostrar: true, titulo: '¿Iniciar Viaje de Ida?', mensaje: 'Se notificará a los padres que el bus va en camino a las casas.', colorBoton: '#f59e0b', accion: () => handleIniciarViaje('Ida') })} style={{ width: '100%', padding: '15px', background: '#f59e0b', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '700', cursor: 'pointer' }}>
              {viajesRealizados.Ida ? 'Finalizado' : 'Comenzar Recorrido'}
            </button>
          </div>

          <div className="table-card" style={{ padding: '40px', borderRadius: '25px', opacity: viajesRealizados.Vuelta ? 0.5 : 1, transition: 'all 0.3s' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <Sunset size={50} color="#6366f1" />
              {viajesRealizados.Vuelta && <div style={{ background: '#d1fae5', color: '#059669', padding: '5px 15px', borderRadius: '20px', fontWeight: '800', fontSize: '12px' }}>COMPLETADO</div>}
            </div>
            <h3 style={{ fontSize: '1.4rem', fontWeight: '800', marginBottom: '10px' }}>Viaje de Vuelta</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '30px' }}>Trayecto desde el colegio de regreso a las casas.</p>
            <button disabled={viajesRealizados.Vuelta || procesando} onClick={() => setModalAbierto({ mostrar: true, titulo: '¿Iniciar Viaje de Vuelta?', mensaje: 'Se notificará que los alumnos están saliendo del colegio.', colorBoton: '#6366f1', accion: () => handleIniciarViaje('Vuelta') })} style={{ width: '100%', padding: '15px', background: '#6366f1', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '700', cursor: 'pointer' }}>
              {viajesRealizados.Vuelta ? 'Finalizado' : 'Comenzar Recorrido'}
            </button>
          </div>
        </div>
      )}

      {viajeActivo && (
        <div style={{ background: 'white', borderRadius: '12px', border: '1px solid var(--border)', overflow: 'hidden' }}>
          <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', background: '#f8fafc', fontWeight: '700', color: '#0f172a' }}>
            Lista de Pasajeros
          </div>
          
          <div style={{ padding: '0 24px' }}>
            {alumnos.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>No hay alumnos para este viaje.</div>
            ) : alumnos.map((alumno, index) => {
              const evento = eventosRegistrados[alumno.AlumnoID];
              const nombreMostrar = alumno.NombreCompleto || (alumno.Nombre ? `${alumno.Nombre} ${alumno.Apellido}` : 'Alumno Sin Nombre');
              const isLast = index === alumnos.length - 1;

              return (
                <div key={alumno.AlumnoID} style={{ padding: '20px 0', borderBottom: isLast ? 'none' : '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  
                  <div>
                    <div style={{ fontWeight: '700', color: '#0f172a', fontSize: '15px', marginBottom: '4px' }}>{nombreMostrar}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>{alumno.Direccion}</div>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    
                    {/* FASE 1: Pendiente (Sin registro) */}
                    {!evento && (
                      <>
                        <button disabled={esAdmin} onClick={() => handleRegistrarEvento(alumno.AlumnoID, 'Abordó')} style={btnOutlineStyle(esAdmin)}>
                          <LogIn size={16} /> Subió
                        </button>
                        <button disabled={esAdmin} onClick={() => handleRegistrarEvento(alumno.AlumnoID, 'Ausente')} style={{ ...btnOutlineStyle(esAdmin), padding: '8px' }} title="No se presentó">
                          <X size={16} />
                        </button>
                        <button disabled={esAdmin} onClick={() => handleRegistrarEvento(alumno.AlumnoID, 'AvisóAusencia')} style={{ ...btnOutlineStyle(esAdmin), padding: '8px' }} title="Aviso de Padre">
                          <MessageSquare size={16} />
                        </button>
                      </>
                    )}

                    {/* FASE 2: En Tránsito (Ya abordó, ahora puede bajar) */}
                    {evento === 'Abordó' && (
                      <>
                        <span style={{ padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '700', background: '#d1fae5', color: '#059669' }}>
                           ABORDÓ
                        </span>
                        <button disabled={esAdmin} onClick={() => handleRegistrarEvento(alumno.AlumnoID, 'Bajó')} style={{ ...btnOutlineStyle(esAdmin), background: '#e0f2fe', borderColor: '#bae6fd', color: '#0369a1' }}>
                          <LogOut size={16} /> Bajó
                        </button>
                        <button disabled={esAdmin} onClick={() => handleDeshacerEvento(alumno.AlumnoID)} style={{ ...btnOutlineStyle(esAdmin), padding: '6px 10px', background: '#f8fafc' }} title="Deshacer acción">
                           <RotateCcw size={16} />
                        </button>
                      </>
                    )}

                    {/* FASE 3: Finalizado (Bajó o Ausente) */}
                    {(evento === 'Bajó' || evento === 'Ausente' || evento === 'AvisóAusencia') && (
                      <>
                        <span style={{ padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', background: evento === 'Bajó' ? '#e0f2fe' : '#fee2e2', color: evento === 'Bajó' ? '#0369a1' : '#dc2626' }}>
                           {evento === 'AvisóAusencia' ? 'AVISÓ PADRE' : evento}
                        </span>
                        <button disabled={esAdmin} onClick={() => handleDeshacerEvento(alumno.AlumnoID)} style={{ ...btnOutlineStyle(esAdmin), padding: '6px 10px', background: '#f8fafc' }} title="Deshacer acción">
                           <RotateCcw size={16} />
                        </button>
                      </>
                    )}

                  </div>

                </div>
              );
            })}
          </div>
        </div>
      )}

      {modalAbierto.mostrar && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ textAlign: 'center', padding: '40px' }}>
            <AlertCircle size={60} color={modalAbierto.colorBoton} style={{ marginBottom: '20px' }} />
            <h2 style={{ fontSize: '1.6rem', fontWeight: '800', marginBottom: '15px' }}>{modalAbierto.titulo}</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '35px', lineHeight: '1.6' }}>{modalAbierto.mensaje}</p>
            <div style={{ display: 'flex', gap: '15px' }}>
              <button onClick={() => setModalAbierto({ mostrar: false })} disabled={procesando} style={{ flex: 1, padding: '15px', background: '#f1f5f9', borderRadius: '12px', border: 'none', fontWeight: '700', cursor: 'pointer' }}>Cancelar</button>
              <button onClick={modalAbierto.accion} disabled={procesando} style={{ flex: 1, padding: '15px', background: modalAbierto.colorBoton, color: 'white', borderRadius: '12px', border: 'none', fontWeight: '700', cursor: 'pointer' }}>{procesando ? 'Procesando...' : 'Confirmar'}</button>
            </div>
          </div>
        </div>
      )}

      <Toast mensaje={toast.mensaje} tipo={toast.tipo} onClose={() => setToast({ mensaje: '', tipo: '' })} />
    </div>
  );
};

export default Asistencias;