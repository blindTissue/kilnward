# KILNWARD — Technical Architecture & Agent Continuation Guide

This guide explains how every subsystem in **KILNWARD** fits together and provides concrete, copy-paste-ready recipes for future agents extending the game.

---

## 1. Runtime & Dependency Model

- **Zero Build Step:** Pure native ES Modules (`<script type="module" src="./src/main.js">`) with an `<script type="importmap">` in `index.html`.
- **Vendored Three.js r170:** Located in `vendor/three/` (`three.module.min.js`, `postprocessing/*`, `shaders/*`). No `npm install` or internet connection is required to run or test.
- **Global Debug Handle:** `window.__KILNWARD__` exposes the active `KilnwardGame` instance for automated testing, telemetry inspection, or camera debugging.

---

## 2. World Coordinate & Collision Conventions

- **Axes:** `+X` = East, `-X` = West, `+Z` = South, `-Z` = North, `+Y` = Up. Ground playable plane is strictly **`Y = 0`**.
- **Yaw Convention:** `yaw = Math.atan2(dx, dz)` so forward vector is `(Math.sin(yaw), 0, Math.cos(yaw))`. `yaw = 0` faces South (`+Z`); `yaw = Math.PI` faces North (`-Z`).
- **Camera Alignment:** `GameRenderer` precomputes `moveForward` and `moveRight` by projecting the camera view vector onto `Y = 0`. Never hardcode `W -> -Z` in entity code—always derive movement from `renderer.moveForward` / `renderer.moveRight`.
- **Collision (`src/world/Collision.js`):**
  - 2D Circle-vs-AABB and Circle-vs-Circle solver running 2 relaxation iterations per frame for jitter-free corner sliding.
  - Low railings (`style: 'balustrade'`) register `blocksProjectiles: false` so spells like Arcane Bolt fly across gaps to hit switches (e.g., `west_crystal`).
  - Dynamic gates (`westBarrier`, `eastSeal`, `sanctumGate`, `bossMist`) register an `id` with `collision.addBox(...)` and toggle via `world.setGateOpen(id, boolean)`.

---

## 3. Module Architecture

```text
src/
├── main.js                   # State machine (TITLE|PLAYING|MODAL|PAUSED|DEAD|VICTORY), loop, combat resolution, triggers
├── config/
│   ├── palette.js            # PALETTE tokens & ZONE_ATMOSPHERE lighting/fog/drone presets
│   ├── gameData.js           # PLAYER_BASE_STATS, XP_CURVE, SPELLS, RELICS, FORGE_UPGRADES, ENEMY_ARCHETYPES, LORE_ENTRIES, DIALOGUES
│   └── worldLayout.js        # Declarative map: zones, floors, basins, walls, pillars, braziers, gates, switches, NPCs, shrines, steles, bells, chests, urns, enemies, gauntlet, boss
├── engine/
│   ├── renderer.js           # WebGLRenderer, EffectComposer + UnrealBloomPass, lights, shadow tracking, camera rig, reticle
│   ├── textures.js           # Procedural seeded HTML5 canvas textures (flagstones, walls, porcelain, glow sprite)
│   ├── audio.js              # Web Audio API synth (zone drone, swing, hit, shatter, bolt, nova, dash, FM bronze bell, boss horn)
│   └── particles.js          # Slash arcs, ring waves, shard bursts, dash ghosts, ground telegraphs, projectiles, sky beams, ambient ash
├── world/
│   ├── Collision.js          # 2D circle vs AABB/circle physics + projectile ray/point solid test
│   └── WorldBuilder.js       # Generates all 3D geometry & colliders from worldLayout.js + animates braziers/gates/crystal/water
├── entities/
│   ├── Player.js             # Vesper mesh, 3-hit combo, dash i-frames, 3 spells, flask, stats/leveling/relics/forge
│   ├── Enemy.js              # 4 procedural archetypes + AI state machine + billboarded 3D HP bars
│   ├── Boss.js               # Saint Cassian 2-phase state machine & attack choreography
│   └── Interactables.js      # NPCs, Cassian Echo, Shrines, Steles, Bells, Chests, Urns, magnetic Loot Orbs
└── ui/
    ├── HUD.js                # Orbs, skill slots/cooldowns, quest tracker, boss bar, floating damage numbers, banners
    ├── Minimap.js            # Top-right 2D canvas projection of worldLayout + live entities
    └── Overlays.js           # Title, Dialogue/Lore, Kiln Forge shop, Codex/Relics, Pause, Death, Victory
```

