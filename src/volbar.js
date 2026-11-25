// A volume bar of 10 blue pills (tap or drag along it), used by the menu settings and the pause screen.
const N = 10, PW = 7, GAP = 1, H = 10;
export const VOL_W = N * (PW + GAP) - GAP; // 79 px

// x = left edge, y = middle of the bar, level = 0..10
export function drawVolBar(g, x, y, level) {
  g.clear();
  const top = Math.round(y - H / 2);
  for (let i = 0; i < N; i++) {
    const px = x + i * (PW + GAP);
    g.fillStyle(0x0d1a3d, 1); g.fillRect(px + 1, top, PW - 2, H); g.fillRect(px, top + 1, PW, H - 2); // rounded outline
    g.fillStyle(i < level ? 0x2f7bff : 0x4a4468, 1); g.fillRect(px + 1, top + 1, PW - 2, H - 2);
    if (i < level) { g.fillStyle(0xa6d4ff, 1); g.fillRect(px + 2, top + 2, PW - 4, 1); }
  }
}

// the level a touch at (tx, ty) asks for, or null when the touch is not on this bar. Left of the first pill = 0 (silent).
export function volAt(tx, ty, x, y) {
  if (Math.abs(ty - y) > 12 || tx < x - 14 || tx > x + VOL_W + 10) return null;
  return Math.max(0, Math.min(N, Math.ceil((tx - x) / (PW + GAP))));
}
