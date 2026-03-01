import React, { useState, useEffect } from 'react';
import { Square, Bus, AlertCircle, Sunrise, Sunset, Power, LogIn, LogOut, XCircle, MessageSquare, RotateCcw, Clock } from 'lucide-react';
import { getRutasDisponibles, abrirTurno, cerrarTurno, iniciarViaje, finalizarViaje, registrarEvento, deshacerEvento, recuperarSesion } from './asistencias.api';
import Toast from '../../components/Toast';

const Asistencias = () => {
  const [rutas, setRutas] = useState([]);
  const [rutaSeleccionada, setRutaSeleccionada] = useState('');
  
  const [turnoActivo, setTurnoActivo] = useState(null); 
  const [viajeActivo, setViajeActivo] = useState(null); 
  const [alumnos, setAlumnos] = useState([]);
  
  const [eventosRegistrados, setEventosRegistrados] = useState({}); 
  const [viajesRealizados, setViajesRealizados] = useState({ Ida: false, Vuelta: false });
  
  const [modalAbierto, setModalAbierto] = useState({ mostrar: false, titulo: '', mensaje: '', colorBoton: '', accion: null });
  const [toast, setToast] = useState({ mensaje: '', tipo: '' });
  
  const [procesando, setProcesando] = useState(false); 

  const mostrarToast = (mensaje, tipo) => setToast({ mensaje, tipo });
  const conductorIdTemporal = 1; 

  useEffect(() => {
    const cargarTodo = async () => {
      try {
        const resRutas = await getRutasDisponibles();
        setRutas(resRutas.data.data.filter(r => r.Estado === true));

        const resSesion = await recuperarSesion(conductorIdTemporal);
        const sesion = resSesion.data.data;

        if (sesion.turno) {
          setTurnoActivo(sesion.turno);
          setRutaSeleccionada(sesion.turno.RutaID.toString());
          setViajesRealizados(sesion.viajesRealizados);

          if (sesion.viaje) {
            setViajeActivo(sesion.viaje);
            setAlumnos(sesion.alumnos);

            const mapaEventos = {};
            sesion.eventos.forEach(ev => {
              if (!mapaEventos[ev.AlumnoID]) mapaEventos[ev.AlumnoID] = {};
              mapaEventos[ev.AlumnoID][ev.TipoEvento] = true;
            });
            setEventosRegistrados(mapaEventos);
          }
        }
      } catch (error) { console.error(error); }
    };
    
    cargarTodo();
  }, []);

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (viajeActivo) {
        e.preventDefault();
        e.returnValue = ''; 
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [viajeActivo]);

  const handleAbrirTurno = async () => {
    setProcesando(true);
    try {
      const res = await abrirTurno(conductorIdTemporal, rutaSeleccionada);
      setTurnoActivo(res.data.data);
      setViajesRealizados({ Ida: false, Vuelta: false });
      mostrarToast('Turno abierto. Tu jornada ha comenzado.', 'success');
    } catch (error) { 
      mostrarToast(error.response?.data?.mensaje || 'Error al abrir el turno', 'error'); 
    } finally {
      setProcesando(false);
    }
  };

  const handleIniciarViaje = async (sentido) => {
    setProcesando(true);
    try {
      const res = await iniciarViaje(turnoActivo.TurnoConductorID, rutaSeleccionada, sentido);
      setViajeActivo(res.data.data.viaje);
      setAlumnos(res.data.data.alumnos);
      setEventosRegistrados({}); 
      mostrarToast(`Viaje de ${sentido} en curso.`, 'success');
    } catch (error) { 
      mostrarToast('Error al iniciar el viaje', 'error'); 
    } finally {
      setProcesando(false);
    }
  };

  const handleMarcarAsistencia = async (alumno, tipoEvento) => {
    if (procesando) return; 
    setProcesando(true);
    
    const rutaData = rutas.find(r => r.RutaID === parseInt(rutaSeleccionada));
    const datosEvento = {
      AlumnoID: alumno.AlumnoID, ConductorID: conductorIdTemporal, 
      RutaID: rutaData.RutaID, Sentido: viajeActivo.Sentido,
      TipoEvento: tipoEvento, Turno: rutaData.Turno, Observaciones: ''
    };

    try {
      await registrarEvento(datosEvento);
      setEventosRegistrados(prev => {
        const eventosActuales = prev[alumno.AlumnoID] || {};
        return { ...prev, [alumno.AlumnoID]: { ...eventosActuales, [tipoEvento]: true } };
      });
      mostrarToast(`${alumno.NombreCompleto}: ${tipoEvento}`, 'success');
    } catch (error) { 
      mostrarToast(error.response?.data?.mensaje || 'Error en validación', 'error'); 
    } finally {
      setProcesando(false);
    }
  };

  const handleDeshacer = async (alumno) => {
    if (procesando) return;
    setProcesando(true);
    
    const ev = eventosRegistrados[alumno.AlumnoID] || {};
    let ultimoEvento = null;
    
    if (ev['Bajó']) ultimoEvento = 'Bajó';
    else if (ev['Abordó']) ultimoEvento = 'Abordó';
    else if (ev['Ausente']) ultimoEvento = 'Ausente';
    else if (ev['AvisóAusencia']) ultimoEvento = 'AvisóAusencia';

    if (!ultimoEvento) {
      setProcesando(false);
      return;
    }

    const rutaData = rutas.find(r => r.RutaID === parseInt(rutaSeleccionada));
    const datos = {
      alumnoId: alumno.AlumnoID, rutaId: rutaData.RutaID, 
      sentido: viajeActivo.Sentido, tipoEvento: ultimoEvento
    };

    try {
      await deshacerEvento(datos);
      setEventosRegistrados(prev => {
        const copia = { ...prev };
        delete copia[alumno.AlumnoID][ultimoEvento];
        return copia;
      });
      mostrarToast(`Acción "${ultimoEvento}" anulada correctamente`, 'success');
    } catch (error) { 
      mostrarToast('Error al deshacer acción', 'error'); 
    } finally {
      setProcesando(false);
    }
  };

  const validarYFinalizarViaje = () => {
    const alumnosIncompletos = alumnos.filter(a => {
      const ev = eventosRegistrados[a.AlumnoID] || {};
      const falto = ev['Ausente'] || ev['AvisóAusencia'];
      const completo = ev['Abordó'] && ev['Bajó'];
      return !(falto || completo); 
    });
    
    if (alumnosIncompletos.length > 0) {
      mostrarToast(`⚠️ Faltan ${alumnosIncompletos.length} alumnos por completar su ciclo.`, 'error');
      return;
    }

    setModalAbierto({
      mostrar: true, 
      titulo: `¿Finalizar Viaje de ${viajeActivo.Sentido}?`,
      mensaje: 'La cadena de custodia está completa. ¿Deseas cerrar la bitácora de este recorrido?',
      colorBoton: '#dc2626',
      accion: async () => {
        if (procesando) return;
        setProcesando(true);
        try {
          await finalizarViaje(viajeActivo.ViajeID);
          setViajesRealizados(prev => ({ ...prev, [viajeActivo.Sentido]: true }));
          setViajeActivo(null);
          setAlumnos([]);
          setModalAbierto({ mostrar: false });
          mostrarToast('Viaje finalizado exitosamente', 'success');
        } catch (error) { 
          mostrarToast('Error al finalizar el viaje', 'error'); 
        } finally {
          setProcesando(false);
        }
      }
    });
  };

  const handleCerrarTurno = () => {
    setModalAbierto({
      mostrar: true, 
      titulo: '¿Cerrar Turno del Día?',
      mensaje: 'Esto indicará que tu jornada en esta ruta ha terminado por hoy.',
      colorBoton: '#0f172a',
      accion: async () => {
        if (procesando) return;
        setProcesando(true);
        try {
          await cerrarTurno(turnoActivo.TurnoConductorID);
          setTurnoActivo(null);
          setRutaSeleccionada('');
          setModalAbierto({ mostrar: false });
          mostrarToast('Jornada finalizada correctamente', 'success');
        } catch (error) { 
          mostrarToast(error.response?.data?.mensaje || 'Error al cerrar turno', 'error'); 
        } finally {
          setProcesando(false);
        }
      }
    });
  };

  return (
    <div style={{ padding: '24px', width: '100%' }}>
      {/* --- INYECCIÓN DE CSS PARA HOVERS --- */}
      <style>{`
        .action-btn { transition: all 0.2s ease-in-out; }
        .btn-subir:not(:disabled):hover { background-color: #d1fae5 !important; border-color: #10b981 !important; color: #059669 !important; }
        .btn-bajar:not(:disabled):hover { background-color: #dbeafe !important; border-color: #3b82f6 !important; color: #2563eb !important; }
        .btn-ausente:not(:disabled):hover { background-color: #fee2e2 !important; border-color: #ef4444 !important; color: #dc2626 !important; }
        .btn-aviso:not(:disabled):hover { background-color: #fef3c7 !important; border-color: #f59e0b !important; color: #d97706 !important; }
        .btn-deshacer { transition: all 0.2s ease; border: 2px solid #94a3b8 !important; color: #334155 !important; background-color: white !important; }
        .btn-deshacer:not(:disabled):hover { background-color: #e2e8f0 !important; border-color: #64748b !important; color: #0f172a !important; }
      `}</style>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Bus color="var(--primary)" size={32} /> Panel de Operaciones
          </h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '4px', fontWeight: '500' }}>
            {turnoActivo ? `Turno Abierto - Ruta: ${rutas.find(r => r.RutaID === parseInt(turnoActivo.RutaID))?.NombreRuta}` : 'Selecciona una ruta para iniciar tu jornada'}
          </p>
        </div>
      </div>

      <div style={{ background: 'white', padding: '24px', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', marginBottom: '24px', border: turnoActivo ? '2px solid var(--primary)' : '1px solid var(--border)' }}>
        
        {!turnoActivo && (
          <div>
            <div style={{ marginBottom: '16px', padding: '12px', background: '#f8fafc', borderRadius: '8px', borderLeft: '4px solid var(--primary)', color: 'var(--text-muted)', fontSize: '14px' }}>
              <Clock size={16} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'text-bottom' }} />
              No tienes ningún turno pendiente. Puedes abrir uno nuevo seleccionando la ruta.
            </div>

            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '700', color: '#0f172a' }}>1. Selecciona tu Ruta de hoy:</label>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              <select className="form-input" value={rutaSeleccionada} onChange={(e) => setRutaSeleccionada(e.target.value)} disabled={procesando} style={{ flex: 1, margin: 0 }}>
                <option value="">-- Elige una ruta --</option>
                {rutas.map(r => <option key={r.RutaID} value={r.RutaID}>{r.NombreRuta} ({r.Turno})</option>)}
              </select>
              <button onClick={handleAbrirTurno} disabled={!rutaSeleccionada || procesando} style={{ background: 'var(--primary)', color: 'white', padding: '0 24px', height: '42px', borderRadius: '10px', fontWeight: '800', border: 'none', cursor: (!rutaSeleccionada || procesando) ? 'not-allowed' : 'pointer', display: 'flex', gap: '8px', alignItems: 'center', opacity: (!rutaSeleccionada || procesando) ? 0.5 : 1 }}>
                <Power size={20} /> Abrir Turno
              </button>
            </div>
          </div>
        )}

        {turnoActivo && !viajeActivo && (
          <div>
            <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
              <button type="button" onClick={() => handleIniciarViaje('Ida')} disabled={viajesRealizados.Ida || procesando} style={{ flex: 1, background: viajesRealizados.Ida ? '#f1f5f9' : '#e0f2fe', color: viajesRealizados.Ida ? '#94a3b8' : '#0284c7', padding: '16px', borderRadius: '12px', border: viajesRealizados.Ida ? '1px solid #e2e8f0' : '2px solid #bae6fd', fontWeight: '800', cursor: (viajesRealizados.Ida || procesando) ? 'not-allowed' : 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', opacity: procesando ? 0.7 : 1 }}>
                <Sunrise size={28} /> {viajesRealizados.Ida ? 'Viaje Ida (Finalizado)' : 'Iniciar Viaje IDA'}
              </button>
              <button type="button" onClick={() => handleIniciarViaje('Vuelta')} disabled={viajesRealizados.Vuelta || procesando} style={{ flex: 1, background: viajesRealizados.Vuelta ? '#f1f5f9' : '#fef08a', color: viajesRealizados.Vuelta ? '#94a3b8' : '#a16207', padding: '16px', borderRadius: '12px', border: viajesRealizados.Vuelta ? '1px solid #e2e8f0' : '2px solid #fde047', fontWeight: '800', cursor: (viajesRealizados.Vuelta || procesando) ? 'not-allowed' : 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', opacity: procesando ? 0.7 : 1 }}>
                <Sunset size={28} /> {viajesRealizados.Vuelta ? 'Viaje Vuelta (Finalizado)' : 'Iniciar Viaje VUELTA'}
              </button>
            </div>
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', textAlign: 'right' }}>
              <button type="button" onClick={handleCerrarTurno} disabled={procesando} style={{ background: '#0f172a', color: 'white', padding: '10px 24px', borderRadius: '8px', fontWeight: '700', border: 'none', cursor: procesando ? 'not-allowed' : 'pointer', opacity: procesando ? 0.7 : 1 }}>
                Terminar Jornada y Cerrar Turno
              </button>
            </div>
          </div>
        )}

        {viajeActivo && (
           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div><div style={{ display: 'inline-block', background: '#d1fae5', color: '#059669', padding: '4px 12px', borderRadius: '99px', fontSize: '12px', fontWeight: '800' }}>🟢 VIAJE DE {viajeActivo.Sentido.toUpperCase()} EN CURSO</div></div>
            <button type="button" onClick={validarYFinalizarViaje} disabled={procesando} style={{ background: '#dc2626', color: 'white', padding: '12px 24px', borderRadius: '10px', fontWeight: '800', border: 'none', cursor: procesando ? 'not-allowed' : 'pointer', display: 'flex', gap: '8px', alignItems: 'center', opacity: procesando ? 0.7 : 1 }}>
              <Square size={20} /> Finalizar Viaje
            </button>
          </div>
        )}
      </div>

      {viajeActivo && (
        <div style={{ background: 'white', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', overflow: 'hidden', flex: 1 }}>
          <div style={{ padding: '16px 24px', background: '#f8fafc', borderBottom: '1px solid var(--border)', fontWeight: '700', color: '#0f172a' }}>Lista de Pasajeros</div>
          <div style={{ padding: '12px' }}>
            {alumnos.map(alumno => {
                const ev = eventosRegistrados[alumno.AlumnoID] || {};
                const estaInactivo = ev['Ausente'] || ev['AvisóAusencia'];
                const subio = ev['Abordó'];
                const bajo = ev['Bajó'];
                const tieneEstado = subio || bajo || estaInactivo;

                return (
                  <div key={alumno.AlumnoID} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', borderBottom: '1px solid #f1f5f9', flexWrap: 'wrap', gap: '12px' }}>
                    
                    {/* INFO DEL ALUMNO */}
                    <div>
                      <div style={{ fontWeight: '700', color: '#0f172a', fontSize: '15px', textDecoration: estaInactivo ? 'line-through' : 'none' }}>{alumno.NombreCompleto}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{alumno.Direccion}</div>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                      
                      {/* BOTONES DE CUSTODIA */}
                      <div style={{ display: 'flex', background: '#f8fafc', padding: '4px', borderRadius: '10px', border: '1px solid var(--border)' }}>
                        <button 
                          type="button"
                          className="action-btn btn-subir"
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleMarcarAsistencia(alumno, 'Abordó'); }} 
                          disabled={subio || estaInactivo || procesando} 
                          style={{ padding: '8px 16px', borderRadius: '8px', border: subio ? '1px solid #10b981' : '1px solid #e2e8f0', background: subio ? '#10b981' : 'white', color: subio ? 'white' : '#64748b', fontWeight: '700', cursor: (subio || estaInactivo || procesando) ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                        >
                          <LogIn size={16} /> Subió
                        </button>
                        
                        <button 
                          type="button"
                          className="action-btn btn-bajar"
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleMarcarAsistencia(alumno, 'Bajó'); }} 
                          disabled={!subio || bajo || estaInactivo || procesando} 
                          style={{ padding: '8px 16px', borderRadius: '8px', border: bajo ? '1px solid #3b82f6' : '1px solid #e2e8f0', background: bajo ? '#3b82f6' : 'white', color: bajo ? 'white' : '#64748b', fontWeight: '700', cursor: (!subio || bajo || estaInactivo || procesando) ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                        >
                          <LogOut size={16} /> Bajó
                        </button>
                      </div>

                      {/* BOTONES DE INASISTENCIA */}
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button type="button" className="action-btn btn-ausente" onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleMarcarAsistencia(alumno, 'Ausente'); }} disabled={subio || estaInactivo || procesando} style={{ padding: '8px', borderRadius: '8px', border: ev['Ausente'] ? '1px solid #ef4444' : '1px solid #e2e8f0', background: ev['Ausente'] ? '#ef4444' : 'white', color: ev['Ausente'] ? 'white' : '#64748b', cursor: (subio || estaInactivo || procesando) ? 'not-allowed' : 'pointer' }} title="No se presentó"><XCircle size={20} /></button>
                        <button type="button" className="action-btn btn-aviso" onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleMarcarAsistencia(alumno, 'AvisóAusencia'); }} disabled={subio || estaInactivo || procesando} style={{ padding: '8px', borderRadius: '8px', border: ev['AvisóAusencia'] ? '1px solid #f59e0b' : '1px solid #e2e8f0', background: ev['AvisóAusencia'] ? '#f59e0b' : 'white', color: ev['AvisóAusencia'] ? 'white' : '#64748b', cursor: (subio || estaInactivo || procesando) ? 'not-allowed' : 'pointer' }} title="Padre avisó ausencia"><MessageSquare size={20} /></button>
                      </div>

                      {/* BOTÓN DESHACER (RESERVA DE ESPACIO PERFECTA) */}
                      <button 
                        type="button"
                        className="action-btn btn-deshacer"
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDeshacer(alumno); }} 
                        disabled={procesando || !tieneEstado}
                        style={{ 
                          visibility: tieneEstado ? 'visible' : 'hidden', /* Esto reserva el espacio exacto y evita brincos */
                          padding: '8px', borderRadius: '50%', cursor: (procesando || !tieneEstado) ? 'not-allowed' : 'pointer', marginLeft: '8px' 
                        }} 
                        title="Deshacer última acción"
                      >
                        <RotateCcw size={18} />
                      </button>
                      
                    </div>
                  </div>
                )
            })}
          </div>
        </div>
      )}

      {modalAbierto.mostrar && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div className="modal-content" style={{ background: 'white', padding: '32px', borderRadius: '16px', maxWidth: '450px', width: '90%', textAlign: 'center', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
            <AlertCircle size={48} color={modalAbierto.colorBoton} style={{ marginBottom: '16px', display: 'inline-block' }} />
            <h2 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '12px', color: '#0f172a' }}>{modalAbierto.titulo}</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '24px', lineHeight: '1.5' }}>{modalAbierto.mensaje}</p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                type="button" 
                onClick={() => setModalAbierto({ mostrar: false })} 
                disabled={procesando}
                style={{ flex: 1, padding: '12px', background: '#f1f5f9', color: '#334155', borderRadius: '10px', border: 'none', fontWeight: '700', cursor: procesando ? 'not-allowed' : 'pointer', opacity: procesando ? 0.5 : 1 }}
              >
                Regresar
              </button>
              <button 
                type="button" 
                onClick={modalAbierto.accion} 
                disabled={procesando}
                style={{ flex: 1, padding: '12px', background: modalAbierto.colorBoton, color: 'white', borderRadius: '10px', border: 'none', fontWeight: '700', cursor: procesando ? 'not-allowed' : 'pointer', opacity: procesando ? 0.5 : 1 }}
              >
                {procesando ? 'Procesando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}

      <Toast mensaje={toast.mensaje} tipo={toast.tipo} onClose={() => setToast({ mensaje: '', tipo: '' })} />
    </div>
  );
};

export default Asistencias;