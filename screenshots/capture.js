// Screenshot script — run from host: node screenshots/capture.js
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const BASE = 'http://localhost:5173';
const OUT = path.join(__dirname, 'screenshots');

if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

const pages = [
  { path: '/login',             name: '00-login',             w: 1280, h: 800 },
  { path: '/dashboard',         name: '01-dashboard',         w: 1280, h: 900 },
  { path: '/devices',           name: '02-device-inventory',  w: 1280, h: 900 },
  { path: '/devices/1',         name: '03-device-detail',     w: 1280, h: 900 },
  { path: '/devices/onboard',   name: '04-device-onboarding', w: 1280, h: 900 },
  { path: '/devices/import',    name: '05-mass-import',       w: 1280, h: 900 },
  { path: '/topology',          name: '06-topology-map',      w: 1280, h: 900 },
  { path: '/backups',           name: '07-backup-manager',    w: 1280, h: 900 },
  { path: '/troubleshoot/1',    name: '08-troubleshoot',      w: 1280, h: 900 },
  { path: '/templates',         name: '09-templates',         w: 1280, h: 900 },
  { path: '/tasks',             name: '10-task-queue',        w: 1280, h: 900 },
  { path: '/metrics',           name: '11-live-metrics',      w: 1280, h: 900 },
  { path: '/alerts',            name: '12-alerts',           w: 1280, h: 900 },
  { path: '/grafana',           name: '13-grafana',           w: 1280, h: 900 },
  { path: '/ai',                name: '14-ai-agent',          w: 1280, h: 900 },
  { path: '/incidents',         name: '15-incidents',         w: 1280, h: 900 },
  { path: '/users',             name: '16-users-roles',       w: 1280, h: 900 },
  { path: '/audit',             name: '17-audit-log',         w: 1280, h: 900 },
];

console.log(`Capturing ${pages.length} pages via Firefox headless...`);

for (const page of pages) {
  const url = page.path === '/login'
    ? `${BASE}${page.path}`
    : `${BASE}${page.path}#screenshot`;
  const outfile = path.join(OUT, `${page.name}.png`);
  try {
    execSync(
      `firefox --headless --screenshot "${outfile}" --window-size ${page.w},${page.h} "${url}" 2>/dev/null`,
      { timeout: 30000 }
    );
    const size = fs.statSync(outfile).size;
    if (size < 1000) {
      console.log(`⚠ ${page.name} (${(size/1024).toFixed(0)}KB) — possibly blank`);
    } else {
      console.log(`✓ ${page.name} (${(size/1024).toFixed(0)}KB)`);
    }
  } catch (e) {
    console.log(`✗ ${page.name}: ${e.message.slice(0, 100)}`);
  }
}

console.log(`\nDone. Screenshots saved to ${OUT}/`);
