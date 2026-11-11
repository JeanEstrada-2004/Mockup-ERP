// Starts the three presentations side by side so the hidden switcher
// (Alt + Shift + P) can jump between them in development:
//   SurTec PETI → http://localhost:3000   J&Y PMI → :3001   J&Y Demo → :3002
import { spawn } from 'node:child_process';
import process from 'node:process';
import { DEV_PORTS } from '../src-modern/scripts/config/variants.js';

const children = Object.entries(DEV_PORTS).map(([mode, port], index) =>
  spawn(
    process.execPath,
    [
      'node_modules/vite/bin/vite.js',
      '--mode',
      mode,
      '--port',
      String(port),
      '--strictPort',
      ...(index === 0 ? [] : ['--open', 'false']),
    ],
    { stdio: 'inherit' }
  )
);
const stop = () => children.forEach((child) => child.kill());
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
