import { PALETTE } from './palette.js';

/**
 * KILNWARD — THE ENDLESS KILN (Roguelike Mode Data Registry)
 * 4 Weapon Classes, 18 Synergistic Boons, Floor Mutators, Boss Rotation & Meta-Progression.
 */

export const ROGUELIKE_WEAPONS = {
  claymore: {
    id: 'claymore',
    name: 'Crescent Claymore',
    tag: 'BALANCED · SWEEPING',
    glyph: '⚔',
    dmgMult: 1.0,
    cdMult: 1.0,
    rangeBonus: 0,
    knockMult: 1.0,
    critBonus: 0.04,
    mpOnHit: 5,
    heavyPoise: false,
    desc: 'Fluid 3-hit golden arcs with balanced reach, reliable knockback, and steady Aether gain.',
  },
  hammer: {
    id: 'hammer',
    name: 'Resonance Bell-Hammer',
    tag: 'HEAVY · POISE BREAKER',
    glyph: '⚒',
    dmgMult: 1.54,
    cdMult: 1.4,
    rangeBonus: 0.55,
    knockMult: 1.7,
    critBonus: 0.0,
    mpOnHit: 8,
    heavyPoise: true,
    desc: 'Crushing gilded bell-maul that rings on every swing, shattering poise in wide shockwaves.',
  },
  daggers: {
    id: 'daggers',
    name: 'Twin Kintsugi Daggers',
    tag: 'RAPID · HIGH CRIT',
    glyph: '🗡',
    dmgMult: 0.68,
    cdMult: 0.6,
    rangeBonus: -0.35,
    knockMult: 0.45,
    critBonus: 0.24,
    mpOnHit: 4,
    heavyPoise: false,
    desc: 'Blistering twin porcelain blades with +24% Crit Chance. Excels with Chain Lightning, Cinder Burn & Crit procs.',
  },
  glaive: {
    id: 'glaive',
    name: 'Verdigris Glaive',
    tag: 'LONG REACH · CROWD SWEEP',
    glyph: '🔱',
    dmgMult: 1.12,
    cdMult: 1.14,
    rangeBonus: 1.85,
    knockMult: 1.25,
    critBonus: 0.08,
    mpOnHit: 6,
    heavyPoise: false,
    desc: 'Long oxidized-bronze polearm with massive sweeping reach to control crowds safely from mid-range.',
  },
};

export const ROGUELIKE_BOONS = [
  // --- COMMON (Porcelain) ---
  {
    id: 'quicksilver_glaze',
    name: 'Quicksilver Glaze',
    rarity: 'common',
    glyph: '⚡',
    desc: '+22% Movement Speed & +20% Attack Speed.',
    applyStat(stats) {
      stats.moveSpeed *= 1.22;
      stats.attackSpeedMult *= 1.2;
    },
  },
  {
    id: 'bellmakers_tempo',
    name: "Bell-Maker's Tempo",
    rarity: 'common',
    glyph: '⏳',
    desc: '-25% Cooldown on all Spells and Gilded Dash.',
    applyStat(stats) {
      stats.cooldownMult *= 0.75;
      stats.dashCooldown *= 0.75;
    },
  },
  {
    id: 'porcelain_bulwark',
    name: 'Porcelain Bulwark',
    rarity: 'common',
    glyph: '🛡',
    desc: '+45 Max Vitality, +1 Ember Flask, and restores 40% HP immediately.',
    applyStat(stats) {
      stats.maxHp += 45;
      stats.maxFlasks += 1;
    },
    onAcquire(player) {
      player.flasks = Math.min(player.stats.maxFlasks, player.flasks + 1);
      player.hp = Math.min(player.stats.maxHp, player.hp + Math.round(player.stats.maxHp * 0.4));
    },
  },
  {
    id: 'bottomless_lantern',
    name: 'Bottomless Lantern',
    rarity: 'common',
    glyph: '✧',
    desc: '+35 Max Aether, +4.0 Aether/sec regen, and +20% Spell Power.',
    applyStat(stats) {
      stats.maxMp += 35;
      stats.mpRegen += 4.0;
      stats.spellPower += 0.2;
    },
  },
  {
    id: 'cinder_bleed',
    name: 'Cinder Glaze',
    rarity: 'common',
    glyph: '🔥',
    desc: 'Every weapon & spell hit ignites foes with stacking Cinder Burn (36% ATK over 3s).',
  },
  {
    id: 'gilded_execution',
    name: 'Gilded Execution',
    rarity: 'common',
    glyph: '☠',
    desc: 'Deal +45% bonus damage to enemies and bosses below 40% HP.',
  },

  // --- RARE (Verdigris) ---
  {
    id: 'chain_lightning',
    name: 'Storm-Seam Arc',
    rarity: 'rare',
    glyph: '🌩',
    desc: 'Melee hits arc storm lightning to 2 nearby enemies for 48% weapon damage.',
  },
  {
    id: 'splintering_bolts',
    name: 'Splintering Aether',
    rarity: 'rare',
    glyph: '✦',
    desc: 'Arcane Bolt fires a 3-bolt fanned volley instead of 1 (same MP cost!).',
  },
  {
    id: 'ember_afterimage',
    name: 'Ember Afterimage',
    rarity: 'rare',
    glyph: '💥',
    desc: 'Gilded Dash leaves behind a molten decoy that detonates after 0.45s for heavy AoE damage.',
  },
  {
    id: 'shatter_vampirism',
    name: 'Shatter Vampirism',
    rarity: 'rare',
    glyph: '🩸',
    desc: 'Killing any enemy restores +8% Max Vitality and +15 Aether.',
  },
  {
    id: 'shattering_strikes',
    name: 'Third-Chime Nova',
    rarity: 'rare',
    glyph: '✹',
    desc: 'Every 3rd combo hit unleashes a free golden shockwave dealing 95% Attack in a 5u radius.',
  },
  {
    id: 'nova_overcharge',
    name: 'Echoing Kiln Nova',
    rarity: 'rare',
    glyph: '☀',
    desc: 'Solar Kiln Nova [Q] triggers a second larger golden detonation 0.45s later (+30% radius).',
  },
  {
    id: 'aegis_thorns',
    name: 'Gilded Retribution',
    rarity: 'rare',
    glyph: '⛨',
    desc: 'While Kintsugi Aegis [R] is active, taking damage blasts all nearby foes for 220% Attack.',
  },
  {
    id: 'tether_cascade',
    name: 'Tether Cascade',
    rarity: 'rare',
    glyph: '⛓',
    desc: 'Verdigris Tether [C] detonates a 5.5u shockwave on impact and resets cooldown on kill.',
  },
  {
    id: 'gold_fever',
    name: 'Midas Lacquer',
    rarity: 'rare',
    glyph: '👑',
    desc: 'Gain +3% total damage for every 25 Gold Shards you currently carry.',
  },

  // --- LEGENDARY (Molten Gold & Cursed) ---
  {
    id: 'resonant_crits',
    name: 'Resonant Starfall',
    rarity: 'legendary',
    glyph: '★',
    desc: '+18% Crit Chance. Every Critical Hit launches a homing verdigris star at the nearest foe.',
    applyStat(stats) {
      stats.critChance += 0.18;
    },
  },
  {
    id: 'undying_seam',
    name: 'Undying Kintsugi Seam',
    rarity: 'legendary',
    glyph: '☥',
    desc: 'DEATH DEFIANCE: Once per run, lethal damage heals you to 55% HP in a blinding shockwave!',
  },
  {
    id: 'glass_kiln_pact',
    name: 'Glass Kiln Pact [CURSED]',
    rarity: 'cursed',
    glyph: '❖',
    desc: '+60% ALL Damage & +20% Crit Chance, but -30% Max Vitality.',
    applyStat(stats) {
      stats.critChance += 0.2;
      stats.maxHp = Math.max(55, Math.round(stats.maxHp * 0.7));
    },
  },
];

