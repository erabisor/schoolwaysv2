import React, { useEffect, useMemo, useState } from 'react';
import { Crosshair, MapPin, Navigation, X } from 'lucide-react';
import { MapContainer, Marker, Popup, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

const iconoMarcador = new L.DivIcon({
  html: '<div style="font-size:30px;line-height:30px;">📍</div>',
  className: '',
  iconSize: [34, 34],
  iconAnchor: [17, 32]
});

const CENTRO_DEFAULT = [13.7012, -89.2243];

const normalizarNumero = (valor) => {
  const numero = Number(valor);
  return Number.isFinite(numero) ? numero : null;
};

const CentrarMapa = ({ posicion }) => {
  const map = useMap();

  useEffect(() => {
    if (posicion) {
      map.setView(posicion, map.getZoom());
    }
  }, [posicion, map]);

  return null;
};

const InvalidarTamanoMapa = ({ activo }) => {
  const map = useMap();

  useEffect(() => {
    if (!activo) return;

    const timeout = setTimeout(() => {
      map.invalidateSize();
    }, 150);

    return () => clearTimeout(timeout);
  }, [activo, map]);

  return null;
};

const EventosMapa = ({ onSeleccionar }) => {
  useMapEvents({
    click: (event) => {
      onSeleccionar([event.latlng.lat, event.latlng.lng]);
    }
  });

  return null;
};

const SelectorUbicacionMapa = ({
  abierto,
  titulo,
  descripcion,
  posicionInicial,
  onConfirmar,
  onClose
}) => {
  const posicionBase = useMemo(() => {
    const lat = normalizarNumero(posicionInicial?.lat);
    const lng = normalizarNumero(posicionInicial?.lng);

    if (lat !== null && lng !== null) return [lat, lng];

    return CENTRO_DEFAULT;
  }, [posicionInicial]);

  const [posicion, setPosicion] = useState(posicionBase);
  const [mensaje, setMensaje] = useState('');

  useEffect(() => {
    if (abierto) {
      setPosicion(posicionBase);
      setMensaje('');
    }
  }, [abierto, posicionBase]);

  if (!abierto) return null;

  const usarUbicacionActual = () => {
    if (!navigator.geolocation) {
      setMensaje('El navegador no permite obtener ubicación actual.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosicion([pos.coords.latitude, pos.coords.longitude]);
        setMensaje('Ubicación actual detectada.');
      },
      () => {
        setMensaje('No se pudo obtener la ubicación actual.');
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5000
      }
    );
  };

  const confirmar = () => {
    onConfirmar({
      lat: Number(posicion[0].toFixed(7)),
      lng: Number(posicion[1].toFixed(7))
    });
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 3000 }}>
      <div
        className="modal-content"
        style={{
          width: 'min(920px, 96vw)',
          maxWidth: '920px',
          padding: 0,
          overflow: 'hidden'
        }}
      >
        <div
          style={{
            padding: '18px 22px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '14px'
          }}
        >
          <div>
            <h2
              style={{
                fontSize: '1.35rem',
                fontWeight: '800',
                color: '#0f172a',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <MapPin size={21} color="var(--primary)" />
              {titulo}
            </h2>

            <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '5px' }}>
              {descripcion || 'Haz click en el mapa o arrastra el marcador para seleccionar la ubicación.'}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              border: 'none',
              background: '#f1f5f9',
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title="Cerrar"
          >
            <X size={18} />
          </button>
        </div>

        <div
          style={{
            padding: '16px 22px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '12px',
            flexWrap: 'wrap'
          }}
        >
          <div style={{ color: '#334155', fontSize: '13px', fontWeight: '700' }}>
            Latitud: {posicion[0].toFixed(7)} · Longitud: {posicion[1].toFixed(7)}
          </div>

          <button
            type="button"
            onClick={usarUbicacionActual}
            className="btn-secondary"
            style={{ padding: '8px 12px' }}
          >
            <Navigation size={16} color="var(--primary)" />
            Usar mi ubicación actual
          </button>
        </div>

        {mensaje && (
          <div
            style={{
              margin: '0 22px 12px',
              padding: '10px 12px',
              borderRadius: '10px',
              background: '#eff6ff',
              color: '#2563eb',
              fontWeight: '700',
              fontSize: '13px'
            }}
          >
            {mensaje}
          </div>
        )}

        <div style={{ height: '430px', width: '100%' }}>
          <MapContainer
            center={posicion}
            zoom={15}
            style={{ height: '100%', width: '100%' }}
            scrollWheelZoom
          >
            <TileLayer
              attribution="&copy; OpenStreetMap contributors"
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <InvalidarTamanoMapa activo={abierto} />
            <EventosMapa onSeleccionar={setPosicion} />

            <Marker
              position={posicion}
              icon={iconoMarcador}
              draggable
              eventHandlers={{
                dragend: (event) => {
                  const marker = event.target;
                  const latLng = marker.getLatLng();
                  setPosicion([latLng.lat, latLng.lng]);
                }
              }}
            >
              <Popup>Ubicación seleccionada</Popup>
            </Marker>

            <CentrarMapa posicion={posicion} />
          </MapContainer>
        </div>

        <div
          style={{
            padding: '18px 22px',
            borderTop: '1px solid var(--border)',
            display: 'flex',
            gap: '12px'
          }}
        >
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary"
            style={{ flex: 1, justifyContent: 'center' }}
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={confirmar}
            className="btn-primary"
            style={{ flex: 1, justifyContent: 'center' }}
          >
            <Crosshair size={18} />
            Confirmar ubicación
          </button>
        </div>
      </div>
    </div>
  );
};

export default SelectorUbicacionMapa;
