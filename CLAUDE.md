# Flight and Fight: working rules

(Working name. Rules in E:\Projects\GIT\CLAUDE.md about Omri, boundaries and no pushing also apply.)

## What it is
- Android vertical-scrolling shoot-'em-up in the style of Sky Force. Prototype: runs in the browser, built with JavaScript + Phaser 3 (decided 2026-11-17). Later: wrap as an Android app (Capacitor), or maybe move to Godot. Style: pixel art. Hero: a cute witch on a broom.
- Goal number one: it must be FUN. Game feel first (movement, shooting, hits, sound), features second.

## Decisions and roadmap (Omri, 2026-11-28: "be steps in front of me")
- ROADMAP.md is the ONE list of what is next, parked and refused. Read all of it before suggesting, planning or answering "what is next".
- The moment Omri decides something (yes, NO, "later", a new idea), write it there in the same turn, under the right heading. A refusal goes under "We said NO" with the date.
- After building something, move it to "Already done" in the same commit.
- Before saying something is missing or not built, check the code and NOTES.md. Documents can be old.
- Say it, unasked, when something is about to be done in the wrong order (it depends on something not built or not tested yet) or when two documents disagree.
- DESIGN.md "World guide" is an early proposal, not a plan.

## Rules
- Work on a branch. Omri's standing permission (2026-11-17): in THIS repo only (flight-and-fight), Claude may merge a finished, committed branch into main and push main and branches, without asking each time. Still never force-push, delete branches/repos, tag, or change repo settings without asking. This permission does NOT cover SCRiTCH, Game Night or anything else.
- No secrets in git: no keystores (.jks, .keystore), no passwords or keys. The repo may become public.
- Plain JavaScript (ES modules) + Phaser 3. No build step for now. Keep the game small and readable.
- Balance numbers (speed, health, fire rate, spawn times) live in one file (e.g. src/config.js) so they are easy to tune.
- Do not download libraries or assets without asking Omri (state file, source, size).
- Art packs live LOCAL in art-packs/ (git-ignored; most licences forbid redistribution and the repo is public). The catalogue with source, licence and status of every pack is art-packs/CATALOG.md: read it before using a pack, and update it when Omri adds one. Never git add art-packs. Copy only the pictures the game really uses into assets/<theme>/ and credit them in CREDITS.md (ask Omri before pushing files from a paid pack).
- ALWAYS include the link when Omri should look at something (Omri asked, 19 Nov): the live game https://goomri.github.io/flight-and-fight/ (say which version he should see under the medals), a test build with ?bg=, ?wave= etc., and the local animation gallery (art-packs/_tools/gallery, link and how it works in art-packs/CATALOG.md; it only opens while the preview server runs and the phone is on the same Wi-Fi).
- Tests must never use the network.
- The animation gallery (art-packs/_tools/gallery/index.html) and the sound picker (art-packs/_tools/sound-picker/index.html) only open while the preview server runs: LEAVE IT RUNNING after testing (Omri, 2026-11-28: they were not reachable).
- The game can be played in the built-in browser here. Anything that needs a real phone (touch feel, speed, sound) is UNVERIFIED: say so.
- After any change, add a short dated entry to NOTES.md (what changed, what is unverified, what to check on the phone).

## Agents (in E:\Projects\GIT\.claude\agents)
- flight-coder (Sonnet): edits code on a branch, never pushes.
- flight-reviewer (Opus): read-only, strict, real problems only.
- flight-designer (Sonnet): proposes enemies, waves, upgrades, screens; keeps DESIGN.md.
- Flow: designer (if new idea) -> coder -> reviewer -> report to Omri in plain words -> Omri decides about pushing.
- Agents start with no memory of the chat: give them the full task.
