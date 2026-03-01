import React, { useState, useEffect } from 'react';
import { History, Search, Download, Calendar, Filter, Clock, Eye, X, ChevronLeft, ChevronRight, CheckSquare } from 'lucide-react';
import { getHistorialTurnos, getDetalleTurno, getRutasDisponibles } from './asistencias.api';
import Toast from '../../components/Toast';

const HistorialTurnos = () => {
  const [turnos, setTurnos] = useState([]);
  const [rutas, setRutas] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [toast, setToast] = useState({ mensaje: '', tipo: '' });
  
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [rutaSeleccionada, setRutaSeleccionada] = useState('todas');

  const [seleccionados, setSeleccionados] = useState([]);

  const [paginaActual, setPaginaActual] = useState(1);
  const [registrosPorPagina, setRegistrosPorPagina] = useState(10);

  const [modalDetalle, setModalDetalle] = useState({ mostrar: false, datos: null, cargando: false });

  useEffect(() => {
    getRutasDisponibles().then(res => setRutas(res.data.data)).catch(() => {});
    
    const hoy = new Date();
    const primerDia = new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().split('T')[0];
    const hoyStr = hoy.toISOString().split('T')[0];
    
    setFechaInicio(primerDia);
    setFechaFin(hoyStr);
  }, []);

  useEffect(() => {
    if (fechaInicio && fechaFin) {
      buscarHistorial();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fechaInicio, fechaFin, rutaSeleccionada]);

  const buscarHistorial = async () => {
    setCargando(true);
    try {
      const res = await getHistorialTurnos({ fechaInicio, fechaFin, rutaId: rutaSeleccionada });
      setTurnos(res.data.data);
      setSeleccionados([]); 
      setPaginaActual(1);
    } catch (error) {
      setToast({ mensaje: 'Error al cargar el historial', tipo: 'error' });
    } finally {
      setCargando(false);
    }
  };

  const verDetalles = async (turnoId) => {
    setModalDetalle({ mostrar: true, datos: null, cargando: true });
    try {
      const res = await getDetalleTurno(turnoId);
      setModalDetalle({ mostrar: true, datos: res.data.data, cargando: false });
    } catch (error) {
      setToast({ mensaje: 'Error al cargar detalles', tipo: 'error' });
      setModalDetalle({ mostrar: false, datos: null, cargando: false });
    }
  };

  const indiceUltimoRegistro = paginaActual * registrosPorPagina;
  const indicePrimerRegistro = indiceUltimoRegistro - registrosPorPagina;
  const turnosActuales = turnos.slice(indicePrimerRegistro, indiceUltimoRegistro);
  const totalPaginas = Math.ceil(turnos.length / registrosPorPagina);

  const cambiarPagina = (nuevaPagina) => {
    if (nuevaPagina >= 1 && nuevaPagina <= totalPaginas) setPaginaActual(nuevaPagina);
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const idsPagina = turnosActuales.map(t => t.TurnoConductorID);
      setSeleccionados([...new Set([...seleccionados, ...idsPagina])]);
    } else {
      const idsPagina = turnosActuales.map(t => t.TurnoConductorID);
      setSeleccionados(seleccionados.filter(id => !idsPagina.includes(id)));
    }
  };

  const handleSelect = (id) => {
    if (seleccionados.includes(id)) setSeleccionados(seleccionados.filter(item => item !== id));
    else setSeleccionados([...seleccionados, id]);
  };

  const todosSeleccionadosEnPagina = turnosActuales.length > 0 && turnosActuales.every(t => seleccionados.includes(t.TurnoConductorID));

  const exportarAExcel = () => {
    const datosAExportar = seleccionados.length > 0 
      ? turnos.filter(t => seleccionados.includes(t.TurnoConductorID))
      : turnos;

    if (datosAExportar.length === 0) {
      setToast({ mensaje: 'No hay datos para exportar', tipo: 'error' });
      return;
    }

    let csvContent = "ID Turno,Fecha,Ruta,Turno Horario,Conductor,Hora Apertura,Hora Cierre,Duracion (Minutos)\n";

    datosAExportar.forEach(t => {
      const fecha = t.Fecha.split('T')[0];
      const hApertura = new Date(t.HoraApertura).toLocaleTimeString();
      const hCierre = t.HoraCierre ? new Date(t.HoraCierre).toLocaleTimeString() : 'Sin cierre';
      
      const row = `${t.TurnoConductorID},${fecha},"${t.NombreRuta}","${t.TurnoRuta}","${t.NombreConductor}",${hApertura},${hCierre},${t.DuracionMinutos || 0}`;
      csvContent += row + "\n";
    });

    const blob = new Blob(["\ufeff", csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Reporte_Turnos_${fechaInicio}_al_${fechaFin}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    // ARQUITECTURA DEFINTIVA: calc(100vh - 90px) absorbe cualquier margen que venga de App.js matando la barra gigante.
    <div style={{ height: 'calc(100vh - 90px)', width: '100%', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', padding: '24px' }}>
      
      {/* CABECERA (Fija, no se encoje) */}
      <div style={{ flexShrink: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <History color="var(--primary)" size={32} /> Historial Operativo
            </h1>
            <p style={{ color: 'var(--text-muted)', marginTop: '4px', fontWeight: '500' }}>Auditoría financiera y logística de viajes completados</p>
          </div>
          
          <div style={{ display: 'flex', gap: '12px' }}>
            <button 
              onClick={exportarAExcel} 
              disabled={turnos.length === 0} 
              style={{ padding: '10px 20px', borderRadius: '8px', background: '#10b981', color: 'white', border: 'none', fontWeight: '700', cursor: turnos.length === 0 ? 'not-allowed' : 'pointer', opacity: turnos.length === 0 ? 0.5 : 1, display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <Download size={18} /> 
              {seleccionados.length > 0 ? `Exportar Seleccionados (${seleccionados.length})` : 'Exportar Todos'}
            </button>
          </div>
        </div>

        <div style={{ background: 'white', padding: '20px', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', marginBottom: '24px', display: 'flex', gap: '16px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', fontWeight: '700', fontSize: '14px', color: '#334155' }}><Calendar size={16} /> Desde:</label>
            <input type="date" value={fechaInicio} onChange={e => setFechaInicio(e.target.value)} className="form-input" style={{ margin: 0, width: '100%' }} />
          </div>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', fontWeight: '700', fontSize: '14px', color: '#334155' }}><Calendar size={16} /> Hasta:</label>
            <input type="date" value={fechaFin} onChange={e => setFechaFin(e.target.value)} className="form-input" style={{ margin: 0, width: '100%' }} />
          </div>
          <div style={{ flex: 1, minWidth: '250px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', fontWeight: '700', fontSize: '14px', color: '#334155' }}><Filter size={16} /> Filtrar por Ruta:</label>
            <select value={rutaSeleccionada} onChange={e => setRutaSeleccionada(e.target.value)} className="form-input" style={{ margin: 0, width: '100%' }}>
              <option value="todas">-- Todas las Rutas --</option>
              {rutas.map(r => <option key={r.RutaID} value={r.RutaID}>{r.NombreRuta} ({r.Turno})</option>)}
            </select>
          </div>
          <button onClick={buscarHistorial} style={{ padding: '0 24px', height: '42px', borderRadius: '8px', background: '#0f172a', color: 'white', border: 'none', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Search size={18} /> Filtrar
          </button>
        </div>
      </div>

      {/* CONTENEDOR DE LA TABLA (Flex: 1 absorbe el espacio, minHeight: 0 le permite hacer scroll interno) */}
      <div style={{ flex: 1, minHeight: 0, background: 'white', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        
        {/* ÁREA ÚNICA DE SCROLL */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', position: 'relative' }}>
            <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: '#f8fafc', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
              <tr style={{ textAlign: 'left', color: 'var(--text-muted)' }}>
                <th style={{ padding: '16px', width: '40px', textAlign: 'center', borderBottom: '1px solid var(--border)' }}>
                  <input type="checkbox" checked={todosSeleccionadosEnPagina} onChange={handleSelectAll} style={{ cursor: 'pointer', width: '16px', height: '16px' }} />
                </th>
                <th style={{ padding: '16px', borderBottom: '1px solid var(--border)' }}>Fecha</th>
                <th style={{ padding: '16px', borderBottom: '1px solid var(--border)' }}>Ruta y Turno</th>
                <th style={{ padding: '16px', borderBottom: '1px solid var(--border)' }}>Conductor Asignado</th>
                <th style={{ padding: '16px', borderBottom: '1px solid var(--border)' }}>Jornada</th>
                <th style={{ padding: '16px', borderBottom: '1px solid var(--border)' }}>Duración</th>
                <th style={{ padding: '16px', textAlign: 'center', borderBottom: '1px solid var(--border)' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {cargando ? (
                <tr><td colSpan="7" style={{ padding: '24px', textAlign: 'center' }}>Buscando registros...</td></tr>
              ) : turnos.length === 0 ? (
                <tr><td colSpan="7" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>No hay turnos finalizados en este rango de fechas.</td></tr>
              ) : (
                turnosActuales.map(t => (
                  <tr key={t.TurnoConductorID} style={{ borderBottom: '1px solid var(--border)', background: seleccionados.includes(t.TurnoConductorID) ? '#eff6ff' : 'white' }}>
                    <td style={{ padding: '16px', textAlign: 'center' }}>
                      <input type="checkbox" checked={seleccionados.includes(t.TurnoConductorID)} onChange={() => handleSelect(t.TurnoConductorID)} style={{ cursor: 'pointer', width: '16px', height: '16px' }} />
                    </td>
                    <td style={{ padding: '16px', fontWeight: '700' }}>{t.Fecha.split('T')[0]}</td>
                    <td style={{ padding: '16px' }}>{t.NombreRuta} <br/><span style={{ fontSize: '12px', background: '#e2e8f0', padding: '2px 8px', borderRadius: '4px' }}>{t.TurnoRuta}</span></td>
                    <td style={{ padding: '16px' }}>{t.NombreConductor}</td>
                    <td style={{ padding: '16px', fontSize: '14px' }}>
                      <div style={{ color: '#059669' }}>Inicio: {new Date(t.HoraApertura).toLocaleTimeString()}</div>
                      <div style={{ color: '#dc2626' }}>Cierre: {t.HoraCierre ? new Date(t.HoraCierre).toLocaleTimeString() : 'Forzado'}</div>
                    </td>
                    <td style={{ padding: '16px', fontWeight: '600', color: '#475569' }}>
                      <Clock size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'text-bottom' }}/> 
                      {t.DuracionMinutos ? `${t.DuracionMinutos} min` : '--'}
                    </td>
                    <td style={{ padding: '16px', textAlign: 'center' }}>
                      <button onClick={() => verDetalles(t.TurnoConductorID)} style={{ padding: '8px 12px', borderRadius: '8px', background: 'white', color: '#2563eb', border: '1px solid #bfdbfe', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', margin: '0 auto' }}>
                        <Eye size={16} /> Detalles
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINACIÓN (Se queda fija en el fondo de la tabla) */}
        {!cargando && turnos.length > 0 && (
          <div style={{ padding: '16px 24px', background: 'white', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--text-muted)', fontSize: '14px' }}>
              <span>Mostrar:</span>
              <select value={registrosPorPagina} onChange={(e) => { setRegistrosPorPagina(Number(e.target.value)); setPaginaActual(1); }} style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: '#f8fafc', color: '#0f172a', fontWeight: '600', cursor: 'pointer' }}>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
              <span>de {turnos.length} registros</span>
            </div>
            
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button onClick={() => cambiarPagina(paginaActual - 1)} disabled={paginaActual === 1} style={{ padding: '8px', borderRadius: '8px', border: '1px solid var(--border)', background: paginaActual === 1 ? '#f8fafc' : 'white', cursor: paginaActual === 1 ? 'not-allowed' : 'pointer', color: paginaActual === 1 ? '#cbd5e1' : '#0f172a', display: 'flex', alignItems: 'center' }}><ChevronLeft size={18} /></button>
              <span style={{ fontSize: '14px', fontWeight: '600', color: '#0f172a', padding: '0 8px' }}>Página {paginaActual} de {totalPaginas === 0 ? 1 : totalPaginas}</span>
              <button onClick={() => cambiarPagina(paginaActual + 1)} disabled={paginaActual === totalPaginas || totalPaginas === 0} style={{ padding: '8px', borderRadius: '8px', border: '1px solid var(--border)', background: paginaActual === totalPaginas || totalPaginas === 0 ? '#f8fafc' : 'white', cursor: paginaActual === totalPaginas || totalPaginas === 0 ? 'not-allowed' : 'pointer', color: paginaActual === totalPaginas || totalPaginas === 0 ? '#cbd5e1' : '#0f172a', display: 'flex', alignItems: 'center' }}><ChevronRight size={18} /></button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL DE DETALLES DEL TURNO */}
      {modalDetalle.mostrar && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1200, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div className="modal-content" style={{ background: 'white', padding: '32px', borderRadius: '16px', maxWidth: '600px', width: '90%', maxHeight: '80vh', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '16px', marginBottom: '16px', flexShrink: 0 }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#0f172a' }}>Bitácora del Turno</h2>
              <button onClick={() => setModalDetalle({ mostrar: false })} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><X size={24} /></button>
            </div>

            <div style={{ overflowY: 'auto', flex: 1, paddingRight: '8px' }}>
              {modalDetalle.cargando ? (
                <div style={{ textAlign: 'center', padding: '24px' }}>Cargando bitácora...</div>
              ) : (
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '12px', color: '#334155' }}>Viajes Realizados ({modalDetalle.datos?.viajes.length})</h3>
                  {modalDetalle.datos?.viajes.map(v => (
                    <div key={v.ViajeID} style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontWeight: '700' }}>Sentido: {v.Sentido.toUpperCase()}</span>
                      <span style={{ fontSize: '14px', color: '#475569' }}>Duración: {Math.round((new Date(v.HoraFin) - new Date(v.HoraInicio)) / 60000)} min</span>
                    </div>
                  ))}

                  <h3 style={{ fontSize: '1rem', fontWeight: '700', marginTop: '24px', marginBottom: '12px', color: '#334155' }}>Registro de Sucesos</h3>
                  {modalDetalle.datos?.asistencias.length === 0 ? (
                    <div style={{ color: 'var(--text-muted)' }}>No hubo marcajes en este turno.</div>
                  ) : (
                    <table style={{ width: '100%', fontSize: '14px' }}>
                      <tbody>
                        {modalDetalle.datos?.asistencias.map((a, i) => (
                          <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '8px 0', color: '#64748b' }}>{new Date(a.FechaHora).toLocaleTimeString()}</td>
                            <td style={{ padding: '8px 0', fontWeight: '600' }}>{a.Alumno}</td>
                            <td style={{ padding: '8px 0', textAlign: 'right' }}>
                              <span style={{ 
                                padding: '2px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold',
                                background: a.TipoEvento === 'Abordó' ? '#d1fae5' : a.TipoEvento === 'Bajó' ? '#dbeafe' : '#fee2e2',
                                color: a.TipoEvento === 'Abordó' ? '#059669' : a.TipoEvento === 'Bajó' ? '#2563eb' : '#dc2626'
                              }}>{a.TipoEvento}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </div>
            
          </div>
        </div>
      )}

      <Toast mensaje={toast.mensaje} tipo={toast.tipo} onClose={() => setToast({ mensaje: '', tipo: '' })} />
    </div>
  );
};

export default HistorialTurnos;