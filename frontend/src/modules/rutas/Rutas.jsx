import React, { useEffect, useMemo, useState } from 'react';
import { Download, Filter, Plus, Power, Search, Trash2 } from 'lucide-react';
import {
  crearRuta,
  editarRuta,
  eliminarRuta,
  getRutas,
  toggleEstadoRuta
} from './rutas.api';
import RutasTabla from './RutasTabla';
import RutasModal from './RutasModal';
import ConfirmarEliminarModal from '../../components/ConfirmarEliminarModal';
import Pagination from '../../components/Pagination';
import Toast from '../../components/Toast';

const textoSeguro = (valor) => {
  if (valor === undefined || valor === null) return '';
  return String(valor);
};

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

  const mostrarToast = (mensaje, tipo) => setToast({ mensaje, tipo });

  const cargarDatos = async () => {
    try {
      const res = await getRutas();
      setRutas(res.data.data || []);
      setSeleccionados([]);
    } catch (error) {
      mostrarToast(error.response?.data?.mensaje || 'Error al cargar rutas', 'error');
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  useEffect(() => {
    setPaginaActual(1);
  }, [busqueda, filtroTurno]);

  const rutasFiltradas = useMemo(() => {
    const texto = busqueda.toLowerCase();

    return rutas.filter((ruta) => {
      const contenido = [
        ruta.NombreRuta,
        ruta.Descripcion,
        ruta.NombreConductor,
        ruta.Placa,
        ruta.Turno,
        ruta.EstadoMantenimiento,
        ruta.PrioridadMantenimiento
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      const coincideTexto = contenido.includes(texto);
      const coincideTurno = filtroTurno === '' || ruta.Turno === filtroTurno;

      return coincideTexto && coincideTurno;
    });
  }, [rutas, busqueda, filtroTurno]);

  const totalRegistros = rutasFiltradas.length;
  const totalPaginas = registrosPorPagina === 'Todos' ? 1 : Math.ceil(totalRegistros / registrosPorPagina);
  const indiceUltimo = registrosPorPagina === 'Todos' ? totalRegistros : paginaActual * registrosPorPagina;
  const indicePrimer = registrosPorPagina === 'Todos' ? 0 : indiceUltimo - registrosPorPagina;
  const rutasPaginadas = rutasFiltradas.slice(indicePrimer, indiceUltimo);

  useEffect(() => {
    if (paginaActual > totalPaginas && totalPaginas > 0) {
      setPaginaActual(totalPaginas);
    }
  }, [totalPaginas, paginaActual]);

  const handleGuardar = async (datos) => {
    try {
      if (rutaAEditar) {
        await editarRuta(rutaAEditar.RutaID, datos);
        mostrarToast('Ruta actualizada correctamente', 'success');
      } else {
        await crearRuta(datos);
        mostrarToast('Ruta creada correctamente', 'success');
      }

      setModalAbierto(false);
      setRutaAEditar(null);
      await cargarDatos();
    } catch (error) {
      mostrarToast(error.response?.data?.mensaje || 'Error al guardar ruta', 'error');
    }
  };

  const handleToggleEstado = async (id, estado) => {
    try {
      await toggleEstadoRuta(id, estado);
      mostrarToast(`Ruta ${estado ? 'activada' : 'desactivada'}`, 'success');
      await cargarDatos();
    } catch (error) {
      mostrarToast(error.response?.data?.mensaje || 'Error al actualizar estado', 'error');
    }
  };

  const confirmarEliminar = async () => {
    if (!rutaAEliminar) return;

    try {
      await eliminarRuta(rutaAEliminar.RutaID);
      mostrarToast('Ruta eliminada correctamente', 'success');
      setRutaAEliminar(null);
      await cargarDatos();
    } catch (error) {
      mostrarToast(error.response?.data?.mensaje || 'Error al eliminar ruta', 'error');
    }
  };

  const handleSelect = (id) => {
    setSeleccionados((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (checked) => {
    setSeleccionados(checked ? rutasPaginadas.map((ruta) => ruta.RutaID) : []);
  };

  const handleAccionMasiva = async (accion, estado = null) => {
    if (seleccionados.length === 0) return;

    if (!window.confirm(`¿Aplicar esta acción a ${seleccionados.length} ruta(s)?`)) return;

    try {
      const promesas = seleccionados.map((id) =>
        accion === 'eliminar' ? eliminarRuta(id) : toggleEstadoRuta(id, estado)
      );

      await Promise.all(promesas);
      mostrarToast('Acción masiva completada', 'success');
      await cargarDatos();
    } catch (error) {
      mostrarToast(error.response?.data?.mensaje || 'Error en la acción masiva', 'error');
    }
  };

  const exportarCSV = () => {
    if (rutasFiltradas.length === 0) {
      mostrarToast('No hay datos para exportar', 'warning');
      return;
    }

    const encabezado = [
      'Ruta',
      'Descripcion',
      'Turno',
      'Conductor',
      'PlacaBus',
      'CapacidadMaxima',
      'CapacidadBus',
      'EstadoVehiculo',
      'Mantenimiento',
      'PrioridadMantenimiento',
      'EstadoRuta'
    ];

    const filas = rutasFiltradas.map((ruta) => [
      textoSeguro(ruta.NombreRuta),
      textoSeguro(ruta.Descripcion),
      textoSeguro(ruta.Turno),
      textoSeguro(ruta.NombreConductor || 'Sin asignar'),
      textoSeguro(ruta.Placa || 'N/A'),
      textoSeguro(ruta.CapacidadMaxima),
      textoSeguro(ruta.CapacidadBus),
      ruta.EstadoVehiculo === false || ruta.EstadoVehiculo === 0 ? 'Fuera de servicio' : 'Disponible',
      ruta.VehiculoEnMantenimiento || ruta.MantenimientoID ? textoSeguro(ruta.EstadoMantenimiento || 'En mantenimiento') : 'No',
      textoSeguro(ruta.PrioridadMantenimiento),
      ruta.Estado ? 'Activa' : 'Inactiva'
    ]);

    const csv = [encabezado, ...filas]
      .map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob(['\ufeff', csv], { type: 'text/csv;charset=utf-8;' }));
    link.setAttribute('download', 'Reporte_Rutas.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const abrirNuevaRuta = () => {
    setRutaAEditar(null);
    setModalAbierto(true);
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    setRutaAEditar(null);
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="page-header">
        <h1>Rutas</h1>

        <div className="header-actions">
          <div className="search-box">
            <Search size={18} color="var(--text-muted)" />
            <input
              type="text"
              placeholder="Buscar ruta, conductor, vehículo o mantenimiento..."
              className="search-input"
              value={busqueda}
              onChange={(event) => setBusqueda(event.target.value)}
            />
          </div>

          <div className="filter-box">
            <Filter size={18} color="var(--text-muted)" />
            <select
              className="filter-select"
              value={filtroTurno}
              onChange={(event) => setFiltroTurno(event.target.value)}
            >
              <option value="">Todos los turnos</option>
              <option value="Mañana">Mañana</option>
              <option value="Tarde">Tarde</option>
              <option value="Ambos">Ambos</option>
            </select>
          </div>

          <button type="button" onClick={exportarCSV} className="btn-secondary">
            <Download size={20} color="var(--primary)" />
            Exportar
          </button>

          <button type="button" onClick={abrirNuevaRuta} className="btn-primary">
            <Plus size={20} />
            Nueva Ruta
          </button>
        </div>
      </div>

      {seleccionados.length > 0 && (
        <div className="bulk-bar">
          <span style={{ fontWeight: '800', color: '#0369a1', fontSize: '15px' }}>
            {seleccionados.length} ruta(s) seleccionada(s)
          </span>

          <div className="bulk-bar-actions">
            <button
              type="button"
              onClick={() => handleAccionMasiva('estado', true)}
              style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: '#d1fae5', color: '#059669', fontWeight: '700', cursor: 'pointer', display: 'flex', gap: '6px' }}
            >
              <Power size={16} />
              Activar
            </button>

            <button
              type="button"
              onClick={() => handleAccionMasiva('estado', false)}
              style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: '#fef08a', color: '#854d0e', fontWeight: '700', cursor: 'pointer', display: 'flex', gap: '6px' }}
            >
              <Power size={16} />
              Desactivar
            </button>

            <button
              type="button"
              onClick={() => handleAccionMasiva('eliminar')}
              style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: '#fee2e2', color: '#dc2626', fontWeight: '700', cursor: 'pointer', display: 'flex', gap: '6px' }}
            >
              <Trash2 size={16} />
              Eliminar
            </button>
          </div>
        </div>
      )}

      <div className="table-card">
        <RutasTabla
          rutas={rutasPaginadas}
          onToggleEstado={handleToggleEstado}
          onEdit={(ruta) => {
            setRutaAEditar(ruta);
            setModalAbierto(true);
          }}
          onDelete={setRutaAEliminar}
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
        <RutasModal
          rutaAEditar={rutaAEditar}
          onClose={cerrarModal}
          onSave={handleGuardar}
        />
      )}

      {rutaAEliminar && (
        <ConfirmarEliminarModal
          mensaje={`¿Eliminar la ruta ${rutaAEliminar.NombreRuta}?`}
          onClose={() => setRutaAEliminar(null)}
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

export default Rutas;
