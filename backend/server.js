require('dotenv').config();
const http    = require('http');
const { Server } = require('socket.io');
const app     = require('./app');

const PORT = process.env.PORT || 5000;

// Crear servidor HTTP sobre Express
const server = http.createServer(app);

// Inicializar Socket.io con CORS
const io = new Server(server, {
  cors: {
    origin: [
      'https://www.schoolwaysv.online',
      'https://schoolwaysv.online',
      'http://localhost:3000'
    ],
    methods: ['GET', 'POST']
  }
});

// Exportar io para usarlo en otros módulos (repositorios, controladores)
module.exports.io = io;

// ============================================================
// Lógica de salas de Socket.io
// ============================================================
io.on('connection', (socket) => {
  console.log(`[socket] Cliente conectado: ${socket.id}`);

  // El conductor se une a la sala de su viaje al iniciar
  socket.on('conductor:unirse', ({ viajeId }) => {
    socket.join(`viaje-${viajeId}`);
    console.log(`[socket] Conductor unido a sala viaje-${viajeId}`);
  });

  // El conductor emite su ubicación GPS cada ~10 segundos
  socket.on('conductor:ubicacion', ({ viajeId, lat, lng }) => {
    // Reemite a todos los que escuchan esta sala (admin + padre)
    io.to(`viaje-${viajeId}`).emit('bus:posicion', { viajeId, lat, lng, timestamp: Date.now() });
  });

  // El padre o admin se une a la sala para ver el tracking
  socket.on('cliente:seguir-viaje', ({ viajeId }) => {
    socket.join(`viaje-${viajeId}`);
    console.log(`[socket] Cliente unido a sala viaje-${viajeId}`);
  });

  // Admin se une a sala global para ver todos los viajes activos
  socket.on('admin:monitoreo', () => {
    socket.join('admin-monitoreo');
    console.log(`[socket] Admin en sala monitoreo global`);
  });

  socket.on('disconnect', () => {
    console.log(`[socket] Cliente desconectado: ${socket.id}`);
  });
});

// Levantar servidor
server.listen(PORT, () => {
  console.log(`🚀 Backend + Socket.io corriendo en puerto ${PORT}`);
});