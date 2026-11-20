/**
 * KILNWARD — Game Data Registry (Full 4-Act Campaign — Rebalanced & Choice-Driven)
 */

export const DIFFICULTY_PRESETS = {
  pilgrim: {
    id: 'pilgrim',
    label: 'Pilgrim (Challenging)',
    enemyHpMult: 1.0,
    enemyDmgMult: 1.0,
    bossCdMult: 1.0,
  },
  overfired: {
    id: 'overfired',
    label: 'Over-Fired (Hardcore)',
    enemyHpMult: 1.3,
    enemyDmgMult: 1.38,
    bossCdMult: 0.82,
  },
};

export const PLAYER_BASE_STATS = {
  maxHp: 105,
  maxMp: 75,
  mpRegen: 4.2,        // Lower passive regen; weave melee hits (+5 MP each) to fuel spells!
  mpOnMeleeHit: 5,
  attack: 20,
  spellPower: 1.0,
  critChance: 0.12,
  moveSpeed: 9.0,
  dashSpeed: 23.0,
  dashDuration: 0.21,
  dashCooldown: 1.05,
  maxFlasks: 3,
  flaskHealRatio: 0.40,
};

export const XP_CURVE = [0, 110, 250, 440, 680, 980, 1360, 1800, 2300, 2850, 3500, 4200];

export const WEAPONS = {
  claymore: {
    id: 'claymore',
    name: 'Crescent Claymore',
    glyph: '⚔',
    dmgMult: 1.0,
    cdMult: 1.0,
    rangeBonus: 0,
    knockMult: 1.0,
    critBonus: 0.04,
    mpOnHit: 5,
    heavyPoise: false,
    desc: 'Swift 3-hit crescent arcs. Every hit restores +5 Aether to fuel spells.',
  },
  hammer: {
    id: 'hammer',
    name: 'Resonance Bell-Hammer',
    glyph: '⚒',
    dmgMult: 1.54,
    cdMult: 1.4,
    rangeBonus: 0.55,
    knockMult: 1.7,
    critBonus: 0.0,
    mpOnHit: 8,
    heavyPoise: true,
    desc: 'Heavy gilded bell-maul that shatters enemy poise and restores +8 Aether per hit.',
  },
  daggers: {
    id: 'daggers',
    name: 'Twin Kintsugi Daggers',
    glyph: '🗡',
    dmgMult: 0.68,
    cdMult: 0.6,
    rangeBonus: -0.35,
    knockMult: 0.45,
    critBonus: 0.24,
    mpOnHit: 4,
    heavyPoise: false,
    desc: 'Blistering twin porcelain blades (+24% Crit) built for high-tempo procs & rapid combos.',
  },
  glaive: {
    id: 'glaive',
    name: 'Verdigris Glaive',
    glyph: '🔱',
    dmgMult: 1.12,
    cdMult: 1.14,
    rangeBonus: 1.85,
    knockMult: 1.25,
    critBonus: 0.08,
    mpOnHit: 6,
    heavyPoise: false,
    desc: 'Long oxidized-bronze polearm with massive sweeping reach to cleave entire packs.',
  },
};

export const SPELLS = {
  bolt: {
    id: 'bolt',
    name: 'Arcane Bolt',
    mpCost: 16,
    cooldown: 0.56,
    baseDamage: 24,
    speed: 25,
    range: 30,
    unlockedByDefault: true,
    desc: 'Fires a shard of verdigris aether toward the cursor. Activates Crystals & Counterweight Bells.',
  },
  nova: {
    id: 'nova',
    name: 'Solar Kiln Nova',
    mpCost: 30,
    cooldown: 5.4,
    baseDamage: 48,
    radius: 6.4,
    unlockedByDefault: false,
    desc: 'Detonates molten Kintsugi light around Vesper, breaking enemy poise and burning nearby foes.',
  },
  aegis: {
    id: 'aegis',
    name: 'Kintsugi Aegis',
    mpCost: 34,
    cooldown: 11.0,
    duration: 3.8,
    damageReduction: 0.42,
    attackBonus: 0.25,
    unlockedByDefault: false,
    desc: 'Sheathes Vesper in gilded porcelain for 3.8s, cutting damage taken by 42% and boosting strikes by 25%.',
  },
  tether: {
    id: 'tether',
    name: 'Verdigris Tether',
    mpCost: 22,
    cooldown: 4.0,
    baseDamage: 36,
    range: 20,
    unlockedByDefault: false,
    desc: 'Casts a gilded chain toward your cursor—warping to strike enemies or ringing distant bells.',
  },
};

