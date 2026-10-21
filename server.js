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
  transports: ['websocket'], // Ultra baja latencia sin HTTP polling
  perMessageDeflate: false,
  maxHttpBufferSize: 1e7
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

// Almacén de dispositivos en línea: cleanDeviceId -> { socketId, deviceId, userName }
const onlineDevices = new Map();
// socketId -> cleanDeviceId
const socketDeviceMap = new Map();

// Solicitudes de conexión pendientes:
// requestId -> { requestId, requesterSocketId, requesterName, requesterDeviceId, targetDeviceId, hostSocketId, roomId, timeoutTimer }
const pendingRequests = new Map();

function formatDeviceId(id) {
  if (!id) return '';
  const clean = id.toString().replace(/\D/g, '');
  if (clean.length === 9) {
    return clean.replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3');
  }
  return id;
}

io.on('connection', (socket) => {
  let currentRoom = null;
  let currentUser = null;
  socket.authorizedRooms = new Set();

  // Registro del dispositivo en línea al abrir Conecty
  socket.on('register-device', ({ deviceId, userName }) => {
    if (!deviceId) return;
    const cleanId = deviceId.toString().replace(/\D/g, '');
    socket.deviceId = cleanId;
    socket.userName = (userName && userName.trim()) || ('Usuario-' + cleanId.substring(0, 4));

    onlineDevices.set(cleanId, {
      socketId: socket.id,
      deviceId: cleanId,
      userName: socket.userName
    });
    socketDeviceMap.set(socket.id, cleanId);

    // Su propio dispositivo siempre está autorizado para su propia sala
    socket.authorizedRooms.add('device-' + cleanId);

    socket.emit('device-registered', {
      deviceId: cleanId,
      userName: socket.userName,
      isOnline: true
    });
  });

  // Actualización de nombre en caliente
  socket.on('update-device-name', ({ userName }) => {
    if (userName && userName.trim()) {
      socket.userName = userName.trim();
      if (socket.deviceId && onlineDevices.has(socket.deviceId)) {
        onlineDevices.get(socket.deviceId).userName = socket.userName;
      }
    }
  });

  // ================= SISTEMA DE AUTORIZACIÓN DE CONEXIONES =================
  // Un usuario solicita conectarse al equipo de otro usuario
  socket.on('request-connection', ({ targetDeviceId, requesterName }) => {
    const cleanTarget = (targetDeviceId || '').toString().replace(/\D/g, '');
    const rName = (requesterName && requesterName.trim()) || socket.userName || 'Usuario';
    const myCleanDevice = socket.deviceId || '';

    if (!cleanTarget || cleanTarget.length !== 9) {
      return socket.emit('connection-response', {
        status: 'error',
        message: 'Por favor introduce un número de 9 dígitos válido.'
      });
    }

    if (myCleanDevice && myCleanDevice === cleanTarget) {
      return socket.emit('connection-response', {
        status: 'error',
        message: 'No puedes solicitar conectarte a tu propio dispositivo.'
      });
    }

    // Verificar si el dispositivo destino está en línea
    const targetDevice = onlineDevices.get(cleanTarget);
    if (!targetDevice) {
      return socket.emit('connection-response', {
        status: 'offline',
        targetDeviceId: cleanTarget,
        message: `El equipo ${formatDeviceId(cleanTarget)} no se encuentra en línea en Conecty. Pídele al usuario que abra la página.`
      });
    }

    const hostSocket = io.sockets.sockets.get(targetDevice.socketId);
    if (!hostSocket) {
      onlineDevices.delete(cleanTarget);
      return socket.emit('connection-response', {
        status: 'offline',
        targetDeviceId: cleanTarget,
        message: `El anfitrión se desconectó.`
      });
    }

    const requestId = 'req_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const roomId = 'device-' + cleanTarget;

    // Timeout de 45 segundos para responder
    const timeoutTimer = setTimeout(() => {
      if (pendingRequests.has(requestId)) {
        pendingRequests.delete(requestId);
        socket.emit('connection-response', {
          status: 'timeout',
          message: 'Tiempo de espera agotado. El anfitrión no respondió la solicitud.'
        });
        io.to(targetDevice.socketId).emit('incoming-request-cancelled', { requestId });
      }
    }, 45000);

    pendingRequests.set(requestId, {
      requestId,
      requesterSocketId: socket.id,
      requesterName: rName,
      requesterDeviceId: myCleanDevice,
      targetDeviceId: cleanTarget,
      hostSocketId: targetDevice.socketId,
      roomId,
      timeoutTimer
    });

    // Notificar al solicitante que la petición está en espera
    socket.emit('connection-request-sent', {
      requestId,
      targetDeviceId: cleanTarget,
      hostName: targetDevice.userName || 'Anfitrión'
    });

    // Enviar solicitud al anfitrión para que autorice o rechace
    io.to(targetDevice.socketId).emit('incoming-connection-request', {
      requestId,
      requesterName: rName,
      requesterDeviceId: myCleanDevice,
      targetDeviceId: cleanTarget
    });
  });

  // Respuesta del anfitrión (Aceptar o Rechazar)
  socket.on('respond-connection-request', ({ requestId, accepted }) => {
    const req = pendingRequests.get(requestId);
    if (!req) return;

    clearTimeout(req.timeoutTimer);
    pendingRequests.delete(requestId);

    const requesterSocket = io.sockets.sockets.get(req.requesterSocketId);

    if (accepted) {
      // Registrar permiso para que el solicitante pueda unirse a la sala
      if (requesterSocket) {
        if (!requesterSocket.authorizedRooms) {
          requesterSocket.authorizedRooms = new Set();
        }
        requesterSocket.authorizedRooms.add(req.roomId);

        requesterSocket.emit('connection-response', {
          status: 'accepted',
          roomId: req.roomId,
          hostName: socket.userName || 'Anfitrión',
          targetDeviceId: req.targetDeviceId
        });
      }

      // Asegurarse de que el anfitrión también tenga permiso en la sala
      if (!socket.authorizedRooms) {
        socket.authorizedRooms = new Set();
      }
      socket.authorizedRooms.add(req.roomId);

      socket.emit('connection-approved-host', {
        requestId,
        roomId: req.roomId,
        requesterName: req.requesterName
      });
    } else {
      if (requesterSocket) {
        requesterSocket.emit('connection-response', {
          status: 'rejected',
          message: 'La solicitud de conexión fue rechazada por el anfitrión.'
        });
      }
    }
  });

  // El solicitante canceló la espera
  socket.on('cancel-connection-request', ({ requestId }) => {
    const req = pendingRequests.get(requestId);
    if (req) {
      clearTimeout(req.timeoutTimer);
      pendingRequests.delete(requestId);
      io.to(req.hostSocketId).emit('incoming-request-cancelled', { requestId });
    }
  });

  // ================= UNIÓN Y GESTIÓN DE SALA =================
  socket.on('join-room', ({ roomId, userName, deviceId }) => {
    if (!socket.authorizedRooms) {
      socket.authorizedRooms = new Set();
    }

    // Comprobación de seguridad: Si la sala pertenece a un dispositivo
    if (roomId && roomId.startsWith('device-')) {
      const ownerDeviceId = roomId.replace(/^device-/, '');
      const cleanUserDeviceId = (deviceId || socket.deviceId || '').toString().replace(/\D/g, '');
      const isOwner = cleanUserDeviceId && cleanUserDeviceId === ownerDeviceId;
      const isAuthorized = socket.authorizedRooms.has(roomId);

      if (!isOwner && !isAuthorized) {
        return socket.emit('room-join-denied', {
          roomId,
          reason: 'Esta sala requiere autorización previa del anfitrión del equipo.'
        });
      }
    }

    currentRoom = roomId;
    currentUser = {
      id: socket.id,
      name: userName || socket.userName || 'Participante',
      deviceId: deviceId || socket.deviceId || '',
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
      callerName: currentUser ? currentUser.name : (socket.userName || 'Usuario'),
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
        senderName: currentUser ? currentUser.name : (socket.userName || 'Operador')
      });
    }
  });

  // Evento de Control Remoto de Ratón y Teclado (Respaldo por WebSocket)
  socket.on('remote-control', (data) => {
    if (currentRoom) {
      socket.to(currentRoom).emit('remote-control', {
        ...data,
        senderId: socket.id,
        senderName: currentUser ? currentUser.name : (socket.userName || 'Operador')
      });
    }
  });

  // Medición de latencia (Ping / Pong)
  socket.on('ping-check', (clientTimestamp) => {
    socket.emit('pong-check', clientTimestamp);
  });

  // Chat en tiempo real
  socket.on('send-message', ({ text }) => {
    if (currentRoom && text && text.trim()) {
      const message = {
        id: Date.now() + '-' + Math.random().toString(36).substring(2, 7),
        senderId: socket.id,
        senderName: currentUser ? currentUser.name : (socket.userName || 'Usuario'),
        text: text.trim(),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      io.to(currentRoom).emit('new-message', message);
    }
  });

  // Desconexión
  const handleLeave = () => {
    // Si estaba en sala, limpiar
    if (currentRoom && rooms.has(currentRoom)) {
      const roomUsers = rooms.get(currentRoom);
      roomUsers.delete(socket.id);

      socket.to(currentRoom).emit('user-disconnected', {
        userId: socket.id,
        userName: currentUser ? currentUser.name : (socket.userName || 'Usuario')
      });

      if (roomUsers.size === 0) {
        rooms.delete(currentRoom);
      }
    }
    currentRoom = null;
    currentUser = null;

    // Desregistrar dispositivo de onlineDevices
    const cleanDeviceId = socketDeviceMap.get(socket.id);
    if (cleanDeviceId) {
      onlineDevices.delete(cleanDeviceId);
      socketDeviceMap.delete(socket.id);
    }

    // Limpiar solicitudes pendientes donde este socket era solicitante o anfitrión
    for (const [reqId, req] of pendingRequests.entries()) {
      if (req.requesterSocketId === socket.id) {
        clearTimeout(req.timeoutTimer);
        pendingRequests.delete(reqId);
        io.to(req.hostSocketId).emit('incoming-request-cancelled', { requestId: reqId });
      } else if (req.hostSocketId === socket.id) {
        clearTimeout(req.timeoutTimer);
        pendingRequests.delete(reqId);
        io.to(req.requesterSocketId).emit('connection-response', {
          status: 'offline',
          message: 'El anfitrión se desconectó antes de responder la solicitud.'
        });
      }
    }
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
