import * as THREE from 'three';
import {
  ROGUELIKE_ARENAS,
  ROGUELIKE_BOONS,
  ROGUELIKE_WEAPONS,
  FLOOR_MUTATORS,
  META_UPGRADES,
} from '../config/roguelikeData.js';
import { PALETTE, ZONE_ATMOSPHERE } from '../config/palette.js';
import { Enemy } from '../entities/Enemy.js';

const META_KEY = 'kilnward_roguelike_meta_v1';

/**
 * KILNWARD — THE ENDLESS KILN (Roguelike Mode Controller)
 * Manages floor progression, rotating biomes, mutator hazards, wave & boss spawning,
 * 18 synergistic Boons (lightning chains, homing crit stars, afterimage bombs, burn DoTs,
 * death defiance), Peddler Sanctuary shops, and Kiln Ember meta-progression.
 */
export class RoguelikeManager {
  constructor(game) {
    this.game = game;
    this.active = false;

    // Persistent Meta Progression
    this.meta = this._loadMeta();

    // Active Run State
    this.floor = 0;
    this.selectedWeapon = 'claymore';
    this.boons = new Set();
    this.boonList = [];
    this.rerollsLeft = 0;
    this.undyingUsed = false;
    this.currentArena = ROGUELIKE_ARENAS[0];
    this.currentMutator = FLOOR_MUTATORS[0];
    this.currentRoomType = 'skirmish'; // skirmish | elite | boss | shop

    this.floorEnemies = [];
    this.floorBoss = null;
    this.floorCleared = false;
    this.wavesRemaining = [];
    this.bossesSlain = 0;
    this.killsThisRun = 0;
    this.embersEarned = 0;

    // Timed Combat Procs & Hazards
    this.hazardTimer = 3.0;
    this.pendingHazards = [];   // { x, z, radius, damage, color, timer }
    this.pendingDecoys = [];    // Ember Afterimage bombs
    this.pendingNovas = [];     // Echoing Kiln Nova delayed 2nd pulse
    this.burningTargets = new Map(); // target -> { ticks, timer, dmgPerTick, bossObj? }
  }

  _loadMeta() {
    const fallback = {
      embers: 45, // Give new players a taste of meta-upgrades right away!
      bestFloor: 0,
      totalRuns: 0,
      ranks: { meta_hp: 0, meta_atk: 0, meta_gold: 0, meta_reroll: 0 },
    };
    try {
      const raw = localStorage.getItem(META_KEY);
      if (!raw) return fallback;
      const parsed = JSON.parse(raw);
      return {
        embers: parsed.embers ?? 45,
        bestFloor: parsed.bestFloor ?? 0,
        totalRuns: parsed.totalRuns ?? 0,
        ranks: { ...fallback.ranks, ...(parsed.ranks || {}) },
      };
    } catch {
      return fallback;
    }
  }

  saveMeta() {
    try {
      localStorage.setItem(META_KEY, JSON.stringify(this.meta));
    } catch {
      // Ignore storage failures
    }
  }

  buyMetaUpgrade(id) {
    const def = META_UPGRADES.find((u) => u.id === id);
    if (!def) return false;
    const rank = this.meta.ranks[id] || 0;
    if (rank >= def.maxRank) return false;
    const cost = def.costs[rank];
    if (this.meta.embers < cost) return false;

    this.meta.embers -= cost;
    this.meta.ranks[id] = rank + 1;
    this.saveMeta();
    return true;
  }

  hasBoon(id) {
    return this.active && this.boons.has(id);
  }