export const RELICS = {
  verdigris_signet: {
    id: 'verdigris_signet',
    name: 'Verdigris Signet',
    summary: '+12% Movement Speed · -18% Dash Cooldown',
    flavor: 'Cast from the bronze clapper of the drowned choir. Steps ring lighter on flooded stone.',
    apply(stats) {
      stats.moveSpeed *= 1.12;
      stats.dashCooldown *= 0.82;
    },
  },
  keepers_clapper: {
    id: 'keepers_clapper',
    name: "Bell-Keeper's Clapper",
    summary: '+22% Spell Power · +6 Attack',
    flavor: 'A heavy gold-veined tongue from an ossuary chime. Every strike answers with a ringing echo.',
    apply(stats) {
      stats.spellPower += 0.22;
      stats.attack += 6;
    },
  },
  // Act I Moral Reckoning Rewards (Mutually Exclusive!)
  cassian_forgiveness: {
    id: 'cassian_forgiveness',
    name: "Cassian's Forgiveness [Resonance]",
    summary: '+35 Max Vitality · +1 Ember Flask',
    flavor: 'You mended your fallen master’s glaze with patience. His calm steadies your hand.',
    apply(stats) {
      stats.maxHp += 35;
      stats.maxFlasks += 1;
    },
  },
  cassian_furnace_brand: {
    id: 'cassian_furnace_brand',
    name: "Cassian's Scorched Core [Cinder]",
    summary: '+16 Attack · +12% Crit Chance · -15 Max HP',
    flavor: 'You drank the furnace heat straight from Cassian’s shattered chest. Your blade burns cruelly.',
    apply(stats) {
      stats.attack += 16;
      stats.critChance += 0.12;
      stats.maxHp = Math.max(60, stats.maxHp - 15);
    },
  },
  salt_cloak: {
    id: 'salt_cloak',
    name: 'Salt-Woven Cloak',
    summary: '+10% Movement Speed · +20 Max Aether',
    flavor: 'Stitched from the banners of the cliff aqueduct. Wind parts cleanly around its hem.',
    apply(stats) {
      stats.moveSpeed *= 1.10;
      stats.maxMp += 20;
    },
  },
  // Act II Moral Reckoning Rewards (Mutually Exclusive!)
  maren_harmony: {
    id: 'maren_harmony',
    name: "Maren's Acoustic Compass [Resonance]",
    summary: '+28% Spell Power · +2.5 Aether/sec Regen',
    flavor: 'A vow to heal Orrery without repeating the High Glaziers’ cruelty.',
    apply(stats) {
      stats.spellPower += 0.28;
      stats.mpRegen += 2.5;
    },
  },
  storm_cracked_edge: {
    id: 'storm_cracked_edge',
    name: 'Storm-Cracked Vow [Cinder]',
    summary: '+18 Attack · -18% Dash Cooldown',
    flavor: 'An oath to tear the uncooling kiln down to its roots, no matter who burns.',
    apply(stats) {
      stats.attack += 18;
      stats.dashCooldown *= 0.82;
    },
  },
  archivist_astrolabe: {
    id: 'archivist_astrolabe',
    name: "Archivist's Astrolabe",
    summary: '+25% Spell Power · +2.5 Aether/sec Regen',
    flavor: 'Miniature brass rings aligned to the mosaic cisterns. Aether gathers like rain.',
    apply(stats) {
      stats.spellPower += 0.25;
      stats.mpRegen += 2.5;
    },
  },
  // Act III Revelation Rewards (Mutually Exclusive!)
  three_voices_chorus: {
    id: 'three_voices_chorus',
    name: 'Chorus of Three Menders [Resonance]',
    summary: '+45 Max Vitality · +25 Max Aether · +15% Spell Power',
    flavor: 'You accepted the three shattered Bell-Makers fused inside you. Their harmony makes you whole.',
    apply(stats) {
      stats.maxHp += 45;
      stats.maxMp += 25;
      stats.spellPower += 0.15;
    },
  },
  severed_porcelain: {
    id: 'severed_porcelain',
    name: 'Severed Porcelain [Cinder]',
    summary: '+24 Attack · +15% Crit Chance',
    flavor: 'You refused to be anyone’s relic. Your blade strikes with the fury of an unowned soul.',
    apply(stats) {
      stats.attack += 24;
      stats.critChance += 0.15;
    },
  },
};

