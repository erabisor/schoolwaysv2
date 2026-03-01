import React, { useEffect, useState } from 'react';
import { Plus, Search, Filter, Download, Trash2, Power } from 'lucide-react';
import { getRutas, toggleEstadoRuta, crearRuta, editarRuta, eliminarRuta } from './rutas.api';
import RutasTabla from './RutasTabla';
import RutasModal from './RutasModal';
import ConfirmarEliminarModal from '../../components/ConfirmarEliminarModal';
import Pagination from '../../components/Pagination';
import Toast from '../../components/Toast';

const Rutas = () => {
  const [rutas, setRutas] = useState([]);
  const [busqueda, setBusqueda] = useState(''); 
  const [filtroTurno, setFiltroTurno] = useState(''); 
  const [modalAbierto, setModalAbierto] = useState(false);
  const [rutaAEditar, setRutaAEditar] = useState(null);
  const [rutaAEliminar, setRutaAEliminar] = useState(null);
  const [seleccionados, setSeleccionados] = useState([]);
  const [toast, setToast] = useState({ mensaje: '', tipo: '' });

  const [paginaActual, setPaginaActual] = useState(1);
  const [registrosPorPagina, setRegistrosPorPagina] = useState(10);
  useEffect(() => { setPaginaActual(1); }, [busqueda, filtroTurno]);

  const cargarDatos = async () => {
    try {
      const res = await getRutas(); setRutas(res.data.data); setSeleccionados([]);
    } catch (error) { mostrarToast('Error al cargar rutas', 'error'); }
  };

  useEffect(() => { cargarDatos(); }, []);
  const mostrarToast = (mensaje, tipo) => setToast({ mensaje, tipo });

  const handleGuardar = async (datos) => {
    try {
      if (rutaAEditar) { await editarRuta(rutaAEditar.RutaID, datos); } 
      else { await crearRuta(datos); }
      setModalAbierto(false); cargarDatos(); mostrarToast('Operación exitosa', 'success');
    } catch (error) { mostrarToast('Error', 'error'); }
  };

  const handleToggleEstado = async (id, estado) => {
    try { await toggleEstadoRuta(id, estado); cargarDatos(); } catch (error) { mostrarToast('Error', 'error'); }
  };

  const confirmarYeliminar = async () => {
    try { await eliminarRuta(rutaAEliminar.RutaID); setRutaAEliminar(null); cargarDatos(); } catch (error) { mostrarToast('Error', 'error'); }
  };

  const rutasFiltradas = rutas.filter(r => {
    const coincideTexto = r.NombreRuta.toLowerCase().includes(busqueda.toLowerCase()) || (r.NombreConductor && r.NombreConductor.toLowerCase().includes(busqueda.toLowerCase()));
    const coincideTurno = filtroTurno === '' || r.Turno === filtroTurno;
    return coincideTexto && coincideTurno;
  });

  const totalRegistros = rutasFiltradas.length;
  const totalPaginas = registrosPorPagina === 'Todos' ? 1 : Math.ceil(totalRegistros / registrosPorPagina);
  const indiceUltimo = registrosPorPagina === 'Todos' ? totalRegistros : paginaActual * registrosPorPagina;
  const indicePrimer = registrosPorPagina === 'Todos' ? 0 : indiceUltimo - registrosPorPagina;
  const rutasPaginadas = rutasFiltradas.slice(indicePrimer, indiceUltimo);

  useEffect(() => { if (paginaActual > totalPaginas && totalPaginas > 0) setPaginaActual(totalPaginas); }, [totalPaginas, paginaActual]);

  const handleSelect = (id) => setSeleccionados(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  const handleSelectAll = (checked) => setSeleccionados(checked ? rutasPaginadas.map(r => r.RutaID) : []);

  const handleAccionMasiva = async (accion, estado = null) => {
    if (!window.confirm(`¿Aplicar a ${seleccionados.length} rutas?`)) return;
    try {
      const promesas = seleccionados.map(id => accion === 'eliminar' ? eliminarRuta(id) : toggleEstadoRuta(id, estado));
      await Promise.all(promesas); mostrarToast('Acción masiva completada', 'success'); cargarDatos();
    } catch (error) { mostrarToast('Error', 'error'); }
  };

  const exportarCSV = () => {
    if (rutasFiltradas.length === 0) return mostrarToast('No hay datos', 'warning');
    let csv = 'Ruta,Descripcion,Turno,Conductor,PlacaBus,CuposMaximos,Estado\n';
    rutasFiltradas.forEach(r => { csv += `"${r.NombreRuta}","${r.Descripcion}","${r.Turno}","${r.NombreConductor || 'Sin asignar'}","${r.Placa || 'N/A'}",${r.CapacidadMaxima},"${r.Estado ? 'Activa' : 'Inactiva'}"\n`; });
    const link = document.createElement('a'); link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    link.setAttribute('download', 'Reporte_Rutas.csv'); document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: '800', color: '#0f172a' }}>Rutas</h1>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'white', padding: '8px 16px', borderRadius: '10px', border: '1.5px solid var(--border)' }}><Search size={18} color="var(--text-muted)" /><input type="text" placeholder="Buscar ruta o conductor..." style={{ border: 'none', outline: 'none', width: '200px', fontWeight: '500' }} value={busqueda} onChange={(e) => setBusqueda(e.target.value)} /></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'white', padding: '6px 16px', borderRadius: '10px', border: '1.5px solid var(--border)' }}><Filter size={18} color="var(--text-muted)" /><select style={{ border: 'none', outline: 'none', background: 'transparent', color: '#0f172a', fontWeight: '500', padding: '8px 0', cursor: 'pointer' }} value={filtroTurno} onChange={(e) => setFiltroTurno(e.target.value)}><option value="">Todos los turnos</option><option value="Mañana">Mañana</option><option value="Tarde">Tarde</option><option value="Ambos">Ambos</option></select></div>
          <button onClick={exportarCSV} style={{ background: 'white', color: '#0f172a', padding: '10px 16px', borderRadius: '10px', fontWeight: '700', border: '1.5px solid var(--border)', cursor: 'pointer', display: 'flex', gap: '8px', alignItems: 'center' }}><Download size={20} color="var(--primary)" /> Exportar</button>
          <button onClick={() => { setRutaAEditar(null); setModalAbierto(true); }} style={{ background: 'var(--primary)', color: 'white', padding: '12px 24px', borderRadius: '10px', fontWeight: '800', border: 'none', cursor: 'pointer', display: 'flex', gap: '8px', alignItems: 'center' }}><Plus size={20} /> Nueva Ruta</button>
        </div>
      </div>

      {seleccionados.length > 0 && (
        <div style={{ background: '#e0f2fe', padding: '16px 24px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', border: '1px solid #bae6fd' }}>
          <span style={{ fontWeight: '800', color: '#0369a1', fontSize: '15px' }}>{seleccionados.length} rutas seleccionadas</span>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={() => handleAccionMasiva('estado', true)} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: '#d1fae5', color: '#059669', fontWeight: '700', cursor: 'pointer', display: 'flex', gap: '6px' }}><Power size={16} /> Activar</button>
            <button onClick={() => handleAccionMasiva('estado', false)} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: '#fef08a', color: '#854d0e', fontWeight: '700', cursor: 'pointer', display: 'flex', gap: '6px' }}><Power size={16} /> Desactivar</button>
            <button onClick={() => handleAccionMasiva('eliminar')} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: '#fee2e2', color: '#dc2626', fontWeight: '700', cursor: 'pointer', display: 'flex', gap: '6px' }}><Trash2 size={16} /> Eliminar</button>
          </div>
        </div>
      )}

      <div style={{ borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', background: 'white' }}>
        <RutasTabla rutas={rutasPaginadas} onToggleEstado={handleToggleEstado} onEdit={(r) => { setRutaAEditar(r); setModalAbierto(true); }} onDelete={setRutaAEliminar} seleccionados={seleccionados} onSelect={handleSelect} onSelectAll={handleSelectAll} />
        <Pagination paginaActual={paginaActual} totalPaginas={totalPaginas} onPageChange={setPaginaActual} registrosPorPagina={registrosPorPagina} onRegistrosChange={(val) => { setRegistrosPorPagina(val); setPaginaActual(1); }} totalRegistros={totalRegistros} />
      </div>

      {modalAbierto && <RutasModal rutaAEditar={rutaAEditar} onClose={() => setModalAbierto(false)} onSave={handleGuardar} />}
      {rutaAEliminar && <ConfirmarEliminarModal mensaje={`¿Eliminar la ruta ${rutaAEliminar.NombreRuta}?`} onClose={() => setRutaAEliminar(null)} onConfirm={confirmarYeliminar} />}
      <Toast mensaje={toast.mensaje} tipo={toast.tipo} onClose={() => setToast({ mensaje: '', tipo: '' })} />
    </div>
  );
};
export default Rutas;