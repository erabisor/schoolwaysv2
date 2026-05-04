import React, { useEffect, useMemo, useState } from 'react';
import { Download, Filter, Plus, Search, Trash2, Power } from 'lucide-react';
import {
  crearAlumno,
  editarAlumno,
  eliminarAlumnoFisico,
  getAlumnos,
  toggleEstadoAlumno
} from './alumnos.api';
import AlumnosTabla from './AlumnosTabla';
import AlumnosModal from './AlumnosModal';
import ConfirmarEliminarModal from '../../components/ConfirmarEliminarModal';
import Pagination from '../../components/Pagination';
import Toast from '../../components/Toast';

const tieneUbicacionCompleta = (alumno) => {
  return Boolean(
    alumno.CasaLatitud &&
    alumno.CasaLongitud &&
    alumno.ColegioLatitud &&
    alumno.ColegioLongitud
  );
};

const obtenerValorTexto = (valor) => {
  if (valor === undefined || valor === null) return '';
  return String(valor);
};

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

  const mostrarToast = (mensaje, tipo) => {
    setToast({ mensaje, tipo });
  };

  const cargarDatos = async () => {
    try {
      const res = await getAlumnos();
      setAlumnos(res.data.data || []);
      setSeleccionados([]);
    } catch (error) {
      mostrarToast(
        error.response?.data?.mensaje || 'Error al cargar alumnos',
        'error'
      );
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  useEffect(() => {
    setPaginaActual(1);
  }, [busqueda, filtroRuta]);

  const rutasDisponibles = useMemo(() => {
    return [
      ...new Set(
        alumnos
          .map((alumno) => alumno.NombreRuta)
          .filter(Boolean)
      )
    ];
  }, [alumnos]);

  const alumnosFiltrados = useMemo(() => {
    const texto = busqueda.toLowerCase();

    return alumnos.filter((alumno) => {
      const contenidoBusqueda = [
        alumno.NombreCompleto,
        alumno.NombrePadre,
        alumno.Direccion,
        alumno.PuntoReferencia,
        alumno.Grado,
        alumno.Seccion,
        alumno.NombreRuta,
        alumno.TipoServicio
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      const coincideTexto = contenidoBusqueda.includes(texto);

      const coincideRuta =
        filtroRuta === '' ||
        (filtroRuta === 'Sin Ruta'
          ? !alumno.NombreRuta
          : alumno.NombreRuta === filtroRuta);

      return coincideTexto && coincideRuta;
    });
  }, [alumnos, busqueda, filtroRuta]);

  const totalRegistros = alumnosFiltrados.length;

  const totalPaginas =
    registrosPorPagina === 'Todos'
      ? 1
      : Math.ceil(totalRegistros / registrosPorPagina);

  const indiceUltimo =
    registrosPorPagina === 'Todos'
      ? totalRegistros
      : paginaActual * registrosPorPagina;

  const indicePrimer =
    registrosPorPagina === 'Todos'
      ? 0
      : indiceUltimo - registrosPorPagina;

  const alumnosPaginados = alumnosFiltrados.slice(indicePrimer, indiceUltimo);

  const totalSinUbicacion = useMemo(() => {
    return alumnos.filter((alumno) => !tieneUbicacionCompleta(alumno)).length;
  }, [alumnos]);

  useEffect(() => {
    if (paginaActual > totalPaginas && totalPaginas > 0) {
      setPaginaActual(totalPaginas);
    }
  }, [paginaActual, totalPaginas]);

  const handleEditar = (alumno) => {
    setAlumnoAEditar({
      ...alumno,
      UsuarioID: alumno.UsuarioID || '',
      RutaID: alumno.RutaID || '',
      CasaLatitud: alumno.CasaLatitud ?? '',
      CasaLongitud: alumno.CasaLongitud ?? '',
      ColegioLatitud: alumno.ColegioLatitud ?? '',
      ColegioLongitud: alumno.ColegioLongitud ?? ''
    });

    setModalAbierto(true);
  };

  const handleGuardar = async (datos) => {
    try {
      if (alumnoAEditar) {
        await editarAlumno(alumnoAEditar.AlumnoID, datos);
        mostrarToast('Alumno actualizado correctamente', 'success');
      } else {
        await crearAlumno(datos);
        mostrarToast('Alumno registrado correctamente', 'success');
      }

      setModalAbierto(false);
      setAlumnoAEditar(null);
      await cargarDatos();
    } catch (error) {
      mostrarToast(
        error.response?.data?.mensaje || 'Error al guardar alumno',
        'error'
      );
    }
  };

  const handleToggleEstado = async (id, estado) => {
    try {
      await toggleEstadoAlumno(id, estado);

      mostrarToast(
        `Alumno ${estado ? 'activado' : 'desactivado'}`,
        'success'
      );

      await cargarDatos();
    } catch (error) {
      mostrarToast(
        error.response?.data?.mensaje || 'Error al actualizar estado',
        'error'
      );
    }
  };

  const confirmarEliminar = async () => {
    if (!alumnoAEliminar) return;

    try {
      await eliminarAlumnoFisico(alumnoAEliminar.AlumnoID);

      mostrarToast('Alumno eliminado correctamente', 'success');
      setAlumnoAEliminar(null);

      await cargarDatos();
    } catch (error) {
      mostrarToast(
        error.response?.data?.mensaje || 'Error al eliminar alumno',
        'error'
      );
    }
  };

  const handleSelect = (id) => {
    setSeleccionados((prev) =>
      prev.includes(id)
        ? prev.filter((item) => item !== id)
        : [...prev, id]
    );
  };

  const handleSelectAll = (checked) => {
    setSeleccionados(
      checked
        ? alumnosPaginados.map((alumno) => alumno.AlumnoID)
        : []
    );
  };

  const handleAccionMasiva = async (accion, estado = null) => {
    if (seleccionados.length === 0) return;

    const confirmado = window.confirm(
      `¿Estás seguro de aplicar esta acción a ${seleccionados.length} alumno(s)?`
    );

    if (!confirmado) return;

    try {
      const promesas = seleccionados.map((id) => {
        if (accion === 'eliminar') return eliminarAlumnoFisico(id);
        if (accion === 'estado') return toggleEstadoAlumno(id, estado);
        return Promise.resolve();
      });

      await Promise.all(promesas);

      mostrarToast('Acción masiva aplicada correctamente', 'success');
      await cargarDatos();
    } catch (error) {
      mostrarToast(
        error.response?.data?.mensaje || 'Error en la acción masiva',
        'error'
      );
    }
  };

  const exportarCSV = () => {
    if (alumnosFiltrados.length === 0) {
      mostrarToast('No hay datos para exportar', 'warning');
      return;
    }

    const encabezado = [
      'Alumno',
      'Grado',
      'Seccion',
      'Direccion',
      'Referencia',
      'Responsable',
      'Ruta',
      'TipoServicio',
      'CasaLatitud',
      'CasaLongitud',
      'ColegioLatitud',
      'ColegioLongitud',
      'UbicacionCompleta',
      'Estado'
    ];

    const filas = alumnosFiltrados.map((alumno) => [
      obtenerValorTexto(alumno.NombreCompleto),
      obtenerValorTexto(alumno.Grado),
      obtenerValorTexto(alumno.Seccion),
      obtenerValorTexto(alumno.Direccion),
      obtenerValorTexto(alumno.PuntoReferencia),
      obtenerValorTexto(alumno.NombrePadre),
      obtenerValorTexto(alumno.NombreRuta || 'Sin Ruta'),
      obtenerValorTexto(alumno.TipoServicio),
      obtenerValorTexto(alumno.CasaLatitud),
      obtenerValorTexto(alumno.CasaLongitud),
      obtenerValorTexto(alumno.ColegioLatitud),
      obtenerValorTexto(alumno.ColegioLongitud),
      tieneUbicacionCompleta(alumno) ? 'Sí' : 'No',
      alumno.Estado ? 'Activo' : 'Inactivo'
    ]);

    const csv = [encabezado, ...filas]
      .map((row) =>
        row
          .map((value) => `"${String(value).replace(/"/g, '""')}"`)
          .join(',')
      )
      .join('\n');

    const blob = new Blob(['\ufeff', csv], {
      type: 'text/csv;charset=utf-8;'
    });

    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', 'Reporte_Alumnos.csv');

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const abrirNuevoAlumno = () => {
    setAlumnoAEditar(null);
    setModalAbierto(true);
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    setAlumnoAEditar(null);
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="page-header">
        <div>
          <h1>Alumnos</h1>

          {totalSinUbicacion > 0 && (
            <p
              style={{
                color: '#d97706',
                fontWeight: '700',
                marginTop: '6px',
                fontSize: '13px'
              }}
            >
              {totalSinUbicacion} alumno(s) sin ubicación completa para mapas y rutas optimizadas.
            </p>
          )}
        </div>

        <div className="header-actions">
          <div className="search-box">
            <Search size={18} color="var(--text-muted)" />

            <input
              type="text"
              placeholder="Buscar alumno, padre o dirección..."
              className="search-input"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>

          <div className="filter-box">
            <Filter size={18} color="var(--text-muted)" />

            <select
              className="filter-select"
              value={filtroRuta}
              onChange={(e) => setFiltroRuta(e.target.value)}
            >
              <option value="">Todas las rutas</option>
              <option value="Sin Ruta">-- Sin Ruta Asignada --</option>

              {rutasDisponibles.map((ruta) => (
                <option key={ruta} value={ruta}>
                  {ruta}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={exportarCSV}
            className="btn-secondary"
          >
            <Download size={20} color="var(--primary)" />
            Exportar
          </button>

          <button
            type="button"
            onClick={abrirNuevoAlumno}
            className="btn-primary"
          >
            <Plus size={20} />
            Registrar Alumno
          </button>
        </div>
      </div>

      {seleccionados.length > 0 && (
        <div className="bulk-bar">
          <span
            style={{
              fontWeight: '800',
              color: '#0369a1',
              fontSize: '15px'
            }}
          >
            {seleccionados.length} alumno(s) seleccionado(s)
          </span>

          <div className="bulk-bar-actions">
            <button
              type="button"
              onClick={() => handleAccionMasiva('estado', true)}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: 'none',
                background: '#d1fae5',
                color: '#059669',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Power size={16} />
              Activar
            </button>

            <button
              type="button"
              onClick={() => handleAccionMasiva('estado', false)}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: 'none',
                background: '#fef08a',
                color: '#854d0e',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Power size={16} />
              Desactivar
            </button>

            <button
              type="button"
              onClick={() => handleAccionMasiva('eliminar')}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: 'none',
                background: '#fee2e2',
                color: '#dc2626',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Trash2 size={16} />
              Eliminar
            </button>
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
          onRegistrosChange={(valor) => {
            setRegistrosPorPagina(valor);
            setPaginaActual(1);
          }}
          totalRegistros={totalRegistros}
        />
      </div>

      {modalAbierto && (
        <AlumnosModal
          alumnoAEditar={alumnoAEditar}
          onClose={cerrarModal}
          onSave={handleGuardar}
        />
      )}

      {alumnoAEliminar && (
        <ConfirmarEliminarModal
          mensaje={`¿Eliminar al alumno ${alumnoAEliminar.NombreCompleto}?`}
          onClose={() => setAlumnoAEliminar(null)}
          onConfirm={confirmarEliminar}
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

export default Alumnos;
