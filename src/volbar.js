// A volume slider: a long wedge that grows to the right, with a rectangle handle to drag. Used by the menu settings and the pause screen.
export const VOL_W = 110;
const LOW = 2, TALL = 14, HW = 6, KNOB = 2; // wedge height at the left / right end, handle width, how far the handle sticks out above the wedge

// x = left edge, y = middle of the slider, level = 0..10
export function drawVolBar(g, x, y, level) {
  g.clear();
  const base = Math.round(y + TALL / 2), at = Math.round(VOL_W * level / 10);
  for (let i = 0; i < VOL_W; i++) { const h = Math.round(LOW + (TALL - LOW) * i / VOL_W); g.fillStyle(i < at ? 0xf2d9a6 : 0x7b43b8, 1).fillRect(x + i, base - h, 1, h); } // light parchment up to the handle, purple after it, no outline
  const hx = x + at - HW / 2, hy = base - TALL - KNOB, hh = TALL + KNOB; // the handle is a little taller than the wedge, so it shows even at the loud end
  g.fillStyle(0x120622, 1).fillRect(hx + 1, hy, HW - 2, hh).fillRect(hx, hy + 1, HW, hh - 2); // dark edge with 1 px round corners
  g.fillStyle(0xf7ead0, 1).fillRect(hx + 1, hy + 1, HW - 2, hh - 2);
}

// the level for a finger at tx (while dragging: wherever the finger is)
export const volFrom = (tx, x) => Math.round(Math.max(0, Math.min(1, (tx - x) / VOL_W)) * 20) / 2;

// does a touch at (tx, ty) take hold of this slider?
export const volHit = (tx, ty, x, y) => Math.abs(ty - y) <= 13 && tx >= x - 14 && tx <= x + VOL_W + 14;