export const FORGE_UPGRADES = [
  {
    id: 'edge_temper',
    name: 'Kintsugi Edge Temper',
    desc: 'Inlays fresh gold along your weapon (+8 Attack per tier).',
    maxTier: 5,
    costs: [45, 90, 145, 210, 290],
    bonusPerTier: { attack: 8 },
  },
  {
    id: 'porcelain_vessel',
    name: 'Reinforce Porcelain Vessel',
    desc: 'Thickens your fired shell (+24 Max Vitality per tier; +1 Flask at Tier 3).',
    maxTier: 5,
    costs: [40, 85, 135, 195, 270],
    bonusPerTier: { maxHp: 24 },
  },
  {
    id: 'ember_core',
    name: 'Stoke Ember Lantern',
    desc: 'Refines aether resonance (+18 Max Aether & +1.6 MP/sec regen per tier).',
    maxTier: 5,
    costs: [40, 80, 130, 185, 250],
    bonusPerTier: { maxMp: 18, mpRegen: 1.6 },
  },
];

// Significantly tougher, faster, deadlier enemies across all 4 Acts!
export const ENEMY_ARCHETYPES = {
  husk: {
    id: 'husk',
    name: 'Cracked Husk',
    maxHp: 92,
    speed: 4.8,
    damage: 21,
    attackRange: 2.6,
    aggroRange: 14.5,
    windup: 0.44,
    cooldown: 1.0,
    xp: 34,
    gold: [10, 17],
    radius: 0.72,
    height: 1.9,
    poise: 1,
  },
  acolyte: {
    id: 'acolyte',
    name: 'Censer Acolyte',
    maxHp: 78,
    speed: 4.2,
    damage: 22,
    attackRange: 13.5,
    preferredDist: 9.0,
    aggroRange: 16.5,
    windup: 0.62,
    cooldown: 1.65,
    projectileSpeed: 15.5,
    xp: 44,
    gold: [14, 22],
    radius: 0.68,
    height: 2.0,
    poise: 1,
  },
  skitterer: {
    id: 'skitterer',
    name: 'Kiln Skitterer',
    maxHp: 72,
    speed: 7.4,
    damage: 20,
    attackRange: 5.8,
    aggroRange: 15.5,
    windup: 0.38,
    cooldown: 1.1,
    lungeSpeed: 20.5,
    xp: 40,
    gold: [12, 20],
    radius: 0.65,
    height: 1.0,
    poise: 1,
  },
  reliquary_guard: {
    id: 'reliquary_guard',
    name: 'Reliquary Sentinel',
    maxHp: 265,
    speed: 4.0,
    damage: 34,
    attackRange: 3.6,
    aggroRange: 15.0,
    windup: 0.6,
    cooldown: 1.38,
    xp: 105,
    gold: [34, 52],
    radius: 0.98,
    height: 2.55,
    poise: 4,
    elite: true,
  },
  gale_harrier: {
    id: 'gale_harrier',
    name: 'Gale Harrier',
    maxHp: 148,
    speed: 5.8,
    damage: 27,
    attackRange: 15.0,
    preferredDist: 9.8,
    aggroRange: 17.5,
    windup: 0.54,
    cooldown: 1.48,
    projectileSpeed: 17.5,
    xp: 74,
    gold: [22, 36],
    radius: 0.75,
    height: 2.25,
    poise: 2,
  },
  salt_halberdier: {
    id: 'salt_halberdier',
    name: 'Salt Halberdier',
    maxHp: 320,
    speed: 4.5,
    damage: 38,
    attackRange: 3.9,
    aggroRange: 15.5,
    windup: 0.55,
    cooldown: 1.25,
    xp: 115,
    gold: [38, 56],
    radius: 0.95,
    height: 2.5,
    poise: 4,
    elite: true,
  },
  mosaic_construct: {
    id: 'mosaic_construct',
    name: 'Mosaic Prism',
    maxHp: 225,
    speed: 3.8,
    damage: 32,
    attackRange: 15.0,
    preferredDist: 8.5,
    aggroRange: 17.5,
    windup: 0.66,
    cooldown: 1.8,
    projectileSpeed: 16.5,
    xp: 105,
    gold: [32, 48],
    radius: 0.85,
    height: 2.3,
    poise: 3,
  },
};

