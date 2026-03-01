import React, { useEffect, useState } from 'react';
import { Plus, Filter, Download, Trash2, Power } from 'lucide-react';
import { getUsuarios, toggleEstadoUsuario, crearUsuario, editarUsuario, eliminarUsuarioFisico } from './usuarios.api';
import UsuariosTabla from './UsuariosTabla';
import UsuariosModal from './UsuariosModal';
import ConfirmarEliminarModal from '../../components/ConfirmarEliminarModal';
import Pagination from '../../components/Pagination';
import Toast from '../../components/Toast';

const Usuarios = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [filtroRol, setFiltroRol] = useState(''); 
  const [modalAbierto, setModalAbierto] = useState(false);
  const [usuarioAEditar, setUsuarioAEditar] = useState(null);
  const [usuarioAEliminar, setUsuarioAEliminar] = useState(null);
  const [seleccionados, setSeleccionados] = useState([]);
  const [toast, setToast] = useState({ mensaje: '', tipo: '' });

  const [paginaActual, setPaginaActual] = useState(1);
  const [registrosPorPagina, setRegistrosPorPagina] = useState(10);

  useEffect(() => { setPaginaActual(1); }, [filtroRol]);

  const cargarDatos = async () => {
    try {
      const res = await getUsuarios();
      setUsuarios(res.data.data);
      setSeleccionados([]);
    } catch (error) { mostrarToast('Error al cargar', 'error'); }
  };

  useEffect(() => { cargarDatos(); }, []);
  const mostrarToast = (mensaje, tipo) => setToast({ mensaje, tipo });

  const handleToggleEstado = async (id, nuevoEstado) => {
    try { await toggleEstadoUsuario(id, nuevoEstado); cargarDatos(); } 
    catch (error) { mostrarToast('Error', 'error'); }
  };

  const handleGuardarUsuario = async (datos) => {
    try {
      if (usuarioAEditar) { await editarUsuario(usuarioAEditar.UsuarioID, datos); } 
      else { await crearUsuario(datos); }
      setModalAbierto(false);
      cargarDatos();
      mostrarToast('Operación exitosa', 'success');
    } catch (error) { mostrarToast('Error al guardar', 'error'); }
  };

  const confirmarYeliminar = async () => {
    try { await eliminarUsuarioFisico(usuarioAEliminar.UsuarioID); setUsuarioAEliminar(null); cargarDatos(); } 
    catch (error) { mostrarToast('Error', 'error'); }
  };

  const usuariosFiltrados = filtroRol ? usuarios.filter(u => u.NombreRol === filtroRol) : usuarios;

  // LÓGICA PAGINACIÓN
  const totalRegistros = usuariosFiltrados.length;
  const totalPaginas = registrosPorPagina === 'Todos' ? 1 : Math.ceil(totalRegistros / registrosPorPagina);
  const indiceUltimo = registrosPorPagina === 'Todos' ? totalRegistros : paginaActual * registrosPorPagina;
  const indicePrimer = registrosPorPagina === 'Todos' ? 0 : indiceUltimo - registrosPorPagina;
  const usuariosPaginados = usuariosFiltrados.slice(indicePrimer, indiceUltimo);

  useEffect(() => { if (paginaActual > totalPaginas && totalPaginas > 0) setPaginaActual(totalPaginas); }, [totalPaginas, paginaActual]);

  const handleSelect = (id) => setSeleccionados(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  const handleSelectAll = (checked) => setSeleccionados(checked ? usuariosPaginados.map(u => u.UsuarioID) : []);

  const handleAccionMasiva = async (accion, estado = null) => {
    if (!window.confirm(`¿Aplicar a ${seleccionados.length} usuarios?`)) return;
    try {
      const promesas = seleccionados.map(id => accion === 'eliminar' ? eliminarUsuarioFisico(id) : toggleEstadoUsuario(id, estado));
      await Promise.all(promesas);
      mostrarToast('Acción masiva completada', 'success');
      cargarDatos();
    } catch (error) { mostrarToast('Error en acción masiva', 'error'); }
  };

  const exportarCSV = () => {
    if (usuariosFiltrados.length === 0) return mostrarToast('No hay datos', 'warning');
    let csv = 'Nombre,Correo,Rol,Estado\n';
    usuariosFiltrados.forEach(u => {
      csv += `"${u.NombreCompleto}","${u.CorreoElectronico}","${u.NombreRol}","${u.Estado ? 'Activo' : 'Inactivo'}"\n`;
    });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    link.setAttribute('download', 'Reporte_Usuarios.csv');
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: '800', color: '#0f172a' }}>Usuarios</h1>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'white', padding: '6px 16px', borderRadius: '10px', border: '1.5px solid var(--border)' }}>
            <Filter size={18} color="var(--text-muted)" />
            <select style={{ border: 'none', outline: 'none', background: 'transparent', color: '#0f172a', fontWeight: '500', padding: '8px 0', cursor: 'pointer' }} value={filtroRol} onChange={(e) => setFiltroRol(e.target.value)}>
              <option value="">Todos los roles</option><option value="Admin">Administrador</option><option value="Conductor">Conductor</option><option value="Padre">Padre</option><option value="Estudiante">Estudiante</option>
            </select>
          </div>
          <button onClick={exportarCSV} style={{ background: 'white', color: '#0f172a', padding: '10px 16px', borderRadius: '10px', fontWeight: '700', border: '1.5px solid var(--border)', cursor: 'pointer', display: 'flex', gap: '8px', alignItems: 'center' }}>
            <Download size={20} color="var(--primary)" /> Exportar
          </button>
          <button onClick={() => { setUsuarioAEditar(null); setModalAbierto(true); }} style={{ background: 'var(--primary)', color: 'white', padding: '12px 24px', borderRadius: '10px', fontWeight: '800', border: 'none', cursor: 'pointer', display: 'flex', gap: '8px', alignItems: 'center' }}>
            <Plus size={20} /> Nuevo Usuario
          </button>
        </div>
      </div>

      {seleccionados.length > 0 && (
        <div style={{ background: '#e0f2fe', padding: '16px 24px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', border: '1px solid #bae6fd' }}>
          <span style={{ fontWeight: '800', color: '#0369a1', fontSize: '15px' }}>{seleccionados.length} usuarios seleccionados</span>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={() => handleAccionMasiva('estado', true)} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: '#d1fae5', color: '#059669', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}><Power size={16} /> Activar</button>
            <button onClick={() => handleAccionMasiva('estado', false)} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: '#fef08a', color: '#854d0e', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}><Power size={16} /> Desactivar</button>
            <button onClick={() => handleAccionMasiva('eliminar')} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: '#fee2e2', color: '#dc2626', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}><Trash2 size={16} /> Eliminar</button>
          </div>
        </div>
      )}
      
      {/* Contenedor fusionado: Tabla + Paginación */}
      <div style={{ borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', background: 'white' }}>
        <UsuariosTabla usuarios={usuariosPaginados} onToggleEstado={handleToggleEstado} onEdit={u => { setUsuarioAEditar(u); setModalAbierto(true); }} onDelete={setUsuarioAEliminar} seleccionados={seleccionados} onSelect={handleSelect} onSelectAll={handleSelectAll} />
        <Pagination paginaActual={paginaActual} totalPaginas={totalPaginas} onPageChange={setPaginaActual} registrosPorPagina={registrosPorPagina} onRegistrosChange={(val) => { setRegistrosPorPagina(val); setPaginaActual(1); }} totalRegistros={totalRegistros} />
      </div>

      {modalAbierto && <UsuariosModal usuarioAEditar={usuarioAEditar} onClose={() => setModalAbierto(false)} onSave={handleGuardarUsuario} />}
      {usuarioAEliminar && <ConfirmarEliminarModal mensaje={`¿Eliminar a ${usuarioAEliminar.NombreCompleto}?`} onClose={() => setUsuarioAEliminar(null)} onConfirm={confirmarYeliminar} />}
      <Toast mensaje={toast.mensaje} tipo={toast.tipo} onClose={() => setToast({ mensaje: '', tipo: '' })} />
    </div>
  );
};

export default Usuarios;