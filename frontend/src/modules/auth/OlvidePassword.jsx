import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Mail } from 'lucide-react';
import api from '../../api/axios';

const APP_VERSION = '2.0.0';
const APP_YEAR    = new Date().getFullYear();

// SVG del bus reutilizado del Login
const BusIcon = ({ size = 28, color = 'white' }) => (
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

const OlvidePassword = () => {
  const [correo,   setCorreo]   = useState('');
  const [mensaje,  setMensaje]  = useState({ texto: '', tipo: '' });
  const [cargando, setCargando] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCargando(true);
    setMensaje({ texto: '', tipo: '' });
    try {
      const res = await api.post('/auth/olvide-password', { correo });
      setMensaje({ texto: res.data.mensaje, tipo: 'exito' });
      setCorreo('');
    } catch (err) {
      setMensaje({
        texto: err.response?.data?.mensaje || 'Ocurrió un error al procesar la solicitud.',
        tipo: 'error'
      });
    } finally {
      setCargando(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg-light)', padding: '24px'
    }}>

      {/* Tarjeta */}
      <div style={{
        background: 'white', borderRadius: '20px',
        boxShadow: '0 10px 40px rgba(0,0,0,0.08)',
        width: '100%', maxWidth: '420px', padding: '36px'
      }}>

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '28px' }}>
          <div style={{
            background: 'var(--primary)', borderRadius: '12px', padding: '8px',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
          }}>
            <BusIcon size={28} color="white" />
          </div>
          <div>
            <p style={{ fontSize: '1.1rem', fontWeight: '900', color: '#0f172a', margin: 0 }}>
              SchoolWaySV
            </p>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0, fontWeight: '500' }}>
              v{APP_VERSION} · Transporte Escolar
            </p>
          </div>
        </div>

        {/* Ícono de sobre */}
        <div style={{
          width: '56px', height: '56px', borderRadius: '16px',
          background: '#dbeafe', display: 'flex', alignItems: 'center',
          justifyContent: 'center', marginBottom: '20px'
        }}>
          <Mail size={28} color="var(--primary)" />
        </div>

        <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#0f172a', marginBottom: '6px' }}>
          Recuperar Contraseña
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '24px', lineHeight: '1.5' }}>
          Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña.
        </p>

        {/* Mensaje de respuesta */}
        {mensaje.texto && (
          <div style={{
            padding: '12px 16px', marginBottom: '20px', borderRadius: '10px', fontSize: '14px',
            background: mensaje.tipo === 'exito' ? '#f0fdf4' : '#fef2f2',
            color:      mensaje.tipo === 'exito' ? '#166534' : '#991b1b',
            border:     `1px solid ${mensaje.tipo === 'exito' ? '#bbf7d0' : '#fecaca'}`,
            fontWeight: '500'
          }}>
            {mensaje.texto}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#374151', marginBottom: '6px' }}>
            Correo electrónico
          </label>
          <input
            type="email"
            value={correo}
            onChange={e => setCorreo(e.target.value)}
            required
            placeholder="correo@schoolwaysv.com"
            className="form-input"
            autoComplete="email"
            inputMode="email"
          />

          <button type="submit" disabled={cargando} style={{
            width: '100%', padding: '14px', marginTop: '4px',
            background: cargando ? '#93c5fd' : 'var(--primary)',
            color: 'white', border: 'none', borderRadius: '12px',
            fontWeight: '800', fontSize: '15px',
            cursor: cargando ? 'not-allowed' : 'pointer',
            transition: 'background 0.2s'
          }}>
            {cargando ? 'Enviando...' : 'Enviar Enlace'}
          </button>
        </form>

        {/* Volver */}
        <div style={{ marginTop: '20px', textAlign: 'center' }}>
          <Link to="/login" style={{
            color: 'var(--primary)', textDecoration: 'none',
            fontWeight: '600', fontSize: '13px',
            display: 'inline-flex', alignItems: 'center', gap: '6px'
          }}>
            <ArrowLeft size={14} /> Volver al inicio de sesión
          </Link>
        </div>
      </div>

      {/* Firma */}
      <p style={{
        marginTop: '24px', fontSize: '11px',
        color: '#cbd5e1', fontWeight: '500', textAlign: 'center', lineHeight: '1.6'
      }}>
        SchoolWaySV v{APP_VERSION} · © {APP_YEAR} · El Salvador
        <br />
        <span style={{ fontSize: '10px' }}>Sistema de Administración de Transporte Escolar</span>
      </p>
    </div>
  );
};

export default OlvidePassword;