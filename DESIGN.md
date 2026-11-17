# Flight and Fight: DESIGN

Screen: 240 wide x 427 tall (x 0 = left, y 0 = top). The ship sits near y 347. Pixel art, one art pixel = 3 screen units.
Colour rules (already in src/sprites.js): player bullets are a cyan-white bolt, enemy bullets are a pink orb with a dark outline, coins are violet gems, no yellow or gold on bullets. Players never see technical text.

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
