/**
 * WebRTC Connection Manager — Conecty / Remotex Web
 * Implementación 100% estándar W3C Perfect Negotiation con transceivers,
 * cola de re-negociación resiliente y transporte de pantalla de alta fidelidad.
 */

class WebRTCManager {
  constructor({ socket, iceServers, onRemoteStream, onRemoteLeave, onDataChannelMessage }) {
    this.socket = socket;
    this.iceServers = iceServers || [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      { urls: 'stun:stun3.l.google.com:19302' },
      { urls: 'stun:stun4.l.google.com:19302' },
      { urls: 'stun:stun.cloudflare.com:3478' },
      { urls: 'stun:global.stun.twilio.com:3478' },
      { urls: 'stun:stun.services.mozilla.com:3478' }
    ];
    this.onRemoteStream = onRemoteStream;
    this.onRemoteLeave = onRemoteLeave;
    this.onDataChannelMessage = onDataChannelMessage;

    // socketId -> { pc, dataChannel, screenSenders: [], audioSender: null, pendingCandidates: [], makingOffer: false, ignoreOffer: false, isPolite: boolean, renegotiationPending: boolean, remoteStream: MediaStream }
    this.peers = new Map();

    this.localAudioStream = null;
    this.localScreenStream = null;
    this.isMicMuted = false;
  }