export const FLOOR_MUTATORS = [
  { id: 'none', name: 'Calm Resonance', desc: 'Standard crucible conditions.' },
  { id: 'vents', name: 'Furnace Vents', desc: 'Molten floor vents erupt periodically beneath your feet.' },
  { id: 'lightning', name: 'Storm Spire', desc: 'Cyan lightning rings strike around the arena every 3.5s.' },
  { id: 'overfired', name: 'Over-Fired Foes', desc: 'Enemies move 20% faster, but drop +40% Gold Shards.' },
  { id: 'blood_kiln', name: 'Blood Kiln', desc: 'Both Vesper and enemies deal +30% damage!' },
];

/**
 * 4 Spacious Biome Arenas recycled cleanly from our existing cathedral world!
 */
export const ROGUELIKE_ARENAS = [
  {
    id: 'crucible',
    name: 'The Crown Crucible',
    zoneId: 'crucible',
    center: { x: 0, z: -50 },
    playerSpawn: { x: 0, z: -34 },
    bounds: { minX: -20, maxX: 20, minZ: -68, maxZ: -32 },
    lockGates: ['bossMist', 'viaductGate'],
    ashColor: PALETTE.kintsugiBright,
  },
  {
    id: 'salt_span',
    name: 'The Salt Viaduct Span',
    zoneId: 'salt_viaduct',
    center: { x: 0, z: -138 },
    playerSpawn: { x: 0, z: -129 },
    bounds: { minX: -19, maxX: 19, minZ: -148, maxZ: -128 },
    lockGates: ['act2BossMist', 'cisternGate'],
    ashColor: PALETTE.saltWhite,
  },
  {
    id: 'orrery_rotunda',
    name: 'The Orrery Rotunda',
    zoneId: 'cobalt_cisterns',
    center: { x: 0, z: -216 },
    playerSpawn: { x: 0, z: -206 },
    bounds: { minX: -19, maxX: 19, minZ: -226, maxZ: -206 },
    lockGates: ['act3BossMist', 'belfryGate'],
    ashColor: PALETTE.aetherCyan,
  },
  {
    id: 'dawn_summit',
    name: 'The Belfry of Unfired Ash',
    zoneId: 'dawn_belfry',
    center: { x: 0, z: -278 },
    playerSpawn: { x: 0, z: -260 },
    bounds: { minX: -21, maxX: 21, minZ: -298, maxZ: -259 },
    lockGates: ['act4BossMist'],
    ashColor: PALETTE.dawnSun,
  },
];

export const META_UPGRADES = [
  {
    id: 'meta_hp',
    name: 'Eternal Seam',
    desc: '+15 Starting Max Vitality per rank in Endless Kiln.',
    maxRank: 5,
    costs: [30, 65, 110, 170, 250],
  },
  {
    id: 'meta_atk',
    name: 'Gilded Edge',
    desc: '+4 Starting Attack Power per rank in Endless Kiln.',
    maxRank: 5,
    costs: [35, 75, 125, 190, 275],
  },
  {
    id: 'meta_gold',
    name: 'Peddler’s Purse',
    desc: '+35 Starting Gold Shards per rank for early Shrine shops.',
    maxRank: 4,
    costs: [25, 55, 95, 145],
  },
  {
    id: 'meta_reroll',
    name: 'Resonance Dice',
    desc: '+1 Boon Reroll per run (re-roll your 3 Boon choices).',
    maxRank: 3,
    costs: [40, 95, 175],
  },
];
