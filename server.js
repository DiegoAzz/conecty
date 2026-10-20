require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const cors = require('cors');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  },
  maxHttpBufferSize: 1e7 // 10MB para buffers pequeños si se requiere
});

const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Configuración de servidores STUN / TURN
app.get('/api/config', (req, res) => {
  const iceServers = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun.cloudflare.com:3478' },
    { urls: 'stun:global.stun.twilio.com:3478' }
  ];

  if (process.env.TURN_URL) {
    iceServers.push({
      urls: process.env.TURN_URL,
      username: process.env.TURN_USERNAME || '',
      credential: process.env.TURN_CREDENTIAL || ''
    });
  }

  res.json({ iceServers });
});

// Almacén de salas en memoria
// roomId -> Map(socketId -> { id, name, isScreenSharing, isAudioMuted })
const rooms = new Map();

io.on('connection', (socket) => {
  let currentRoom = null;
  let currentUser = null;

  socket.on('join-room', ({ roomId, userName }) => {
    currentRoom = roomId;
    currentUser = {
      id: socket.id,
      name: userName || 'Participante',
      isScreenSharing: false,
      isAudioMuted: false
    };

    socket.join(roomId);

    if (!rooms.has(roomId)) {
      rooms.set(roomId, new Map());
    }

    const roomUsers = rooms.get(roomId);

    // Enviar al nuevo usuario la lista de participantes actuales
    const existingUsers = Array.from(roomUsers.values());
    socket.emit('room-joined', {
      user: currentUser,
      existingUsers
    });

    // Guardar usuario en la sala
    roomUsers.set(socket.id, currentUser);

    // Notificar a los demás que alguien se unió
    socket.to(roomId).emit('user-connected', currentUser);
  });

  // Señalización WebRTC: Oferta SDP
  socket.on('offer', ({ targetId, offer }) => {
    io.to(targetId).emit('offer', {
      callerId: socket.id,
      callerName: currentUser ? currentUser.name : 'Usuario',
      offer
    });
  });

  // Señalización WebRTC: Respuesta SDP
  socket.on('answer', ({ targetId, answer }) => {
    io.to(targetId).emit('answer', {
      responderId: socket.id,
      answer
    });
  });

  // Señalización WebRTC: Candidatos ICE
  socket.on('ice-candidate', ({ targetId, candidate }) => {
    io.to(targetId).emit('ice-candidate', {
      senderId: socket.id,
      candidate
    });
  });

  // Estado de pantalla compartida
  socket.on('screen-share-status', ({ isSharing }) => {
    if (currentRoom && rooms.has(currentRoom)) {
      const user = rooms.get(currentRoom).get(socket.id);
      if (user) {
        user.isScreenSharing = isSharing;
        io.to(currentRoom).emit('user-screen-updated', {
          userId: socket.id,
          isSharing
        });
      }
    }
  });

  // Evento de Puntero Láser / Anotación en tiempo real (Respaldo por WebSocket)
  socket.on('laser-pointer', (data) => {
    if (currentRoom) {
      socket.to(currentRoom).emit('laser-pointer', {
        ...data,
        senderId: socket.id,
        senderName: currentUser ? currentUser.name : 'Operador'
      });
    }
  });

  // Chat en tiempo real
  socket.on('send-message', ({ text }) => {
    if (currentRoom && text && text.trim()) {
      const message = {
        id: Date.now() + '-' + Math.random().toString(36).substring(2, 7),
        senderId: socket.id,
        senderName: currentUser ? currentUser.name : 'Usuario',
        text: text.trim(),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      io.to(currentRoom).emit('new-message', message);
    }
  });

  // Desconexión
  const handleLeave = () => {
    if (currentRoom && rooms.has(currentRoom)) {
      const roomUsers = rooms.get(currentRoom);
      roomUsers.delete(socket.id);

      socket.to(currentRoom).emit('user-disconnected', {
        userId: socket.id,
        userName: currentUser ? currentUser.name : 'Usuario'
      });

      if (roomUsers.size === 0) {
        rooms.delete(currentRoom);
      }
    }
    currentRoom = null;
    currentUser = null;
  };

  socket.on('leave-room', handleLeave);
  socket.on('disconnect', handleLeave);
});

// Redirección para URLs con /room/:id hacia la SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`=========================================`);
  console.log(`🚀 Conecty Server ejecutándose en puerto ${PORT}`);
  console.log(`🌐 Acceso local: http://localhost:${PORT}`);
  console.log(`=========================================`);
});
