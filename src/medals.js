// Medals of a stage: live state while playing + saving the best result in localStorage.
// No Phaser in here. States: 'pending' (not decided yet), 'earned', 'failed'.
// The STARS of a stage (the file keeps its old name). Each goal gives one star. Order = HUD order. 'cats' is for stages that have cats (none yet).
export const MEDAL_KEYS = ['cats', 'allCoins', 'killAll', 'noHit'];
const GOALS = { forest: ['allCoins', 'killAll', 'noHit'], swamp: ['allCoins', 'killAll', 'noHit'] }; // which goals a stage has (add 'cats' here when its cats exist)
export const goalsOf = theme => GOALS[theme] || GOALS.forest;
// Save key per stage. The forest keeps the old key so earlier saved medals are not lost.
const SAVE_KEYS = { forest: 'ff_medals_stage1', swamp: 'ff_medals_swamp' };
const keyOf = theme => SAVE_KEYS[theme] || SAVE_KEYS.forest;

export class Medals {
  // total = number of enemies in this run (crates are not enemies); keys = the goals of this stage
  constructor(total, keys = goalsOf('forest')) {
    this.total = total;
    this.state = {};
    for (const k of keys) this.state[k] = 'pending';
  }

  fail(key) { if (this.state[key] === 'pending') this.state[key] = 'failed'; }

  onKill() {}
  enemyLost() { this.fail('killAll'); }   // an enemy escaped or crashed: not killed
  coinLost() { this.fail('allCoins'); }   // a coin (or a crate with coins) was lost
  playerHit() { this.fail('noHit'); }
  catLost() { this.fail('cats'); }        // (for the cats later)

  // End of the stage (STAGE CLEAR): everything still pending is decided.
  finish(kills) {
    const s = this.state;
    if (s.killAll === 'pending') s.killAll = kills >= this.total ? 'earned' : 'failed';
    for (const k of Object.keys(s)) if (s[k] === 'pending') s[k] = 'earned';
  }
}

const empty = () => ({ cats: false, allCoins: false, killAll: false, noHit: false });

// Saved best result. Never throws: the game works without localStorage.
// out.cleared = the stage was finished once (it shows the name of the next stage). Old saves with any medal or the v1.9.81 "finish" count as cleared.
export function loadMedals(theme = 'forest') {
  const out = { ...empty(), cleared: false };
  try {
    const d = JSON.parse(window.localStorage.getItem(keyOf(theme)));
    if (d) {
      for (const k of MEDAL_KEYS) out[k] = d[k] === true;
      out.cleared = d.cleared === true || d.finish === true || d.kill70 === true || d.killAll === true || d.allCoins === true || d.noHit === true;
    }
  } catch (e) { /* no storage: play on */ }
  return out;
}

export const isCleared = theme => loadMedals(theme).cleared;

// Stars earned in all stages together (used to open later stages).
export function totalStars() {
  let n = 0;
  for (const theme of Object.keys(SAVE_KEYS)) { const m = loadMedals(theme); for (const k of MEDAL_KEYS) if (m[k]) n++; }
  return n;
}

// Merge a finished result into the save (once earned stays earned). Returns which stars are new.
export function saveMedals(state, theme = 'forest') {
  const old = loadMedals(theme), merged = { ...empty(), cleared: true }, isNew = empty();
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
