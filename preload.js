const { contextBridge, ipcRenderer } = require('electron');

// Expose safe, structured APIs to the renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  platform: process.platform,
  getVersion: () => ipcRenderer.invoke('get-version'),
  toggleFullscreen: () => ipcRenderer.invoke('toggle-fullscreen'),
  isFullscreen: () => ipcRenderer.invoke('is-fullscreen'),
  showControlsDialog: () => ipcRenderer.invoke('show-controls-dialog'),
  onMenuAction: (callback) => {
    if (typeof callback !== 'function') return () => {};
    const listener = (_event, action, data) => callback(action, data);
    ipcRenderer.on('menu-action', listener);
    return () => {
      ipcRenderer.removeListener('menu-action', listener);
    };
  }
});

