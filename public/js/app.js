/**
 * Conecty - Aplicación Principal y Control de Estado UI
 * Modelo AnyDesk: ID Fijo de 9 dígitos por dispositivo, Anti-Modo Espejo,
 * Sistema de Autorización Previa de Conexiones Entrantes,
 * Modo Control Remoto Interactivo de Ratón y Teclado,
 * Panel de Configuraciones Completo y Live Voice Call Equalizer.
 */

document.addEventListener('DOMContentLoaded', async () => {
  // Elementos DOM del Lobby
  const lobbyView = document.getElementById('lobbyView');
  const myDeviceIdDisplay = document.getElementById('myDeviceIdDisplay');
  const btnCopyMyId = document.getElementById('btnCopyMyId');
  const btnCopyMyDirectLink = document.getElementById('btnCopyMyDirectLink');
  const userNameInput = document.getElementById('userNameInput');
  const btnWaitConnection = document.getElementById('btnWaitConnection');

  const connectRemoteForm = document.getElementById('connectRemoteForm');
  const targetDeviceIdInput = document.getElementById('targetDeviceIdInput');

  // Modales de Autorización
  const incomingRequestModal = document.getElementById('incomingRequestModal');
  const incomingRequesterAvatar = document.getElementById('incomingRequesterAvatar');
  const incomingRequesterName = document.getElementById('incomingRequesterName');
  const incomingRequesterDeviceId = document.getElementById('incomingRequesterDeviceId');
  const btnRejectConnection = document.getElementById('btnRejectConnection');
  const btnAcceptConnection = document.getElementById('btnAcceptConnection');

  const waitingApprovalModal = document.getElementById('waitingApprovalModal');
  const waitingTargetIdDisplay = document.getElementById('waitingTargetIdDisplay');
  const waitingHostNameText = document.getElementById('waitingHostNameText');
  const btnCancelWaitingApproval = document.getElementById('btnCancelWaitingApproval');

  // Modal de Configuraciones
  const settingsModal = document.getElementById('settingsModal');
  const btnOpenSettings = document.getElementById('btnOpenSettings');
  const btnOpenSettingsLobby = document.getElementById('btnOpenSettingsLobby');
  const btnCloseSettings = document.getElementById('btnCloseSettings');
  const btnSaveCloseSettings = document.getElementById('btnSaveCloseSettings');
  const settingsSavedToast = document.getElementById('settingsSavedToast');
  const btnCopyAgentCmd = document.getElementById('btnCopyAgentCmd');

  // Controles de Configuración
  const settingUserName = document.getElementById('settingUserName');
  const settingDeviceId = document.getElementById('settingDeviceId');
  const btnSettingRegenId = document.getElementById('btnSettingRegenId');
  const settingSoundEffects = document.getElementById('settingSoundEffects');
  const settingAllowControl = document.getElementById('settingAllowControl');
  const settingRequireAuth = document.getElementById('settingRequireAuth');
  const settingAllowLaser = document.getElementById('settingAllowLaser');
  const settingScreenFps = document.getElementById('settingScreenFps');
  const settingDefaultScale = document.getElementById('settingDefaultScale');
  const settingAntiMirror = document.getElementById('settingAntiMirror');
  const settingEchoCancellation = document.getElementById('settingEchoCancellation');
  const settingNoiseSuppression = document.getElementById('settingNoiseSuppression');
  const btnStartMicTest = document.getElementById('btnStartMicTest');
  const micVolumeBar = document.getElementById('micVolumeBar');
  const pingValueDisplay = document.getElementById('pingValueDisplay');

  // Elementos DOM de la Sala
  const roomView = document.getElementById('roomView');
  const headerRoomId = document.getElementById('headerRoomId');
  const participantsCount = document.getElementById('participantsCount');
  const participantsBar = document.getElementById('participantsBar');
  const voiceCallBadge = document.getElementById('voiceCallBadge');
  const voiceStatusText = document.getElementById('voiceStatusText');

  const idleScreen = document.getElementById('idleScreen');
  const sharerActiveCard = document.getElementById('sharerActiveCard');
  const toggleHostAllowControl = document.getElementById('toggleHostAllowControl');
  const btnStopShareCard = document.getElementById('btnStopShareCard');
  const btnTogglePipPreview = document.getElementById('btnTogglePipPreview');
  const pipPreviewContainer = document.getElementById('pipPreviewContainer');
  const pipVideo = document.getElementById('pipVideo');
  const pipBtnText = document.getElementById('pipBtnText');

  const videoWrapper = document.getElementById('videoWrapper');
  const zoomContainer = document.getElementById('zoomContainer');
  const screenVideo = document.getElementById('screenVideo');
  const laserCanvas = document.getElementById('laserCanvas');
  const sharerNameText = document.getElementById('sharerNameText');
  const pointerModeIndicator = document.getElementById('pointerModeIndicator');
  const remoteControlBanner = document.getElementById('remoteControlBanner');

  // Controles de Tamaño de Pantalla & Zoom
  const btnFitScreen = document.getElementById('btnFitScreen');
  const btnFillScreen = document.getElementById('btnFillScreen');
  const btnOriginalScreen = document.getElementById('btnOriginalScreen');
  const btnZoomOut = document.getElementById('btnZoomOut');
  const btnZoomIn = document.getElementById('btnZoomIn');
  const zoomLevelText = document.getElementById('zoomLevelText');
  const btnFullscreen = document.getElementById('btnFullscreen');

  // Barra de Controles Inferior (Dock)
  const btnToggleMic = document.getElementById('btnToggleMic');
  const micIcon = document.getElementById('micIcon');
  const micText = document.getElementById('micText');
  const btnTestAudio = document.getElementById('btnTestAudio');

  const btnToggleScreen = document.getElementById('btnToggleScreen');
  const screenText = document.getElementById('screenText');
  const btnStartShareIdle = document.getElementById('btnStartShareIdle');

  const btnToggleControl = document.getElementById('btnToggleControl');
  const controlIcon = document.getElementById('controlIcon');
  const controlText = document.getElementById('controlText');

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

  // ================= 1. GESTIÓN DE ID Y CONFIGURACIONES (ANYDESK STYLE) =================
  let myDeviceId = localStorage.getItem('conecty_device_id');
  if (!myDeviceId || myDeviceId.length !== 9 || !/^\d+$/.test(myDeviceId)) {
    myDeviceId = Math.floor(100000000 + Math.random() * 900000000).toString();
    localStorage.setItem('conecty_device_id', myDeviceId);
  }

  function formatDeviceId(id) {
    if (!id) return '';
    const clean = id.toString().replace(/\D/g, '');
    if (clean.length === 9) {
      return clean.replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3');
    }
    return id;
  }

  myDeviceIdDisplay.textContent = formatDeviceId(myDeviceId);

  // Configuraciones de Usuario Persistentes
  const defaultSettings = {
    allowControl: true,
    requireAuth: true,
    allowLaser: true,
    soundEffects: true,
    screenFps: '60',
    defaultScale: 'contain',
    antiMirror: true,
    echoCancellation: true,
    noiseSuppression: true
  };

  let userSettings = { ...defaultSettings };
  try {
    const saved = localStorage.getItem('conecty_settings');
    if (saved) {
      userSettings = { ...defaultSettings, ...JSON.parse(saved) };
    }
  } catch (e) {}

  function saveSettings() {
    localStorage.setItem('conecty_settings', JSON.stringify(userSettings));
    if (settingsSavedToast) {
      settingsSavedToast.classList.remove('opacity-0');
      setTimeout(() => settingsSavedToast.classList.add('opacity-0'), 1500);
    }
  }

  // Nombre de Usuario
  const savedUserName = localStorage.getItem('conecty_user_name');
  if (savedUserName) {
    userNameInput.value = savedUserName;
  } else {
    userNameInput.value = 'Usuario-' + myDeviceId.substring(0, 4);
  }

  // Sincronizar campos del modal de configuración
  function populateSettingsModal() {
    settingUserName.value = userNameInput.value;
    settingDeviceId.value = formatDeviceId(myDeviceId);
    settingSoundEffects.checked = userSettings.soundEffects;
    settingAllowControl.checked = userSettings.allowControl;
    settingRequireAuth.checked = userSettings.requireAuth;
    settingAllowLaser.checked = userSettings.allowLaser;
    settingScreenFps.value = userSettings.screenFps;
    settingDefaultScale.value = userSettings.defaultScale;
    settingAntiMirror.checked = userSettings.antiMirror;
    settingEchoCancellation.checked = userSettings.echoCancellation;
    settingNoiseSuppression.checked = userSettings.noiseSuppression;

    if (toggleHostAllowControl) {
      toggleHostAllowControl.checked = userSettings.allowControl;
    }
  }

  populateSettingsModal();

  // Guardar cambios al interactuar en el modal de configuración
  settingUserName.addEventListener('change', () => {
    const val = settingUserName.value.trim();
    if (val) {
      userNameInput.value = val;
      localStorage.setItem('conecty_user_name', val);
      if (socket) socket.emit('update-device-name', { userName: val });
      saveSettings();
    }
  });

  settingSoundEffects.addEventListener('change', () => {
    userSettings.soundEffects = settingSoundEffects.checked;
    saveSettings();
  });

  settingAllowControl.addEventListener('change', () => {
    userSettings.allowControl = settingAllowControl.checked;
    if (toggleHostAllowControl) toggleHostAllowControl.checked = userSettings.allowControl;
    saveSettings();
  });

  if (toggleHostAllowControl) {
    toggleHostAllowControl.addEventListener('change', () => {
      userSettings.allowControl = toggleHostAllowControl.checked;
      settingAllowControl.checked = toggleHostAllowControl.checked;
      saveSettings();
      showToast(userSettings.allowControl ? '🎮 Control remoto habilitado' : '🔒 Control remoto deshabilitado', 'info');
    });
  }

  settingRequireAuth.addEventListener('change', () => {
    userSettings.requireAuth = settingRequireAuth.checked;
    saveSettings();
  });

  settingAllowLaser.addEventListener('change', () => {
    userSettings.allowLaser = settingAllowLaser.checked;
    saveSettings();
  });

  settingScreenFps.addEventListener('change', () => {
    userSettings.screenFps = settingScreenFps.value;
    saveSettings();
  });

  settingDefaultScale.addEventListener('change', () => {
    userSettings.defaultScale = settingDefaultScale.value;
    currentFitMode = userSettings.defaultScale;
    updateScreenDisplay();
    saveSettings();
  });

  settingAntiMirror.addEventListener('change', () => {
    userSettings.antiMirror = settingAntiMirror.checked;
    saveSettings();
  });

  settingEchoCancellation.addEventListener('change', () => {
    userSettings.echoCancellation = settingEchoCancellation.checked;
    saveSettings();
  });

  settingNoiseSuppression.addEventListener('change', () => {
    userSettings.noiseSuppression = settingNoiseSuppression.checked;
    saveSettings();
  });

  btnSettingRegenId.addEventListener('click', () => {
    if (confirm('¿Deseas generar un nuevo ID permanente de 9 dígitos para este dispositivo?')) {
      myDeviceId = Math.floor(100000000 + Math.random() * 900000000).toString();
      localStorage.setItem('conecty_device_id', myDeviceId);
      myDeviceIdDisplay.textContent = formatDeviceId(myDeviceId);
      settingDeviceId.value = formatDeviceId(myDeviceId);
      registerMyDeviceOnServer();
      showToast('Nuevo ID de dispositivo generado: ' + formatDeviceId(myDeviceId), 'success');
    }
  });

  btnCopyAgentCmd.addEventListener('click', () => {
    navigator.clipboard.writeText(`node agent/conecty-agent.js ${window.location.origin} ${myDeviceId}`).then(() => {
      showToast('📋 Comando del Asistente Windows copiado al portapapeles', 'success');
    });
  });

  // Navegación de pestañas en el Modal de Configuración
  const tabButtons = document.querySelectorAll('.settings-tab-btn');
  const tabPanes = {
    general: document.getElementById('tabGeneral'),
    security: document.getElementById('tabSecurity'),
    screen: document.getElementById('tabScreen'),
    audio: document.getElementById('tabAudio'),
    network: document.getElementById('tabNetwork')
  };

  tabButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const tabName = btn.getAttribute('data-tab');
      tabButtons.forEach((b) => {
        b.className = 'settings-tab-btn w-full px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center space-x-2.5 transition text-slate-400 hover:text-white hover:bg-slate-800/60';
      });
      btn.className = 'settings-tab-btn w-full px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center space-x-2.5 transition text-white bg-indigo-600 shadow';

      Object.values(tabPanes).forEach((pane) => {
        if (pane) pane.classList.add('hidden');
      });
      if (tabPanes[tabName]) {
        tabPanes[tabName].classList.remove('hidden');
      }

      if (window.lucide) lucide.createIcons();
    });
  });

  // Abrir / Cerrar Configuración
  function openSettings() {
    populateSettingsModal();
    settingsModal.classList.remove('hidden');
    if (window.lucide) lucide.createIcons();
  }

  function closeSettings() {
    settingsModal.classList.add('hidden');
    stopMicMeter();
  }

  btnOpenSettings.addEventListener('click', openSettings);
  btnOpenSettingsLobby.addEventListener('click', openSettings);
  btnCloseSettings.addEventListener('click', closeSettings);
  btnSaveCloseSettings.addEventListener('click', closeSettings);

  // Formateo automático al escribir en el campo de destino (XXX XXX XXX)
  targetDeviceIdInput.addEventListener('input', (e) => {
    let digits = e.target.value.replace(/\D/g, '').substring(0, 9);
    if (digits.length > 6) {
      e.target.value = digits.substring(0, 3) + ' ' + digits.substring(3, 6) + ' ' + digits.substring(6);
    } else if (digits.length > 3) {
      e.target.value = digits.substring(0, 3) + ' ' + digits.substring(3);
    } else {
      e.target.value = digits;
    }
  });

  // Copiar Mi ID Numérico
  btnCopyMyId.addEventListener('click', () => {
    navigator.clipboard.writeText(formatDeviceId(myDeviceId)).then(() => {
      showToast('📋 Número de tu dispositivo copiado: ' + formatDeviceId(myDeviceId), 'success');
    });
  });

  // Copiar Enlace Directo
  btnCopyMyDirectLink.addEventListener('click', () => {
    const directUrl = `${window.location.origin}/?connect=${myDeviceId}`;
    navigator.clipboard.writeText(directUrl).then(() => {
      showToast('🔗 Enlace directo copiado para compartir', 'success');
    });
  });

  // Pre-llenar si viene en la URL (?connect=xxx o ?id=xxx o ?room=xxx)
  const urlParams = new URLSearchParams(window.location.search);
  const connectParam = urlParams.get('connect') || urlParams.get('id');
  const roomParam = urlParams.get('room');
  if (connectParam) {
    targetDeviceIdInput.value = formatDeviceId(connectParam);
  } else if (roomParam) {
    const cleanRoomNum = roomParam.replace(/^device-/, '');
    targetDeviceIdInput.value = formatDeviceId(cleanRoomNum);
  }

  // ================= 2. ESTADO LOCAL Y RECURSOS =================
  let webrtc = null;
  let laser = null;
  let myUser = null;
  let currentRoomId = null;
  let isSharingScreen = false;
  let unreadChatCount = 0;
  let isChatOpen = false;

  // Estado de Control Remoto de Ratón y Teclado
  let isRemoteControlActive = false;

  // Participantes: Map(id -> { name, deviceId, isScreenSharing, isAudioMuted, isSpeaking: false })
  const participants = new Map();

  // Sintetizador de Sonidos (Web Audio API)
  const soundEffects = {
    ctx: null,
    ringInterval: null,
    init() {
      if (!this.ctx) {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    },
    playTone(freq, type = 'sine', duration = 0.15) {
      if (!userSettings.soundEffects) return;
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
      this.playTone(880, 'triangle', 0.1);
    },
    testChime() {
      this.playTone(523.25, 'sine', 0.2);
      setTimeout(() => this.playTone(659.25, 'sine', 0.2), 150);
      setTimeout(() => this.playTone(783.99, 'sine', 0.35), 300);
    },
    playIncomingChime() {
      this.playTone(523.25, 'sine', 0.2);
      setTimeout(() => this.playTone(659.25, 'sine', 0.3), 220);
    },
    startIncomingCallRing() {
      this.stopIncomingCallRing();
      this.playIncomingChime();
      this.ringInterval = setInterval(() => {
        this.playIncomingChime();
      }, 1900);
    },
    stopIncomingCallRing() {
      if (this.ringInterval) {
        clearInterval(this.ringInterval);
        this.ringInterval = null;
      }
    }
  };

  btnTestAudio.addEventListener('click', () => {
    soundEffects.testChime();
    showToast('🔊 Sonido de prueba reproducido. Si lo escuchas, tus altavoces funcionan.', 'info');
  });

  // Medidor interactivo del micrófono en Configuración
  let micMeterStream = null;
  let micMeterInterval = null;
  async function startMicMeter() {
    stopMicMeter();
    try {
      micMeterStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const source = audioCtx.createMediaStreamSource(micMeterStream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);
      const data = new Uint8Array(analyser.frequencyBinCount);

      const updateMeter = () => {
        analyser.getByteFrequencyData(data);
        let sum = 0;
        for (let i = 0; i < data.length; i++) sum += data[i];
        const pct = Math.min(100, Math.round((sum / data.length) * 2));
        if (micVolumeBar) {
          micVolumeBar.style.width = pct + '%';
        }
        micMeterInterval = requestAnimationFrame(updateMeter);
      };
      updateMeter();
      btnStartMicTest.textContent = 'Detener Prueba';
    } catch (e) {
      showToast('No se pudo acceder al micrófono para la prueba', 'info');
    }
  }

  function stopMicMeter() {
    if (micMeterInterval) {
      cancelAnimationFrame(micMeterInterval);
      micMeterInterval = null;
    }
    if (micMeterStream) {
      micMeterStream.getTracks().forEach((t) => t.stop());
      micMeterStream = null;
    }
    if (micVolumeBar) micVolumeBar.style.width = '0%';
    if (btnStartMicTest) btnStartMicTest.textContent = 'Probar Entrada';
  }

  btnStartMicTest.addEventListener('click', () => {
    if (micMeterStream) {
      stopMicMeter();
    } else {
      startMicMeter();
    }
  });

  // Toast Notification
  function showToast(message, type = 'info') {
    toastContainer.innerHTML = '';
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
      setTimeout(() => toast.remove(), 250);
    }, 2800);
  }

  // Servidores STUN/TURN
  let iceServers = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun.cloudflare.com:3478' }
  ];
  try {
    const configRes = await fetch('/api/config');
    const configData = await configRes.json();
    if (configData.iceServers && configData.iceServers.length > 0) {
      iceServers = configData.iceServers;
    }
  } catch (e) {}

  // ================= 3. CONEXIÓN SOCKET Y REGISTRO EN LÍNEA =================
  const socket = io({
    transports: ['websocket'],
    upgrade: false
  });

  function registerMyDeviceOnServer() {
    const currentName = userNameInput.value.trim() || ('Usuario-' + myDeviceId.substring(0, 4));
    socket.emit('register-device', {
      deviceId: myDeviceId,
      userName: currentName
    });
  }

  socket.on('connect', () => {
    registerMyDeviceOnServer();
    measureLatency();
  });

  userNameInput.addEventListener('input', () => {
    const newName = userNameInput.value.trim();
    if (newName) {
      localStorage.setItem('conecty_user_name', newName);
      socket.emit('update-device-name', { userName: newName });
    }
  });

  // Medición continua de latencia Ping (ms)
  function measureLatency() {
    const start = Date.now();
    socket.emit('ping-check', start);
  }

  socket.on('pong-check', (clientTimestamp) => {
    const latency = Date.now() - clientTimestamp;
    if (pingValueDisplay) {
      pingValueDisplay.textContent = latency;
    }
  });

  setInterval(() => {
    if (socket.connected) measureLatency();
  }, 4000);

  // ================= 4. FLUJO DE AUTORIZACIÓN DE CONEXIONES =================
  let currentIncomingRequestId = null;
  let currentOutgoingRequestId = null;

  // A) EL ANFITRIÓN RECIBE UNA SOLICITUD ENTRANTE
  socket.on('incoming-connection-request', (data) => {
    currentIncomingRequestId = data.requestId;

    incomingRequesterName.textContent = data.requesterName || 'Usuario Remoto';
    incomingRequesterDeviceId.textContent = formatDeviceId(data.requesterDeviceId || '---');
    incomingRequesterAvatar.textContent = (data.requesterName || 'US').substring(0, 2).toUpperCase();

    incomingRequestModal.classList.remove('hidden');
    soundEffects.startIncomingCallRing();
    if (window.lucide) lucide.createIcons();
  });

  socket.on('incoming-request-cancelled', ({ requestId }) => {
    if (currentIncomingRequestId === requestId) {
      currentIncomingRequestId = null;
      soundEffects.stopIncomingCallRing();
      incomingRequestModal.classList.add('hidden');
      showToast('ℹ️ El solicitante canceló la petición de conexión', 'info');
    }
  });

  // Botón Anfitrión: Autorizar y Conectar
  btnAcceptConnection.addEventListener('click', async () => {
    if (!currentIncomingRequestId) return;
    const reqId = currentIncomingRequestId;
    currentIncomingRequestId = null;
    soundEffects.stopIncomingCallRing();
    incomingRequestModal.classList.add('hidden');

    socket.emit('respond-connection-request', { requestId: reqId, accepted: true });

    if (!currentRoomId) {
      const name = userNameInput.value.trim() || ('Usuario-' + myDeviceId.substring(0, 4));
      await startSession(name, 'device-' + myDeviceId);
    }
    showToast('✅ Conexión autorizada', 'success');
  });

  // Botón Anfitrión: Rechazar
  btnRejectConnection.addEventListener('click', () => {
    if (!currentIncomingRequestId) return;
    const reqId = currentIncomingRequestId;
    currentIncomingRequestId = null;
    soundEffects.stopIncomingCallRing();
    incomingRequestModal.classList.add('hidden');

    socket.emit('respond-connection-request', { requestId: reqId, accepted: false });
    showToast('Solicitud de conexión rechazada', 'info');
  });

  // B) EL INVITADO SOLICITA CONEXIÓN A OTRO EQUIPO
  connectRemoteForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = userNameInput.value.trim() || ('Usuario-' + myDeviceId.substring(0, 4));
    localStorage.setItem('conecty_user_name', name);

    let targetRaw = targetDeviceIdInput.value.replace(/\D/g, '');
    if (!targetRaw) {
      showToast('Por favor introduce el número de 9 dígitos del destino', 'info');
      return;
    }

    if (targetRaw === myDeviceId) {
      showToast('No puedes solicitar conexión a tu propio número', 'info');
      return;
    }

    waitingTargetIdDisplay.textContent = formatDeviceId(targetRaw);
    waitingHostNameText.textContent = 'el anfitrión';
    waitingApprovalModal.classList.remove('hidden');

    socket.emit('request-connection', {
      targetDeviceId: targetRaw,
      requesterName: name
    });
  });

  socket.on('connection-request-sent', ({ requestId, hostName }) => {
    currentOutgoingRequestId = requestId;
    waitingHostNameText.textContent = hostName || 'el anfitrión';
  });

  socket.on('connection-response', async (res) => {
    waitingApprovalModal.classList.add('hidden');
    currentOutgoingRequestId = null;

    if (res.status === 'accepted') {
      const name = userNameInput.value.trim() || ('Usuario-' + myDeviceId.substring(0, 4));
      showToast(`🎉 Conexión autorizada por ${res.hostName || 'el anfitrión'}`, 'success');
      await startSession(name, res.roomId);
    } else if (res.status === 'rejected') {
      showToast('⛔ Solicitud rechazada: El anfitrión no autorizó el acceso', 'info');
    } else if (res.status === 'offline') {
      showToast(res.message || '⚠️ El equipo no está en línea en Conecty en este momento', 'info');
    } else if (res.status === 'timeout') {
      showToast('⌛ Tiempo de espera agotado. El anfitrión no respondió la solicitud', 'info');
    } else if (res.status === 'error') {
      showToast('⚠️ ' + (res.message || 'Error al conectar'), 'info');
    }
  });

  btnCancelWaitingApproval.addEventListener('click', () => {
    if (currentOutgoingRequestId) {
      socket.emit('cancel-connection-request', { requestId: currentOutgoingRequestId });
      currentOutgoingRequestId = null;
    }
    waitingApprovalModal.classList.add('hidden');
    showToast('Solicitud de conexión cancelada', 'info');
  });

  btnWaitConnection.addEventListener('click', async () => {
    const name = userNameInput.value.trim() || ('Usuario-' + myDeviceId.substring(0, 4));
    localStorage.setItem('conecty_user_name', name);
    await startSession(name, 'device-' + myDeviceId);
  });

  // ================= 5. INICIALIZACIÓN DE LA SESIÓN EN SALA =================
  async function startSession(userName, roomId) {
    currentRoomId = roomId;
    const cleanRoomDisplay = roomId.replace(/^device-/, '');
    headerRoomId.textContent = formatDeviceId(cleanRoomDisplay);

    const newUrl = `${window.location.origin}/?connect=${cleanRoomDisplay}`;
    window.history.pushState({ path: newUrl }, '', newUrl);

    // Controlador Láser y Emulación de Ratón
    if (!laser) {
      laser = new LaserController(laserCanvas, screenVideo, (pointerData) => {
        const sentP2P = webrtc ? webrtc.broadcastData({ type: 'laser', ...pointerData }) : false;
        if (!sentP2P && socket) {
          socket.emit('laser-pointer', pointerData);
        }
      });
    }

    // WebRTC Manager
    if (!webrtc) {
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
          } else if (data.type === 'remote-control') {
            handleIncomingRemoteControl(data, peerId);
          }
        }
      });

      // Inicializar micrófono local
      const audioStream = await webrtc.initLocalAudio();
      if (audioStream) {
        showToast('🎙️ Micrófono listo y llamada de voz activa', 'success');
        monitorLocalVoice(audioStream);
      } else {
        showToast('⚠️ No se detectó micrófono. Podrás escuchar la llamada.', 'info');
      }

      setupRoomSocketEvents();
    }

    socket.emit('join-room', {
      roomId,
      userName,
      deviceId: myDeviceId
    });

    lobbyView.classList.add('hidden');
    roomView.classList.remove('hidden');

    soundEffects.join();
    showToast(`Conectado al puesto ${formatDeviceId(cleanRoomDisplay)}`, 'success');
  }

  // ================= 6. MODO CONTROL REMOTO DE RATÓN Y TECLADO =================
  function sendRemoteControlEvent(actionData) {
    if (!isRemoteControlActive) return;
    const payload = {
      type: 'remote-control',
      ...actionData
    };
    const sentP2P = webrtc ? webrtc.broadcastData(payload) : false;
    if (!sentP2P && socket) {
      socket.emit('remote-control', payload);
    }
  }

  function handleIncomingRemoteControl(data, senderId) {
    // Si el anfitrión no permite el control remoto, ignorar
    if (!userSettings.allowControl || (toggleHostAllowControl && !toggleHostAllowControl.checked)) {
      return;
    }

    const user = participants.get(senderId || data.senderId);
    if (laser) {
      laser.handleRemoteControl({
        ...data,
        senderId: senderId || data.senderId,
        senderName: user ? user.name : (data.senderName || 'Operador')
      });
    }
  }

  // Toggle del botón de Control Remoto en el Dock
  btnToggleControl.addEventListener('click', () => {
    isRemoteControlActive = !isRemoteControlActive;

    if (isRemoteControlActive) {
      btnToggleControl.classList.remove('bg-slate-800', 'text-slate-200');
      btnToggleControl.classList.add('bg-emerald-600', 'text-white', 'border-emerald-500/80');
      controlIcon.className = 'w-4 h-4 text-white animate-pulse';
      remoteControlBanner.classList.remove('hidden');
      laserCanvas.style.cursor = 'default';
      showToast('🎮 Modo Control Remoto Activado (Mueve el ratón y haz clic sobre la pantalla)', 'success');
    } else {
      btnToggleControl.classList.add('bg-slate-800', 'text-slate-200');
      btnToggleControl.classList.remove('bg-emerald-600', 'text-white', 'border-emerald-500/80');
      controlIcon.className = 'w-4 h-4 text-slate-400';
      remoteControlBanner.classList.add('hidden');
      laserCanvas.style.cursor = 'crosshair';
      showToast('Control remoto desactivado', 'info');
    }
  });

  // Captura de eventos de ratón para Control Remoto sobre el canvas
  laserCanvas.addEventListener('mousemove', (e) => {
    if (!isRemoteControlActive || !laser) return;
    const coords = laser.normalizeCoords(e.clientX, e.clientY);
    if (coords.inside) {
      sendRemoteControlEvent({ type: 'move', x: coords.x, y: coords.y });
    }
  });

  laserCanvas.addEventListener('mousedown', (e) => {
    if (!isRemoteControlActive || !laser) return;
    const coords = laser.normalizeCoords(e.clientX, e.clientY);
    if (coords.inside) {
      sendRemoteControlEvent({ type: 'mousedown', button: e.button, x: coords.x, y: coords.y });
    }
  });

  laserCanvas.addEventListener('mouseup', (e) => {
    if (!isRemoteControlActive || !laser) return;
    const coords = laser.normalizeCoords(e.clientX, e.clientY);
    if (coords.inside) {
      sendRemoteControlEvent({ type: 'mouseup', button: e.button, x: coords.x, y: coords.y });
      sendRemoteControlEvent({ type: 'click', button: e.button, x: coords.x, y: coords.y });
    }
  });

  laserCanvas.addEventListener('dblclick', (e) => {
    if (!isRemoteControlActive || !laser) return;
    const coords = laser.normalizeCoords(e.clientX, e.clientY);
    if (coords.inside) {
      sendRemoteControlEvent({ type: 'dblclick', button: e.button, x: coords.x, y: coords.y });
    }
  });

  laserCanvas.addEventListener('contextmenu', (e) => {
    if (!isRemoteControlActive || !laser) return;
    e.preventDefault(); // Prevenir menú contextual del navegador
    const coords = laser.normalizeCoords(e.clientX, e.clientY);
    if (coords.inside) {
      sendRemoteControlEvent({ type: 'contextmenu', button: 2, x: coords.x, y: coords.y });
    }
  });

  laserCanvas.addEventListener('wheel', (e) => {
    if (!isRemoteControlActive || !laser) return;
    e.preventDefault();
    sendRemoteControlEvent({ type: 'wheel', deltaX: e.deltaX, deltaY: e.deltaY });
  }, { passive: false });

  // Captura de teclas cuando se está en control remoto
  window.addEventListener('keydown', (e) => {
    if (!isRemoteControlActive) return;
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    sendRemoteControlEvent({
      type: 'keydown',
      key: e.key,
      code: e.code,
      ctrl: e.ctrlKey,
      alt: e.altKey,
      shift: e.shiftKey,
      meta: e.metaKey
    });
  });

  // Monitor del micrófono local para ecualizador
  function monitorLocalVoice(stream) {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);
      const data = new Uint8Array(analyser.frequencyBinCount);

      const check = () => {
        analyser.getByteFrequencyData(data);
        let sum = 0;
        for (let i = 0; i < data.length; i++) sum += data[i];
        const avg = sum / data.length;
        const isSpeaking = avg > 14 && (!webrtc || !webrtc.isMicMuted);

        const myCard = document.getElementById('myParticipantCard');
        if (myCard) {
          if (isSpeaking) {
            myCard.classList.add('ring-2', 'ring-emerald-400');
            const eq = myCard.querySelector('.voice-eq');
            if (eq) eq.classList.remove('opacity-25');
          } else {
            myCard.classList.remove('ring-2', 'ring-emerald-400');
            const eq = myCard.querySelector('.voice-eq');
            if (eq) eq.classList.add('opacity-25');
          }
        }
        requestAnimationFrame(check);
      };
      check();
    } catch (e) {}
  }

  // Monitor de audio remoto para ecualizador
  function monitorRemoteVoice(peerId, stream) {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);
      const data = new Uint8Array(analyser.frequencyBinCount);

      const check = () => {
        analyser.getByteFrequencyData(data);
        let sum = 0;
        for (let i = 0; i < data.length; i++) sum += data[i];
        const avg = sum / data.length;
        const isSpeaking = avg > 14;

        const peerCard = document.getElementById(`peerCard-${peerId}`);
        if (peerCard) {
          if (isSpeaking) {
            peerCard.classList.add('ring-2', 'ring-emerald-400');
            const eq = peerCard.querySelector('.voice-eq');
            if (eq) eq.classList.remove('opacity-25');
          } else {
            peerCard.classList.remove('ring-2', 'ring-emerald-400');
            const eq = peerCard.querySelector('.voice-eq');
            if (eq) eq.classList.add('opacity-25');
          }
        }
        requestAnimationFrame(check);
      };
      check();
    } catch (e) {}
  }

  // Eventos de Socket en Sala
  let roomEventsRegistered = false;
  function setupRoomSocketEvents() {
    if (roomEventsRegistered) return;
    roomEventsRegistered = true;

    socket.on('room-joined', ({ user, existingUsers }) => {
      myUser = user;
      updateParticipantsList(existingUsers);

      existingUsers.forEach((existing) => {
        if (existing.id !== socket.id) {
          webrtc.createOffer(existing.id);
        }
      });
    });

    socket.on('room-join-denied', ({ reason }) => {
      showToast('⛔ ' + (reason || 'Acceso denegado a la sala'), 'info');
      setTimeout(() => {
        window.location.href = '/';
      }, 2000);
    });

    socket.on('user-connected', (user) => {
      soundEffects.join();
      showToast(`${user.name} se conectó a la sesión`, 'info');
      participants.set(user.id, user);
      renderParticipants();

      if (isSharingScreen && webrtc && webrtc.localScreenStream) {
        const peerObj = webrtc.getOrCreatePeer(user.id, true);
        webrtc.localScreenStream.getTracks().forEach((track) => {
          const sender = peerObj.pc.addTrack(track, webrtc.localScreenStream);
          peerObj.screenSenders.push(sender);
        });
        webrtc.renegotiate(user.id);
      }
    });

    socket.on('offer', async ({ callerId, offer }) => {
      if (webrtc) await webrtc.handleOffer(callerId, offer);
    });

    socket.on('answer', async ({ responderId, answer }) => {
      if (webrtc) await webrtc.handleAnswer(responderId, answer);
    });

    socket.on('ice-candidate', async ({ senderId, candidate }) => {
      if (webrtc) await webrtc.handleCandidate(senderId, candidate);
    });

    socket.on('laser-pointer', (data) => {
      if (laser && userSettings.allowLaser) {
        laser.handleRemotePointer(data);
      }
    });

    socket.on('remote-control', (data) => {
      handleIncomingRemoteControl(data, data.senderId);
    });

    socket.on('user-screen-updated', ({ userId, isSharing }) => {
      const user = participants.get(userId);
      if (user) {
        user.isScreenSharing = isSharing;
      }
      renderParticipants();
      if (!isSharing) {
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
        showToast(`💬 ${msg.senderName}: ${msg.text.substring(0, 35)}...`, 'info');
      }
    });

    socket.on('user-disconnected', ({ userId, userName }) => {
      soundEffects.leave();
      showToast(`${userName} se desconectó`, 'info');
      if (webrtc) webrtc.closePeer(userId);
      removeParticipant(userId);
    });
  }

  // Manejo de Audio Remoto
  function handleRemoteAudio(peerId, stream) {
    let audioElement = document.getElementById(`audio-${peerId}`);
    if (!audioElement) {
      audioElement = document.createElement('audio');
      audioElement.id = `audio-${peerId}`;
      audioElement.autoplay = true;
      audioElement.playsInline = true;
      remoteAudios.appendChild(audioElement);
    }
    audioElement.srcObject = stream;
    audioElement.play().catch((e) => {
      console.warn('Autoplay bloqueado esperando interacción:', e);
      const unlockAudio = () => {
        audioElement.play().catch(() => {});
        window.removeEventListener('click', unlockAudio);
      };
      window.addEventListener('click', unlockAudio);
    });

    monitorRemoteVoice(peerId, stream);
  }

  // ================= 7. CONTROLES DE PANTALLA & MODO ANTI-ESPEJO =================
  let currentZoom = 1.0;
  let currentFitMode = userSettings.defaultScale || 'contain';

  function updateScreenDisplay() {
    if (zoomContainer) {
      zoomContainer.style.transform = `scale(${currentZoom})`;
    }
    if (zoomLevelText) {
      zoomLevelText.textContent = `${Math.round(currentZoom * 100)}%`;
    }

    if (currentFitMode === 'contain') {
      screenVideo.className = 'max-w-full max-h-full rounded-2xl shadow-2xl object-contain bg-black border border-slate-800 transition-all';
      btnFitScreen.className = 'px-2.5 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-500 transition flex items-center space-x-1';
      btnFillScreen.className = 'px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition flex items-center space-x-1';
      btnOriginalScreen.className = 'px-2 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition';
    } else if (currentFitMode === 'fill') {
      screenVideo.className = 'w-full h-full rounded-2xl shadow-2xl object-fill bg-black border border-slate-800 transition-all';
      btnFitScreen.className = 'px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition flex items-center space-x-1';
      btnFillScreen.className = 'px-2.5 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-500 transition flex items-center space-x-1';
      btnOriginalScreen.className = 'px-2 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition';
    } else if (currentFitMode === 'original') {
      screenVideo.className = 'rounded-2xl shadow-2xl bg-black border border-slate-800 transition-all';
      btnFitScreen.className = 'px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition flex items-center space-x-1';
      btnFillScreen.className = 'px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition flex items-center space-x-1';
      btnOriginalScreen.className = 'px-2 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-500 transition';
    }

    if (laser) {
      laser.resizeCanvas();
    }
  }

  btnFitScreen.addEventListener('click', () => {
    currentFitMode = 'contain';
    currentZoom = 1.0;
    updateScreenDisplay();
  });

  btnFillScreen.addEventListener('click', () => {
    currentFitMode = 'fill';
    currentZoom = 1.0;
    updateScreenDisplay();
  });

  btnOriginalScreen.addEventListener('click', () => {
    currentFitMode = 'original';
    currentZoom = 1.0;
    updateScreenDisplay();
  });

  btnZoomIn.addEventListener('click', () => {
    if (currentZoom < 2.5) {
      currentZoom = +(currentZoom + 0.25).toFixed(2);
      updateScreenDisplay();
    }
  });

  btnZoomOut.addEventListener('click', () => {
    if (currentZoom > 0.5) {
      currentZoom = +(currentZoom - 0.25).toFixed(2);
      updateScreenDisplay();
    }
  });

  btnFullscreen.addEventListener('click', () => {
    if (!document.fullscreenElement) {
      videoWrapper.requestFullscreen().catch((err) => console.warn(err));
    } else {
      document.exitFullscreen().catch((err) => console.warn(err));
    }
  });

  window.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if (e.key === 'f' || e.key === 'F') {
      btnFullscreen.click();
    }
  });

  // Miniatura PiP opcional
  let isPipOpen = false;
  btnTogglePipPreview.addEventListener('click', () => {
    isPipOpen = !isPipOpen;
    if (isPipOpen) {
      pipPreviewContainer.classList.remove('hidden');
      pipBtnText.textContent = 'Ocultar Miniatura';
      if (webrtc && webrtc.localScreenStream) {
        pipVideo.srcObject = webrtc.localScreenStream;
      }
    } else {
      pipPreviewContainer.classList.add('hidden');
      pipBtnText.textContent = 'Ver Miniatura';
    }
  });

  btnStopShareCard.addEventListener('click', () => toggleScreenShare());

  function handleRemoteVideo(peerId, stream) {
    const user = participants.get(peerId);
    sharerNameText.textContent = `Pantalla de: ${user ? user.name : 'Compañero'}`;

    screenVideo.muted = true;
    if ('latencyHint' in screenVideo) {
      screenVideo.latencyHint = 0;
    }
    screenVideo.srcObject = stream;
    screenVideo.play().catch((e) => console.warn('Error al reproducir video:', e));

    idleScreen.classList.add('hidden');
    sharerActiveCard.classList.add('hidden');
    videoWrapper.classList.remove('hidden');

    currentZoom = 1.0;
    currentFitMode = userSettings.defaultScale || 'contain';
    updateScreenDisplay();

    if (laser) {
      laser.clearCanvas();
      laser.resizeCanvas();
    }
    showToast(`Mostrando pantalla de ${user ? user.name : 'compañero'}`, 'success');
  }

  function checkScreenSharingState() {
    let remoteSharing = false;
    for (const user of participants.values()) {
      if (user.isScreenSharing) {
        remoteSharing = true;
        break;
      }
    }

    if (!remoteSharing) {
      screenVideo.srcObject = null;
      videoWrapper.classList.add('hidden');
      if (laser) laser.clearCanvas();

      if (isSharingScreen) {
        if (userSettings.antiMirror) {
          sharerActiveCard.classList.remove('hidden');
          idleScreen.classList.add('hidden');
        } else {
          sharerActiveCard.classList.add('hidden');
          idleScreen.classList.add('hidden');
          videoWrapper.classList.remove('hidden');
        }
      } else {
        sharerActiveCard.classList.add('hidden');
        idleScreen.classList.remove('hidden');
      }
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

  // ================= 8. TARJETAS DE LLAMADA DE VOZ Y PARTICIPANTES =================
  function renderParticipants() {
    const totalCount = participants.size + 1;
    participantsCount.textContent = `${totalCount} en sesión`;

    participantsBar.innerHTML = '';

    // Mi Tarjeta de Llamada con Ecualizador
    const myCard = document.createElement('div');
    myCard.id = 'myParticipantCard';
    myCard.className = 'px-3.5 py-2 rounded-2xl glass-panel border border-slate-700/70 text-xs text-white flex items-center space-x-2.5 shrink-0 shadow-lg transition-all duration-200';
    myCard.innerHTML = `
      <div class="w-7 h-7 rounded-xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center font-bold text-[10px] text-indigo-300">
        ${(myUser ? myUser.name : 'Tú').substring(0, 2).toUpperCase()}
      </div>
      <div>
        <div class="font-semibold flex items-center space-x-1.5">
          <span>${myUser ? myUser.name : 'Tú'} (Tú)</span>
          ${isSharingScreen ? '<i data-lucide="monitor" class="w-3 h-3 text-indigo-400"></i>' : ''}
        </div>
        <div class="text-[10px] text-slate-400 font-mono">ID: ${formatDeviceId(myDeviceId)}</div>
      </div>
      <!-- Ecualizador de Voz -->
      <div class="voice-eq flex items-center space-x-0.5 h-3.5 px-1 opacity-25 transition-opacity">
        <span class="w-1 bg-emerald-400 rounded-full eq-bar-1 h-2"></span>
        <span class="w-1 bg-emerald-400 rounded-full eq-bar-2 h-3.5"></span>
        <span class="w-1 bg-emerald-400 rounded-full eq-bar-3 h-1.5"></span>
      </div>
    `;
    participantsBar.appendChild(myCard);

    // Tarjetas de Participantes Remotos
    participants.forEach((user) => {
      const peerCard = document.createElement('div');
      peerCard.id = `peerCard-${user.id}`;
      peerCard.className = 'px-3.5 py-2 rounded-2xl glass-panel border border-slate-700/70 text-xs text-slate-200 flex items-center space-x-2.5 shrink-0 shadow-lg transition-all duration-200';
      peerCard.innerHTML = `
        <div class="w-7 h-7 rounded-xl bg-emerald-600/30 border border-emerald-500/40 flex items-center justify-center font-bold text-[10px] text-emerald-300">
          ${user.name.substring(0, 2).toUpperCase()}
        </div>
        <div>
          <div class="font-semibold flex items-center space-x-1.5">
            <span>${user.name}</span>
            ${user.isScreenSharing ? '<i data-lucide="monitor" class="w-3 h-3 text-indigo-400"></i>' : ''}
          </div>
          <div class="text-[10px] text-slate-400 font-mono">Conectado</div>
        </div>
        <!-- Ecualizador de Voz Remoto -->
        <div class="voice-eq flex items-center space-x-0.5 h-3.5 px-1 opacity-25 transition-opacity">
          <span class="w-1 bg-emerald-400 rounded-full eq-bar-1 h-2"></span>
          <span class="w-1 bg-emerald-400 rounded-full eq-bar-2 h-3.5"></span>
          <span class="w-1 bg-emerald-400 rounded-full eq-bar-3 h-1.5"></span>
        </div>
      `;
      participantsBar.appendChild(peerCard);
    });

    if (window.lucide) lucide.createIcons();
  }

  // Compartir Pantalla con Ajustes de FPS y Anti-Espejo
  async function toggleScreenShare() {
    if (!webrtc) return;

    if (isSharingScreen) {
      await webrtc.stopScreenShare();
      isSharingScreen = false;
      screenText.textContent = 'Compartir Pantalla';
      btnToggleScreen.classList.remove('bg-rose-600', 'hover:bg-rose-500');
      btnToggleScreen.classList.add('bg-indigo-600', 'hover:bg-indigo-500');

      sharerActiveCard.classList.add('hidden');
      pipPreviewContainer.classList.add('hidden');
      isPipOpen = false;
      pipBtnText.textContent = 'Ver Miniatura';
      pipVideo.srcObject = null;

      socket.emit('screen-share-status', { isSharing: false });
      checkScreenSharingState();
      showToast('Dejaste de compartir pantalla', 'info');
    } else {
      const targetFps = parseInt(userSettings.screenFps, 10) || 60;
      const stream = await webrtc.startScreenShare(async () => {
        isSharingScreen = false;
        screenText.textContent = 'Compartir Pantalla';
        btnToggleScreen.classList.remove('bg-rose-600', 'hover:bg-rose-500');
        btnToggleScreen.classList.add('bg-indigo-600', 'hover:bg-indigo-500');

        sharerActiveCard.classList.add('hidden');
        pipPreviewContainer.classList.add('hidden');
        isPipOpen = false;
        pipBtnText.textContent = 'Ver Miniatura';
        pipVideo.srcObject = null;

        socket.emit('screen-share-status', { isSharing: false });
        checkScreenSharingState();
      }, targetFps);

      if (stream) {
        isSharingScreen = true;
        screenText.textContent = 'Detener Pantalla';
        btnToggleScreen.classList.remove('bg-indigo-600', 'hover:bg-indigo-500');
        btnToggleScreen.classList.add('bg-rose-600', 'hover:bg-rose-500');

        if (userSettings.antiMirror) {
          idleScreen.classList.add('hidden');
          videoWrapper.classList.add('hidden');
          sharerActiveCard.classList.remove('hidden');
        }

        socket.emit('screen-share-status', { isSharing: true });
        showToast('Transmitiendo en vivo' + (userSettings.antiMirror ? ' (Modo Anti-Espejo activo)' : ''), 'success');
      }
    }
    renderParticipants();
  }

  btnToggleScreen.addEventListener('click', toggleScreenShare);
  btnStartShareIdle.addEventListener('click', toggleScreenShare);

  // Silenciar / Activar Micrófono
  btnToggleMic.addEventListener('click', () => {
    if (!webrtc) return;
    const isUnmuted = webrtc.toggleMicrophone();
    if (isUnmuted) {
      micIcon.className = 'w-4 h-4 text-emerald-400';
      micText.textContent = 'Micrófono';
    } else {
      micIcon.className = 'w-4 h-4 text-rose-400';
      micText.textContent = 'Silenciado';
    }
    renderParticipants();
  });

  window.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if (e.key === 'm' || e.key === 'M') {
      btnToggleMic.click();
    }
  });

  // Puntero Láser
  btnToggleLaser.addEventListener('click', () => {
    if (!laser) return;
    laser.isActive = !laser.isActive;
    if (laser.isActive) {
      btnToggleLaser.classList.add('border-indigo-500/80', 'bg-indigo-950/40');
      pointerModeIndicator.classList.remove('hidden');
    } else {
      btnToggleLaser.classList.remove('border-indigo-500/80', 'bg-indigo-950/40');
      pointerModeIndicator.classList.add('hidden');
    }
  });

  btnClearCanvas.addEventListener('click', () => {
    if (laser) {
      laser.clearCanvas();
      showToast('Anotaciones limpiadas', 'info');
    }
  });

  // Enlace de Invitación
  function copyInviteLink() {
    const inviteUrl = `${window.location.origin}/?connect=${myDeviceId}`;
    navigator.clipboard.writeText(inviteUrl).then(() => {
      showToast('📋 Enlace de conexión copiado', 'success');
    }).catch(() => {
      prompt('Copia este enlace para invitar:', inviteUrl);
    });
  }

  btnCopyInvite.addEventListener('click', copyInviteLink);
  btnQuickCopy.addEventListener('click', copyInviteLink);

  // Chat Lateral
  function toggleChat() {
    isChatOpen = !isChatOpen;
    if (isChatOpen) {
      chatSidebar.classList.remove('translate-x-full');
      unreadChatCount = 0;
      chatBadge.classList.add('hidden');
      setTimeout(() => chatInput.focus(), 150);
      chatMessages.scrollTop = chatMessages.scrollHeight;
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
