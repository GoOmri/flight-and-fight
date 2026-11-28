# Flight and Fight: roadmap

**This file is the one list of what is next, parked and refused.** Rebuilt 28 Nov 2026 (game v1.9.204) from NOTES.md, DESIGN.md and the code.
History is in NOTES.md. Where an older document disagrees with this file, THIS file wins. Rules for keeping it current are in CLAUDE.md.

Sizes: **S** = small (one sitting), **M** = medium, **L** = large (plan first, several steps).

## Where the game is today
- 2 stages: Forest and Swamp. **Both use the same 10 waves and the same 3 enemies** (bat, ghost, fire wisp). Only the pictures differ. The Swamp has no music of its own.
- Stages 3, 4, 5 are locked placeholders. They ask for 5, 8, 11 stars; the two stages give 8.
- 4 stars per stage (cats, coins, all enemies, no hit). Shop (the cauldron): magnet, damage, fire speed, 10 levels each.
- No boss, no spells, no credits screen. Saves live only in the browser.

## The order (AGREED by Omri, 28 Nov 2026)

### 1. Check what is built (Omri on the phone, no building)
- Can a **new player with nothing bought** clear the Forest? (Asked for in PLAN-cauldron.md, never checked.) Note: TUNE > Reset all erases your progress.
- Do coins come at a good speed for the shop prices? (All upgrades cost about 4200 coins, roughly 33 perfect runs.)
- White-ringed shots, bigger explosions, menu tilt, new "New" place on the end screen.
- Why first: every later stage, enemy and spell is balanced on top of this.

**Result (Omri on the phone, v1.9.204): step 1 DONE.** New player: challenging, which is good. Coins come maybe too fast: after the 4th attempt the upgrades make it really easy. Shots good, explosions good, menu tilt okay, "New" okay.

### 2. Fix what is already out
- Shop prices and strength: **do not change yet** (Omri, 28 Nov): later stages may be harder. Look again after step 3.
- DECIDED (28 Nov), build with the stage work (step 3): **damage has no level cap** (prices keep rising). Fire speed and magnet keep a limit. The shop tube goes; each row shows name, level number, price (or Max).
- **Rescued cats drop a few coins (S)** (Omri, 28 Nov). Amount not agreed.
- **Credits screen (S-M).** The game is public and several art and font licences ask for credit. Today the credit is only in CREDITS.md, not in the game. (20 Nov: "not yet".)
- **Settings icon** instead of the cog (S): cog with a moon or cat eye, or a wand. Not picked. The spellbook is saved for something else.
- **UI rulebook leftovers** (S): same margins in every box, text sizes.

### 3. Give each stage its own wave list (S-M)
- Needed **before** new enemies or Stage 3: today a change to the Forest waves also changes the Swamp.
- Includes a difficulty setting per stage.

### 4. New enemies, each with its own shot (M each)
Decided 24 Nov, in this order. Each is taught alone in an easy wave first. Danger stays red, hit area small. The three basic enemies keep the red orb.
1. Light Forest enemy: fast thin needle.
2. Heavy Forest enemy: big slow orb that splits into 3.
3. Swamp enemy: curving spore. (Add Swamp music in the same step.)

### 5. Stage 3 (L)
- Needs: a theme (DESIGN.md idea: Dusk Sea), art, waves, cats, music.
- Until it exists, a player with 5 stars finds it still locked.
- With it: a small celebration when a stage unlocks.

### 6. Shop spells and extras (L, one at a time)
- Lightning first, then shield, extra heart, side shots, homing shot, more coins, revive once. Details: DESIGN.md "Shop and upgrades".
- **After 3 to 5:** all spells work at once, so the stages must be able to get harder.
- Ask Omri what each looks like (no creatures flying beside her).

### 7. Release (L)
- Settle the name: the logo says "Fight & Flight", the game and page say "Flight and Fight".
- Android app (Capacitor, not set up). Saves made in the browser will probably not carry into the app: decide that before other people play.
- Loading bar, vibration.

## Needs Omri's decision
- **Bosses at all?** No boss in the Forest. For the Swamp: never answered (art picked 20 Nov if built: Necromancer; style: shot patterns, spirals and walls).
- The name (see 7).
- Shop levels: a more visual look than the potion tube (asked "shelve or work on it?", not answered).
- A visible change of her shot at damage level 5 and 10 (what should it look like?).

## Smaller items, no date
- Sound: hit on a chest, end screen music.
- An effects-low switch for the stages (the menu has one).
- Explosions stay on the pause and game over screens (parked 20 Nov).
- Cats living in a hut; more places for cats to sit in the Swamp.
- Menu: bubble previews.

## Parked (do not build unless Omri brings it up)
- Flying eye enemy; mimic (monster) chests; power-star pickup.
- Burnt marks after kills, darker ground (Claude's ideas, never asked for).

## We said NO (do not suggest again)
- **No boss in the Forest** (28 Nov).
- No creatures beside the witch; no spell buttons if it can be automatic.
- No swapping shot colours (hers blue, enemy red).
- Text: no all caps, no outlines, no soft pale yellow, no Pixelify, no fake bold.
- Menu: no logo glint or star pop-ins, no purple bats, no white moon, no scroll banner for the stage name, no fantasy-UI banners or buttons, keep it calm.
- Goals: no crosses.
- Cat ring sparks: no strips or spirals.
- No floating score numbers.
- No big tune panel, no on/off switches for settled looks.
- Recolouring: colours only, never add or move pixels.
- Colour-cycling animations in the gallery: no (one card per colour).

## Old ideas in DESIGN.md that are NOT agreed
The "World guide" part is an early proposal: 10 places, a guardian in each, ingredients, recipes, medals, hard mode, a hut and map. Do not treat any of it as planned unless it is listed above.

## Already done (so nobody offers it again)
Goal box before a stage (tap a stage) - 4 stars and stars that open stages - cats - pause menu - sound, music and volume sliders - shop with 3 upgrades - saved coins - UPDATE button - scrolling stage path - settings (drag or stick, effects) - end screen - bigger explosions - white-ringed enemy shots - small test panel.
