const { app, BrowserWindow, shell, ipcMain, dialog } = require('electron');
const path = require('path');

const isDev = !app.isPackaged;

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.cjs'),
    },
    icon: path.join(__dirname, '../public/favicon.svg'),
    title: 'DriveCore',
    show: false,
    backgroundColor: '#0f172a',
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Dış linkleri tarayıcıda aç
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

// ─── Auto Updater ─────────────────────────────────────────────────────────────
function setupAutoUpdater() {
  if (isDev) return; // Geliştirme modunda güncelleme çalışmasın

  let autoUpdater;
  try {
    autoUpdater = require('electron-updater').autoUpdater;
  } catch (e) {
    console.log('electron-updater yüklenemedi:', e.message);
    return;
  }

  // Güncelleme loglarını konsola yaz
  autoUpdater.logger = require('electron-log');
  autoUpdater.logger.transports.file.level = 'info';

  // Uygulama açılışında ve sonra her 4 saatte bir kontrol et
  const CHECK_INTERVAL = 4 * 60 * 60 * 1000;

  function checkForUpdates() {
    autoUpdater.checkForUpdates().catch(err => {
      console.log('Güncelleme kontrolü başarısız:', err.message);
    });
  }

  // Pencere hazır olunca kontrol başlat (30 sn gecikmeyle)
  setTimeout(checkForUpdates, 30 * 1000);
  setInterval(checkForUpdates, CHECK_INTERVAL);

  // ── Güncelleme olayları ──────────────────────────────────────────────────

  autoUpdater.on('checking-for-update', () => {
    sendToRenderer('update:checking');
  });

  autoUpdater.on('update-available', (info) => {
    sendToRenderer('update:available', {
      version: info.version,
      releaseNotes: info.releaseNotes,
    });
  });

  autoUpdater.on('update-not-available', () => {
    sendToRenderer('update:not-available');
  });

  autoUpdater.on('download-progress', (progress) => {
    sendToRenderer('update:progress', {
      percent: Math.round(progress.percent),
      transferred: formatBytes(progress.transferred),
      total: formatBytes(progress.total),
      speed: formatBytes(progress.bytesPerSecond) + '/s',
    });
  });

  autoUpdater.on('update-downloaded', (info) => {
    sendToRenderer('update:downloaded', { version: info.version });

    // Kullanıcıya sor: hemen yükle mi yoksa sonra mı?
    dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: 'Güncelleme Hazır',
      message: `DriveCore v${info.version} indirildi.`,
      detail: 'Güncellemeyi yüklemek için uygulamayı yeniden başlatmak gerekiyor.',
      buttons: ['Şimdi Yeniden Başlat', 'Sonra'],
      defaultId: 0,
      cancelId: 1,
    }).then(({ response }) => {
      if (response === 0) {
        autoUpdater.quitAndInstall();
      }
    });
  });

  autoUpdater.on('error', (err) => {
    sendToRenderer('update:error', { message: err.message });
    console.error('Güncelleme hatası:', err);
  });

  // ── Renderer'dan gelen istekler ─────────────────────────────────────────
  ipcMain.on('update:check-now', () => checkForUpdates());
  ipcMain.on('update:install-now', () => autoUpdater.quitAndInstall());
}

function sendToRenderer(channel, data = {}) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send(channel, data);
  }
}

function formatBytes(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

// ─── App lifecycle ────────────────────────────────────────────────────────────
app.whenReady().then(() => {
  createWindow();
  setupAutoUpdater();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