export const LORE_ENTRIES = {
  stele_cloister: {
    id: 'stele_cloister',
    title: 'I. The Fracture of the First Kiln',
    location: 'Act I · The Sunken Cloister',
    kicker: 'CARVED MAJOLICA STELE',
    text:
      '"To mend a thing with gold is to honor that it broke." — First Canon of Orrery.\n\n' +
      'For three centuries the Bell-Makers fired departing souls into white porcelain. ' +
      'Then the First Kiln cracked beneath the apse—boiling the transepts and over-firing every vessel left inside.\n\n' +
      'Ring both Resonance Bells (West & East) to unseal the Sanctum Gate.',
  },
  stele_west: {
    id: 'stele_west',
    title: 'II. The Drowned Choir',
    location: 'Act I · The Verdigris Nave',
    kicker: 'CORRODED BRONZE PLAQUE',
    text:
      'When the cisterns burst to cool the leaking kiln, the West Transept flooded waist-deep in copper-green runoff. ' +
      'Strangely, the sluice locks were sealed from ABOVE—not broken by heat.\n\n' +
      'Strike the glowing Resonance Crystal across the channel with Arcane Bolt to lower the rune-barrier.',
  },
  stele_east: {
    id: 'stele_east',
    title: 'III. Cassian’s Apprentice',
    location: 'Act I · The Glaze Ossuary',
    kicker: 'SCORCHED KILN TABLET',
    text:
      'Saint Cassian braced the splitting furnace with his own body so the abbey might flee—screaming for his young apprentice to run up the viaduct stair.\n\n' +
      'The apprentice turned back anyway, and shattered against the closing floodgate. Cassian never saw whether the child survived.',
  },
  stele_crucible: {
    id: 'stele_crucible',
    title: 'IV. The Last Firing',
    location: 'Act I · Sanctum Approach',
    kicker: 'GILDED THRESHOLD INSCRIPTION',
    text:
      'Beyond this bridge kneels our Warden—blind with heat, mistaking every footstep for Arch-Prelate Aurelius.\n\n' +
      'When his shell breaks, Mender, you will face your first reckoning: cool his grief with gold, or drink his furnace to sharpen your own wrath.',
  },
  stele_viaduct: {
    id: 'stele_viaduct',
    title: 'V. The Salt Quarantine',
    location: 'Act II · The Salt Viaduct',
    kicker: 'WEATHERED SALT-BRICK EDICT',
    text:
      'Signed by Arch-Prelate Aurelius & Cartographer Maren:\n\n' +
      '"Flood the lower cloister. Seal the viaduct behind the Counterweight Bells. No soul may learn that Aurelius stepped into the First Kiln ALIVE—splitting the hearth to cheat death itself."',
  },
  stele_cisterns: {
    id: 'stele_cisterns',
    title: 'VI. Brother Oren’s Confession',
    location: 'Act III · The Cobalt Cisterns',
    kicker: 'LAPIS ARCHIVE LEDGER',
    text:
      'Record 409 — Private Ledger of Brother Oren:\n\n' +
      '"I found Cassian’s apprentice broken beneath the viaduct stair. I gathered porcelain from three drowned Bell-Makers, poured our final gold, and named the mended child Vesper. ' +
      'Forgive me, Vesper—you carry three dead voices because I could not bear to lose one."',
  },
  stele_dawn: {
    id: 'stele_dawn',
    title: 'VII. The Arch-Prelate’s Fear',
    location: 'Act IV · The Belfry of Unfired Ash',
    kicker: 'SUNLIT ALABASTER TABLET',
    text:
      'Aurelius did not enter the kiln for power. When his daughter died, the porcelain vessel holding her voice cracked—and her last words vanished forever.\n\n' +
      'Terrified that all love dissolves to ash, he swore Orrery would NEVER cool again.',
  },
};

