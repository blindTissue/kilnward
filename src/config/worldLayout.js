/**
 * KILNWARD — Declarative World Layout (Full 4-Act Vertical Pilgrimage)
 *   Act I  (z: +52..-72):   Sunken Cloister, Crossroads, Verdigris Nave, Glaze Ossuary, Crown Crucible
 *   Act II (z: -74..-152):  Salt Viaduct Tollbooth, Counterweight Span, Twin Censer Arena
 *   Act III(z: -152..-230): Cobalt Cistern Entry, Mosaic Mirror Scriptorium, Orrery Rotunda
 *   Act IV (z: -230..-302): Dawn Processional, Summit Belfry of Unfired Ash
 */

export const WORLD_LAYOUT = {
  playerSpawn: { x: 0, z: 43 },

  zones: [
    { id: 'cloister', minX: -18, maxX: 18, minZ: 17, maxZ: 54 },
    { id: 'crossroads', minX: -16, maxX: 16, minZ: -15, maxZ: 17 },
    { id: 'west_nave', minX: -66, maxX: -16, minZ: -20, maxZ: 20 },
    { id: 'east_ossuary', minX: 16, maxX: 66, minZ: -20, maxZ: 20 },
    { id: 'crucible', minX: -26, maxX: 26, minZ: -74, maxZ: -15 },
    { id: 'salt_viaduct', minX: -30, maxX: 30, minZ: -153, maxZ: -74 },
    { id: 'cobalt_cisterns', minX: -32, maxX: 32, minZ: -231, maxZ: -153 },
    { id: 'dawn_belfry', minX: -32, maxX: 32, minZ: -306, maxZ: -231 },
  ],

  floors: [
    // === ACT I ===
    { x: 0, z: 36, w: 32, d: 32, style: 'slate' },
    { x: 0, z: 17, w: 10, d: 6, style: 'gold_runner' },
    { x: 0, z: 0, w: 32, d: 28, style: 'slate' },
    { x: -25.5, z: 0, w: 19, d: 10, style: 'verdigris' },
    { x: -50, z: 0, w: 28, d: 36, style: 'verdigris' },
    { x: 25.5, z: 0, w: 19, d: 14, style: 'terracotta' },
    { x: 50, z: 0, w: 28, d: 36, style: 'terracotta' },
    { x: 0, z: -21, w: 12, d: 14, style: 'gold_runner' },
    { x: 0, z: -50, w: 48, d: 44, style: 'crucible' },

    // === ACT II: THE SALT VIADUCT ===
    { x: 0, z: -74, w: 10, d: 6, style: 'gold_runner' },
    { x: 0, z: -86, w: 32, d: 20, style: 'salt' },
    { x: 0, z: -110, w: 14, d: 28, style: 'salt' },
    { x: -14, z: -104, w: 16, d: 10, style: 'salt' },
    { x: 0, z: -138, w: 44, d: 28, style: 'salt' },

    // === ACT III: THE COBALT CISTERNS ===
    { x: 0, z: -163, w: 32, d: 22, style: 'cistern' },
    { x: 0, z: -188, w: 48, d: 28, style: 'cistern' },
    { x: 0, z: -216, w: 46, d: 28, style: 'cistern' },

    // === ACT IV: THE BELFRY OF UNFIRED ASH ===
    { x: 0, z: -242, w: 18, d: 24, style: 'dawn' },
    { x: 0, z: -278, w: 50, d: 48, style: 'dawn' },
  ],

  basins: [
    { x: -25.5, z: -11, w: 19, d: 12, kind: 'water' },
    { x: -25.5, z: 11, w: 19, d: 12, kind: 'water' },
    { x: -50, z: -19.5, w: 32, d: 4, kind: 'water' },
    { x: -50, z: 19.5, w: 32, d: 4, kind: 'water' },
    { x: -12, z: -21, w: 12, d: 14, kind: 'lava' },
    { x: 12, z: -21, w: 12, d: 14, kind: 'lava' },
    { x: 0, z: -50, w: 58, d: 54, kind: 'lava', y: -0.65 },
    { x: 0, z: -112, w: 68, d: 52, kind: 'abyss', y: -1.4 },
    { x: 0, z: -192, w: 66, d: 86, kind: 'cistern_water', y: -0.55 },
    { x: 0, z: -268, w: 86, d: 86, kind: 'dawn_clouds', y: -1.6 },
  ],

  walls: [
    // --- ACT I: CLOISTER ---
    { x: 0, z: 53, w: 36, d: 2, h: 5.5, style: 'slate' },
    { x: -17, z: 36, w: 2, d: 34, h: 5.5, style: 'slate' },
    { x: 17, z: 36, w: 2, d: 34, h: 5.5, style: 'slate' },
    { x: -11, z: 20, w: 12, d: 2, h: 6.0, style: 'slate' },
    { x: 11, z: 20, w: 12, d: 2, h: 6.0, style: 'slate' },
    { x: -6, z: 17, w: 2, d: 6, h: 5.5, style: 'slate' },
    { x: 6, z: 17, w: 2, d: 6, h: 5.5, style: 'slate' },

    // --- ACT I: CROSSROADS ---
    { x: -11, z: 14, w: 12, d: 2, h: 5.5, style: 'slate' },
    { x: 11, z: 14, w: 12, d: 2, h: 5.5, style: 'slate' },
    { x: -11, z: -14, w: 12, d: 2, h: 6.5, style: 'slate' },
    { x: 11, z: -14, w: 12, d: 2, h: 6.5, style: 'slate' },
    { x: -16, z: -9.5, w: 2, d: 9, h: 5.5, style: 'verdigris' },
    { x: -16, z: 9.5, w: 2, d: 9, h: 5.5, style: 'verdigris' },
    { x: 16, z: -9.5, w: 2, d: 9, h: 5.5, style: 'terracotta' },
    { x: 16, z: 9.5, w: 2, d: 9, h: 5.5, style: 'terracotta' },

    // --- ACT I: WEST NAVE ---
    { x: -25.5, z: -5.6, w: 19, d: 1.2, h: 1.25, style: 'balustrade' },
    { x: -25.5, z: 5.6, w: 19, d: 1.2, h: 1.25, style: 'balustrade' },
    { x: -65, z: 0, w: 2, d: 38, h: 6.0, style: 'verdigris' },
    { x: -50, z: -19, w: 32, d: 2, h: 5.5, style: 'verdigris' },
    { x: -50, z: 19, w: 32, d: 2, h: 5.5, style: 'verdigris' },
    { x: -35.5, z: -12, w: 2, d: 14, h: 5.5, style: 'verdigris' },
    { x: -35.5, z: 12, w: 2, d: 14, h: 5.5, style: 'verdigris' },

    // --- ACT I: EAST OSSUARY ---
    { x: 25.5, z: -7.5, w: 19, d: 2, h: 5.2, style: 'terracotta' },
    { x: 25.5, z: 7.5, w: 19, d: 2, h: 5.2, style: 'terracotta' },
    { x: 65, z: 0, w: 2, d: 38, h: 6.0, style: 'terracotta' },
    { x: 50, z: -19, w: 32, d: 2, h: 5.5, style: 'terracotta' },
    { x: 50, z: 19, w: 32, d: 2, h: 5.5, style: 'terracotta' },
    { x: 35.5, z: -12, w: 2, d: 14, h: 5.5, style: 'terracotta' },
    { x: 35.5, z: 12, w: 2, d: 14, h: 5.5, style: 'terracotta' },

    // --- ACT I: CROWN CRUCIBLE (North exit portal x[-5..5] at z=-73) ---
    { x: -6.6, z: -21, w: 1.2, d: 14, h: 1.4, style: 'balustrade' },
    { x: 6.6, z: -21, w: 1.2, d: 14, h: 1.4, style: 'balustrade' },
    { x: -15, z: -73, w: 20, d: 2, h: 7.0, style: 'crucible' },
    { x: 15, z: -73, w: 20, d: 2, h: 7.0, style: 'crucible' },
    { x: -25, z: -50, w: 2, d: 46, h: 6.5, style: 'crucible' },
    { x: 25, z: -50, w: 2, d: 46, h: 6.5, style: 'crucible' },
    { x: -15.5, z: -28, w: 19, d: 2, h: 6.5, style: 'crucible' },
    { x: 15.5, z: -28, w: 19, d: 2, h: 6.5, style: 'crucible' },

    // === ACT II: THE SALT VIADUCT ===
    { x: -11, z: -76, w: 12, d: 2, h: 5.6, style: 'salt' },
    { x: 11, z: -76, w: 12, d: 2, h: 5.6, style: 'salt' },
    { x: -17, z: -86, w: 2, d: 22, h: 5.6, style: 'salt' },
    { x: 17, z: -86, w: 2, d: 22, h: 5.6, style: 'salt' },
    { x: -12, z: -96, w: 10, d: 2, h: 5.6, style: 'salt' },
    { x: 12, z: -96, w: 10, d: 2, h: 5.6, style: 'salt' },
    // Causeway low balustrades (projectiles & Tether pass over!)
    { x: 7.6, z: -110, w: 1.2, d: 28, h: 1.35, style: 'balustrade' },
    { x: -7.6, z: -97.5, w: 1.2, d: 3, h: 1.35, style: 'balustrade' },
    { x: -7.6, z: -116.5, w: 1.2, d: 15, h: 1.35, style: 'balustrade' },
    // Western Spur railings
    { x: -14.5, z: -98.5, w: 15, d: 1.2, h: 1.35, style: 'balustrade' },
    { x: -14.5, z: -109.5, w: 15, d: 1.2, h: 1.35, style: 'balustrade' },
    { x: -22.5, z: -104, w: 1.2, d: 12, h: 1.35, style: 'balustrade' },
    // Twin Arch-Censer Arena
    { x: -14.5, z: -124, w: 15, d: 2, h: 6.2, style: 'salt' },
    { x: 14.5, z: -124, w: 15, d: 2, h: 6.2, style: 'salt' },
    { x: -23, z: -138, w: 2, d: 30, h: 6.2, style: 'salt' },
    { x: 23, z: -138, w: 2, d: 30, h: 6.2, style: 'salt' },
    { x: -14.5, z: -152, w: 15, d: 2, h: 6.2, style: 'salt' },
    { x: 14.5, z: -152, w: 15, d: 2, h: 6.2, style: 'salt' },

    // === ACT III: THE COBALT CISTERNS ===
    { x: -17, z: -163, w: 2, d: 22, h: 5.8, style: 'cistern' },
    { x: 17, z: -163, w: 2, d: 22, h: 5.8, style: 'cistern' },
    { x: -12, z: -174, w: 12, d: 2, h: 5.8, style: 'cistern' },
    { x: 12, z: -174, w: 12, d: 2, h: 5.8, style: 'cistern' },
    { x: -25, z: -188, w: 2, d: 30, h: 6.0, style: 'cistern' },
    { x: 25, z: -188, w: 2, d: 30, h: 6.0, style: 'cistern' },
    { x: -20, z: -174, w: 10, d: 2, h: 5.8, style: 'cistern' },
    { x: 20, z: -174, w: 10, d: 2, h: 5.8, style: 'cistern' },
    { x: -15, z: -202, w: 20, d: 2, h: 6.2, style: 'cistern' },
    { x: 15, z: -202, w: 20, d: 2, h: 6.2, style: 'cistern' },
    { x: -24, z: -216, w: 2, d: 30, h: 6.5, style: 'cistern' },
    { x: 24, z: -216, w: 2, d: 30, h: 6.5, style: 'cistern' },
    { x: -15, z: -230, w: 20, d: 2, h: 6.5, style: 'cistern' },
    { x: 15, z: -230, w: 20, d: 2, h: 6.5, style: 'cistern' },

    // === ACT IV: THE BELFRY OF UNFIRED ASH ===
    { x: -9.6, z: -242, w: 1.2, d: 24, h: 1.4, style: 'balustrade' },
    { x: 9.6, z: -242, w: 1.2, d: 24, h: 1.4, style: 'balustrade' },
    { x: -17, z: -254, w: 18, d: 1.8, h: 2.2, style: 'dawn' },
    { x: 17, z: -254, w: 18, d: 1.8, h: 2.2, style: 'dawn' },
    { x: -25.8, z: -278, w: 1.8, d: 50, h: 2.2, style: 'dawn' },
    { x: 25.8, z: -278, w: 1.8, d: 50, h: 2.2, style: 'dawn' },
    { x: 0, z: -302.8, w: 53, d: 1.8, h: 2.6, style: 'dawn' },
  ],

  pillars: [
    // Act I
    { x: -10, z: 45, r: 1.0, h: 6.5, style: 'slate' },
    { x: 10, z: 45, r: 1.0, h: 6.5, style: 'slate' },
    { x: -10, z: 27, r: 1.0, h: 6.5, style: 'slate' },
    { x: 10, z: 27, r: 1.0, h: 6.5, style: 'slate' },
    { x: -11, z: -9, r: 1.0, h: 6.5, style: 'slate' },
    { x: 11, z: -9, r: 1.0, h: 6.5, style: 'slate' },
    { x: -11, z: 9, r: 1.0, h: 6.5, style: 'slate' },
    { x: 11, z: 9, r: 1.0, h: 6.5, style: 'slate' },
    { x: -43, z: -9, r: 1.0, h: 6.8, style: 'verdigris' },
    { x: -43, z: 9, r: 1.0, h: 6.8, style: 'verdigris' },
    { x: -56, z: -10, r: 1.0, h: 6.8, style: 'verdigris' },
    { x: -56, z: 10, r: 1.0, h: 6.8, style: 'verdigris' },
    { x: 43, z: -9, r: 1.05, h: 6.2, style: 'terracotta' },
    { x: 43, z: 9, r: 1.05, h: 6.2, style: 'terracotta' },
    { x: 56, z: -10, r: 1.05, h: 6.2, style: 'terracotta' },
    { x: 56, z: 10, r: 1.05, h: 6.2, style: 'terracotta' },
    { x: -15, z: -40, r: 1.25, h: 7.5, style: 'crucible' },
    { x: 15, z: -40, r: 1.25, h: 7.5, style: 'crucible' },
    { x: -15, z: -60, r: 1.25, h: 7.5, style: 'crucible' },
    { x: 15, z: -60, r: 1.25, h: 7.5, style: 'crucible' },
    // Act II
    { x: -11, z: -86, r: 1.0, h: 7.0, style: 'salt' },
    { x: 11, z: -86, r: 1.0, h: 7.0, style: 'salt' },
    { x: -14, z: -134, r: 1.15, h: 7.4, style: 'salt' },
    { x: 14, z: -134, r: 1.15, h: 7.4, style: 'salt' },
    { x: -14, z: -144, r: 1.15, h: 7.4, style: 'salt' },
    { x: 14, z: -144, r: 1.15, h: 7.4, style: 'salt' },
    // Act III
    { x: -11, z: -163, r: 1.05, h: 7.2, style: 'cistern' },
    { x: 11, z: -163, r: 1.05, h: 7.2, style: 'cistern' },
    { x: -19, z: -180, r: 1.0, h: 7.2, style: 'cistern' },
    { x: 19, z: -180, r: 1.0, h: 7.2, style: 'cistern' },
    { x: -16, z: -216, r: 1.2, h: 7.6, style: 'cistern' },
    { x: 16, z: -216, r: 1.2, h: 7.6, style: 'cistern' },
    // Act IV
    { x: -7, z: -236, r: 0.9, h: 8.0, style: 'dawn' },
    { x: 7, z: -236, r: 0.9, h: 8.0, style: 'dawn' },
    { x: -7, z: -248, r: 0.9, h: 8.0, style: 'dawn' },
    { x: 7, z: -248, r: 0.9, h: 8.0, style: 'dawn' },
    { x: -18, z: -265, r: 1.3, h: 9.2, style: 'dawn' },
    { x: 18, z: -265, r: 1.3, h: 9.2, style: 'dawn' },
    { x: -18, z: -291, r: 1.3, h: 9.2, style: 'dawn' },
    { x: 18, z: -291, r: 1.3, h: 9.2, style: 'dawn' },
  ],

  fountain: { x: 0, z: 32, r: 2.4 },

  braziers: [
    // Act I (selective hero point lights — emissive bloom handles visual glow on every brazier!)
    { x: -5, z: 40.5, light: true, color: 0xffa042 },
    { x: 5, z: 40.5, light: false, color: 0xffa042 },
    { x: -4.8, z: 21.5, light: false },
    { x: 4.8, z: 21.5, light: false },
    { x: -6, z: -11.5, light: true, color: 0xffb347 },
    { x: 6, z: -11.5, light: false },
    { x: -20, z: -4.2, light: false, color: 0x45d6c5 },
    { x: -32, z: 4.2, light: false, color: 0x45d6c5 },
    { x: -53, z: -4, light: true, color: 0x45d6c5 },
    { x: -53, z: 4, light: false, color: 0x45d6c5 },
    { x: 22, z: -5.5, light: false, color: 0xff7b38 },
    { x: 46, z: -5, light: true, color: 0xff7b38 },
    { x: 55, z: 5, light: false, color: 0xff7b38 },
    { x: -4.8, z: -24, light: false, color: 0xff9d3b },
    { x: 4.8, z: -24, light: false, color: 0xff9d3b },
    { x: -18, z: -50, light: true, color: 0xff8a30 },
    { x: 18, z: -50, light: false, color: 0xff8a30 },
    { x: 0, z: -68, light: false, color: 0xf5b942 },
    // Act II
    { x: -5, z: -82, light: true, color: 0x8be4ff },
    { x: 5, z: -82, light: false, color: 0x8be4ff },
    { x: -5, z: -110, light: false, color: 0x8be4ff },
    { x: 5, z: -110, light: false, color: 0x8be4ff },
    { x: -16, z: -138, light: true, color: 0xf5b942 },
    { x: 16, z: -138, light: false, color: 0x8be4ff },
    // Act III
    { x: -5, z: -160, light: false, color: 0x52e0cf },
    { x: 5, z: -160, light: false, color: 0x52e0cf },
    { x: -18, z: -188, light: true, color: 0xffe48f },
    { x: 18, z: -188, light: false, color: 0x52e0cf },
    { x: 0, z: -216, light: false, color: 0xffe48f },
    // Act IV
    { x: -6, z: -242, light: false, color: 0xffd27d },
    { x: 6, z: -242, light: false, color: 0xffd27d },
    { x: -18, z: -278, light: true, color: 0xffd27d },
    { x: 18, z: -278, light: false, color: 0xffd27d },
    { x: 0, z: -296, light: false, color: 0xffe48f },
  ],

  gates: {
    // Act I
    westBarrier: { x: -35.5, z: 0, w: 1.5, d: 10, h: 4.6, kind: 'verdigris_rune', hint: 'Shoot the cyan Resonance Crystal in the south water with Arcane Bolt [RMB / E]' },
    eastSeal: { x: 35.5, z: 0, w: 1.5, d: 10, h: 4.6, kind: 'ember_ward', startsOpen: true, hint: 'Defeat both Ossuary Ambush waves to unseal' },
    sanctumGate: { x: 0, z: -14.2, w: 10, d: 1.8, h: 6.4, kind: 'sanctum', hint: 'Ring both Resonance Bells (far West & far East wings) to unseal' },
    bossMist: { x: 0, z: -28.2, w: 12, d: 1.4, h: 5.5, kind: 'boss_mist', startsOpen: true },
    // Act I -> Act II
    viaductGate: { x: 0, z: -73, w: 10, d: 1.8, h: 6.4, kind: 'sanctum_gold', hint: 'Defeat Saint Cassian & commune with his Echo to ascend to Act II' },
    // Act II
    viaductBridgeGate: { x: 0, z: -124, w: 14, d: 1.6, h: 5.0, kind: 'verdigris_rune', hint: 'Hit both flanking Counterweight Bells with Arcane Bolt [RMB / E] or Tether [C]' },
    act2BossMist: { x: 0, z: -124.2, w: 14, d: 1.4, h: 5.5, kind: 'boss_mist', startsOpen: true },
    cisternGate: { x: 0, z: -152, w: 14, d: 1.8, h: 6.2, kind: 'sanctum_gold', hint: 'Defeat the Twin Arch-Censers (Vael & Soren) to enter Act III' },
    // Act III
    libraryGate: { x: 0, z: -202, w: 10, d: 1.8, h: 6.2, kind: 'verdigris_rune', hint: 'Rotate the 3 Bronze Mirrors [F] to guide the golden sun-beam to the receptor' },
    act3BossMist: { x: 0, z: -202.4, w: 10, d: 1.4, h: 5.5, kind: 'boss_mist', startsOpen: true },
    belfryGate: { x: 0, z: -230, w: 10, d: 1.8, h: 6.4, kind: 'sanctum_gold', hint: 'Defeat Archivist Pelagius to ascend to Act IV: The Dawn Belfry' },
    // Act IV
    act4BossMist: { x: 0, z: -254.2, w: 16, d: 1.4, h: 5.8, kind: 'boss_mist', startsOpen: true },
  },

  crystalSwitch: {
    id: 'west_crystal',
    x: -29.5,
    z: 10.5,
    targetGate: 'westBarrier',
    conduitEnd: { x: -35.5, z: 2.5 },
  },

  counterweightBells: [
    { id: 'cw_west', x: -14.5, z: -115, conduitEnd: { x: -4, z: -124 } },
    { id: 'cw_east', x: 14.5, z: -115, conduitEnd: { x: 4, z: -124 } },
  ],

  mirrorPuzzle: {
    emitter: { x: 0, z: -176.5, dir: 0 },
    receptor: { x: 0, z: -195 },
    mirrors: [
      { id: 'm1', x: 0, z: -184, initialDir: 1, solutionDir: 3 },
      { id: 'm2', x: -14, z: -184, initialDir: 2, solutionDir: 0 },
      { id: 'm3', x: -14, z: -195, initialDir: 0, solutionDir: 1 },
    ],
  },

  npcs: [
    { id: 'brother_oren', name: 'Brother Oren', x: -6.2, z: 38.5, style: 'oren' },
    { id: 'sister_maren', name: 'Sister Maren', x: -6.5, z: -85, style: 'maren' },
  ],

  shrines: [
    { id: 'cloister_shrine', act: 1, name: 'Cloister Kiln Shrine', x: 6.5, z: 38.5, respawn: { x: 4.2, z: 40.5 } },
    { id: 'crucible_shrine', act: 1, name: 'Sanctum Rest Brazier', x: -3.6, z: -21.5, respawn: { x: 0, z: -21.5 } },
    { id: 'viaduct_shrine', act: 2, name: 'Salt Viaduct Shrine', x: 6.5, z: -85, respawn: { x: 3.5, z: -84 } },
    { id: 'cistern_shrine', act: 3, name: 'Cobalt Cistern Shrine', x: 6.5, z: -162, respawn: { x: 3.5, z: -162 } },
    { id: 'dawn_shrine', act: 4, name: 'Dawn Processional Shrine', x: 6.2, z: -242, respawn: { x: 0, z: -242 } },
  ],

  steles: [
    { id: 'stele_cloister', x: -12.5, z: 31.5 },
    { id: 'stele_west', x: -45, z: 14.5 },
    { id: 'stele_east', x: 45, z: 14.5 },
    { id: 'stele_crucible', x: 3.8, z: -21.5 },
    { id: 'stele_viaduct', x: -12.5, z: -91 },
    { id: 'stele_cisterns', x: -9.5, z: -162 },
    { id: 'stele_dawn', x: -6.2, z: -242 },
  ],

  bells: [
    { id: 'west_bell', side: 'west', name: 'West Resonance Bell', x: -59, z: 0, color: 0x45d6c5 },
    { id: 'east_bell', side: 'east', name: 'East Resonance Bell', x: 59, z: 0, color: 0xffa63d },
  ],

  weaponPedestal: {
    id: 'bell_hammer_pedestal',
    x: -7.5,
    z: -168,
    label: 'Claim Resonance Bell-Hammer [Swap Stance with V]',
  },

  chests: [
    {
      id: 'west_chest',
      x: -50,
      z: -14.5,
      spellUnlock: 'nova',
      relicId: 'verdigris_signet',
      gold: 35,
      label: 'Reliquary of the Solar Kiln',
    },
    {
      id: 'east_chest',
      x: 50,
      z: -14.5,
      spellUnlock: 'aegis',
      relicId: 'keepers_clapper',
      gold: 40,
      lockedByGauntlet: true,
      label: 'Reliquary of the Gilded Aegis',
    },
    {
      id: 'viaduct_chest',
      x: -19,
      z: -104,
      spellUnlock: 'tether',
      relicId: 'salt_cloak',
      gold: 65,
      label: 'Reliquary of the Verdigris Tether',
    },
    {
      id: 'cistern_chest',
      x: 19,
      z: -190,
      spellUnlock: null,
      relicId: 'archivist_astrolabe',
      gold: 85,
      label: "Archivist's Vault Coffer",
    },
  ],

  urns: [
    { x: -13, z: 48 }, { x: -11.5, z: 49 }, { x: 13, z: 48 }, { x: 12, z: 24 },
    { x: -13, z: 11 }, { x: 13, z: 11 }, { x: -13, z: -11 }, { x: 13, z: -11 },
    { x: -39, z: -14 }, { x: -40.5, z: -15 }, { x: -61, z: -13 }, { x: -61, z: 13 }, { x: -54, z: 15 },
    { x: 22, z: 5 }, { x: 29, z: -5 }, { x: 39, z: -14 }, { x: 61, z: -12 }, { x: 61, z: 12 }, { x: 55, z: 15 },
    { x: -4.2, z: -17 }, { x: 4.2, z: -17 },
    { x: -13, z: -80 }, { x: 13, z: -80 }, { x: -4.5, z: -101 }, { x: 4.5, z: -119 }, { x: -16, z: -101 },
    { x: -13, z: -157 }, { x: 13, z: -157 }, { x: 18, z: -179 }, { x: -19, z: -197 }, { x: 19, z: -197 },
    { x: -6.5, z: -234 }, { x: 6.5, z: -234 }, { x: -6.5, z: -250 }, { x: 6.5, z: -250 },
  ],

  enemies: [
    { type: 'husk', x: -5, z: 3.5, zone: 'crossroads' },
    { type: 'husk', x: 5, z: 2.5, zone: 'crossroads' },
    { type: 'acolyte', x: 0, z: -6.5, zone: 'crossroads' },
    { type: 'husk', x: -24, z: 0, zone: 'west_nave' },
    { type: 'husk', x: -41, z: -4, zone: 'west_nave' },
    { type: 'acolyte', x: -46, z: 6.5, zone: 'west_nave' },
    { type: 'acolyte', x: -53, z: -7.5, zone: 'west_nave' },
    { type: 'reliquary_guard', x: -54, z: 0.5, zone: 'west_nave' },
    { type: 'skitterer', x: 24, z: -2.2, zone: 'east_ossuary' },
    { type: 'skitterer', x: 28, z: 2.6, zone: 'east_ossuary' },
    { type: 'husk', x: 31, z: -1.0, zone: 'east_ossuary' },
    // Act II
    { type: 'gale_harrier', x: -3, z: -103, zone: 'salt_viaduct' },
    { type: 'gale_harrier', x: 4, z: -112, zone: 'salt_viaduct' },
    { type: 'salt_halberdier', x: 0, z: -117, zone: 'salt_viaduct' },
    { type: 'skitterer', x: -14, z: -104, zone: 'salt_viaduct' },
    // Act III
    { type: 'mosaic_construct', x: -7, z: -181, zone: 'cobalt_cisterns' },
    { type: 'mosaic_construct', x: 10, z: -186, zone: 'cobalt_cisterns' },
    { type: 'salt_halberdier', x: 14, z: -192, zone: 'cobalt_cisterns' },
    { type: 'gale_harrier', x: -9, z: -195, zone: 'cobalt_cisterns' },
    // Act IV
    { type: 'salt_halberdier', x: -3.5, z: -247, zone: 'dawn_belfry' },
    { type: 'gale_harrier', x: 3.5, z: -248, zone: 'dawn_belfry' },
  ],

  eastGauntlet: {
    triggerX: 40.5,
    triggerMinZ: -14,
    triggerMaxZ: 14,
    waves: [
      [
        { type: 'skitterer', x: 49, z: -8 },
        { type: 'skitterer', x: 52, z: 8 },
        { type: 'acolyte', x: 58, z: 0 },
      ],
      [
        { type: 'reliquary_guard', x: 52, z: 0 },
        { type: 'acolyte', x: 57, z: -9 },
        { type: 'skitterer', x: 47, z: 9 },
      ],
    ],
    emberVents: [
      { x: 46, z: 0 },
      { x: 53, z: -6 },
      { x: 53, z: 6 },
    ],
  },

  boss: {
    x: 0,
    z: -54,
    triggerZ: -33.5,
    greatBellPos: { x: 0, z: -65 },
  },
  act2Boss: {
    vael: { x: -7, z: -141 },
    soren: { x: 7, z: -141 },
    triggerZ: -127.5,
  },
  act3Boss: {
    x: 0,
    z: -216,
    triggerZ: -205.5,
  },
  act4Boss: {
    x: 0,
    z: -282,
    triggerZ: -258.5,
    kilnHeartPos: { x: 0, z: -288 },
  },
};
