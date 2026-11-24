// Medals of a stage: live state while playing + saving the best result in localStorage.
// No Phaser in here. States: 'pending' (not decided yet), 'earned', 'failed'.
// The 3 STARS of a stage (the file keeps its old name). HUD order, easy to hard.
export const MEDAL_KEYS = ['finish', 'allCoins', 'noHit'];
// Save key per stage. The forest keeps the old key so earlier saved medals are not lost.
const SAVE_KEYS = { forest: 'ff_medals_stage1', swamp: 'ff_medals_swamp' };
const keyOf = theme => SAVE_KEYS[theme] || SAVE_KEYS.forest;

export class Medals {
  // total = number of enemies in this run (not used by the stars any more)
  constructor(total) {
    this.total = total;
    this.state = { finish: 'pending', allCoins: 'pending', noHit: 'pending' };
  }

  fail(key) { if (this.state[key] === 'pending') this.state[key] = 'failed'; }

  onKill() {}                             // kills no longer matter for stars
  enemyLost() {}
  coinLost() { this.fail('allCoins'); }   // a coin (or a crate with coins) was lost
  playerHit() { this.fail('noHit'); }

  // End of the stage (STAGE CLEAR): finish is earned, everything still pending is decided.
  finish() {
    const s = this.state;
    s.finish = 'earned';
    if (s.allCoins === 'pending') s.allCoins = 'earned';
    if (s.noHit === 'pending') s.noHit = 'earned';
  }
}

const empty = () => ({ finish: false, allCoins: false, noHit: false });

// Saved best result. Never throws: the game works without localStorage.
// Old saves (before v1.9.81) have no "finish": a save with any medal means the stage was cleared, so finish counts as earned.
export function loadMedals(theme = 'forest') {
  const out = empty();
  try {
    const d = JSON.parse(window.localStorage.getItem(keyOf(theme)));
    if (d) {
      for (const k of MEDAL_KEYS) out[k] = d[k] === true;
      if (d.finish === undefined && (d.kill70 || d.killAll || d.allCoins || d.noHit)) out.finish = true;
    }
  } catch (e) { /* no storage: play on */ }
  return out;
}

// Stars earned in all stages together (used to open later stages).
export function totalStars() {
  let n = 0;
  for (const theme of Object.keys(SAVE_KEYS)) { const m = loadMedals(theme); for (const k of MEDAL_KEYS) if (m[k]) n++; }
  return n;
}

// Merge a finished result into the save (once earned stays earned). Returns which stars are new.
export function saveMedals(state, theme = 'forest') {
  const old = loadMedals(theme), merged = empty(), isNew = empty();
  for (const k of MEDAL_KEYS) {
    const earned = state[k] === 'earned';
    merged[k] = old[k] || earned;
    isNew[k] = earned && !old[k];
  }
  try { window.localStorage.setItem(keyOf(theme), JSON.stringify(merged)); } catch (e) { /* ignore */ }
  return isNew;
}

// Best score of a stage (own key next to the medals). Never throws.
export function loadBest(theme = 'forest') {
  try { return parseInt(window.localStorage.getItem(keyOf(theme) + '_best'), 10) || 0; } catch (e) { return 0; }
}
export function saveBest(score, theme = 'forest') {
  if (score <= loadBest(theme)) return;
  try { window.localStorage.setItem(keyOf(theme) + '_best', String(score)); } catch (e) { /* ignore */ }
}

// One-time clean start after a fix (the old best scores were saved by a buggy version): the first time this tag is seen on a phone, the saved medals and best scores of every stage are erased.
export function resetSavedOnce(tag) {
  try {
    const flag = 'ff_reset_' + tag;
    if (window.localStorage.getItem(flag) === '1') return false;
    for (const k of Object.values(SAVE_KEYS)) { window.localStorage.removeItem(k); window.localStorage.removeItem(k + '_best'); }
    window.localStorage.setItem(flag, '1');
    return true;
  } catch (e) { return false; }
}
