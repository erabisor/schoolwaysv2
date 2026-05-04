import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import { io } from 'socket.io-client';
import L from 'leaflet';
import { RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { getUltimaUbicacionBus } from './padre.api';

const SOCKET_URL = process.env.REACT_APP_API_URL
  ? process.env.REACT_APP_API_URL.replace('/api', '')
  : 'http://localhost:5000';

const CENTRO_EL_SALVADOR = [13.7012, -89.2243];

const iconoBus = new L.DivIcon({
  html: '<div style="font-size:32px;line-height:32px;">🚌</div>',
  className: '',
  iconSize: [34, 34],
  iconAnchor: [17, 17]
});

const obtenerNumero = (valor) => {
  const numero = Number(valor);
  return Number.isFinite(numero) ? numero : null;
};

const extraerPosicion = (data) => {
  if (!data) return null;

  const lat = obtenerNumero(data.Latitud ?? data.latitud ?? data.lat);
  const lng = obtenerNumero(data.Longitud ?? data.longitud ?? data.lng);

  if (lat === null || lng === null) return null;

  return [lat, lng];
};

const formatearHora = (fecha) => {
  if (!fecha) return 'Sin hora';
  return new Date(fecha).toLocaleTimeString('es-SV', { hour: '2-digit', minute: '2-digit' });
};

const CentrarMapa = ({ posicion }) => {
  const map = useMap();

  useEffect(() => {
    if (posicion) map.setView(posicion, map.getZoom());
  }, [posicion, map]);

  return null;
};

const InvalidarTamanoMapa = () => {
  const map = useMap();

  useEffect(() => {
    const timeout = setTimeout(() => map.invalidateSize(), 150);
    return () => clearTimeout(timeout);
  }, [map]);

  return null;
};

const MapaSeguimientoPadre = ({ viajeId, alumno, ruta }) => {
  const [posicion, setPosicion] = useState(null);
  const [ultimaActualizacion, setUltimaActualizacion] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [conectado, setConectado] = useState(false);
  const [mensaje, setMensaje] = useState('Esperando ubicación del bus...');

  const socketRef = useRef(null);
  const cargandoRef = useRef(false);

  const aplicarUbicacion = (data) => {
    const nuevaPosicion = extraerPosicion(data);

    if (!nuevaPosicion) return false;

    setPosicion(nuevaPosicion);
    setUltimaActualizacion(data.FechaHora || data.fechaHora || data.timestamp || new Date());
    setMensaje('');
    return true;
  };

  const cargarUbicacion = async () => {
    if (!viajeId) {
      setMensaje('No hay viaje activo para seguimiento.');
      return;
    }

    if (cargandoRef.current) return;

    try {
      cargandoRef.current = true;
      setCargando(true);

      const res = await getUltimaUbicacionBus(viajeId);
      const data = res.data?.data;
      const ubicacionValida = aplicarUbicacion(data);

      if (!ubicacionValida && !posicion) {
        setMensaje('Aún no hay una ubicación válida del bus.');
      }
    } catch (error) {
      const status = error.response?.status;

      if (status === 429) {
        setMensaje('Seguimiento pausado temporalmente por demasiadas actualizaciones.');
        return;
      }

      if (status === 403) {
        setMensaje('No tienes permiso para consultar este seguimiento.');
        return;
      }

      if (status === 404) {
        setMensaje('El viaje ya finalizó o no tiene ubicación disponible.');
        return;
      }

      setMensaje(error.response?.data?.mensaje || 'No se pudo consultar la ubicación del bus.');
    } finally {
      cargandoRef.current = false;
      setCargando(false);
    }
  };

  useEffect(() => {
    if (!viajeId) return undefined;

    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1500
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setConectado(true);
      socket.emit('cliente:seguir-viaje', { viajeId });
    });

    socket.on('disconnect', () => setConectado(false));
    socket.on('connect_error', () => setConectado(false));

    socket.on('bus:posicion', (data) => {
      if (Number(data?.viajeId) !== Number(viajeId)) return;
      aplicarUbicacion({ Latitud: data.lat, Longitud: data.lng, FechaHora: data.timestamp || new Date() });
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('connect_error');
      socket.off('bus:posicion');
      socket.disconnect();
      socketRef.current = null;
    };
  }, [viajeId]);

  useEffect(() => {
    cargarUbicacion();
    const intervalo = setInterval(() => cargarUbicacion(), 30000);
    return () => clearInterval(intervalo);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viajeId]);

  if (!viajeId) return null;

  if (!posicion) {
    return (
      <div className="card" style={{ padding: '18px', border: '1px dashed var(--border)' }}>
        <div style={{ color: 'var(--text-muted)', fontWeight: '800', marginBottom: '12px' }}>
          {mensaje}
        </div>

        <button type="button" className="btn-secondary" onClick={cargarUbicacion} disabled={cargando}>
          <RefreshCw size={16} color="var(--primary)" />
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
        <div>
          <h4 style={{ fontWeight: '900', color: '#0f172a' }}>Seguimiento en vivo</h4>
          <p style={{ color: 'var(--text-muted)', fontWeight: '700', fontSize: '13px' }}>
            {alumno} · {ruta || 'Ruta no definida'}
          </p>
          <p style={{ color: conectado ? '#059669' : 'var(--text-muted)', fontWeight: '700', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
            {conectado ? <Wifi size={13} /> : <WifiOff size={13} />}
            {conectado ? 'Conectado en vivo' : 'Reconectando seguimiento'} · Última actualización: {formatearHora(ultimaActualizacion)}
          </p>
        </div>

        <button type="button" className="btn-secondary" onClick={cargarUbicacion} disabled={cargando}>
          <RefreshCw size={16} color="var(--primary)" />
          Actualizar
        </button>
      </div>

      <div style={{ height: '320px', width: '100%' }}>
        <MapContainer center={posicion || CENTRO_EL_SALVADOR} zoom={15} style={{ height: '100%', width: '100%' }} scrollWheelZoom>
          <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <InvalidarTamanoMapa />
          <Marker position={posicion} icon={iconoBus}>
            <Popup>
              Bus en ruta<br />
              {formatearHora(ultimaActualizacion)}
            </Popup>
          </Marker>
          <CentrarMapa posicion={posicion} />
        </MapContainer>
      </div>
    </div>
  );
};

export default MapaSeguimientoPadre;
