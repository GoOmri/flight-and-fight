# Flight and Fight: working rules

(Working name. Rules in E:\Projects\GIT\CLAUDE.md about Omri, boundaries and no pushing also apply.)

## What it is
- Android vertical-scrolling shoot-'em-up in the style of Sky Force. Prototype: runs in the browser, built with JavaScript + Phaser 3 (decided 2026-11-17). Later: wrap as an Android app (Capacitor), or maybe move to Godot. Style: probably pixel art. Hero: maybe a cat, maybe a kite (undecided).
- Goal number one: it must be FUN. Game feel first (movement, shooting, hits, sound), features second.

## Rules
- Work on a branch. Omri's standing permission (2026-11-17): in THIS repo only (flight-and-fight), Claude may merge a finished, committed branch into main and push main and branches, without asking each time. Still never force-push, delete branches/repos, tag, or change repo settings without asking. This permission does NOT cover SCRiTCH, Game Night or anything else.
- No secrets in git: no keystores (.jks, .keystore), no passwords or keys. The repo may become public.
- Plain JavaScript (ES modules) + Phaser 3. No build step for now. Keep the game small and readable.
- Balance numbers (speed, health, fire rate, spawn times) live in one file (e.g. src/config.js) so they are easy to tune.
- Do not download libraries or assets without asking Omri (state file, source, size).
- Tests must never use the network.
- The game can be played in the built-in browser here. Anything that needs a real phone (touch feel, speed, sound) is UNVERIFIED: say so.
- After any change, add a short dated entry to NOTES.md (what changed, what is unverified, what to check on the phone).

## Agents (in E:\Projects\GIT\.claude\agents)
- flight-coder (Sonnet): edits code on a branch, never pushes.
- flight-reviewer (Opus): read-only, strict, real problems only.
- flight-designer (Sonnet): proposes enemies, waves, upgrades, screens; keeps DESIGN.md.
- Flow: designer (if new idea) -> coder -> reviewer -> report to Omri in plain words -> Omri decides about pushing.
- Agents start with no memory of the chat: give them the full task.
