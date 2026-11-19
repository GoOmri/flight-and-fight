// Finds the separate pictures (trees, bushes, stumps) on a sprite sheet by looking for see-through gaps.
// Used for assets/forest/plants.png (art from the owner's "Resurrected RPG" sheets, licence UNKNOWN: see NOTES.md).
// data = RGBA pixels, w = sheet width. Looks only at columns xFrom..xTo-1.
// Returns rows (bands) from top to bottom; each row is a list of {x, y, w, h} boxes from left to right.
export function findSprites(data, w, h, xFrom, xTo) {
  const solid = (x, y) => data[(y * w + x) * 4 + 3] > 8;
  const bands = [];
  let start = -1;
  for (let y = 0; y <= h; y++) {
    let any = false;
    if (y < h) for (let x = xFrom; x < xTo; x++) if (solid(x, y)) { any = true; break; }
    if (any && start < 0) start = y;
    if (!any && start >= 0) {
      const row = [];
      let x0 = -1;
      for (let x = xFrom; x <= xTo; x++) {
        let col = false;
        if (x < xTo) for (let yy = start; yy < y; yy++) if (solid(x, yy)) { col = true; break; }
        if (col && x0 < 0) x0 = x;
        if (!col && x0 >= 0) { row.push({ x: x0, y: start, w: x - x0, h: y - start }); x0 = -1; }
      }
      bands.push(row);
      start = -1;
    }
  }
  return bands;
}
