/**
 * Módulo de Puntero Láser, Anotaciones y Emulación de Control Remoto en Tiempo Real
 * Maneja coordenadas normalizadas (0.0 a 1.0) con cálculo geométrico exacto
 * que compensa aspect ratio, letterboxing y resolución tanto en emisor como receptor.
 */

class LaserController {
  constructor(canvas, videoElement, onEmitPointer) {
    this.canvas = canvas;
    this.video = videoElement;
    this.ctx = canvas.getContext('2d');
    this.onEmitPointer = onEmitPointer; // callback para enviar por socket/webrtc

    this.isActive = true;
    this.isDrawing = false;
    this.lastPosition = null;

    // Almacén de punteros remotos (modo láser): { [senderId]: { x, y, name, color, lastUpdated } }
    this.remotePointers = new Map();
    // Almacén de cursores de control remoto: { [senderId]: { x, y, name, color, lastUpdated, isClicking, lastAction } }
    this.remoteControllers = new Map();

    // Ondas expansivas de clics: [ { normX, normY, radius, maxRadius, alpha, color } ]
    this.ripples = [];
    // Trazos temporales de dibujo: [ { points: [ {normX, normY} ], color, alpha, timestamp } ]
    this.strokes = [];

    this.myColor = this.getRandomBrightColor();

    this.bindEvents();
    this.startRenderLoop();
  }

