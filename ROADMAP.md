# Flight and Fight: roadmap

Kept short on purpose. Per-version history is in NOTES.md, the look rules are in DESIGN.md (section CURRENT LOOK). Last updated 24 Nov 2026 (v1.9.87).

## Next up (order agreed with Omri, 24 Nov 2026)
1. **Stars part 1:** DONE in v1.9.81 (look unverified).
2. **Stars part 2:** DONE in v1.9.81 (unlock 2, 5, 8, 11).
3. **Cats:** rescue cats, plus a cat star (spec in DESIGN.md section 5, "Cat rescue"). A big mechanic, so right after stars.
4. **DungeonFont for big titles** (SETTINGS, STAGE CLEAR, GAME OVER, stage names), only if Omri wants it. NOT done yet; everything uses PackFont.
5. **Boss:** one per stage. Art candidates in art-packs/characters-and-enemies: wizard-summoner-unknown, floating-skull (zip), mud-enemy-unknown. Bosses get NO enemy glow (noGlow: true).
6. **Power-up bar at the top:** blue pixel-art pills (weapon level, 10 levels), src/hud.js.
7. **Sound** and vibration, effects switch for the game, pause and game-over leftovers.
8. **New enemy shots: DELAYED** (Omri: the shots in stages 1 and 2 are good now). The design is kept below. Swamp enemy patterns go with it.

## Fix soon
- **Enemy aura looks like a dark SHADOW, not a glow** (Omri, 24 Nov, v1.9.80). The aura is a rust-maroon ring set (config enemies.glow). Change it to a real soft glow (lighter, warm, maybe additive) or remove it. Keep bosses without it.

## Smaller open items
- Sound (none yet) and vibration (short buzz on hit and pickup).
- Reduce effects switch for the GAME as well (the menu has one: settings, EFFECTS).
- Pause and game-over screens keep some effects (explosions): need a way to tell world things from effects.
- Power-star pickup (recipe parked), mimic chests (pack in art-packs), flying eye, credits screen, loading bar.
- Menu: an "unlock moment" when a new stage opens; real Stage 3+ (Stage 3, 4, 5 are locked placeholders in config.menu.path.nodes).
- A new font was added (art-packs/fonts/DungeonFont.ttf): ornate, readable only large (24 px and up). Idea: use it for big titles only (SETTINGS, STAGE CLEAR, GAME OVER, stage names); keep PackFont for everything small. Omri decides.
- Kenney "UI Pack - Pixel Adventure" (CC0) added in art-packs/ui-buttons/kenney-ui-pixel-adventure: an option for the HUD pills.

## Goals and stars: DECIDED with Omri (24 Nov 2026). v1.9.81 built stars as the goal icons; v1.9.84 (next) separates GOALS from STARS
- **3 goals, 1 goal = 1 star:** finish the stage, collect every coin, no hit. Stars are the reward you keep; goals are what you do. Earned once, stay earned. Old goals (70%, kill all) are dropped. Cat and boss come later as a bonus goal.
- **Before the stage (goal card):** the stage opens with the world still and a card shows the 3 goals (icon + 1 to 2 words: FINISH, ALL COINS, NO HIT). It fades after about 3 s or on a tap, then play starts. (A menu screen before PLAY is a later option.)
- **During the stage (top left):** 3 small GOAL icons, NOT star shaped, made from pictures already in the game: witch hat = finish (BTL loot pack "witch icon/witch hat.png", licence unconfirmed: ask Omri before pushing the file, add to CREDITS.md), the game coin = all coins, the game heart = no hit. States: WHITE (white silhouette) = still open, FULL COLOUR = done, GREY = failed. NO crosses (Omri dislikes crosses). Omri disliked the 13 px star-shaped icons from v1.9.81 (too small, ugly shapes, star shape): replace them.
- **End screen (STAGE CLEAR):** 3 rows: goal icon, tick or cross, and a star that flies in for each goal done; NEW under new stars.
- **Menu tile:** only the 3 STARS (gold earned, grey not). Locked tiles show the stars needed. Unlock: swamp 2, stage 3: 5, stage 4: 8, stage 5: 11 (config path.nodes need).
- Built in v1.9.81: stars on tile, unlock rule, locked tiles. TO DO: goal icons (non-star), goal card, end screen rows.

## Enemy projectiles (DELAYED, design kept)
- Today: one red orb (aimed or straight), speed and delay from config difficulty dials.
- Ideas: a fast thin needle (hard to dodge, small hitbox, only a few), a slow big orb that splits into 3 small ones, a ring that expands then breaks into a spiral, a curving shot (swamp: drifting spores), a laser warning line then a beam (boss), a bouncing shot, a lobbed shot that lands in a circle where it was aimed (marked on the ground first).
- Rules to keep: danger stays RED/hot, always readable against the background, the hit area is small and honest, a shot type gets taught in an easy wave before it is dangerous.
- DECIDED with Omri (24 Nov 2026, nothing built yet): shots arrive with new enemies throughout the game, EACH ENEMY GETS ITS OWN SHOT. The basic enemies keep the red orb. First three: (1) a new light forest enemy with a fast thin needle (1 or 2 at a time), (2) a heavy forest enemy with a big slow orb that splits into 3, (3) a swamp enemy with a curving spore. Lobbed shot with a ground circle: later (stage 3). Boss only, later: ring that becomes a spiral, laser warning line then beam. Bouncing shot: not now.
- Each new shot is taught alone in an easy wave before it shows up in a dangerous one. Needs: new enemy art (check art-packs/CATALOG.md) and a shot picture per type, red/hot, small honest hitbox.

## Done recently (so nobody redoes it)
Menu rebuilt (scrolling stage path, tiles with pictures, settings, effects, parallax), one font and one button style, drops with shared shine, relative drag control, tune panel (5 tabs), purple forest tint, bigger coins and explosions, enemy aura glow (v1.9.80), blue carrier outline for weapon potions (v1.9.80), high score saving fixed and reset (v1.9.80).
