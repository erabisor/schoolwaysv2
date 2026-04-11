import { useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';

// URL del backend — la misma base que usa axios
const SOCKET_URL = process.env.REACT_APP_API_URL
  ? process.env.REACT_APP_API_URL.replace('/api', '')
  : 'http://localhost:5000';

let socketInstancia = null;

// Singleton — todos los componentes comparten la misma conexión
const obtenerSocket = () => {
  if (!socketInstancia) {
    socketInstancia = io(SOCKET_URL, {
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
      transports: ['websocket', 'polling']
    });
  }
  return socketInstancia;
};

/**
 * Hook para usar socket.io en cualquier componente.
 *
 * @param {Object} opciones
 * @param {string}   opciones.sala        - Sala a la que unirse al conectar
 * @param {string}   opciones.eventoUnirse - Nombre del evento para unirse a la sala
 * @param {Object}   opciones.datosUnirse  - Datos a enviar al unirse
 * @param {Object}   opciones.escuchar     - { nombreEvento: callbackFn }
 * @param {boolean}  opciones.activo       - Si false, no conecta (útil para condicionales)
 */
const useSocket = ({ sala, eventoUnirse, datosUnirse, escuchar = {}, activo = true } = {}) => {
  const socket = obtenerSocket();
  const listenersRef = useRef({});

  const emitir = useCallback((evento, datos) => {
    if (socket.connected) {
      socket.emit(evento, datos);
    }
  }, [socket]);

  useEffect(() => {
    if (!activo) return;

    // Conectar si no está conectado
    if (!socket.connected) {
      socket.connect();
    }

    // Unirse a sala al conectar (o inmediatamente si ya está conectado)
    const unirseASala = () => {
      if (eventoUnirse && datosUnirse) {
        socket.emit(eventoUnirse, datosUnirse);
      }
    };

    if (socket.connected) {
      unirseASala();
    } else {
      socket.once('connect', unirseASala);
    }

    // Registrar listeners
    Object.entries(escuchar).forEach(([evento, callback]) => {
      // Guardar referencia para limpiar después
      listenersRef.current[evento] = callback;
      socket.on(evento, callback);
    });

    return () => {
      // Limpiar listeners al desmontar
      Object.entries(listenersRef.current).forEach(([evento, callback]) => {
        socket.off(evento, callback);
      });
      listenersRef.current = {};
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activo, eventoUnirse, sala]);

  return { emitir, conectado: socket.connected };
};

export default useSocket;