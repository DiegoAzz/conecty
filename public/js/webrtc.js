/**
 * WebRTC Connection Manager
 * Implementación robusta con re-negociación automática (Perfect Negotiation)
 * para llamadas de voz y transmisión de pantalla dinámica.
 */

class WebRTCManager {
  constructor({ socket, iceServers, onRemoteStream, onRemoteLeave, onDataChannelMessage }) {
    this.socket = socket;
    this.iceServers = iceServers || [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun.cloudflare.com:3478' }
    ];
    this.onRemoteStream = onRemoteStream;
    this.onRemoteLeave = onRemoteLeave;
    this.onDataChannelMessage = onDataChannelMessage;

    // socketId -> { pc, dataChannel, screenSenders: [], audioSender: null, pendingCandidates: [], makingOffer: false, ignoreOffer: false }
    this.peers = new Map();

    this.localAudioStream = null;
    this.localScreenStream = null;
    this.isMicMuted = false;
  }

  /**
   * Inicializa el micrófono local para la llamada de voz
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
      isPolite
    };

    // Crear DataChannel para eventos del puntero láser
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

    // Agregar tracks de audio locales si ya están disponibles
    if (this.localAudioStream) {
      this.localAudioStream.getAudioTracks().forEach((track) => {
        peerObj.audioSender = pc.addTrack(track, this.localAudioStream);
      });
    }

    // Agregar tracks de pantalla locales si ya se está compartiendo
    if (this.localScreenStream) {
      this.localScreenStream.getTracks().forEach((track) => {
        const sender = pc.addTrack(track, this.localScreenStream);
        peerObj.screenSenders.push(sender);
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
      if (this.onRemoteStream) {
        const stream = event.streams && event.streams[0] ? event.streams[0] : new MediaStream([event.track]);
        this.onRemoteStream(targetId, stream, event.track);
      }
    };

    pc.onconnectionstatechange = () => {
      console.log(`Conexión con ${targetId} en estado: ${pc.connectionState}`);
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed' || pc.connectionState === 'closed') {
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
   * Inicia la captura de pantalla y re-negocia con todos los participantes
   */
  async startScreenShare(onEnded) {
    try {
      this.localScreenStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          cursor: 'always',
          displaySurface: 'monitor',
          selfBrowserSurface: 'exclude', // Evita seleccionar accidentalmente la misma pestaña y previene el efecto espejo
          surfaceSwitching: 'include',
          frameRate: { ideal: 60, max: 60 }
        },
        audio: true
      });

      const videoTrack = this.localScreenStream.getVideoTracks()[0];
      if (videoTrack && 'contentHint' in videoTrack) {
        videoTrack.contentHint = 'motion'; // Prioriza baja latencia y fluidez
      }

      videoTrack.onended = () => {
        this.stopScreenShare();
        if (onEnded) onEnded();
      };

      // Agregar los tracks de pantalla a todas las conexiones peer existentes
      for (const [peerId, peerObj] of this.peers.entries()) {
        const pc = peerObj.pc;
        this.localScreenStream.getTracks().forEach((track) => {
          const sender = pc.addTrack(track, this.localScreenStream);
          peerObj.screenSenders.push(sender);
        });
        // Re-negociar explícitamente para transmitir el nuevo video
        await this.renegotiate(peerId);
      }

      return this.localScreenStream;
    } catch (err) {
      console.warn('Captura de pantalla cancelada o rechazada:', err);
      return null;
    }
  }

  /**
   * Detiene la transmisión de pantalla y re-negocia para remover los tracks
   */
  async stopScreenShare() {
    if (this.localScreenStream) {
      this.localScreenStream.getTracks().forEach((track) => track.stop());

      for (const [peerId, peerObj] of this.peers.entries()) {
        const pc = peerObj.pc;
        if (peerObj.screenSenders && peerObj.screenSenders.length > 0) {
          peerObj.screenSenders.forEach((sender) => {
            try {
              pc.removeTrack(sender);
            } catch (e) {
              console.warn('Error al remover track de pantalla:', e);
            }
          });
          peerObj.screenSenders = [];
          // Re-negociar para actualizar el estado del peer remoto
          await this.renegotiate(peerId);
        }
      }
      this.localScreenStream = null;
    }
  }

  /**
   * Re-negociación SDP para enviar actualizaciones de tracks
   */
  async renegotiate(peerId) {
    const peerObj = this.peers.get(peerId);
    if (!peerObj || !peerObj.pc) return;
    try {
      peerObj.makingOffer = true;
      const offer = await peerObj.pc.createOffer();
      await peerObj.pc.setLocalDescription(offer);
      this.socket.emit('offer', {
        targetId: peerId,
        offer: peerObj.pc.localDescription
      });
    } catch (err) {
      console.error(`Error al re-negociar con ${peerId}:`, err);
    } finally {
      peerObj.makingOffer = false;
    }
  }

  /**
   * Crea una oferta SDP inicial
   */
  async createOffer(targetId) {
    const peerObj = this.getOrCreatePeer(targetId, true);
    await this.renegotiate(targetId);
  }

  /**
   * Maneja una oferta SDP recibida (con soporte de Perfect Negotiation)
   */
  async handleOffer(callerId, offer) {
    const peerObj = this.getOrCreatePeer(callerId, false);
    const pc = peerObj.pc;

    const offerCollision = (peerObj.makingOffer || pc.signalingState !== 'stable');
    peerObj.ignoreOffer = !peerObj.isPolite && offerCollision;

    if (peerObj.ignoreOffer) {
      console.warn('Colisión de oferta ignorada por ser peer impolito:', callerId);
      return;
    }

    try {
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

      this.socket.emit('answer', {
        targetId: callerId,
        answer: pc.localDescription
      });
    } catch (err) {
      console.error('Error al manejar oferta SDP:', err);
    }
  }

  /**
   * Maneja una respuesta SDP recibida
   */
  async handleAnswer(responderId, answer) {
    const peerObj = this.peers.get(responderId);
    if (peerObj && peerObj.pc) {
      try {
        await peerObj.pc.setRemoteDescription(new RTCSessionDescription(answer));

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
      } catch (err) {
        console.error('Error aplicando respuesta SDP:', err);
      }
    }
  }

  /**
   * Maneja un candidato ICE recibido
   */
  async handleCandidate(senderId, candidate) {
    const peerObj = this.peers.get(senderId);
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