  /**
   * Inicializa el micrófono local para la llamada de voz bidireccional
   */
  async initLocalAudio() {
    try {
      this.localAudioStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          latency: 0,
          channelCount: 1,
          sampleRate: 48000
        },
        video: false
      });
      console.log('🎙️ Micrófono local capturado exitosamente');
      return this.localAudioStream;
    } catch (err) {
      console.warn('No se pudo acceder al micrófono o permiso denegado:', err);
      return null;
    }
  }

  toggleMicrophone() {
    if (!this.localAudioStream) return false;
    const audioTrack = this.localAudioStream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      this.isMicMuted = !audioTrack.enabled;
      return !this.isMicMuted;
    }
    return false;
  }

  /**
   * Obtiene o crea la conexión peer con otro usuario
   */
  getOrCreatePeer(targetId, isInitiator = false) {
    if (this.peers.has(targetId)) {
      return this.peers.get(targetId);
    }

    const pc = new RTCPeerConnection({
      iceServers: this.iceServers,
      iceCandidatePoolSize: 10
    });

    const isPolite = this.socket.id > targetId;
    const peerObj = {
      pc,
      dataChannel: null,
      screenSenders: [],
      audioSender: null,
      pendingCandidates: [],
      makingOffer: false,
      ignoreOffer: false,
      isPolite,
      renegotiationPending: false,
      remoteStream: new MediaStream()
    };

    // Crear DataChannel para eventos del puntero láser y anotaciones colaborativas
    if (isInitiator) {
      try {
        peerObj.dataChannel = pc.createDataChannel('conecty-events', {
          ordered: false,
          maxRetransmits: 0
        });
        this.setupDataChannel(peerObj.dataChannel, targetId);
      } catch (err) {
        console.warn('Error al crear DataChannel:', err);
      }
    } else {
      pc.ondatachannel = (event) => {
        peerObj.dataChannel = event.channel;
        this.setupDataChannel(peerObj.dataChannel, targetId);
      };
    }

    // Configurar transceivers predeterminados para asegurar que el SDP contenga video y audio
    try {
      if (this.localScreenStream) {
        const videoTrack = this.localScreenStream.getVideoTracks()[0];
        if (videoTrack) {
          const sender = pc.addTrack(videoTrack, this.localScreenStream);
          peerObj.screenSenders.push(sender);
        }
      } else {
        pc.addTransceiver('video', { direction: 'recvonly' });
      }
    } catch (e) {
      console.warn('Transceiver de video:', e);
    }

    // Agregar tracks de audio locales si ya están disponibles
    if (this.localAudioStream) {
      this.localAudioStream.getAudioTracks().forEach((track) => {
        try {
          peerObj.audioSender = pc.addTrack(track, this.localAudioStream);
        } catch (e) {}
      });
    }

    // Manejar candidatos ICE
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.socket.emit('ice-candidate', {
          targetId,
          candidate: event.candidate
        });
      }
    };

    // Manejar tracks remotos entrantes (audio o pantalla)
    pc.ontrack = (event) => {
      console.log(`📡 Recibido track remoto (${event.track.kind}) de ${targetId}`);
      const track = event.track;
      const stream = (event.streams && event.streams[0]) ? event.streams[0] : new MediaStream([track]);
      peerObj.remoteStream = stream;

      track.onunmute = () => {
        console.log(`🔊 Track remoto desmuteado (${track.kind}) de ${targetId}`);
        if (this.onRemoteStream) {
          const freshStream = (event.streams && event.streams[0]) ? event.streams[0] : new MediaStream([track]);
          this.onRemoteStream(targetId, freshStream, track);
        }
      };

      if (this.onRemoteStream) {
        this.onRemoteStream(targetId, stream, track);
      }
    };

    // Monitoreo de estado de señalización y vaciado de cola de re-negociación
    pc.onsignalingstatechange = async () => {
      console.log(`📡 Signaling state con ${targetId}: ${pc.signalingState}`);
      if (pc.signalingState === 'stable') {
        // Aplicar perfil de calidad activo al estabilizar la señalización
        this.setQualityProfile(this.qualityProfile || 'auto');

        // Notificar si hay un track de video activo en los receivers para refrescar la visualización
        const receivers = pc.getReceivers ? pc.getReceivers() : [];
        const videoReceiver = receivers.find((r) => r.track && r.track.kind === 'video');
        if (videoReceiver && videoReceiver.track && videoReceiver.track.readyState === 'live') {
          const vTrack = videoReceiver.track;
          const freshStream = new MediaStream([vTrack]);
          peerObj.remoteStream = freshStream;
          if (this.onRemoteStream) {
            this.onRemoteStream(targetId, freshStream, vTrack);
          }
        }

        // Ejecutar re-negociación pendiente si fue encolada mientras no estaba stable
        if (peerObj.renegotiationPending) {
          peerObj.renegotiationPending = false;
          await this.renegotiate(targetId);
        }
      }
    };

    pc.onconnectionstatechange = () => {
      console.log(`Conexión con ${targetId} en estado: ${pc.connectionState}`);
      if (pc.connectionState === 'failed' || pc.connectionState === 'closed') {
        this.closePeer(targetId);
      }
    };

    this.peers.set(targetId, peerObj);
    return peerObj;
  }

  setupDataChannel(channel, peerId) {
    channel.onopen = () => {
      console.log(`⚡ DataChannel abierto con ${peerId}`);
    };
    channel.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (this.onDataChannelMessage) {
          this.onDataChannelMessage(peerId, data);
        }
      } catch (e) {
        console.error('Error parseando mensaje DataChannel:', e);
      }
    };
  }

  /**
   * Inicia la captura de pantalla nativa del navegador y re-negocia con los participantes
   */
  async startScreenShare(onEnded, fps = 60) {
    try {
      const targetFps = parseInt(fps, 10) || 60;
      let stream = null;
      try {
        stream = await navigator.mediaDevices.getDisplayMedia({
          video: {
            cursor: 'always',
            width: { ideal: 1920, max: 3840 },
            height: { ideal: 1080, max: 2160 },
            frameRate: { ideal: targetFps, max: 60 }
          },
          audio: true
        });
      } catch (errFallback) {
        console.warn('Fallback a captura básica de pantalla:', errFallback);
        try {
          stream = await navigator.mediaDevices.getDisplayMedia({
            video: {
              cursor: 'always',
              width: { ideal: 1920 },
              height: { ideal: 1080 },
              frameRate: { ideal: targetFps }
            },
            audio: false
          });
        } catch (errBasic) {
          stream = await navigator.mediaDevices.getDisplayMedia({
            video: true,
            audio: false
          });
        }
      }

      this.localScreenStream = stream;

      const videoTrack = this.localScreenStream.getVideoTracks()[0];
      if (videoTrack && 'contentHint' in videoTrack) {
        // 'motion' garantiza flujo constante de 30-60 fps sin pausas ni pantallas negras
        videoTrack.contentHint = 'motion';
      }

      videoTrack.onended = () => {
        this.stopScreenShare();
        if (onEnded) onEnded();
      };

      // Agregar los tracks de pantalla a todas las conexiones peer existentes
      for (const peerId of this.peers.keys()) {
        try {
          await this.shareScreenWithPeer(peerId);
        } catch (e) {
          console.warn(`Error al compartir pantalla con peer ${peerId}:`, e);
        }
      }

      return this.localScreenStream;
    } catch (err) {
      console.warn('Captura de pantalla cancelada o rechazada:', err);
      return null;
    }
  }

  /**
   * Agrega o reemplaza los tracks de pantalla local en un peer específico y re-negocia
   */
  async shareScreenWithPeer(peerId) {
    const peerObj = this.peers.get(peerId) || this.getOrCreatePeer(peerId, true);
    if (!peerObj || !peerObj.pc || !this.localScreenStream) return;
    const pc = peerObj.pc;

    const videoTrack = this.localScreenStream.getVideoTracks()[0];
    if (!videoTrack) return;

    // Buscar transceiver de video existente para reutilizarlo instantáneamente vía replaceTrack
    const transceivers = pc.getTransceivers ? pc.getTransceivers() : [];
    const videoTransceiver = transceivers.find((t) => (t.receiver && t.receiver.track && t.receiver.track.kind === 'video') || (t.sender && t.sender.track && t.sender.track.kind === 'video'));

    if (videoTransceiver && videoTransceiver.sender) {
      try {
        videoTransceiver.direction = 'sendrecv';
        await videoTransceiver.sender.replaceTrack(videoTrack);
        if (!peerObj.screenSenders.includes(videoTransceiver.sender)) {
          peerObj.screenSenders.push(videoTransceiver.sender);
        }
      } catch (err) {
        console.warn('Error en replaceTrack, intentando addTrack:', err);
        const currentSenders = pc.getSenders();
        if (!currentSenders.some((s) => s.track && s.track.id === videoTrack.id)) {
          const sender = pc.addTrack(videoTrack, this.localScreenStream);
          peerObj.screenSenders.push(sender);
        }
      }
    } else {
      const currentSenders = pc.getSenders();
      if (!currentSenders.some((s) => s.track && s.track.id === videoTrack.id)) {
        try {
          const sender = pc.addTrack(videoTrack, this.localScreenStream);
          peerObj.screenSenders.push(sender);
        } catch (e) {
          console.warn('Error al llamar addTrack:', e);
        }
      }
    }

    // Audio de pantalla si se autorizó captura de sistema
    const audioTrack = this.localScreenStream.getAudioTracks()[0];
    if (audioTrack) {
      const currentSenders = pc.getSenders();
      if (!currentSenders.some((s) => s.track && s.track.id === audioTrack.id)) {
        try {
          const sender = pc.addTrack(audioTrack, this.localScreenStream);
          peerObj.screenSenders.push(sender);
        } catch (e) {}
      }
    }

    await this.renegotiate(peerId);
  }

  /**
   * Detiene la transmisión de pantalla y re-negocia para remover los tracks
   */
  async stopScreenShare() {
    if (this.localScreenStream) {
      this.localScreenStream.getTracks().forEach((track) => track.stop());

      for (const [peerId, peerObj] of this.peers.entries()) {
        const pc = peerObj.pc;

        // Restablecer transceiver de video a 'recvonly' para notificar al otro extremo en SDP
        const transceivers = pc.getTransceivers ? pc.getTransceivers() : [];
        const videoTransceiver = transceivers.find((t) => (t.receiver && t.receiver.track && t.receiver.track.kind === 'video') || (t.sender && t.sender.track && t.sender.track.kind === 'video'));
        if (videoTransceiver) {
          try {
            videoTransceiver.direction = 'recvonly';
          } catch (e) {}
        }

        if (peerObj.screenSenders && peerObj.screenSenders.length > 0) {
          peerObj.screenSenders.forEach((sender) => {
            try {
              if (sender.replaceTrack) {
                sender.replaceTrack(null).catch(() => {});
              } else {
                pc.removeTrack(sender);
              }
            } catch (e) {
              console.warn('Error al remover track de pantalla:', e);
            }
          });
          peerObj.screenSenders = [];
          await this.renegotiate(peerId);
        }
      }
      this.localScreenStream = null;
    }
  }

  /**
   * Re-negociación SDP con cola de espera resiliente
   */
  async renegotiate(peerId) {
    const peerObj = this.peers.get(peerId);
    if (!peerObj || !peerObj.pc) return;

    if (peerObj.pc.signalingState !== 'stable') {
      console.log(`⏳ Re-negociación con ${peerId} encolada (signalingState: ${peerObj.pc.signalingState})`);
      peerObj.renegotiationPending = true;
      return;
    }

    try {
      peerObj.makingOffer = true;
      const offer = await peerObj.pc.createOffer();
      if (peerObj.pc.signalingState !== 'stable') return;
      await peerObj.pc.setLocalDescription(offer);

      const localDesc = peerObj.pc.localDescription;
      this.socket.emit('offer', {
        targetId: peerId,
        offer: {
          type: localDesc.type,
          sdp: localDesc.sdp
        }
      });
    } catch (err) {
      console.error(`Error al re-negociar con ${peerId}:`, err);
    } finally {
      peerObj.makingOffer = false;
    }
  }

  /**
   * Crea una oferta SDP inicial hacia un destinatario
   */
  async createOffer(targetId) {
    this.getOrCreatePeer(targetId, true);
    await this.renegotiate(targetId);
  }

  /**
   * Maneja una oferta SDP recibida (con soporte de Perfect Negotiation W3C)
   */
  async handleOffer(callerId, offer) {
    if (!offer || !offer.sdp) return;
    const peerObj = this.getOrCreatePeer(callerId, false);
    const pc = peerObj.pc;

    const offerCollision = (peerObj.makingOffer || pc.signalingState !== 'stable');
    peerObj.ignoreOffer = !peerObj.isPolite && offerCollision;

    if (peerObj.ignoreOffer) {
      console.warn('Colisión de oferta ignorada por ser peer impolito:', callerId);
      return;
    }

    try {
      if (offerCollision) {
        // Rollback obligatorio en W3C Perfect Negotiation para el peer cortés
        await pc.setLocalDescription({ type: 'rollback' });
      }
      await pc.setRemoteDescription(new RTCSessionDescription(offer));

      // Vaciar candidatos pendientes que llegaron antes de remoteDescription
      if (peerObj.pendingCandidates.length > 0) {
        for (const candidate of peerObj.pendingCandidates) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
          } catch (e) {
            console.warn('Error al procesar candidato pendiente:', e);
          }
        }
        peerObj.pendingCandidates = [];
      }

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      const localDesc = pc.localDescription;
      this.socket.emit('answer', {
        targetId: callerId,
        answer: {
          type: localDesc.type,
          sdp: localDesc.sdp
        }
      });

      // Si tenemos pantalla activa y no la tiene este peer, asegurar el envío una vez completado el handshake
      if (this.localScreenStream) {
        const checkAndShare = async () => {
          if (pc.signalingState === 'stable') {
            pc.removeEventListener('signalingstatechange', checkAndShare);
            if (peerObj.screenSenders.length === 0) {
              await this.shareScreenWithPeer(callerId);
            }
          }
        };
        if (pc.signalingState === 'stable') {
          setTimeout(checkAndShare, 50);
        } else {
          pc.addEventListener('signalingstatechange', checkAndShare);
        }
      }
    } catch (err) {
      console.error('Error al manejar oferta SDP:', err);
    }
  }

  /**
   * Maneja una respuesta SDP recibida
   */
  async handleAnswer(responderId, answer) {
    if (!answer || !answer.sdp) return;
    const peerObj = this.peers.get(responderId);
    if (peerObj && peerObj.pc) {
      try {
        if (peerObj.pc.signalingState === 'have-local-offer') {
          await peerObj.pc.setRemoteDescription(new RTCSessionDescription(answer));
        }

        // Vaciar candidatos pendientes
        if (peerObj.pendingCandidates.length > 0) {
          for (const candidate of peerObj.pendingCandidates) {
            try {
              await peerObj.pc.addIceCandidate(new RTCIceCandidate(candidate));
            } catch (e) {
              console.warn('Error al procesar candidato pendiente:', e);
            }
          }
          peerObj.pendingCandidates = [];
        }

        // Si tenemos pantalla activa y no la tiene este peer, enviarla ahora que el handshake es estable
        if (this.localScreenStream && peerObj.screenSenders.length === 0) {
          await this.shareScreenWithPeer(responderId);
        }

        // Si quedó re-negociación pendiente, ejecutarla
        if (peerObj.renegotiationPending && peerObj.pc.signalingState === 'stable') {
          peerObj.renegotiationPending = false;
          await this.renegotiate(responderId);
        }
      } catch (err) {
        console.error('Error aplicando respuesta SDP:', err);
      }
    }
  }

  /**
   * Maneja un candidato ICE recibido
   */
  async handleCandidate(senderId, candidate) {
    if (!candidate) return;
    const peerObj = this.peers.get(senderId) || this.getOrCreatePeer(senderId, false);
    if (peerObj && peerObj.pc) {
      if (!peerObj.pc.remoteDescription || !peerObj.pc.remoteDescription.type) {
        // Encolar candidato si remoteDescription aún no se ha establecido
        peerObj.pendingCandidates.push(candidate);
      } else {
        try {
          await peerObj.pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          if (!peerObj.ignoreOffer) {
            console.warn('Error agregando candidato ICE:', err);
          }
        }
      }
    }
  }

  /**
   * Envía un evento a través de DataChannels
   */
  broadcastData(data) {
    let sent = false;
    const json = JSON.stringify(data);
    for (const [peerId, peerObj] of this.peers.entries()) {
      if (peerObj.dataChannel && peerObj.dataChannel.readyState === 'open') {
        try {
          peerObj.dataChannel.send(json);
          sent = true;
        } catch (e) {}
      }
    }
    return sent;
  }

  closePeer(peerId) {
    const peerObj = this.peers.get(peerId);
    if (peerObj) {
      if (peerObj.dataChannel) {
        try { peerObj.dataChannel.close(); } catch (e) {}
      }
      if (peerObj.pc) {
        try { peerObj.pc.close(); } catch (e) {}
      }
      this.peers.delete(peerId);
    }
    if (this.onRemoteLeave) {
      this.onRemoteLeave(peerId);
    }
  }

  /**
   * Aplica un perfil de calidad de video a todos los senders de pantalla activos.
   * Perfiles: 'auto' | '1080p' | '1440p' | '4k'
   * Se llama tras cada renegociación y al cambiar el perfil manualmente.
   */
  setQualityProfile(profile) {
    this.qualityProfile = profile || 'auto';
    const bitrateMap = {
      'auto':  8_000_000,
      '1080p': 8_000_000,
      '1440p': 15_000_000,
      '4k':    25_000_000
    };
    const maxBitrate = bitrateMap[this.qualityProfile] || bitrateMap['auto'];

    for (const [, peerObj] of this.peers.entries()) {
      peerObj.screenSenders.forEach((sender) => {
        if (sender && sender.track && sender.track.kind === 'video' && sender.setParameters) {
          try {
            const params = sender.getParameters();
            if (!params.encodings || params.encodings.length === 0) params.encodings = [{}];
            params.encodings[0].maxBitrate = maxBitrate;
            params.encodings[0].priority = 'high';
            params.encodings[0].networkPriority = 'high';
            sender.setParameters(params).catch(() => {});
          } catch (e) {}
        }
      });
    }
    console.log(`🎯 Perfil de calidad aplicado: ${this.qualityProfile} (${(maxBitrate / 1_000_000).toFixed(0)} Mbps max)`);
  }

  /**
   * Recopila estadísticas WebRTC de todos los peers activos.
   * Devuelve un array de objetos con métricas de video y red.
   */
  async collectStats() {
    const results = [];
    for (const [peerId, peerObj] of this.peers.entries()) {
      if (!peerObj.pc) continue;
      try {
        const statsReport = await peerObj.pc.getStats();
        const entry = { peerId, video: null, network: null };

        statsReport.forEach((stat) => {
          if (stat.type === 'outbound-rtp' && stat.kind === 'video') {
            entry.video = {
              direction: 'send',
              frameWidth: stat.frameWidth || 0,
              frameHeight: stat.frameHeight || 0,
              framesPerSecond: Math.round(stat.framesPerSecond || 0),
              bytesSent: stat.bytesSent || 0,
              qualityLimitReason: stat.qualityLimitationReason || 'none'
            };
          }
          if (stat.type === 'inbound-rtp' && stat.kind === 'video') {
            entry.video = {
              direction: 'recv',
              frameWidth: stat.frameWidth || 0,
              frameHeight: stat.frameHeight || 0,
              framesPerSecond: Math.round(stat.framesPerSecond || 0),
              bytesReceived: stat.bytesReceived || 0,
              packetsLost: stat.packetsLost || 0,
              jitter: stat.jitter ? stat.jitter.toFixed(4) : '0'
            };
          }
          if (stat.type === 'candidate-pair' && stat.state === 'succeeded') {
            entry.network = {
              currentRoundTripTime: stat.currentRoundTripTime
                ? Math.round(stat.currentRoundTripTime * 1000)
                : null,
              availableOutgoingBitrate: stat.availableOutgoingBitrate
                ? Math.round(stat.availableOutgoingBitrate / 1000)
                : null
            };
          }
        });
        results.push(entry);
      } catch (e) {
        console.warn('Error al recopilar estadísticas WebRTC:', e);
      }
    }
    return results;
  }

  disconnectAll() {
    this.stopScreenShare();
    if (this.localAudioStream) {
      this.localAudioStream.getTracks().forEach((t) => t.stop());
      this.localAudioStream = null;
    }
    for (const peerId of this.peers.keys()) {
      this.closePeer(peerId);
    }
  }
}
