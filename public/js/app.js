/**
 * Conecty - Aplicación Principal y Control de Estado UI
 */

document.addEventListener('DOMContentLoaded', async () => {
  // Elementos DOM
  const lobbyView = document.getElementById('lobbyView');
  const roomView = document.getElementById('roomView');
  const joinForm = document.getElementById('joinForm');
  const userNameInput = document.getElementById('userNameInput');
  const roomCodeInput = document.getElementById('roomCodeInput');

  const headerRoomId = document.getElementById('headerRoomId');
  const participantsCount = document.getElementById('participantsCount');
  const participantsBar = document.getElementById('participantsBar');

  const idleScreen = document.getElementById('idleScreen');
  const videoWrapper = document.getElementById('videoWrapper');
  const screenVideo = document.getElementById('screenVideo');
  const laserCanvas = document.getElementById('laserCanvas');
  const sharerNameText = document.getElementById('sharerNameText');
  const pointerModeIndicator = document.getElementById('pointerModeIndicator');

  const btnToggleMic = document.getElementById('btnToggleMic');
  const micIcon = document.getElementById('micIcon');
  const micText = document.getElementById('micText');

  const btnToggleScreen = document.getElementById('btnToggleScreen');
  const screenText = document.getElementById('screenText');
  const btnStartShareIdle = document.getElementById('btnStartShareIdle');

  const btnToggleLaser = document.getElementById('btnToggleLaser');
  const btnClearCanvas = document.getElementById('btnClearCanvas');

  const btnToggleChat = document.getElementById('btnToggleChat');
  const btnCloseChat = document.getElementById('btnCloseChat');
  const chatSidebar = document.getElementById('chatSidebar');
  const chatForm = document.getElementById('chatForm');
  const chatInput = document.getElementById('chatInput');
  const chatMessages = document.getElementById('chatMessages');
  const chatBadge = document.getElementById('chatBadge');

  const btnCopyInvite = document.getElementById('btnCopyInvite');
  const btnQuickCopy = document.getElementById('btnQuickCopy');
  const btnLeaveRoom = document.getElementById('btnLeaveRoom');
  const remoteAudios = document.getElementById('remoteAudios');
  const toastContainer = document.getElementById('toastContainer');

  // Estado Local
  let socket = null;
  let webrtc = null;
  let laser = null;
  let myUser = null;
  let currentRoomId = null;
  let isSharingScreen = false;
  let unreadChatCount = 0;
  let isChatOpen = false;

  // Participantes: Map(id -> { name, isScreenSharing, isAudioMuted })
  const participants = new Map();

  // Sintetizador de Sonidos (Web Audio API - Sin archivos externos)
  const soundEffects = {
    ctx: null,
    init() {
      if (!this.ctx) {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      }
    },
    playTone(freq, type = 'sine', duration = 0.15) {
      try {
        this.init();
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + duration);
      } catch (e) {}
    },
    join() {
      this.playTone(523.25, 'sine', 0.12);
      setTimeout(() => this.playTone(659.25, 'sine', 0.15), 100);
    },
    leave() {
      this.playTone(440, 'sine', 0.12);
      setTimeout(() => this.playTone(349.23, 'sine', 0.18), 100);
    },
    message() {
      this.playTone(880, 'triangle', 0.08);
    }
  };

  // Toast Notification
  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    const borderCol = type === 'success' ? 'border-emerald-500/40 text-emerald-300' : 'border-indigo-500/40 text-indigo-200';
    toast.className = `px-4 py-2.5 rounded-xl glass-panel border ${borderCol} text-xs shadow-xl flex items-center space-x-2 transition-all duration-300 transform translate-y-2 opacity-0 pointer-events-auto`;
    toast.innerHTML = `<span>${message}</span>`;
    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.classList.remove('translate-y-2', 'opacity-0');
    }, 10);

    setTimeout(() => {
      toast.classList.add('opacity-0', 'translate-y-2');
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  // Prellenar código de sala si viene en la URL (?room=xxx o /room/xxx)
  const urlParams = new URLSearchParams(window.location.search);
  const roomFromQuery = urlParams.get('room') || window.location.pathname.replace(/^\/room\//, '').replace(/^\//, '');
  if (roomFromQuery && roomFromQuery !== '') {
    roomCodeInput.value = roomFromQuery;
  }

  // Obtener servidores STUN/TURN del backend
  let iceServers = [{ urls: 'stun:stun.l.google.com:19302' }];
  try {
    const configRes = await fetch('/api/config');
    const configData = await configRes.json();
    if (configData.iceServers && configData.iceServers.length > 0) {
      iceServers = configData.iceServers;
    }
  } catch (e) {
    console.warn('Usando STUN por defecto:', e);
  }

  // Formulario de Ingreso
  joinForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const userName = userNameInput.value.trim();
    let roomCode = roomCodeInput.value.trim().toLowerCase();

    if (!roomCode) {
      // Generar sala aleatoria
      roomCode = 'conecty-' + Math.floor(100000 + Math.random() * 900000);
    }

    startSession(userName, roomCode);
  });

  function startSession(userName, roomId) {
    currentRoomId = roomId;
    headerRoomId.textContent = roomId;

    // Actualizar URL sin recargar para facilitar compartir el link
    const newUrl = `${window.location.origin}/?room=${roomId}`;
    window.history.pushState({ path: newUrl }, '', newUrl);

    // Conectar a Socket.io
    socket = io();

    // Inicializar controlador de puntero láser
    laser = new LaserController(laserCanvas, screenVideo, (pointerData) => {
      // Enviar primero por DataChannel de WebRTC (ultra baja latencia)
      const sentP2P = webrtc ? webrtc.broadcastData({ type: 'laser', ...pointerData }) : false;
      // Fallback a WebSocket si no hay DataChannel activo
      if (!sentP2P && socket) {
        socket.emit('laser-pointer', pointerData);
      }
    });

    // Inicializar WebRTC
    webrtc = new WebRTCManager({
      socket,
      iceServers,
      onRemoteStream: (peerId, stream, track) => {
        if (track.kind === 'audio') {
          handleRemoteAudio(peerId, stream);
        } else if (track.kind === 'video') {
          handleRemoteVideo(peerId, stream);
        }
      },
      onRemoteLeave: (peerId) => {
        removeParticipant(peerId);
      },
      onDataChannelMessage: (peerId, data) => {
        if (data.type === 'laser') {
          const user = participants.get(peerId);
          laser.handleRemotePointer({
            ...data,
            senderId: peerId,
            senderName: user ? user.name : 'Operador'
          });
        }
      }
    });

    // Inicializar micrófono local automáticamente para llamadas
    webrtc.initLocalAudio().then((stream) => {
      if (stream) {
        showToast('🎙️ Micrófono activado para la llamada', 'success');
      }
    });

    // Manejar eventos de Socket
    setupSocketEvents();

    // Enviar solicitud de ingreso a la sala
    socket.emit('join-room', { roomId, userName });

    // Cambiar vistas
    lobbyView.classList.add('hidden');
    roomView.classList.remove('hidden');

    soundEffects.join();
    showToast(`Te uniste a la sala ${roomId}`, 'success');
  }

  function setupSocketEvents() {
    socket.on('room-joined', ({ user, existingUsers }) => {
      myUser = user;
      updateParticipantsList(existingUsers);

      // Crear ofertas WebRTC para todos los usuarios existentes en la sala
      existingUsers.forEach((existing) => {
        if (existing.id !== socket.id) {
          webrtc.createOffer(existing.id);
        }
      });
    });

    socket.on('user-connected', (user) => {
      soundEffects.join();
      showToast(`${user.name} se unió a la sala`, 'info');
      participants.set(user.id, user);
      renderParticipants();
    });

    socket.on('offer', async ({ callerId, offer }) => {
      await webrtc.handleOffer(callerId, offer);
    });

    socket.on('answer', async ({ responderId, answer }) => {
      await webrtc.handleAnswer(responderId, answer);
    });

    socket.on('ice-candidate', async ({ senderId, candidate }) => {
      await webrtc.handleCandidate(senderId, candidate);
    });

    socket.on('laser-pointer', (data) => {
      laser.handleRemotePointer(data);
    });

    socket.on('user-screen-updated', ({ userId, isSharing }) => {
      const user = participants.get(userId);
      if (user) {
        user.isScreenSharing = isSharing;
      }
      if (!isSharing) {
        // Si el que estaba compartiendo detuvo su pantalla
        checkScreenSharingState();
      }
    });

    socket.on('new-message', (msg) => {
      appendChatMessage(msg);
      soundEffects.message();
      if (!isChatOpen) {
        unreadChatCount++;
        chatBadge.textContent = unreadChatCount;
        chatBadge.classList.remove('hidden');
      }
    });

    socket.on('user-disconnected', ({ userId, userName }) => {
      soundEffects.leave();
      showToast(`${userName} salió de la sala`, 'info');
      webrtc.closePeer(userId);
      removeParticipant(userId);
    });
  }

  function handleRemoteAudio(peerId, stream) {
    let audioElement = document.getElementById(`audio-${peerId}`);
    if (!audioElement) {
      audioElement = document.createElement('audio');
      audioElement.id = `audio-${peerId}`;
      audioElement.autoplay = true;
      remoteAudios.appendChild(audioElement);
    }
    audioElement.srcObject = stream;
  }

  function handleRemoteVideo(peerId, stream) {
    const user = participants.get(peerId);
    sharerNameText.textContent = `Pantalla de: ${user ? user.name : 'Compañero'}`;

    screenVideo.srcObject = stream;
    idleScreen.classList.add('hidden');
    videoWrapper.classList.remove('hidden');
    laser.clearCanvas();
    laser.resizeCanvas();
    showToast(`Mostrando pantalla de ${user ? user.name : 'compañero'}`, 'info');
  }

  function checkScreenSharingState() {
    let anyoneSharing = isSharingScreen;
    for (const user of participants.values()) {
      if (user.isScreenSharing) {
        anyoneSharing = true;
        break;
      }
    }
    if (!anyoneSharing) {
      screenVideo.srcObject = null;
      videoWrapper.classList.add('hidden');
      idleScreen.classList.remove('hidden');
      laser.clearCanvas();
    }
  }

  function updateParticipantsList(users) {
    participants.clear();
    users.forEach((u) => participants.set(u.id, u));
    renderParticipants();
  }

  function removeParticipant(peerId) {
    participants.delete(peerId);
    const audioElement = document.getElementById(`audio-${peerId}`);
    if (audioElement) audioElement.remove();
    renderParticipants();
    checkScreenSharingState();
  }

  function renderParticipants() {
    const totalCount = participants.size + 1; // +1 para el usuario local
    participantsCount.textContent = `${totalCount} participante${totalCount > 1 ? 's' : ''}`;

    participantsBar.innerHTML = '';

    // Mi propio avatar
    const myTag = document.createElement('div');
    myTag.className = 'px-3 py-1.5 rounded-xl glass-panel border border-slate-700/60 text-xs text-white flex items-center space-x-2 shrink-0';
    myTag.innerHTML = `
      <span class="w-2 h-2 rounded-full ${webrtc && webrtc.isMicMuted ? 'bg-rose-500' : 'bg-emerald-400'}"></span>
      <span class="font-medium">${myUser ? myUser.name : 'Tú'} (Tú)</span>
      ${isSharingScreen ? '<i data-lucide="monitor" class="w-3 h-3 text-indigo-400"></i>' : ''}
    `;
    participantsBar.appendChild(myTag);

    // Avatares remotos
    participants.forEach((user) => {
      const tag = document.createElement('div');
      tag.className = 'px-3 py-1.5 rounded-xl glass-panel border border-slate-700/60 text-xs text-slate-300 flex items-center space-x-2 shrink-0';
      tag.innerHTML = `
        <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
        <span class="font-medium">${user.name}</span>
        ${user.isScreenSharing ? '<i data-lucide="monitor" class="w-3 h-3 text-indigo-400"></i>' : ''}
      `;
      participantsBar.appendChild(tag);
    });

    if (window.lucide) lucide.createIcons();
  }

  // Toggle de Pantalla Compartida
  async function toggleScreenShare() {
    if (isSharingScreen) {
      webrtc.stopScreenShare();
      isSharingScreen = false;
      screenText.textContent = 'Compartir Pantalla';
      btnToggleScreen.classList.remove('bg-rose-600', 'hover:bg-rose-500');
      btnToggleScreen.classList.add('bg-indigo-600', 'hover:bg-indigo-500');
      socket.emit('screen-share-status', { isSharing: false });
      checkScreenSharingState();
      showToast('Dejaste de compartir pantalla', 'info');
    } else {
      const stream = await webrtc.startScreenShare(() => {
        // Al terminar desde la barra del navegador
        isSharingScreen = false;
        screenText.textContent = 'Compartir Pantalla';
        btnToggleScreen.classList.remove('bg-rose-600', 'hover:bg-rose-500');
        btnToggleScreen.classList.add('bg-indigo-600', 'hover:bg-indigo-500');
        socket.emit('screen-share-status', { isSharing: false });
        checkScreenSharingState();
      });

      if (stream) {
        isSharingScreen = true;
        screenText.textContent = 'Detener Pantalla';
        btnToggleScreen.classList.remove('bg-indigo-600', 'hover:bg-indigo-500');
        btnToggleScreen.classList.add('bg-rose-600', 'hover:bg-rose-500');

        screenVideo.srcObject = stream;
        sharerNameText.textContent = `Compartiendo tu pantalla (${myUser ? myUser.name : 'Tú'})`;
        idleScreen.classList.add('hidden');
        videoWrapper.classList.remove('hidden');
        laser.clearCanvas();
        laser.resizeCanvas();

        socket.emit('screen-share-status', { isSharing: true });
        showToast('Estás compartiendo tu pantalla', 'success');
      }
    }
    renderParticipants();
  }

  btnToggleScreen.addEventListener('click', toggleScreenShare);
  btnStartShareIdle.addEventListener('click', toggleScreenShare);

  // Toggle de Micrófono
  btnToggleMic.addEventListener('click', () => {
    if (!webrtc) return;
    const isUnmuted = webrtc.toggleMicrophone();
    if (isUnmuted) {
      micIcon.className = 'w-4 h-4 text-emerald-400';
      micText.textContent = 'Micrófono';
      showToast('Micrófono activado', 'success');
    } else {
      micIcon.className = 'w-4 h-4 text-rose-400';
      micText.textContent = 'Silenciado';
      showToast('Micrófono silenciado', 'info');
    }
    renderParticipants();
  });

  // Atajo de teclado 'M' para silenciar
  window.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if (e.key === 'm' || e.key === 'M') {
      btnToggleMic.click();
    }
  });

  // Toggle Puntero Láser
  btnToggleLaser.addEventListener('click', () => {
    if (!laser) return;
    laser.isActive = !laser.isActive;
    if (laser.isActive) {
      btnToggleLaser.classList.add('border-indigo-500/80', 'bg-indigo-950/40');
      pointerModeIndicator.classList.remove('hidden');
      showToast('Puntero láser activado (mueve y haz clic sobre la pantalla)', 'info');
    } else {
      btnToggleLaser.classList.remove('border-indigo-500/80', 'bg-indigo-950/40');
      pointerModeIndicator.classList.add('hidden');
      showToast('Puntero láser desactivado', 'info');
    }
  });

  // Limpiar Lienzo
  btnClearCanvas.addEventListener('click', () => {
    if (laser) {
      laser.clearCanvas();
      showToast('Anotaciones limpiadas', 'info');
    }
  });

  // Copiar Enlace
  function copyInviteLink() {
    const inviteUrl = `${window.location.origin}/?room=${currentRoomId}`;
    navigator.clipboard.writeText(inviteUrl).then(() => {
      showToast('📋 Enlace de sala copiado al portapapeles', 'success');
    }).catch(() => {
      prompt('Copia este enlace para invitar a otra persona:', inviteUrl);
    });
  }

  btnCopyInvite.addEventListener('click', copyInviteLink);
  btnQuickCopy.addEventListener('click', copyInviteLink);

  // Chat
  function toggleChat() {
    isChatOpen = !isChatOpen;
    if (isChatOpen) {
      chatSidebar.classList.remove('translate-x-full');
      unreadChatCount = 0;
      chatBadge.classList.add('hidden');
      chatInput.focus();
    } else {
      chatSidebar.classList.add('translate-x-full');
    }
  }

  btnToggleChat.addEventListener('click', toggleChat);
  btnCloseChat.addEventListener('click', toggleChat);

  chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = chatInput.value.trim();
    if (text && socket) {
      socket.emit('send-message', { text });
      chatInput.value = '';
    }
  });

  function appendChatMessage(msg) {
    const isMe = myUser && msg.senderId === socket.id;
    const msgDiv = document.createElement('div');
    msgDiv.className = `flex flex-col ${isMe ? 'items-end' : 'items-start'}`;

    msgDiv.innerHTML = `
      <div class="flex items-center space-x-1.5 mb-1">
        <span class="text-[10px] font-bold ${isMe ? 'text-indigo-400' : 'text-slate-400'}">${msg.senderName}</span>
        <span class="text-[9px] text-slate-500">${msg.timestamp}</span>
      </div>
      <div class="px-3.5 py-2 rounded-2xl max-w-[85%] text-xs break-words ${
        isMe ? 'bg-indigo-600 text-white rounded-br-xs' : 'bg-slate-800 text-slate-200 border border-slate-700/80 rounded-bl-xs'
      }">
        ${escapeHtml(msg.text)}
      </div>
    `;

    chatMessages.appendChild(msgDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function escapeHtml(string) {
    const div = document.createElement('div');
    div.innerText = string;
    return div.innerHTML;
  }

  // Salir de la Sala
  btnLeaveRoom.addEventListener('click', () => {
    if (confirm('¿Deseas salir de la llamada y cerrar la sesión?')) {
      if (webrtc) webrtc.disconnectAll();
      if (socket) {
        socket.emit('leave-room');
        socket.disconnect();
      }
      window.location.href = '/';
    }
  });
});
