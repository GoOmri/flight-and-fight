# Flight and Fight: DESIGN

Screen: 240 wide x 427 tall (x 0 = left, y 0 = top). The ship sits near y 347. Pixel art, one art pixel = 3 screen units.
Colour rules (already in src/sprites.js): player bullets are a cyan-white bolt, enemy bullets are a pink orb with a dark outline, coins are violet gems, no yellow or gold on bullets. Players never see technical text. (OLD intro: see the CURRENT LOOK section below.)

## CURRENT LOOK (updated 21 Nov 2026, v1.9.71). Where this section and the older text below disagree, THIS section wins.

**Colour roles (what a colour means in play)**
- Player side is COOL: the witch's shot is a blue teardrop, the weapon potion is a blue round flask. Danger is HOT: enemy shots are the red orb. Coins are gold. The heart pickup is pink with pink beams.
- Every drop (coin, heart, potion) shares ONE shine: soft glow, spinning beams, a small twinkle. Only the colour, the beam length and the glow size differ per drop. Only the coin in front of a stack shines.
- Reserved: bright red = enemy shots and danger only. Cyan-white = the witch's shots (not for menu text). Gold = coins AND the menu trim (see below). Green = good bars. These old rules no longer say "no gold in the menu": gold trim in the menus is now allowed on purpose.

