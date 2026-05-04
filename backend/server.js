require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');

const PORT = process.env.PORT || 5000;

// Registro del módulo de reportes.
// Se registra aquí porque `server.js` ya importa la instancia Express desde `app.js`.
// Si en tu backend tienes otro archivo donde centralizas rutas, puedes mover esta línea ahí.
app.use('/api/reportes', require('./modules/reportes/reportes.routes'));

const server = http.createServer(app);

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

module.exports.io = io;

io.on('connection', (socket) => {
  console.log(`[socket] Cliente conectado: ${socket.id}`);

  socket.on('conductor:unirse', ({ viajeId }) => {
    if (!viajeId) return;
    socket.join(`viaje-${viajeId}`);
    console.log(`[socket] Conductor unido a sala viaje-${viajeId}`);
  });

  socket.on('conductor:ubicacion', ({ viajeId, lat, lng }) => {
    if (!viajeId || lat === undefined || lng === undefined) return;

    io.to(`viaje-${viajeId}`).emit('bus:posicion', {
      viajeId,
      lat,
      lng,
      timestamp: Date.now()
    });
  });

  socket.on('cliente:seguir-viaje', ({ viajeId }) => {
    if (!viajeId) return;
    socket.join(`viaje-${viajeId}`);
    console.log(`[socket] Cliente unido a sala viaje-${viajeId}`);
  });

  socket.on('cliente:usuario', ({ usuarioId }) => {
    if (!usuarioId) return;
    socket.join(`usuario-${usuarioId}`);
    console.log(`[socket] Cliente unido a sala usuario-${usuarioId}`);
  });

  socket.on('admin:monitoreo', () => {
    socket.join('admin-monitoreo');
    console.log('[socket] Admin en sala monitoreo global');
  });

  socket.on('disconnect', () => {
    console.log(`[socket] Cliente desconectado: ${socket.id}`);
  });
});

server.listen(PORT, () => {
  console.log(`🚀 Backend + Socket.io corriendo en puerto ${PORT}`);
});
