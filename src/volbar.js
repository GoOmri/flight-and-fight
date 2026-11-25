// A volume slider: a long wedge that grows to the right, with a rectangle handle to drag. Used by the menu settings and the pause screen.
export const VOL_W = 80;
const LOW = 2, TALL = 14, HW = 6, HH = 20; // wedge height at the left / right end, handle size

// x = left edge, y = middle of the slider, level = 0..10
export function drawVolBar(g, x, y, level) {
  g.clear();
  const base = Math.round(y + TALL / 2), at = Math.round(VOL_W * level / 10);
  const high = i => Math.round(LOW + (TALL - LOW) * i / VOL_W);
  for (let i = 0; i < VOL_W; i++) g.fillStyle(0x0d1a3d, 1).fillRect(x + i, base - high(i) - 1, 1, high(i) + 2); // outline
  g.fillRect(x - 1, base - LOW - 1, 1, LOW + 2); g.fillRect(x + VOL_W, base - TALL - 1, 1, TALL + 2);
  for (let i = 0; i < VOL_W; i++) g.fillStyle(i < at ? 0x2f7bff : 0x4a4468, 1).fillRect(x + i, base - high(i), 1, high(i)); // blue up to the handle
  const hx = x + at - HW / 2, hy = Math.round(y - HH / 2);
  g.fillStyle(0x0d1a3d, 1).fillRect(hx - 1, hy - 1, HW + 2, HH + 2);
  g.fillStyle(0xf2e6c8, 1).fillRect(hx, hy, HW, HH);
  g.fillStyle(0xb89f6e, 1).fillRect(hx + HW - 2, hy, 2, HH); // a darker right side
}

// the level for a finger at tx (while dragging: wherever the finger is)
export const volFrom = (tx, x) => Math.round(Math.max(0, Math.min(1, (tx - x) / VOL_W)) * 20) / 2;

// does a touch at (tx, ty) take hold of this slider?
export const volHit = (tx, ty, x, y) => Math.abs(ty - y) <= 13 && tx >= x - 14 && tx <= x + VOL_W + 14;
