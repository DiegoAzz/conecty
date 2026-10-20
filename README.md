# Conecty 🚀

> Aplicación web de asistencia remota, llamadas de voz e interacción en vivo en tiempo real. **100% online y sin descargas de software**, lista para compartir mediante un simple enlace.

![Conecty Banner](https://img.shields.io/badge/WebRTC-Audio%20%7C%20ScreenShare%20%7C%20DataChannel-indigo?style=for-the-badge)
![Coolify Ready](https://img.shields.io/badge/Coolify-Ready-purple?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-emerald?style=for-the-badge)

---

## 🌟 Características Principales

* **🔗 Acceso Inmediato por Enlace (Cero Descargas)**:
  * Genera una sala instantánea y compártela vía URL (ej. `https://tu-dominio.com/?room=soporte-123`).
  * Sin necesidad de instalar plugins, ejecutables ni extensiones. Funciona directo en Chrome, Edge, Firefox, Brave, Safari u Opera.

* **🎙️ Llamadas de Voz en Tiempo Real**:
  * Audio bidireccional Full-Duplex de ultra baja latencia con WebRTC (códec Opus).
  * Cancelación de eco acústico (AEC) y supresión de ruido ambiental nativa.
  * Botón rápido de silenciar / activar micrófono (con atajo de teclado tecla `M`).

* **🖥️ Compartir Pantalla en Calidad HD**:
  * Transmisión de pantalla completa, ventanas de aplicaciones o pestañas del navegador con 1 clic (`getDisplayMedia`).
  * Soporte opcional para compartir audio del sistema / multimedia.
  * Adaptación automática de resolución y reescalado fluido en cualquier pantalla.

* **🔴 Puntero Láser y Anotaciones Interactivas en Vivo**:
  * Guía visual en tiempo real: Mientras el anfitrión comparte pantalla, el operador mueve su ratón sobre el video y aparece un puntero láser brillante con su nombre.
  * Efecto de radar al hacer clic ("¡Haz clic aquí!").
  * Trazos y flechas temporales que se desvanecen automáticamente tras unos segundos.
  * Coordenadas normalizadas con corrección de aspect ratio (`object-contain`).

* **💬 Chat Integrado**:
  * Panel lateral colapsible con contador de mensajes no leídos para compartir texto, enlaces, notas y comandos.

* **🔒 Privacidad y Cifrado**:
  * Tráfico multimedia y datos cifrados de punto a punto (DTLS-SRTP).
  * Control total para iniciar o detener la transmisión de pantalla en cualquier momento.

---

## 🚀 Despliegue en Coolify

Dado que el repositorio cuenta con `Dockerfile` y `docker-compose.yml`, el despliegue en Coolify es automático:

1. Entra a tu panel de **Coolify**.
2. En tu proyecto, añade un nuevo recurso seleccionando **Public Repository** o **Private Repository** (GitHub).
3. Ingresa la URL: `https://github.com/DiegoAzz/conecty.git`
4. Selecciona **Build Pack: Dockerfile** (o Docker Compose).
5. En la configuración de red / dominios en Coolify:
   * **Domain**: Escribe tu dominio o subdominio (ej: `https://conecty.tudominio.com`). Coolify generará automáticamente el certificado SSL (HTTPS/WSS) con Let's Encrypt.
   * **Port**: `3000`.
6. Haz clic en **Deploy**. ¡Listo!

---

## 💻 Ejecución Local / Pruebas

Para probarlo localmente en tu máquina:

```bash
# 1. Instalar dependencias
npm install

# 2. Iniciar el servidor
npm start
```

Abre en tu navegador:
* Navegador 1: `http://localhost:3000` (Ingresa con tu nombre y crea una sala).
* Navegador 2 (o ventana de incógnito): Abre el enlace generado para simular la conexión entre dos usuarios.

---

## 🛠️ Tecnologías Utilizadas

* **Backend**: Node.js, Express, Socket.IO (Señalización WebRTC).
* **Frontend**: Vanilla ES6 Modular, HTML5 Canvas (Láser y Marcador), Tailwind CSS, Lucide Icons, Web Audio API.
* **Protocolos**: WebSockets, WebRTC (PeerConnection, MediaStreams, DataChannels).
* **Infraestructura**: Docker, Coolify.
