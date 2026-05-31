const { app, BrowserWindow, Tray, Menu, nativeImage, ipcMain, Notification } = require('electron');
const path = require('path');

// Suppress GPU disk cache errors on restricted systems
app.commandLine.appendSwitch('disable-gpu-shader-disk-cache');
app.setPath('userData', path.join(__dirname, '.electron-data'));

let win = null;
let tray = null;
let isQuitting = false;

function createTrayIcon() {
  // Create a 16x16 tray icon programmatically
  const icon = nativeImage.createFromBuffer(createTrayIconBuffer(), { width: 16, height: 16 });
  tray = new Tray(icon);
  const contextMenu = Menu.buildFromTemplate([
    { label: '显示', click: () => { win.show(); win.focus(); } },
    { type: 'separator' },
    { label: '退出', click: () => { isQuitting = true; app.quit(); } }
  ]);
  tray.setToolTip('番茄钟');
  tray.setContextMenu(contextMenu);
  tray.on('double-click', () => { win.show(); win.focus(); });
}

function createTrayIconBuffer() {
  // Simple 16x16 RGBA red tomato icon
  const size = 16;
  const buf = Buffer.alloc(size * size * 4);
  const cx = 7.5, cy = 8, r = 6;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      const dx = x - cx, dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist <= r && !(dx > 2 && dy < -4)) {
        buf[i] = 220;     // R
        buf[i + 1] = 50;  // G
        buf[i + 2] = 50;  // B
        buf[i + 3] = 255; // A
      } else {
        buf[i + 3] = 0;
      }
    }
  }
  return buf;
}

function createWindow() {
  win = new BrowserWindow({
    width: 340,
    height: 460,
    resizable: false,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  win.loadFile(path.join(__dirname, 'renderer', 'index.html'));

  win.on('close', (e) => {
    if (!isQuitting) {
      e.preventDefault();
      win.hide();
    }
  });
}

// IPC handlers
ipcMain.handle('show-notification', (_, { title, body }) => {
  if (Notification.isSupported()) {
    new Notification({ title, body, silent: false }).show();
  }
});

ipcMain.handle('set-always-on-top', (_, flag) => {
  if (win) win.setAlwaysOnTop(flag);
});

ipcMain.handle('minimize-window', () => {
  if (win) win.minimize();
});

ipcMain.handle('close-window', () => {
  if (win) win.hide();
});

app.whenReady().then(() => {
  createWindow();
  createTrayIcon();
});

app.on('before-quit', () => {
  isQuitting = true;
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (win) win.show();
});
