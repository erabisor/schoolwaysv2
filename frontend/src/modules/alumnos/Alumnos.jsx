import React, { useEffect, useState } from 'react';
import { Plus, Search, Filter, Download, Trash2, Power } from 'lucide-react';
import { getAlumnos, toggleEstadoAlumno, crearAlumno, editarAlumno, eliminarAlumnoFisico } from './alumnos.api';
import AlumnosTabla from './AlumnosTabla';
import AlumnosModal from './AlumnosModal';
import ConfirmarEliminarModal from '../../components/ConfirmarEliminarModal';
import Pagination from '../../components/Pagination';
import Toast from '../../components/Toast';

const Alumnos = () => {
  const [alumnos, setAlumnos] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [filtroRuta, setFiltroRuta] = useState('');
  const [modalAbierto, setModalAbierto] = useState(false);
  const [alumnoAEditar, setAlumnoAEditar] = useState(null);
  const [alumnoAEliminar, setAlumnoAEliminar] = useState(null);
  const [seleccionados, setSeleccionados] = useState([]);
  const [toast, setToast] = useState({ mensaje: '', tipo: '' });

  const [paginaActual, setPaginaActual] = useState(1);
  const [registrosPorPagina, setRegistrosPorPagina] = useState(10);

  useEffect(() => { setPaginaActual(1); }, [busqueda, filtroRuta]);

  const cargarDatos = async () => {
    try {
      const res = await getAlumnos();
      setAlumnos(res.data.data);
      setSeleccionados([]);
    } catch (error) { mostrarToast('Error al cargar alumnos', 'error'); }
  };

  useEffect(() => { cargarDatos(); }, []);

  const mostrarToast = (mensaje, tipo) => setToast({ mensaje, tipo });

  const handleEditar = (alumno) => {
    setAlumnoAEditar({ ...alumno, UsuarioID: alumno.UsuarioID || alumno.PadreID || '' });
    setModalAbierto(true);
  };

  const handleGuardar = async (datos) => {
    try {
      if (alumnoAEditar) {
        await editarAlumno(alumnoAEditar.AlumnoID, datos);
        setAlumnoAEditar(null);
      } else {
        await crearAlumno(datos);
      }
      setModalAbierto(false);
      await cargarDatos();
      mostrarToast('Operación exitosa', 'success');
    } catch (error) { mostrarToast('Error al guardar', 'error'); }
  };

  const handleToggleEstado = async (id, estado) => {
    try {
      await toggleEstadoAlumno(id, estado);
      mostrarToast(`Alumno ${estado ? 'activado' : 'desactivado'}`, 'success');
      cargarDatos();
    } catch (error) { mostrarToast('Error al actualizar estado', 'error'); }
  };

  const confirmarYeliminar = async () => {
    try {
      await eliminarAlumnoFisico(alumnoAEliminar.AlumnoID);
      mostrarToast('Alumno eliminado', 'success');
      setAlumnoAEliminar(null);
      cargarDatos();
    } catch (error) { mostrarToast('Error al eliminar', 'error'); }
  };

  const rutasDisponibles = [...new Set(alumnos.map(a => a.NombreRuta).filter(Boolean))];

  const alumnosFiltrados = alumnos.filter(a => {
    const coincideTexto = a.NombreCompleto.toLowerCase().includes(busqueda.toLowerCase()) ||
                          (a.NombrePadre && a.NombrePadre.toLowerCase().includes(busqueda.toLowerCase()));
    const coincideRuta = filtroRuta === '' || (filtroRuta === 'Sin Ruta' ? !a.NombreRuta : a.NombreRuta === filtroRuta);
    return coincideTexto && coincideRuta;
  });

  const totalRegistros = alumnosFiltrados.length;
  const totalPaginas = registrosPorPagina === 'Todos' ? 1 : Math.ceil(totalRegistros / registrosPorPagina);
  const indiceUltimo = registrosPorPagina === 'Todos' ? totalRegistros : paginaActual * registrosPorPagina;
  const indicePrimer = registrosPorPagina === 'Todos' ? 0 : indiceUltimo - registrosPorPagina;
  const alumnosPaginados = alumnosFiltrados.slice(indicePrimer, indiceUltimo);

  useEffect(() => {
    if (paginaActual > totalPaginas && totalPaginas > 0) setPaginaActual(totalPaginas);
  }, [totalPaginas, paginaActual]);

  const handleSelect = (id) => setSeleccionados(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
  const handleSelectAll = (checked) => setSeleccionados(checked ? alumnosPaginados.map(a => a.AlumnoID) : []);

  const handleAccionMasiva = async (accion, estado = null) => {
    if (!window.confirm(`¿Estás seguro de aplicar esta acción a ${seleccionados.length} alumnos?`)) return;
    try {
      const promesas = seleccionados.map(id => {
        if (accion === 'eliminar') return eliminarAlumnoFisico(id);
        if (accion === 'estado') return toggleEstadoAlumno(id, estado);
        return Promise.resolve();
      });
      await Promise.all(promesas);
      mostrarToast(`Acción masiva aplicada`, 'success');
      cargarDatos();
    } catch (error) { mostrarToast('Error en la acción masiva', 'error'); }
  };

  const exportarCSV = () => {
    if (alumnosFiltrados.length === 0) return mostrarToast('No hay datos', 'warning');
    let csv = 'Alumno,Grado,Direccion,Referencia,Responsable,Ruta,Estado\n';
    alumnosFiltrados.forEach(a => {
      const estado = a.Estado ? 'Activo' : 'Inactivo';
      csv += `"${a.NombreCompleto}","${a.Grado}","${a.Direccion}","${a.PuntoReferencia}","${a.NombrePadre || ''}","${a.NombreRuta || 'Sin Ruta'}","${estado}"\n`;
    });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    link.setAttribute('download', 'Reporte_Alumnos.csv');
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>

      <div className="page-header">
        <h1>Alumnos</h1>
        <div className="header-actions">
          <div className="search-box">
            <Search size={18} color="var(--text-muted)" />
            <input type="text" placeholder="Buscar alumno o padre..." className="search-input" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
          </div>
          <div className="filter-box">
            <Filter size={18} color="var(--text-muted)" />
            <select className="filter-select" value={filtroRuta} onChange={(e) => setFiltroRuta(e.target.value)}>
              <option value="">Todas las rutas</option>
              <option value="Sin Ruta">-- Sin Ruta Asignada --</option>
              {rutasDisponibles.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <button onClick={exportarCSV} className="btn-secondary">
            <Download size={20} color="var(--primary)" /> Exportar
          </button>
          <button onClick={() => { setAlumnoAEditar(null); setModalAbierto(true); }} className="btn-primary">
            <Plus size={20} /> Registrar Alumno
          </button>
        </div>
      </div>

      {seleccionados.length > 0 && (
        <div className="bulk-bar">
          <span style={{ fontWeight: '800', color: '#0369a1', fontSize: '15px' }}>{seleccionados.length} alumnos seleccionados</span>
          <div className="bulk-bar-actions">
            <button onClick={() => handleAccionMasiva('estado', true)} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: '#d1fae5', color: '#059669', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}><Power size={16} /> Activar</button>
            <button onClick={() => handleAccionMasiva('estado', false)} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: '#fef08a', color: '#854d0e', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}><Power size={16} /> Desactivar</button>
            <button onClick={() => handleAccionMasiva('eliminar')} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: '#fee2e2', color: '#dc2626', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}><Trash2 size={16} /> Eliminar</button>
          </div>
        </div>
      )}

      <div className="table-card">
        <AlumnosTabla
          alumnos={alumnosPaginados}
          onToggleEstado={handleToggleEstado}
          onEdit={handleEditar}
          onDelete={setAlumnoAEliminar}
          seleccionados={seleccionados}
          onSelect={handleSelect}
          onSelectAll={handleSelectAll}
        />
        <Pagination
          paginaActual={paginaActual}
          totalPaginas={totalPaginas}
          onPageChange={setPaginaActual}
          registrosPorPagina={registrosPorPagina}
          onRegistrosChange={(val) => { setRegistrosPorPagina(val); setPaginaActual(1); }}
          totalRegistros={totalRegistros}
        />
      </div>

      {modalAbierto && <AlumnosModal alumnoAEditar={alumnoAEditar} onClose={() => setModalAbierto(false)} onSave={handleGuardar} />}
      {alumnoAEliminar && <ConfirmarEliminarModal mensaje={`¿Eliminar al alumno ${alumnoAEliminar.NombreCompleto}?`} onClose={() => setAlumnoAEliminar(null)} onConfirm={confirmarYeliminar} />}
      <Toast mensaje={toast.mensaje} tipo={toast.tipo} onClose={() => setToast({ mensaje: '', tipo: '' })} />
    </div>
  );
};

export default Alumnos;