export const DIALOGUES = {
  oren_intro: {
    speaker: 'Brother Oren',
    kicker: 'CRACKED BELL-KEEPER',
    body:
      'Ah—your gold seams still hold! Thank the Kiln… I stayed down here seven years hoping you would wake.\n\n' +
      'Don’t ask yet why you feel three heartbeats in your chest. Right now, Saint Cassian burns endlessly behind the northern Sanctum Gate. Every hour his furnace cracks wider.\n\n' +
      'Ring both Resonance Bells—in the Verdigris Nave (West) and Glaze Ossuary (East)—to unseal the gate. And Vesper… when Cassian falls, remember who you choose to be.',
    choices: [
      { label: 'Why did you stay down here for me, Oren?', next: 'oren_lore' },
      { label: 'I will ring both bells and face Cassian.', action: 'accept_quest' },
    ],
  },
  oren_lore: {
    speaker: 'Brother Oren',
    kicker: 'CRACKED BELL-KEEPER',
    body:
      'Because someone had to keep the Cloister Kiln warm until your lacquer cured. I’ve hidden too much from you already—the Cobalt Cisterns above hold the ledger of what I did.\n\n' +
      'Strike enemies with your blade to draw Aether back into your lantern, shatter amphorae for Gold Shards, and temper your shell at my shrine whenever you need.',
    choices: [
      { label: 'I’ll learn the truth at the summit. Opening the path north.', action: 'accept_quest' },
    ],
  },
  oren_progress: {
    speaker: 'Brother Oren',
    kicker: 'CRACKED BELL-KEEPER',
    body: (state) => {
      if (state.campaignCompleted) {
        return 'The dawn air reaches all the way down here now, Vesper. Whatever path you chose at the summit—thank you for letting Orrery finally breathe.';
      }
      if (state.cassianChoice === 'cinder') {
        return (
          '…I can smell Cassian’s furnace burning on your blade, Vesper. You didn’t mend him—you drank his fire.\n\n' +
          'I rebuilt you to heal what Aurelius broke, not to become another kiln. Go north up the Salt Viaduct if you must… I pray Maren reaches your heart before the summit.'
        );
      }
      if (state.cassianChoice === 'resonance') {
        return (
          'I felt Cassian’s bell ring clear and cool! You honored him, Vesper—just as his apprentice always would have.\n\n' +
          'The northern arch behind the Great Bell leads up to Act II: The Salt Viaduct. Find Sister Maren at the tollbooth, and watch yourself—she signed the flood edict.'
        );
      }
      const count = (state.westBell ? 1 : 0) + (state.eastBell ? 1 : 0);
      if (count === 2) {
        return 'Both Resonance Bells answered! The Sanctum Gate stands open. Temper your blade at the Kiln Shrine—Cassian will not go down gently.';
      }
      if (count === 1) {
        const missing = state.westBell ? 'the Glaze Ossuary (East)' : 'the Verdigris Nave (West)';
        return 'One bell already sings! Seek the second Resonance Bell in ' + missing + '. Remember: melee strikes restore Aether so stay aggressive and dash through telegraphs!';
      }
      return 'Head north into the Bell-Crossroads, then clear both the West Nave and East Ossuary to ring the Twin Resonance Bells.';
    },
    choices: [
      { label: 'Open Kiln Shrine (Restore, Temper & Fast Travel)', action: 'open_forge' },
      { label: 'Farewell, Brother Oren.', action: 'close' },
    ],
  },

  // --- ACT I MORAL RECKONING ---
  cassian_echo: {
    speaker: 'Echo of Saint Cassian',
    kicker: 'ACT I RECKONING · YOUR FALLEN MASTER',
    body:
      '…Wait. That stance… that crescent arc…\n\n' +
      'Little apprentice? No—your voice rings with three bells, not one. Oren actually mended you…\n\n' +
      'The furnace still roars inside my ribs. The northern arch to the Salt Viaduct is open—but before you climb, decide what becomes of my ember.',
    choices: [
      {
        label: '[RESONANCE · MEND] Cool Cassian’s cracks with gold (+35 Max HP, +1 Flask · Cassian aids you in spirit)',
        action: 'reckoning_cassian_mend',
      },
      {
        label: '[CINDER · CONSUME] Drain Cassian’s molten core into your blade (+16 ATK, +12% Crit, -15 Max HP)',
        action: 'reckoning_cassian_cinder',
      },
    ],
  },

  // --- ACT II NPC & REVELATION ---
  maren_intro: {
    speaker: 'Sister Maren',
    kicker: 'BLIND SALT CARTOGRAPHER',
    body: (state) => {
      const reaction =
        state.cassianChoice === 'cinder'
          ? 'Your blade hisses with stolen kiln-fire. You tore Cassian apart instead of cooling him, didn’t you?\n\n'
          : 'Your steps ring with Cassian’s quiet cadence. You actually mended the old Warden…\n\n';
      return (
        reaction +
        'I won’t lie to you: seven years ago, I signed the order to flood your cloister. Arch-Prelate Aurelius stepped into the First Kiln alive to freeze his grief in porcelain, and the mortar split. We drowned the lower abbey to stop the fire reaching the city.\n\n' +
        'Strike both flanking Counterweight Bells across the Salt Span—or claim the Verdigris Tether [C] on the western spur—to face the Twin Arch-Censers.'
      );
    },
    choices: [
      { label: 'You drowned innocent Bell-Makers to hide Aurelius’s crime.', next: 'maren_guilt' },
      { label: 'I’ll cross the Salt Span and face Vael & Soren.', action: 'talk_maren' },
    ],
  },
  maren_guilt: {
    speaker: 'Sister Maren',
    kicker: 'BLIND SALT CARTOGRAPHER',
    body:
      'Every night I hear the drowned choir under these bricks. That is why I stayed at this tollbooth instead of fleeing to the summit.\n\n' +
      'Defeat Vael and Soren on the viaduct span. When the path to the Cobalt Cisterns opens, tell me honestly whether Orrery deserves mercy—or demolition.',
    choices: [
      { label: 'We will settle that when the Twins fall.', action: 'talk_maren' },
    ],
  },

  // --- ACT II MORAL RECKONING ---
  maren_reckoning: {
    speaker: 'Sister Maren',
    kicker: 'ACT II RECKONING · THE FLOODED OATH',
    body:
      'Vael and Soren are silent… their bronze chains finally still.\n\n' +
      'The gate to the Cobalt Cisterns is open. Inside lies Brother Oren’s archive—the truth of who you really are. Before you descend into the blue vaults, tell me what oath you carry to Aurelius’s throne.',
    choices: [
      {
        label: '[RESONANCE · FORGIVE] "Orrery’s sin ends with truth, not vengeance." (+28% Spell Power, +2.5 MP/s)',
        action: 'reckoning_maren_mend',
      },
      {
        label: '[CINDER · CONDEMN] "No mercy for the High Glaziers. Every furnace burns." (+18 ATK, -18% Dash CD)',
        action: 'reckoning_maren_cinder',
      },
    ],
  },

  // --- ACT III MANDATORY IDENTITY RECKONING ---
  pelagius_reckoning: {
    speaker: 'Echo of the Three Bell-Makers',
    kicker: 'ACT III RECKONING · WHO YOU ARE',
    body:
      'Archivist Pelagius’s shattered rings project Brother Oren’s final memory across the flooded rotunda.\n\n' +
      'You see yourself—Cassian’s apprentice—shattering on the viaduct stair while trying to stop Aurelius’s flood. You see Oren weeping as he fuses porcelain from THREE drowned Bell-Makers to bring you back as Vesper.\n\n' +
      'The dawn stair to Act IV stands open. How do you answer the three dead voices stitched inside your chest?',
    choices: [
      {
        label: '[RESONANCE · HARMONIZE] "Walk with me to the dawn—we end this together." (+45 Max HP, +25 Max MP, +15% Spell)',
        action: 'reckoning_vesper_mend',
      },
      {
        label: '[CINDER · SEVER] "I am nobody’s composite relic. I climb alone." (+24 ATK, +15% Crit)',
        action: 'reckoning_vesper_cinder',
      },
    ],
  },

  // --- ACT IV FINALE DECISION ---
  kiln_heart_choice: {
    speaker: 'The Heart of the First Kiln',
    kicker: 'ACT IV · THE FATE OF ORRERY',
    body: (state, loreCount) => {
      const canTrue = state.resonance >= 2 || loreCount >= 5;
      return (
        'Arch-Prelate Aurelius falls to his knees in the sunrise—for the first time in seven years, his porcelain tears cool without turning to steam.\n\n' +
        `"Don't let her voice vanish..." he whispers, gesturing toward the pulsing Heart of the First Kiln.\n\n` +
        `Your Path: ${state.resonance} Resonance · ${state.cinder} Cinder · ${loreCount}/7 Steles.` +
        (canTrue
          ? '\n\n[Through your Resonance or recovered truth, the TRUE ENDING — The Eternal Choir — is unlocked!]'
          : '\n\n(Walk the Path of Resonance or recover 5/7 Steles to unlock the True Ending.)')
      );
    },
    choices: (state, loreCount) => {
      const canTrue = state.resonance >= 2 || loreCount >= 5;
      const list = [
        {
          label: 'Ending I · The Golden Seam — Cool the First Kiln to hearth-warmth so memory lives without imprisoning souls.',
          action: 'ending_golden_seam',
        },
        {
          label: 'Ending II · The Silent Ash — Shatter the First Kiln forever, releasing Aurelius, Orrery, and Vesper into quiet.',
          action: 'ending_silent_ash',
        },
      ];
      if (canTrue) {
        list.push({
          label: 'Ending III · The Eternal Choir [TRUE ENDING] — Recast the kiln into an open dawn belfry of living song.',
          action: 'ending_eternal_choir',
        });
      }
      return list;
    },
  },
};

