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

  // Banner de Invitación Directa
  const inviteBanner = document.getElementById('inviteBanner');
  const inviteTargetDisplay = document.getElementById('inviteTargetDisplay');
  const btnAcceptInviteDirect = document.getElementById('btnAcceptInviteDirect');

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
  const btnToggleRaiseHand = document.getElementById('btnToggleRaiseHand');
  const handIcon = document.getElementById('handIcon');
  const handText = document.getElementById('handText');

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

  // Nuevos Elementos: Libreta de Direcciones / Historial
  const savedSessionsSection = document.getElementById('savedSessionsSection');
  const savedSessionsGrid = document.getElementById('savedSessionsGrid');
  const savedSessionsCount = document.getElementById('savedSessionsCount');

  // Grabador de Sesión
  const btnRecordSession = document.getElementById('btnRecordSession');
  const recDot = document.getElementById('recDot');
  const recText = document.getElementById('recText');
  const recTimer = document.getElementById('recTimer');

  // Pestañas Multi-Pantalla
  const multiScreenTabsBar = document.getElementById('multiScreenTabsBar');
  const multiScreenTabs = document.getElementById('multiScreenTabs');
  const btnToggleMirrorShield = document.getElementById('btnToggleMirrorShield');
  const btnShowLiveStage = document.getElementById('btnShowLiveStage');
  const btnVideoControlAction = document.getElementById('btnVideoControlAction');
  const btnVideoControlText = document.getElementById('btnVideoControlText');
  const btnVideoControlIcon = document.getElementById('btnVideoControlIcon');
  const videoControlDropdown = document.getElementById('videoControlDropdown');

  // Panel Lateral de Participantes & Moderación
  const btnToggleParticipants = document.getElementById('btnToggleParticipants');
  const btnToggleParticipantsDock = document.getElementById('btnToggleParticipantsDock');
  const btnCloseParticipants = document.getElementById('btnCloseParticipants');
  const participantsSidebar = document.getElementById('participantsSidebar');
  const participantsListDrawer = document.getElementById('participantsListDrawer');
  const activeControllerBadge = document.getElementById('activeControllerBadge');
  const btnMuteAllUsers = document.getElementById('btnMuteAllUsers');
  const btnRevokeControlAll = document.getElementById('btnRevokeControlAll');
  const revokeControlContainer = document.getElementById('revokeControlContainer');

  // Estado Global de Moderación y Sala
  let isHost = false;
  let authorizedControllerId = null;
  let isMyHandRaised = false;

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
    antiMirror: false, // Por defecto mostrar video en vivo siempre
    echoCancellation: true,
    noiseSuppression: true
  };

  let userSettings = { ...defaultSettings };
  try {
    const saved = localStorage.getItem('conecty_settings');
    if (saved) {
      userSettings = { ...defaultSettings, ...JSON.parse(saved) };
    }
    // Migración transparente: asegurar que por defecto muestre el video en vivo
    if (localStorage.getItem('conecty_antimirror_v2') !== 'true') {
      userSettings.antiMirror = false;
      localStorage.setItem('conecty_antimirror_v2', 'true');
      localStorage.setItem('conecty_settings', JSON.stringify(userSettings));
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

  // ================= GESTIÓN DE SESIONES GUARDADAS (LIBRETA DE DIRECCIONES) =================
  function getSavedSessions() {
    try {
      const data = localStorage.getItem('conecty_saved_sessions');
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }

  function saveSessionToHistory(deviceId, name) {
    if (!deviceId) return;
    const clean = deviceId.toString().replace(/\D/g, '');
    if (clean.length !== 9 || clean === myDeviceId) return;

    let sessions = getSavedSessions();
    const existingIndex = sessions.findIndex(s => s.deviceId === clean);

    if (existingIndex >= 0) {
      sessions[existingIndex].lastConnected = new Date().toISOString();
      if (!sessions[existingIndex].customAlias && name) {
        sessions[existingIndex].customAlias = name;
      }
    } else {
      sessions.unshift({
        deviceId: clean,
        originalName: name || ('Equipo-' + clean.substring(0, 4)),
        customAlias: name || ('Equipo-' + clean.substring(0, 4)),
        lastConnected: new Date().toISOString()
      });
    }

    if (sessions.length > 20) sessions = sessions.slice(0, 20);
    localStorage.setItem('conecty_saved_sessions', JSON.stringify(sessions));
    renderSavedSessions();
  }

  function updateSessionAlias(deviceId, newAlias) {
    let sessions = getSavedSessions();
    const item = sessions.find(s => s.deviceId === deviceId);
    if (item && newAlias && newAlias.trim()) {
      item.customAlias = newAlias.trim();
      localStorage.setItem('conecty_saved_sessions', JSON.stringify(sessions));
      renderSavedSessions();
      showToast('Nombre actualizado: ' + item.customAlias, 'success');
    }
  }

  function deleteSavedSession(deviceId) {
    let sessions = getSavedSessions().filter(s => s.deviceId !== deviceId);
    localStorage.setItem('conecty_saved_sessions', JSON.stringify(sessions));
    renderSavedSessions();
    showToast('Equipo eliminado del historial', 'info');
  }

  function renderSavedSessions() {
    if (!savedSessionsGrid) return;
    const sessions = getSavedSessions();

    if (sessions.length === 0) {
      savedSessionsSection.classList.add('hidden');
      return;
    }

    savedSessionsSection.classList.remove('hidden');
    savedSessionsCount.textContent = sessions.length + (sessions.length === 1 ? ' equipo' : ' equipos');
    savedSessionsGrid.innerHTML = '';

    sessions.forEach((s) => {
      const card = document.createElement('div');
      card.className = 'p-3.5 rounded-2xl bg-slate-900/80 border border-slate-700/70 flex items-center justify-between hover:border-indigo-500/40 transition group';
      
      const dateStr = new Date(s.lastConnected).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

      card.innerHTML = `
        <div class="flex items-center space-x-3 overflow-hidden">
          <div class="w-9 h-9 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-500/30">
            <i data-lucide="laptop" class="w-4 h-4"></i>
          </div>
          <div class="overflow-hidden">
            <div class="flex items-center space-x-1.5">
              <span class="font-bold text-white text-xs truncate">${escapeHtml(s.customAlias)}</span>
              <button class="btn-edit-alias opacity-0 group-hover:opacity-100 text-slate-400 hover:text-indigo-400 transition" title="Renombrar alias">
                <i data-lucide="edit-2" class="w-3 h-3"></i>
              </button>
            </div>
            <div class="text-[10px] text-slate-400 font-mono">${formatDeviceId(s.deviceId)} • ${dateStr}</div>
          </div>
        </div>
        <div class="flex items-center space-x-1.5 shrink-0 ml-2">
          <button class="btn-quick-connect px-2.5 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white text-xs font-semibold border border-emerald-500/30 transition flex items-center space-x-1">
            <i data-lucide="arrow-right" class="w-3 h-3"></i>
            <span>Conectar</span>
          </button>
          <button class="btn-del-session p-1.5 rounded-xl hover:bg-slate-800 text-slate-500 hover:text-rose-400 transition" title="Eliminar del historial">
            <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
          </button>
        </div>
      `;

      card.querySelector('.btn-quick-connect').addEventListener('click', () => {
        targetDeviceIdInput.value = formatDeviceId(s.deviceId);
        connectRemoteForm.dispatchEvent(new Event('submit'));
      });

      card.querySelector('.btn-edit-alias').addEventListener('click', () => {
        const alias = prompt('Introduce un nombre para identificar este equipo:', s.customAlias);
        if (alias) updateSessionAlias(s.deviceId, alias);
      });

      card.querySelector('.btn-del-session').addEventListener('click', () => {
        if (confirm('¿Eliminar ' + s.customAlias + ' del historial?')) {
          deleteSavedSession(s.deviceId);
        }
      });

      savedSessionsGrid.appendChild(card);
    });

    if (window.lucide) lucide.createIcons();
  }

  renderSavedSessions();


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
  const targetToConnect = connectParam || (roomParam ? roomParam.replace(/^device-/, '') : null);
  if (targetToConnect) {
    const cleanTargetId = targetToConnect.replace(/\D/g, '');
    if (cleanTargetId && cleanTargetId !== myDeviceId) {
      targetDeviceIdInput.value = formatDeviceId(cleanTargetId);
      if (inviteBanner && inviteTargetDisplay) {
        inviteBanner.classList.remove('hidden');
        inviteTargetDisplay.textContent = formatDeviceId(cleanTargetId);
      }
    }
  }

  if (btnAcceptInviteDirect) {
    btnAcceptInviteDirect.addEventListener('click', () => {
      connectRemoteForm.dispatchEvent(new Event('submit'));
    });
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
    handRaised() {
      this.playTone(659.25, 'sine', 0.1);
      setTimeout(() => this.playTone(880, 'sine', 0.15), 100);
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
    transports: ['websocket', 'polling'],
    upgrade: true
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
          } else if (data.type === 'mouse-control-changed') {
            applyMouseControlChanged(data.authorizedUserId, data.authorizedUserName);
          }
        }
      });

      setupRoomSocketEvents();
    }

    // Unirse a la sala de inmediato para evitar demoras
    socket.emit('join-room', {
      roomId,
      userName,
      deviceId: myDeviceId
    });

    lobbyView.classList.add('hidden');
    roomView.classList.remove('hidden');

    soundEffects.join();
    showToast(`Conectado al puesto ${formatDeviceId(cleanRoomDisplay)}`, 'success');
    saveSessionToHistory(cleanRoomDisplay, 'Puesto-' + cleanRoomDisplay.substring(0, 4));
    renderParticipantsDrawer();

    // Inicializar micrófono local en segundo plano para no bloquear la conexión
    if (webrtc && !webrtc.localAudioStream) {
      webrtc.initLocalAudio().then((audioStream) => {
        if (audioStream) {
          showToast('🎙️ Micrófono listo y llamada de voz activa', 'success');
          monitorLocalVoice(audioStream);
        } else {
          showToast('⚠️ No se detectó micrófono. Podrás escuchar la llamada.', 'info');
        }
      }).catch((e) => console.warn('Audio local no disponible:', e));
    }
  }

  // ================= 6. MODO CONTROL REMOTO DE RATÓN Y TECLADO =================
  let isAgentActive = false;
  let lastSocketMoveTime = 0;
  const seenRemoteControlEvents = new Set();

  function updateAgentStatusUI(active) {
    isAgentActive = active;
    const badge = document.getElementById('agentStatusBadge');
    const alertBox = document.getElementById('agentConnectedAlert');
    const actionsRow = document.getElementById('agentActionsRow');
    const desc = document.getElementById('agentStatusDesc');
    const bannerText = document.getElementById('remoteControlBannerText');

    if (badge) {
      if (active) {
        badge.textContent = '🟢 Asistente Conectado';
        badge.className = 'px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-950 text-emerald-300 border border-emerald-600/60';
      } else {
        badge.textContent = 'Asistente No Conectado';
        badge.className = 'px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-400 border border-slate-700';
      }
    }
    if (alertBox) {
      alertBox.classList.toggle('hidden', !active);
    }
    if (actionsRow) {
      actionsRow.classList.toggle('hidden', active);
    }
    if (desc) {
      desc.classList.toggle('hidden', active);
    }
    if (bannerText) {
      bannerText.textContent = active 
        ? '🟢 Control Remoto Total (Windows OS Habilitado)' 
        : '🎮 Modo Control Remoto Activo';
    }
  }

  // Asistente Nativo de Control Remoto de Windows (.bat)
  const btnDownloadAgentCard = document.getElementById('btnDownloadAgentCard');
  const btnCopyAgentCode = document.getElementById('btnCopyAgentCode');
  const btnDownloadAgentSettings = document.getElementById('btnDownloadAgentSettings');

  const downloadAgentHandler = () => {
    const url = `/api/download-agent?deviceId=${myDeviceId || ''}`;
    window.location.href = url;
    showToast('Descargando Conecty-Control.bat...', 'success');
  };

  const copyAgentCommandHandler = () => {
    const cmd = `node agent/conecty-agent.js ${window.location.origin} ${myDeviceId}`;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(cmd).then(() => {
        showToast('📋 Comando copiado al portapapeles', 'success');
      }).catch(() => {
        prompt('Copia este comando:', cmd);
      });
    } else {
      prompt('Copia este comando:', cmd);
    }
  };

  if (btnDownloadAgentCard) btnDownloadAgentCard.addEventListener('click', downloadAgentHandler);
  if (btnDownloadAgentSettings) btnDownloadAgentSettings.addEventListener('click', downloadAgentHandler);
  if (btnCopyAgentCode) btnCopyAgentCode.addEventListener('click', copyAgentCommandHandler);
  if (btnCopyAgentCmd) btnCopyAgentCmd.addEventListener('click', copyAgentCommandHandler);

  function sendRemoteControlEvent(actionData) {
    if (!isRemoteControlActive) return;
    const payload = {
      type: 'remote-control',
      id: Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      ...actionData
    };

    // 1. Siempre emitir por WebRTC DataChannel (para latencia ultrabaja en navegador)
    if (webrtc) {
      webrtc.broadcastData(payload);
    }

    // 2. Transmitir por Socket.io (para que el Asistente Nativo de Windows ejecute clics reales en el SO)
    if (socket) {
      if (actionData.type === 'move') {
        const now = Date.now();
        if (now - lastSocketMoveTime > 30) {
          lastSocketMoveTime = now;
          socket.emit('remote-control', payload);
        }
      } else {
        // Clics físicos, rueda de scroll y pulsaciones de teclas se envían de inmediato
        socket.emit('remote-control', payload);
      }
    }
  }

  function handleIncomingRemoteControl(data, senderId) {
    // Si el anfitrión no permite el control remoto, ignorar
    if (!userSettings.allowControl || (toggleHostAllowControl && !toggleHostAllowControl.checked)) {
      return;
    }

    // Deduplicación para evitar ejecutar dos veces si llega por WebRTC y WebSocket
    if (data.id) {
      if (seenRemoteControlEvents.has(data.id)) return;
      seenRemoteControlEvents.add(data.id);
      if (seenRemoteControlEvents.size > 200) {
        const first = seenRemoteControlEvents.values().next().value;
        seenRemoteControlEvents.delete(first);
      }
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
      // Si el modo láser estaba activo, desactivarlo para evitar conflicto
      if (laser && laser.isActive) {
        laser.isActive = false;
        btnToggleLaser.classList.remove('border-indigo-500/80', 'bg-indigo-950/40');
        pointerModeIndicator.classList.add('hidden');
      }

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
      laser.addRipple(coords.x, coords.y, '#10b981');
      sendRemoteControlEvent({ type: 'mousedown', button: e.button, x: coords.x, y: coords.y });
    }
  });

  laserCanvas.addEventListener('mouseup', (e) => {
    if (!isRemoteControlActive || !laser) return;
    const coords = laser.normalizeCoords(e.clientX, e.clientY);
    if (coords.inside) {
      sendRemoteControlEvent({ type: 'mouseup', button: e.button, x: coords.x, y: coords.y });
    }
  });

  laserCanvas.addEventListener('click', (e) => {
    if (!isRemoteControlActive || !laser) return;
    const coords = laser.normalizeCoords(e.clientX, e.clientY);
    if (coords.inside) {
      sendRemoteControlEvent({ type: 'click', button: e.button, x: coords.x, y: coords.y });
    }
  });

  laserCanvas.addEventListener('dblclick', (e) => {
    if (!isRemoteControlActive || !laser) return;
    const coords = laser.normalizeCoords(e.clientX, e.clientY);
    if (coords.inside) {
      laser.addRipple(coords.x, coords.y, '#10b981');
      sendRemoteControlEvent({ type: 'dblclick', button: e.button, x: coords.x, y: coords.y });
    }
  });

  laserCanvas.addEventListener('contextmenu', (e) => {
    if (!isRemoteControlActive || !laser) return;
    e.preventDefault(); // Prevenir menú contextual del navegador
    const coords = laser.normalizeCoords(e.clientX, e.clientY);
    if (coords.inside) {
      laser.addRipple(coords.x, coords.y, '#3b82f6');
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

    socket.on('room-joined', ({ user, existingUsers, hostId }) => {
      myUser = user;
      isHost = (user.isHost || hostId === socket.id);
      updateParticipantsList(existingUsers);
      renderParticipantsDrawer();

      const hasAgent = existingUsers.some((u) => u.isAgent || u.name === 'Windows-Native-Agent');
      if (hasAgent) {
        updateAgentStatusUI(true);
      }

      existingUsers.forEach((existing) => {
        if (existing.id !== socket.id && !existing.isAgent && existing.name !== 'Windows-Native-Agent') {
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

    socket.on('mouse-control-changed', ({ authorizedUserId, authorizedUserName }) => {
      applyMouseControlChanged(authorizedUserId, authorizedUserName);
    });

    socket.on('force-mute', () => {
      if (webrtc && !webrtc.isMicMuted) {
        webrtc.toggleMicrophone();
        micIcon.className = 'w-4 h-4 text-rose-400';
        micText.textContent = 'Silenciado';
        showToast('🔇 El moderador ha silenciado tu micrófono', 'info');
        renderParticipants();
      }
    });

    socket.on('kicked-from-room', () => {
      alert('Has sido expulsado de la sesión por el moderador.');
      window.location.href = '/';
    });

    socket.on('host-changed', ({ newHostId, newHostName }) => {
      isHost = (newHostId === socket.id);
      showToast('👑 ' + (isHost ? 'Ahora eres el anfitrión de la sala' : newHostName + ' es el nuevo anfitrión'), 'info');
      renderParticipantsDrawer();
      updateVideoControlButton();
    });

    socket.on('user-hand-updated', ({ userId, userName, isHandRaised, loweredByHost }) => {
      const user = participants.get(userId);
      if (user) {
        user.isHandRaised = isHandRaised;
      }
      if (userId === socket.id) {
        updateMyHandUI(isHandRaised);
        if (loweredByHost) {
          showToast('✋ El anfitrión bajó tu mano', 'info');
        }
      } else {
        if (isHandRaised) {
          soundEffects.handRaised();
          showToast(`✋ ${userName} levantó la mano para hablar`, 'info');
        }
      }
      renderParticipants();
    });

    socket.on('user-connected', async (user) => {
      if (user.isAgent || user.name === 'Windows-Native-Agent') {
        updateAgentStatusUI(true);
        showToast('⚡ Asistente de Windows conectado: Clics físicos listos', 'success');
        return;
      }

      soundEffects.join();
      showToast(`${user.name} se conectó a la sesión`, 'info');
      participants.set(user.id, user);
      renderParticipants();

      if (isSharingScreen && webrtc && webrtc.localScreenStream) {
        await webrtc.shareScreenWithPeer(user.id);
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
      if (!isSharing) {
        unregisterActiveScreen(userId);
      }
      renderParticipants();
      checkScreenSharingState();
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

    socket.on('user-disconnected', ({ userId, userName, isAgent }) => {
      if (isAgent || userName === 'Windows-Native-Agent') {
        updateAgentStatusUI(false);
        showToast('Asistente de Windows desconectado', 'info');
        return;
      }
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
      screenVideo.className = 'rounded-2xl shadow-2xl object-none bg-black border border-slate-800 transition-all';
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
        pipVideo.play().catch(() => {});
      }
    } else {
      pipPreviewContainer.classList.add('hidden');
      pipBtnText.textContent = 'Ver Miniatura';
    }
  });

  btnStopShareCard.addEventListener('click', () => toggleScreenShare());

  if (btnToggleMirrorShield) {
    btnToggleMirrorShield.addEventListener('click', () => {
      videoWrapper.classList.add('hidden');
      sharerActiveCard.classList.remove('hidden');
      showToast('Modo Anti-Espejo activado. Tu pantalla se sigue transmitiendo.', 'info');
    });
  }

  if (btnShowLiveStage) {
    btnShowLiveStage.addEventListener('click', () => {
      sharerActiveCard.classList.add('hidden');
      videoWrapper.classList.remove('hidden');
      if (currentActiveScreenId && activeScreens.has(currentActiveScreenId)) {
        selectActiveScreen(currentActiveScreenId);
      } else if (webrtc && webrtc.localScreenStream) {
        selectActiveScreen('local');
      }
    });
  }

  function handleRemoteVideo(peerId, stream) {
    const user = participants.get(peerId);
    const userName = user ? user.name : 'Compañero';

    // Limpiar automáticamente cuando el track de video remoto finalice
    stream.getVideoTracks().forEach((track) => {
      track.onended = () => {
        unregisterActiveScreen(peerId);
      };
    });

    registerActiveScreen(peerId, stream, userName);
    selectActiveScreen(peerId);
    showToast(`Mostrando pantalla de ${userName}`, 'success');
  }

  function checkScreenSharingState() {
    // Purgar de activeScreens cualquier stream que no tenga tracks vivos
    for (const [id, sData] of activeScreens.entries()) {
      if (!sData.stream || sData.stream.getVideoTracks().length === 0 || sData.stream.getVideoTracks().every((t) => t.readyState === 'ended')) {
        activeScreens.delete(id);
      }
    }
    renderMultiScreenTabs();

    if (activeScreens.size > 0) {
      if (!currentActiveScreenId || !activeScreens.has(currentActiveScreenId)) {
        const nextId = activeScreens.keys().next().value;
        selectActiveScreen(nextId);
      }
    } else {
      currentActiveScreenId = null;
      if (screenVideo) {
        screenVideo.srcObject = null;
      }
      videoWrapper.classList.add('hidden');
      sharerActiveCard.classList.add('hidden');
      if (btnToggleMirrorShield) btnToggleMirrorShield.classList.add('hidden');
      idleScreen.classList.remove('hidden');
      if (laser) laser.clearCanvas();
      if (multiScreenTabsBar) multiScreenTabsBar.classList.add('hidden');
    }
    updateVideoControlButton();
  }

  function updateParticipantsList(users) {
    participants.clear();
    users.forEach((u) => {
      if (!u.isAgent && u.name !== 'Windows-Native-Agent' && u.id !== socket.id) {
        participants.set(u.id, u);
      }
    });
    renderParticipants();
  }

  function removeParticipant(peerId) {
    participants.delete(peerId);
    unregisterActiveScreen(peerId);
    renderParticipantsDrawer();
    const audioElement = document.getElementById(`audio-${peerId}`);
    if (audioElement) audioElement.remove();
    renderParticipants();
    checkScreenSharingState();
  }

  // ================= 8. TARJETAS DE LLAMADA DE VOZ Y PARTICIPANTES =================
  function renderParticipants() {
    const totalCount = participants.size + 1;
    participantsCount.textContent = `${totalCount} en sesión`;
    renderParticipantsDrawer();

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
      if (btnToggleMirrorShield) btnToggleMirrorShield.classList.add('hidden');
      pipPreviewContainer.classList.add('hidden');
      isPipOpen = false;
      pipBtnText.textContent = 'Miniatura Flotante';
      pipVideo.srcObject = null;

      unregisterActiveScreen('local');
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
        if (btnToggleMirrorShield) btnToggleMirrorShield.classList.add('hidden');
        pipPreviewContainer.classList.add('hidden');
        isPipOpen = false;
        pipBtnText.textContent = 'Miniatura Flotante';
        pipVideo.srcObject = null;

        unregisterActiveScreen('local');
        socket.emit('screen-share-status', { isSharing: false });
        checkScreenSharingState();
      }, targetFps);

      if (stream) {
        isSharingScreen = true;
        screenText.textContent = 'Detener Pantalla';
        btnToggleScreen.classList.remove('bg-indigo-600', 'hover:bg-indigo-500');
        btnToggleScreen.classList.add('bg-rose-600', 'hover:bg-rose-500');

        registerActiveScreen('local', stream, 'Mi Pantalla (Tú)');
        selectActiveScreen('local');

        if (userSettings.antiMirror) {
          videoWrapper.classList.add('hidden');
          sharerActiveCard.classList.remove('hidden');
        }

        socket.emit('screen-share-status', { isSharing: true });
        showToast('Transmitiendo en vivo', 'success');
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
      // Si el control remoto estaba activo, desactivarlo para evitar conflicto
      if (isRemoteControlActive) {
        isRemoteControlActive = false;
        btnToggleControl.classList.add('bg-slate-800', 'text-slate-200');
        btnToggleControl.classList.remove('bg-emerald-600', 'text-white', 'border-emerald-500/80');
        controlIcon.className = 'w-4 h-4 text-slate-400';
        remoteControlBanner.classList.add('hidden');
      }

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


  // ================= GRABADOR DE SESIÓN (PANTALLA + AUDIO) =================
  let mediaRecorder = null;
  let recordedChunks = [];
  let recInterval = null;
  let recSeconds = 0;
  let isRecording = false;

  function formatRecTime(sec) {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return m + ':' + s;
  }

  async function toggleSessionRecording() {
    if (isRecording) {
      stopRecording();
    } else {
      await startRecording();
    }
  }

  async function startRecording() {
    // Determinar stream a grabar
    let streamToRecord = null;
    if (screenVideo && screenVideo.srcObject && screenVideo.srcObject.getVideoTracks().length > 0) {
      streamToRecord = screenVideo.srcObject;
    } else if (webrtc && webrtc.localScreenStream) {
      streamToRecord = webrtc.localScreenStream;
    }

    if (!streamToRecord) {
      showToast('⚠️ No hay ninguna pantalla compartida activa para grabar', 'info');
      return;
    }

    try {
      // Combinar audio de la llamada si está disponible
      const tracks = [...streamToRecord.getVideoTracks()];
      if (webrtc && webrtc.localAudioStream) {
        tracks.push(...webrtc.localAudioStream.getAudioTracks());
      }
      const combinedStream = new MediaStream(tracks);

      let mimeType = 'video/webm;codecs=vp9,opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/webm;codecs=vp8,opus';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'video/webm';
        }
      }

      mediaRecorder = new MediaRecorder(combinedStream, { mimeType });
      recordedChunks = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          recordedChunks.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        if (recordedChunks.length === 0) return;
        const blob = new Blob(recordedChunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        a.download = 'Conecty-Grabacion-' + timestamp + '.webm';
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
        }, 100);
        showToast('💾 Grabación guardada y descargada con éxito', 'success');
      };

      mediaRecorder.start(1000); // Guardar chunk cada 1 segundo
      isRecording = true;
      recSeconds = 0;
      recTimer.textContent = '00:00';
      recTimer.classList.remove('hidden');
      recDot.classList.add('rec-pulse');
      recText.textContent = 'Detener';
      btnRecordSession.classList.remove('bg-slate-800/80');
      btnRecordSession.classList.add('bg-rose-950/70', 'border-rose-500/50', 'text-rose-300');

      recInterval = setInterval(() => {
        recSeconds++;
        recTimer.textContent = formatRecTime(recSeconds);
      }, 1000);

      showToast('🔴 Grabando sesión en curso...', 'info');
    } catch (err) {
      console.error('Error al iniciar grabación:', err);
      showToast('No se pudo iniciar la grabación: ' + err.message, 'error');
    }
  }

  function stopRecording() {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      isRecording = false;
      clearInterval(recInterval);
      recTimer.classList.add('hidden');
      recDot.classList.remove('rec-pulse');
      recText.textContent = 'Grabar';
      btnRecordSession.classList.add('bg-slate-800/80');
      btnRecordSession.classList.remove('bg-rose-950/70', 'border-rose-500/50', 'text-rose-300');
    }
  }

  if (btnRecordSession) {
    btnRecordSession.addEventListener('click', toggleSessionRecording);
  }


  // ================= SELECTOR DE MÚLTIPLES PANTALLAS COMPARTIDAS =================
  const activeScreens = new Map(); // id -> { stream, userName }
  let currentActiveScreenId = null;

  function registerActiveScreen(id, stream, userName) {
    activeScreens.set(id, { stream, userName });
    renderMultiScreenTabs();

    // Si no hay pantalla seleccionada o es la única, mostrarla
    if (!currentActiveScreenId || !activeScreens.has(currentActiveScreenId)) {
      selectActiveScreen(id);
    }
  }

  function unregisterActiveScreen(id) {
    activeScreens.delete(id);
    renderMultiScreenTabs();

    if (currentActiveScreenId === id) {
      if (activeScreens.size > 0) {
        const nextId = activeScreens.keys().next().value;
        selectActiveScreen(nextId);
      } else {
        currentActiveScreenId = null;
        checkScreenSharingState();
      }
    }
  }

  function selectActiveScreen(id) {
    const screenData = activeScreens.get(id);
    if (!screenData) return;

    currentActiveScreenId = id;
    screenVideo.muted = true;
    if ('latencyHint' in screenVideo) {
      screenVideo.latencyHint = 0;
    }
    screenVideo.srcObject = screenData.stream;
    screenVideo.play().catch((e) => console.warn('Error al reproducir video:', e));

    if (id === 'local') {
      sharerNameText.innerHTML = `
        <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse inline-block mr-1"></span>
        <span>Transmitiendo: Mi Pantalla (En vivo)</span>
      `;
      if (btnToggleMirrorShield) btnToggleMirrorShield.classList.remove('hidden');
    } else {
      sharerNameText.textContent = 'Pantalla de: ' + screenData.userName;
      if (btnToggleMirrorShield) btnToggleMirrorShield.classList.add('hidden');
    }

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

    renderMultiScreenTabs();
    updateVideoControlButton();
    if (window.lucide) lucide.createIcons();
  }

  function renderMultiScreenTabs() {
    if (!multiScreenTabsBar || !multiScreenTabs) return;

    if (activeScreens.size <= 1) {
      multiScreenTabsBar.classList.add('hidden');
      return;
    }

    multiScreenTabsBar.classList.remove('hidden');
    multiScreenTabs.innerHTML = '';

    activeScreens.forEach((data, id) => {
      const isSelected = id === currentActiveScreenId;
      const tab = document.createElement('button');
      tab.className = 'px-3 py-1 rounded-xl text-xs font-medium flex items-center space-x-1.5 transition ' +
        (isSelected ? 'bg-indigo-600 text-white font-semibold shadow-md' : 'bg-slate-800 text-slate-300 hover:bg-slate-700');
      tab.innerHTML = `
        <i data-lucide="monitor" class="w-3.5 h-3.5"></i>
        <span>${escapeHtml(data.userName)}</span>
        ${isSelected ? '<span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse ml-1"></span>' : ''}
      `;

      tab.addEventListener('click', () => selectActiveScreen(id));
      multiScreenTabs.appendChild(tab);
    });

    if (window.lucide) lucide.createIcons();
  }


  // ================= MODERACIÓN Y PANEL DE PARTICIPANTES (ESTILO GOOGLE MEET) =================
  const headerHandNotice = document.getElementById('headerHandNotice');
  const headerHandText = document.getElementById('headerHandText');

  function updateMyHandUI(isRaised) {
    isMyHandRaised = isRaised;
    if (!btnToggleRaiseHand) return;
    if (isRaised) {
      btnToggleRaiseHand.className = 'h-12 px-3.5 md:px-4 rounded-2xl bg-amber-500/25 text-amber-300 border border-amber-500/50 shadow-lg shadow-amber-500/20 font-medium text-xs flex items-center space-x-2 transition animate-pulse';
      if (handText) handText.textContent = 'Bajar Mano';
    } else {
      btnToggleRaiseHand.className = 'h-12 px-3.5 md:px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs flex items-center space-x-2 border border-slate-700 transition';
      if (handText) handText.textContent = 'Alzar Mano';
    }
  }

  if (btnToggleRaiseHand) {
    btnToggleRaiseHand.addEventListener('click', () => {
      const newState = !isMyHandRaised;
      updateMyHandUI(newState);
      if (socket) {
        socket.emit('toggle-raise-hand', { isRaised: newState });
      }
      if (newState) {
        soundEffects.handRaised();
        showToast('✋ Has levantado la mano para pedir la palabra', 'info');
      } else {
        showToast('Mano bajada', 'info');
      }
      renderParticipants();
    });
  }

  function toggleParticipantsSidebar() {
    if (!participantsSidebar) return;
    const isHidden = participantsSidebar.classList.contains('hidden');
    if (isHidden) {
      participantsSidebar.classList.remove('hidden');
      renderParticipantsDrawer();
    } else {
      participantsSidebar.classList.add('hidden');
    }
    setTimeout(() => {
      if (laser) laser.resizeCanvas();
    }, 250);
  }

  if (btnToggleParticipants) btnToggleParticipants.addEventListener('click', toggleParticipantsSidebar);
  if (btnToggleParticipantsDock) btnToggleParticipantsDock.addEventListener('click', toggleParticipantsSidebar);
  if (btnCloseParticipants) btnCloseParticipants.addEventListener('click', toggleParticipantsSidebar);

  function applyMouseControlChanged(authorizedUserId, authorizedUserName) {
    authorizedControllerId = authorizedUserId;
    const isMe = (authorizedUserId === socket.id);

    if (isMe) {
      isRemoteControlActive = true;
      btnToggleControl.classList.remove('bg-slate-800');
      btnToggleControl.classList.add('bg-emerald-600', 'hover:bg-emerald-500', 'text-white');
      if (laserCanvas) {
        laserCanvas.style.cursor = 'default';
      }
      if (remoteControlBanner) {
        remoteControlBanner.classList.remove('hidden');
        remoteControlBannerText.textContent = '🎮 ¡Tienes el control interactivo! Mueve el ratón y haz clic sobre la pantalla';
      }
      soundEffects.testChime();
      showToast('🎮 ¡Tienes el control interactivo del ratón y teclado!', 'success');
    } else {
      const canModerate = isHost || isSharingScreen;
      if (!canModerate) {
        isRemoteControlActive = false;
        btnToggleControl.classList.remove('bg-emerald-600', 'hover:bg-emerald-500', 'text-white');
        btnToggleControl.classList.add('bg-slate-800');
        if (laserCanvas) {
          laserCanvas.style.cursor = 'crosshair';
        }
        if (remoteControlBanner) {
          if (authorizedUserId) {
            remoteControlBanner.classList.remove('hidden');
            remoteControlBannerText.textContent = 'Control asignado a: ' + (authorizedUserName || 'Usuario');
          } else {
            remoteControlBanner.classList.add('hidden');
          }
        }
      }
    }

    renderParticipantsDrawer();
    updateVideoControlButton();
  }

  function updateVideoControlButton() {
    if (!btnVideoControlAction || !btnVideoControlText) return;
    const canModerate = isHost || isSharingScreen;

    if (canModerate) {
      if (authorizedControllerId) {
        const controllerUser = participants.get(authorizedControllerId);
        const name = controllerUser ? controllerUser.name : 'Usuario';
        btnVideoControlAction.className = 'px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md shadow-rose-600/30 flex items-center space-x-1.5 transition ml-1 animate-pulse';
        btnVideoControlText.textContent = `🚫 Quitar Control (${name})`;
        if (btnVideoControlIcon) btnVideoControlIcon.setAttribute('data-lucide', 'x-circle');
      } else {
        btnVideoControlAction.className = 'px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/30 flex items-center space-x-1.5 transition ml-1';
        btnVideoControlText.textContent = '🎮 Ceder Control';
        if (btnVideoControlIcon) btnVideoControlIcon.setAttribute('data-lucide', 'gamepad-2');
      }
    } else {
      if (authorizedControllerId === socket.id) {
        btnVideoControlAction.className = 'px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/30 flex items-center space-x-1.5 transition ml-1 animate-pulse';
        btnVideoControlText.textContent = '🎮 Control Activo (Tú)';
        if (btnVideoControlIcon) btnVideoControlIcon.setAttribute('data-lucide', 'gamepad-2');
      } else {
        btnVideoControlAction.className = 'px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 flex items-center space-x-1.5 transition ml-1';
        btnVideoControlText.textContent = isMyHandRaised ? '✋ Mano Alzada' : '🎮 Pedir Control';
        if (btnVideoControlIcon) btnVideoControlIcon.setAttribute('data-lucide', isMyHandRaised ? 'hand' : 'gamepad-2');
      }
    }
    if (window.lucide) lucide.createIcons();
  }

  function showVideoControlDropdown(remoteUsers) {
    if (!videoControlDropdown) return;
    const isHidden = videoControlDropdown.classList.contains('hidden');
    if (!isHidden) {
      videoControlDropdown.classList.add('hidden');
      return;
    }

    videoControlDropdown.innerHTML = `
      <div class="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800/80 mb-1 flex items-center justify-between">
        <span>Ceder control a:</span>
        <span class="text-emerald-400 font-mono">${remoteUsers.length}</span>
      </div>
    `;

    remoteUsers.forEach((u) => {
      const btn = document.createElement('button');
      btn.className = 'w-full py-2 px-2.5 rounded-xl text-xs font-medium text-slate-200 hover:text-white bg-slate-800/60 hover:bg-emerald-600 flex items-center justify-between transition group';
      btn.innerHTML = `
        <div class="flex items-center space-x-2 truncate">
          <div class="w-6 h-6 rounded-lg bg-emerald-600/30 text-emerald-300 group-hover:bg-white/20 group-hover:text-white flex items-center justify-center font-bold text-[10px] shrink-0">
            ${escapeHtml(u.name.substring(0, 2).toUpperCase())}
          </div>
          <span class="truncate font-semibold">${escapeHtml(u.name)}</span>
        </div>
        <i data-lucide="chevron-right" class="w-3.5 h-3.5 text-slate-400 group-hover:text-white shrink-0 ml-1"></i>
      `;
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        grantMouseControlTo(u.id);
        videoControlDropdown.classList.add('hidden');
      });
      videoControlDropdown.appendChild(btn);
    });

    const btnOpenSide = document.createElement('button');
    btnOpenSide.className = 'w-full pt-1.5 pb-1 px-2 text-[11px] text-indigo-400 hover:text-indigo-300 font-semibold border-t border-slate-800/80 text-center transition flex items-center justify-center space-x-1';
    btnOpenSide.innerHTML = `
      <i data-lucide="users" class="w-3 h-3"></i>
      <span>Ver panel de participantes</span>
    `;
    btnOpenSide.addEventListener('click', (e) => {
      e.stopPropagation();
      videoControlDropdown.classList.add('hidden');
      if (participantsSidebar && participantsSidebar.classList.contains('hidden')) {
        toggleParticipantsSidebar();
      }
    });
    videoControlDropdown.appendChild(btnOpenSide);

    videoControlDropdown.classList.remove('hidden');
    if (window.lucide) lucide.createIcons();
  }

  // Cerrar menú flotante al hacer clic fuera
  document.addEventListener('click', (e) => {
    if (videoControlDropdown && !videoControlDropdown.classList.contains('hidden')) {
      if (!videoControlDropdown.contains(e.target) && e.target !== btnVideoControlAction) {
        videoControlDropdown.classList.add('hidden');
      }
    }
  });

  if (btnVideoControlAction) {
    btnVideoControlAction.addEventListener('click', (e) => {
      e.stopPropagation();
      const canModerate = isHost || isSharingScreen;

      if (canModerate) {
        if (authorizedControllerId) {
          revokeAllMouseControl();
        } else {
          const remoteUsers = Array.from(participants.values()).filter((u) => u.id !== socket.id);
          if (remoteUsers.length === 0) {
            showToast('Espera a que otro participante se una a la sala para cederle el control', 'info');
          } else if (remoteUsers.length === 1) {
            grantMouseControlTo(remoteUsers[0].id);
          } else {
            showVideoControlDropdown(remoteUsers);
          }
        }
      } else {
        // Invitado
        if (authorizedControllerId === socket.id) {
          if (socket) socket.emit('release-mouse-control');
          applyMouseControlChanged(null, null);
          showToast('Soltaste el control del ratón', 'info');
        } else {
          const newState = true;
          updateMyHandUI(newState);
          if (socket) socket.emit('toggle-raise-hand', { isRaised: newState });
          soundEffects.handRaised();
          showToast('✋ Alzaste la mano para solicitar la palabra y control de ratón', 'info');
        }
      }
      updateVideoControlButton();
    });
  }

  function grantMouseControlTo(targetUserId) {
    authorizedControllerId = targetUserId;
    const targetUser = participants.get(targetUserId);
    const name = targetUser ? targetUser.name : 'Usuario';

    updateVideoControlButton();
    renderParticipantsDrawer();

    if (socket) {
      socket.emit('grant-mouse-control', { targetUserId });
    }
    if (webrtc) {
      webrtc.broadcastData({
        type: 'mouse-control-changed',
        authorizedUserId: targetUserId,
        authorizedUserName: name
      });
    }
    showToast(`🎮 ¡Control de ratón y teclado cedido a ${name}!`, 'success');
  }

  function revokeAllMouseControl() {
    authorizedControllerId = null;
    updateVideoControlButton();
    renderParticipantsDrawer();

    if (socket) {
      socket.emit('revoke-mouse-control');
    }
    if (webrtc) {
      webrtc.broadcastData({
        type: 'mouse-control-changed',
        authorizedUserId: null,
        authorizedUserName: null
      });
    }
    showToast('🚫 Control de ratón revocado a todos', 'info');
  }

  if (btnRevokeControlAll) btnRevokeControlAll.addEventListener('click', revokeAllMouseControl);

  if (btnMuteAllUsers) {
    btnMuteAllUsers.addEventListener('click', () => {
      if (socket) {
        socket.emit('mute-all-users');
        showToast('🔇 Silenciaste los micrófonos de todos los participantes', 'info');
      }
    });
  }

  // Tecla Escape para revocar control de inmediato
  window.addEventListener('keydown', (e) => {
    const canModerate = isHost || isSharingScreen;
    if (e.key === 'Escape' && canModerate && authorizedControllerId) {
      revokeAllMouseControl();
    }
  });

  function renderParticipantsDrawer() {
    if (!participantsListDrawer) return;
    participantsListDrawer.innerHTML = '';

    const totalCount = participants.size + 1;
    if (participantsCount) {
      participantsCount.textContent = `${totalCount} en sesión`;
    }

    // Indicador en el header si alguien levantó la mano
    let handRaisedUser = null;
    for (const u of participants.values()) {
      if (u.isHandRaised) {
        handRaisedUser = u;
        break;
      }
    }
    if (headerHandNotice) {
      if (handRaisedUser) {
        headerHandNotice.classList.remove('hidden');
        if (headerHandText) headerHandText.textContent = `${handRaisedUser.name} quiere hablar`;
      } else if (isMyHandRaised) {
        headerHandNotice.classList.remove('hidden');
        if (headerHandText) headerHandText.textContent = 'Tienes la mano alzada';
      } else {
        headerHandNotice.classList.add('hidden');
      }
    }

    const canModerate = isHost || isSharingScreen;
    // Alternar cajas de moderador vs invitado
    const modBox = document.getElementById('moderatorControlBox');
    const guestBox = document.getElementById('participantGuestBox');
    if (modBox && guestBox) {
      if (canModerate) {
        modBox.classList.remove('hidden');
        guestBox.classList.add('hidden');
      } else {
        modBox.classList.add('hidden');
        guestBox.classList.remove('hidden');
        const guestBadge = document.getElementById('guestControlBadge');
        const guestText = document.getElementById('guestControlText');
        if (authorizedControllerId === socket.id) {
          if (guestBadge) {
            guestBadge.textContent = '🎮 Control Activo';
            guestBadge.className = 'px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold';
          }
          if (guestText) guestText.textContent = '¡El anfitrión te ha otorgado el control interactivo del ratón y teclado!';
        } else {
          if (guestBadge) {
            guestBadge.textContent = 'Modo Espectador';
            guestBadge.className = 'px-2 py-0.5 rounded-full text-[10px] bg-slate-800 text-slate-400 border border-slate-700';
          }
          if (guestText) guestText.textContent = 'El anfitrión de la sala administra los permisos de voz y control de ratón/teclado.';
        }
      }
    }

    // Estado del badge de control en el moderador
    if (activeControllerBadge) {
      if (authorizedControllerId) {
        const u = participants.get(authorizedControllerId);
        const name = (authorizedControllerId === socket.id) ? 'Tú' : (u ? u.name : 'Usuario');
        activeControllerBadge.textContent = 'Control: ' + name;
        activeControllerBadge.className = 'px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold';
        if (revokeControlContainer) revokeControlContainer.classList.remove('hidden');
      } else {
        activeControllerBadge.textContent = 'Nadie tiene control';
        activeControllerBadge.className = 'px-2 py-0.5 rounded-full text-[10px] bg-slate-800 text-slate-400 border border-slate-700';
        if (revokeControlContainer) revokeControlContainer.classList.add('hidden');
      }
    }

    // 1. Mi Mosaico (Tile estilo Google Meet)
    const myName = (myUser && myUser.name) ? myUser.name : (userNameInput ? userNameInput.value.trim() : 'Tú') || 'Tú';
    const myInitials = myName.substring(0, 2).toUpperCase();
    const myItem = document.createElement('div');
    myItem.className = 'relative rounded-2xl bg-slate-900/90 border border-indigo-500/30 shadow-lg overflow-hidden flex flex-col justify-between aspect-[16/10] p-2.5 transition-all group shrink-0';
    myItem.innerHTML = `
      <!-- Fila Superior -->
      <div class="flex items-center justify-between z-10">
        ${isMyHandRaised ? `
          <div class="px-2 py-0.5 rounded-lg bg-amber-500/30 text-amber-300 border border-amber-500/50 text-[10px] font-bold flex items-center space-x-1 shadow animate-pulse">
            <span>✋</span>
            <span>Mano alzada</span>
          </div>
        ` : '<div></div>'}

        <div class="p-1 rounded-lg bg-slate-950/80 text-slate-400 border border-slate-800 text-xs flex items-center">
          ${(webrtc && webrtc.isMicMuted)
            ? '<i data-lucide="mic-off" class="w-3.5 h-3.5 text-rose-400"></i>'
            : '<div class="voice-eq flex items-center space-x-0.5 h-3 px-0.5 opacity-40"><span class="w-0.5 bg-emerald-400 rounded-full h-2"></span><span class="w-0.5 bg-emerald-400 rounded-full h-3"></span><span class="w-0.5 bg-emerald-400 rounded-full h-1.5"></span></div>'
          }
        </div>
      </div>

      <!-- Avatar / Inicial Grande al Centro -->
      <div class="my-auto flex flex-col items-center justify-center">
        <div class="w-12 h-12 rounded-full bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 flex items-center justify-center font-bold text-lg shadow-inner">
          ${myInitials}
        </div>
      </div>

      <!-- Pastilla Inferior con Nombre y Roles -->
      <div class="flex items-center justify-between z-10 pt-1">
        <div class="px-2 py-0.5 rounded-xl bg-slate-950/85 backdrop-blur-md text-[11px] font-semibold text-white flex items-center space-x-1 border border-slate-800/80 truncate max-w-[85%]">
          <span class="truncate">${escapeHtml(myName)} (Tú)</span>
          ${isHost ? '<span class="text-[9px] text-amber-400" title="Anfitrión">👑</span>' : ''}
          ${isSharingScreen ? '<i data-lucide="monitor" class="w-3 h-3 text-indigo-400 shrink-0" title="Presentando pantalla"></i>' : ''}
        </div>
      </div>
    `;
    participantsListDrawer.appendChild(myItem);

    // 2. Participantes Remotos (Mosaicos estilo Google Meet)
    if (participants.size === 0) {
      const emptyCard = document.createElement('div');
      emptyCard.className = 'p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-center text-xs text-slate-400 space-y-2 mt-2';
      emptyCard.innerHTML = `
        <div class="w-10 h-10 mx-auto rounded-xl bg-slate-800 flex items-center justify-center text-indigo-400">
          <i data-lucide="user-plus" class="w-5 h-5"></i>
        </div>
        <div class="font-semibold text-slate-200">Solo tú estás en la sala</div>
        <p class="text-[11px] text-slate-400 leading-relaxed">Pídele a la otra persona que abra el enlace de la sala para unirse contigo.</p>
        <button class="btn-copy-drawer-link w-full py-2 px-3 rounded-xl bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white font-semibold transition border border-indigo-500/30 flex items-center justify-center space-x-1.5 text-xs">
          <i data-lucide="link" class="w-3.5 h-3.5"></i>
          <span>Copiar Enlace</span>
        </button>
      `;
      const btnCopy = emptyCard.querySelector('.btn-copy-drawer-link');
      if (btnCopy) btnCopy.addEventListener('click', copyInviteLink);
      participantsListDrawer.appendChild(emptyCard);
    } else {
      const avatarColors = [
        'bg-amber-600/30 text-amber-300 border-amber-500/40',
        'bg-emerald-600/30 text-emerald-300 border-emerald-500/40',
        'bg-purple-600/30 text-purple-300 border-purple-500/40',
        'bg-sky-600/30 text-sky-300 border-sky-500/40',
        'bg-rose-600/30 text-rose-300 border-rose-500/40'
      ];

      participants.forEach((user, idx) => {
        const item = document.createElement('div');
        item.className = 'relative rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg overflow-hidden flex flex-col justify-between p-3 transition-all hover:border-slate-700 group shrink-0';
        const hasControl = (authorizedControllerId === user.id);
        const initials = (user.name || 'U').substring(0, 2).toUpperCase();
        const colorClass = avatarColors[Math.abs(user.name.split('').reduce((a, c) => a + c.charCodeAt(0), 0)) % avatarColors.length];

        item.innerHTML = `
          <!-- Fila Superior de Badges -->
          <div class="flex items-center justify-between z-10">
            <!-- Mano Levantada (Top-Left, estilo Google Meet) -->
            ${user.isHandRaised ? `
              <div class="px-2 py-0.5 rounded-lg bg-amber-500/30 text-amber-300 border border-amber-500/50 text-[10px] font-bold flex items-center space-x-1 shadow animate-bounce">
                <span>✋</span>
                <span>Quiere hablar</span>
              </div>
            ` : '<div></div>'}

            <!-- Estado de Micrófono (Top-Right) -->
            <div class="p-1 rounded-lg bg-slate-950/80 text-slate-400 border border-slate-800 text-xs flex items-center">
              ${user.isAudioMuted 
                ? '<i data-lucide="mic-off" class="w-3.5 h-3.5 text-rose-400"></i>' 
                : '<div class="voice-eq flex items-center space-x-0.5 h-3 px-0.5 opacity-40"><span class="w-0.5 bg-emerald-400 rounded-full h-2"></span><span class="w-0.5 bg-emerald-400 rounded-full h-3"></span><span class="w-0.5 bg-emerald-400 rounded-full h-1.5"></span></div>'
              }
            </div>
          </div>

          <!-- Avatar / Inicial Grande al Centro -->
          <div class="my-2 flex flex-col items-center justify-center">
            <div class="w-12 h-12 rounded-full ${colorClass} border flex items-center justify-center font-bold text-lg shadow-inner">
              ${initials}
            </div>
          </div>

          <!-- Pastilla Inferior con Nombre y Roles -->
          <div class="flex items-center justify-between z-10 pt-1">
            <div class="px-2 py-0.5 rounded-xl bg-slate-950/85 backdrop-blur-md text-[11px] font-semibold text-white flex items-center space-x-1 border border-slate-800/80 truncate max-w-[85%]">
              <span class="truncate">${escapeHtml(user.name)}</span>
              ${user.isHost ? '<span class="text-[9px] text-amber-400" title="Anfitrión">👑</span>' : ''}
              ${user.isScreenSharing ? '<i data-lucide="monitor" class="w-3 h-3 text-indigo-400 shrink-0" title="Presentando pantalla"></i>' : ''}
              ${hasControl ? '<span class="text-[9px] text-emerald-400" title="Control de ratón asignado">🎮</span>' : ''}
            </div>
          </div>

          <!-- Acciones de Moderador Visibles Directamente para el Host o Quien Comparte -->
          ${canModerate ? `
            <div class="mt-2.5 pt-2 border-t border-slate-800/80 flex flex-col space-y-1.5 z-20">
              <button class="btn-ctrl-user w-full py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 shadow-md ${
                hasControl
                  ? 'bg-rose-600 text-white hover:bg-rose-500 animate-pulse'
                  : 'bg-emerald-600 text-white hover:bg-emerald-500'
              }">
                <i data-lucide="${hasControl ? 'x-circle' : 'gamepad-2'}" class="w-4 h-4"></i>
                <span>${hasControl ? '🚫 Quitar Control' : '🎮 Ceder Control de Ratón'}</span>
              </button>

              <div class="flex items-center space-x-1 w-full pt-0.5">
                ${user.isHandRaised ? `
                  <button class="btn-lower-hand flex-1 py-1 px-1.5 rounded-xl text-[10px] font-semibold bg-amber-600 text-white hover:bg-amber-500 transition flex items-center justify-center space-x-1 shadow">
                    <span>✋ Bajar Mano</span>
                  </button>
                ` : ''}
                <button class="btn-mute-user flex-1 py-1 px-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] transition flex items-center justify-center space-x-1" title="Silenciar">
                  <i data-lucide="mic-off" class="w-3 h-3 text-rose-400"></i>
                  <span>Silenciar</span>
                </button>
                <button class="btn-kick-user flex-1 py-1 px-1.5 rounded-xl bg-slate-800 hover:bg-rose-950 text-slate-300 hover:text-rose-400 text-[10px] transition flex items-center justify-center space-x-1" title="Expulsar">
                  <i data-lucide="user-x" class="w-3 h-3 text-rose-400"></i>
                  <span>Expulsar</span>
                </button>
              </div>
            </div>
          ` : ''}
        `;

        if (canModerate) {
          const btnCtrl = item.querySelector('.btn-ctrl-user');
          if (btnCtrl) {
            btnCtrl.addEventListener('click', () => {
              if (hasControl) {
                revokeAllMouseControl();
              } else {
                grantMouseControlTo(user.id);
              }
            });
          }
          const btnLower = item.querySelector('.btn-lower-hand');
          if (btnLower) {
            btnLower.addEventListener('click', () => {
              if (socket) socket.emit('lower-user-hand', { targetUserId: user.id });
              showToast('Bajaste la mano de ' + user.name, 'info');
            });
          }
          const btnMute = item.querySelector('.btn-mute-user');
          if (btnMute) {
            btnMute.addEventListener('click', () => {
              if (socket) socket.emit('mute-user', { targetUserId: user.id });
              showToast('Silenciaste a ' + user.name, 'info');
            });
          }
          const btnKick = item.querySelector('.btn-kick-user');
          if (btnKick) {
            btnKick.addEventListener('click', () => {
              if (confirm('¿Expulsar a ' + user.name + ' de la sesión?')) {
                if (socket) socket.emit('kick-user', { targetUserId: user.id });
              }
            });
          }
        }

        participantsListDrawer.appendChild(item);
      });
    }

    if (window.lucide) lucide.createIcons();
  }
