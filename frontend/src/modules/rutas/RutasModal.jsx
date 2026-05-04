import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Bus, UserRound } from 'lucide-react';
import { getOpcionesRuta } from './rutas.api';
import SearchableSelect from '../../components/SearchableSelect';

const DEFAULT_FORM = {
  NombreRuta: '',
  Descripcion: '',
  CapacidadMaxima: 20,
  ConductorID: '',
  VehiculoID: '',
  Turno: 'Mañana'
};

const normalizarValor = (valor) => {
  if (valor === undefined || valor === null) return '';
  return valor;
};

const normalizarNumero = (valor) => {
  if (valor === undefined || valor === null || valor === '') return '';

  const numero = Number(valor);
  return Number.isFinite(numero) ? numero : '';
};

const RutasModal = ({ onClose, onSave, rutaAEditar }) => {
  const [opciones, setOpciones] = useState({ conductores: [], vehiculos: [] });
  const [datos, setDatos] = useState(DEFAULT_FORM);
  const [cargando, setCargando] = useState(true);
  const [errorValidacion, setErrorValidacion] = useState('');

  const esEdicion = Boolean(rutaAEditar);

  useEffect(() => {
    const cargarOpciones = async () => {
      try {
        setCargando(true);
        const res = await getOpcionesRuta();
        const data = res.data.data || {};

        setOpciones({
          conductores: data.conductores || [],
          vehiculos: data.vehiculos || []
        });

        if (!rutaAEditar) {
          setDatos((prev) => ({
            ...prev,
            ConductorID: data.conductores?.[0]?.ConductorID || '',
            VehiculoID: data.vehiculos?.[0]?.VehiculoID || ''
          }));
        }
      } catch (error) {
        setErrorValidacion(error.response?.data?.mensaje || 'Error al cargar opciones de ruta.');
      } finally {
        setCargando(false);
      }
    };

    cargarOpciones();
  }, [rutaAEditar]);

  useEffect(() => {
    if (!rutaAEditar) {
      setDatos((prev) => ({
        ...DEFAULT_FORM,
        ConductorID: prev.ConductorID || '',
        VehiculoID: prev.VehiculoID || ''
      }));
      return;
    }

    setDatos({
      NombreRuta: normalizarValor(rutaAEditar.NombreRuta),
      Descripcion: normalizarValor(rutaAEditar.Descripcion),
      CapacidadMaxima: normalizarNumero(rutaAEditar.CapacidadMaxima) || 20,
      ConductorID: normalizarValor(rutaAEditar.ConductorID),
      VehiculoID: normalizarValor(rutaAEditar.VehiculoID),
      Turno: normalizarValor(rutaAEditar.Turno) || 'Mañana'
    });
  }, [rutaAEditar]);

  const conductoresConActual = useMemo(() => {
    if (!rutaAEditar?.ConductorID) return opciones.conductores;

    const existe = opciones.conductores.some(
      (conductor) => Number(conductor.ConductorID) === Number(rutaAEditar.ConductorID)
    );

    if (existe) return opciones.conductores;

    return [
      {
        ConductorID: rutaAEditar.ConductorID,
        NombreCompleto: `${rutaAEditar.NombreConductor || 'Conductor actual'} (Conservar actual)`
      },
      ...opciones.conductores
    ];
  }, [rutaAEditar, opciones.conductores]);

  const vehiculosConActual = useMemo(() => {
    if (!rutaAEditar?.VehiculoID) return opciones.vehiculos;

    const existe = opciones.vehiculos.some(
      (vehiculo) => Number(vehiculo.VehiculoID) === Number(rutaAEditar.VehiculoID)
    );

    if (existe) return opciones.vehiculos;

    return [
      {
        VehiculoID: rutaAEditar.VehiculoID,
        Placa: `${rutaAEditar.Placa || 'Vehículo actual'} (Conservar actual)`,
        Capacidad: rutaAEditar.CapacidadBus || rutaAEditar.CapacidadMaxima || '?'
      },
      ...opciones.vehiculos
    ];
  }, [rutaAEditar, opciones.vehiculos]);

  const vehiculoSeleccionado = useMemo(() => {
    return vehiculosConActual.find(
      (vehiculo) => String(vehiculo.VehiculoID) === String(datos.VehiculoID)
    );
  }, [vehiculosConActual, datos.VehiculoID]);

  const setCampo = (campo, valor) => {
    setDatos((prev) => ({
      ...prev,
      [campo]: valor
    }));
  };

  const validarFormulario = () => {
    if (!datos.NombreRuta.trim()) {
      return 'El nombre de la ruta es obligatorio.';
    }

    if (!datos.CapacidadMaxima || Number(datos.CapacidadMaxima) <= 0) {
      return 'La capacidad máxima debe ser mayor que cero.';
    }

    if (vehiculoSeleccionado && Number(datos.CapacidadMaxima) > Number(vehiculoSeleccionado.Capacidad)) {
      return `La ruta pide ${datos.CapacidadMaxima} cupos, pero el vehículo seleccionado solo tiene ${vehiculoSeleccionado.Capacidad} asientos.`;
    }

    return '';
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const error = validarFormulario();

    if (error) {
      setErrorValidacion(error);
      return;
    }

    setErrorValidacion('');

    onSave({
      ...datos,
      CapacidadMaxima: Number(datos.CapacidadMaxima),
      ConductorID: datos.ConductorID ? Number(datos.ConductorID) : null,
      VehiculoID: datos.VehiculoID ? Number(datos.VehiculoID) : null
    });
  };

  return (
    <div className="modal-overlay">
      <div
        className="modal-content"
        style={{
          maxWidth: '720px',
          width: 'min(720px, 96vw)'
        }}
      >
        <h3
          style={{
            fontSize: '1.45rem',
            fontWeight: '800',
            marginBottom: '18px',
            color: '#0f172a'
          }}
        >
          {esEdicion ? 'Editar Ruta' : 'Nueva Ruta'}
        </h3>

        <form onSubmit={handleSubmit}>
          <div className="two-col-grid">
            <input
              className="form-input"
              type="text"
              placeholder="Nombre de la ruta"
              value={datos.NombreRuta}
              onChange={(event) => setCampo('NombreRuta', event.target.value)}
              required
            />

            <select
              className="form-input"
              value={datos.Turno}
              onChange={(event) => setCampo('Turno', event.target.value)}
              required
            >
              <option value="Mañana">Mañana</option>
              <option value="Tarde">Tarde</option>
              <option value="Ambos">Ambos</option>
            </select>
          </div>

          <textarea
            className="form-input"
            rows={3}
            placeholder="Descripción de la ruta"
            value={datos.Descripcion}
            onChange={(event) => setCampo('Descripcion', event.target.value)}
          />

          <div className="two-col-grid">
            <input
              className="form-input"
              type="number"
              min="1"
              max="255"
              placeholder="Capacidad máxima"
              value={datos.CapacidadMaxima}
              onChange={(event) => setCampo('CapacidadMaxima', event.target.value)}
              required
            />

            <div
              style={{
                border: '1px solid var(--border)',
                borderRadius: '12px',
                padding: '12px',
                background: '#f8fafc',
                color: '#334155',
                fontSize: '13px',
                fontWeight: '700'
              }}
            >
              <Bus size={16} color="var(--primary)" />
              <span style={{ marginLeft: '6px' }}>
                Capacidad del vehículo:{' '}
                {vehiculoSeleccionado?.Capacidad || 'Seleccione vehículo'}
              </span>
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gap: '12px',
              marginTop: '12px'
            }}
          >
            <SearchableSelect
              label="Conductor asignado"
              value={datos.ConductorID}
              options={conductoresConActual}
              placeholder={cargando ? 'Cargando conductores...' : 'Seleccione un conductor'}
              searchPlaceholder="Buscar conductor por nombre..."
              getOptionValue={(conductor) => conductor.ConductorID}
              getOptionLabel={(conductor) => conductor.NombreCompleto}
              onChange={(value) => setCampo('ConductorID', value)}
              disabled={cargando}
              emptyText="No se encontraron conductores disponibles"
            />

            <SearchableSelect
              label="Vehículo asignado"
              value={datos.VehiculoID}
              options={vehiculosConActual}
              placeholder={cargando ? 'Cargando vehículos...' : 'Seleccione un vehículo'}
              searchPlaceholder="Buscar vehículo por placa, marca o modelo..."
              getOptionValue={(vehiculo) => vehiculo.VehiculoID}
              getOptionLabel={(vehiculo) => {
                const capacidad = vehiculo.Capacidad || '?';
                const marcaModelo = [vehiculo.Marca, vehiculo.Modelo].filter(Boolean).join(' ');
                return `${vehiculo.Placa}${marcaModelo ? ` · ${marcaModelo}` : ''} · Cap: ${capacidad}`;
              }}
              onChange={(value) => setCampo('VehiculoID', value)}
              disabled={cargando}
              emptyText="No se encontraron vehículos disponibles"
            />
          </div>

          {errorValidacion && (
            <div
              style={{
                marginTop: '14px',
                padding: '12px',
                borderRadius: '12px',
                background: '#fee2e2',
                color: '#b91c1c',
                fontWeight: '800',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <AlertTriangle size={18} />
              {errorValidacion}
            </div>
          )}

          <div style={{ display: 'flex', gap: '12px', marginTop: '22px' }}>
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
              style={{ flex: 1, justifyContent: 'center' }}
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="btn-primary"
              style={{ flex: 1, justifyContent: 'center' }}
            >
              <UserRound size={18} />
              {esEdicion ? 'Actualizar' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RutasModal;
