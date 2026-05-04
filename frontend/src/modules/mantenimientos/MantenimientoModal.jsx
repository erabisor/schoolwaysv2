import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import SearchableSelect from '../../components/SearchableSelect';

const TIPOS = [
  'Preventivo',
  'Correctivo',
  'Revisión',
  'Cambio de aceite',
  'Frenos',
  'Llantas',
  'Motor',
  'Eléctrico',
  'Inspección',
  'Otro'
];

const ESTADOS = [
  'Programado',
  'En Proceso',
  'Completado',
  'Cancelado'
];

const PRIORIDADES = [
  'Baja',
  'Media',
  'Alta',
  'Crítica'
];

const DEFAULT_FORM = {
  VehiculoID: '',
  TipoMantenimiento: 'Preventivo',
  EstadoMantenimiento: 'Programado',
  Prioridad: 'Media',
  Descripcion: '',
  Taller: '',
  Responsable: '',
  FechaProgramada: '',
  FechaInicio: '',
  FechaFinalizacion: '',
  ProximoMantenimiento: '',
  Kilometraje: '',
  Costo: '',
  Observaciones: ''
};

const fechaInput = (valor) => {
  if (!valor) return '';
  return String(valor).split('T')[0];
};

const normalizarNumero = (valor) => {
  if (valor === undefined || valor === null || valor === '') return '';
  const numero = Number(valor);
  return Number.isFinite(numero) ? numero : '';
};

