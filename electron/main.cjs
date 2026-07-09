const { app, BrowserWindow, shell, ipcMain, Tray, Menu, nativeImage, session } = require('electron');
const path = require('path');

const isDev = !app.isPackaged;

// Windows'ta native toast bildirimlerinin doğru uygulama adı/ikonuyla
// çıkması için AppUserModelID; electron-builder'daki appId ile birebir
// aynı olmalı. Bu olmadan Windows bazı durumlarda bildirimi hiç göstermez
// ya da "Electron" adıyla gösterir.
app.setAppUserModelId('com.drivecore.app');


let mainWindow = null;
let tray = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    // Custom titlebar için frame kaldır
    frame: false,
    titleBarStyle: 'hidden',
    titleBarOverlay: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.cjs'),
    },
    icon: path.join(__dirname, '../public/icon-512.png'),
    title: 'DriveCore',
    show: false,
    backgroundColor: '#0f172a',
    // macOS için trafficLights pozisyonu
    trafficLightPosition: { x: 14, y: 18 },
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Pencere durumu değişikliklerini renderer'a bildir
  mainWindow.on('maximize', () => sendToRenderer('window:state', { maximized: true }));
  mainWindow.on('unmaximize', () => sendToRenderer('window:state', { maximized: false }));
  mainWindow.on('focus', () => sendToRenderer('window:focus', { focused: true }));
  mainWindow.on('blur', () => sendToRenderer('window:focus', { focused: false }));

  // Kapatma butonuna basınca minimize to tray
  mainWindow.on('close', (e) => {
    if (tray) {
      e.preventDefault();
      mainWindow.hide();
      if (process.platform === 'darwin') app.dock.hide();
    }
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

// ─── Native bildirim izni ───────────────────────────────────────────────────
// Electron bazı platform/sürüm kombinasyonlarında izin isteklerini varsayılan
// olarak reddedebilir. Tek amaçlı, tek pencereli bu uygulamada tüm izinleri
// (özellikle 'notifications') güvenle onaylıyoruz.
function setupPermissions() {
  session.defaultSession.setPermissionRequestHandler((_webContents, permission, callback) => {
    callback(true);
  });
}

// ─── System Tray ──────────────────────────────────────────────────────────────
function setupTray() {
  if (isDev) return; // Dev'de tray kurmaya gerek yok

  try {
    // Windows ve Linux tray PNG ister, SVG desteklenmez.
    // tray-icon.png electron/ klasöründe paketlenmiş halde gelir.
    const iconPath = path.join(__dirname, 'tray-icon.png');
    const trayIcon = nativeImage.createFromPath(iconPath);

    tray = new Tray(trayIcon);
    tray.setToolTip('DriveCore');

    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'DriveCore\'u Aç',
        click: () => {
          mainWindow.show();
          mainWindow.focus();
          if (process.platform === 'darwin') app.dock.show();
        },
      },
      { type: 'separator' },
      {
        label: 'Güncelleme Kontrol Et',
        click: () => {
          mainWindow.show();
          sendToRenderer('update:check-requested');
        },
      },
      { type: 'separator' },
      {
        label: 'Çıkış',
        click: () => {
          tray = null;
          app.quit();
        },
      },
    ]);

    tray.setContextMenu(contextMenu);

    tray.on('click', () => {
      if (mainWindow.isVisible()) {
        mainWindow.hide();
      } else {
        mainWindow.show();
        mainWindow.focus();
        if (process.platform === 'darwin') app.dock.show();
      }
    });
  } catch (err) {
    console.error('Tray oluşturulamadı:', err.message);
  }
}

