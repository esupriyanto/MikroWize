// Screenshot script — run: docker exec infra-frontend-1 node /app/screenshots/capture.js
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const BASE = 'http://localhost:5173';
const OUT = '/app/screenshots';

if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

const pages = [
  { path: '/dashboard',         name: '01-dashboard',          w: 1280, h: 900 },
  { path: '/devices',           name: '02-device-inventory',   w: 1280, h: 900 },
  { path: '/devices/1',         name: '03-device-detail',      w: 1280, h: 900 },
  { path: '/topology',          name: '04-topology-map',       w: 1280, h: 900 },
  { path: '/backups',           name: '05-backup-manager',    w: 1280, h: 900 },
  { path: '/troubleshoot/1',    name: '06-troubleshoot-panel', w: 1280, h: 900 },
  { path: '/templates',         name: '07-template-framework', w: 1280, h: 900 },
  { path: '/tasks',             name: '08-task-queue',         w: 1280, h: 900 },
  { path: '/metrics',           name: '09-live-metrics',      w: 1280, h: 900 },
  { path: '/alerts',            name: '10-alerts',            w: 1280, h: 900 },
  { path: '/ai',                name: '11-ai-agent',          w: 1280, h: 900 },
  { path: '/incidents',         name: '12-incidents',         w: 1280, h: 900 },
  { path: '/users',             name: '13-users-roles',       w: 1280, h: 900 },
  { path: '/audit',             name: '14-audit-log',         w: 1280, h: 900 },
];

console.log(`Capturing ${pages.length} pages...`);

for (const page of pages) {
  const url = `${BASE}${page.path}#screenshot`;
  const outfile = path.join(OUT, `${page.name}.png`);
  try {
    execSync(
      `firefox --headless --screenshot "${outfile}" --window-size ${page.w},${page.h} "${url}" 2>/dev/null`,
      { timeout: 30000 }
    );
    const size = fs.statSync(outfile).size;
    console.log(`✓ ${page.name} (${(size/1024).toFixed(0)}KB)`);
  } catch (e) {
    console.log(`✗ ${page.name}: ${e.message.slice(0, 100)}`);
  }
}

console.log(`\nDone. Screenshots in ${OUT}/`);
