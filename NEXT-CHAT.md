# Message for a new chat (Flight and Fight)

Copy everything between the lines into the first message of a new chat.

---
Continue Flight and Fight (folder flight-and-fight). Live version is v1.9.80 on main (https://goomri.github.io/flight-and-fight/). Read in this order: the memory note "project-flight-state" (index MEMORY.md), flight-and-fight/ROADMAP.md, the last 8 entries of flight-and-fight/NOTES.md, DESIGN.md section "CURRENT LOOK", and flight-and-fight/CLAUDE.md. Then say ready, in one line.

How I want to work: small versions, short plain answers, a numbered phone checklist after every push, no screenshots from you unless the change is new. You may merge and push in this repo at once after a finished, syntax-checked change (never force-push). Ask me when a choice is mine (use the question tool); do not ask about licences (CREDITS.md has them).

Things you must know:
- You cannot open the browser pane in this setup, so nothing visual is verified: say UNVERIFIED and I send screenshots. Syntax-check every file in src/ before each push. A small script that runs the menu with fake Phaser objects is in E:\Projects\GIT\scratch\menu-smoke.mjs (run: node ..\scratch\menu-smoke.mjs from flight-and-fight).
- Edit files with small Python patch scripts written to E:\Projects\GIT\scratch (not heredocs with tricky quotes) or the Edit tool. Files use CRLF: keep it.
- Recolouring art = swap colours only, never add or move pixels. New art Omri adds lands in the repo root: move it into art-packs/ (git-ignored) before committing, and never `git add` art-packs.
- Boundaries: only E:\Projects\GIT. Other projects (SCRiTCH, Game Night) need his explicit "push".

What just happened (v1.9.79 to v1.9.80): purple forest tint, bigger enemy explosions and coins; the high score now saves on game over too and saved scores were reset once; weapon carriers have a blue outline; every enemy has a soft dark aura (not bosses); swamp lamps glow less; menu witch trail is stronger; stage pictures in the tiles are more visible; the in-game witch is the repainted sheet assets/witch/witch-1.png (config ship.witch 1).

Open, in order of what Omri asked: (1) discuss GOALS and STARS (list, order, icons, how the menu shows them) with the proposal in ROADMAP.md; (2) discuss enemy projectile types (ideas in ROADMAP.md); (3) decide the new font (art-packs/fonts/DungeonFont.ttf, readable only large; idea: titles only); (4) roadmap items: cats, boss (art in art-packs/characters-and-enemies), swamp enemy patterns, pixel-art blue pill power-up bar at the top; (5) Omri asked about working across sessions: this file and ROADMAP.md are the answer, keep them current.
---
