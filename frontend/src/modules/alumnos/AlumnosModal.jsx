import React, { useState, useEffect } from 'react';
import { getOpcionesAlumno } from './alumnos.api';

const AlumnosModal = ({ onClose, onSave, alumnoAEditar }) => {
  const [opciones, setOpciones] = useState({ padres: [], rutas: [] });
  const [cargando, setCargando] = useState(true);
  const [datos, setDatos] = useState({
    NombreCompleto: '', 
    Grado: '', 
    Direccion: '', 
    PuntoReferencia: '', 
    UsuarioID: '', 
    RutaID: '',
    TipoServicio: 'Ambos' // <-- NUEVO: Valor por defecto
  });

  useEffect(() => {
    const cargarOpciones = async () => {
      try {
        setCargando(true);
        const res = await getOpcionesAlumno();
        const data = res.data.data;
        setOpciones(data);

        if (!alumnoAEditar && data.padres.length > 0) {
          setDatos(d => ({ ...d, UsuarioID: data.padres[0].UsuarioID }));
        }
      } catch (error) {
        console.error("Error al cargar opciones:", error);
      } finally {
        setCargando(false);
      }
    };

    cargarOpciones();

    if (alumnoAEditar) {
      setDatos({
        ...alumnoAEditar,
        UsuarioID: alumnoAEditar.UsuarioID || '', 
        RutaID: alumnoAEditar.RutaID || '',
        TipoServicio: alumnoAEditar.TipoServicio || 'Ambos' // <-- NUEVO: Carga valor existente
      });
    }
  }, [alumnoAEditar]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(datos);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '24px' }}>
          {alumnoAEditar ? 'Editar Alumno' : 'Registrar Alumno'}
        </h2>
        
        <form onSubmit={handleSubmit}>
          {/* Campos de Texto Principal */}
          <input 
            type="text" placeholder="Nombre del Alumno" required className="form-input" 
            value={datos.NombreCompleto} 
            onChange={e => setDatos({...datos, NombreCompleto: e.target.value})} 
          />
          
          <input 
            type="text" placeholder="Grado Escolar (Ej: 7° Grado)" required className="form-input" 
            value={datos.Grado} 
            onChange={e => setDatos({...datos, Grado: e.target.value})} 
          />

          <textarea 
            placeholder="Dirección completa" required className="form-input" 
            style={{ resize: 'none', height: '80px' }}
            value={datos.Direccion} 
            onChange={e => setDatos({...datos, Direccion: e.target.value})} 
          />

          <input 
            type="text" placeholder="Punto de referencia (Ej: Portón azul)" required className="form-input" 
            value={datos.PuntoReferencia} 
            onChange={e => setDatos({...datos, PuntoReferencia: e.target.value})} 
          />

          {/* Sección de Padre / Responsable */}
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)' }}>
            Padre / Responsable
          </label>
          
          {cargando ? (
            <div style={{ padding: '12px', color: 'var(--text-muted)', fontSize: '13px', fontStyle: 'italic' }}>
              Cargando responsables...
            </div>
          ) : opciones.padres.length > 0 || alumnoAEditar ? (
            <select 
              required 
              className="form-input" 
              value={datos.UsuarioID || ''} 
              onChange={(e) => {
                const nuevoId = parseInt(e.target.value);
                setDatos({ ...datos, UsuarioID: nuevoId });
              }}
            >
              <option value="" disabled>Seleccione un responsable</option>
              
              {alumnoAEditar && !opciones.padres.find(p => p.UsuarioID === datos.UsuarioID) && (
                <option value={datos.UsuarioID}>
                  {alumnoAEditar.NombrePadre} (Conservar actual)
                </option>
              )}
              
              {opciones.padres.map(p => (
                <option key={p.UsuarioID} value={p.UsuarioID}>
                  {p.NombreCompleto}
                </option>
              ))}
            </select>
          ) : (
            <p style={{ color: 'var(--danger)', fontSize: '12px', marginBottom: '16px', fontWeight: '600' }}>
              ⚠️ Debes crear al menos un usuario con rol "Padre" primero.
            </p>
          )}

          {/* Sección de Ruta */}
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', marginTop: '12px' }}>
            Ruta Asignada (Opcional)
          </label>
          <select 
            className="form-input" 
            value={datos.RutaID || ''} 
            onChange={e => setDatos({...datos, RutaID: e.target.value ? parseInt(e.target.value) : ''})}
          >
            <option value="">Ninguna / Sin asignar</option>
            {opciones.rutas.map(r => (
              <option key={r.RutaID} value={r.RutaID}>{r.NombreRuta} - {r.Turno}</option>
            ))}
          </select>

          {/* NUEVA SECCIÓN: TIPO DE SERVICIO */}
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', marginTop: '12px' }}>
            Tipo de Servicio (Contrato)
          </label>
          <select 
            className="form-input" 
            value={datos.TipoServicio || 'Ambos'} 
            onChange={e => setDatos({...datos, TipoServicio: e.target.value})}
          >
            <option value="Ambos">Ambos (Ida y Vuelta)</option>
            <option value="Solo Ida">Solo Ida (Casa a Escuela)</option>
            <option value="Solo Vuelta">Solo Vuelta (Escuela a Casa)</option>
          </select>

          {/* Botones de Acción */}
          <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
            <button 
              type="button" 
              onClick={onClose} 
              style={{ flex: 1, padding: '12px', background: '#f1f5f9', color: 'var(--text-muted)', borderRadius: '10px', border: 'none', fontWeight: '600', cursor: 'pointer' }}
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              disabled={cargando || (!alumnoAEditar && opciones.padres.length === 0)} 
              style={{ 
                flex: 1, 
                padding: '12px', 
                background: 'var(--primary)', 
                color: 'white', 
                borderRadius: '10px', 
                border: 'none', 
                fontWeight: '600', 
                cursor: 'pointer',
                opacity: (cargando || (!alumnoAEditar && opciones.padres.length === 0)) ? 0.5 : 1 
              }}
            >
              {alumnoAEditar ? 'Actualizar' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AlumnosModal;