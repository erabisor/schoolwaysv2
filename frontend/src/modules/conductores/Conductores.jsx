import React, { useEffect, useState } from 'react';
import { Plus, Search, Filter, Download, Trash2, Power } from 'lucide-react';
import { getConductores, toggleEstadoConductor, crearConductor, editarConductor, eliminarConductor } from './conductores.api';
import ConductoresTabla from './ConductoresTabla';
import ConductoresModal from './ConductoresModal';
import ConfirmarEliminarModal from '../../components/ConfirmarEliminarModal';
import Pagination from '../../components/Pagination';
import Toast from '../../components/Toast';

const Conductores = () => {
  const [conductores, setConductores] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [modalAbierto, setModalAbierto] = useState(false);
  const [conductorAEditar, setConductorAEditar] = useState(null);
  const [conductorAEliminar, setConductorAEliminar] = useState(null);
  const [seleccionados, setSeleccionados] = useState([]);
  const [toast, setToast] = useState({ mensaje: '', tipo: '' });

  const [paginaActual, setPaginaActual] = useState(1);
  const [registrosPorPagina, setRegistrosPorPagina] = useState(10);
  useEffect(() => { setPaginaActual(1); }, [busqueda, filtroEstado]);

  const cargarDatos = async () => {
    try {
      const res = await getConductores();
      setConductores(res.data.data);
      setSeleccionados([]);
    } catch (error) { mostrarToast('Error al cargar', 'error'); }
  };

  useEffect(() => { cargarDatos(); }, []);
  const mostrarToast = (mensaje, tipo) => setToast({ mensaje, tipo });

  const handleGuardar = async (datos) => {
    try {
      if (conductorAEditar) { await editarConductor(conductorAEditar.ConductorID, datos); }
      else { await crearConductor(datos); }
      setModalAbierto(false); cargarDatos(); mostrarToast('Operación exitosa', 'success');
    } catch (error) { mostrarToast('Error', 'error'); }
  };

  const handleToggleEstado = async (id, estado) => {
    try { await toggleEstadoConductor(id, estado); cargarDatos(); } catch (error) { mostrarToast('Error', 'error'); }
  };

  const confirmarYeliminar = async () => {
    try { await eliminarConductor(conductorAEliminar.ConductorID); setConductorAEliminar(null); cargarDatos(); } catch (error) { mostrarToast('Error', 'error'); }
  };

  const conductoresFiltrados = conductores.filter(c => {
    const coincideTexto = c.NombreCompleto.toLowerCase().includes(busqueda.toLowerCase()) || c.NumeroLicencia.toLowerCase().includes(busqueda.toLowerCase());
    const coincideEstado = filtroEstado === '' || (c.Estado ? "1" : "0") === filtroEstado;
    return coincideTexto && coincideEstado;
  });

  const totalRegistros = conductoresFiltrados.length;
  const totalPaginas = registrosPorPagina === 'Todos' ? 1 : Math.ceil(totalRegistros / registrosPorPagina);
  const indiceUltimo = registrosPorPagina === 'Todos' ? totalRegistros : paginaActual * registrosPorPagina;
  const indicePrimer = registrosPorPagina === 'Todos' ? 0 : indiceUltimo - registrosPorPagina;
  const conductoresPaginados = conductoresFiltrados.slice(indicePrimer, indiceUltimo);

  useEffect(() => { if (paginaActual > totalPaginas && totalPaginas > 0) setPaginaActual(totalPaginas); }, [totalPaginas, paginaActual]);

  const handleSelect = (id) => setSeleccionados(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  const handleSelectAll = (checked) => setSeleccionados(checked ? conductoresPaginados.map(c => c.ConductorID) : []);

  const handleAccionMasiva = async (accion, estado = null) => {
    if (!window.confirm(`¿Aplicar a ${seleccionados.length} conductores?`)) return;
    try {
      const promesas = seleccionados.map(id => accion === 'eliminar' ? eliminarConductor(id) : toggleEstadoConductor(id, estado));
      await Promise.all(promesas); mostrarToast('Acción masiva completada', 'success'); cargarDatos();
    } catch (error) { mostrarToast('Error', 'error'); }
  };

  const exportarCSV = () => {
    if (conductoresFiltrados.length === 0) return mostrarToast('No hay datos', 'warning');
    let csv = 'Nombre,Correo,Telefono,Licencia,Vencimiento,Estado\n';
    conductoresFiltrados.forEach(c => {
      csv += `"${c.NombreCompleto}","${c.CorreoElectronico}","${c.Telefono}","${c.NumeroLicencia}","${c.VencimientoLicencia ? c.VencimientoLicencia.split('T')[0] : 'N/A'}","${c.Estado ? 'Activo' : 'Inactivo'}"\n`;
    });
    const link = document.createElement('a'); link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    link.setAttribute('download', 'Reporte_Conductores.csv'); document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>

      <div className="page-header">
        <h1>Conductores</h1>
        <div className="header-actions">
          <div className="search-box">
            <Search size={18} color="var(--text-muted)" />
            <input type="text" placeholder="Buscar nombre o licencia..." className="search-input" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
          </div>
          <div className="filter-box">
            <Filter size={18} color="var(--text-muted)" />
            <select className="filter-select" value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}>
              <option value="">Todos</option>
              <option value="1">Activos</option>
              <option value="0">Inactivos</option>
            </select>
          </div>
          <button onClick={exportarCSV} className="btn-secondary"><Download size={20} color="var(--primary)" /> Exportar</button>
          <button onClick={() => { setConductorAEditar(null); setModalAbierto(true); }} className="btn-primary"><Plus size={20} /> Vincular Conductor</button>
        </div>
      </div>

      {seleccionados.length > 0 && (
        <div className="bulk-bar">
          <span style={{ fontWeight: '800', color: '#0369a1', fontSize: '15px' }}>{seleccionados.length} conductores seleccionados</span>
          <div className="bulk-bar-actions">
            <button onClick={() => handleAccionMasiva('estado', true)} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: '#d1fae5', color: '#059669', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}><Power size={16} /> Activar</button>
            <button onClick={() => handleAccionMasiva('estado', false)} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: '#fef08a', color: '#854d0e', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}><Power size={16} /> Desactivar</button>
            <button onClick={() => handleAccionMasiva('eliminar')} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: '#fee2e2', color: '#dc2626', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}><Trash2 size={16} /> Eliminar</button>
          </div>
        </div>
      )}

      <div className="table-card">
        <ConductoresTabla conductores={conductoresPaginados} onToggleEstado={handleToggleEstado} onEdit={(c) => { setConductorAEditar(c); setModalAbierto(true); }} onDelete={setConductorAEliminar} seleccionados={seleccionados} onSelect={handleSelect} onSelectAll={handleSelectAll} />
        <Pagination paginaActual={paginaActual} totalPaginas={totalPaginas} onPageChange={setPaginaActual} registrosPorPagina={registrosPorPagina} onRegistrosChange={(val) => { setRegistrosPorPagina(val); setPaginaActual(1); }} totalRegistros={totalRegistros} />
      </div>

      {modalAbierto && <ConductoresModal conductorAEditar={conductorAEditar} onClose={() => setModalAbierto(false)} onSave={handleGuardar} />}
      {conductorAEliminar && <ConfirmarEliminarModal mensaje={`¿Eliminar perfil de conductor de ${conductorAEliminar.NombreCompleto}?`} onClose={() => setConductorAEliminar(null)} onConfirm={confirmarYeliminar} />}
      <Toast mensaje={toast.mensaje} tipo={toast.tipo} onClose={() => setToast({ mensaje: '', tipo: '' })} />
    </div>
  );
};
export default Conductores;
