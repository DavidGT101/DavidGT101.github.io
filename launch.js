#!/usr/bin/env node

// Ensure any inherited ELECTRON_RUN_AS_NODE environment variable (e.g. from IDE terminal)
// does not prevent Electron from launching as a GUI application.
delete process.env.ELECTRON_RUN_AS_NODE;

const { spawn } = require('child_process');
const electron = require('electron');

const args = process.argv.slice(2);
if (args.length === 0) {
  args.push('.');
}

const child = spawn(electron, args, {
  stdio: 'inherit',
  env: process.env,
  windowsHide: false
});

child.on('close', (code) => {
  process.exit(code ?? 0);
});

