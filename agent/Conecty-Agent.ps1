# Conecty Windows Companion Agent
Param(
  [string]$ServerUrl = "https://conecty.appzplay.online",
  [string]$DeviceId = "",
  [string]$RoomId = ""
)

$Host.UI.RawUI.WindowTitle = "Conecty - Asistente de Control Remoto Windows"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  CONECTY - ASISTENTE DE CONTROL REMOTO (WINDOWS)" -ForegroundColor White
Write-Host "============================================================" -ForegroundColor Cyan

$cleanId = $DeviceId -replace '\D',''
if (-not $cleanId -or $cleanId.Trim().Length -ne 9) {
  while (-not $cleanId -or $cleanId.Trim().Length -ne 9) {
    Write-Host "Introduce tu numero Conecty de 9 digitos (ej. 486782545):" -ForegroundColor Yellow
    $DeviceId = (Read-Host "ID Conecty").Trim()
    $cleanId = $DeviceId -replace '\D',''
  }
}

if ($RoomId) {
  $roomId = $RoomId
} else {
  $roomId = "device-$cleanId"
}

Write-Host "  Dispositivo Conecty : $cleanId" -ForegroundColor Yellow
Write-Host "  Servidor           : $ServerUrl" -ForegroundColor Gray
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

Add-Type -AssemblyName System.Windows.Forms
Add-Type @"
using System;
using System.Runtime.InteropServices;

public class Win32InputNative {
    [DllImport("user32.dll")]
    public static extern void mouse_event(int dwFlags, int dx, int dy, int dwData, int dwExtraInfo);

    [DllImport("user32.dll")]
    public static extern bool SetCursorPos(int X, int Y);
}
"@

$screen = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds

$wsUrl = $ServerUrl.Replace("http://", "ws://").Replace("https://", "wss://")
if (-not $wsUrl.EndsWith("/")) { $wsUrl += "/" }
$wsUrl += "socket.io/?EIO=4&transport=websocket"

Write-Host "[1/3] Conectando al servidor..." -ForegroundColor Gray
$ws = New-Object System.Net.WebSockets.ClientWebSocket
$cts = New-Object System.Threading.CancellationTokenSource(12000)

try {
  $ws.ConnectAsync([System.Uri]::new($wsUrl), $cts.Token).Wait()
} catch {
  Write-Host "[ERROR] No se pudo conectar al servidor de Conecty: $_" -ForegroundColor Red
  Read-Host "Presiona Enter para salir..."
  exit 1
}

function Send-WS([string]$text) {
  if ($ws.State -ne [System.Net.WebSockets.WebSocketState]::Open) { return }
  $bytes = [System.Text.Encoding]::UTF8.GetBytes($text)
  $seg = New-Object System.ArraySegment[byte] ($bytes, 0, $bytes.Length)
  $ws.SendAsync($seg, [System.Net.WebSockets.WebSocketMessageType]::Text, $true, [System.Threading.CancellationToken]::None).Wait()
}

$buf = New-Object byte[] 32768
$seg = New-Object System.ArraySegment[byte] ($buf, 0, $buf.Length)

$rec = $ws.ReceiveAsync($seg, [System.Threading.CancellationToken]::None)
$rec.Wait()
Send-WS "40"
$rec = $ws.ReceiveAsync($seg, [System.Threading.CancellationToken]::None)
$rec.Wait()

Write-Host "[2/3] Registrando permisos de control fisico para tu equipo..." -ForegroundColor Gray
$regPayload = '42["register-device",{"deviceId":"' + $cleanId + '","userName":"Windows-Native-Agent","isAgent":true,"roomId":"' + $roomId + '"}]'
Send-WS $regPayload

$joinPayload = '42["join-room",{"roomId":"' + $roomId + '","userName":"Windows-Native-Agent","deviceId":"' + $cleanId + '","isAgent":true}]'
Send-WS $joinPayload

Write-Host "[3/3] LISTO!" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Green
Write-Host "  ASISTENTE CONECTADO Y ACTIVO" -ForegroundColor White
Write-Host "  Cualquier clic del operador sobre tu pantalla compartida" -ForegroundColor Gray
Write-Host "  se ejecutara en vivo sobre YouTube, Edge, apps y Windows." -ForegroundColor Gray
Write-Host "  (Manten esta ventana abierta mientras dure la llamada)" -ForegroundColor Yellow
Write-Host "============================================================" -ForegroundColor Green
Write-Host ""

