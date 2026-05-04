import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Home, MapPin, School } from 'lucide-react';
import { getOpcionesAlumno } from './alumnos.api';
import SelectorUbicacionMapa from './SelectorUbicacionMapa';
import SearchableSelect from './SearchableSelect';

const DEFAULT_FORM = {
  NombreCompleto: '',
  Grado: '',
  Seccion: '',
  Direccion: '',
  PuntoReferencia: '',
  UsuarioID: '',
  RutaID: '',
  TipoServicio: 'Ambos',
  CasaLatitud: '',
  CasaLongitud: '',
  ColegioLatitud: '',
  ColegioLongitud: ''
};

const COLEGIO_DEFAULT = {
  lat: 13.7012,
  lng: -89.2243
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

const tieneUbicacion = (lat, lng) => {
  return (
    lat !== '' &&
    lng !== '' &&
    Number.isFinite(Number(lat)) &&
    Number.isFinite(Number(lng))
  );
};

const UbicacionResumen = ({ tipo, lat, lng, onSeleccionar, onUsarDefault }) => {
  const configurada = tieneUbicacion(lat, lng);
  const esCasa = tipo === 'casa';

  return (
    <div
      style={{
        border: '1px solid var(--border)',
        borderRadius: '14px',
        padding: '14px',
        background: configurada ? '#f0fdf4' : '#f8fafc'
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          marginBottom: '10px'
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontWeight: '800',
            color: '#0f172a'
          }}
        >
          {esCasa ? (
            <Home size={18} color="var(--primary)" />
          ) : (
            <School size={18} color="var(--primary)" />
          )}
          {esCasa ? 'Casa del alumno' : 'Colegio'}
        </div>

        {configurada && (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              color: '#059669',
              fontSize: '12px',
              fontWeight: '800'
            }}
          >
            <CheckCircle2 size={14} />
            Configurada
          </span>
        )}
      </div>

      <div
        style={{
          color: configurada ? '#166534' : 'var(--text-muted)',
          fontSize: '13px',
          fontWeight: '600',
          marginBottom: '12px'
        }}
      >
        {configurada
          ? `Lat: ${Number(lat).toFixed(7)} · Lng: ${Number(lng).toFixed(7)}`
          : 'Ubicación pendiente de seleccionar'}
      </div>

      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={onSeleccionar}
          className="btn-secondary"
          style={{ padding: '8px 10px', fontSize: '13px' }}
        >
          <MapPin size={15} color="var(--primary)" />
          Seleccionar en mapa
        </button>

        {!esCasa && (
          <button
            type="button"
            onClick={onUsarDefault}
            className="btn-secondary"
            style={{ padding: '8px 10px', fontSize: '13px' }}
          >
            Usar ubicación del colegio
          </button>
        )}
      </div>
    </div>
  );
};

