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
      { urls: 'stun:stun2.l.google.com:19302' },
      { urls: 'stun:stun.cloudflare.com:3478' },
      { urls: 'stun:global.stun.twilio.com:3478' },
      { urls: 'stun:stun.services.mozilla.com:3478' }
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

    // Agregar tracks de pantalla locales si es el iniciador de la llamada
    if (this.localScreenStream && isInitiator) {
      this.localScreenStream.getTracks().forEach((track) => {
        try {
          const sender = pc.addTrack(track, this.localScreenStream);
          peerObj.screenSenders.push(sender);
        } catch (e) {
          console.warn('Track de pantalla ya asignado:', e);
        }
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
   * Inicia la captura de pantalla y re-negocia con todos los participantes
   */
  async startScreenShare(onEnded, fps = 60) {
    try {
      const targetFps = parseInt(fps, 10) || 60;
      let stream = null;
      try {
        // audio: false es esencial en Windows/Chrome para permitir compartir Ventanas individuales sin errores de SO
        stream = await navigator.mediaDevices.getDisplayMedia({
          video: {
            cursor: 'always',
            width: { ideal: 3840 },
            height: { ideal: 2160 },
            frameRate: { ideal: targetFps }
          },
          audio: false
        });
      } catch (errCapture) {
        console.warn('Reintento con captura básica nativa:', errCapture);
        stream = await navigator.mediaDevices.getDisplayMedia({
          video: {
            cursor: 'always'
          },
          audio: false
        });
      }

      this.localScreenStream = stream;

      const videoTrack = this.localScreenStream.getVideoTracks()[0];
      if (videoTrack && 'contentHint' in videoTrack) {
        // 'detail' prioriza nitidez cristalina de textos, documentos y código sobre compresión agresiva
        videoTrack.contentHint = 'detail';
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
   * Agrega los tracks de pantalla local a un peer específico y re-negocia
   */
  async shareScreenWithPeer(peerId) {
    const peerObj = this.peers.get(peerId) || this.getOrCreatePeer(peerId, true);
    if (!peerObj || !peerObj.pc || !this.localScreenStream) return;
    const pc = peerObj.pc;

    const currentSenders = pc.getSenders();
    this.localScreenStream.getTracks().forEach((track) => {
      const alreadyAdded = currentSenders.some((s) => s.track && s.track.id === track.id);
      if (!alreadyAdded) {
        try {
          const sender = pc.addTrack(track, this.localScreenStream);
          peerObj.screenSenders.push(sender);
        } catch (e) {
          console.warn(`Error agregando track de pantalla al peer ${peerId}:`, e);
        }
      }
    });

    this.preferHighQualityCodecs(pc);

    if (pc.signalingState === 'stable') {
      await this.renegotiate(peerId);
      this.applySenderBitrates(peerObj);
    } else {
      const onStable = async () => {
        if (pc.signalingState === 'stable') {
          pc.removeEventListener('signalingstatechange', onStable);
          await this.renegotiate(peerId);
          this.applySenderBitrates(peerObj);
        }
      };
      pc.addEventListener('signalingstatechange', onStable);
    }
  }

  /**
   * Aplica parámetros de encoding de alta fidelidad (25 Mbps, degradación cero de resolución)
   */
  applySenderBitrates(peerObj) {
    if (!peerObj || !peerObj.screenSenders) return;
    peerObj.screenSenders.forEach((sender) => {
      if (sender.track && sender.track.kind === 'video' && sender.setParameters) {
        try {
          const params = sender.getParameters();
          if (!params.encodings || params.encodings.length === 0) params.encodings = [{}];
          params.encodings[0].maxBitrate = 25000000; // 25 Mbps para resolución nativa nítida
          params.encodings[0].minBitrate = 5000000;  // 5 Mbps mínimo para nitidez instantánea
          params.encodings[0].priority = 'high';
          params.encodings[0].networkPriority = 'high';
          params.encodings[0].scaleResolutionDownBy = 1.0; // Prohibir reducción de resolución
          params.degradationPreference = 'maintain-resolution'; // NUNCA degradar resolución por ancho de banda
          sender.setParameters(params).catch(() => {});
        } catch (e) {}
      }
    });
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
          if (pc.signalingState === 'stable') {
            await this.renegotiate(peerId);
          }
        }
      }
      this.localScreenStream = null;
    }
  }

  /**
   * Prioriza codecs de alta fidelidad para texto y pantalla (VP9, H264)
   */
  preferHighQualityCodecs(pc) {
    if (!('RTCRtpReceiver' in window) || !RTCRtpReceiver.getCapabilities) return;
    try {
      const caps = RTCRtpReceiver.getCapabilities('video');
      if (!caps || !caps.codecs) return;

      const preferredOrder = ['video/VP9', 'video/H264', 'video/VP8', 'video/AV1'];
      const sortedCodecs = [...caps.codecs].sort((a, b) => {
        const idxA = preferredOrder.indexOf(a.mimeType);
        const idxB = preferredOrder.indexOf(b.mimeType);
        const orderA = idxA === -1 ? 99 : idxA;
        const orderB = idxB === -1 ? 99 : idxB;
        return orderA - orderB;
      });

      pc.getTransceivers().forEach((transceiver) => {
        if (transceiver.receiver && transceiver.receiver.track && transceiver.receiver.track.kind === 'video') {
          if (transceiver.setCodecPreferences) {
            transceiver.setCodecPreferences(sortedCodecs);
          }
        }
      });
    } catch (e) {
      console.warn('setCodecPreferences:', e);
    }
  }

  /**
   * Modifica el SDP para forzar bitrate de 25 Mbps en video (alta resolución nítida sin compresión borrosa)
   * Cumple estrictamente con RFC 4566 y RFC 4588:
   * 1. Inserta b=AS:25000 y b=TIAS:25000000 después de c=IN en la sección de video.
   * 2. Aplica parámetros de bitrate de Google EXCLUSIVAMENTE a codecs VP8 y VP9 primarios (NUNCA a RTX, H264 o FEC).
   */
  boostVideoBitrateInSdp(sdp) {
    if (!sdp || !sdp.includes('m=video')) return sdp;
    try {
      const lines = sdp.split('\r\n');
      let inVideo = false;
      let cSeen = false;
      const vpPayloadTypes = new Set();
      const newLines = [];

      // Primera pasada: identificar identificadores de carga útil (payload types) de VP8 y VP9
      for (const line of lines) {
        const match = line.match(/^a=rtpmap:(\d+)\s+(VP8|VP9)/i);
        if (match) {
          vpPayloadTypes.add(match[1]);
        }
      }

      for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        if (line.startsWith('m=video')) {
          inVideo = true;
          cSeen = false;
          newLines.push(line);
          continue;
        }
        if (line.startsWith('m=') && !line.startsWith('m=video')) {
          inVideo = false;
          cSeen = false;
          newLines.push(line);
          continue;
        }
        if (inVideo && line.startsWith('c=IN ') && !cSeen) {
          cSeen = true;
          newLines.push(line);
          newLines.push('b=AS:25000');
          newLines.push('b=TIAS:25000000');
          continue;
        }
        if (inVideo && (line.startsWith('b=AS:') || line.startsWith('b=TIAS:'))) {
          continue;
        }
        if (inVideo && line.startsWith('a=fmtp:')) {
          const fmtpMatch = line.match(/^a=fmtp:(\d+)\s+(.*)$/);
          if (fmtpMatch && vpPayloadTypes.has(fmtpMatch[1]) && !line.includes('apt=')) {
            if (!line.includes('x-google-min-bitrate')) {
              line += ';x-google-min-bitrate=5000;x-google-start-bitrate=15000;x-google-max-bitrate=25000';
            }
          }
          newLines.push(line);
          continue;
        }
        newLines.push(line);
      }
      return newLines.join('\r\n');
    } catch (e) {
      console.warn('Error optimizando SDP:', e);
      return sdp;
    }
  }

  /**
   * Re-negociación SDP para enviar actualizaciones de tracks
   */
  async renegotiate(peerId) {
    const peerObj = this.peers.get(peerId);
    if (!peerObj || !peerObj.pc) return;
    if (peerObj.pc.signalingState !== 'stable') {
      console.warn(`renegotiate con ${peerId} pospuesto: signalingState=${peerObj.pc.signalingState}`);
      return;
    }
    try {
      peerObj.makingOffer = true;
      const offer = await peerObj.pc.createOffer();
      let sdp = offer.sdp;
      try {
        sdp = this.boostVideoBitrateInSdp(offer.sdp);
        await peerObj.pc.setLocalDescription(new RTCSessionDescription({ type: offer.type, sdp }));
      } catch (sdpErr) {
        console.warn('Fallback a SDP original en oferta:', sdpErr);
        await peerObj.pc.setLocalDescription(offer);
      }
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
    this.preferHighQualityCodecs(peerObj.pc);
    await this.renegotiate(targetId);
  }

  /**
   * Maneja una oferta SDP recibida (con soporte de Perfect Negotiation)
   */
  async handleOffer(callerId, offer) {
    const peerObj = this.getOrCreatePeer(callerId, false);
    const pc = peerObj.pc;
    this.preferHighQualityCodecs(pc);

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
      let sdp = answer.sdp;
      try {
        sdp = this.boostVideoBitrateInSdp(answer.sdp);
        await pc.setLocalDescription(new RTCSessionDescription({ type: answer.type, sdp }));
      } catch (sdpErr) {
        console.warn('Fallback a SDP original en respuesta:', sdpErr);
        await pc.setLocalDescription(answer);
      }

      this.socket.emit('answer', {
        targetId: callerId,
        answer: pc.localDescription
      });

      // Si tenemos pantalla activa, re-negociar para compartirla con este peer una vez completado el handshake inicial
      if (this.localScreenStream) {
        const checkAndShare = async () => {
          if (pc.signalingState === 'stable') {
            pc.removeEventListener('signalingstatechange', checkAndShare);
            await this.shareScreenWithPeer(callerId);
          }
        };
        if (pc.signalingState === 'stable') {
          setTimeout(checkAndShare, 100);
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

        // Aplicar parámetros de calidad máxima (25 Mbps) una vez confirmado el canal
        this.applySenderBitrates(peerObj);

        // Si tenemos pantalla activa y no la tiene este peer, enviarla ahora que el handshake es estable
        if (this.localScreenStream && peerObj.screenSenders.length === 0) {
          await this.shareScreenWithPeer(responderId);
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
