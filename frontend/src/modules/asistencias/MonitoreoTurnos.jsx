import React, { useState, useEffect } from 'react';
import { Activity, RefreshCw, AlertTriangle, XOctagon, AlertCircle, CheckSquare, ChevronLeft, ChevronRight, Search, User } from 'lucide-react';
import { getTurnosAbiertos, reasignarTurno, forzarCierreTurno, getConductores } from './asistencias.api';
import Toast from '../../components/Toast';

const MonitoreoTurnos = () => {
  const [turnos, setTurnos] = useState([]);
  const [todosLosConductores, setTodosLosConductores] = useState([]); 
  const [cargando, setCargando] = useState(true);
  const [seleccionados, setSeleccionados] = useState([]); 
  
  const [toast, setToast] = useState({ mensaje: '', tipo: '' });
  const [modalAbierto, setModalAbierto] = useState({ mostrar: false, titulo: '', mensaje: '', colorBoton: '', textoBoton: '', soloAlerta: false, accion: null });
  const [modalReasignar, setModalReasignar] = useState({ mostrar: false, turnoId: null });
  
  const [busquedaConductor, setBusquedaConductor] = useState('');
  const [conductorSeleccionado, setConductorSeleccionado] = useState(null);

  const [paginaActual, setPaginaActual] = useState(1);
  const [registrosPorPagina, setRegistrosPorPagina] = useState(10);

  const cargarDatos = async () => {
    setCargando(true);
    try {
      const resTurnos = await getTurnosAbiertos();
      setTurnos(resTurnos.data.data || []);
      const resConductores = await getConductores();
      setTodosLosConductores(resConductores.data.data || resConductores.data || []);
    } catch (error) {
      setToast({ mensaje: 'Error al sincronizar con el servidor', tipo: 'error' });
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { cargarDatos(); }, []);

  const formatearFechaCorta = (fechaStr) => {
    if (!fechaStr) return 'N/A';
    const fecha = new Date(fechaStr);
    if (isNaN(fecha)) return fechaStr; 
    return fecha.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const validarLicenciaVencida = (fechaStr) => {
    if (!fechaStr) return false;
    let fechaFinal;
    if (String(fechaStr).includes('/')) {
      const [dia, mes, anio] = fechaStr.split('/');
      fechaFinal = new Date(anio, mes - 1, dia);
    } else {
      fechaFinal = new Date(fechaStr);
    }
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    return fechaFinal < hoy;
  };

  const getConductoresDisponibles = () => {
    const ocupados = turnos.map(t => Number(t.ConductorID));
    return todosLosConductores.filter(c => {
      // CORRECCIÓN VITAL: El Turno se enlaza mediante el UsuarioID, no el ConductorID real
      const uId = Number(c.UsuarioID); 
      const nombre = c.NombreCompleto || '';
      if (!nombre.toLowerCase().includes(busquedaConductor.toLowerCase())) return false;
      if (ocupados.includes(uId)) return false;
      const activo = c.Estado === true || c.Estado === 1 || String(c.Estado).toLowerCase() === 'activo';
      return activo;
    });
  };

  const confirmarCierre = (ids) => {
    const idsProcesar = Array.isArray(ids) ? ids : [ids];
    setModalAbierto({
      mostrar: true,
      titulo: `¿Forzar cierre de ${idsProcesar.length} unidad(es)?`,
      mensaje: 'Esta acción finalizará los viajes en curso y liberará a los conductores.',
      colorBoton: '#dc2626',
      textoBoton: 'Confirmar Cierre',
      accion: async () => {
        try {
          await Promise.all(idsProcesar.map(id => forzarCierreTurno(id)));
          setToast({ mensaje: 'Turnos cerrados exitosamente', tipo: 'success' });
          setSeleccionados([]);
          setModalAbierto({ mostrar: false });
          cargarDatos(); 
        } catch (error) { setToast({ mensaje: 'Error al cerrar turnos', tipo: 'error' }); }
      }
    });
  };

  const ejecutarReasignacion = async () => {
    if (!conductorSeleccionado) return;
    try {
      await reasignarTurno(modalReasignar.turnoId, conductorSeleccionado);
      setToast({ mensaje: 'Turno reasignado con éxito', tipo: 'success' });
      setModalReasignar({ mostrar: false, turnoId: null });
      cargarDatos(); 
    } catch (error) { setToast({ mensaje: 'Error en la reasignación', tipo: 'error' }); }
  };

  const turnosActuales = turnos.slice((paginaActual - 1) * registrosPorPagina, paginaActual * registrosPorPagina);
  const totalPaginas = Math.ceil(turnos.length / registrosPorPagina);

  return (
    <div style={{ height: 'calc(100vh - 90px)', width: '100%', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', padding: '24px', overflow: 'hidden' }}>
      <div style={{ flexShrink: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '12px' }}><Activity color="var(--primary)" /> Monitoreo de Turnos Activos</h1>
          <button onClick={cargarDatos} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--border)', background: 'white', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}><RefreshCw size={16} /> Actualizar Datos</button>
        </div>

        {seleccionados.length > 0 && (
          <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', padding: '12px 24px', borderRadius: '12px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: '700', color: '#1e3a8a', display: 'flex', alignItems: 'center', gap: '8px' }}><CheckSquare size={20} /> {seleccionados.length} turno(s) seleccionado(s)</span>
            <button onClick={() => confirmarCierre(seleccionados)} style={{ padding: '8px 16px', borderRadius: '8px', background: '#dc2626', color: 'white', border: 'none', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}><XOctagon size={16} /> Forzar Cierre Masivo</button>
          </div>
        )}
      </div>

      <div style={{ flex: 1, minHeight: 0, background: 'white', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', position: 'relative' }}>
            <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: '#f8fafc', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
              <tr style={{ textAlign: 'left', color: 'var(--text-muted)' }}>
                <th style={{ padding: '16px', width: '40px', textAlign: 'center', borderBottom: '1px solid var(--border)' }}>
                  <input type="checkbox" checked={seleccionados.length === turnosActuales.length && turnosActuales.length > 0} onChange={(e) => setSeleccionados(e.target.checked ? turnosActuales.map(t => t.TurnoConductorID) : [])} style={{ cursor: 'pointer' }} />
                </th>
                <th style={{ padding: '16px', borderBottom: '1px solid var(--border)' }}>ID Turno</th>
                <th style={{ padding: '16px', borderBottom: '1px solid var(--border)' }}>Ruta Asignada</th>
                <th style={{ padding: '16px', borderBottom: '1px solid var(--border)' }}>Conductor Actual</th>
                <th style={{ padding: '16px', borderBottom: '1px solid var(--border)' }}>Hora Apertura</th>
                <th style={{ padding: '16px', textAlign: 'center', borderBottom: '1px solid var(--border)' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {turnos.length === 0 ? (
                <tr><td colSpan="6" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '1.1rem' }}>No hay autobuses operando actualmente.</td></tr>
              ) : (
                turnosActuales.map(t => (
                  <tr key={t.TurnoConductorID} style={{ borderBottom: '1px solid var(--border)', background: seleccionados.includes(t.TurnoConductorID) ? '#eff6ff' : 'white' }}>
                    <td style={{ padding: '16px', textAlign: 'center' }}>
                      <input type="checkbox" checked={seleccionados.includes(t.TurnoConductorID)} onChange={() => setSeleccionados(prev => prev.includes(t.TurnoConductorID) ? prev.filter(id => id !== t.TurnoConductorID) : [...prev, t.TurnoConductorID])} style={{ cursor: 'pointer' }} />
                    </td>
                    <td style={{ padding: '16px', fontWeight: '700' }}>#{t.TurnoConductorID}</td>
                    <td style={{ padding: '16px' }}>{t.NombreRuta}</td>
                    <td style={{ padding: '16px' }}>{t.NombreConductor}</td>
                    <td style={{ padding: '16px' }}>{new Date(t.HoraApertura).toLocaleTimeString()}</td>
                    <td style={{ padding: '16px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        <button 
                          onClick={() => { setModalReasignar({ mostrar: true, turnoId: t.TurnoConductorID }); setConductorSeleccionado(null); }} 
                          style={{ padding: '8px 12px', borderRadius: '8px', background: '#fef3c7', color: '#d97706', border: '1px solid #fcd34d', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                        >
                          <AlertTriangle size={16} /> Reasignar
                        </button>
                        <button 
                          onClick={() => confirmarCierre(t.TurnoConductorID)} 
                          style={{ padding: '8px 12px', borderRadius: '8px', background: '#fee2e2', color: '#dc2626', border: '1px solid #fecaca', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                        >
                          <XOctagon size={16} /> Forzar Cierre
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!cargando && turnos.length > 0 && (
          <div style={{ padding: '16px 24px', background: 'white', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--text-muted)', fontSize: '14px' }}>
              <span>Mostrar:</span>
              <select value={registrosPorPagina} onChange={(e) => { setRegistrosPorPagina(Number(e.target.value)); setPaginaActual(1); }} style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: '#f8fafc', fontWeight: '600', cursor: 'pointer' }}>
                <option value={10}>10</option>
                <option value={25}>25</option>
              </select>
              <span>de {turnos.length} registros</span>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button onClick={() => setPaginaActual(p => Math.max(1, p-1))} disabled={paginaActual === 1} style={{ padding: '8px', borderRadius: '8px', border: '1px solid var(--border)', cursor: paginaActual === 1 ? 'not-allowed' : 'pointer', background: paginaActual === 1 ? '#f8fafc' : 'white' }}><ChevronLeft size={18} /></button>
              <span style={{ fontSize: '14px', fontWeight: '600' }}>Página {paginaActual} de {totalPaginas}</span>
              <button onClick={() => setPaginaActual(p => Math.min(totalPaginas, p+1))} disabled={paginaActual === totalPaginas} style={{ padding: '8px', borderRadius: '8px', border: '1px solid var(--border)', cursor: paginaActual === totalPaginas ? 'not-allowed' : 'pointer', background: paginaActual === totalPaginas ? '#f8fafc' : 'white' }}><ChevronRight size={18} /></button>
            </div>
          </div>
        )}
      </div>

      {modalReasignar.mostrar && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1100, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div className="modal-content" style={{ background: 'white', padding: '32px', borderRadius: '16px', maxWidth: '500px', width: '90%', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '8px', color: '#0f172a' }}>Elegir Nuevo Conductor</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '20px' }}>Selecciona un conductor libre para el turno #{modalReasignar.turnoId}:</p>

            <div style={{ position: 'relative', marginBottom: '16px' }}>
              <Search size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: '#94a3b8' }} />
              <input type="text" placeholder="Buscar por nombre..." value={busquedaConductor} onChange={(e) => setBusquedaConductor(e.target.value)} style={{ width: '100%', padding: '10px 10px 10px 38px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '14px' }} />
            </div>

            <div style={{ border: '1px solid var(--border)', borderRadius: '8px', maxHeight: '250px', overflowY: 'auto', marginBottom: '24px' }}>
              {getConductoresDisponibles().length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>No hay conductores disponibles actualmente.</div>
              ) : (
                getConductoresDisponibles().map(c => {
                  const vencida = validarLicenciaVencida(c.VencimientoLicencia);
                  return (
                    <div 
                      key={c.UsuarioID} 
                      onClick={() => {
                        if (vencida) {
                          setModalAbierto({ mostrar: true, soloAlerta: true, titulo: 'Atención: Licencia Vencida', mensaje: `No puedes asignar a ${c.NombreCompleto} porque su licencia venció el ${formatearFechaCorta(c.VencimientoLicencia)}.`, colorBoton: '#dc2626', textoBoton: 'Entendido', accion: () => setModalAbierto({ mostrar: false }) });
                        } else {
                          // SE GUARDA EL USUARIO ID PARA EL TURNO
                          setConductorSeleccionado(Number(c.UsuarioID)); 
                        }
                      }}
                      style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', background: Number(conductorSeleccionado) === Number(c.UsuarioID) ? '#eff6ff' : 'white', opacity: vencida ? 0.6 : 1, transition: 'background 0.2s' }}
                    >
                      <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: Number(conductorSeleccionado) === Number(c.UsuarioID) ? 'var(--primary)' : '#f1f5f9', color: Number(conductorSeleccionado) === Number(c.UsuarioID) ? 'white' : '#64748b', display: 'flex', justifyContent: 'center', alignItems: 'center' }}><User size={18} /></div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: '700', color: '#0f172a' }}>{c.NombreCompleto}</div>
                        <div style={{ fontSize: '12px', color: vencida ? '#dc2626' : '#64748b', fontWeight: vencida ? '700' : '400' }}>Vence: {formatearFechaCorta(c.VencimientoLicencia)} {vencida && '(VENCIDA)'}</div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => setModalReasignar({ mostrar: false })} style={{ flex: 1, padding: '12px', background: '#f1f5f9', borderRadius: '10px', border: 'none', fontWeight: '700', cursor: 'pointer', color: '#475569' }}>Cancelar</button>
              <button onClick={ejecutarReasignacion} disabled={!conductorSeleccionado} style={{ flex: 1, padding: '12px', background: 'var(--primary)', color: 'white', borderRadius: '10px', border: 'none', fontWeight: '700', opacity: conductorSeleccionado ? 1 : 0.5, cursor: conductorSeleccionado ? 'pointer' : 'not-allowed' }}>Confirmar Reasignación</button>
            </div>
          </div>
        </div>
      )}

      {modalAbierto.mostrar && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1200, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div className="modal-content" style={{ background: 'white', padding: '32px', borderRadius: '16px', maxWidth: '450px', width: '90%', textAlign: 'center', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
            <AlertCircle size={56} color={modalAbierto.colorBoton} style={{ marginBottom: '20px', display: 'inline-block' }} />
            <h2 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '12px', color: '#0f172a' }}>{modalAbierto.titulo}</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '24px', lineHeight: '1.5' }}>{modalAbierto.mensaje}</p>
            <div style={{ display: 'flex', gap: '12px' }}>
               {!modalAbierto.soloAlerta && <button onClick={() => setModalAbierto({ mostrar: false })} style={{ flex: 1, padding: '12px', background: '#f1f5f9', borderRadius: '10px', border: 'none', fontWeight: '700', cursor: 'pointer', color: '#475569' }}>Cancelar</button>}
               <button onClick={modalAbierto.accion} style={{ flex: 1, padding: '12px', background: modalAbierto.colorBoton, color: 'white', borderRadius: '10px', border: 'none', fontWeight: '700', cursor: 'pointer' }}>{modalAbierto.textoBoton}</button>
            </div>
          </div>
        </div>
      )}

      <Toast mensaje={toast.mensaje} tipo={toast.tipo} onClose={() => setToast({ mensaje: '', tipo: '' })} />
    </div>
  );
};

export default MonitoreoTurnos;