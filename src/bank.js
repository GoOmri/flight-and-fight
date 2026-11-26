// The coin bank and the bought upgrade levels (Cauldron shop). 1 coin = 1 in the bank. No Phaser in here.
import { CONFIG as C } from './config.js';
const BANK_KEY = 'ff_coins';
const LEVEL_KEY = 'ff_upgrades'; // {"magnet": 3, ...}

// Never throws. Missing or broken saved data = 0.
export function loadBank() {
  try {
    const n = Number(window.localStorage.getItem(BANK_KEY));
    return Number.isSafeInteger(n) && n > 0 ? n : 0;
  } catch (e) { return 0; }
}

export function addBank(n = 1) {
  try { window.localStorage.setItem(BANK_KEY, String(loadBank() + n)); } catch (e) { /* not saved: play on */ }
}

export function resetBank() {
  try { window.localStorage.setItem(BANK_KEY, '0'); } catch (e) { /* not saved: play on */ }
}

// ---- upgrade levels. The list of upgrades is CONFIG.shop.upgrades.
const upgradeOf = id => C.shop.upgrades.find(u => u.id === id);

// Never throws. Missing or broken saved data = {}.
function loadLevels() {
  try {
    const o = JSON.parse(window.localStorage.getItem(LEVEL_KEY));
    return o && typeof o === 'object' && !Array.isArray(o) ? o : {};
  } catch (e) { return {}; }
}

// 0 .. top level. Anything odd (text, negative, broken number) = 0; above the top = the top.
export function loadLevel(id) {
  const u = upgradeOf(id), n = loadLevels()[id];
  return u && Number.isInteger(n) && n > 0 ? Math.min(n, u.prices.length) : 0;
}

// price of the next level, or null when it is at the top
export function nextPrice(id) {
  const u = upgradeOf(id), lv = loadLevel(id);
  return u && lv < u.prices.length ? u.prices[lv] : null;
}

// true = the coins are enough for at least one more upgrade level (false when too poor or all at the top)
export function canBuyAny() {
  const bank = loadBank();
  return C.shop.upgrades.some(u => { const p = nextPrice(u.id); return p !== null && bank >= p; });
}

// the number the game uses: base at level 0, the upgrade's top at the top level, even steps between
export function upgradeValue(id, level, base) {
  const u = upgradeOf(id);
  return u ? base + (u.top - base) * level / u.prices.length : base;
}

// Buys ONE level. false = nothing changed (top level, not enough coins, or saving failed).
// The level is saved first and taken back if the coins cannot be saved, so coins are never lost without the level.
export function buyUpgrade(id) {
  const price = nextPrice(id), bank = loadBank();
  if (price === null || bank < price) return false;
  const before = loadLevels(), after = { ...before, [id]: loadLevel(id) + 1 };
  try { window.localStorage.setItem(LEVEL_KEY, JSON.stringify(after)); } catch (e) { return false; }
  try { window.localStorage.setItem(BANK_KEY, String(bank - price)); } catch (e) {
    try { window.localStorage.setItem(LEVEL_KEY, JSON.stringify(before)); } catch (e2) { /* she keeps a free level */ }
    return false;
  }
  return true;
}

export function resetUpgrades() { // test button: all levels to 0, coins are not given back
  try { window.localStorage.removeItem(LEVEL_KEY); } catch (e) { /* not saved: play on */ }
}