  startNewRun(weaponId = 'claymore') {
    const g = this.game;
    this.active = true;
    this.selectedWeapon = ROGUELIKE_WEAPONS[weaponId] ? weaponId : 'claymore';
    this.floor = 0;
    this.boons.clear();
    this.boonList = [];
    this.undyingUsed = false;
    this.bossesSlain = 0;
    this.killsThisRun = 0;
    this.embersEarned = 0;
    this.rerollsLeft = 1 + (this.meta.ranks.meta_reroll || 0);
    this.pendingHazards = [];
    this.pendingDecoys = [];
    this.pendingNovas = [];
    this.burningTargets.clear();

    // Hide story enemies & bosses cleanly so they don't interfere
    for (const e of g.enemies) {
      e.alive = false;
      g.renderer.scene.remove(e.group);
    }
    g.enemies = [];
    for (const b of g.allBosses) {
      b.reset();
      b.alive = false;
      b.active = false;
      if (b.units) b.units.forEach((u) => (u.group.visible = false));
      else if (b.group) b.group.visible = false;
    }

    // Configure Vesper with all 4 spells unlocked from Floor 1 for thrilling roguelike action!
    g.player.level = 1;
    g.player.xp = 0;
    g.player.gold = 25 + (this.meta.ranks.meta_gold || 0) * 35;
    g.player.relics = [];
    g.player.forgeTiers = { edge_temper: 0, porcelain_vessel: 0, ember_core: 0 };
    g.player.unlockedSpells = { bolt: true, nova: true, aegis: true, tether: true };
    g.player.unlockedHammer = true;
    g.player.setWeapon(this.selectedWeapon);
    this.applyBoonStatsToPlayer(false);
    g.player.hp = g.player.stats.maxHp;
    g.player.mp = g.player.stats.maxMp;
    g.player.flasks = g.player.stats.maxFlasks;
    g.player.alive = true;
    g.player.group.visible = true;

    this.meta.totalRuns += 1;
    this.saveMeta();

    this.advanceToFloor('skirmish');
  }

  applyBoonStatsToPlayer(healDelta = true) {
    const p = this.game.player;
    p.recomputeStats(healDelta);
    // Apply permanent meta bonuses
    p.stats.maxHp += (this.meta.ranks.meta_hp || 0) * 15;
    p.stats.attack += (this.meta.ranks.meta_atk || 0) * 4;
    // Apply active boon stat modifiers
    for (const bId of this.boonList) {
      const def = ROGUELIKE_BOONS.find((b) => b.id === bId);
      if (def && def.applyStat) def.applyStat(p.stats);
    }
    p.hp = Math.min(p.stats.maxHp, p.hp);
    p.mp = Math.min(p.stats.maxMp, p.mp);
  }

  grantBoon(boonId) {
    if (this.boons.has(boonId)) return;
    const def = ROGUELIKE_BOONS.find((b) => b.id === boonId);
    if (!def) return;
    this.boons.add(boonId);
    this.boonList.push(boonId);
    this.applyBoonStatsToPlayer(true);
    if (def.onAcquire) def.onAcquire(this.game.player);
    this.game.sound.playChime(true);
  }