**Menu and UI kit (one look everywhere)**
- Palette: purple fill (0x3b1478), gold trim (0xf2b632), cream text (0xfff3c4), pink only for small accents (the menu's old plates, the "tap to play again" blink). Gold is the trim colour: path line, panel corners, button outline, selected-stage edge, gear, tap sparks, BEST score.
- ONE font: PackFont (the pixel font of the Fantasy UI pack, drawn only at whole-pixel sizes, see fpx() in src/hud.js; config fontScale turns all text up or down). ONE button: the Medieval UI button recoloured purple with a gold outline (assets/ui/ui-med-button.png, 9-slice). Used by UPDATE, the settings buttons and the MENU button of the end screens. Stage tiles use the Medieval panel recoloured the same way (assets/ui/ui-med-panel.png), the settings use the parchment (Fantasy UI pack), the gear is its medallion.
- Recolouring rule: swap colours only, never add, remove or move pixels.
- Touch targets: at least about 44 phone px (the touch box is bigger than the picture for UPDATE and the settings buttons).

**Main menu**
- A gold line runs up the middle (endless at the top, it dissolves just above the logo). Stage tiles sit left and right of it, stage 1 at the bottom. Each open tile shows a dimmed picture of its stage (night forest, glowing swamp), its name, the 4 medals and the best score; a locked stage is greyed and says SOON. The next stage to play has a pulsing gold edge.
- The path scrolls (drag, glide, rubber band at the ends). A player can look 3 stages beyond the highest open stage (config path.lookAhead).
- Foreground friends (always in front of everything): witch with a broom trail, ghost, cat, cauldron with bubbles. The logo words (Fight, &, Flight) rise from below one after the other; the moon, stars and bats around the logo are plain background.
- Small effects (cauldron bubbles, broom trail, fireflies, shooting stars, tap sparks, button pop, tilt parallax) can all be switched off in the settings (EFFECTS: FULL / LOW). Keep the menu calm: when in doubt remove an effect, do not add one.
- Settings (gear): CONTROLS (drag or stick), TUNE PANEL on or off, EFFECTS full or low, SOUND (not in the game yet).

**Controls**
- Relative drag: touch anywhere, the witch moves by the finger's movement (x 1.2). A small dead zone after touch-down. A thumb that rests moves nothing. Soft walls (she slows near the edges). A spring: quick while the finger moves, a little bounce while the thumb rests, no overshoot after a swipe ends.

**Open items**
- Sound (none yet), a soft glow behind enemies, the pause and game-over leftovers, the power-star, bosses, a credits screen, a loading bar, the "unlock moment" for a new stage.

---

## World guide (theme: a cute witch on a broom)

Status: PROPOSAL from the designer. The theme is Omri's decision. Numbers are suggestions. Where this section and the intro above disagree about colours (violet coins, pink enemy shots), THIS section wins. The title is still open (see 8).

### 1. The world and the art rules

**World in one paragraph.** A small, brave young witch flies her broom over a storybook night. The moon is out, the pumpkins are awake, and the creatures of the night are grumpy and bouncy, not evil. Stray cats are stuck on rocks, boats and rooftops. She hovers over each cat to save it, flies home to her hut, and brews better magic in her cauldron with what she collects. At the end of each place a big guardian waits.

**Cute art rules**
- Tone: cosy Halloween storybook. Nothing bloody, no skulls, no real fear. Enemies look grumpy or silly, never cruel.
- Shapes: round and chunky. Big head, big eyes (2 white pixels with 1 dark pixel), tiny body. Simple silhouettes that read at phone size.
- Outline: every sprite has a 1 art pixel dark outline (very dark purple-navy, not pure black). One light shine pixel at the top-left.
- Light comes from the top-left. Shadows are one darker step, no gradients.
- Palette: max 4 colours + outline per sprite. One shared palette of about 32 colours for the whole game.
- Sizes (1 art pixel = 3 units): witch with broom 13x11 art px. Her real hitbox is tiny: 3x3 art px at her body (be kind). Coin 5x5. Spell bolt 2x4. Enemy shot orb 4x4. Small enemy 9-11 art px, tank 15-17, guardian 30-40 (90-120 units wide).
- Backgrounds are darker and calmer than sprites. Sprites are brighter and have outlines. Backgrounds never use bright red, gold or cyan-white.

**Reserved colours (must stay)**

| Colour | Means | Never used for |
|---|---|---|
| Bright red | Enemy shots and danger only | enemy bodies, decorations, buttons |
| Cyan-white | Witch spell bolts | enemy glow or effects |
| Green | Upgrade potions, good bars | enemy bodies (use teal-grey for swamp things) |
| Gold | Coins only | pumpkin skin, lamps, stars, menu trim |
| Pink-white outline | Heart pickup | enemies |
| Violet | Free: the witch's hat and magic, cauldron glow, menus | |

Enemy colours: dark purple, brown, stone grey, bone, teal-grey, dusty blue. Accents: dull rust (pumpkins), pale lilac (ghosts). Accents are never bright red, bright yellow or cyan.

**Mood palettes (ideas)**

| Mood | Sky | Ground / shapes |
|---|---|---|
| Night forest | deep blue to indigo | dark green trees, silver moon |
| Swamp | teal-navy, green mist | murky green water, brown reeds |
| Dusk sea | purple to dusty pink | deep blue sea, brown boats |
| Pumpkin fields | plum | dark brown earth, rust pumpkins |
| Snowy village | pale slate-blue | white snow, brown roofs |
| Graveyard | grey-violet | grey stones, dark purple grass |
| Stormy castle | charcoal-blue | grey stone towers, rare white lightning |
| Floating islands | soft light blue | cloud white, green island tops |
| Ember mountain | dark maroon-purple | black rock, dull orange cracks |

Lightning and glowing cracks stay dull so they never look like red shots or coins.

**How every existing thing maps to the theme**

| Now | In the world | Look |
|---|---|---|
| Ship | Witch on a broom | violet hat, teal scarf, brown broom with a twig tail; tilts when she moves |
| Cyan-white bolts | Spell bolts | small sparkly cyan-white stars, twin shot |
| Enemy shots | Curse orbs | bright RED orb, dark outline, white core |
| Coins | Gold coins | small round gold coin with shine, spins |
| Green weapon upgrade | Potion bottle | green potion with a cork and bubbles (fire rate / damage) |
| Hearts | Hearts | pink-white outlined heart (kept) |
| Crates | Treasure chests | brown wood, light lid, shine; open and spill coins |
| Medals | Medals | round badge with a small picture, grey until won |
| Wave pips | Tiny moons | hollow = coming, full = done; the last one is a big moon |
| Boss | Guardian | see 4 |
| Result screen | "Back at the hut" | the witch sits with her cats; medals pop onto a shelf |
| Hangar | Hut + cauldron | cosy room, cauldron in the middle, shelves |
| Stage select | Map | old parchment map, a broom trail joins the places |

### 2. Glossary (words players see)

| Word | Means |
|---|---|
| Witch | the hero (give her a short name later) |
| Broom | her ship; upgrades change the broom |
| Spell bolts | her shots |
| Coins | gold money |
| Potion | green pickup in a place; stronger bolts for that run |
| Heart | extra life during a place |
| Chest | spills coins when shot open |
| Ingredients | rare drops used in recipes (5 kinds) |
| Hut | the home menu |
| Cauldron | where she brews upgrades |
| Recipes | the list of upgrades |
| Brew | buy / make a recipe |
| Cats | the friends she saves; they live in the hut |
| Rescue ring | the circle bar around a cat |
| Places | stages, each with a name |
| Map | stage select |
| Medals | goals per place, up to 8 |
| Hard moon | hard mode of a place (a dark moon icon) |
| Guardian | boss |
| Spell | special attack (e.g. star burst) |

Never show players: hp, wave numbers, cooldowns, spawn, pool, "Lv 3/5" as text. Use filled pips, icons and bars. A small number next to an icon (coins) is fine.

### 3. Enemy families (13)

HP ideas as now: grunt 3, sway 4, shooter 7. All enemy shots are red orbs.

| # | Creature | Role | Look | HP | Moods |
|---|---|---|---|---|---|
| 1 | Bat | grunt | round purple bat, big eyes, small flappy wings | 3 | forest, castle, graveyard (current grunt) |
| 2 | Ghost | sway | pale lilac blob, wobbly hem, sleepy eyes | 4 | forest, graveyard, swamp (current zigzag) |
| 3 | Imp | shooter | little dark-teal imp, horns, grin, wand that spits orbs | 7 | forest onward (current shooter) |
| 4 | Crow | swarm | small round black bird, grey beak, flies fast in flocks | 2 | forest, snow, fields |
| 5 | Spider | light shooter | round brown spider drops on a thread, stops, spits 1 orb | 4 | swamp, castle, graveyard |
| 6 | Pumpkin | tank | big dull-rust pumpkin, dark carved face, rolls slowly | 10 | fields, village |
| 7 | Gargoyle | tank | stone-grey winged blob, stops high, fires a 3-orb fan | 12 | castle, graveyard |
| 8 | Scarecrow | sway | straw-brown, floppy hat, swings arms side to side | 6 | fields, village |
| 9 | Wisp | swarm | small teal flame with a face, drifts in loops | 2 | swamp, graveyard |
| 10 | Sea sprite | sway | dusty-blue bubble creature that bobs | 4 | sea, islands |
| 11 | Harpy chick | grunt | fluffy blue-grey chick, dives and swerves | 3 | islands, snow |
| 12 | Baby dragon | shooter | purple-teal round dragon, tiny wings, hiccups orbs | 8 | mountain, castle |
| 13 | Sack bat | carrier | slow fat bat with a sack; drops an ingredient or coins | 6 | any, rare |

**Existing three:** grunt = Bat, zigzag = Ghost, shooter = Imp.

**How players tell things apart**
- Red + small + round + fast down = danger. Nothing else is bright red.
- Gold + small + spinning + slow fall = coin. Gold never appears on enemies or backgrounds.
- Enemies are at least 9 art px and have eyes. Coins and shots have no eyes.
- Enemy outline is dark purple. Shots have a white core. Coins have a shine and spin.
- Enemy shots are drawn on top of everything.

### 4. Stages (10 places)

Each place has the shape of Stage 1: 10 waves, 3 chests, then a guardian. 1-3 cats per place. Medals: see 7.

| # | Place | Mood | New enemies | Guardian (cute attack) | Cats sit on | Twist |
|---|---|---|---|---|---|---|
| 1 | Moonlit Forest | night forest | Bat, Ghost, Imp | Old Hoot, a grumpy small owl: swoops side to side, drops feathers | 2 treetops | none (tutorial) |
| 2 | Foggy Swamp | swamp | Wisp, Spider | Sir Gulp, a big toad: burps 3 slow bubbles | 2 mossy rocks, 1 log | fog patches hide the far top for a moment |
| 3 | Dusk Sea | dusk sea | Sea sprite, Crow | Squidge, a shy octopus: waves arms, ink orbs | 3 drifting boats | cats on moving boats |
| 4 | Pumpkin Fields | pumpkin fields | Pumpkin, Scarecrow | Pumpkin King with a crown: rolls, splits into small pumpkins | 2 haystacks, 1 barn roof | pumpkins wake up as you pass |
| 5 | Snowy Village | snowy village | Harpy chick, snow Crows | Frostwing, a fluffy ice dragon: icicle fan | 3 rooftops | snow gusts push the witch softly |
| 6 | Whispering Graveyard | graveyard | Ghost packs, Gargoyle | Lady Boo, a big ghost in a bonnet: hides, pops up | 2 tombstones | blue lanterns light the cat spots |
| 7 | Stormy Castle | stormy castle | Gargoyle, Baby dragon | Gargoyle King: stone fists, 3-orb fans | 2 towers | lightning warns, then a slow sweep |
| 8 | Floating Islands | floating islands | Harpy, Sea sprite | Great Hoot-Hoot, a giant owl: spins feathers in a ring | 3 islands | wind lanes push sideways |
| 9 | Ember Mountain | ember mountain | Baby dragon packs | Smolder, a young dragon: puffs smoke rings of orbs | 2 ledges | falling rocks show a dull shadow first |
| 10 | Moon Castle | midnight, big moon | all, mixed | Duchess Dragon, a queen dragon with a tiny crown, 3 phases | 3 cats in cages (the ring opens the cage) | longest place, the finale |

**Stage 1 dress-up (Moonlit Forest).** Sprites only, waves stay as written. W1-2 bats. W3 ghosts + chest. W4 two imps + bats. W5 bats + an imp. W6 ghosts + imps + chest. W7 three imps + ghosts. W8 looping bats. W9-10 as written. Chests are wooden. Old Hoot comes after wave 10 later (build step 4). Cat 1 sits on a treetop around wave 3-4 (calm part), cat 2 around wave 7.

### 5. Cat rescue (spec for the coder)

**Rules**
- A cat sits on a spot in the background. The spot scrolls down with the ground (about 40 px/s; boats may drift sideways a little). Visible about 10 s.
- Around the cat is a rescue ring, radius 24 units. The witch is "above the cat" when her centre is inside the ring.
- Inside: the ring fills clockwise in 8 segments. Fill time 2.0 s on normal (try 1.5-2.5). Hard 2.5 s.
- Outside: the ring drains at half the fill speed, never instantly, never below empty. The cat is only lost when it scrolls off the bottom.
- Hit while inside: the ring loses 25% at once. She is NOT thrown out.
- Full: happy hop, small meow, sparkle, the cat flies in an arc to the top-left (the hut) and vanishes. A cat icon row on the top bar turns from grey to colour.
- A cat that scrolls off the bottom is lost for this run.
- Auto-fire keeps working. Only one cat spot at a time.
- Wave design rule: at most about 6 enemies alive while a cat is in the hover zone. Cats appear between waves 2-9, in calmer moments.

**Ring look**
- Pixel ring 17x17 art px (about 51 units) around the cat. Empty ring = dark outline only.
- Colour steps by fill: 0-25% dark muted red-brown (clearly duller than the bright red of enemy shots), 25-50% pink, 50-75% light green, 75-100% bright green with a light outline.
- No gold, no bright red. It is a big still circle, so it cannot be mistaken for a small moving orb.
- When she leaves, the segments fade backwards one by one so the drain is visible.
- Cat sprite: round, big eyes, ears down and worried; turns happy at half full.

**Tension with auto-fire.** To hover she must stay still, often low on the screen, while enemies come. That is the point. The player chooses: kill the gunners first, or dash into the ring between waves. No new button. She stays where the finger holds her.

**Reward**
- Each cat gives 1 ingredient (the type of that place) and lives in the hut as a decoration (it sleeps or chases a mouse, no gameplay at first).
- Cats count for a medal (see 7) and unlock recipes (see 6).

**Difficulty options**
- Easy / normal / hard change: fill time, the number of enemies near the cat, and the drain speed (hard: full speed instead of half).
- Hard only: moving spots, or a cat that wanders a little while the witch hovers.

**Cats and "no hit".** Getting hit while rescuing is likely. So the "no hit" medal moves to hard mode (see 7). QUESTION for Omri.

### 6. Hut and cauldron loop

**Collect**
- Coins (gold): from enemies (coinEvery rule as now) and chests. Spent in the cauldron.
- Ingredients, 5 kinds, one for each pair of moods: Moon petal (forest, snow), Bog slime (swamp, sea), Pumpkin seed (fields, village), Ghost dust (graveyard, castle), Dragon scale (mountain, moon castle).
- Drops: sack bats, guardians (1-2 always), cats (1 each). Not from normal enemies, so the screen stays clean. About 2-4 per place.
- Coins about 400 per place at the start.

**Recipes (12 ideas)**

| Recipe | Does | Levels | Cost idea | Unlock |
|---|---|---|---|---|
| Spell speed | base fire rate | 5 | 100, 200, 350, 550, 800 coins | start |
| Spell power | base damage | 5 | 100, 200, 350, 550, 800 coins | start |
| Heart jar | +1 start heart | 3 | 300 coins + 1 moon petal each | place 2 |
| Coin magnet | bigger pull radius | 3 | 150, 300 coins + 1 seed | place 2 |
| Broom boots | broom speed | 3 | 200, 400, 600 coins | place 2 |
| Lucky clover | more coins from chests | 3 | 250 coins + 1 ingredient | 3 medals total |
| Shield bubble | one shield at place start | 1 | 400 coins + 2 bog slime | place 3 |
| Star burst | clears red orbs once per place | 1 | 500 coins + 2 ingredients | place 4 |
| Triple fan | special shot, bought per run | per run | 80 coins per use | place 3 |
| Homing sparks | special shot, bought per run | per run | 120 coins per use | place 5 |
| Cat treats | cat ring fills faster | 2 | 300 coins + 1 ingredient | 3 cats saved |
| Cozy cushion | hut decoration for the cats | 5 | ingredients | cats saved |

Potions picked up in a place only give fire rate + damage (as now). Special shots come from the cauldron.

**Unlocks by medals and cats:** 3 total medals opens Lucky clover. Every 3 cats saved opens a hut item. A full set of one place's cats opens a hat or broom skin (looks only). 8 total medals opens the next level tier of a recipe.

**First 5 places (suggestion)**

| Place | Coins gained (about) | Player can afford |
|---|---|---|
| 1 | 400 | speed L1+L2, power L1 |
| 2 | 450 | power L2, heart jar, magnet |
| 3 | 500 | shield, boots, triple fan per run |
| 4 | 550 | star burst, power L3 |
| 5 | 600 | homing sparks, speed L4, hearts L2 |

Rule: the player can afford something new every 1-2 plays. Hard mode pays 1.5x coins.

### 7. Hard mode

**What changes** (a modifier on the same place, NOT new waves)
- Enemies +25% HP, shots 20% faster, about +3 enemies per wave, some gunners fire 3 orbs.
- Fewer hearts: chests give no hearts, only the start hearts from the cauldron.
- Cats: moving spots, faster drain.
- The guardian gets one extra pattern.
- Coins pay 1.5x.

| Normal medals (4) | Rule |
|---|---|
| Hunter | kill 70% |
| Sweeper | kill all |
| Collector | collect all coins |
| Rescuer | save all cats |

| Hard medals (4) | Rule |
|---|---|
| Untouchable | no hit (moved here from normal) |
| Hard sweeper | kill all on hard |
| Hard rescuer | save all cats on hard |
| Guardian buster | beat the guardian in under 30 s |

Optional swap: a "Speedy" medal (finish in under N minutes).

**Unlocking**
- Place N+1 opens with 2 normal medals from place N.
- The hard moon of a place opens with 3 normal medals of that place.
- Hut items and skins ask for total medals (normal + hard), e.g. 8, 16, 24.
- The story is never gated behind hard mode.
- The map shows 8 badge slots per place, grey until won.

**Why replay:** badge shelves to fill, hard pays more coins and rare ingredients, cats to collect, and each place has small clear goals.

### 8. Title ideas

| # | Title | Feel |
|---|---|---|
| 1 | Moonbroom | short, magical, good app icon |
| 2 | Whisker Wings | cats and flying, very cute |
| 3 | Midnight Mews | cat pun, cosy night |
| 4 | Broom Blitz | action, easy to say |
| 5 | Spellbound Skies | storybook, a bit long |
| 6 | Little Witch Flight | clear and plain |
| 7 | Cauldron Skies | hut and flying together |
| 8 | Hexy Skies | playful |
| 9 | Pumpkin Patrol | Halloween, silly |
| 10 | Purr and Spell | cats and magic |
| 11 | Wisp and Whisker | gentle, a little long |
| 12 | Nightbroom | short, less cute |
| 13 | Cat Cauldron Dash | game-like, goofy |
| 14 | Broomstick Brigade | silly team pun |
| 15 | Witch Way Home | joke on the cat goal |

Top 3: (1) **Whisker Wings**: cats and flying in two words, cute, fits an icon. (2) **Moonbroom**: shortest, easy to remember, looks good on a phone. (3) **Midnight Mews**: cat pun, cosy, but it does not say "shooter". "Flight and Fight" still works as a fallback working name.

### 9. Risks and conflicts

- Red = enemy shots only, but the cat ring should start red. Solved with a dark muted red. Check on the phone that it is not confused with shots.
- Hovering still while gunners shoot can feel unfair. Keep cat zones in calm moments and drain slowly. Test this first: it is the new fun.
- "No hit" and cats pull in opposite directions. Proposal: move "no hit" to hard.
- 10 places x backgrounds, enemies, guardian and cats is a LOT of art. Reuse and recolour creatures. Make 3 places well before the rest.
- Hard mode must be a modifier, not new waves, or the work doubles.
- Medal gates can annoy. 2 medals to move on is enough.
- Ingredients add a second currency. Start with coins only, add the first ingredient at place 2.
- A spell button would need a second finger. Make spells automatic, or use double-tap.
- Rust pumpkins and glowing cracks can look like coins or shots. Keep them dull and big, with dark faces.
- The colour line in the intro (violet coins, pink enemy shots) is out of date. The coder should update sprites.js to this guide.

### Build order (small steps)

1. Re-skin what exists: witch on a broom, bolts, bat / ghost / imp, gold coins, red shots, potion, chest. No new rules. Check readability on the phone.
2. Sound and feel pass (shoot, hit, coin, hurt).
3. Result screen as "back at the hut" with the 4 normal medals; the place ends after wave 10.
4. Guardian prototype: Old Hoot (3 attack patterns, a health bar).
5. Cat rescue prototype in place 1: ring, fill and drain, 2 cats, cat icons on the top bar.
6. Hut screen with the cauldron and 3 recipes (spell speed, spell power, heart jar), coins saved.
7. Map screen with places 1-3 and unlocking by medals.
8. Hard mode modifier + 4 hard medals, then add places 2 and 3 one by one.

---


## Stage 1 waves

### How a wave is built

A stage is a list of 10 waves. A wave is a bundle of groups. ONE generic "follow a path" system runs all of them.

Wave fields:
- start: { after: "clear" or "spawnEnd", delay: seconds }
  - clear = wait until no enemy of earlier waves is left (dead or gone), then wait delay.
  - spawnEnd = delay seconds after the LAST enemy of the previous wave spawned. Earlier enemies may still be flying: this is the overlap.
- groups: list of groups.
- crate: optional (see Crates).

Group fields:
- type: grunt, zigzag or shooter
- n: how many. gap: seconds between spawns. at: seconds after the wave start when the first one spawns.
- spd: speed in px/s along the path (for SIN steps: speed downwards).
- path: list of steps. The enemy spawns at the first point and is removed after the last point.
  - [L, x, y] straight line to (x,y). Optional 4th item {stop: s}: stop there for s seconds (shooters), then go on.
  - [A, cx, cy, r, a0, a1] arc around centre (cx,cy), radius r, from angle a0 to a1 in degrees. Point = (cx + r*cos a, cy + r*sin a). 0 = right, 90 = down, -90 = up. a1 smaller than a0 means the angle decreases. The start point must equal the arc start.
  - [SIN, cx, amp, wave, yEnd, phase] sway around x = cx: x = cx + amp * sin(360 * dy / wave + phase), dy = distance down since the SIN step began, until y = yEnd. wave in px, phase in degrees.
- mirror: true = flip the whole path left-right (x becomes 240 - x; for arcs a becomes 180 - a).
- fire (shooters only): {first: s after stopping, every: s, aim: down or player, shots: 1 or 3, spread: degrees, spd: 100}. Shooters fire only while stopped. Bullet speed 100 px/s (slow and readable). Aim player = at the ship position at the moment of firing (it does not track).
- coinEvery: k = every k-th enemy of the group (k-th, 2k-th ...) drops 1 coin when killed. Shooters always drop 1. This replaces random coinChance for the stage.
- Off-screen points: -20 (above or left), 260 (right), 447 (below).

Global rules:
- An enemy cannot be hit, and cannot hurt, until its centre is inside the 240x427 screen. (No coins lost off-screen, no cheap hits.)
- A wave pip is "done" when none of its enemies is alive (dead or gone).
- Enemy pool 24 is too small for waves 9-10 (peak about 22 plus the tail of the wave before). Raise it to 40. Enemy bullet pool 30 is fine; keep at most about 20 bullets alive.
- Escape lane rule: in every wave a lane at least 50 units wide has no body and no straight bullet at any moment.

Enemy counts: W1 10, W2 10, W3 6, W4 7, W5 8, W6 8, W7 9, W8 12, W9 19, W10 33. Total 122 (70% = 86 kills).

---

### Wave 1: Two Lines (teaches: move and shoot)
Two straight columns of grunts fall down. First one on the right, then one on the left.
~~~
   |  .      .  |    right column first,
   |  .      .  |    then left column
   |  .      .  |    free middle
~~~
- start {after:clear, delay:2} (stage start)
- g1: grunt n5 gap0.5 at0 spd80 path [L 180,-20] [L 180,447] coinEvery2
- g2: grunt n5 gap0.5 at3.5 spd80 path [L 60,-20] [L 60,447] coinEvery2
- No shooting. Lane: middle x 100-140.

### Wave 2: Crossing Slides (teaches: sideways enemies)
Two diagonal lines slide across the screen, one from the left, then one from the right. They cross in the middle and leave through the sides (so "kill all" gets a little harder).
~~~
 o\            /o
    \   X    /
      \/  \/
~~~
- start {after:spawnEnd, delay:5}
- g1: grunt n5 gap0.45 at0 spd90 path [L -20,50] [L 260,210] coinEvery2
- g2: grunt n5 gap0.45 at2.5 spd90 mirror path [L -20,100] [L 260,260] coinEvery2
- Lane: everything stays above y 270, the bottom is free.

### Wave 3: Sway Pair + crate 1 (zigzag, first crate)
Two columns of swaying zigzags go down side by side. A crate drops down the free middle lane.
~~~
  ~ ~    []    ~ ~
 ~ ~   (crate)   ~ ~
~~~
- start {after:spawnEnd, delay:4}
- g1: zigzag n3 gap1.0 at0 spd70 path [L 70,-20] [SIN 70,40,200,447,0] coinEvery2
- g2: zigzag n3 gap1.0 at0 spd70 path [L 170,-20] [SIN 170,40,200,447,0] coinEvery2
- Same phase, so the two columns stay 100 apart. Free middle lane about 60 wide.
- crate C1: {at:2.0, spd:45, path [L 120,-20][L 120,447], hp:6, coins:6}

### Wave 4: First Gunners (first shooters)
Two shooters drop in at the sides, stop, shoot straight down, then fly back up. A column of grunts comes down the middle.
~~~
  S             S      S = stopped shooter
  |             |      bullets go straight down
       o o o o o
~~~
- start {after:spawnEnd, delay:3}
- g1: shooter n1 at0 spd80 path [L 50,-20] [L 50,75,{stop:4}] [L 50,-30] fire {first:0.6, every:1.8, aim:down, shots:1, spd:100}
- g2: same as g1, mirror (x 190), at1.5
- g3: grunt n5 gap0.5 at3.0 spd85 path [L 120,-20] [L 120,447] coinEvery2
- Lanes: x 70-100 and 140-170 (no straight bullets).

### Wave 5: Horseshoe (arc path, first aimed shot)
Grunts come from the bottom right, fly an upside-down U over the map and leave at the bottom left. One shooter sits at the top and shoots at the ship.
~~~
       ____
     /      \
    |        |
    |        o  <- enter bottom right
    o  <- exit bottom left
~~~
- start {after:spawnEnd, delay:4}
- g1: grunt n7 gap0.45 at0 spd100 path [L 220,447] [L 220,230] [A 120,230,100,0,-180] [L 20,447] coinEvery3
- g2: shooter n1 at1.0 spd80 path [L 120,-20] [L 120,55,{stop:5}] [L 120,-30] fire {first:0.8, every:1.6, aim:player, shots:1, spd:100}
- Lane: the middle under the arc (x 70-170, y 230-427) has no bodies. Only the slow aimed bullet must be dodged.

### Wave 6: Weave and Guard + crate 2 (crossing sway, risky crate)
Two zigzag lines sway in opposite directions and cross in the middle again and again. Shooters sit at both sides. A crate hangs at the right edge, under a shooter.
~~~
 S    \/\/\/\/    S
      /\/\/\/\    []  <- crate, right edge
~~~
- start {after:spawnEnd, delay:6}
- g1: zigzag n3 gap1.0 at0 spd70 path [L 120,-20] [SIN 120,65,220,447,0] coinEvery2
- g2: zigzag n3 gap1.0 at0 spd70 path [L 120,-20] [SIN 120,65,220,447,180] coinEvery2
- g3: shooter n1 at1.5 spd80 path [L 25,-20] [L 25,60,{stop:4.5}] [L 25,-30] fire {first:0.8, every:1.8, aim:player, shots:1, spd:100}
- g4: shooter n1 at3.0, mirror of g3 (x 215), same fire
- crate C2: {at:0.5, spd:40, path [L 215,-20][L 215,447], hp:6, coins:6}
- Lane: the zigzags cover x 55-185. The edges x 0-55 and 185-240 are free (the crate sits in the right one on purpose).

### Wave 7: Three Gunners (mixed types)
Three shooters line up at the top. Zigzags weave between them.
~~~
  S      S      S
     ~   ~   ~
~~~
- start {after:spawnEnd, delay:6} (the end of wave 6 is still leaving)
- g1: shooter n1 at0 spd80 path [L 40,-20] [L 40,70,{stop:4.5}] [L 40,-30] fire {first:0.6, every:2.0, aim:down, shots:1, spd:100}
- g2: shooter n1 at0.8 spd80 path [L 120,-20] [L 120,70,{stop:4.5}] [L 120,-30] fire {first:0.6, every:1.6, aim:player, shots:1, spd:100}
- g3: shooter n1 at1.6, same as g1 but mirror (x 200)
- g4: zigzag n6 gap0.8 at2.0 spd75 path [L 120,-20] [SIN 120,50,200,447,0] coinEvery2
- Lanes: x 60-100 and 140-180 (no straight bullets).

### Wave 8: Loop-de-loop (loop and turn, overlap)
Grunts dive, do a full loop, then slide away sideways. A second group does the same from the other side.
~~~
   o                 o
   |  ,--.     .--,  |
   |  \  /     \  /  |
    \_/           \_/
      \____  ____/
           \/
~~~
- start {after:spawnEnd, delay:5} (overlaps the end of wave 7)
- g1: grunt n6 gap0.6 at0 spd100 path [L 60,-20] [L 60,100] [A 90,100,30,180,-180] [L 60,230] [L 200,270] [L 260,270] coinEvery3
- g2: same as g1, mirror, at3.0
- Lane: the bottom (y over 290) is free.

### Wave 9: Gauntlet (many things at once)
A mirrored horseshoe, a crossing zigzag pair, two aimed gunners, and last a fast diagonal swarm.
- start {after:spawnEnd, delay:3}
- g1: grunt n5 gap0.5 at0 spd110 mirror path [L 220,447] [L 220,230] [A 120,230,100,0,-180] [L 20,447] coinEvery3 (mirrored: enters bottom LEFT, leaves bottom right)
- g2: zigzag n3 gap0.8 at2.0 spd80 path [L 120,-20] [SIN 120,65,220,447,0] coinEvery2
- g3: zigzag n3 gap0.8 at2.0 spd80 path [L 120,-20] [SIN 120,65,220,447,180] coinEvery2
- g4: two shooters, one with x=70 and one with x=170, at3.0, path [L x,-20] [L x,60,{stop:5}] [L x,-30] fire {first:0.8, every:1.4, aim:player, shots:1, spd:100}
- g5: grunt n6 gap0.35 at7.0 spd130 path [L -20,100] [L 260,300] coinEvery3
- Lane: the middle under the horseshoe arc, then the bottom (y over 320).

### Wave 10: Last Rush (hardest, after a short calm)
Calm first: only crate 3 falls. Then three gunners, two crossing zigzag lines, looping grunts from both sides, and last a wall of fast grunts with a hole in the middle.
- start {after:clear, delay:4}. Crate 3 spawns at the moment of the clear, so it falls during the 4 calm seconds.
- g1: three shooters (x = 40, 120, 200) gap0.6 at0, path [L x,-20] [L x,70,{stop:5.5}] [L x,-30]. Side ones fire {first:0.6, every:1.5, aim:down, shots:1, spd:100}. Centre fires {first:1.0, every:2.2, aim:player, shots:3, spread:20, spd:100}
- g2: zigzag n4 gap0.8 at1.5 spd85 path [L 120,-20] [SIN 120,70,220,447,0] coinEvery2
- g3: zigzag n4 gap0.8 at1.5 spd85 path [L 120,-20] [SIN 120,70,220,447,180] coinEvery2
- g4: grunt n6 gap0.5 at5.0 spd110, wave 8 loop path, coinEvery3
- g5: same as g4, mirror, at8.0
- g6: grunt n5 gap0.3 at12.0 spd150 path [L 45,-20] [L 45,447] coinEvery2
- g7: grunt n5 gap0.3 at12.0 spd150 path [L 195,-20] [L 195,447] coinEvery2
- Lane: the wall leaves the middle x 90-150 open. Fan shots have gaps. Gunners stay above y 70, so the lower half is free.
- crate C3: {at:clear, spd:40, path [L 120,-20][L 120,447], hp:10, coins:10}

---

### Crates (3 per stage, placed by hand, never random)
- Look: a box with a clear outline (brown/grey with a light lid, not violet, not pink), about twice the size of a coin, with a tiny shine. Falls slowly (40-45 px/s). Shoot it open: hp 6 (C1, C2) or 10 (C3). It never shoots and does not hurt on touch (the ship flies through it). Opening it spills a pile of coins that fall like normal coins.
- C1 in wave 3: easy, free middle lane. Teaches "shoot the box".
- C2 in wave 6: at the right edge, near the guards. Risk or reward.
- C3 in the calm before wave 10: a gift, but it is still falling when wave 10 starts. Bigger pile.
- Coin values (suggested): single coin 5. C1 and C2 = 6 coins x 5 = 30. C3 = 10 coins x 5 = 50. Stage total about 55 single coins (275) + crates 110 = about 385. Coin magnet radius about 40 units, so collecting is not a game of pixels.
- A crate that falls off the bottom unopened is lost with its coins.

### Achievements and the waves (per stage)
Counters kept: enemies spawned, enemies killed, coins dropped (a crate coins count when it opens), coins collected, hits taken.
- Kill all: hard in waves 2 (sideways exit), 8 (loop, then leave), 9 (fast diagonal swarm leaves in 3 s) and 10 (gunners fly up after 5.5 s).
- Kill 70%: 86 of 122. You may skip about 36. Missing the wave 9 diagonal group and a few leavers is still fine: it is the normal goal.
- Collect all coins: waves 5 and 9 (coins fall inside the arc), wave 6 (crate at the edge), wave 10 (crate plus 33 targets). Coins from enemies killed low (y over 330) fall off the screen fast.
- No hit: waves 5 (entering from the bottom), 8 (loops cross the middle), 9, 10. Crate 2 tempts you into danger.

### Wave indicator (later screen)
- Row of 10 small pips, top centre, y about 8. Each pip 5x5 art px, gap 2 art px (about 70 units wide, so it does not touch the score on the left).
- Future wave: dark hollow square. Current wave: bright filled square, blinking slowly. Done wave: solid filled; a small notch is cut out if some of its enemies escaped (so the player sees clean or not clean). The wave 10 pip is a diamond. Optional tiny dot above pips 3, 6, 10 = a crate comes in that wave.
- Overlap: an old pip stays "current" until its enemies are gone, so two pips can blink at once.
- At each wave start a short sweep (0.3 s) runs along the pip. No text.

### Achievement icons (later screen)
- 4 icons, 7x7 art px, in a row top-left under the score. Order: skull (kill all), gem (all coins), shield-heart (no hit), half-filled skull (70%).
- Grey (dark outline only) until earned. They light up with a small pop at the end of the stage. Optional: a thin red cross appears on an icon the moment it can no longer be earned.
- Tracking: kill all = killed == spawned (crates are not enemies). 70% = killed >= 0.7 * spawned. All coins = coinsCollected == coinsDropped. No hit = hitsTaken == 0.

### Problems with the wishes (to decide)
- Kill all vs enemies that leave the screen: a path that leaves quickly can make "kill all" impossible. Rule used: every enemy stays on screen at least 3 s within reach. Waves 2, 8, 9, 10 are still hard on purpose.
- Kill all vs 70% are almost the same goal. Worth having both only if the stage is not easy. Needs tuning after Omri plays it. Maybe 70% should be 80%.
- Collect all coins vs random coin drops and coins falling off the bottom: with random drops it is unfair. Fix: fixed drops (coinEvery), coins only after on-screen kills, and a magnet. Coins that fall below the ship are lost for good.
- Crates: do they count as enemies? Chosen: no. Do their coins count for "all coins"? Chosen: yes, so a missed crate breaks that goal.
- No hit vs enemies entering from the bottom (waves 5, 9): they appear behind the ship, which can feel unfair. Keep only if the phone test feels fine.
- No hit vs the current ram rule (crashing kills the enemy but costs a heart): fine, but "no hit" means no crashing too.
- A fixed script replaces the looping wave list in config.js: the stage must END after wave 10 and show a result screen with the 4 icons. No loop any more.
- Stage balance depends on the weak gun (170 ms, twin). Upgrades later change how hard "kill all" is. Balance stage 1 for the base ship first.

## Shop and upgrades (26 Nov 2026; coins, saving, the Cauldron and MAGNET are built (v1.9.165), DAMAGE, FIRE SPEED and tougher enemies too (v1.9.169), see PLAN-cauldron.md; the rest is still ideas. The menu cauldron, bottom left, opens the shop; the cat sits bottom right.)
Where this differs from the older "Hut and cauldron loop" (recipes, ingredients, medal unlocks), THIS section counts.

### Decided
- Coins picked up are saved after each run. You keep them when you die.
- The shop is called the CAULDRON. An icon bottom left on the main menu opens it. A simple list of upgrades. No refunds.
- Open from the start: SHOT DAMAGE and MAGNET (magnet = pulls things from further away than today's short pull).
- Shot damage goes up by 1 per level (today 2).
- FIRE SPEED upgrade too: Omri likes seeing faster shots.
- Spells: pay a fee once to unlock one, then a smaller price for each improvement. Kept forever. They happen by themselves.
- ALL unlocked spells work at the same time. The stages get harder to match.
- Enemies get tougher (they die too fast today), in the same step as the shop. Coins by enemy TIER (decided later the same day): stronger enemies drop more coins, and more coins spread wider; a single coin falls straight. Build plan: PLAN-cauldron.md.
- DAMAGE, MAGNET and FIRE SPEED have 10 levels each.
- Nine Lives: bought once, saves her once in every stage.
- Side shots: thinner spell bolts. No bats or other creatures beside her (visual clutter).
- Extras Omri wants (later than the first three): extra heart, side shots with a witch-themed spin, homing shot, more coins, revive once.
- Stars are only for opening stages. Stars do not lock shop items.
- Shield spell (later): a blocked hit does NOT cost the no-hit star. That is the point of the shield.

### Proposed, not yet agreed
- Upgrading a spell shortens its wait, not its damage. Bosses take less from spells.
- First spell: lightning, zaps the 3 toughest enemies about every 10 s. Shield: blocks one hit, back after about 25 s. Later ideas: star burst (clears nearby shots, 15 s), ghost helper (shoots with you, 20 s), (other extras: see below).
- The 10 levels, proposed sizes: damage (+0.3 each, 2 -> 5; this replaces +1 each), magnet and fire speed (170 -> 110 ms), a visible change at level 5 and 10. First levels cost under 1 run, the last ones 4-5 runs.
- Themed names: extra heart = Heart Jar (2 levels), side shots = thin spell bolts, homing shot = seeking bats, more coins = Lucky Clover, revive = Nine Lives (a cat saves her).
- (Replaced by coin tiers, see Decided) Coin scatter: the one coin an enemy drops pops out to a random side with a small hop, slows down, then falls. Same value, same number of coins; the magnet helps to catch it.
- Tougher enemies: health grunt 3 -> 5, zigzag 4 -> 7, shooter 7 -> 14. Shots to kill at damage 2 / 3 / 4 / 5: grunt 3/2/2/1, zigzag 4/3/2/2, shooter 7/5/4/3 (with 10 smaller damage steps some levels only show on tougher enemies and bosses).
- Prices counted in runs (measure coins per run first): unlock lightning about 4; each lightning improvement about 2.
- Build order: save coins and show the total; Cauldron with magnet, damage and fire speed, together with the tougher enemies; lightning; play it and adjust prices.

### Watch out
- Today: shot damage 2; enemy health 3 (grunt), 4 (zigzag), 7 (shooter). With today's health, damage 5 kills no faster than damage 4.
- A new player has no upgrades: with tougher enemies the first runs must still be beatable and fun.
- Damage upgrades stack with the in-stage potions; with fire speed and all spells at once, the stages and the no-hit star can get easy.
- Art: art-packs/effects-vfx/free-spell-effects-24 lists lightning and shield effects (check each effect's licence in its index.json; not previewed).
