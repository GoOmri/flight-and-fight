// Medals of a stage: live state while playing + saving the best result in localStorage.
// No Phaser in here. States: 'pending' (not decided yet), 'earned', 'failed'.
export const MEDAL_KEYS = ['kill70', 'killAll', 'allCoins', 'noHit']; // HUD order
const SAVE_KEY = 'ff_medals_stage1';

export class Medals {
  // total = number of enemies in this run (crates are not enemies)
  constructor(total) {
    this.total = total;
    this.need = Math.ceil(0.7 * total);
    this.state = { kill70: 'pending', killAll: 'pending', allCoins: 'pending', noHit: 'pending' };
  }

  fail(key) { if (this.state[key] === 'pending') this.state[key] = 'failed'; }

  onKill(kills) { if (this.state.kill70 === 'pending' && kills >= this.need) this.state.kill70 = 'earned'; } // cannot be lost afterwards
  enemyLost() { this.fail('killAll'); }   // an enemy escaped or crashed: not killed
  coinLost() { this.fail('allCoins'); }   // a coin (or a crate with coins) was lost
  playerHit() { this.fail('noHit'); }

  // End of the stage: everything still pending is decided.
  finish(kills) {
    const s = this.state;
    if (s.kill70 === 'pending') s.kill70 = kills >= this.need ? 'earned' : 'failed';
    if (s.killAll === 'pending') s.killAll = kills >= this.total ? 'earned' : 'failed';
    if (s.allCoins === 'pending') s.allCoins = 'earned';
    if (s.noHit === 'pending') s.noHit = 'earned';
  }
}

const empty = () => ({ kill70: false, killAll: false, allCoins: false, noHit: false });

// Saved best result. Never throws: the game works without localStorage.
export function loadMedals() {
  const out = empty();
  try {
    const d = JSON.parse(window.localStorage.getItem(SAVE_KEY));
    if (d) for (const k of MEDAL_KEYS) out[k] = d[k] === true;
  } catch (e) { /* no storage: play on */ }
  return out;
}

// Merge a finished result into the save (once earned stays earned). Returns which medals are new.
export function saveMedals(state) {
  const old = loadMedals(), merged = empty(), isNew = empty();
  for (const k of MEDAL_KEYS) {
    const earned = state[k] === 'earned';
    merged[k] = old[k] || earned;
    isNew[k] = earned && !old[k];
  }
  try { window.localStorage.setItem(SAVE_KEY, JSON.stringify(merged)); } catch (e) { /* ignore */ }
  return isNew;
}