  advanceToFloor(roomType = 'skirmish') {
    const g = this.game;
    this.floor += 1;
    this.currentRoomType = this.floor % 4 === 0 ? 'boss' : roomType;
    this.floorCleared = false;
    this.pendingHazards = [];
    this.pendingDecoys = [];
    this.pendingNovas = [];
    this.burningTargets.clear();
    this.floorBoss = null;

    // Clear leftover floor enemies
    for (const e of g.enemies) {
      g.renderer.scene.remove(e.group);
    }
    g.enemies = [];
    g.particles.clearDynamic();

    // Rotate biome arena each floor!
    const arenaIdx = (this.floor - 1) % ROGUELIKE_ARENAS.length;
    this.currentArena = ROGUELIKE_ARENAS[arenaIdx];

    // Lock all perimeter gates of the active arena
    for (const gateId of Object.keys(g.world.gates)) {
      g.world.setGateOpen(gateId, true);
    }
    for (const lockId of this.currentArena.lockGates) {
      g.world.setGateOpen(lockId, false);
    }

    // Place Vesper cleanly in arena
    const sp = this.currentArena.playerSpawn;
    g.player.pos.set(sp.x, 0, sp.z);
    g.player.yaw = Math.PI;
    g.player.group.position.copy(g.player.pos);
    g.renderer.cameraTarget.set(sp.x, 0.8, sp.z);

    // Apply biome atmosphere & sound drone
    const atmo = ZONE_ATMOSPHERE[this.currentArena.zoneId];
    g.currentZoneId = this.currentArena.zoneId;
    g.renderer.setZoneAtmosphere(this.currentArena.zoneId);
    g.sound.setZoneDrone(atmo.droneFreq);
    g.particles.setAshColor(this.currentArena.ashColor);
    g.minimap.setZoneLabel(`Floor ${this.floor} · ${this.currentArena.name}`);

    // Pick Floor Mutator (Floor 1 & Shop are always Calm)
    if (this.floor === 1 || this.currentRoomType === 'shop') {
      this.currentMutator = FLOOR_MUTATORS[0];
    } else {
      const pool = FLOOR_MUTATORS.slice(1);
      this.currentMutator = pool[(this.floor * 3 + Math.floor(Math.random() * pool.length)) % pool.length];
    }
    this.hazardTimer = 2.8;

    g.overlays.hideAll();
    g.hud.setVisible(true);
    g.gameState = 'PLAYING';
    g.clearInputState();

    // If Peddler's Sanctuary -> open Shop immediately!
    if (this.currentRoomType === 'shop') {
      this.floorCleared = true;
      g.hud.showZoneBanner(`FLOOR ${this.floor} · SANCTUARY`, "THE KILN PEDDLER'S RESPITE");
      g.player.hp = Math.min(g.player.stats.maxHp, g.player.hp + Math.round(g.player.stats.maxHp * 0.45));
      g.player.flasks = Math.min(g.player.stats.maxFlasks, g.player.flasks + 1);
      this.openPeddlerShop();
      return;
    }

    // Spawn Boss OR Enemy Waves!
    if (this.currentRoomType === 'boss') {
      this._spawnFloorBoss();
      g.hud.showZoneBanner(`FLOOR ${this.floor} · BOSS`, this.floorBoss.name);
    } else {
      this._spawnFloorWaves();
      const tag = this.currentRoomType === 'elite' ? 'ELITE CRUCIBLE · 2× GOLD & RARE BOON' : this.currentMutator.name.toUpperCase();
      g.hud.showZoneBanner(`FLOOR ${this.floor} · ${this.currentArena.name}`, tag);
    }

    this.updateHUD();
  }

  _randomArenaPoint(minDistFromPlayer = 8) {
    const b = this.currentArena.bounds;
    const p = this.game.player.pos;
    for (let tries = 0; tries < 20; tries++) {
      const x = b.minX + 3 + Math.random() * (b.maxX - b.minX - 6);
      const z = b.minZ + 3 + Math.random() * (b.maxZ - b.minZ - 6);
      if (Math.hypot(x - p.x, z - p.z) >= minDistFromPlayer) return { x, z };
    }
    return { x: this.currentArena.center.x, z: this.currentArena.center.z };
  }

  _spawnFloorWaves() {
    const f = this.floor;
    const isElite = this.currentRoomType === 'elite';
    const basePool = ['husk', 'acolyte', 'skitterer'];
    if (f >= 2) basePool.push('gale_harrier');
    if (f >= 3) basePool.push('mosaic_construct');
    const elitePool = ['reliquary_guard', 'salt_halberdier'];

    const waveCount = isElite ? 2 : f >= 3 ? 2 : 1;
    this.wavesRemaining = [];

    for (let w = 0; w < waveCount; w++) {
      const count = (isElite ? 4 : 3) + Math.min(5, Math.floor(f * 0.7));
      const wave = [];
      for (let i = 0; i < count; i++) {
        const useElite = (isElite && i < 2) || (w === waveCount - 1 && i === 0 && f >= 2);
        const type = useElite
          ? elitePool[Math.floor(Math.random() * elitePool.length)]
          : basePool[Math.floor(Math.random() * basePool.length)];
        wave.push(type);
      }
      this.wavesRemaining.push(wave);
    }
    this._spawnNextWave();
  }

  _spawnNextWave() {
    const g = this.game;
    const wave = this.wavesRemaining.shift();
    if (!wave) return;

    // Escalating HP & speed scaling per floor!
    const hpScale = 1 + (this.floor - 1) * 0.16;
    const speedScale = this.currentMutator.id === 'overfired' ? 1.2 : 1.0;

    for (const type of wave) {
      const pt = this._randomArenaPoint(8.5);
      const e = new Enemy(g.renderer.scene, g.textures, type, pt.x, pt.z, {
        zone: this.currentArena.zoneId,
        gauntletWave: true,
      });
      e.maxHp = Math.round(e.maxHp * hpScale);
      e.hp = e.maxHp;
      e.def = { ...e.def, speed: e.def.speed * speedScale };
      g.particles.spawnRingWave(new THREE.Vector3(pt.x, 0, pt.z), 2.8, PALETTE.kintsugiGold, 0.5);
      g.enemies.push(e);
    }
    g.sound.playBossHorn();
  }

