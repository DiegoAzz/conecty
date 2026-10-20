/**
 * WebRTC Connection Manager
 * Gestiona conexiones P2P en malla para audio full duplex, transmisión de pantalla
 * y canales de datos de ultra baja latencia.
 */

class WebRTCManager {
  constructor({ socket, iceServers, onRemoteStream, onRemoteLeave, onDataChannelMessage }) {
    this.socket = socket;
    this.iceServers = iceServers || [{ urls: 'stun:stun.l.google.com:19302' }];
    this.onRemoteStream = onRemoteStream;
    this.onRemoteLeave = onRemoteLeave;
    this.onDataChannelMessage = onDataChannelMessage;

    // socketId -> { pc, dataChannel }
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
          autoGainControl: true
        },
        video: false
      });
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
   * Inicia la captura de pantalla con audio del sistema opcional
   */
  async startScreenShare(onEnded) {
    try {
      this.localScreenStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          cursor: 'always',
          frameRate: { ideal: 30, max: 60 }
        },
        audio: true
      });

      // Si el usuario presiona "Dejar de compartir" en la barra nativa del navegador
      const videoTrack = this.localScreenStream.getVideoTracks()[0];
      videoTrack.onended = () => {
        this.stopScreenShare();
        if (onEnded) onEnded();
      };

      // Agregar los tracks de pantalla a todos los peers conectados
      this.localScreenStream.getTracks().forEach((track) => {
        for (const [peerId, { pc }] of this.peers.entries()) {
          pc.addTrack(track, this.localScreenStream);
        }
      });

      return this.localScreenStream;
    } catch (err) {
      console.warn('Captura de pantalla cancelada o rechazada:', err);
      return null;
    }
  }

  /**
   * Detiene la captura de pantalla
   */
  stopScreenShare() {
    if (this.localScreenStream) {
      this.localScreenStream.getTracks().forEach((track) => {
        track.stop();
        for (const [peerId, { pc }] of this.peers.entries()) {
          const senders = pc.getSenders();
          const sender = senders.find((s) => s.track === track);
          if (sender) {
            try {
              pc.removeTrack(sender);
            } catch (e) {
              console.error('Error al remover track:', e);
            }
          }
        }
      });
      this.localScreenStream = null;
    }
  }

  /**
   * Crea una conexión RTCPeerConnection para un usuario remoto
   */
  createPeerConnection(targetId, isInitiator) {
    if (this.peers.has(targetId)) {
      return this.peers.get(targetId).pc;
    }

    const pc = new RTCPeerConnection({
      iceServers: this.iceServers,
      iceCandidatePoolSize: 10
    });

    let dataChannel = null;

    if (isInitiator) {
      // Crear canal de datos para puntero láser y eventos rápidos
      try {
        dataChannel = pc.createDataChannel('conecty-events', {
          ordered: false,
          maxRetransmits: 0
        });
        this.setupDataChannel(dataChannel, targetId);
      } catch (err) {
        console.warn('Error al crear DataChannel:', err);
      }
    } else {
      pc.ondatachannel = (event) => {
        dataChannel = event.channel;
        this.setupDataChannel(dataChannel, targetId);
      };
    }

    // Agregar tracks de audio locales
    if (this.localAudioStream) {
      this.localAudioStream.getAudioTracks().forEach((track) => {
        pc.addTrack(track, this.localAudioStream);
      });
    }

    // Agregar tracks de pantalla locales si está compartiendo
    if (this.localScreenStream) {
      this.localScreenStream.getTracks().forEach((track) => {
        pc.addTrack(track, this.localScreenStream);
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

    // Manejar streams remotos entrantes
    pc.ontrack = (event) => {
      if (this.onRemoteStream) {
        this.onRemoteStream(targetId, event.streams[0], event.track);
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed' || pc.connectionState === 'closed') {
        this.closePeer(targetId);
      }
    };

    this.peers.set(targetId, { pc, dataChannel });
    return pc;
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
   * Envía un evento a través de DataChannels (fallback a WebSocket)
   */
  broadcastData(data) {
    let sentViaDataChannel = false;
    const json = JSON.stringify(data);

    for (const [peerId, { dataChannel }] of this.peers.entries()) {
      if (dataChannel && dataChannel.readyState === 'open') {
        try {
          dataChannel.send(json);
          sentViaDataChannel = true;
        } catch (e) {
          // Ignorar y usar fallback
        }
      }
    }
    return sentViaDataChannel;
  }

  /**
   * Crea una oferta SDP para un peer
   */
  async createOffer(targetId) {
    const pc = this.createPeerConnection(targetId, true);
    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      this.socket.emit('offer', { targetId, offer });
    } catch (err) {
      console.error('Error creando oferta SDP:', err);
    }
  }

  /**
   * Maneja una oferta SDP recibida
   */
  async handleOffer(callerId, offer) {
    const pc = this.createPeerConnection(callerId, false);
    try {
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      this.socket.emit('answer', { targetId: callerId, answer });
    } catch (err) {
      console.error('Error respondiendo oferta SDP:', err);
    }
  }

  /**
   * Maneja una respuesta SDP recibida
   */
  async handleAnswer(responderId, answer) {
    const peer = this.peers.get(responderId);
    if (peer && peer.pc) {
      try {
        await peer.pc.setRemoteDescription(new RTCSessionDescription(answer));
      } catch (err) {
        console.error('Error aplicando respuesta SDP:', err);
      }
    }
  }

  /**
   * Maneja un candidato ICE recibido
   */
  async handleCandidate(senderId, candidate) {
    const peer = this.peers.get(senderId);
    if (peer && peer.pc) {
      try {
        await peer.pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.error('Error agregando candidato ICE:', err);
      }
    }
  }

  closePeer(peerId) {
    const peer = this.peers.get(peerId);
    if (peer) {
      if (peer.dataChannel) {
        peer.dataChannel.close();
      }
      if (peer.pc) {
        peer.pc.close();
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