export const ENDINGS = {
  golden_seam: {
    kicker: 'ENDING I · THE GOLDEN SEAM',
    title: 'The Kiln Cools to Warmth',
    epilogue:
      'You lay your gilded blade gently across the furnace heart and draw its seven-year fever down to hearth-glow. ' +
      'Below the clouds, over-fired vessels sigh and settle into peaceful ivory while Aurelius’s final echo finally rests beside his daughter’s name. ' +
      'Brother Oren and Sister Maren ring morning matins—honoring what broke, and letting what must pass go free.',
  },
  silent_ash: {
    kicker: 'ENDING II · THE SILENT ASH',
    title: 'All Porcelain Returns to Clay',
    epilogue:
      'With one uncompromising strike, you split the First Kiln cleanly down its oldest seam. Cinder-Ichor drains away as pale, harmless ash on the sunrise wind. ' +
      'Every trapped bell in Orrery falls blissfully quiet—and Vesper’s own three golden seams unfasten into warm morning air. ' +
      'Never again will grief be fired into immortality.',
  },
  eternal_choir: {
    kicker: 'TRUE ENDING · THE ETERNAL CHOIR',
    title: 'Orrery Sings Again',
    epilogue:
      'Drawing together Cassian’s quiet cadence, Maren’s truth, and the three voices stitched within your chest, you recast the First Kiln into an open resonance belfry. ' +
      'A soaring pillar of gold-and-verdigris light wakes every tower from the Sunken Cloister to the sunlit summit. ' +
      'Souls pass freely into the dawn leaving only music behind—and Vesper, whole at last, stands watch as the true Kilnward.',
  },
};

