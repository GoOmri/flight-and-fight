# Build plan: the Cauldron, first version (26 Nov 2026, from v1.9.161)

Design and Omri's decisions: DESIGN.md "Shop and upgrades". Where they differ, THIS plan counts.
All numbers here are first guesses, to be tuned by Omri on the phone. Keep them all in src/config.js.

## How to run this plan
- One step at a time, in order. Each step: own branch, build, test, push, NOTES.md entry, then STOP and wait for Omri to try it on the phone.
- Main session: Claude Sonnet 5.5. A FRESH agent for each step (never resume an old one), with a short brief naming this file and the step.
- Agents (E:\Projects\GIT\.claude\agents):
  - flight-coder (Sonnet): writes the code, never pushes. All steps.
  - flight-reviewer (Opus): steps 3 and 4 only (saved money, balance). One review round; fix real bugs only.
  - flight-designer (Sonnet): step 3 only, to review the changed screens against DESIGN.md.
  - Steps 1 and 2: no reviewer; the main session reads the diff itself.
- Each step bumps the version in src/config.js. Every new src or asset file goes in the FILES list in src/update.js.
- Tests: `python ../tools/check.py` from flight-and-fight. Check in the browser pane, then CLOSE the tab (the game plays music).
- Never git add Music/ or art-packs/. No new downloads without asking Omri.

## Step 1: coin tiers and scatter (size: small)
- Which enemies drop is unchanged (coinEvery in src/waves.js; every shooter). HOW MANY depends on the enemy tier:
  - tier 1 grunt: 1 coin, falls straight (as now)
  - tier 2 zigzag: 2 coins, small spread
  - tier 3 shooter: 4 coins, wider spread
  - vulture (in no wave yet): tier 2. Later bosses: many coins, widest spread.
- Spread = sideways speed that fades out (as crate coins do, dropCoin in src/scenes/PlayScene.js), plus a small hop, a little random. Coins must stay on screen.
- This is 53 enemy coins -> 105, plus 22 from chests = 127 in a perfect Stage 1 run.
- Check: coin.poolSize (40) is big enough (a dropped-out coin must never be silently skipped); the ALL COINS goal and the end screen "COINS x/y" still add up; coin sound not too busy.

## Step 2: saved coins (size: small)
- A coin bank in localStorage. 1 coin picked up = 1 in the bank (not the score value 5).
- Add it at the moment of pickup, so dying, restarting or leaving keeps the coins. Runs that cheat (this.tainted: god mode, tune changes, wave jump) add nothing.
- Show the total on the main menu and on the end screens ("+N" for this run). Broken or missing saved data = 0, never a crash.

## Step 3: the Cauldron, with MAGNET (size: medium to large)
- Cauldron icon bottom left on the main menu (use a cauldron picture the game already has; check it does not cover the version label and its 5 taps).
- It opens a simple list on the purple parchment, popping in like the other menus: coin total, one row per upgrade (name, 10-pip level bar, price, BUY), CLOSE. Monogram font, existing buttons. No refunds.
- BUY is off when there is not enough money or the level is 10. One tap = one level; a double tap must not buy twice by accident.
- Bought levels are saved. Upgrades come from one data list in src/config.js so more are easy to add.
- Prices per level 1..10 (same for all three): 30, 45, 60, 80, 105, 135, 170, 210, 260, 320.
- MAGNET: pull radius 34 (level 0) to 100 (level 10), even steps. Pulls coins, potions and needed hearts.

## Step 4: shot damage, fire speed and tougher enemies (size: medium)
All in ONE release (tougher enemies must not arrive without the upgrades).
- DAMAGE, 10 levels: shot damage x (1 + 0.15 x level). Without potions: 2.0 -> 5.0.
- FIRE SPEED, 10 levels: time between shots x (1 - 0.035 x level). Without potions: 170 ms -> about 110 ms. With all potions about 72 ms.
- These multiply with the in-stage potion levels. Check the bullet pool is big enough at the fastest fire.
- Enemy health: grunt 3 -> 5, zigzag 4 -> 7, shooter 7 -> 14, vulture 5 -> 10. Chests unchanged.
- A visible change of the shot at damage level 5 and 10: ask Omri what it should look like before drawing anything (can wait for a later step).
- Must be checked: a new player (no upgrades) can still clear Stage 1.

## Not in this plan (later, each its own plan)
Lightning (unlock fee, then cheaper levels), bubble shield (a blocked hit keeps the no-hit star), Heart Jar (2 levels, up to 5 hearts), side shots (thin spell bolts, with levels), seeking bats (homing shot: ask Omri what it looks like, he dislikes creature clutter beside her), Lucky Clover (more coins), Nine Lives (bought once, saves her once in every stage). All spells work at the same time; stages get harder to match.

## Risks
- Balance is guesswork until played on the phone. Stage 1 gets harder for a new player.
- Scattered coins make the ALL COINS star harder.
- Prices: about 4200 coins buys all three upgrades fully, roughly 45 normal runs. May be too slow or too fast.
- Saved coins and levels live only in this browser; clearing its data erases them.
