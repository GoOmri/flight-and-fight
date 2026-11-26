// The coin bank: coins picked up are saved for the Cauldron shop. 1 coin = 1 in the bank. No Phaser in here.
const BANK_KEY = 'ff_coins';

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
