import React, { useEffect, useMemo, useState } from 'react';
import { Download, Filter, Plus, RefreshCw, Search, Wrench } from 'lucide-react';
import Toast from '../../components/Toast';
import ConfirmarEliminarModal from '../../components/ConfirmarEliminarModal';
import MantenimientosTabla from './MantenimientosTabla';
import MantenimientoModal from './MantenimientoModal';
import Pagination from '../../components/Pagination';
import {
  cambiarEstadoMantenimiento,
  crearMantenimiento,
  editarMantenimiento,
  eliminarMantenimiento,
  getMantenimientos,
  getVehiculosDisponibles
} from './mantenimientos.api';

const ESTADOS = ['', 'Programado', 'En Proceso', 'Completado', 'Cancelado'];
const TIPOS = ['', 'Preventivo', 'Correctivo', 'Revisión', 'Cambio de aceite', 'Frenos', 'Llantas', 'Motor', 'Eléctrico', 'Inspección', 'Otro'];
const PRIORIDADES = ['', 'Baja', 'Media', 'Alta', 'Crítica'];

const textoSeguro = (valor) => {
  if (valor === undefined || valor === null) return '';
  return String(valor);
};

const Mantenimientos = () => {
  const [mantenimientos, setMantenimientos] = useState([]);
  const [vehiculos, setVehiculos] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroPrioridad, setFiltroPrioridad] = useState('');
  const [filtroVehiculo, setFiltroVehiculo] = useState('');
  const [modalAbierto, setModalAbierto] = useState(false);
  const [mantenimientoAEditar, setMantenimientoAEditar] = useState(null);
  const [mantenimientoAEliminar, setMantenimientoAEliminar] = useState(null);
  const [toast, setToast] = useState({ mensaje: '', tipo: '' });
  const [cargando, setCargando] = useState(false);
  const [paginaActual, setPaginaActual] = useState(1);
  const [registrosPorPagina, setRegistrosPorPagina] = useState(10);

  const mostrarToast = (mensaje, tipo) => setToast({ mensaje, tipo });

  const cargarDatos = async () => {
    setCargando(true);

    try {
      const filtros = {};
      if (filtroEstado) filtros.estado = filtroEstado;
      if (filtroTipo) filtros.tipo = filtroTipo;
      if (filtroPrioridad) filtros.prioridad = filtroPrioridad;
      if (filtroVehiculo) filtros.vehiculoId = filtroVehiculo;

      const [resMantenimientos, resVehiculos] = await Promise.all([
        getMantenimientos(filtros),
        getVehiculosDisponibles()
      ]);

      setMantenimientos(resMantenimientos.data.data || []);
      setVehiculos(resVehiculos.data.data || []);
    } catch (error) {
      mostrarToast(error.response?.data?.mensaje || 'Error al cargar mantenimientos', 'error');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtroEstado, filtroTipo, filtroPrioridad, filtroVehiculo]);

  useEffect(() => {
    setPaginaActual(1);
  }, [busqueda, filtroEstado, filtroTipo, filtroPrioridad, filtroVehiculo]);

  const mantenimientosFiltrados = useMemo(() => {
    const texto = busqueda.toLowerCase().trim();

    return mantenimientos.filter((mantenimiento) => {
      const contenido = [
        mantenimiento.MantenimientoID,
        mantenimiento.Placa,
        mantenimiento.Marca,
        mantenimiento.Modelo,
        mantenimiento.TipoMantenimiento,
        mantenimiento.EstadoMantenimiento,
        mantenimiento.Prioridad,
        mantenimiento.Descripcion,
        mantenimiento.Taller,
        mantenimiento.Responsable,
        mantenimiento.Observaciones,
        mantenimiento.UsuarioRegistro
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return !texto || contenido.includes(texto);
    });
  }, [mantenimientos, busqueda]);

  const totalRegistros = mantenimientosFiltrados.length;
  const totalPaginas = registrosPorPagina === 'Todos' ? 1 : Math.ceil(totalRegistros / registrosPorPagina);
  const indiceUltimo = registrosPorPagina === 'Todos' ? totalRegistros : paginaActual * registrosPorPagina;
  const indicePrimer = registrosPorPagina === 'Todos' ? 0 : indiceUltimo - registrosPorPagina;
  const mantenimientosPaginados = mantenimientosFiltrados.slice(indicePrimer, indiceUltimo);

  useEffect(() => {
    if (paginaActual > totalPaginas && totalPaginas > 0) {
      setPaginaActual(totalPaginas);
    }
  }, [paginaActual, totalPaginas]);

  const handleNuevo = () => {
    setMantenimientoAEditar(null);
    setModalAbierto(true);
  };

  const handleEditar = (mantenimiento) => {
    setMantenimientoAEditar(mantenimiento);
    setModalAbierto(true);
  };

  const handleCerrarModal = () => {
    setModalAbierto(false);
    setMantenimientoAEditar(null);
  };

  const handleGuardar = async (datos) => {
    try {
      if (mantenimientoAEditar) {
        await editarMantenimiento(mantenimientoAEditar.MantenimientoID, datos);
        mostrarToast('Mantenimiento actualizado correctamente', 'success');
      } else {
        await crearMantenimiento(datos);
        mostrarToast('Mantenimiento registrado correctamente', 'success');
      }

      handleCerrarModal();
      await cargarDatos();
    } catch (error) {
      mostrarToast(error.response?.data?.mensaje || 'Error al guardar mantenimiento', 'error');
    }
  };

  const handleCambiarEstado = async (mantenimiento, nuevoEstado) => {
    try {
      await cambiarEstadoMantenimiento(mantenimiento.MantenimientoID, nuevoEstado);
      mostrarToast(`Estado actualizado a ${nuevoEstado}`, 'success');
      await cargarDatos();
    } catch (error) {
      mostrarToast(error.response?.data?.mensaje || 'Error al cambiar estado', 'error');
    }
  };

  const confirmarEliminar = async () => {
    if (!mantenimientoAEliminar) return;

    try {
      await eliminarMantenimiento(mantenimientoAEliminar.MantenimientoID);
      mostrarToast('Mantenimiento eliminado correctamente', 'success');
      setMantenimientoAEliminar(null);
      await cargarDatos();
    } catch (error) {
      mostrarToast(error.response?.data?.mensaje || 'Error al eliminar mantenimiento', 'error');
    }
  };

  const exportarCSV = () => {
    if (!mantenimientosFiltrados.length) {
      mostrarToast('No hay datos para exportar', 'warning');
      return;
    }

    const encabezado = ['ID', 'Vehículo', 'Tipo', 'Estado', 'Prioridad', 'FechaProgramada', 'FechaInicio', 'FechaFinalizacion', 'ProximoMantenimiento', 'Kilometraje', 'Coste', 'Taller', 'Responsable'];

    const filas = mantenimientosFiltrados.map((mantenimiento) => [
      textoSeguro(mantenimiento.MantenimientoID),
      `${textoSeguro(mantenimiento.Placa)} ${textoSeguro(mantenimiento.Marca)} ${textoSeguro(mantenimiento.Modelo)}`.trim(),
      textoSeguro(mantenimiento.TipoMantenimiento),
      textoSeguro(mantenimiento.EstadoMantenimiento),
      textoSeguro(mantenimiento.Prioridad),
      textoSeguro(mantenimiento.FechaProgramada),
      textoSeguro(mantenimiento.FechaInicio),
      textoSeguro(mantenimiento.FechaFinalizacion),
      textoSeguro(mantenimiento.ProximoMantenimiento),
      mantenimiento.Kilometraje ?? '',
      mantenimiento.Costo ?? '',
      textoSeguro(mantenimiento.Taller),
      textoSeguro(mantenimiento.Responsable)
    ]);

    const csv = [encabezado, ...filas]
      .map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob(['\ufeff', csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'Reporte_Mantenimientos.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalProgramados = mantenimientos.filter((m) => m.EstadoMantenimiento === 'Programado').length;
  const totalProceso = mantenimientos.filter((m) => m.EstadoMantenimiento === 'En Proceso').length;
  const totalCriticos = mantenimientos.filter((m) => m.Prioridad === 'Crítica').length;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="page-header">
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Wrench color="var(--primary)" />
            Mantenimientos
          </h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '6px', fontWeight: '500' }}>
            Control de mantenimiento preventivo y correctivo de vehículos.
          </p>
        </div>

        <div className="header-actions">
          <button type="button" onClick={cargarDatos} className="btn-secondary" disabled={cargando}>
            <RefreshCw size={18} color="var(--primary)" />
            Actualizar
          </button>

          <button type="button" onClick={exportarCSV} className="btn-secondary">
            <Download size={18} color="var(--primary)" />
            Exportar
          </button>

          <button type="button" onClick={handleNuevo} className="btn-primary">
            <Plus size={18} />
            Nuevo mantenimiento
          </button>
        </div>
      </div>

      <div className="stats-grid">
        <div className="card">
          <p style={{ color: 'var(--text-muted)', fontWeight: '700', fontSize: '13px' }}>Programados</p>
          <h3 style={{ fontSize: '1.8rem', fontWeight: '800', color: '#2563eb' }}>{totalProgramados}</h3>
        </div>

        <div className="card">
          <p style={{ color: 'var(--text-muted)', fontWeight: '700', fontSize: '13px' }}>En proceso</p>
          <h3 style={{ fontSize: '1.8rem', fontWeight: '800', color: '#d97706' }}>{totalProceso}</h3>
        </div>

        <div className="card">
          <p style={{ color: 'var(--text-muted)', fontWeight: '700', fontSize: '13px' }}>Críticos</p>
          <h3 style={{ fontSize: '1.8rem', fontWeight: '800', color: '#dc2626' }}>{totalCriticos}</h3>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '18px', display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div className="search-box">
          <Search size={18} color="var(--text-muted)" />
          <input className="search-input" placeholder="Buscar por placa, taller, tipo, prioridad u observaciones..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
        </div>

        <div className="filter-box">
          <Filter size={18} color="var(--text-muted)" />
          <select className="filter-select" value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}>
            {ESTADOS.map((estado) => <option key={estado || 'todos'} value={estado}>{estado || 'Todos los estados'}</option>)}
          </select>
        </div>

        <div className="filter-box">
          <Filter size={18} color="var(--text-muted)" />
          <select className="filter-select" value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)}>
            {TIPOS.map((tipo) => <option key={tipo || 'todos'} value={tipo}>{tipo || 'Todos los tipos'}</option>)}
          </select>
        </div>

        <div className="filter-box">
          <Filter size={18} color="var(--text-muted)" />
          <select className="filter-select" value={filtroPrioridad} onChange={(e) => setFiltroPrioridad(e.target.value)}>
            {PRIORIDADES.map((prioridad) => <option key={prioridad || 'todos'} value={prioridad}>{prioridad || 'Todas las prioridades'}</option>)}
          </select>
        </div>

        <div className="filter-box">
          <Filter size={18} color="var(--text-muted)" />
          <select className="filter-select" value={filtroVehiculo} onChange={(e) => setFiltroVehiculo(e.target.value)}>
            <option value="">Todos los vehículos</option>
            {vehiculos.map((vehiculo) => (
              <option key={vehiculo.VehiculoID} value={vehiculo.VehiculoID}>
                {vehiculo.Placa} - {vehiculo.Marca} {vehiculo.Modelo}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="table-card" style={{ flex: 1, overflow: 'hidden' }}>
        <MantenimientosTabla
          mantenimientos={mantenimientosPaginados}
          onEdit={handleEditar}
          onDelete={setMantenimientoAEliminar}
          onCambiarEstado={handleCambiarEstado}
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

      <MantenimientoModal
        abierto={modalAbierto}
        onClose={handleCerrarModal}
        onSave={handleGuardar}
        mantenimientoAEditar={mantenimientoAEditar}
        vehiculos={vehiculos}
      />

      {mantenimientoAEliminar && (
        <ConfirmarEliminarModal
          mensaje={`¿Eliminar el mantenimiento #${mantenimientoAEliminar.MantenimientoID}?`}
          onClose={() => setMantenimientoAEliminar(null)}
          onConfirm={confirmarEliminar}
        />
      )}

      <Toast mensaje={toast.mensaje} tipo={toast.tipo} onClose={() => setToast({ mensaje: '', tipo: '' })} />
    </div>
  );
};

export default Mantenimientos;
