import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bus } from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';
import api from '../../api/axios';

const Login = () => {
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  // Manda las credenciales al backend para autenticar
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      const res = await api.post('/auth/login', { correo, password });
      if (res.data.ok) {
        login(res.data.data.token, res.data.data.usuario);
        navigate('/dashboard');
      }
    } catch (err) {
      // 1. Muestra el error que viene del backend
      setError(err.response?.data?.mensaje || 'Error al iniciar sesión');
      
      // 2. Limpia los campos del formulario (seguro, no recarga la página)
      setCorreo('');
      setPassword('');
      
      // 3. Oculta el mensaje de error después de 3 segundos
      setTimeout(() => {
        setError('');
      }, 3000);
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <div style={{ flex: 1, background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
        <Bus size={64} color="white" />
        <h1 style={{ fontSize: '3.5rem', marginTop: '20px' }}>SchoolWaySV</h1>
        <p style={{ opacity: 0.9, fontSize: '1.2rem' }}>Gestión de transporte escolar confiable.</p>
      </div>
      <div style={{ flex: 1, background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <form onSubmit={handleSubmit} style={{ width: '100%', maxWidth: '360px' }}>
          <h2 style={{ fontSize: '2rem', marginBottom: '8px', color: '#0f172a' }}>Bienvenido</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '32px' }}>Ingresa tus credenciales para continuar</p>
          
          <input 
            type="email" 
            id="correo"
            name="correo"
            placeholder="Correo electrónico" 
            className="form-input" 
            value={correo} 
            onChange={(e) => setCorreo(e.target.value)} 
            required 
          />
          
          <input 
            type="password" 
            id="password"
            name="password"
            placeholder="Contraseña" 
            className="form-input" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
          />

          {/* Enlace estético de recuperación para la Fase 4 */}
          <div style={{ textAlign: 'right', marginBottom: '16px' }}>
            <span style={{ fontSize: '14px', color: 'var(--primary)', cursor: 'pointer', fontWeight: '500' }}>
              ¿Olvidaste tu contraseña?
            </span>
          </div>
          
          <button type="submit" style={{ width: '100%', padding: '14px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '10px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}>
            Iniciar Sesión
          </button>

          {/* CONTENEDOR DE ERROR REUBICADO Y MÁS VISTOSO */}
          <div style={{ 
            height: '24px', 
            marginTop: '16px', 
            color: 'var(--danger)', 
            opacity: error ? 1 : 0, 
            transition: 'opacity 0.3s ease',
            fontSize: '16px',
            fontWeight: '700',
            textAlign: 'center'
          }}>
            {error || ' '}
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;