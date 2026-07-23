const { app, BrowserWindow, Menu, shell, ipcMain } = require('electron');
const path = require('path');

/**
 * Mavyx Intelligence — Desktop Application
 * Built with Electron for Windows, Mac, and Linux.
 *
 * Loads the Next.js frontend from localhost in development
 * or from the built files in production.
 */

const isDev = process.env.NODE_ENV === 'development';
const WEB_URL = isDev ? 'http://localhost:3000' : `file://${path.join(__dirname, '../web-build/index.html')}`;

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 700,
    title: 'Mavyx Intelligence',
    backgroundColor: '#0A0A0F',
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    // Frameless for modern look (optional)
    // frame: false,
    // titleBarStyle: 'hiddenInset',
  });

  // Load the app
  mainWindow.loadURL(WEB_URL);

  // Show when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Open external links in browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Create custom menu
function createMenu() {
  const template = [
    {
      label: 'Mavyx Intelligence',
      submenu: [
        { label: 'About Mavyx Intelligence', role: 'about' },
        { type: 'separator' },
        { label: 'Quit', accelerator: 'CmdOrCtrl+Q', click: () => app.quit() },
      ],
    },
    {
      label: 'View',
      submenu: [
        { label: 'Reload', accelerator: 'CmdOrCtrl+R', click: () => mainWindow?.reload() },
        { label: 'Toggle DevTools', accelerator: 'F12', click: () => mainWindow?.webContents.toggleDevTools() },
        { type: 'separator' },
        { label: 'Zoom In', accelerator: 'CmdOrCtrl+=', click: () => mainWindow?.webContents.zoomLevel += 0.5 },
        { label: 'Zoom Out', accelerator: 'CmdOrCtrl+-', click: () => mainWindow?.webContents.zoomLevel -= 0.5 },
        { label: 'Reset Zoom', accelerator: 'CmdOrCtrl+0', click: () => { if (mainWindow) mainWindow.webContents.zoomLevel = 0; } },
        { type: 'separator' },
        { label: 'Fullscreen', accelerator: 'F11', click: () => mainWindow?.setFullScreen(!mainWindow?.isFullScreen()) },
      ],
    },
    {
      label: 'Navigate',
      submenu: [
        { label: 'Profile', click: () => mainWindow?.loadURL(`${WEB_URL}/profile`) },
        { label: 'AI Analysis', click: () => mainWindow?.loadURL(`${WEB_URL}/analysis`) },
        { label: 'Market', click: () => mainWindow?.loadURL(`${WEB_URL}/market`) },
        { label: 'Watchlist', click: () => mainWindow?.loadURL(`${WEB_URL}/watchlist`) },
        { label: 'System Health', click: () => mainWindow?.loadURL(`${WEB_URL}/health`) },
      ],
    },
    {
      label: 'Help',
      submenu: [
        { label: 'Documentation', click: () => shell.openExternal('https://github.com/mavyxintelligenceofficial/MAVYX-INTELLIGENCE-2') },
      ],
    },
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

// App events
app.whenReady().then(() => {
  createWindow();
  createMenu();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