  _spawnFloorBoss() {
    const g = this.game;
    const loopTier = Math.floor((this.floor - 1) / 4); // 0=Cassian, 1=Twins, 2=Pelagius, 3=Aurelius, 4+=loop!
    const bossIndex = loopTier % 4;
    const bossObj = g.allBosses[bossIndex];
    const loopScale = 1 + Math.floor(loopTier / 4) * 0.55;

    bossObj.reset();
    // Place boss at center of current arena!
    const c = this.currentArena.center;
    if (bossObj.units) {
      bossObj.units[0].pos.set(c.x - 7, 0, c.z - 2);
      bossObj.units[0].homePos.set(c.x - 7, 0, c.z - 2);
      bossObj.units[1].pos.set(c.x + 7, 0, c.z - 2);
      bossObj.units[1].homePos.set(c.x + 7, 0, c.z - 2);
      for (const u of bossObj.units) {
        u.maxHp = Math.round(u.maxHp * loopScale);
        u.hp = u.maxHp;
        u.group.position.copy(u.pos);
      }
      bossObj.maxHp = bossObj.units[0].maxHp + bossObj.units[1].maxHp;
    } else {
      bossObj.pos.set(c.x, 0, c.z - 3);
      bossObj.homePos.copy(bossObj.pos);
      bossObj.group.position.copy(bossObj.pos);
      bossObj.maxHp = Math.round(bossObj.maxHp * loopScale);
      bossObj.hp = bossObj.maxHp;
    }

    bossObj.awaken(g.sound, g.particles);
    this.floorBoss = bossObj;
  }

  // ============================================================================
  // BOON COMBAT SYNERGY HOOKS
  // ============================================================================
  getDamageMultiplier(targetHp, targetMaxHp) {
    if (!this.active) return 1.0;
    let mult = 1.0;
    if (this.hasBoon('glass_kiln_pact')) mult *= 1.6;
    if (this.hasBoon('gilded_execution') && targetMaxHp > 0 && targetHp / targetMaxHp < 0.4) {
      mult *= 1.45;
    }
    if (this.hasBoon('gold_fever')) {
      mult *= 1 + Math.floor(this.game.player.gold / 25) * 0.03;
    }
    if (this.currentMutator.id === 'blood_kiln') mult *= 1.3;
    return mult;
  }

  getIncomingDamageMultiplier() {
    if (!this.active) return 1.0;
    return this.currentMutator.id === 'blood_kiln' ? 1.3 : 1.0;
  }

  onMeleeHit(targetPos, baseDamage, comboStep, hitEntity, bossObj = null) {
    if (!this.active) return;
    const g = this.game;

    // 1. Storm-Seam Arc (Chain Lightning to 2 nearby enemies!)
    if (this.hasBoon('chain_lightning')) {
      const chainDmg = Math.round(baseDamage * 0.48);
      let chained = 0;
      for (const e of g.enemies) {
        if (!e.alive || e === hitEntity) continue;
        if (Math.hypot(e.pos.x - targetPos.x, e.pos.z - targetPos.z) <= 8.5) {
          g.particles.spawnTetherBeam(targetPos, e.pos, PALETTE.stormCyan);
          g._damageEnemy(e, chainDmg, targetPos, 2.0, false, true);
          chained++;
          if (chained >= 2) break;
        }
      }
    }

    // 2. Third-Chime Nova (Free AoE burst on every 3rd hit!)
    if (this.hasBoon('shattering_strikes') && comboStep === 2) {
      const novaDmg = Math.round(g.player.stats.attack * 0.95);
      g.particles.spawnRingWave(targetPos, 5.2, PALETTE.kintsugiBright, 0.4);
      g.sound.playBellToll(392, 0.7);
      for (const e of g.enemies) {
        if (!e.alive || e === hitEntity) continue;
        if (Math.hypot(e.pos.x - targetPos.x, e.pos.z - targetPos.z) <= 5.2) {
          g._damageEnemy(e, novaDmg, targetPos, 6.0, true, true);
        }
      }
    }

    // 3. Cinder Glaze (Burn DoT)
    if (this.hasBoon('cinder_bleed') && hitEntity) {
      this.applyBurn(hitEntity, bossObj);
    }
  }