export const CHAPTER_PRESETS = {
  1: {
    label: 'Act I · The Sunken Kiln',
    spawn: { x: 0, z: 43 },
    level: 1,
    gold: 0,
    spells: { bolt: true, nova: false, aegis: false, tether: false },
    relics: [],
    forgeTiers: { edge_temper: 0, porcelain_vessel: 0, ember_core: 0 },
    unlockedHammer: false,
    questFlags: {},
  },
  2: {
    label: 'Act II · The Salt Viaduct',
    spawn: { x: 0, z: -80 },
    level: 4,
    gold: 80,
    spells: { bolt: true, nova: true, aegis: true, tether: false },
    relics: ['verdigris_signet', 'keepers_clapper', 'cassian_forgiveness'],
    forgeTiers: { edge_temper: 1, porcelain_vessel: 1, ember_core: 1 },
    unlockedHammer: false,
    questFlags: {
      talkedToOren: true,
      westCrystalHit: true,
      westBell: true,
      eastGauntletCleared: true,
      eastBell: true,
      sanctumOpened: true,
      bossDefeated: true,
      act2Unlocked: true,
      cassianChoice: 'resonance',
      resonance: 1,
    },
  },
  3: {
    label: 'Act III · Cobalt Cisterns',
    spawn: { x: 0, z: -158 },
    level: 6,
    gold: 120,
    spells: { bolt: true, nova: true, aegis: true, tether: true },
    relics: ['verdigris_signet', 'keepers_clapper', 'cassian_forgiveness', 'salt_cloak', 'maren_harmony'],
    forgeTiers: { edge_temper: 2, porcelain_vessel: 2, ember_core: 1 },
    unlockedHammer: false,
    questFlags: {
      talkedToOren: true,
      westCrystalHit: true,
      westBell: true,
      eastGauntletCleared: true,
      eastBell: true,
      sanctumOpened: true,
      bossDefeated: true,
      act2Unlocked: true,
      talkedToMaren: true,
      viaductBridgeOpen: true,
      act2BossDefeated: true,
      cassianChoice: 'resonance',
      marenChoice: 'resonance',
      resonance: 2,
    },
  },
  4: {
    label: 'Act IV · Dawn Belfry',
    spawn: { x: 0, z: -238 },
    level: 8,
    gold: 180,
    spells: { bolt: true, nova: true, aegis: true, tether: true },
    relics: [
      'verdigris_signet',
      'keepers_clapper',
      'cassian_forgiveness',
      'salt_cloak',
      'maren_harmony',
      'archivist_astrolabe',
      'three_voices_chorus',
    ],
    forgeTiers: { edge_temper: 3, porcelain_vessel: 2, ember_core: 2 },
    unlockedHammer: true,
    questFlags: {
      talkedToOren: true,
      westCrystalHit: true,
      westBell: true,
      eastGauntletCleared: true,
      eastBell: true,
      sanctumOpened: true,
      bossDefeated: true,
      act2Unlocked: true,
      talkedToMaren: true,
      viaductBridgeOpen: true,
      act2BossDefeated: true,
      mirrorPuzzleSolved: true,
      act3BossDefeated: true,
      cassianChoice: 'resonance',
      marenChoice: 'resonance',
      vesperChoice: 'resonance',
      resonance: 3,
    },
  },
};