  getRandomBrightColor() {
    const colors = ['#f43f5e', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  /**
   * Asegura que las dimensiones internas del canvas (buffer) coincidan
   * exactamente 1:1 con sus dimensiones CSS visibles en pantalla.
   * Evita distorsiones, estiramientos o desplazamiento de coordenadas.
   */
  resizeCanvas() {
    const cRect = this.canvas.getBoundingClientRect();
    const targetWidth = Math.round(cRect.width);
    const targetHeight = Math.round(cRect.height);

    if (targetWidth > 0 && targetHeight > 0) {
      if (this.canvas.width !== targetWidth || this.canvas.height !== targetHeight) {
        this.canvas.width = targetWidth;
        this.canvas.height = targetHeight;
      }
    }
  }

  /**
   * Calcula el área real donde se renderiza el video dentro del canvas
   * considerando dimensiones del elemento video, aspect ratio original y letterboxing.
   */
  getVideoRenderRect() {
    const cRect = this.canvas.getBoundingClientRect();
    const vRect = this.video.getBoundingClientRect();

    const videoWidth = this.video.videoWidth || (vRect.width > 0 ? vRect.width : cRect.width);
    const videoHeight = this.video.videoHeight || (vRect.height > 0 ? vRect.height : cRect.height);

    const videoRatio = videoWidth / videoHeight;
    const elementRatio = (vRect.width > 0 && vRect.height > 0) ? (vRect.width / vRect.height) : (cRect.width / cRect.height);

    let actualWidth = vRect.width > 0 ? vRect.width : cRect.width;
    let actualHeight = vRect.height > 0 ? vRect.height : cRect.height;
    let letterboxX = 0;
    let letterboxY = 0;

    if (vRect.width > 0 && vRect.height > 0) {
      if (elementRatio > videoRatio) {
        // Elemento más ancho que el video -> letterbox horizontal
        actualHeight = vRect.height;
        actualWidth = actualHeight * videoRatio;
        letterboxX = (vRect.width - actualWidth) / 2;
        letterboxY = 0;
      } else {
        // Elemento más alto que el video -> letterbox vertical
        actualWidth = vRect.width;
        actualHeight = actualWidth / videoRatio;
        letterboxX = 0;
        letterboxY = (vRect.height - actualHeight) / 2;
      }
    }

    const videoLeftInCanvas = vRect.left - cRect.left;
    const videoTopInCanvas = vRect.top - cRect.top;

    const offsetX = videoLeftInCanvas + letterboxX;
    const offsetY = videoTopInCanvas + letterboxY;

    return {
      offsetX,
      offsetY,
      renderWidth: Math.max(1, actualWidth),
      renderHeight: Math.max(1, actualHeight)
    };
  }

  /**
   * Convierte coordenadas de ratón (clientX, clientY) en coordenadas normalizadas [0.0, 1.0]
   * referenciadas estrictamente al contenido visible del video.
   */
  normalizeCoords(clientX, clientY) {
    this.resizeCanvas();
    const cRect = this.canvas.getBoundingClientRect();
    const mouseCanvasX = clientX - cRect.left;
    const mouseCanvasY = clientY - cRect.top;

    const vRect = this.getVideoRenderRect();
    const normX = (mouseCanvasX - vRect.offsetX) / vRect.renderWidth;
    const normY = (mouseCanvasY - vRect.offsetY) / vRect.renderHeight;

    return {
      x: Math.max(0, Math.min(1, normX)),
      y: Math.max(0, Math.min(1, normY)),
      inside: normX >= 0 && normX <= 1 && normY >= 0 && normY <= 1
    };
  }

  /**
   * Convierte coordenadas normalizadas [0.0, 1.0] a píxeles exactos en el canvas local
   */
  denormalizeCoords(normX, normY) {
    const vRect = this.getVideoRenderRect();
    return {
      x: vRect.offsetX + normX * vRect.renderWidth,
      y: vRect.offsetY + normY * vRect.renderHeight
    };
  }

  bindEvents() {
    window.addEventListener('resize', () => this.resizeCanvas());

    let moveRafPending = false;
    this.canvas.addEventListener('mousemove', (e) => {
      if (!this.isActive) return;
      if (moveRafPending) return;
      moveRafPending = true;

      requestAnimationFrame(() => {
        moveRafPending = false;
        const coords = this.normalizeCoords(e.clientX, e.clientY);
        if (coords.inside) {
          if (this.isDrawing && this.lastPosition) {
            this.addDrawingPoint(coords.x, coords.y, this.myColor);
            if (this.onEmitPointer) {
              this.onEmitPointer({ type: 'draw', x: coords.x, y: coords.y, color: this.myColor });
            }
          } else {
            if (this.onEmitPointer) {
              this.onEmitPointer({ type: 'move', x: coords.x, y: coords.y, color: this.myColor });
            }
          }
          this.lastPosition = coords;
        }
      });
    });

    this.canvas.addEventListener('mousedown', (e) => {
      if (!this.isActive) return;
      const coords = this.normalizeCoords(e.clientX, e.clientY);
      if (coords.inside) {
        this.isDrawing = true;
        this.lastPosition = coords;
        this.addRipple(coords.x, coords.y, this.myColor);
        if (this.onEmitPointer) {
          this.onEmitPointer({ type: 'click', x: coords.x, y: coords.y, color: this.myColor });
        }
      }
    });

    window.addEventListener('mouseup', () => {
      this.isDrawing = false;
      this.lastPosition = null;
    });

    this.canvas.addEventListener('mouseleave', () => {
      this.isDrawing = false;
      this.lastPosition = null;
    });
  }

  // Recibir eventos de puntero láser de otros usuarios
  handleRemotePointer(data) {
    const { senderId, senderName, type, x, y, color } = data;

    if (type === 'move') {
      this.remotePointers.set(senderId, {
        x, y,
        name: senderName || 'Operador',
        color: color || '#f43f5e',
        lastUpdated: Date.now()
      });
    } else if (type === 'click') {
      this.addRipple(x, y, color || '#f43f5e');
      this.remotePointers.set(senderId, {
        x, y,
        name: senderName || 'Operador',
        color: color || '#f43f5e',
        lastUpdated: Date.now()
      });
    } else if (type === 'draw') {
      this.addDrawingPoint(x, y, color || '#f43f5e');
    }
  }

  // Recibir eventos de Control Remoto de ratón / teclado de otros usuarios
  handleRemoteControl(data) {
    const { senderId, senderName, type, x, y, button, key } = data;
    let ctrl = this.remoteControllers.get(senderId);
    if (!ctrl) {
      ctrl = {
        x: x !== undefined ? x : 0.5,
        y: y !== undefined ? y : 0.5,
        name: senderName || 'Operador',
        color: '#10b981',
        lastUpdated: Date.now(),
        isClicking: false,
        lastAction: ''
      };
      this.remoteControllers.set(senderId, ctrl);
    }

    if (x !== undefined && y !== undefined) {
      ctrl.x = x;
      ctrl.y = y;
    }
    ctrl.lastUpdated = Date.now();

    if (type === 'move') {
      ctrl.lastAction = '';
    } else if (type === 'click' || type === 'mousedown') {
      ctrl.isClicking = true;
      ctrl.lastAction = button === 2 ? 'Clic Derecho' : 'Clic';
      this.addRipple(ctrl.x, ctrl.y, button === 2 ? '#a855f7' : '#10b981');
      setTimeout(() => { ctrl.isClicking = false; }, 180);
    } else if (type === 'dblclick') {
      ctrl.lastAction = 'Doble Clic';
      this.addRipple(ctrl.x, ctrl.y, '#3b82f6');
    } else if (type === 'contextmenu') {
      ctrl.lastAction = 'Clic Derecho';
      this.addRipple(ctrl.x, ctrl.y, '#a855f7');
    } else if (type === 'wheel') {
      ctrl.lastAction = 'Scroll';
    } else if (type === 'keydown') {
      ctrl.lastAction = `Tecla: ${key}`;
    }
  }

  addRipple(normX, normY, color) {
    this.ripples.push({
      normX,
      normY,
      radius: 4,
      maxRadius: 36,
      alpha: 1.0,
      color: color || '#f43f5e'
    });
  }

  addDrawingPoint(normX, normY, color) {
    if (this.strokes.length === 0 || Date.now() - this.strokes[this.strokes.length - 1].timestamp > 200) {
      this.strokes.push({
        points: [{ normX, normY }],
        color: color || '#f43f5e',
        timestamp: Date.now(),
        alpha: 1.0
      });
    } else {
      this.strokes[this.strokes.length - 1].points.push({ normX, normY });
    }
  }

  clearCanvas() {
    this.remotePointers.clear();
    this.remoteControllers.clear();
    this.ripples = [];
    this.strokes = [];
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  startRenderLoop() {
    const render = () => {
      this.resizeCanvas();
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

      const now = Date.now();

      // 1. Dibujar trazos temporales
      for (let i = this.strokes.length - 1; i >= 0; i--) {
        const stroke = this.strokes[i];
        const age = now - stroke.timestamp;

        // Desvanecer después de 3.5 segundos
        if (age > 3500) {
          this.strokes.splice(i, 1);
          continue;
        }

        stroke.alpha = Math.max(0, 1 - (age / 3500));
        if (stroke.points.length > 1) {
          this.ctx.beginPath();
          this.ctx.strokeStyle = stroke.color;
          this.ctx.lineWidth = 3;
          this.ctx.lineCap = 'round';
          this.ctx.lineJoin = 'round';
          this.ctx.globalAlpha = stroke.alpha;

          const p0 = this.denormalizeCoords(stroke.points[0].normX, stroke.points[0].normY);
          this.ctx.moveTo(p0.x, p0.y);
          for (let j = 1; j < stroke.points.length; j++) {
            const pj = this.denormalizeCoords(stroke.points[j].normX, stroke.points[j].normY);
            this.ctx.lineTo(pj.x, pj.y);
          }
          this.ctx.stroke();
          this.ctx.globalAlpha = 1.0;
        }
      }

      // 2. Dibujar ondas expansivas (ripples de clics)
      for (let i = this.ripples.length - 1; i >= 0; i--) {
        const r = this.ripples[i];
        const pos = this.denormalizeCoords(r.normX, r.normY);

        this.ctx.beginPath();
        this.ctx.arc(pos.x, pos.y, r.radius, 0, Math.PI * 2);
        this.ctx.strokeStyle = r.color;
        this.ctx.lineWidth = 2.5;
        this.ctx.globalAlpha = r.alpha;
        this.ctx.stroke();
        this.ctx.globalAlpha = 1.0;

        r.radius += 1.2;
        r.alpha = Math.max(0, 1 - (r.radius / r.maxRadius));

        if (r.radius >= r.maxRadius || r.alpha <= 0) {
          this.ripples.splice(i, 1);
        }
      }

      // 3. Dibujar punteros remotos (Modo Láser)
      for (const [senderId, ptr] of this.remotePointers.entries()) {
        if (now - ptr.lastUpdated > 4000) {
          this.remotePointers.delete(senderId);
          continue;
        }

        const pos = this.denormalizeCoords(ptr.x, ptr.y);

        // Halo brillante del puntero láser
        const gradient = this.ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, 14);
        gradient.addColorStop(0, ptr.color);
        gradient.addColorStop(0.3, ptr.color);
        gradient.addColorStop(1, 'rgba(0,0,0,0)');

        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(pos.x, pos.y, 14, 0, Math.PI * 2);
        this.ctx.fill();

        // Punto central brillante
        this.ctx.fillStyle = '#ffffff';
        this.ctx.beginPath();
        this.ctx.arc(pos.x, pos.y, 3.5, 0, Math.PI * 2);
        this.ctx.fill();

        // Etiqueta con el nombre del usuario
        this.ctx.font = '600 11px Plus Jakarta Sans, sans-serif';
        const textWidth = this.ctx.measureText(ptr.name).width;
        const tagX = pos.x + 12;
        const tagY = pos.y + 12;

        this.ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
        this.ctx.beginPath();
        this.ctx.roundRect(tagX - 4, tagY - 12, textWidth + 8, 18, 4);
        this.ctx.fill();

        this.ctx.fillStyle = ptr.color;
        this.ctx.fillText(ptr.name, tagX, tagY);
      }

      // 4. Dibujar cursores de Control Remoto de ratón
      for (const [senderId, ctrl] of this.remoteControllers.entries()) {
        if (now - ctrl.lastUpdated > 5000) {
          this.remoteControllers.delete(senderId);
          continue;
        }

        const pos = this.denormalizeCoords(ctrl.x, ctrl.y);

        // Dibujar flecha de ratón estilo OS
        this.ctx.save();
        this.ctx.translate(pos.x, pos.y);
        this.ctx.beginPath();
        this.ctx.moveTo(0, 0);
        this.ctx.lineTo(0, 16);
        this.ctx.lineTo(4, 12);
        this.ctx.lineTo(8, 20);
        this.ctx.lineTo(11, 18);
        this.ctx.lineTo(7, 11);
        this.ctx.lineTo(13, 11);
        this.ctx.closePath();
        this.ctx.fillStyle = ctrl.isClicking ? '#059669' : '#10b981';
        this.ctx.fill();
        this.ctx.lineWidth = 1.5;
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.stroke();
        this.ctx.restore();

        // Etiqueta de control
        this.ctx.font = '700 10px Plus Jakarta Sans, sans-serif';
        const label = ctrl.lastAction ? `${ctrl.name} (${ctrl.lastAction})` : `${ctrl.name} [Control]`;
        const textWidth = this.ctx.measureText(label).width;
        const tagX = pos.x + 14;
        const tagY = pos.y + 14;

        this.ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
        this.ctx.beginPath();
        this.ctx.roundRect(tagX - 4, tagY - 11, textWidth + 8, 16, 4);
        this.ctx.fill();
        this.ctx.strokeStyle = 'rgba(16, 185, 129, 0.5)';
        this.ctx.stroke();

        this.ctx.fillStyle = '#6ee7b7';
        this.ctx.fillText(label, tagX, tagY);
      }

      requestAnimationFrame(render);
    };

    requestAnimationFrame(render);
  }
}