while ($ws.State -eq [System.Net.WebSockets.WebSocketState]::Open) {
  try {
    $rec = $ws.ReceiveAsync($seg, [System.Threading.CancellationToken]::None)
    $rec.Wait()
    if ($rec.Result.Count -le 0) { continue }
    $msg = [System.Text.Encoding]::UTF8.GetString($buf, 0, $rec.Result.Count)

    if ($msg -eq "2") {
      Send-WS "3"
      continue
    }

    if ($msg.StartsWith("42")) {
      $jsonStr = $msg.Substring(2)
      $parsed = $jsonStr | ConvertFrom-Json
      $eventName = $parsed[0]
      if ($eventName -eq "remote-control") {
        $ev = $parsed[1]
        $type = $ev.type

        if ($type -eq "move" -and $null -ne $ev.x -and $null -ne $ev.y) {
          $px = [int]($screen.Width * [double]$ev.x)
          $py = [int]($screen.Height * [double]$ev.y)
          [Win32InputNative]::SetCursorPos($px, $py)
        }
        elseif ($type -eq "click" -or $type -eq "mousedown") {
          $px = [int]($screen.Width * [double]$ev.x)
          $py = [int]($screen.Height * [double]$ev.y)
          [Win32InputNative]::SetCursorPos($px, $py)

          $btn = if ($null -ne $ev.button) { [int]$ev.button } else { 0 }
          $down = if ($btn -eq 2) { 0x0008 } else { 0x0002 }
          $up   = if ($btn -eq 2) { 0x0010 } else { 0x0004 }

          [Win32InputNative]::mouse_event($down, 0, 0, 0, 0)
          if ($type -eq "click") {
            [Win32InputNative]::mouse_event($up, 0, 0, 0, 0)
          }
          Write-Host "  [CLIC] en ($px, $py) Boton: $(if ($btn -eq 2) {'Derecho'} else {'Izquierdo'})" -ForegroundColor Green
        }
        elseif ($type -eq "mouseup") {
          $px = [int]($screen.Width * [double]$ev.x)
          $py = [int]($screen.Height * [double]$ev.y)
          [Win32InputNative]::SetCursorPos($px, $py)
          $btn = if ($null -ne $ev.button) { [int]$ev.button } else { 0 }
          $up  = if ($btn -eq 2) { 0x0010 } else { 0x0004 }
          [Win32InputNative]::mouse_event($up, 0, 0, 0, 0)
        }
        elseif ($type -eq "dblclick") {
          $px = [int]($screen.Width * [double]$ev.x)
          $py = [int]($screen.Height * [double]$ev.y)
          [Win32InputNative]::SetCursorPos($px, $py)
          [Win32InputNative]::mouse_event(0x0002, 0, 0, 0, 0)
          [Win32InputNative]::mouse_event(0x0004, 0, 0, 0, 0)
          Start-Sleep -Milliseconds 40
          [Win32InputNative]::mouse_event(0x0002, 0, 0, 0, 0)
          [Win32InputNative]::mouse_event(0x0004, 0, 0, 0, 0)
          Write-Host "  [DOBLE CLIC] en ($px, $py)" -ForegroundColor Green
        }
        elseif ($type -eq "wheel" -and $null -ne $ev.deltaY) {
          $amount = if ([double]$ev.deltaY -gt 0) { -120 } else { 120 }
          [Win32InputNative]::mouse_event(0x0800, 0, 0, $amount, 0)
        }
        elseif ($type -eq "keydown" -and $null -ne $ev.key) {
          $key = [string]$ev.key
          if ($key.Length -eq 1) {
            $sanitized = $key -replace '([+^%~(){}\[\]])', '{$1}'
            [System.Windows.Forms.SendKeys]::SendWait($sanitized)
          } elseif ($key -eq "Enter") {
            [System.Windows.Forms.SendKeys]::SendWait("{ENTER}")
          } elseif ($key -eq "Backspace") {
            [System.Windows.Forms.SendKeys]::SendWait("{BACKSPACE}")
          } elseif ($key -eq "Tab") {
            [System.Windows.Forms.SendKeys]::SendWait("{TAB}")
          } elseif ($key -eq "Escape") {
            [System.Windows.Forms.SendKeys]::SendWait("{ESC}")
          } elseif ($key -eq " ") {
            [System.Windows.Forms.SendKeys]::SendWait(" ")
          }
          Write-Host "  [TECLA] $key" -ForegroundColor Cyan
        }
      }
    }
  } catch {
    if ($ws.State -eq [System.Net.WebSockets.WebSocketState]::Open) {
      Write-Host "[AVISO] " + $_.Exception.Message -ForegroundColor DarkGray
    }
  }
}

Write-Host "Asistente desconectado." -ForegroundColor Yellow
