# KILNWARD — Continuation Roadmap

This roadmap outlines the recommended sequence of milestones for future agents expanding **KILNWARD** from the playable Act I demo into a complete multi-act Action-RPG.

---

## Completed Campaign (v1.0 — Full 4-Act Release)
- [x] **Act I — *The Sunken Kiln*:** 4 cathedral zones, Resonance Crystal puzzle, East Ossuary 2-wave ambush, Twin Resonance Bells, Saint Cassian multi-phase boss, Great First Bell, and Mended Echo.
- [x] **Act II — *The Salt Viaduct*:** Moonlit salt-brick aqueducts, Sister Maren NPC, Spell 4 (`Verdigris Tether [C]`), Counterweight Bell puzzle, Gale Harriers & Salt Halberdiers, and the synchronized dual boss **The Twin Arch-Censers (Vael & Soren)** with Kintsugi Resonance enrage.
- [x] **Act III — *The Cobalt Cisterns*:** Lapis-gold mosaic scriptoria, Weapon Stance Switching (**Crescent Claymore / Resonance Bell-Hammer `[V]`**), live-traced **Bronze Mirror Sun-Beam puzzle**, Mosaic Prisms, and **Archivist Pelagius, The Kiln-Orrery** (sweeper beams & scorched quadrants).
- [x] **Act IV — *The Belfry of Unfired Ash*:** Sunlit dawn sky-summit, 3-phase final boss **Arch-Prelate Aurelius, The Uncooled**, and **3 Canonical Endings** (*The Golden Seam*, *The Silent Ash*, and True Ending *The Eternal Choir*).
- [x] **Core QoL:** `localStorage` auto-saving at shrines, Shrine Fast Travel, Title Screen Chapter Select (Acts I–IV), scrolling player-centered minimap, and contextual locked-gate hints.

---

## Future Expansion Ideas (v1.1+)
1. **Gamepad Support:** Poll `navigator.getGamepads()` in `src/main.js` (Left Stick move, Right Stick aim, triggers for spells/tether).
2. **New Game+ ("Second Firing"):** Restart Act I keeping all unlocked weapons, spells, and relics against escalated enemy HP/damage and extra Golden Seam drops.
3. **Custom GLSL Shaders:** Upgrade water/cistern pools with animated caustics and add molten-crack Fresnel glow shaders to boss shells.
4. **Boss Rush Arena:** Optional shrine challenge pitting Vesper consecutively against Saint Cassian, Vael & Soren, Pelagius, and Aurelius.
