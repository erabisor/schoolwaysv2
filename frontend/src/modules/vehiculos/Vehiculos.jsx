import React, { useEffect, useState } from 'react';
import { Plus, Search, Filter, Download, Trash2, Power } from 'lucide-react';
import { getVehiculos, toggleEstadoVehiculo, crearVehiculo, editarVehiculo, eliminarVehiculo } from './vehiculos.api';
import VehiculosTabla from './VehiculosTabla';
import VehiculosModal from './VehiculosModal';
import ConfirmarEliminarModal from '../../components/ConfirmarEliminarModal';
import Pagination from '../../components/Pagination';
import Toast from '../../components/Toast';

const Vehiculos = () => {
  const [vehiculos, setVehiculos] = useState([]);
  const [busqueda, setBusqueda] = useState(''); 
  const [filtroEstado, setFiltroEstado] = useState(''); 
  const [modalAbierto, setModalAbierto] = useState(false);
  const [vehiculoAEditar, setVehiculoAEditar] = useState(null);
  const [vehiculoAEliminar, setVehiculoAEliminar] = useState(null);
  const [seleccionados, setSeleccionados] = useState([]);
  const [toast, setToast] = useState({ mensaje: '', tipo: '' });

  const [paginaActual, setPaginaActual] = useState(1);
  const [registrosPorPagina, setRegistrosPorPagina] = useState(10);
  useEffect(() => { setPaginaActual(1); }, [busqueda, filtroEstado]);

  const cargarDatos = async () => {
    try {
      const res = await getVehiculos(); setVehiculos(res.data.data); setSeleccionados([]); 
    } catch (error) { mostrarToast('Error al cargar', 'error'); }
  };

  useEffect(() => { cargarDatos(); }, []);
  const mostrarToast = (mensaje, tipo) => setToast({ mensaje, tipo });

  const handleGuardar = async (datos) => {
    try {
      if (vehiculoAEditar) { await editarVehiculo(vehiculoAEditar.VehiculoID, datos); } 
      else { await crearVehiculo(datos); }
      setModalAbierto(false); cargarDatos(); mostrarToast('Operación exitosa', 'success');
    } catch (error) { mostrarToast('Error', 'error'); }
  };

  const handleToggleEstado = async (id, estado) => {
    try { await toggleEstadoVehiculo(id, estado); cargarDatos(); } catch (error) { mostrarToast('Error', 'error'); }
  };

  const confirmarYeliminar = async () => {
    try { await eliminarVehiculo(vehiculoAEliminar.VehiculoID); setVehiculoAEliminar(null); cargarDatos(); } catch (error) { mostrarToast('Error', 'error'); }
  };

  const vehiculosFiltrados = vehiculos.filter(v => {
    const coincideTexto = v.Placa.toLowerCase().includes(busqueda.toLowerCase()) || v.Marca.toLowerCase().includes(busqueda.toLowerCase());
    const estadoString = v.Estado ? "1" : "0";
    const coincideEstado = filtroEstado === '' || estadoString === filtroEstado;
    return coincideTexto && coincideEstado;
  });

  const totalRegistros = vehiculosFiltrados.length;
  const totalPaginas = registrosPorPagina === 'Todos' ? 1 : Math.ceil(totalRegistros / registrosPorPagina);
  const indiceUltimo = registrosPorPagina === 'Todos' ? totalRegistros : paginaActual * registrosPorPagina;
  const indicePrimer = registrosPorPagina === 'Todos' ? 0 : indiceUltimo - registrosPorPagina;
  const vehiculosPaginados = vehiculosFiltrados.slice(indicePrimer, indiceUltimo);

  useEffect(() => { if (paginaActual > totalPaginas && totalPaginas > 0) setPaginaActual(totalPaginas); }, [totalPaginas, paginaActual]);

  const handleSelect = (id) => setSeleccionados(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  const handleSelectAll = (checked) => setSeleccionados(checked ? vehiculosPaginados.map(v => v.VehiculoID) : []);

  const handleAccionMasiva = async (accion, estado = null) => {
    if (!window.confirm(`¿Aplicar a ${seleccionados.length} vehículos?`)) return;
    try {
      const promesas = seleccionados.map(id => accion === 'eliminar' ? eliminarVehiculo(id) : toggleEstadoVehiculo(id, estado));
      await Promise.all(promesas); mostrarToast('Acción masiva completada', 'success'); cargarDatos();
    } catch (error) { mostrarToast('Error', 'error'); }
  };

  const exportarCSV = () => {
    if (vehiculosFiltrados.length === 0) return mostrarToast('No hay datos', 'warning');
    let csv = 'Placa,Marca,Modelo,Anio,Capacidad,Color,Estado\n';
    vehiculosFiltrados.forEach(v => { csv += `"${v.Placa}","${v.Marca}","${v.Modelo}",${v.Anio},${v.Capacidad},"${v.Color}","${v.Estado ? 'En Ruta' : 'En Taller'}"\n`; });
    const link = document.createElement('a'); link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    link.setAttribute('download', 'Reporte_Vehiculos.csv'); document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: '800', color: '#0f172a' }}>Vehículos</h1>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'white', padding: '8px 16px', borderRadius: '10px', border: '1.5px solid var(--border)' }}><Search size={18} color="var(--text-muted)" /><input type="text" placeholder="Buscar placa o marca..." style={{ border: 'none', outline: 'none', width: '200px', fontWeight: '500' }} value={busqueda} onChange={(e) => setBusqueda(e.target.value)} /></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'white', padding: '6px 16px', borderRadius: '10px', border: '1.5px solid var(--border)' }}><Filter size={18} color="var(--text-muted)" /><select style={{ border: 'none', outline: 'none', background: 'transparent', color: '#0f172a', fontWeight: '500', padding: '8px 0', cursor: 'pointer' }} value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}><option value="">Todos</option><option value="1">En Ruta</option><option value="0">En Taller</option></select></div>
          <button onClick={exportarCSV} style={{ background: 'white', color: '#0f172a', padding: '10px 16px', borderRadius: '10px', fontWeight: '700', border: '1.5px solid var(--border)', cursor: 'pointer', display: 'flex', gap: '8px', alignItems: 'center' }}><Download size={20} color="var(--primary)" /> Exportar</button>
          <button onClick={() => { setVehiculoAEditar(null); setModalAbierto(true); }} style={{ background: 'var(--primary)', color: 'white', padding: '12px 24px', borderRadius: '10px', fontWeight: '800', border: 'none', cursor: 'pointer', display: 'flex', gap: '8px', alignItems: 'center' }}><Plus size={20} /> Nuevo Vehículo</button>
        </div>
      </div>

      {seleccionados.length > 0 && (
        <div style={{ background: '#e0f2fe', padding: '16px 24px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', border: '1px solid #bae6fd' }}>
          <span style={{ fontWeight: '800', color: '#0369a1', fontSize: '15px' }}>{seleccionados.length} vehículos seleccionados</span>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={() => handleAccionMasiva('estado', true)} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: '#d1fae5', color: '#059669', fontWeight: '700', cursor: 'pointer', display: 'flex', gap: '6px' }}><Power size={16} /> En Ruta</button>
            <button onClick={() => handleAccionMasiva('estado', false)} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: '#fef08a', color: '#854d0e', fontWeight: '700', cursor: 'pointer', display: 'flex', gap: '6px' }}><Power size={16} /> En Taller</button>
            <button onClick={() => handleAccionMasiva('eliminar')} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: '#fee2e2', color: '#dc2626', fontWeight: '700', cursor: 'pointer', display: 'flex', gap: '6px' }}><Trash2 size={16} /> Eliminar</button>
          </div>
        </div>
      )}

      <div style={{ borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', background: 'white' }}>
        <VehiculosTabla vehiculos={vehiculosPaginados} onToggleEstado={handleToggleEstado} onEdit={(v) => { setVehiculoAEditar(v); setModalAbierto(true); }} onDelete={setVehiculoAEliminar} seleccionados={seleccionados} onSelect={handleSelect} onSelectAll={handleSelectAll} />
        <Pagination paginaActual={paginaActual} totalPaginas={totalPaginas} onPageChange={setPaginaActual} registrosPorPagina={registrosPorPagina} onRegistrosChange={(val) => { setRegistrosPorPagina(val); setPaginaActual(1); }} totalRegistros={totalRegistros} />
      </div>

      {modalAbierto && <VehiculosModal vehiculoAEditar={vehiculoAEditar} onClose={() => setModalAbierto(false)} onSave={handleGuardar} />}
      {vehiculoAEliminar && <ConfirmarEliminarModal mensaje={`¿Deseas eliminar el vehículo ${vehiculoAEliminar.Placa}?`} onClose={() => setVehiculoAEliminar(null)} onConfirm={confirmarYeliminar} />}
      <Toast mensaje={toast.mensaje} tipo={toast.tipo} onClose={() => setToast({ mensaje: '', tipo: '' })} />
    </div>
  );
};
export default Vehiculos;