  applyBurn(target, bossObj = null) {
    const tickDmg = Math.max(4, Math.round(this.game.player.stats.attack * 0.14));
    this.burningTargets.set(target, { ticks: 3, timer: 0.9, dmgPerTick: tickDmg, bossObj });
  }

  onCrit(targetPos) {
    if (!this.active || !this.hasBoon('resonant_crits')) return;
    const g = this.game;
    // Launch a homing star projectile at the nearest enemy or boss!
    let nearest = null;
    let bestD = 20;
    for (const e of g.enemies) {
      if (!e.alive) continue;
      const d = Math.hypot(e.pos.x - targetPos.x, e.pos.z - targetPos.z);
      if (d > 0.5 && d < bestD) {
        bestD = d;
        nearest = e.pos;
      }
    }
    if (!nearest && this.floorBoss && this.floorBoss.alive) {
      const t = this.floorBoss.getHitTargets ? this.floorBoss.getHitTargets()[0] : this.floorBoss;
      if (t) nearest = t.pos;
    }
    if (nearest) {
      const dir = new THREE.Vector3(nearest.x - targetPos.x, 0, nearest.z - targetPos.z).normalize();
      g.particles.spawnProjectile({
        owner: 'player',
        pos: targetPos.clone(),
        dir,
        speed: 24,
        damage: Math.round(g.player.stats.attack * 0.75 * g.player.stats.spellPower),
        radius: 0.42,
        color: PALETTE.kintsugiBright,
        maxDist: 22,
      });
    }
  }

  onDash(originPos) {
    if (!this.active || !this.hasBoon('ember_afterimage')) return;
    this.game.particles.spawnTelegraphCircle(originPos.x, originPos.z, 3.8, 0.45, PALETTE.kilnAmber);
    this.pendingDecoys.push({ x: originPos.x, z: originPos.z, timer: 0.45 });
  }

  onNovaCast(originPos, damage, radius) {
    if (!this.active || !this.hasBoon('nova_overcharge')) return;
    this.pendingNovas.push({ x: originPos.x, z: originPos.z, damage: Math.round(damage * 0.85), radius: radius * 1.3, timer: 0.45 });
  }

  onPlayerDamaged() {
    if (!this.active || !this.hasBoon('aegis_thorns')) return;
    const g = this.game;
    if (g.player.aegisTimer <= 0) return;
    const dmg = Math.round(g.player.stats.attack * 2.2);
    g.particles.spawnRingWave(g.player.pos, 6.2, PALETTE.kintsugiBright, 0.45);
    g.sound.playNova();
    for (const e of g.enemies) {
      if (e.alive && Math.hypot(e.pos.x - g.player.pos.x, e.pos.z - g.player.pos.z) <= 6.4) {
        g._damageEnemy(e, dmg, g.player.pos, 10, true, true);
      }
    }
    if (this.floorBoss && this.floorBoss.alive) {
      const targets = this.floorBoss.getHitTargets ? this.floorBoss.getHitTargets() : [this.floorBoss];
      for (const t of targets) {
        if (Math.hypot(t.pos.x - g.player.pos.x, t.pos.z - g.player.pos.z) <= 6.8) {
          g._damageActiveBoss(this.floorBoss, t, dmg, true);
        }
      }
    }
  }

  tryDeathDefiance() {
    if (!this.active || !this.hasBoon('undying_seam') || this.undyingUsed) return false;
    this.undyingUsed = true;
    const g = this.game;
    g.player.alive = true;
    g.player.group.visible = true;
    g.player.hp = Math.round(g.player.stats.maxHp * 0.55);
    g.player.invulnTimer = 2.0;
    g.particles.spawnRingWave(g.player.pos, 12, PALETTE.kintsugiBright, 0.9);
    g.sound.playBellToll(329.63, 2.8);
    g.renderer.addTrauma(0.75);
    g.hud.showToast('DEATH DEFIED!', 'Undying Kintsugi Seam Shattered', '55% Vitality restored with 2s invulnerability!', 4.2);
    return true;
  }

