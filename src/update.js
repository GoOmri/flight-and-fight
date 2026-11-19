// Update helper for the UPDATE button in the menu. There is no service worker: the browser (and the installed home-screen app)
// keeps its own saved copies of our files for a while. This asks the server for fresh copies of every game file (cache: 'reload'
// replaces the saved copy), then the menu reloads the page. Add every NEW source file to FILES (a file that was never saved is
// always fetched fresh, so a missing name only matters for files that already exist and change).
const FILES = [
  './', 'index.html', 'manifest.webmanifest', 'icon.svg',
  'src/main.js', 'src/config.js', 'src/hud.js', 'src/medals.js', 'src/sprites.js', 'src/forestArt.js', 'src/rocks.js',
  'src/waves.js', 'src/waves-runner.js', 'src/update.js', 'src/scenes/MenuScene.js', 'src/scenes/PlayScene.js'
];

// The newest version number on the server, e.g. "1.2.0", or null when offline. Never uses a saved copy.
export async function latestVersion() {
  try {
    const r = await fetch('src/config.js', { cache: 'no-store' });
    if (!r.ok) return null;
    const m = (await r.text()).match(/version:\s*"([^"]+)"/);
    return m ? m[1] : null;
  } catch (e) { return null; }
}

// Replace the saved copies with fresh ones. Throws when the server cannot be reached (offline).
export async function refreshFiles() {
  const r = await fetch('src/config.js', { cache: 'reload' });
  if (!r.ok) throw new Error('offline');
  await Promise.all(FILES.map(f => fetch(f, { cache: 'reload' }).catch(() => null)));
  if (window.caches) { const keys = await caches.keys(); await Promise.all(keys.map(k => caches.delete(k))); } // in case an old app saved files there
  if (navigator.serviceWorker) { const regs = await navigator.serviceWorker.getRegistrations(); await Promise.all(regs.map(g => g.unregister())); }
}