const AlumnosModal = ({ onClose, onSave, alumnoAEditar }) => {
  const [opciones, setOpciones] = useState({ padres: [], rutas: [] });
  const [cargando, setCargando] = useState(true);
  const [datos, setDatos] = useState(DEFAULT_FORM);
  const [selectorMapa, setSelectorMapa] = useState(null);

  const esEdicion = Boolean(alumnoAEditar);

  useEffect(() => {
    const cargarOpciones = async () => {
      try {
        setCargando(true);

        const res = await getOpcionesAlumno();
        const data = res.data.data || {};

        setOpciones({
          padres: data.padres || [],
          rutas: data.rutas || []
        });

        if (!alumnoAEditar && data.padres?.length > 0) {
          setDatos((prev) => ({
            ...prev,
            UsuarioID: data.padres[0].UsuarioID
          }));
        }
      } catch (error) {
        console.error('Error al cargar opciones:', error);
      } finally {
        setCargando(false);
      }
    };

    cargarOpciones();
  }, [alumnoAEditar]);

  useEffect(() => {
    if (!alumnoAEditar) {
      setDatos((prev) => ({
        ...DEFAULT_FORM,
        UsuarioID: prev.UsuarioID || ''
      }));
      return;
    }

    setDatos({
      NombreCompleto: normalizarValor(alumnoAEditar.NombreCompleto),
      Grado: normalizarValor(alumnoAEditar.Grado),
      Seccion: normalizarValor(alumnoAEditar.Seccion),
      Direccion: normalizarValor(alumnoAEditar.Direccion),
      PuntoReferencia: normalizarValor(alumnoAEditar.PuntoReferencia),
      UsuarioID: normalizarValor(alumnoAEditar.UsuarioID),
      RutaID: normalizarValor(alumnoAEditar.RutaID),
      TipoServicio: normalizarValor(alumnoAEditar.TipoServicio) || 'Ambos',
      CasaLatitud: normalizarNumero(alumnoAEditar.CasaLatitud),
      CasaLongitud: normalizarNumero(alumnoAEditar.CasaLongitud),
      ColegioLatitud: normalizarNumero(alumnoAEditar.ColegioLatitud),
      ColegioLongitud: normalizarNumero(alumnoAEditar.ColegioLongitud)
    });
  }, [alumnoAEditar]);

  const padresConActual = useMemo(() => {
    if (!alumnoAEditar?.UsuarioID) return opciones.padres;

    const existe = opciones.padres.some(
      (padre) => Number(padre.UsuarioID) === Number(alumnoAEditar.UsuarioID)
    );

    if (existe) return opciones.padres;

    return [
      {
        UsuarioID: alumnoAEditar.UsuarioID,
        NombreCompleto: `${alumnoAEditar.NombrePadre || 'Responsable actual'} (Conservar actual)`
      },
      ...opciones.padres
    ];
  }, [alumnoAEditar, opciones.padres]);

  const setCampo = (campo, valor) => {
    setDatos((prev) => ({
      ...prev,
      [campo]: valor
    }));
  };

  const abrirSelectorCasa = () => {
    setSelectorMapa({
      tipo: 'casa',
      titulo: 'Seleccionar casa del alumno',
      descripcion: 'Haz click en el mapa o arrastra el marcador hasta la ubicación de la casa.',
      posicionInicial: {
        lat: datos.CasaLatitud || COLEGIO_DEFAULT.lat,
        lng: datos.CasaLongitud || COLEGIO_DEFAULT.lng
      }
    });
  };

  const abrirSelectorColegio = () => {
    setSelectorMapa({
      tipo: 'colegio',
      titulo: 'Seleccionar ubicación del colegio',
      descripcion: 'Haz click en el mapa o arrastra el marcador hasta la ubicación del colegio.',
      posicionInicial: {
        lat: datos.ColegioLatitud || COLEGIO_DEFAULT.lat,
        lng: datos.ColegioLongitud || COLEGIO_DEFAULT.lng
      }
    });
  };

  const confirmarUbicacion = ({ lat, lng }) => {
    if (selectorMapa?.tipo === 'casa') {
      setDatos((prev) => ({
        ...prev,
        CasaLatitud: lat,
        CasaLongitud: lng
      }));
    }

    if (selectorMapa?.tipo === 'colegio') {
      setDatos((prev) => ({
        ...prev,
        ColegioLatitud: lat,
        ColegioLongitud: lng
      }));
    }

    setSelectorMapa(null);
  };

  const usarColegioDefault = () => {
    setDatos((prev) => ({
      ...prev,
      ColegioLatitud: COLEGIO_DEFAULT.lat,
      ColegioLongitud: COLEGIO_DEFAULT.lng
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    onSave({
      ...datos,
      UsuarioID: datos.UsuarioID ? Number(datos.UsuarioID) : null,
      RutaID: datos.RutaID ? Number(datos.RutaID) : null,
      CasaLatitud: datos.CasaLatitud === '' ? null : Number(datos.CasaLatitud),
      CasaLongitud: datos.CasaLongitud === '' ? null : Number(datos.CasaLongitud),
      ColegioLatitud: datos.ColegioLatitud === '' ? null : Number(datos.ColegioLatitud),
      ColegioLongitud: datos.ColegioLongitud === '' ? null : Number(datos.ColegioLongitud)
    });
  };

  return (
    <>
      <div className="modal-overlay">
        <div
          className="modal-content"
          style={{
            maxWidth: '760px',
            width: 'min(760px, 96vw)'
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
            {esEdicion ? 'Editar Alumno' : 'Registrar Alumno'}
          </h3>

          <form onSubmit={handleSubmit}>
            <div className="two-col-grid">
              <input
                className="form-input"
                type="text"
                placeholder="Nombre completo del alumno"
                value={datos.NombreCompleto}
                onChange={(event) => setCampo('NombreCompleto', event.target.value)}
                required
              />

              <input
                className="form-input"
                type="text"
                placeholder="Grado escolar (Ej: 7° Grado)"
                value={datos.Grado}
                onChange={(event) => setCampo('Grado', event.target.value)}
                required
              />

              <input
                className="form-input"
                type="text"
                placeholder="Sección (Ej: A)"
                value={datos.Seccion}
                onChange={(event) => setCampo('Seccion', event.target.value)}
              />

              <select
                className="form-input"
                value={datos.TipoServicio}
                onChange={(event) => setCampo('TipoServicio', event.target.value)}
                required
              >
                <option value="Ambos">Ambos (Ida y Vuelta)</option>
                <option value="Solo Ida">Solo Ida (Casa a Escuela)</option>
                <option value="Solo Vuelta">Solo Vuelta (Escuela a Casa)</option>
              </select>
            </div>

            <textarea
              className="form-input"
              rows={3}
              placeholder="Dirección completa"
              value={datos.Direccion}
              onChange={(event) => setCampo('Direccion', event.target.value)}
              required
            />

            <input
              className="form-input"
              type="text"
              placeholder="Punto de referencia (Ej: Portón azul)"
              value={datos.PuntoReferencia}
              onChange={(event) => setCampo('PuntoReferencia', event.target.value)}
            />

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr',
                gap: '12px',
                marginTop: '12px'
              }}
            >
              <SearchableSelect
                label="Padre / Responsable"
                value={datos.UsuarioID}
                options={padresConActual}
                placeholder={cargando ? 'Cargando responsables...' : 'Seleccione un responsable'}
                searchPlaceholder="Buscar padre por nombre..."
                getOptionValue={(padre) => padre.UsuarioID}
                getOptionLabel={(padre) => padre.NombreCompleto}
                onChange={(value) => setCampo('UsuarioID', value)}
                required
                disabled={cargando}
                allowClear={false}
                emptyText="No se encontraron responsables"
              />

              <SearchableSelect
                label="Ruta asignada"
                value={datos.RutaID}
                options={opciones.rutas}
                placeholder="Ninguna / Sin asignar"
                searchPlaceholder="Buscar ruta por nombre o turno..."
                getOptionValue={(ruta) => ruta.RutaID}
                getOptionLabel={(ruta) => `${ruta.NombreRuta} - ${ruta.Turno}`}
                onChange={(value) => setCampo('RutaID', value)}
                disabled={cargando}
                emptyText="No se encontraron rutas"
              />
            </div>

            <div style={{ marginTop: '18px', marginBottom: '10px' }}>
              <h4
                style={{
                  fontSize: '1rem',
                  fontWeight: '800',
                  color: '#0f172a',
                  marginBottom: '4px'
                }}
              >
                Ubicaciones
              </h4>

              <p
                style={{
                  color: 'var(--text-muted)',
                  fontSize: '13px',
                  marginBottom: '12px'
                }}
              >
                Selecciona las ubicaciones en el mapa. El usuario no necesita escribir coordenadas.
              </p>

              <div className="two-col-grid" style={{ alignItems: 'stretch' }}>
                <UbicacionResumen
                  tipo="casa"
                  lat={datos.CasaLatitud}
                  lng={datos.CasaLongitud}
                  onSeleccionar={abrirSelectorCasa}
                />

                <UbicacionResumen
                  tipo="colegio"
                  lat={datos.ColegioLatitud}
                  lng={datos.ColegioLongitud}
                  onSeleccionar={abrirSelectorColegio}
                  onUsarDefault={usarColegioDefault}
                />
              </div>
            </div>

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
                {esEdicion ? 'Actualizar' : 'Guardar'}
              </button>
            </div>
          </form>
        </div>
      </div>

      <SelectorUbicacionMapa
        abierto={Boolean(selectorMapa)}
        titulo={selectorMapa?.titulo}
        descripcion={selectorMapa?.descripcion}
        posicionInicial={selectorMapa?.posicionInicial}
        onConfirmar={confirmarUbicacion}
        onClose={() => setSelectorMapa(null)}
      />
    </>
  );
};

export default AlumnosModal;
