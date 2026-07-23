const { contextBridge } = require('electron');

// Expose safe APIs to the renderer process
contextBridge.exposeInMainWorld('mavyxDesktop', {
  platform: process.platform,
  version: process.env.npm_package_version || '1.0.0',
  isDesktop: true,
});
