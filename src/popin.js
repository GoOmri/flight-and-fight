// A menu that has just opened grows from 70% to full size with a small bounce, around (cx, cy). Its objects sit in one container (kept
// at their normal places), so only the container is scaled. It runs on the scene's own update, not on tweens: the pause screen has all tweens stopped.
export function popIn(scene, box, cx, cy, ms = 240) {
  let t = 0;
  const set = k => box.setScale(k).setPosition(cx * (1 - k), cy * (1 - k));
  const stop = () => scene.events.off('update', step);
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