  onEnemyKilled(fromTether = false) {
    if (!this.active) return;
    this.killsThisRun += 1;
    const g = this.game;

    if (this.hasBoon('shatter_vampirism')) {
      const heal = Math.round(g.player.stats.maxHp * 0.08);
      g.player.hp = Math.min(g.player.stats.maxHp, g.player.hp + heal);
      g.player.mp = Math.min(g.player.stats.maxMp, g.player.mp + 15);
    }
    if (fromTether && this.hasBoon('tether_cascade')) {
      g.player.cooldowns.tether = 0;
    }
  }

  // ============================================================================
  // FLOOR COMPLETION, BOON DRAFTING & PEDDLER SHOP
  // ============================================================================
  rollBoonChoices(forceHighRarity = false) {
    const available = ROGUELIKE_BOONS.filter((b) => !this.boons.has(b.id));
    const picks = [];
    const pool = [...available];
    while (picks.length < 3 && pool.length > 0) {
      // Weight rarities cleanly
      let chosenIdx = Math.floor(Math.random() * pool.length);
      if (forceHighRarity) {
        const rares = pool.map((b, i) => (b.rarity !== 'common' ? i : -1)).filter((i) => i >= 0);
        if (rares.length > 0) chosenIdx = rares[Math.floor(Math.random() * rares.length)];
      }
      picks.push(pool.splice(chosenIdx, 1)[0]);
    }
    return picks;
  }

  _onFloorCleared() {
    if (this.floorCleared) return;
    this.floorCleared = true;
    const g = this.game;

    if (this.currentRoomType === 'boss') {
      this.bossesSlain += 1;
      g.player.flasks = g.player.stats.maxFlasks;
      g.player.hp = Math.min(g.player.stats.maxHp, g.player.hp + Math.round(g.player.stats.maxHp * 0.35));
    }

    const goldBonus = (this.currentRoomType === 'elite' ? 65 : this.currentRoomType === 'boss' ? 100 : 32) *
      (this.currentMutator.id === 'overfired' ? 1.4 : 1);
    g.player.gold += Math.round(goldBonus);
    g.sound.playBellToll(261.63, 2.2);

    // Update Personal Best Floor
    if (this.floor > this.meta.bestFloor) {
      this.meta.bestFloor = this.floor;
      this.saveMeta();
    }

    // Open 3-Choice Boon Draft!
    const forceRare = this.currentRoomType === 'elite' || this.currentRoomType === 'boss';
    setTimeout(() => {
      if (!this.active || g.gameState !== 'PLAYING') return;
      g.clearInputState();
      g.gameState = 'MODAL';
      g.overlays.showBoonDraft(
        this.floor,
        this.rollBoonChoices(forceRare),
        this.rerollsLeft,
        forceRare
      );
    }, 650);
  }

  openNextRoomChoice() {
    const g = this.game;
    const nextFloor = this.floor + 1;
    let options;
    if (nextFloor % 4 === 0) {
      const bossNames = ['Saint Cassian', 'The Twin Arch-Censers', 'Archivist Pelagius', 'Arch-Prelate Aurelius'];
      const bName = bossNames[Math.floor((nextFloor - 1) / 4) % 4];
      options = [
        {
          roomType: 'boss',
          kicker: `FLOOR ${nextFloor} · BOSS CRUCIBLE`,
          title: bName,
          desc: 'Defeat the floor guardian for a guaranteed Rare/Legendary Boon, full Flask refill, and 100 Gold Shards!',
        },
      ];
    } else {
      options = [
        {
          roomType: 'skirmish',
          kicker: `FLOOR ${nextFloor} · STANDARD`,
          title: 'Crucible Skirmish',
          desc: 'Balanced Hollow Vessel waves + Boon draft reward.',
        },
        Math.random() < 0.48
          ? {
              roomType: 'shop',
              kicker: `FLOOR ${nextFloor} · RESPITE`,
              title: "Peddler's Sanctuary",
              desc: 'Restores 45% Vitality + 1 Flask. Spend Gold Shards on extra Boons, Temper upgrades, or Weapon Swaps!',
            }
          : {
              roomType: 'elite',
              kicker: `FLOOR ${nextFloor} · HIGH RISK`,
              title: 'Elite Crucible',
              desc: 'Heavy Elite guardians + Mutator → Guaranteed Rare/Legendary Boon & 2× Gold Shards!',
            },
      ];
    }
    g.clearInputState();
    g.gameState = 'MODAL';
    g.overlays.showRoomPortal(nextFloor, options);
  }

