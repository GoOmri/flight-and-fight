# Flight and Fight: roadmap

Kept short on purpose. Per-version history is in NOTES.md, the look rules are in DESIGN.md (section CURRENT LOOK). Last updated 24 Nov 2026 (v1.9.80).

## Next up (Omri asked for these, in no strict order)
1. **Goals and stars (to design together first):** players earn STARS from each goal and the menu shows them. Needs: the list of goals, the order players get them, new icons, and a visual translation (see "Goals and stars: starting proposal" below). Today there are 4 medals per stage: kill 70%, kill all, all coins, no hit.
2. **Enemy projectiles (to discuss):** more kinds than the red orb. Starting ideas below.
3. **Cats:** rescue cats (spec in DESIGN.md section 5, "Cat rescue").
4. **Boss:** one boss per stage. Art candidates already in art-packs/characters-and-enemies: wizard-summoner-unknown (a wizard with idle, fly, attack, death; a summoner with idle, summon, death; a sorcerer villain folder), floating-skull (zip), mud-enemy-unknown (strips). Fights use shot patterns (spirals, walls). Bosses get NO enemy glow (enemy type flag noGlow: true).
5. **Swamp enemy patterns:** switch the swamp stage to different enemy movement patterns than the forest (src/waves.js).
6. **Power-up indicator bar at the top:** redesign as pixel-art pills in blue (the weapon level, 10 levels). Today it is a drawn bar in the HUD (src/hud.js).

## Smaller open items
- Sound (none yet) and vibration (short buzz on hit and pickup).
- Reduce effects switch for the GAME as well (the menu has one: settings, EFFECTS).
- Pause and game-over screens keep some effects (explosions): need a way to tell world things from effects.
- Power-star pickup (recipe parked), mimic chests (pack in art-packs), flying eye, credits screen, loading bar.
- Menu: an "unlock moment" when a new stage opens; real Stage 3+ (Stage 3, 4, 5 are locked placeholders in config.menu.path.nodes).
- A new font was added (art-packs/fonts/DungeonFont.ttf): ornate, readable only large (24 px and up). Idea: use it for big titles only (SETTINGS, STAGE CLEAR, GAME OVER, stage names); keep PackFont for everything small. Omri decides.
- Kenney "UI Pack - Pixel Adventure" (CC0) added in art-packs/ui-buttons/kenney-ui-pixel-adventure: an option for the HUD pills.

## Goals and stars: starting proposal (to discuss, nothing built)
Principle: every goal is something the player can SEE happening and that makes them play the stage a little differently. Stars are earned once per stage and stay earned (like the medals now). Order = from easy to hard so a first run already earns something.
1. **Finish the stage** (reach STAGE CLEAR). Everyone gets this one.
2. **Defeat 70% of the enemies.** (exists: kill70)
3. **Collect every coin** (exists: allCoins).
4. **Defeat every enemy** (exists: killAll).
5. **No hit** (exists: noHit).
6. Later, harder or new: **rescue the cat** (when cats exist), **beat the boss**, **a score target** per stage, **no potion used** (a purist star).
Visual translation to decide: a star with a small picture inside (skull for kills, coin, cat, heart-with-shield for no hit, crown for boss), grey when not earned (as the medals are now), gold when earned (gold is the trim colour). The stage tile shows 3 to 5 star slots; the path line could show a small star total. First step when we build: replace the 4 medal icons by star icons of the same slots, then add the new goals.

## Enemy projectiles: starting ideas (to discuss)
- Today: one red orb (aimed or straight), speed and delay from config difficulty dials.
- Ideas: a fast thin needle (hard to dodge, small hitbox, only a few), a slow big orb that splits into 3 small ones, a ring that expands then breaks into a spiral, a curving shot (swamp: drifting spores), a laser warning line then a beam (boss), a bouncing shot, a lobbed shot that lands in a circle where it was aimed (marked on the ground first).
- Rules to keep: danger stays RED/hot, always readable against the background, the hit area is small and honest, a shot type gets taught in an easy wave before it is dangerous.
- To decide: which 3 types to start with, and which stage teaches them.

## Done recently (so nobody redoes it)
Menu rebuilt (scrolling stage path, tiles with pictures, settings, effects, parallax), one font and one button style, drops with shared shine, relative drag control, tune panel (5 tabs), purple forest tint, bigger coins and explosions, enemy aura glow (v1.9.80), blue carrier outline for weapon potions (v1.9.80), high score saving fixed and reset (v1.9.80).
