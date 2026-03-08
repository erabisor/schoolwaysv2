import React, { useState } from 'react';
import api from '../../api/axios'; // Importamos tu instancia configurada de Axios
import { Link } from 'react-router-dom';

const OlvidePassword = () => {
  const [correo, setCorreo] = useState('');
  const [mensaje, setMensaje] = useState({ texto: '', tipo: '' });
  const [cargando, setCargando] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCargando(true);
    setMensaje({ texto: '', tipo: '' });

    try {
      // Nota: Usamos 'api' en lugar de 'axios' para usar tu base URL configurada
      const response = await api.post('/auth/olvide-password', { correo });
      setMensaje({ texto: response.data.mensaje, tipo: 'exito' });
      setCorreo('');
    } catch (error) {
      console.error(error);
      setMensaje({ 
        texto: error.response?.data?.mensaje || 'Ocurrió un error al procesar la solicitud.', 
        tipo: 'error' 
      });
    } finally {
      setCargando(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f3f4f6' }}>
      <div style={{ 
        backgroundColor: 'white', 
        padding: '40px', 
        borderRadius: '16px', 
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', 
        width: '100%', 
        maxWidth: '400px' 
      }}>
        <h2 style={{ fontSize: '28px', fontWeight: '700', color: '#111827', marginBottom: '8px' }}>Recuperar Contraseña</h2>
        <p style={{ color: '#6b7280', marginBottom: '24px', fontSize: '15px' }}>
          Ingresa tu correo para recibir un enlace de restablecimiento.
        </p>
        
        {mensaje.texto && (
          <div style={{ 
            padding: '12px', 
            marginBottom: '20px', 
            borderRadius: '8px', 
            fontSize: '14px',
            backgroundColor: mensaje.tipo === 'exito' ? '#dcfce7' : '#fee2e2', 
            color: mensaje.tipo === 'exito' ? '#166534' : '#991b1b',
            border: `1px solid ${mensaje.tipo === 'exito' ? '#bbf7d0' : '#fecaca'}`
          }}>
            {mensaje.texto}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
              Correo Electrónico:
            </label>
            <input
              type="email"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              required
              placeholder="admin@schoolwaysv.com"
              style={{ 
                width: '100%', 
                padding: '12px 16px', 
                borderRadius: '10px', 
                border: 'none', 
                backgroundColor: '#eef2ff', // El celeste del login
                fontSize: '15px',
                outline: 'none'
              }}
            />
          </div>
          
          <button 
            type="submit" 
            disabled={cargando}
            style={{ 
              width: '100%', 
              padding: '14px', 
              backgroundColor: '#2563eb', 
              color: 'white', 
              border: 'none', 
              borderRadius: '10px', 
              fontWeight: '600', 
              fontSize: '16px',
              cursor: cargando ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.2s'
            }}
          >
            {cargando ? 'Procesando...' : 'Enviar Enlace'}
          </button>
        </form>
        
        <div style={{ marginTop: '24px', textAlign: 'center' }}>
          <Link to="/login" style={{ color: '#2563eb', textDecoration: 'none', fontWeight: '500', fontSize: '14px' }}>
            Volver al Inicio de Sesión
          </Link>
        </div>
      </div>
    </div>
  );
};

export default OlvidePassword;