import { MapContainer, TileLayer, Polyline, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

// Icono de parada de alumno
const iconoAlumno = new L.DivIcon({
  html: `<div style="background:#10b981;color:white;border-radius:50%;width:28px;height:28px;
    display:flex;align-items:center;justify-content:center;
    font-size:14px;box-shadow:0 2px 6px rgba(0,0,0,0.25);border:2px solid white;">👤</div>`,
  className: '',
  iconSize: [28, 28],
  iconAnchor: [14, 14]
});

/**
 * MapaRuta — usado por el módulo de Asistencias (admin) y como fallback.
 *
 * Props:
 *   polilinea: array de [lng, lat] proveniente de OpenRouteService
 *   paradas:   array de { nombre, accion, ubicacion: [lng, lat] }
 */
const MapaRuta = ({ polilinea = [], paradas = [] }) => {
  // Filtrar coordenadas válidas
  const coordsValidas = (Array.isArray(polilinea) ? polilinea : [])
    .filter(p => Array.isArray(p) && p.length === 2 && !isNaN(p[0]) && !isNaN(p[1]));

  const paradasValidas = (Array.isArray(paradas) ? paradas : [])
    .filter(p => {
      if (!p?.ubicacion || !Array.isArray(p.ubicacion) || p.ubicacion.length < 2) return false;
      const [lng, lat] = p.ubicacion;
      return typeof lat === 'number' && typeof lng === 'number' &&
             !isNaN(lat) && !isNaN(lng) &&
             lat !== 0 && lng !== 0;
    });

  // Si no hay nada válido, no renderizar el mapa
  if (coordsValidas.length === 0 && paradasValidas.length === 0) return null;

  // ORS devuelve [lng, lat] — Leaflet necesita [lat, lng]
  const coords = coordsValidas.map(([lng, lat]) => [lat, lng]);

  // Centro: primer punto de la ruta o primer punto de parada
  let centro;
  if (coords.length > 0) {
    centro = coords[Math.floor(coords.length / 2)];
  } else if (paradasValidas.length > 0) {
    const [lng, lat] = paradasValidas[0].ubicacion;
    centro = [lat, lng];
  } else {
    centro = [-13.7, -89.2]; // fallback El Salvador
  }

  return (
    <MapContainer
      center={centro}
      zoom={14}
      style={{ height: '350px', width: '100%', borderRadius: '12px' }}
      scrollWheelZoom={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {coords.length > 1 && (
        <Polyline positions={coords} color="#3b82f6" weight={4} opacity={0.85} />
      )}

      {paradasValidas.map((parada, i) => {
        const [lng, lat] = parada.ubicacion;
        return (
          <Marker key={i} position={[lat, lng]} icon={iconoAlumno}>
            <Popup>
              <strong>{parada.nombre || `Parada ${i + 1}`}</strong>
              {parada.accion && <><br />{parada.accion}</>}
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
};

export default MapaRuta;