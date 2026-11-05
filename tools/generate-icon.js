const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');

app.whenReady().then(async () => {
  const win = new BrowserWindow({
    width: 512,
    height: 512,
    show: false,
    frame: false,
    transparent: true,
    webPreferences: {
      offscreen: true
    }
  });

  const svgPath = path.join(__dirname, '..', 'assets', 'icon.svg');
  const pngPath = path.join(__dirname, '..', 'assets', 'icon.png');

  await win.loadFile(svgPath);
  // Wait a moment for any filters to render
  await new Promise(resolve => setTimeout(resolve, 500));

  const image = await win.webContents.capturePage();
  const pngBuffer = image.toPNG();
  fs.writeFileSync(pngPath, pngBuffer);
  console.log(`Generated icon.png (${pngBuffer.length} bytes) at ${pngPath}`);

  app.quit();
});

