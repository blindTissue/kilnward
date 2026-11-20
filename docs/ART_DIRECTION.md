# KILNWARD — Art Direction & Audio Bible

> **Core Aesthetic Pillar:** *Tenebrist Majolica & Kintsugi*
> A sunlit Mediterranean ceramic abbey plunged into midnight shadow, where every fracture is repaired with glowing molten gold.

---

## 1. Artistic Vision & Differentiator

Most browser-based dark-fantasy RPGs default to desaturated grey stone and muddy brown fog. **KILNWARD** deliberately avoids neutral grey by grounding every surface in **glazed ceramic, oxidized copper-bronze, kiln terracotta, and ivory porcelain**, lit with **Caravaggio-inspired tenebrism** (deep cool indigo shadows pierced by warm golden point lights and selective bloom).

### Design Influences
- **Diablo (I / II / IV):** Heavy architectural weight, isometric torchlit clarity, crimson/cerulean glass-orb HUD, grounded tactile combat with floating damage popups, and imposing boss arenas.
- **Swordigo:** Crisp readability at a glance, bright sweeping crescent sword trails, glowing elemental switches and rune-barriers, interactive lore tablets, and compact, purposeful exploration wings.
- **Kintsugi Philosophy (Visual & Narrative):** Broken things are not hidden; their seams shine brightest. Every progression milestone (tempering the sword, lighting a bell, shattering Saint Cassian's glaze) increases the luminosity of gold seams in the world.

---

## 2. Color Palette & Material Rules

All color tokens live in `src/config/palette.js`. Future agents **must** pull from or extend `PALETTE` and `ZONE_ATMOSPHERE` rather than hardcoding arbitrary colors.

| Role | Token | Hex | Material Usage |
|---|---|---|---|
| Deep Shadow / Fog Base | `cobaltDark` | `#0d1322` | Cloister/Crossroads backdrop, shadow troughs |
| Cathedral Masonry | `cobaltSlate` | `#161f33` | Primary flagstones, ashlar walls, UI panels |
| Vessel Porcelain | `porcelainWhite` | `#ebe3d3` | Vesper's mask, Husks, Urns, Saint Cassian |
| Architectural Bone | `boneIvory` | `#d9ccb2` | Pillars, steles, wall coping, UI display typography |
| Drowned Copper | `verdigrisBronze` | `#2d6d66` | West Nave stone, braziers, oxidized fixtures |
| Aether / Switch Accent | `verdigrisGlow` | `#45d6c5` | Arcane Bolt, Crystal Switch, West Bell, Aether Orb |
| Kiln Masonry | `terracotta` | `#9b4d33` | East Ossuary bricks, Skitterer carapace |
| Furnace Heat | `kilnAmber` | `#e87b35` | East Bell, enemy fireballs, ember vents |
| Kintsugi Gold (Primary Accent) | `kintsugiGold` | `#f5b942` | Sword arcs, gold inlays, UI frames, Sanctum sigils |
| Bloom Highlight | `kintsugiBright` | `#ffe48f` | Crits, Level-Up waves, Phase 2 ignition, Great Bell |
| Danger / Telegraph | `telegraphRed` | `#ff3b47` | Enemy attack cones/rings, HP orb, player damage flash |

### Zone Color Progression (Act I)
Each zone shifts the hemisphere light, moon directional light, and distance fog smoothly over ~0.5s (`GameRenderer.setZoneAtmosphere`):
1. **The Sunken Cloister (Sanctuary):** Cool cobalt-indigo moonlight (`#8fb5ff`) balanced by two warm sanctuary braziers (`#ffa042`). Feels quiet, sacred, and safe.
2. **The Verdigris Nave (West):** Submerged cyan-teal fog (`#0c1e24`) and reflective copper-green flood basins (`#17484f`). Feels damp, resonant, and eerie.
3. **The Glaze Ossuary (East):** Scorched terracotta-umber fog (`#1f1210`) with aggressive furnace-orange lights (`#ff7b38`). Feels claustrophobic and overheated.
4. **The Crown Crucible (North Boss Arena):** Obsidian-plum fog (`#1b1014`) framed by molten gold rivers (`#ff9d2e`) and monumental broken pillars. Feels climactic and sacred.

---

## 3. Lighting, Camera & Post-Processing Standards

- **Camera Rig (`src/engine/renderer.js`):**
  - Perspective FOV `42°` (minimizes fisheye distortion while preserving sculptural height on columns and arches).
  - Offset `(5.2, 20.5, 17.5)` — slightly rotated off cardinal south so walls expose two lit faces and pillars cast dramatic diagonal shadows.
  - Movement vectors (`moveForward`, `moveRight`) are projected onto XZ from the camera offset so `W/A/S/D` always maps strictly to screen-up/left/down/right.
  - Mouse lookahead clamped to `±2.4` world units for natural combat framing without motion sickness.
- **Selective Bloom (`UnrealBloomPass`):**
  - `strength: 0.52`, `radius: 0.45`, `threshold: 0.72` with `ACESFilmicToneMapping` (`exposure: 1.12`).
  - **Rule:** Normal lit geometry (floors, walls, porcelain skin) must stay below luminance `0.72` so it stays razor-sharp. Only emissive gameplay signifiers (gold slash arcs, Arcane Bolts, Resonance Crystals, braziers, boss furnace core, sky beams) exceed the threshold and bloom!
- **Shadow Maps:** `2048×2048 PCFSoftShadowMap` directional light whose shadow frustum tracks the player every frame (`±34` units) so shadows stay crisp regardless of map size.

---

## 4. Procedural Texture Guidelines (`src/engine/textures.js`)

To remain lightweight and stylistically cohesive, textures are synthesized on 256×256 `<canvas>` surfaces with:
1. **Deterministic seeded PRNG noise** (never `Math.random()` inside texture builders) so tile seams look consistent across sessions.
2. **Hand-beveled grout/mortar lines** (3px light bevel on top/left, 3px dark bevel on bottom/right) for painterly readability at isometric height.
3. **Kintsugi Gold Cracks** drawn with subtle canvas glow (`shadowBlur: 4`) over tileable stone and porcelain surfaces.
4. **Majolica Diamond Inlays** on alternating tiles to reinforce the ceramic monastery identity.

When adding future zones (e.g., *The Salt Viaduct* in Act II), add matching `floorSalt` / `wallSalt` builders in `src/engine/textures.js` following the exact same bevel + noise + gold-seam recipe.

---

## 5. Character & Enemy Silhouette Language

In an isometric ARPG, players read silhouettes in `<150ms`. Every actor must be distinguishable without looking at its nameplate:

- **Vesper (Player):** Tall, narrow silhouette (`h ≈ 2.1`), dark midnight cloak contrasting with a bright white porcelain mask, bright horizontal gold visor, left-hip ember-lantern, and oversized gold-veined crescent blade.
- **Cracked Husk:** Hunched ivory cylinder + jagged dodecahedron head + heavy dark-bronze club. Slow, readable horizontal swing.
- **Censer Acolyte:** Floating tapered teal robe hovering `0.25u` off the ground with a spinning glowing censer orb on its right side. Signals ranged caster instantly.
- **Kiln Skitterer:** Low, wide terracotta sphere (`h ≈ 1.0`) with four splayed bronze legs and glowing rear furnace core. Signals fast lunging flanker.
- **Reliquary Sentinel (Elite):** Broad bronze armor, wide ivory shoulder pauldrons, floating golden halo-crown, and tall glowing halberd (`h ≈ 2.55`).
- **Saint Cassian (Boss):** Monumental (`h ≈ 4.6`) bell-skirted colossus with glowing furnace ribcage, twin bell pauldrons, gilded mitre crown, rotating golden halo, and long furnace glaive. In Phase II, his furnace emissive intensity doubles and porcelain cracks glow ember-red.

### Combat Telegraph Standard
- **Never deal surprise damage.** Every enemy attack must project a ground-plane telegraph (`spawnTelegraphCone` or `spawnTelegraphCircle`) for at least `0.48s` before damage lands.
- Red (`#ff3b47`) = physical cleave / lethal charge; Amber (`#e87b35`) = heat/molten slam; Cyan (`#45d6c5`) = ranged aether cast; Gold (`#ffe48f`) = bell resonance shockwave.

---

## 6. UI & Typography

- **Fonts:** Classical serif (`Palatino Linotype / Book Antiqua / Georgia`) for titles, speaker names, zone banners, and floating damage numbers; clean humanist sans-serif (`Segoe UI / system-ui`) for crisp HUD metrics and controls hints.
- **HUD Framing:** Thin 1px translucent gold borders (`rgba(245, 185, 66, 0.42)`), deep midnight glass backdrops, and Diablo-style glass liquid orbs (Crimson Vitality on left, Cerulean-Verdigris Aether on right).
- **Zero Clutter During Exploration:** Boss bar and interaction prompt stay hidden until contextually relevant; zone banners auto-fade after 3.2 seconds.

---

## 7. Procedural Audio Direction (`src/engine/audio.js`)

Sound reinforces the monastery-foundry identity through **three sonic pillars**:
1. **Zone-Adaptive Cathedral Drone:** A low-pass filtered open fifth (`A2` Cloister, `G2` Drowned Nave, `B2` Scorched Ossuary, `E2` Crown Crucible) that shifts pitch smoothly (`setTargetAtTime`) as you cross architectural thresholds.
2. **Ceramic & Metallic Tactility:** Hits layer a low body thud (`185→48Hz`) with a high porcelain clink (`1480→640Hz`). Deaths and urns trigger high-pass shatter noise + triplet glass/ceramic pings.
3. **Inharmonic Bronze Bells:** Resonance Bells, Crystal Switches, Level-Ups, and Cassian's Bell-Toll Nova use classic bell partial ratios (`1.0, 2.0, 2.756, 4.07`) with staggered exponential decays.
