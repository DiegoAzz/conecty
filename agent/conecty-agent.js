/**
 * Conecty Desktop Agent (Windows Native Companion)
 * Permite que el operador tome el control físico del ratón y teclado de Windows
 * fuera del navegador (mover cursor en el escritorio, clic en YouTube, abrir apps, etc.)
 */

const { io } = require('socket.io-client');
const { spawn } = require('child_process');

const SERVER_URL = process.argv[2] || process.env.CONECTY_SERVER || 'https://conecty.appzplay.online';
const DEVICE_ID = (process.argv[3] || process.env.CONECTY_DEVICE_ID || '').replace(/\D/g, '');

console.log('====================================================');
console.log('🚀 Conecty Desktop Agent para Windows');
console.log(`🌐 Servidor: ${SERVER_URL}`);
console.log('====================================================');

// Controlador nativo de Windows mediante proceso PowerShell persistente (< 1ms latencia)
class WindowsInputController {
  constructor() {
    this.ps = spawn('powershell', ['-NoProfile', '-Command', '-'], {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    const initScript = `
      Add-Type -AssemblyName System.Windows.Forms
      $sig = @'
[DllImport("user32.dll")]
public static extern void mouse_event(int dwFlags, int dx, int dy, int dwData, int dwExtraInfo);
[DllImport("user32.dll")]
public static extern bool SetCursorPos(int X, int Y);
'@
      $Win32 = Add-Type -MemberDefinition $sig -Name "Win32Native" -Namespace "Conecty" -PassThru
      $Global:Bounds = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds
      Write-Output "CONECTY_INPUT_READY"
    `;

    this.ps.stdin.write(initScript + '\n');
    this.isReady = false;

    this.ps.stdout.on('data', (d) => {
      const msg = d.toString();
      if (msg.includes('CONECTY_INPUT_READY')) {
        this.isReady = true;
        console.log('⚡ Controlador nativo de Windows activo (Latencia de entrada < 1ms)');
      }
    });

    this.ps.on('error', (err) => {
      console.error('Error en proceso nativo de Windows:', err);
    });
  }

  send(cmd) {
    if (this.ps && this.ps.stdin && this.ps.stdin.writable) {
      this.ps.stdin.write(cmd + '\n');
    }
  }

  moveTo(normX, normY) {
    this.send(`
      $px = [int]($Global:Bounds.Width * ${normX});
      $py = [int]($Global:Bounds.Height * ${normY});
      [System.Windows.Forms.Cursor]::Position = New-Object System.Drawing.Point($px, $py)
    `);
  }

  click(normX, normY, button = 0) {
    const downFlag = button === 2 ? 0x08 : 0x02; // RIGHTDOWN : LEFTDOWN
    const upFlag = button === 2 ? 0x10 : 0x04;   // RIGHTUP : LEFTUP
    this.send(`
      $px = [int]($Global:Bounds.Width * ${normX});
      $py = [int]($Global:Bounds.Height * ${normY});
      [System.Windows.Forms.Cursor]::Position = New-Object System.Drawing.Point($px, $py);
      [Conecty.Win32Native]::mouse_event(${downFlag}, 0, 0, 0, 0);
      [Conecty.Win32Native]::mouse_event(${upFlag}, 0, 0, 0, 0);
    `);
  }

  mouseDown(normX, normY, button = 0) {
    const downFlag = button === 2 ? 0x08 : 0x02;
    this.send(`
      $px = [int]($Global:Bounds.Width * ${normX});
      $py = [int]($Global:Bounds.Height * ${normY});
      [System.Windows.Forms.Cursor]::Position = New-Object System.Drawing.Point($px, $py);
      [Conecty.Win32Native]::mouse_event(${downFlag}, 0, 0, 0, 0);
    `);
  }

  mouseUp(normX, normY, button = 0) {
    const upFlag = button === 2 ? 0x10 : 0x04;
    this.send(`
      $px = [int]($Global:Bounds.Width * ${normX});
      $py = [int]($Global:Bounds.Height * ${normY});
      [System.Windows.Forms.Cursor]::Position = New-Object System.Drawing.Point($px, $py);
      [Conecty.Win32Native]::mouse_event(${upFlag}, 0, 0, 0, 0);
    `);
  }

  doubleClick(normX, normY) {
    this.click(normX, normY, 0);
    setTimeout(() => this.click(normX, normY, 0), 60);
  }

  scroll(deltaY) {
    const amount = deltaY > 0 ? -120 : 120;
    this.send(`[Conecty.Win32Native]::mouse_event(0x0800, 0, 0, ${amount}, 0);`);
  }

  keyPress(key) {
    if (key.length === 1) {
      const sanitized = key.replace(/([+^%~(){}[\]])/g, '{$1}');
      this.send(`[System.Windows.Forms.SendKeys]::SendWait('${sanitized}')`);
    } else if (key === 'Enter') {
      this.send(`[System.Windows.Forms.SendKeys]::SendWait('{ENTER}')`);
    } else if (key === 'Backspace') {
      this.send(`[System.Windows.Forms.SendKeys]::SendWait('{BACKSPACE}')`);
    } else if (key === 'Tab') {
      this.send(`[System.Windows.Forms.SendKeys]::SendWait('{TAB}')`);
    } else if (key === 'Escape') {
      this.send(`[System.Windows.Forms.SendKeys]::SendWait('{ESC}')`);
    } else if (key === ' ') {
      this.send(`[System.Windows.Forms.SendKeys]::SendWait(' ')`);
    }
  }
}

const inputController = new WindowsInputController();

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
    console.log('✅ Conectado exitosamente al servidor de Conecty.');
    socket.emit('register-device', {
      deviceId,
      userName: 'Windows-Native-Agent',
      isAgent: true
    });
    socket.emit('join-room', {
      roomId,
      userName: 'Windows-Native-Agent',
      deviceId,
      isAgent: true
    });
    console.log('====================================================');
    console.log('🎮 Asistente de Windows ACTIVO:');
    console.log('   Cualquier clic o tecla del operador se ejecutará');
    console.log('   directamente sobre tu escritorio y aplicaciones.');
    console.log('====================================================');
  });

  socket.on('remote-control', (data) => {
    const { type, x, y, button, deltaY, key } = data;

    if (type === 'move' && x !== undefined && y !== undefined) {
      inputController.moveTo(x, y);
    } else if (type === 'mousedown') {
      if (x !== undefined && y !== undefined) {
        inputController.mouseDown(x, y, button || 0);
      }
    } else if (type === 'mouseup') {
      if (x !== undefined && y !== undefined) {
        inputController.mouseUp(x, y, button || 0);
      }
    } else if (type === 'click') {
      if (x !== undefined && y !== undefined) {
        inputController.click(x, y, button || 0);
        console.log(`🖱️ Clic ejecutado en Windows: (${(x * 100).toFixed(1)}%, ${(y * 100).toFixed(1)}%) Botón: ${button === 2 ? 'Derecho' : 'Izquierdo'}`);
      }
    } else if (type === 'dblclick') {
      if (x !== undefined && y !== undefined) {
        inputController.doubleClick(x, y);
        console.log(`🖱️ Doble clic ejecutado en Windows: (${(x * 100).toFixed(1)}%, ${(y * 100).toFixed(1)}%)`);
      }
    } else if (type === 'contextmenu') {
      if (x !== undefined && y !== undefined) {
        inputController.click(x, y, 2);
        console.log(`🖱️ Clic Derecho ejecutado en Windows`);
      }
    } else if (type === 'wheel') {
      inputController.scroll(deltaY || 0);
    } else if (type === 'keydown' && key) {
      inputController.keyPress(key);
      console.log(`⌨️ Tecla ejecutada en Windows: ${key}`);
    }
  });

  socket.on('disconnect', () => {
    console.warn('⚠️ Desconectado del servidor. Reconectando...');
  });
}
