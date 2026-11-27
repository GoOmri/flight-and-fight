// A menu that has just opened grows from 70% to full size with a small bounce, around (cx, cy). Its objects sit in one container (kept
// at their normal places), so only the container is scaled. It runs on the scene's own update, not on tweens: the pause screen has all tweens stopped.
export function popIn(scene, box, cx, cy, ms = 240) {
  let t = 0;
  const set = k => box.setScale(k).setPosition(cx * (1 - k), cy * (1 - k));
  const stop = () => scene.events.off('update', step);
  if (box.popStop) box.popStop(); // a box opened again while it was still growing
  box.popStop = stop;
  const step = (time, delta) => {
    if (!box.active) { stop(); return; }
    t += Math.min(delta, 50);
    const u = Math.min(1, t / ms) - 1, k = 1 + 2.70158 * u * u * u + 1.70158 * u * u; // "back out": a little past full size, then back
    set(0.7 + 0.3 * k);
    if (t >= ms) { set(1); stop(); }
  };
  set(0.7);
  scene.events.on('update', step);
}

// Closing = the opening played backwards: a little bigger first, then down to 70%. done() is called when it ends (it removes the box).
export function popOut(scene, box, cx, cy, done, ms = 240) {
  let t = 0;
  const step = (time, delta) => {
    t += Math.min(delta, 50);
    const u = Math.max(0, 1 - t / ms) - 1, k = 0.7 + 0.3 * (1 + 2.70158 * u * u * u + 1.70158 * u * u);
    if (box.active) box.setScale(k).setPosition(cx * (1 - k), cy * (1 - k));
    if (t >= ms || !box.active) { scene.events.off('update', step); done(); }
  };
  if (box.popStop) box.popStop();
  scene.events.on('update', step);
}