// ─── Google OAuth (Electron) ───────────────────────────────────────────────────
function setupGoogleOAuth() {
  let googleClientId = '';
  try {
    const config = require('./oauth-config.json');
    googleClientId = config.googleClientId || '';
  } catch {
    console.warn('electron/oauth-config.json bulunamadı — npm run build çalıştırın');
  }

  const REDIRECT_URI = 'http://localhost/google-oauth-callback';

  ipcMain.handle('google-oauth:start', async () => {
    if (!googleClientId) {
      throw new Error('Google Client ID bulunamadı. npm run build çalıştırıp tekrar deneyin.');
    }

    return new Promise((resolve, reject) => {
      const authUrl =
        `https://accounts.google.com/o/oauth2/v2/auth` +
        `?client_id=${googleClientId}` +
        `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
        `&response_type=token` +
        `&scope=${encodeURIComponent('email profile')}` +
        `&prompt=select_account`;

      const authWindow = new BrowserWindow({
        width: 500,
        height: 650,
        show: true,
        parent: mainWindow,
        modal: true,
        webPreferences: { nodeIntegration: false, contextIsolation: true },
        title: 'Google ile Giriş Yap',
      });

      authWindow.loadURL(authUrl);

      authWindow.webContents.on('will-redirect', (_, url) => {
        if (!url.startsWith(REDIRECT_URI)) return;
        // Google token'ı hash fragment'a koyar, URL'i parse etmek için
        // '#' yerine '?' koyuyoruz ki URLSearchParams okuyabilsin
        const params = new URLSearchParams(new URL(url.replace('#', '?')).search);
        const accessToken = params.get('access_token');
        authWindow.close();
        if (accessToken) resolve({ accessToken });
        else reject(new Error('Google OAuth: access_token alınamadı'));
      });

      authWindow.on('closed', () => {
        reject(new Error('Kullanıcı pencereyi kapattı'));
      });
    });
  });
}

function setupWindowControls() {
  ipcMain.on('window:minimize',   () => mainWindow?.minimize());
  ipcMain.on('window:maximize',   () => {
    if (mainWindow?.isMaximized()) mainWindow.unmaximize();
    else mainWindow?.maximize();
  });
  ipcMain.on('window:close',      () => {
    if (tray) mainWindow?.hide();
    else mainWindow?.close();
  });
  ipcMain.on('window:is-maximized', (e) => {
    e.returnValue = mainWindow?.isMaximized() ?? false;
  });
  // Native bildirime tıklayınca (veya tray'den) pencereyi öne getir
  ipcMain.on('window:focus-and-show', () => {
    if (!mainWindow) return;
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.show();
    mainWindow.focus();
    if (process.platform === 'darwin') app.dock.show();
  });

}

// ─── Auto Updater ─────────────────────────────────────────────────────────────
function setupAutoUpdater() {
  if (isDev) return;

  const { autoUpdater } = require('electron-updater');
  const log = require('electron-log');

  autoUpdater.logger = log;
  autoUpdater.logger.transports.file.level = 'info';
  autoUpdater.autoDownload = false; // Kullanıcı onayı olmadan indirme
  log.info('App starting, version:', app.getVersion());

  function checkForUpdates() {
    log.info('Checking for updates...');
    autoUpdater.checkForUpdates().catch(err => {
      log.error('Update check failed:', err.message);
    });
  }

  setTimeout(checkForUpdates, 10 * 1000);
  setInterval(checkForUpdates, 5 * 60 * 1000);

  // Renderer'dan manuel kontrol isteği
  ipcMain.on('update:check-now', () => checkForUpdates());
  ipcMain.on('update:check-requested', () => checkForUpdates());

  autoUpdater.on('checking-for-update', () => {
    sendToRenderer('update:checking');
  });

  autoUpdater.on('update-available', (info) => {
    log.info('Update available:', info.version);
    // Tray bildirimi
    if (tray) {
      tray.displayBalloon?.({
        iconType: 'info',
        title: 'DriveCore Güncellemesi',
        content: `v${info.version} mevcut. Uygulamayı açarak indirebilirsiniz.`,
      });
    }
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
    log.info('Update downloaded:', info.version);
    // ✅ Windows dialog YOK — sadece uygulama içi bildirim
    sendToRenderer('update:downloaded', { version: info.version });
  });

  autoUpdater.on('error', (err) => {
    log.error('Update error:', err);
    sendToRenderer('update:error', { message: err.message });
  });

  ipcMain.on('update:start-download', () => {
    autoUpdater.downloadUpdate().catch(err => {
      sendToRenderer('update:error', { message: err.message });
    });
  });

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

// ─── Tek instance kilidi ───────────────────────────────────────────────────────
// Kullanıcı exe'yi kapatıp tekrar açtığında yeni bir process başlatmak yerine
// mevcut process'i öne getiriyoruz. Bu olmadan her açılışta bir arka plan
// process'i birikir (tray icon çoğalır, Firestore bağlantıları katlanır).
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  // Bu bir ikinci instance, hemen kapat
  app.quit();
} else {
  // Birisi exe'yi tekrar çalıştırdığında burası tetiklenir
  app.on('second-instance', () => {
    if (!mainWindow) return;
    if (mainWindow.isMinimized() || !mainWindow.isVisible()) mainWindow.show();
    mainWindow.focus();
  });
}

// ─── App lifecycle ────────────────────────────────────────────────────────────
app.whenReady().then(() => {
  createWindow();
  setupWindowControls();
  setupPermissions();
  setupGoogleOAuth();
  setupTray();
  setupAutoUpdater();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
    else { mainWindow?.show(); mainWindow?.focus(); }
  });
});

app.on('window-all-closed', () => {
  if (!tray && process.platform !== 'darwin') app.quit();
});

// Tray varken bile tam çıkış için
app.on('before-quit', () => {
  tray?.destroy();
  tray = null;
});
