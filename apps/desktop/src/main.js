const { app, BrowserWindow, Menu, shell } = require('electron');
const path = require('path');

const isDev = process.env.NODE_ENV === 'development';
const WEB_URL = isDev ? 'http://localhost:3000' : `file://${path.join(__dirname, '../web-build/index.html')}`;

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: 'Mavyx Intelligence',
    backgroundColor: '#08080C',
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  mainWindow.loadURL(WEB_URL);
  mainWindow.once('ready-to-show', () => mainWindow.show());
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
  mainWindow.on('closed', () => { mainWindow = null; });
}

function createMenu() {
  const template = [
    { label: 'Mavyx', submenu: [
      { label: 'About', role: 'about' },
      { type: 'separator' },
      { label: 'Quit', accelerator: 'CmdOrCtrl+Q', click: () => app.quit() },
    ]},
    { label: 'View', submenu: [
      { label: 'Reload', accelerator: 'CmdOrCtrl+R', click: () => mainWindow?.reload() },
      { label: 'DevTools', accelerator: 'F12', click: () => mainWindow?.webContents.toggleDevTools() },
      { type: 'separator' },
      { label: 'Fullscreen', accelerator: 'F11', click: () => mainWindow?.setFullScreen(!mainWindow?.isFullScreen()) },
    ]},
    { label: 'Navigate', submenu: [
      { label: 'Workspace', click: () => mainWindow?.loadURL(`${WEB_URL}/workspace`) },
      { label: 'Dashboard', click: () => mainWindow?.loadURL(`${WEB_URL}/dashboard`) },
      { label: 'Markets', click: () => mainWindow?.loadURL(`${WEB_URL}/markets`) },
      { label: 'Watchlist', click: () => mainWindow?.loadURL(`${WEB_URL}/watchlist`) },
      { label: 'Journal', click: () => mainWindow?.loadURL(`${WEB_URL}/journal`) },
      { label: 'Analytics', click: () => mainWindow?.loadURL(`${WEB_URL}/analytics`) },
    ]},
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

app.whenReady().then(() => { createWindow(); createMenu(); });
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
