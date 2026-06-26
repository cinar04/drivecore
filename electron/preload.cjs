const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  appVersion: process.env.npm_package_version,

  // Güncelleme olaylarını dinle
  onUpdateChecking:     (cb) => ipcRenderer.on('update:checking',      (_, d) => cb(d)),
  onUpdateAvailable:    (cb) => ipcRenderer.on('update:available',     (_, d) => cb(d)),
  onUpdateNotAvailable: (cb) => ipcRenderer.on('update:not-available', (_, d) => cb(d)),
  onUpdateProgress:     (cb) => ipcRenderer.on('update:progress',      (_, d) => cb(d)),
  onUpdateDownloaded:   (cb) => ipcRenderer.on('update:downloaded',    (_, d) => cb(d)),
  onUpdateError:        (cb) => ipcRenderer.on('update:error',         (_, d) => cb(d)),

  // Güncelleme tetikle
  checkForUpdates: () => ipcRenderer.send('update:check-now'),
  installUpdate:   () => ipcRenderer.send('update:install-now'),

  // Dinleyicileri temizle
  removeUpdateListeners: () => {
    ['checking','available','not-available','progress','downloaded','error']
      .forEach(e => ipcRenderer.removeAllListeners(`update:${e}`));
  },
});