---

## 4. Recipes for Future Agents

### Recipe A: Adding a New Zone (e.g., Act II — *The Salt Viaduct*)
1. **Atmosphere (`src/config/palette.js`):** Add a `salt_viaduct` entry to `ZONE_ATMOSPHERE` with `fogColor`, `ambientColor`, `moonColor`, and `droneFreq`.
2. **Textures (`src/engine/textures.js`):** Add `floorSalt` and `wallSalt` using `buildFlagstone(...)` and `buildWallTexture(...)`.
3. **Geometry (`src/config/worldLayout.js`):**
   - Add bounding box to `zones[]`.
   - Append floor slabs (`floors[]`), perimeter walls (`walls[]`), pillars (`pillars[]`), and braziers (`braziers[]`).
   - Connect via an open archway (e.g., North of the Great First Bell at `z = -73` by splitting the north apse wall into two cheeks with a gate that opens after `demoCompleted`).
4. **Builder (`src/world/WorldBuilder.js`):** Map the new `style: 'salt'` string in `_buildFloors()` and `_buildWalls()`.
5. **Minimap (`src/ui/Minimap.js`):** Add the color branch for `f.style === 'salt'` (or convert the minimap to follow `player.pos` once the world exceeds ~180 units!).

### Recipe B: Adding a New Enemy Archetype
1. Define stats in `ENEMY_ARCHETYPES` inside `src/config/gameData.js` (`maxHp`, `speed`, `damage`, `attackRange`, `windup`, `cooldown`, `xp`, `gold`, `radius`, `height`, `poise`).
2. Add its silhouette builder branch in `Enemy._buildMesh()` (`src/entities/Enemy.js`).
3. Add its windup telegraph and `_executeAttack()` behavior in `Enemy.js`.
4. Place instances in `WORLD_LAYOUT.enemies` or wave arrays in `worldLayout.js`.

### Recipe C: Adding a New Spell or Passive Relic
- **Relic:** Add an entry to `RELICS` in `src/config/gameData.js` with an `apply(stats)` hook—`Player.recomputeStats()` automatically applies every relic in `player.relics`, and `Overlays.showCodex()` automatically displays it.
- **Spell:**
  1. Add metadata to `SPELLS` in `src/config/gameData.js`.
  2. Add `unlockedSpells.<id>` and `cooldowns.<id>` in `Player.js` plus a `tryCast<Name>()` method.
  3. Add a `.skill-slot` element in `index.html` and register it in `HUD.js`.
  4. Bind the hotkey in `KilnwardGame._bindInput()` in `src/main.js`.

### Recipe D: Adding Persistent Save / Load (`localStorage`)
All mutable progression lives cleanly on two plain objects:
- `game.questState` + `game.discoveredLore` + `game.metrics`
- `player` (`level`, `xp`, `gold`, `relics`, `forgeTiers`, `unlockedSpells`, `respawnPos`)

Serialize these as JSON at `Player.restAtShrine()` and hydrate on boot before `_spawnInitialEnemies()`!

---

## 5. Performance & Verification Notes

- **Target Frame Budget:** Keeps draw calls modest (~250 meshes total), shadow map at `2048×2048`, and max DPR capped at `2`.
- **Avoiding Memory Leaks:** `ParticleSystem` removes expired transient meshes from `scene`. If expanding to very large acts (500+ effects/minute), swap transient particle boxes/shards to a pooled `THREE.InstancedMesh`.
- **Automated Verification:** Any future agent should verify changes in headless Chromium (serving via `python3 -m http.server`) and assert zero `console.error` / `pageerror` events plus visual screenshot checks of the Title Screen, Cloister, Combat, and Boss Arena.
