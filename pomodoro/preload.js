const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('pomodoroAPI', {
  showNotification: (data) => ipcRenderer.invoke('show-notification', data),
  setAlwaysOnTop: (flag) => ipcRenderer.invoke('set-always-on-top', flag),
  minimizeWindow: () => ipcRenderer.invoke('minimize-window'),
  closeWindow: () => ipcRenderer.invoke('close-window'),
  // Timer channel: renderer -> main (one-way, no response needed)
  onTimerEnd: (callback) => {
    ipcRenderer.on('timer-end', () => callback());
  }
});
