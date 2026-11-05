const { app, BrowserWindow, Menu, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');

// Enable seamless indicator audio playback without requiring preceding user interaction
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');

let mainWindow = null;

const gotSingleInstanceLock = app.requestSingleInstanceLock();
if (!gotSingleInstanceLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

function sendMenuAction(action, data = null) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('menu-action', action, data);
  }
}

function showControlsGuide() {
  const guideText = [
    'Rear Light Bar Simulator Controls:',
    '',
    '• F : Lock / Unlock system (welcome/goodbye sweep)',
    '• Z : Left turn signal (toggle)',
    '• C : Right turn signal (toggle)',
    '• X : Hazard warning flashers (toggle)',
    '• M : Cycle signaling style / manufacturer mode',
    '• H : Toggle UI visibility (Clean Mode)',
    '• S (Hold) : Brake light bright red override',
    '• Q (Hold 250ms) : Toggle reverse backup lights',
    '• T (Hold 500ms) : Run automated self-test suite',
    '',
    'Interactive buttons and segment density sliders are also available on screen.'
  ].join('\n');

  if (mainWindow) {
    dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: 'Controls & Shortcuts',
      message: 'Simulator Controls Guide',
      detail: guideText,
      buttons: ['OK']
    });
  }
}

function showAboutDialog() {
  const aboutText = [
    'Rear Light Bar Simulator',
    `Version: ${app.getVersion()}`,
    'A high-fidelity automotive lighting visualization and signaling simulator.',
    '',
    'Features 6 lighting modes (Audi, BMW, Mazda, Normal, USDM, Halogen),',
    'dynamic density control, thermal physics simulation, and realistic sound.'
  ].join('\n');

  if (mainWindow) {
    dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: 'About Rear Light Bar Simulator',
      message: 'Rear Light Bar Simulator',
      detail: aboutText,
      buttons: ['OK']
    });
  }
}

function buildMenu() {
  const isMac = process.platform === 'darwin';

  const template = [
    ...(isMac
      ? [{
          label: app.name,
          submenu: [
            { label: 'About Rear Light Bar Simulator', click: showAboutDialog },
            { type: 'separator' },
            { role: 'services' },
            { type: 'separator' },
            { role: 'hide' },
            { role: 'hideOthers' },
            { role: 'unhide' },
            { type: 'separator' },
            { role: 'quit' }
          ]
        }]
      : []),
    {
      label: 'Simulator',
      submenu: [
        {
          label: 'Lock / Unlock (Power)',
          accelerator: 'CmdOrCtrl+L',
          click: () => sendMenuAction('lockUnlock')
        },
        {
          label: 'Toggle UI Panel',
          accelerator: 'CmdOrCtrl+H',
          click: () => sendMenuAction('toggleUI')
        },
        {
          label: 'Run Self-Tests',
          accelerator: 'CmdOrCtrl+T',
          click: () => sendMenuAction('selfTests')
        },
        { type: 'separator' },
        ...(isMac ? [] : [{ role: 'quit', accelerator: 'Alt+F4' }])
      ]
    },
    {
      label: 'Lighting Modes',
      submenu: [
        {
          label: 'Next Mode (Cycle)',
          click: () => sendMenuAction('nextMode')
        },
        { type: 'separator' },
        {
          label: 'Audi (Sequential Sweep)',
          click: () => sendMenuAction('setMode', 0)
        },
        {
          label: 'BMW (Smooth Luxury Fade)',
          click: () => sendMenuAction('setMode', 1)
        },
        {
          label: 'Mazda (Signature Heartbeat)',
          click: () => sendMenuAction('setMode', 2)
        },
        {
          label: 'Normal (Instant Amber LED)',
          click: () => sendMenuAction('setMode', 3)
        },
        {
          label: 'USDM (Red Running/Brake Combination)',
          click: () => sendMenuAction('setMode', 4)
        },
        {
          label: 'Halogen (Thermal Filament Warmup/Cooldown)',
          click: () => sendMenuAction('setMode', 5)
        }
      ]
    },
    {
      label: 'Signals & Controls',
      submenu: [
        {
          label: 'Left Turn Signal',
          click: () => sendMenuAction('signal', 'left')
        },
        {
          label: 'Hazard Flashers',
          click: () => sendMenuAction('signal', 'hazard')
        },
        {
          label: 'Right Turn Signal',
          click: () => sendMenuAction('signal', 'right')
        },
        { type: 'separator' },
        {
          label: 'Toggle E-Brake Lights',
          click: () => sendMenuAction('toggleBrake')
        },
        {
          label: 'Toggle Reverse Lights',
          click: () => sendMenuAction('toggleReverse')
        }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'Controls & Shortcuts Guide',
          click: showControlsGuide
        },
        {
          label: 'GitHub Repository',
          click: async () => {
            await shell.openExternal('https://github.com/DavidGT101/DavidGT101.github.io');
          }
        },
        { type: 'separator' },
        {
          label: 'About Rear Light Bar Simulator',
          click: showAboutDialog
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

function createWindow() {
  const iconPath = path.join(__dirname, 'assets', 'icon.png');
  const hasIcon = fs.existsSync(iconPath);

  mainWindow = new BrowserWindow({
    title: 'Rear Light Bar Simulator',
    width: 1140,
    height: 780,
    minWidth: 700,
    minHeight: 500,
    backgroundColor: '#090b10',
    show: false,
    autoHideMenuBar: false,
    icon: hasIcon ? iconPath : undefined,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      devTools: true
    }
  });

  buildMenu();

  mainWindow.loadFile(path.join(__dirname, 'TaillightSim.html'));

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// IPC Handlers
ipcMain.handle('get-version', () => app.getVersion());

ipcMain.handle('toggle-fullscreen', () => {
  if (!mainWindow) return false;
  const isFull = !mainWindow.isFullScreen();
  mainWindow.setFullScreen(isFull);
  return isFull;
});

ipcMain.handle('is-fullscreen', () => {
  return mainWindow ? mainWindow.isFullScreen() : false;
});

ipcMain.handle('show-controls-dialog', () => {
  showControlsGuide();
  return true;
});

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