const MantenimientoModal = ({
  abierto,
  onClose,
  onSave,
  mantenimientoAEditar,
  vehiculos = []
}) => {
  const [datos, setDatos] = useState(DEFAULT_FORM);
  const [errorValidacion, setErrorValidacion] = useState('');

  useEffect(() => {
    if (!abierto) return;

    setErrorValidacion('');

    if (mantenimientoAEditar) {
      setDatos({
        VehiculoID: mantenimientoAEditar.VehiculoID || '',
        TipoMantenimiento: mantenimientoAEditar.TipoMantenimiento || 'Preventivo',
        EstadoMantenimiento: mantenimientoAEditar.EstadoMantenimiento || 'Programado',
        Prioridad: mantenimientoAEditar.Prioridad || 'Media',
        Descripcion: mantenimientoAEditar.Descripcion || '',
        Taller: mantenimientoAEditar.Taller || '',
        Responsable: mantenimientoAEditar.Responsable || '',
        FechaProgramada: fechaInput(mantenimientoAEditar.FechaProgramada),
        FechaInicio: fechaInput(mantenimientoAEditar.FechaInicio),
        FechaFinalizacion: fechaInput(mantenimientoAEditar.FechaFinalizacion),
        ProximoMantenimiento: fechaInput(mantenimientoAEditar.ProximoMantenimiento),
        Kilometraje: normalizarNumero(mantenimientoAEditar.Kilometraje),
        Costo: normalizarNumero(mantenimientoAEditar.Costo),
        Observaciones: mantenimientoAEditar.Observaciones || ''
      });
      return;
    }

    setDatos({
      ...DEFAULT_FORM,
      VehiculoID: vehiculos[0]?.VehiculoID || ''
    });
  }, [abierto, mantenimientoAEditar, vehiculos]);

  const vehiculosConActual = useMemo(() => {
    if (!mantenimientoAEditar?.VehiculoID) return vehiculos;

    const existe = vehiculos.some(
      (vehiculo) => Number(vehiculo.VehiculoID) === Number(mantenimientoAEditar.VehiculoID)
    );

    if (existe) return vehiculos;

    return [
      {
        VehiculoID: mantenimientoAEditar.VehiculoID,
        Placa: mantenimientoAEditar.Placa || 'Vehículo actual',
        Marca: mantenimientoAEditar.Marca || '',
        Modelo: `${mantenimientoAEditar.Modelo || ''} (Conservar actual)`
      },
      ...vehiculos
    ];
  }, [mantenimientoAEditar, vehiculos]);

  if (!abierto) return null;

  const setCampo = (campo, valor) => {
    setDatos((prev) => ({ ...prev, [campo]: valor }));
  };

  const validarFormulario = () => {
    if (!datos.VehiculoID) return 'El vehículo es obligatorio.';

    if (datos.FechaInicio && datos.FechaFinalizacion && datos.FechaFinalizacion < datos.FechaInicio) {
      return 'La fecha de finalización no puede ser menor que la fecha de inicio.';
    }

    if (datos.FechaProgramada && datos.ProximoMantenimiento && datos.ProximoMantenimiento < datos.FechaProgramada) {
      return 'El próximo mantenimiento no puede ser anterior a la fecha programada.';
    }

    if (datos.Kilometraje !== '' && Number(datos.Kilometraje) < 0) {
      return 'El kilometraje no puede ser negativo.';
    }

    if (datos.Costo !== '' && Number(datos.Costo) < 0) {
      return 'El coste no puede ser negativo.';
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
      VehiculoID: datos.VehiculoID ? Number(datos.VehiculoID) : null,
      Kilometraje: datos.Kilometraje === '' ? null : Number(datos.Kilometraje),
      Costo: datos.Costo === '' ? null : Number(datos.Costo)
    });
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '760px', width: 'min(760px, 96vw)' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '18px' }}>
          {mantenimientoAEditar ? 'Editar mantenimiento' : 'Nuevo mantenimiento'}
        </h2>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '12px' }}>
            <SearchableSelect
              label="Vehículo"
              value={datos.VehiculoID}
              options={vehiculosConActual}
              placeholder="Seleccione vehículo"
              searchPlaceholder="Buscar por placa, marca o modelo..."
              getOptionValue={(vehiculo) => vehiculo.VehiculoID}
              getOptionLabel={(vehiculo) => {
                const marcaModelo = [vehiculo.Marca, vehiculo.Modelo].filter(Boolean).join(' ');
                return `${vehiculo.Placa || 'Sin placa'}${marcaModelo ? ` - ${marcaModelo}` : ''}`;
              }}
              onChange={(value) => setCampo('VehiculoID', value)}
              required
              emptyText="No se encontraron vehículos"
            />
          </div>

          <div className="two-col-grid">
            <div>
              <label style={{ fontWeight: '700', fontSize: '13px' }}>Tipo</label>
              <select className="form-input" value={datos.TipoMantenimiento} onChange={(e) => setCampo('TipoMantenimiento', e.target.value)} required>
                {TIPOS.map((tipo) => <option key={tipo} value={tipo}>{tipo}</option>)}
              </select>
            </div>

            <div>
              <label style={{ fontWeight: '700', fontSize: '13px' }}>Estado</label>
              <select className="form-input" value={datos.EstadoMantenimiento} onChange={(e) => setCampo('EstadoMantenimiento', e.target.value)} required>
                {ESTADOS.map((estado) => <option key={estado} value={estado}>{estado}</option>)}
              </select>
            </div>

            <div>
              <label style={{ fontWeight: '700', fontSize: '13px' }}>Prioridad</label>
              <select className="form-input" value={datos.Prioridad} onChange={(e) => setCampo('Prioridad', e.target.value)} required>
                {PRIORIDADES.map((prioridad) => <option key={prioridad} value={prioridad}>{prioridad}</option>)}
              </select>
            </div>

            <div>
              <label style={{ fontWeight: '700', fontSize: '13px' }}>Fecha programada</label>
              <input className="form-input" type="date" value={datos.FechaProgramada} onChange={(e) => setCampo('FechaProgramada', e.target.value)} />
            </div>

            <div>
              <label style={{ fontWeight: '700', fontSize: '13px' }}>Fecha inicio</label>
              <input className="form-input" type="date" value={datos.FechaInicio} onChange={(e) => setCampo('FechaInicio', e.target.value)} />
            </div>

            <div>
              <label style={{ fontWeight: '700', fontSize: '13px' }}>Fecha finalización</label>
              <input className="form-input" type="date" value={datos.FechaFinalizacion} onChange={(e) => setCampo('FechaFinalizacion', e.target.value)} />
            </div>

            <div>
              <label style={{ fontWeight: '700', fontSize: '13px' }}>Próximo mantenimiento</label>
              <input className="form-input" type="date" value={datos.ProximoMantenimiento} onChange={(e) => setCampo('ProximoMantenimiento', e.target.value)} />
            </div>

            <div>
              <label style={{ fontWeight: '700', fontSize: '13px' }}>Kilometraje</label>
              <input className="form-input" type="number" min="0" value={datos.Kilometraje} onChange={(e) => setCampo('Kilometraje', e.target.value)} placeholder="25000" />
            </div>

            <div>
              <label style={{ fontWeight: '700', fontSize: '13px' }}>Coste</label>
              <input className="form-input" type="number" min="0" step="0.01" value={datos.Costo} onChange={(e) => setCampo('Costo', e.target.value)} placeholder="0.00" />
            </div>

            <div>
              <label style={{ fontWeight: '700', fontSize: '13px' }}>Taller</label>
              <input className="form-input" value={datos.Taller} onChange={(e) => setCampo('Taller', e.target.value)} placeholder="Taller Central" />
            </div>

            <div>
              <label style={{ fontWeight: '700', fontSize: '13px' }}>Responsable</label>
              <input className="form-input" value={datos.Responsable} onChange={(e) => setCampo('Responsable', e.target.value)} placeholder="Encargado de flota" />
            </div>
          </div>

          <label style={{ fontWeight: '700', fontSize: '13px' }}>Descripción</label>
          <textarea className="form-input" rows={3} value={datos.Descripcion} onChange={(e) => setCampo('Descripcion', e.target.value)} placeholder="Detalle del mantenimiento" />

          <label style={{ fontWeight: '700', fontSize: '13px' }}>Observaciones</label>
          <textarea className="form-input" rows={3} value={datos.Observaciones} onChange={(e) => setCampo('Observaciones', e.target.value)} placeholder="Notas adicionales" />

          {errorValidacion && (
            <div style={{ marginTop: '12px', padding: '12px', borderRadius: '12px', background: '#fee2e2', color: '#b91c1c', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={18} />
              {errorValidacion}
            </div>
          )}

          <div style={{ display: 'flex', gap: '12px', marginTop: '18px' }}>
            <button type="button" onClick={onClose} className="btn-secondary" style={{ flex: 1, justifyContent: 'center' }}>
              Cancelar
            </button>

            <button type="submit" className="btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
              {mantenimientoAEditar ? 'Actualizar' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MantenimientoModal;
