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

// Descarga del Asistente de Control Remoto de Windows (.bat autónomo sin dependencias)
app.get('/api/download-agent', (req, res) => {
  const deviceId = (req.query.deviceId || '').replace(/\D/g, '');
  const serverHost = `${req.protocol}://${req.get('host')}`;

  const batContent = `<# :
@echo off
setlocal
title Conecty - Asistente de Control Remoto de Windows
chcp 65001 > nul
cls
powershell -NoProfile -ExecutionPolicy Bypass -Command "Invoke-Expression (Get-Content -LiteralPath '%~f0' -Raw)"
if %ERRORLEVEL% NEQ 0 (
  echo.
  echo [ERROR] Hubo un problema al ejecutar el asistente.
  pause
)
exit /b %ERRORLEVEL%
#>

Param(
  [string]$ServerUrl = "${serverHost}",
  [string]$DeviceId = "${deviceId}"
)

$Host.UI.RawUI.WindowTitle = "Conecty - Asistente de Control Remoto Windows"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  🚀 CONECTY - ASISTENTE DE CONTROL REMOTO (WINDOWS)" -ForegroundColor White
Write-Host "============================================================" -ForegroundColor Cyan

# Solicitar ID de dispositivo si no está preconfigurado
while (-not $DeviceId -or $DeviceId.Trim().Length -ne 9) {
  Write-Host "Por favor ingresa tu número Conecty de 9 dígitos (ej. 486782545):" -ForegroundColor Yellow
  $DeviceId = (Read-Host "ID Conecty").Trim()
  $DeviceId = $DeviceId -replace '\D',''
}

$cleanId = $DeviceId -replace '\D',''
$roomId = "device-$cleanId"

Write-Host "  Dispositivo Conecty : $cleanId" -ForegroundColor Yellow
Write-Host "  Servidor           : $ServerUrl" -ForegroundColor Gray
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# Cargar controladores de Win32 para ratón y teclado físico
Add-Type -AssemblyName System.Windows.Forms
Add-Type @"
using System;
using System.Runtime.InteropServices;

public class Win32InputNative {
    [DllImport("user32.dll")]
    public static extern void mouse_event(int dwFlags, int dx, int dy, int dwData, int dwExtraInfo);

    [DllImport("user32.dll")]
    public static extern bool SetCursorPos(int X, int Y);
}
"@

$screen = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds

# Conectar por WebSocket nativo (.NET)
$wsUrl = $ServerUrl.Replace("http://", "ws://").Replace("https://", "wss://")
if (-not $wsUrl.EndsWith("/")) { $wsUrl += "/" }
$wsUrl += "socket.io/?EIO=4&transport=websocket"

Write-Host "[1/3] Conectando al servidor..." -ForegroundColor Gray
$ws = New-Object System.Net.WebSockets.ClientWebSocket
$cts = New-Object System.Threading.CancellationTokenSource(12000)

try {
  $ws.ConnectAsync([System.Uri]::new($wsUrl), $cts.Token).Wait()
} catch {
  Write-Host "[ERROR] No se pudo conectar al servidor de Conecty: $_" -ForegroundColor Red
  Read-Host "Presiona Enter para salir..."
  exit 1
}

function Send-WS([string]$text) {
  if ($ws.State -ne [System.Net.WebSockets.WebSocketState]::Open) { return }
  $bytes = [System.Text.Encoding]::UTF8.GetBytes($text)
  $seg = New-Object System.ArraySegment[byte] ($bytes, 0, $bytes.Length)
  $ws.SendAsync($seg, [System.Net.WebSockets.WebSocketMessageType]::Text, $true, [System.Threading.CancellationToken]::None).Wait()
}

$buf = New-Object byte[] 32768
$seg = New-Object System.ArraySegment[byte] ($buf, 0, $buf.Length)

# Handshake inicial Socket.io
$rec = $ws.ReceiveAsync($seg, [System.Threading.CancellationToken]::None)
$rec.Wait()
Send-WS "40"
$rec = $ws.ReceiveAsync($seg, [System.Threading.CancellationToken]::None)
$rec.Wait()

Write-Host "[2/3] Registrando permisos de control físico para tu equipo..." -ForegroundColor Gray
$regPayload = '42["register-device",{"deviceId":"' + $cleanId + '","userName":"Windows-Native-Agent","isAgent":true}]'
Send-WS $regPayload

$joinPayload = '42["join-room",{"roomId":"' + $roomId + '","userName":"Windows-Native-Agent","deviceId":"' + $cleanId + '","isAgent":true}]'
Send-WS $joinPayload

Write-Host "[3/3] ¡SINCRONIZADO!" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Green
Write-Host "  ✅ ASISTENTE CONECTADO Y ACTIVO" -ForegroundColor White
Write-Host "  Cualquier clic del operador sobre tu pantalla compartida" -ForegroundColor Gray
Write-Host "  se ejecutará en vivo sobre YouTube, Edge, apps y Windows." -ForegroundColor Gray
Write-Host "  (Mantén esta ventana abierta mientras dure la llamada)" -ForegroundColor Yellow
Write-Host "============================================================" -ForegroundColor Green
Write-Host ""

while ($ws.State -eq [System.Net.WebSockets.WebSocketState]::Open) {
  try {
    $rec = $ws.ReceiveAsync($seg, [System.Threading.CancellationToken]::None)
    $rec.Wait()
    if ($rec.Result.Count -le 0) { continue }
    $msg = [System.Text.Encoding]::UTF8.GetString($buf, 0, $rec.Result.Count)

    if ($msg -eq "2") {
      Send-WS "3"
      continue
    }

    if ($msg.StartsWith("42")) {
      $jsonStr = $msg.Substring(2)
      $parsed = $jsonStr | ConvertFrom-Json
      $eventName = $parsed[0]
      if ($eventName -eq "remote-control") {
        $ev = $parsed[1]
        $type = $ev.type

        if ($type -eq "move" -and $null -ne $ev.x -and $null -ne $ev.y) {
          $px = [int]($screen.Width * [double]$ev.x)
          $py = [int]($screen.Height * [double]$ev.y)
          [Win32InputNative]::SetCursorPos($px, $py)
        }
        elseif ($type -eq "click" -or $type -eq "mousedown") {
          $px = [int]($screen.Width * [double]$ev.x)
          $py = [int]($screen.Height * [double]$ev.y)
          [Win32InputNative]::SetCursorPos($px, $py)

          $btn = if ($null -ne $ev.button) { [int]$ev.button } else { 0 }
          $down = if ($btn -eq 2) { 0x0008 } else { 0x0002 }
          $up   = if ($btn -eq 2) { 0x0010 } else { 0x0004 }

          [Win32InputNative]::mouse_event($down, 0, 0, 0, 0)
          if ($type -eq "click") {
            [Win32InputNative]::mouse_event($up, 0, 0, 0, 0)
          }
          Write-Host "  🖱️ Clic en ($px, $py) Botón: $(if ($btn -eq 2) {'Derecho'} else {'Izquierdo'})" -ForegroundColor Green
        }
        elseif ($type -eq "mouseup") {
          $px = [int]($screen.Width * [double]$ev.x)
          $py = [int]($screen.Height * [double]$ev.y)
          [Win32InputNative]::SetCursorPos($px, $py)
          $btn = if ($null -ne $ev.button) { [int]$ev.button } else { 0 }
          $up  = if ($btn -eq 2) { 0x0010 } else { 0x0004 }
          [Win32InputNative]::mouse_event($up, 0, 0, 0, 0)
        }
        elseif ($type -eq "dblclick") {
          $px = [int]($screen.Width * [double]$ev.x)
          $py = [int]($screen.Height * [double]$ev.y)
          [Win32InputNative]::SetCursorPos($px, $py)
          [Win32InputNative]::mouse_event(0x0002, 0, 0, 0, 0)
          [Win32InputNative]::mouse_event(0x0004, 0, 0, 0, 0)
          Start-Sleep -Milliseconds 40
          [Win32InputNative]::mouse_event(0x0002, 0, 0, 0, 0)
          [Win32InputNative]::mouse_event(0x0004, 0, 0, 0, 0)
          Write-Host "  ⚡ Doble Clic en ($px, $py)" -ForegroundColor Green
        }
        elseif ($type -eq "wheel" -and $null -ne $ev.deltaY) {
          $amount = if ([double]$ev.deltaY -gt 0) { -120 } else { 120 }
          [Win32InputNative]::mouse_event(0x0800, 0, 0, $amount, 0)
        }
        elseif ($type -eq "keydown" -and $null -ne $ev.key) {
          $key = [string]$ev.key
          if ($key.Length -eq 1) {
            $sanitized = $key -replace '([+^%~(){}\[\]])', '{$1}'
            [System.Windows.Forms.SendKeys]::SendWait($sanitized)
          } elseif ($key -eq "Enter") {
            [System.Windows.Forms.SendKeys]::SendWait("{ENTER}")
          } elseif ($key -eq "Backspace") {
            [System.Windows.Forms.SendKeys]::SendWait("{BACKSPACE}")
          } elseif ($key -eq "Tab") {
            [System.Windows.Forms.SendKeys]::SendWait("{TAB}")
          } elseif ($key -eq "Escape") {
            [System.Windows.Forms.SendKeys]::SendWait("{ESC}")
          } elseif ($key -eq " ") {
            [System.Windows.Forms.SendKeys]::SendWait(" ")
          }
          Write-Host "  ⌨️ Tecla: $key" -ForegroundColor Cyan
        }
      }
    }
  } catch {
    if ($ws.State -eq [System.Net.WebSockets.WebSocketState]::Open) {
      Write-Host "[AVISO] " + $_.Exception.Message -ForegroundColor DarkGray
    }
  }
}

Write-Host "Asistente desconectado." -ForegroundColor Yellow
`;

  res.setHeader('Content-Type', 'application/x-bat');
  res.setHeader('Content-Disposition', `attachment; filename="Conecty-Control-${deviceId || 'Windows'}.bat"`);
  res.send(batContent);
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
  socket.on('register-device', ({ deviceId, userName, isAgent }) => {
    if (!deviceId) return;
    const cleanId = deviceId.toString().replace(/\D/g, '');
    socket.deviceId = cleanId;
    socket.isAgent = Boolean(isAgent);
    socket.userName = (userName && userName.trim()) || ('Usuario-' + cleanId.substring(0, 4));

    // Si NO es agente, o si el dispositivo aún no tiene host registrado, lo asociamos a onlineDevices
    if (!socket.isAgent || !onlineDevices.has(cleanId)) {
      onlineDevices.set(cleanId, {
        socketId: socket.id,
        deviceId: cleanId,
        userName: socket.userName,
        isAgent: socket.isAgent
      });
      socketDeviceMap.set(socket.id, cleanId);
    }

    // Su propio dispositivo siempre está autorizado para su propia sala
    socket.authorizedRooms.add('device-' + cleanId);

    socket.emit('device-registered', {
      deviceId: cleanId,
      userName: socket.userName,
      isOnline: true,
      isAgent: socket.isAgent
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
  socket.on('join-room', ({ roomId, userName, deviceId, isAgent }) => {
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
      isAgent: Boolean(isAgent || socket.isAgent),
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
        userName: currentUser ? currentUser.name : (socket.userName || 'Usuario'),
        isAgent: Boolean(currentUser ? currentUser.isAgent : socket.isAgent)
      });

      if (roomUsers.size === 0) {
        rooms.delete(currentRoom);
      }
    }
    currentRoom = null;
    currentUser = null;

    // Desregistrar dispositivo de onlineDevices solo si este socket era el host registrado
    const cleanDeviceId = socketDeviceMap.get(socket.id);
    if (cleanDeviceId) {
      const reg = onlineDevices.get(cleanDeviceId);
      if (reg && reg.socketId === socket.id) {
        onlineDevices.delete(cleanDeviceId);
      }
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