  openPeddlerShop() {
    const g = this.game;
    const shopBoons = this.rollBoonChoices(false).slice(0, 2).map((b) => ({
      ...b,
      cost: b.rarity === 'legendary' || b.rarity === 'cursed' ? 115 : b.rarity === 'rare' ? 80 : 55,
    }));
    g.clearInputState();
    g.gameState = 'MODAL';
    g.overlays.showPeddlerShop(g.player, shopBoons, Object.values(ROGUELIKE_WEAPONS));
  }

  onRunEnded() {
    const g = this.game;
    const earned = this.floor * 12 + this.bossesSlain * 30 + Math.floor(this.killsThisRun * 1.5);
    this.embersEarned = earned;
    this.meta.embers += earned;
    if (this.floor > this.meta.bestFloor) this.meta.bestFloor = this.floor;
    this.saveMeta();

    g.clearInputState();
    g.gameState = 'DEAD';
    g.overlays.showRoguelikeSummary({
      floor: this.floor,
      bestFloor: this.meta.bestFloor,
      bossesSlain: this.bossesSlain,
      kills: this.killsThisRun,
      embersEarned: earned,
      totalEmbers: this.meta.embers,
      weaponName: ROGUELIKE_WEAPONS[g.player.weaponId]?.name || 'Crescent Claymore',
      boonsCount: this.boonList.length,
    });
  }

  updateHUD() {
    if (!this.active) return;
    const g = this.game;
    const aliveCount = g.enemies.filter((e) => e.alive).length + (this.floorBoss && this.floorBoss.alive ? 1 : 0);
    g.hud.updateRoguelikeHeader({
      floor: this.floor,
      arenaName: this.currentArena.name,
      mutator: this.currentMutator,
      remaining: aliveCount,
      wavesLeft: this.wavesRemaining.length,
      boonsCount: this.boonList.length,
      hasUndying: this.hasBoon('undying_seam') && !this.undyingUsed,
    });
  }

