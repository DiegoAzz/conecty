/**
 * Módulo de Puntero Láser y Anotaciones Interactivas en Tiempo Real
 * Maneja coordenadas normalizadas (0.0 a 1.0) para que coincida exactamente
 * con el contenido del video independientemente de la resolución o escala.
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

    // Almacén de punteros remotos: { [senderId]: { x, y, name, color, lastUpdated } }
    this.remotePointers = new Map();
    // Ondas expansivas de clics: [ { x, y, radius, maxRadius, alpha, color } ]
    this.ripples = [];
    // Trazos temporales de dibujo: [ { points: [ {x, y} ], color, alpha, timestamp } ]
    this.strokes = [];

    this.myColor = this.getRandomBrightColor();

    this.bindEvents();
    this.startRenderLoop();
  }

  getRandomBrightColor() {
    const colors = ['#f43f5e', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  resizeCanvas() {
    const rect = this.video.getBoundingClientRect();
    if (this.canvas.width !== rect.width || this.canvas.height !== rect.height) {
      this.canvas.width = rect.width;
      this.canvas.height = rect.height;
    }
  }

  /**
   * Calcula el área real del video renderizado considerando 'object-contain'
   */
  getVideoRenderRect() {
    const canvasRect = this.canvas.getBoundingClientRect();
    const videoWidth = this.video.videoWidth || canvasRect.width;
    const videoHeight = this.video.videoHeight || canvasRect.height;

    const videoRatio = videoWidth / videoHeight;
    const canvasRatio = canvasRect.width / canvasRect.height;

    let renderWidth, renderHeight, offsetX, offsetY;

    if (canvasRatio > videoRatio) {
      renderHeight = canvasRect.height;
      renderWidth = renderHeight * videoRatio;
      offsetX = (canvasRect.width - renderWidth) / 2;
      offsetY = 0;
    } else {
      renderWidth = canvasRect.width;
      renderHeight = renderWidth / videoRatio;
      offsetX = 0;
      offsetY = (canvasRect.height - renderHeight) / 2;
    }

    return { offsetX, offsetY, renderWidth, renderHeight };
  }

  /**
   * Convierte coordenadas de ratón en el canvas a coordenadas normalizadas [0, 1]
   */
  normalizeCoords(clientX, clientY) {
    const rect = this.canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    const vRect = this.getVideoRenderRect();
    const normX = (x - vRect.offsetX) / vRect.renderWidth;
    const normY = (y - vRect.offsetY) / vRect.renderHeight;

    return {
      x: Math.max(0, Math.min(1, normX)),
      y: Math.max(0, Math.min(1, normY)),
      inside: normX >= 0 && normX <= 1 && normY >= 0 && normY <= 1
    };
  }

  /**
   * Convierte coordenadas normalizadas [0, 1] a pixeles del canvas actual
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

    this.canvas.addEventListener('mousemove', (e) => {
      if (!this.isActive) return;
      this.resizeCanvas();
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

    this.canvas.addEventListener('mousedown', (e) => {
      if (!this.isActive) return;
      this.resizeCanvas();
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

  // Recibir eventos de otros usuarios
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

      // 3. Dibujar punteros remotos
      for (const [senderId, ptr] of this.remotePointers.entries()) {
        // Desvanecer si no hay movimiento en 4 segundos
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

      requestAnimationFrame(render);
    };

    requestAnimationFrame(render);
  }
}
