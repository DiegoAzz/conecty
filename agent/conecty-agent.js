/**
 * Conecty Desktop Agent (Windows Native Companion)
 * Permite que el operador tome el control físico del ratón y teclado de Windows
 * fuera del navegador (mover cursor en el escritorio, clic en cualquier app, etc.)
 * 
 * Uso:
 *   node agent/conecty-agent.js
 * o con argumentos:
 *   node agent/conecty-agent.js https://conecty.appzplay.online 486782545
 */

const { io } = require('socket.io-client');
const { exec } = require('child_process');

const SERVER_URL = process.argv[2] || process.env.CONECTY_SERVER || 'http://localhost:3000';
const DEVICE_ID = (process.argv[3] || process.env.CONECTY_DEVICE_ID || '').replace(/\D/g, '');

console.log('====================================================');
console.log('🚀 Conecty Desktop Agent para Windows');
console.log(`🌐 Servidor: ${SERVER_URL}`);
console.log('====================================================');

if (!DEVICE_ID) {
  console.log('⚠️ Por favor indica el número de 9 dígitos de tu equipo.');
  console.log('Ejemplo: node agent/conecty-agent.js https://conecty.appzplay.online 486782545');
  console.log('\nEsperando que introduzcas tu ID de 9 dígitos:');
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });
  readline.question('ID de 9 dígitos: ', (answer) => {
    readline.close();
    startAgent(answer.replace(/\D/g, ''));
  });
} else {
  startAgent(DEVICE_ID);
}

function startAgent(deviceId) {
  if (!deviceId || deviceId.length !== 9) {
    console.error('❌ Número Conecty no válido. Debe tener 9 dígitos.');
    process.exit(1);
  }

  const roomId = 'device-' + deviceId;
  console.log(`📡 Conectando al equipo: ${deviceId} (Sala: ${roomId})...`);

  const socket = io(SERVER_URL, {
    transports: ['websocket'],
    upgrade: false
  });

  socket.on('connect', () => {
    console.log('✅ Conectado al servidor de Conecty.');
    socket.emit('register-device', {
      deviceId,
      userName: 'Windows-Agent'
    });
    socket.emit('join-room', {
      roomId,
      userName: 'Windows-Agent',
      deviceId
    });
    console.log('🎮 Asistente listo. Recibiendo comandos de ratón y teclado...');
  });

  socket.on('remote-control', (data) => {
    handleControlEvent(data);
  });

  socket.on('disconnect', () => {
    console.warn('⚠️ Desconectado del servidor. Reconectando...');
  });
}

/**
 * Ejecuta comandos de ratón y teclado en Windows usando PowerShell y user32.dll
 */
let lastPsProcess = null;
function executeWindowsInput(psCommand) {
  const fullCmd = `powershell -NoProfile -Command "Add-Type -AssemblyName System.Windows.Forms; ${psCommand}"`;
  exec(fullCmd, (err) => {
    if (err) {
      // Ignorar si se encadenan rápido
    }
  });
}

function handleControlEvent(data) {
  const { type, x, y, button, key } = data;

  if (type === 'move' && x !== undefined && y !== undefined) {
    // Obtener resolución de pantalla y mover cursor
    const ps = `$bounds = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds; $px = [int]($bounds.Width * ${x}); $py = [int]($bounds.Height * ${y}); [System.Windows.Forms.Cursor]::Position = New-Object System.Drawing.Point($px, $py)`;
    executeWindowsInput(ps);
  } else if (type === 'click') {
    // Clic en posición
    const mouseBtnCode = button === 2 ? 0x08 | 0x10 : 0x02 | 0x04; // RIGHTDOWN/UP : LEFTDOWN/UP
    const ps = `
      $signature = '[DllImport(\\"user32.dll\\")] public static extern void mouse_event(int dwFlags, int dx, int dy, int dwData, int dwExtraInfo);';
      $type = Add-Type -MemberDefinition $signature -Name Win32Mouse -PassThru;
      $type::mouse_event(${mouseBtnCode}, 0, 0, 0, 0);
    `;
    executeWindowsInput(ps);
  } else if (type === 'keydown' && key) {
    // Envío de pulsación de tecla
    if (key.length === 1) {
      const ps = `[System.Windows.Forms.SendKeys]::SendWait('${key}')`;
      executeWindowsInput(ps);
    }
  }
}
