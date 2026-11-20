# KILNWARD — *Elegy of the Porcelain Saint*

A dark-fantasy stylized 3D Action-RPG **complete 4-Act campaign** built with **Three.js** (zero build step, 100% offline-ready vendored dependencies), blending **Diablo's** torchlit isometric dungeon combat and progression with **Swordigo's** readable weapon arcs, elemental spell puzzles, interconnected wing unlocks, and handcrafted exploration.

- **Complete 4-Act Campaign:**
  - **Act I — *The Sunken Kiln*:** 4 interconnected cathedral zones, Resonance Crystal chasm puzzle, Crucible Ambush, Twin Resonance Bells, and **Saint Cassian, The Fractured Kiln**.
  - **Act II — *The Salt Viaduct*:** Wind-swept moonlit salt aqueducts, **Sister Maren**, **Verdigris Tether (`C`)**, Counterweight Bell puzzle, Gale Harriers & Salt Halberdiers, and the synchronized dual boss **The Twin Arch-Censers (Vael & Soren)**.
  - **Act III — *The Cobalt Cisterns*:** Lapis-blue waterworks & scriptoria, **Resonance Bell-Hammer (`V` stance swap)**, live-traced **3-Mirror Golden Sun-Beam puzzle**, Mosaic Prisms, and **Archivist Pelagius, The Kiln-Orrery**.
  - **Act IV — *The Belfry of Unfired Ash*:** Sunlit rose-gold dawn summit, 3-phase final boss **Arch-Prelate Aurelius, The Uncooled**, and **3 Canonical Endings** (including a secret True Ending for recovering ≥5/7 Lore Steles).
- **Save & Chapter Select:** Auto-saves at every Kiln Shrine (`localStorage`), supports Shrine Fast Travel, and includes **Chapter Select** on the Title Screen to jump directly to Act II, III, or IV.
- **Artistic Vision:** *Tenebrist Majolica & Kintsugi* — procedural `<canvas>` textures + selective `UnrealBloomPass` + real-time Web Audio synthesizer.

---

## Quick Start

From the project root:

```bash
chmod +x play.sh
./play.sh
```

Then open **http://localhost:8080** in Chromium, Chrome, Firefox, or Edge.
(You can also run `python3 -m http.server 8080` directly.)

---

## Controls

| Action | Mouse + Keyboard | Keyboard-Only |
|---|---|---|
| Move (screen-aligned 8-way) | `W A S D` / Arrow Keys | `W A S D` / Arrow Keys |
| 3-Hit Crescent Sword Combo | `Left Click` (tap or hold) | `J` |
| Arcane Bolt (aims at cursor / facing) | `Right Click` | `E` or `K` |
| Solar Kiln Nova *(unlocked in West Wing)* | `Q` | `Q` |
| Kintsugi Aegis *(unlocked in East Wing)* | `R` | `R` |
| Gilded Dash *(invulnerability frames)* | `Space` / `Shift` | `Space` / `Shift` |
| Interact *(NPC, Shrine, Bell, Chest, Stele)* | `F` | `F` |
| Drink Ember Flask *(refills at Shrines)* | `1` | `1` |
| Vesper's Codex & Relics Ledger | `Tab` | `Tab` |
| Mute Audio / Pause Menu | `M` / `Esc` | `M` / `Esc` |

---

## Continuation Documentation (For Future Agents & Developers)

This repository is designed to be seamlessly extended into a multi-act RPG. Read these documents before extending the codebase:

1. **[docs/ART_DIRECTION.md](./docs/ART_DIRECTION.md)** — Complete visual & audio bible (*Tenebrist Majolica & Kintsugi* color palette, lighting, selective bloom, procedural texture standards, silhouette language, and audio motifs).
2. **[docs/STORY_AND_LORE.md](./docs/STORY_AND_LORE.md)** — Full 4-Act narrative outline, worldbuilding canon, character dossiers, voice/tone rules, and hooks connecting Act I to Acts II–IV.
3. **[docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)** — Codebase map, coordinate & collision conventions, declarative data schemas, and step-by-step recipes for adding zones, enemies, spells, relics, and bosses.
4. **[docs/ROADMAP.md](./docs/ROADMAP.md)** — Prioritized roadmap for Act II (*The Salt Viaduct*), Act III (*The Cobalt Cisterns*), Act IV (*The Belfry of Unfired Ash*), and technical milestones.

---

## Project Layout

```text
├── index.html                  # Game shell, HUD, modals, local Three.js importmap
├── play.sh                     # Local static server launcher
├── styles/main.css             # Tenebrist Majolica & Diablo-inspired orb HUD styling
├── vendor/three/               # Local vendored Three.js r170 + UnrealBloom postprocessing
├── docs/                       # Artistic, narrative, architectural & roadmap handoff docs
└── src/
    ├── main.js                 # Game loop, state machine, combat & trigger orchestrator
    ├── config/                 # palette.js, gameData.js, worldLayout.js
    ├── engine/                 # renderer.js, textures.js, audio.js, particles.js
    ├── world/                  # WorldBuilder.js, Collision.js
    ├── entities/               # Player.js, Enemy.js, Boss.js, Interactables.js
    └── ui/                     # HUD.js, Minimap.js, Overlays.js
```
