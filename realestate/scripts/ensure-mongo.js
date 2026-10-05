/**
 * ============================================================
 *  Gurukripa Estate — MongoDB auto-start (cross-platform)
 * ------------------------------------------------------------
 *  Runs BEFORE `npm run dev` (via "predev" in package.json).
 *
 *  1. Checks if MongoDB is already listening on port 27017
 *     → if yes, just seeds missing data and exits.
 *  2. If not, starts the BUNDLED mongod from:
 *       .runtime/mongodb-win (Windows)  or  .runtime/mongodb (Linux/macOS)
 *  3. Waits until port 27017 responds, then seeds missing data.
 *
 *  Result: `npm run dev` can NEVER hit the "ECONNREFUSED 27017"
 *  problem again — MongoDB starts automatically.
 * ============================================================
 */
const { spawn, spawnSync } = require('child_process');
const net = require('net');
const path = require('path');
const fs = require('fs');

const PORT = 27017;
const HOST = '127.0.0.1';

function isPortOpen(port, host = HOST, timeout = 800) {
  return new Promise((resolve) => {
    const sock = new net.Socket();
    sock.setTimeout(timeout);
    sock.once('connect', () => { sock.destroy(); resolve(true); });
    sock.once('timeout', () => { sock.destroy(); resolve(false); });
    sock.once('error', () => { sock.destroy(); resolve(false); });
    sock.connect(port, host);
  });
}

function waitForPort(port, ms = 30000) {
  return new Promise((resolve) => {
    const start = Date.now();
    const t = setInterval(async () => {
      if (await isPortOpen(port)) { clearInterval(t); resolve(true); }
      else if (Date.now() - start > ms) { clearInterval(t); resolve(false); }
    }, 700);
  });
}

function seedData() {
  console.log('[mongo] seeding missing data (admin + properties + content)...');
  const r = spawnSync('npm', ['--prefix', 'server', 'run', 'seed'], {
    cwd: path.join(__dirname, '..'),
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });
  if (r.status !== 0) {
    console.error('[mongo] seed failed — website will still run, but run `npm --prefix server run seed` manually.');
  } else {
    console.log('[mongo] seed done ✅');
  }
}

(async () => {
  // ---- Already running? Just seed and go. ----
  if (await isPortOpen(PORT)) {
    console.log(`[mongo] already running on ${HOST}:${PORT} ✅`);
    seedData();
    process.exit(0);
  }

  const isWin = process.platform === 'win32';
  const root = path.join(__dirname, '..');
  const bundledDir = path.join(root, '.runtime', isWin ? 'mongodb-win' : 'mongodb');
  const bundled = path.join(bundledDir, 'bin', isWin ? 'mongod.exe' : 'mongod');
  const dbPath = path.join(root, '.runtime', 'mongodb-data');

  if (fs.existsSync(bundled)) {
    console.log(`[mongo] not running — starting bundled MongoDB (${isWin ? 'mongod.exe' : 'mongod'})...`);
    fs.mkdirSync(dbPath, { recursive: true });
    const child = spawn(bundled, ['--dbpath', dbPath, '--port', String(PORT), '--bind_ip', HOST], {
      detached: true,
      stdio: 'ignore',
      windowsHide: true,
    });
    child.unref(); // let it live after this script exits

    if (await waitForPort(PORT, 30000)) {
      console.log(`[mongo] bundled MongoDB started on ${HOST}:${PORT} ✅`);
      seedData();
      process.exit(0);
    } else {
      console.error('[mongo] bundled MongoDB failed to start within 30s.');
      if (isWin) {
        console.error('       Windows fix: run  .runtime\\mongodb-win\\bin\\vc_redist.x64.exe  once,');
        console.error('       and check your antivirus is not deleting mongod.exe.');
      }
      process.exit(1);
    }
  } else if (isWin) {
    console.error('[mongo] bundled MongoDB NOT FOUND at .runtime\\mongodb-win\\bin\\mongod.exe');
    console.error('       You are probably running an OLD zip. Extract the latest gurukripa-estate.zip fully!');
    process.exit(1);
  } else {
    console.error('[mongo] MongoDB is not running and no bundled binary found.');
    console.error('       Linux/macOS: run `npm run setup` once to download it.');
    process.exit(1);
  }
})();
