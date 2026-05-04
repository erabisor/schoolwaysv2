import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Filter, Download, Trash2, Power, Search } from 'lucide-react';
import {
  getUsuarios,
  toggleEstadoUsuario,
  crearUsuario,
  editarUsuario,
  eliminarUsuarioFisico
} from './usuarios.api';
import UsuariosTabla from './UsuariosTabla';
import UsuariosModal from './UsuariosModal';
import ConfirmarEliminarModal from '../../components/ConfirmarEliminarModal';
import Pagination from '../../components/Pagination';
import Toast from '../../components/Toast';

const textoSeguro = (valor) => {
  if (valor === undefined || valor === null) return '';
  return String(valor);
};

const Usuarios = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [filtroRol, setFiltroRol] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [modalAbierto, setModalAbierto] = useState(false);
  const [usuarioAEditar, setUsuarioAEditar] = useState(null);
  const [usuarioAEliminar, setUsuarioAEliminar] = useState(null);
  const [seleccionados, setSeleccionados] = useState([]);
  const [toast, setToast] = useState({ mensaje: '', tipo: '' });
  const [paginaActual, setPaginaActual] = useState(1);
  const [registrosPorPagina, setRegistrosPorPagina] = useState(10);

  const mostrarToast = (mensaje, tipo) => setToast({ mensaje, tipo });

  const cargarDatos = async () => {
    try {
      const res = await getUsuarios();
      setUsuarios(res.data.data || []);
      setSeleccionados([]);
    } catch (error) {
      mostrarToast(error.response?.data?.mensaje || 'Error al cargar usuarios', 'error');
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  useEffect(() => {
    setPaginaActual(1);
  }, [busqueda, filtroRol, filtroEstado]);

  const rolesDisponibles = useMemo(() => {
    return [...new Set(usuarios.map((usuario) => usuario.NombreRol).filter(Boolean))];
  }, [usuarios]);

  const usuariosFiltrados = useMemo(() => {
    const texto = busqueda.toLowerCase().trim();

    return usuarios.filter((usuario) => {
      const contenidoBusqueda = [
        usuario.UsuarioID,
        usuario.NombreCompleto,
        usuario.CorreoElectronico,
        usuario.Telefono,
        usuario.NombreRol,
        usuario.Estado ? 'Activo' : 'Inactivo'
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      const coincideTexto = !texto || contenidoBusqueda.includes(texto);
      const coincideRol = filtroRol === '' || usuario.NombreRol === filtroRol;
      const coincideEstado =
        filtroEstado === '' ||
        (filtroEstado === 'Activo' ? Boolean(usuario.Estado) : !usuario.Estado);

      return coincideTexto && coincideRol && coincideEstado;
    });
  }, [usuarios, busqueda, filtroRol, filtroEstado]);

  const totalRegistros = usuariosFiltrados.length;
  const totalPaginas = registrosPorPagina === 'Todos' ? 1 : Math.ceil(totalRegistros / registrosPorPagina);
  const indiceUltimo = registrosPorPagina === 'Todos' ? totalRegistros : paginaActual * registrosPorPagina;
  const indicePrimer = registrosPorPagina === 'Todos' ? 0 : indiceUltimo - registrosPorPagina;
  const usuariosPaginados = usuariosFiltrados.slice(indicePrimer, indiceUltimo);

  useEffect(() => {
    if (paginaActual > totalPaginas && totalPaginas > 0) {
      setPaginaActual(totalPaginas);
    }
  }, [totalPaginas, paginaActual]);

  const handleToggleEstado = async (id, nuevoEstado) => {
    try {
      await toggleEstadoUsuario(id, nuevoEstado);
      mostrarToast(`Usuario ${nuevoEstado ? 'activado' : 'desactivado'}`, 'success');
      await cargarDatos();
    } catch (error) {
      mostrarToast(error.response?.data?.mensaje || 'Error al actualizar estado', 'error');
    }
  };

  const handleGuardarUsuario = async (datos) => {
    try {
      if (usuarioAEditar) {
        await editarUsuario(usuarioAEditar.UsuarioID, datos);
        mostrarToast('Usuario actualizado correctamente', 'success');
      } else {
        await crearUsuario(datos);
        mostrarToast('Usuario creado correctamente', 'success');
      }

      setModalAbierto(false);
      setUsuarioAEditar(null);
      await cargarDatos();
    } catch (error) {
      mostrarToast(error.response?.data?.mensaje || 'Error al guardar usuario', 'error');
    }
  };

  const confirmarYeliminar = async () => {
    if (!usuarioAEliminar) return;

    try {
      await eliminarUsuarioFisico(usuarioAEliminar.UsuarioID);
      setUsuarioAEliminar(null);
      mostrarToast('Usuario eliminado correctamente', 'success');
      await cargarDatos();
    } catch (error) {
      mostrarToast(error.response?.data?.mensaje || 'Error al eliminar usuario', 'error');
    }
  };

  const handleSelect = (id) => {
    setSeleccionados((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (checked) => {
    setSeleccionados(checked ? usuariosPaginados.map((usuario) => usuario.UsuarioID) : []);
  };

  const handleAccionMasiva = async (accion, estado = null) => {
    if (seleccionados.length === 0) return;

    if (!window.confirm(`¿Aplicar esta acción a ${seleccionados.length} usuario(s)?`)) return;

    try {
      const promesas = seleccionados.map((id) =>
        accion === 'eliminar' ? eliminarUsuarioFisico(id) : toggleEstadoUsuario(id, estado)
      );

      await Promise.all(promesas);
      mostrarToast('Acción masiva completada', 'success');
      await cargarDatos();
    } catch (error) {
      mostrarToast(error.response?.data?.mensaje || 'Error en acción masiva', 'error');
    }
  };

  const exportarCSV = () => {
    if (usuariosFiltrados.length === 0) {
      mostrarToast('No hay datos para exportar', 'warning');
      return;
    }

    const encabezado = ['ID', 'Nombre', 'Correo', 'Teléfono', 'Rol', 'Estado'];

    const filas = usuariosFiltrados.map((usuario) => [
      textoSeguro(usuario.UsuarioID),
      textoSeguro(usuario.NombreCompleto),
      textoSeguro(usuario.CorreoElectronico),
      textoSeguro(usuario.Telefono),
      textoSeguro(usuario.NombreRol),
      usuario.Estado ? 'Activo' : 'Inactivo'
    ]);

    const csv = [encabezado, ...filas]
      .map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob(['\ufeff', csv], { type: 'text/csv;charset=utf-8;' }));
    link.setAttribute('download', 'Reporte_Usuarios.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const abrirNuevoUsuario = () => {
    setUsuarioAEditar(null);
    setModalAbierto(true);
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    setUsuarioAEditar(null);
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="page-header">
        <h1>Usuarios</h1>

        <div className="header-actions">
          <div className="search-box">
            <Search size={18} color="var(--text-muted)" />
            <input
              type="text"
              placeholder="Buscar nombre, correo, teléfono o rol..."
              className="search-input"
              value={busqueda}
              onChange={(event) => setBusqueda(event.target.value)}
            />
          </div>

          <div className="filter-box">
            <Filter size={18} color="var(--text-muted)" />
            <select
              className="filter-select"
              value={filtroRol}
              onChange={(event) => setFiltroRol(event.target.value)}
            >
              <option value="">Todos los roles</option>
              {rolesDisponibles.map((rol) => (
                <option key={rol} value={rol}>{rol}</option>
              ))}
            </select>
          </div>

          <div className="filter-box">
            <Filter size={18} color="var(--text-muted)" />
            <select
              className="filter-select"
              value={filtroEstado}
              onChange={(event) => setFiltroEstado(event.target.value)}
            >
              <option value="">Todos</option>
              <option value="Activo">Activos</option>
              <option value="Inactivo">Inactivos</option>
            </select>
          </div>

          <button type="button" onClick={exportarCSV} className="btn-secondary">
            <Download size={20} color="var(--primary)" />
            Exportar
          </button>

          <button type="button" onClick={abrirNuevoUsuario} className="btn-primary">
            <Plus size={20} />
            Nuevo Usuario
          </button>
        </div>
      </div>

      {seleccionados.length > 0 && (
        <div className="bulk-bar">
          <span style={{ fontWeight: '800', color: '#0369a1', fontSize: '15px' }}>
            {seleccionados.length} usuario(s) seleccionado(s)
          </span>

          <div className="bulk-bar-actions">
            <button
              type="button"
              onClick={() => handleAccionMasiva('estado', true)}
              style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: '#d1fae5', color: '#059669', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Power size={16} /> Activar
            </button>

            <button
              type="button"
              onClick={() => handleAccionMasiva('estado', false)}
              style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: '#fef08a', color: '#854d0e', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Power size={16} /> Desactivar
            </button>

            <button
              type="button"
              onClick={() => handleAccionMasiva('eliminar')}
              style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: '#fee2e2', color: '#dc2626', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Trash2 size={16} /> Eliminar
            </button>
          </div>
        </div>
      )}

      <div className="table-card">
        <UsuariosTabla
          usuarios={usuariosPaginados}
          onToggleEstado={handleToggleEstado}
          onEdit={(usuario) => {
            setUsuarioAEditar(usuario);
            setModalAbierto(true);
          }}
          onDelete={setUsuarioAEliminar}
          seleccionados={seleccionados}
          onSelect={handleSelect}
          onSelectAll={handleSelectAll}
        />

        <Pagination
          paginaActual={paginaActual}
          totalPaginas={totalPaginas}
          onPageChange={setPaginaActual}
          registrosPorPagina={registrosPorPagina}
          onRegistrosChange={(valor) => {
            setRegistrosPorPagina(valor);
            setPaginaActual(1);
          }}
          totalRegistros={totalRegistros}
        />
      </div>

      {modalAbierto && (
        <UsuariosModal
          usuarioAEditar={usuarioAEditar}
          onClose={cerrarModal}
          onSave={handleGuardarUsuario}
        />
      )}

      {usuarioAEliminar && (
        <ConfirmarEliminarModal
          mensaje={`¿Eliminar a ${usuarioAEliminar.NombreCompleto}?`}
          onClose={() => setUsuarioAEliminar(null)}
          onConfirm={confirmarYeliminar}
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

export default Usuarios;
