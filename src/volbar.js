// A volume slider: a long wedge that grows to the right, with a rectangle handle to drag. Used by the menu settings and the pause screen.
export const VOL_W = 80;
const LOW = 2, TALL = 14, HW = 6; // wedge height at the left / right end, handle width

// x = left edge, y = middle of the slider, level = 0..10
export function drawVolBar(g, x, y, level) {
  g.clear();
  const base = Math.round(y + TALL / 2), at = Math.round(VOL_W * level / 10);
  const high = i => Math.round(LOW + (TALL - LOW) * i / VOL_W);
  for (let i = 0; i < VOL_W; i++) g.fillStyle(0x8a6a44, 1).fillRect(x + i, base - high(i) - 1, 1, high(i) + 2); // outline
  g.fillRect(x - 1, base - LOW - 1, 1, LOW + 2); g.fillRect(x + VOL_W, base - TALL - 1, 1, TALL + 2);
  for (let i = 0; i < VOL_W; i++) g.fillStyle(i < at ? 0xc49a6c : 0xe6d3ae, 1).fillRect(x + i, base - high(i), 1, high(i)); // light brown up to the handle
  const hx = x + at - HW / 2, hy = base - TALL - 1, hh = TALL + 2; // exactly as tall as the tall end of the wedge
  g.fillStyle(0x8a6a44, 1).fillRect(hx + 1, hy, HW - 2, hh).fillRect(hx, hy + 1, HW, hh - 2); // outline with 1 px round corners
  g.fillStyle(0xf7ead0, 1).fillRect(hx + 1, hy + 1, HW - 2, hh - 2);
  g.fillStyle(0xd2b98c, 1).fillRect(hx + HW - 2, hy + 1, 1, hh - 2); // a darker right side
}

// the level for a finger at tx (while dragging: wherever the finger is)
export const volFrom = (tx, x) => Math.round(Math.max(0, Math.min(1, (tx - x) / VOL_W)) * 20) / 2;

// does a touch at (tx, ty) take hold of this slider?
export const volHit = (tx, ty, x, y) => Math.abs(ty - y) <= 13 && tx >= x - 14 && tx <= x + VOL_W + 14;
