import { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';
import api from '../../api/axios';

const APP_VERSION = '2.0.0';
const APP_YEAR    = new Date().getFullYear();

// SVG del bus — reutilizado en ambos paneles
const BusIcon = ({ size = 64, color = 'white' }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
    <rect x="6"  y="18" width="52" height="30" rx="6" fill={color} fillOpacity="0.9"/>
    <rect x="10" y="22" width="18" height="12" rx="3" fill="#2563eb"/>
    <rect x="32" y="22" width="18" height="12" rx="3" fill="#2563eb"/>
    <circle cx="16" cy="52" r="5" fill={color} fillOpacity="0.9"/>
    <circle cx="48" cy="52" r="5" fill={color} fillOpacity="0.9"/>
    <rect x="6"  y="34" width="52" height="4" fill={color} fillOpacity="0.25"/>
    <rect x="56" y="24" width="4"  height="8" rx="2" fill={color} fillOpacity="0.7"/>
  </svg>
);

const Login = () => {
  const [correo,   setCorreo]   = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [cargando, setCargando] = useState(false);
  const { login }  = useContext(AuthContext);
  const navigate   = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setCargando(true);
    try {
      const res = await api.post('/auth/login', { correo, password });
      if (res.data.ok) {
        login(res.data.data.token, res.data.data.usuario);
        const rol = res.data.data.usuario.rol;
        if (rol === 1)      navigate('/dashboard');
        else if (rol === 2) navigate('/conductor');
        else if (rol === 3) navigate('/padre');
        else if (rol === 4) navigate('/estudiante');
        else                navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.mensaje || 'Error al iniciar sesión');
      setPassword('');
      setTimeout(() => setError(''), 4000);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="login-container">

      {/* ══ Panel izquierdo — solo desktop ══════════════════ */}
      <div className="login-panel-left">
        {/* Logo */}
        <div style={{
          background: 'rgba(255,255,255,0.15)', borderRadius: '24px',
          padding: '20px', marginBottom: '24px',
          backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.2)'
        }}>
          <BusIcon size={64} color="white" />
        </div>

        <h1 style={{
          fontSize: 'clamp(2rem, 4vw, 3rem)',
          fontWeight: '900', margin: '0 0 10px', letterSpacing: '-1px'
        }}>
          SchoolWaySV
        </h1>

        <p style={{
          opacity: 0.85, fontSize: 'clamp(0.85rem, 1.5vw, 1rem)',
          textAlign: 'center', maxWidth: '300px', lineHeight: '1.6', margin: '0 0 40px'
        }}>
          Sistema de administración de transporte escolar seguro.
        </p>

        {/* Firma desktop */}
        <p style={{
          position: 'absolute', bottom: '20px',
          fontSize: '11px', opacity: 0.45, fontWeight: '500', margin: 0
        }}>
          SchoolWaySV v{APP_VERSION} · © {APP_YEAR} · El Salvador
        </p>
      </div>

      {/* ══ Panel derecho — formulario ══════════════════════ */}
      <div className="login-panel-right">
        <div style={{ width: '100%', maxWidth: '380px' }}>

          {/*
            Logo + nombre — solo visible en móvil.
            En desktop el panel izquierdo ya muestra el branding.
            La clase .login-logo-movil se define en App.css
          */}
          {window.innerWidth <= 768 && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '28px'
            }}>
              <div style={{
                background: 'var(--primary)', borderRadius: '12px', padding: '8px',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
              }}>
                <BusIcon size={28} color="white" />
              </div>
              <div>
                <p style={{ fontSize: '1.2rem', fontWeight: '900', color: '#0f172a', margin: 0 }}>
                  SchoolWaySV
                </p>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0, fontWeight: '500' }}>
                  v{APP_VERSION} · Transporte Escolar
                </p>
              </div>
            </div>
          )}

          <h2 style={{ fontSize: 'clamp(1.4rem, 4vw, 1.8rem)', fontWeight: '800', color: '#0f172a', marginBottom: '4px' }}>
            Bienvenido
          </h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '28px', fontSize: '14px' }}>
            Ingresa tus credenciales para acceder al sistema
          </p>

          <form onSubmit={handleSubmit} autoComplete="on">
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#374151', marginBottom: '6px' }}>
              Correo electrónico
            </label>
            <input
              type="email"
              placeholder="correo@schoolwaysv.com"
              className="form-input"
              value={correo}
              required
              autoComplete="email"
              inputMode="email"
              onChange={e => { setCorreo(e.target.value); if (error) setError(''); }}
            />

            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#374151', marginBottom: '6px', marginTop: '4px' }}>
              Contraseña
            </label>
            <input
              type="password"
              placeholder="••••••••"
              className="form-input"
              value={password}
              required
              autoComplete="current-password"
              onChange={e => { setPassword(e.target.value); if (error) setError(''); }}
            />

            <div style={{ textAlign: 'right', marginBottom: '20px', marginTop: '-6px' }}>
              <Link to="/olvide-password" style={{
                fontSize: '13px', color: 'var(--primary)', textDecoration: 'none', fontWeight: '600'
              }}>
                ¿Olvidaste tu contraseña?
              </Link>
            </div>

            <button type="submit" disabled={cargando} style={{
              width: '100%', padding: '14px',
              background: cargando ? '#93c5fd' : 'var(--primary)',
              color: 'white', border: 'none', borderRadius: '12px',
              fontSize: '15px', fontWeight: '800',
              cursor: cargando ? 'not-allowed' : 'pointer',
              transition: 'background 0.2s',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
            }}>
              {cargando ? 'Verificando...' : 'Iniciar Sesión'}
            </button>
          </form>

          {/* Error */}
          <div style={{
            minHeight: '44px', marginTop: '14px',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            background: error ? '#fef2f2' : 'transparent',
            border: error ? '1px solid #fecaca' : '1px solid transparent',
            borderRadius: '10px', padding: error ? '10px 16px' : '0',
            transition: 'all 0.3s ease'
          }}>
            {error && (
              <>
                <AlertCircle size={16} color="#dc2626" style={{ flexShrink: 0 }} />
                <span style={{ color: '#dc2626', fontSize: '13px', fontWeight: '600' }}>{error}</span>
              </>
            )}
          </div>

          {/* Firma — solo visible en móvil */}
          <p className="login-firma-movil" style={{
            textAlign: 'center', marginTop: '28px',
            fontSize: '11px', color: '#cbd5e1', fontWeight: '500', lineHeight: '1.6'
          }}>
            SchoolWaySV v{APP_VERSION} · © {APP_YEAR} · El Salvador
            <br />
            <span style={{ fontSize: '10px' }}>Sistema de Administración de Transporte Escolar</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;