  update(dt) {
    if (!this.active) return;
    const g = this.game;

    // 1. Update Ember Afterimage bombs
    for (let i = this.pendingDecoys.length - 1; i >= 0; i--) {
      const d = this.pendingDecoys[i];
      d.timer -= dt;
      if (d.timer <= 0) {
        this.pendingDecoys.splice(i, 1);
        const dmg = Math.round(g.player.stats.attack * 1.35 * g.player.stats.spellPower);
        g.particles.spawnRingWave(new THREE.Vector3(d.x, 0, d.z), 4.0, PALETTE.kilnAmber, 0.45);
        g.particles.spawnBurst(new THREE.Vector3(d.x, 0.8, d.z), PALETTE.moltenGold, 14, 8);
        g.sound.playNova();
        for (const e of g.enemies) {
          if (e.alive && Math.hypot(e.pos.x - d.x, e.pos.z - d.z) <= 4.0) {
            g._damageEnemy(e, dmg, d, 7, true, true);
          }
        }
        if (this.floorBoss && this.floorBoss.alive) {
          const targets = this.floorBoss.getHitTargets ? this.floorBoss.getHitTargets() : [this.floorBoss];
          for (const t of targets) {
            if (Math.hypot(t.pos.x - d.x, t.pos.z - d.z) <= 4.3) {
              g._damageActiveBoss(this.floorBoss, t, dmg, true);
            }
          }
        }
      }
    }

    // 2. Update Echoing Kiln Nova 2nd pulse
    for (let i = this.pendingNovas.length - 1; i >= 0; i--) {
      const n = this.pendingNovas[i];
      n.timer -= dt;
      if (n.timer <= 0) {
        this.pendingNovas.splice(i, 1);
        g.particles.spawnRingWave(new THREE.Vector3(n.x, 0, n.z), n.radius, PALETTE.kintsugiBright, 0.55);
        g.sound.playNova();
        for (const e of g.enemies) {
          if (e.alive && Math.hypot(e.pos.x - n.x, e.pos.z - n.z) <= n.radius + e.radius) {
            g._damageEnemy(e, n.damage, n, 10, true, true);
          }
        }
        if (this.floorBoss && this.floorBoss.alive) {
          const targets = this.floorBoss.getHitTargets ? this.floorBoss.getHitTargets() : [this.floorBoss];
          for (const t of targets) {
            if (Math.hypot(t.pos.x - n.x, t.pos.z - n.z) <= n.radius + t.radius) {
              g._damageActiveBoss(this.floorBoss, t, n.damage, true);
            }
          }
        }
      }
    }

    // 3. Update Cinder Glaze burn ticks
    for (const [target, b] of this.burningTargets.entries()) {
      if (!target.alive) {
        this.burningTargets.delete(target);
        continue;
      }
      b.timer -= dt;
      if (b.timer <= 0) {
        b.timer = 0.95;
        b.ticks -= 1;
        if (b.bossObj) {
          g._damageActiveBoss(b.bossObj, target, b.dmgPerTick, false);
        } else {
          g._damageEnemy(target, b.dmgPerTick, target.pos, 0, false, true);
        }
        if (b.ticks <= 0) this.burningTargets.delete(target);
      }
    }

    // 4. Floor Mutator Hazards (Furnace Vents / Storm Lightning)
    if (!this.floorCleared && (this.currentMutator.id === 'vents' || this.currentMutator.id === 'lightning')) {
      this.hazardTimer -= dt;
      if (this.hazardTimer <= 0) {
        this.hazardTimer = 3.2;
        const isStorm = this.currentMutator.id === 'lightning';
        const hx = g.player.pos.x + (Math.random() - 0.5) * 4.5;
        const hz = g.player.pos.z + (Math.random() - 0.5) * 4.5;
        const rad = isStorm ? 2.8 : 3.4;
        const color = isStorm ? PALETTE.stormCyan : PALETTE.kilnAmber;
        g.particles.spawnTelegraphCircle(hx, hz, rad, 1.05, color);
        this.pendingHazards.push({ x: hx, z: hz, radius: rad, damage: 22 + this.floor * 2, color, timer: 1.05 });
      }
    }

    for (let i = this.pendingHazards.length - 1; i >= 0; i--) {
      const h = this.pendingHazards[i];
      h.timer -= dt;
      if (h.timer <= 0) {
        this.pendingHazards.splice(i, 1);
        g.particles.spawnRingWave(new THREE.Vector3(h.x, 0, h.z), h.radius + 0.4, h.color, 0.45);
        g.sound.playNova();
        if (Math.hypot(g.player.pos.x - h.x, g.player.pos.z - h.z) <= h.radius) {
          g._onPlayerHit(h.damage, h);
        }
      }
    }

    // 5. Check Wave / Floor Clear
    if (!this.floorCleared) {
      const bossAlive = this.floorBoss && this.floorBoss.alive;

      // On Boss Floors, defeating the boss cleanly shatters any remaining summoned minions!
      if (this.currentRoomType === 'boss' && this.floorBoss && !bossAlive) {
        for (const e of g.enemies) {
          if (e.alive) {
            e.alive = false;
            g.renderer.scene.remove(e.group);
            g.particles.spawnBurst(new THREE.Vector3(e.pos.x, 1.0, e.pos.z), PALETTE.porcelainWhite, 10, 7, true);
          }
        }
        this._onFloorCleared();
      } else {
        const enemiesAlive = g.enemies.filter((e) => e.alive).length;
        if (enemiesAlive === 0 && !bossAlive) {
          if (this.wavesRemaining.length > 0) {
            this._spawnNextWave();
          } else {
            this._onFloorCleared();
          }
        }
      }
    }

    this.updateHUD();
  }
}
