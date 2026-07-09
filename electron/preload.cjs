const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  appVersion: process.env.npm_package_version,

  // ── Pencere kontrolleri ──────────────────────────────────────────────────
  windowMinimize:   () => ipcRenderer.send('window:minimize'),
  windowMaximize:   () => ipcRenderer.send('window:maximize'),
  windowClose:      () => ipcRenderer.send('window:close'),
  windowIsMaximized: () => ipcRenderer.sendSync('window:is-maximized'),
  onWindowState:    (cb) => ipcRenderer.on('window:state', (_, d) => cb(d)),
  onWindowFocus:    (cb) => ipcRenderer.on('window:focus', (_, d) => cb(d)),
  focusWindow:      () => ipcRenderer.send('window:focus-and-show'),

  // ── Güncelleme olayları ──────────────────────────────────────────────────
  onUpdateChecking:     (cb) => ipcRenderer.on('update:checking',      (_, d) => cb(d)),
  onUpdateAvailable:    (cb) => ipcRenderer.on('update:available',     (_, d) => cb(d)),
  onUpdateNotAvailable: (cb) => ipcRenderer.on('update:not-available', (_, d) => cb(d)),
  onUpdateProgress:     (cb) => ipcRenderer.on('update:progress',      (_, d) => cb(d)),
  onUpdateDownloaded:   (cb) => ipcRenderer.on('update:downloaded',    (_, d) => cb(d)),
  onUpdateError:        (cb) => ipcRenderer.on('update:error',         (_, d) => cb(d)),
  onUpdateCheckRequested: (cb) => ipcRenderer.on('update:check-requested', (_, d) => cb(d)),

  // ── Güncelleme aksiyonları ───────────────────────────────────────────────
  checkForUpdates: () => ipcRenderer.send('update:check-now'),
  startDownload:   () => ipcRenderer.send('update:start-download'),
  installUpdate:   () => ipcRenderer.send('update:install-now'),

  // ── Dinleyicileri temizle ────────────────────────────────────────────────
  removeUpdateListeners: () => {
    ['checking','available','not-available','progress','downloaded','error','check-requested']
      .forEach(e => ipcRenderer.removeAllListeners(`update:${e}`));
  },
  removeWindowListeners: () => {
    ipcRenderer.removeAllListeners('window:state');
    ipcRenderer.removeAllListeners('window:focus');
  },

  // ── Google OAuth (Electron) ──────────────────────────────────────────────
  // signInWithPopup Electron'da çalışmaz; bu yöntemle main process
  // ayrı bir pencere açıp Google'dan access_token alır, renderer bunu
  // Firebase'e GoogleAuthProvider.credential() ile verir.
  startGoogleOAuth: () => ipcRenderer.invoke('google-oauth:start'),
});
