import React, { useState } from 'react';
import axios from 'axios';
import { useLocation, Link } from 'react-router-dom';

const ResetPassword = () => {
  const [nuevaPassword, setNuevaPassword] = useState('');
  const [confirmarPassword, setConfirmarPassword] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const token = queryParams.get('token');

  // Validación de complejidad (Regex)
  const validarPassword = (pass) => {
    // Mínimo 8 caracteres, 1 mayúscula, 1 minúscula, 1 número y 1 símbolo (@$!%*?&)
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return regex.test(pass);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMensaje('');

    if (nuevaPassword !== confirmarPassword) {
      return setError('Las contraseñas no coinciden.');
    }
    
    if (!validarPassword(nuevaPassword)) {
      return setError('La contraseña debe tener al menos 8 caracteres, incluir una mayúscula, una minúscula, un número y un símbolo (@$!%*?&).');
    }

    if (!token) {
      return setError('No se encontró un token válido. Por favor, solicita un nuevo enlace.');
    }

    setCargando(true);

    try {
      // Usamos la variable de entorno. Asegúrate de reiniciar el servidor tras editar el .env
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/auth/reset-password`, {
        token: token,
        nuevaPassword: nuevaPassword
      });
      
      setMensaje(response.data.mensaje);
      setNuevaPassword('');
      setConfirmarPassword('');
    } catch (err) {
      // Aquí se capturará también el error de "Últimas 3 contraseñas" enviado por el backend
      setError(err.response?.data?.mensaje || 'Error al restablecer la contraseña.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#f3f4f6' }}>
      <div style={{ 
        backgroundColor: 'white', 
        padding: '40px', 
        borderRadius: '16px', 
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', 
        width: '100%', 
        maxWidth: '420px' 
      }}>
        <h2 style={{ fontSize: '28px', fontWeight: '700', color: '#111827', marginBottom: '8px' }}>Nueva Contraseña</h2>
        <p style={{ color: '#6b7280', marginBottom: '24px', fontSize: '15px' }}>
          Crea una clave segura para tu cuenta.
        </p>
        
        {mensaje && (
          <div style={{ padding: '12px', marginBottom: '20px', borderRadius: '8px', backgroundColor: '#dcfce7', color: '#166534', border: '1px solid #bbf7d0', fontSize: '14px' }}>
            {mensaje}
          </div>
        )}

        {error && (
          <div style={{ padding: '12px', marginBottom: '20px', borderRadius: '8px', backgroundColor: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca', fontSize: '14px' }}>
            {error}
          </div>
        )}

        {!mensaje && (
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                Contraseña nueva:
              </label>
              <input
                type="password"
                value={nuevaPassword}
                onChange={(e) => setNuevaPassword(e.target.value)}
                required
                style={{ 
                  width: '100%', padding: '12px 16px', borderRadius: '10px', border: 'none', 
                  backgroundColor: '#eef2ff', fontSize: '15px', outline: 'none' 
                }}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                Confirmar contraseña:
              </label>
              <input
                type="password"
                value={confirmarPassword}
                onChange={(e) => setConfirmarPassword(e.target.value)}
                required
                style={{ 
                  width: '100%', padding: '12px 16px', borderRadius: '10px', border: 'none', 
                  backgroundColor: '#eef2ff', fontSize: '15px', outline: 'none' 
                }}
              />
            </div>
            
            <button 
              type="submit" 
              disabled={cargando}
              style={{ 
                width: '100%', padding: '14px', backgroundColor: '#2563eb', color: 'white', 
                border: 'none', borderRadius: '10px', fontWeight: '600', fontSize: '16px',
                cursor: cargando ? 'not-allowed' : 'pointer'
              }}
            >
              {cargando ? 'Actualizando...' : 'Guardar Nueva Contraseña'}
            </button>
          </form>
        )}

        <div style={{ marginTop: '24px', textAlign: 'center' }}>
          <Link to="/login" style={{ color: '#2563eb', textDecoration: 'none', fontWeight: '500', fontSize: '14px' }}>
            Regresar al inicio de sesión
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;