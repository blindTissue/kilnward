import * as THREE from 'three';
import { PLAYER_BASE_STATS, XP_CURVE, SPELLS, RELICS, FORGE_UPGRADES, WEAPONS } from '../config/gameData.js';
import { PALETTE } from '../config/palette.js';

/**
 * KILNWARD — Vesper (Player Character — Full 4-Act Toolkit)
 * Supports Crescent Claymore & Resonance Bell-Hammer stance switching [V],
 * Arcane Bolt [RMB/E], Solar Kiln Nova [Q], Kintsugi Aegis [R], and Verdigris Tether [C].
 */
export class Player {
  constructor(scene, textures, spawnPos) {
    this.scene = scene;
    this.textures = textures;

    this.pos = new THREE.Vector3(spawnPos.x, 0, spawnPos.z);
    this.respawnPos = new THREE.Vector3(spawnPos.x, 0, spawnPos.z);
    this.yaw = Math.PI;
    this.radius = 0.62;

    this.level = 1;
    this.xp = 0;
    this.gold = 0;
    this.relics = [];
    this.forgeTiers = {
      edge_temper: 0,
      porcelain_vessel: 0,
      ember_core: 0,
    };
    this.unlockedSpells = {
      bolt: true,
      nova: false,
      aegis: false,
      tether: false,
    };
    this.unlockedHammer = false;
    this.weaponId = 'claymore';

    this.stats = { ...PLAYER_BASE_STATS };
    this.hp = this.stats.maxHp;
    this.mp = this.stats.maxMp;
    this.flasks = this.stats.maxFlasks;
    this.alive = true;

    this.comboStep = 0;
    this.comboResetTimer = 0;
    this.attackTimer = 0;
    this.attackDuration = 0.28;
    this.attackCooldown = 0;
    this.dashTimer = 0;
    this.dashCooldown = 0;
    this.dashDir = new THREE.Vector3(0, 0, -1);
    this.dashGhostTimer = 0;
    this.invulnTimer = 0;
    this.aegisTimer = 0;
    this.hitFlashTimer = 0;
    this.walkPhase = 0;
    this.knockback = new THREE.Vector3();

    this.cooldowns = {
      bolt: 0,
      nova: 0,
      aegis: 0,
      tether: 0,
      flask: 0,
    };

    this._buildMesh();
    this.recomputeStats(false);
  }

  _buildMesh() {
    this.group = new THREE.Group();
    this.group.position.copy(this.pos);

    const cloakMat = new THREE.MeshStandardMaterial({ color: 0x1d2b48, roughness: 0.78, metalness: 0.12 });
    const porcelainMat = new THREE.MeshStandardMaterial({
      color: PALETTE.porcelainWhite,
      map: this.textures.porcelain,
      roughness: 0.35,
      metalness: 0.15,
    });
    const goldMat = new THREE.MeshStandardMaterial({
      color: PALETTE.kintsugiGold,
      emissive: PALETTE.kintsugiGold,
      emissiveIntensity: 0.55,
      roughness: 0.25,
      metalness: 0.85,
    });
    this.porcelainMat = porcelainMat;

    const skirt = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.56, 1.15, 10), cloakMat);
    skirt.position.y = 0.62;
    skirt.castShadow = true;

    const chest = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.32, 0.62, 10), porcelainMat);
    chest.position.y = 1.28;
    chest.castShadow = true;

    const mantle = new THREE.Mesh(new THREE.ConeGeometry(0.58, 0.42, 10), cloakMat);
    mantle.position.y = 1.56;
    mantle.castShadow = true;

    const collar = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.05, 8, 16), goldMat);
    collar.rotation.x = Math.PI / 2;
    collar.position.y = 1.62;

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.28, 12, 12), porcelainMat);
    head.position.y = 1.92;
    head.castShadow = true;

    const visor = new THREE.Mesh(
      new THREE.BoxGeometry(0.34, 0.08, 0.1),
      new THREE.MeshBasicMaterial({ color: PALETTE.kintsugiBright })
    );
    visor.position.set(0, 1.93, 0.24);

    const lantern = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.16, 0),
      new THREE.MeshBasicMaterial({ color: PALETTE.kintsugiBright })
    );
    lantern.position.set(-0.46, 1.05, 0.14);

    this.lanternLight = new THREE.PointLight(0xffb85c, 5.5, 14, 1.6);
    this.lanternLight.position.set(0, 1.8, 0.3);

    // Weapon Arm Pivot holding BOTH Claymore and Bell-Hammer meshes
    this.weaponPivot = new THREE.Group();
    this.weaponPivot.position.set(0.46, 1.32, 0.1);

    // 1. Crescent Claymore Group
    this.claymoreGroup = new THREE.Group();
    const hilt = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.42, 8), goldMat);
    hilt.rotation.x = Math.PI / 2;
    hilt.position.set(0, 0, 0.2);
    const guard = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.08, 0.09), goldMat);
    guard.position.set(0, 0, 0.38);
    const blade = new THREE.Mesh(
      new THREE.BoxGeometry(0.14, 0.05, 1.65),
      new THREE.MeshStandardMaterial({
        color: 0xe6e0d2,
        emissive: PALETTE.kintsugiGold,
        emissiveIntensity: 0.35,
        roughness: 0.2,
        metalness: 0.85,
      })
    );
    blade.position.set(0, 0, 1.2);
    blade.castShadow = true;
    this.bladeMesh = blade;
    const goldEdge = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.06, 1.55), goldMat);
    goldEdge.position.set(0, 0.01, 1.22);
    this.claymoreGroup.add(hilt, guard, blade, goldEdge);

    // 2. Resonance Bell-Hammer Group (Act III)
    this.hammerGroup = new THREE.Group();
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.85, 8), goldMat);
    shaft.rotation.x = Math.PI / 2;
    shaft.position.set(0, 0, 0.9);
    const bellHead = new THREE.Mesh(
      new THREE.CylinderGeometry(0.24, 0.38, 0.68, 12),
      new THREE.MeshStandardMaterial({
        color: PALETTE.kintsugiGold,
        emissive: PALETTE.kintsugiBright,
        emissiveIntensity: 0.7,
        roughness: 0.22,
        metalness: 0.88,
      })
    );
    bellHead.rotation.z = Math.PI / 2;
    bellHead.position.set(0, 0, 1.65);
    this.hammerGroup.add(shaft, bellHead);
    this.hammerGroup.visible = false;

    // 3. Twin Kintsugi Daggers Group (Roguelike Weapon)
    this.daggersGroup = new THREE.Group();
    const dagMat = new THREE.MeshStandardMaterial({
      color: PALETTE.porcelainWhite,
      emissive: PALETTE.aetherCyan,
      emissiveIntensity: 0.75,
      metalness: 0.85,
    });
    const d1 = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.95, 4), dagMat);
    d1.rotation.x = Math.PI / 2;
    d1.position.set(0, 0, 0.65);
    const d2 = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.95, 4), dagMat);
    d2.rotation.x = Math.PI / 2;
    d2.position.set(-0.92, 0, 0.55);
    this.daggersGroup.add(d1, d2);
    this.daggersGroup.visible = false;

    // 4. Verdigris Glaive Group (Roguelike Long-Reach Polearm)
    this.glaiveGroup = new THREE.Group();
    const gPole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.04, 2.75, 8),
      new THREE.MeshStandardMaterial({ color: PALETTE.verdigrisBronze, metalness: 0.78 })
    );
    gPole.rotation.x = Math.PI / 2;
    gPole.position.set(0, 0, 1.25);
    const gBlade = new THREE.Mesh(
      new THREE.BoxGeometry(0.18, 0.05, 1.05),
      new THREE.MeshStandardMaterial({
        color: PALETTE.verdigrisGlow,
        emissive: PALETTE.verdigrisGlow,
        emissiveIntensity: 0.9,
        metalness: 0.85,
      })
    );
    gBlade.position.set(0, 0, 2.75);
    this.glaiveGroup.add(gPole, gBlade);
    this.glaiveGroup.visible = false;

    this.weaponPivot.add(this.claymoreGroup, this.hammerGroup, this.daggersGroup, this.glaiveGroup);

    this.aegisMesh = new THREE.Mesh(
      new THREE.SphereGeometry(1.18, 18, 14),
      new THREE.MeshBasicMaterial({
        color: PALETTE.kintsugiGold,
        transparent: true,
        opacity: 0.28,
        wireframe: true,
      })
    );
    this.aegisMesh.position.y = 1.1;
    this.aegisMesh.visible = false;

    this.bodyGroup = new THREE.Group();
    this.bodyGroup.add(skirt, chest, mantle, collar, head, visor, lantern, this.weaponPivot);
    this.group.add(this.bodyGroup, this.lanternLight, this.aegisMesh);
    this.scene.add(this.group);
  }

  setWeapon(weaponId) {
    if (!WEAPONS[weaponId]) return;
    this.weaponId = weaponId;
    this.syncWeaponVisual();
  }

  toggleWeapon(sound) {
    if (!this.unlockedHammer) return false;
    this.weaponId = this.weaponId === 'claymore' ? 'hammer' : 'claymore';
    this.syncWeaponVisual();
    if (sound) sound.playChime(this.weaponId === 'hammer');
    return true;
  }

  syncWeaponVisual() {
    this.claymoreGroup.visible = this.weaponId === 'claymore';
    this.hammerGroup.visible = this.weaponId === 'hammer';
    if (this.daggersGroup) this.daggersGroup.visible = this.weaponId === 'daggers';
    if (this.glaiveGroup) this.glaiveGroup.visible = this.weaponId === 'glaive';
  }

  recomputeStats(healDelta = true) {
    const prevMaxHp = this.stats.maxHp;
    const prevMaxMp = this.stats.maxMp;

    const s = { ...PLAYER_BASE_STATS, attackSpeedMult: 1.0, cooldownMult: 1.0 };
    const lvBonus = this.level - 1;
    s.maxHp += lvBonus * 18;
    s.maxMp += lvBonus * 10;
    s.attack += lvBonus * 4.5;
    s.mpRegen += lvBonus * 0.45;

    for (const u of FORGE_UPGRADES) {
      const tier = this.forgeTiers[u.id] || 0;
      if (tier > 0) {
        if (u.bonusPerTier.attack) s.attack += u.bonusPerTier.attack * tier;
        if (u.bonusPerTier.maxHp) s.maxHp += u.bonusPerTier.maxHp * tier;
        if (u.bonusPerTier.maxMp) s.maxMp += u.bonusPerTier.maxMp * tier;
        if (u.bonusPerTier.mpRegen) s.mpRegen += u.bonusPerTier.mpRegen * tier;
      }
    }
    const vesselTier = this.forgeTiers.porcelain_vessel || 0;
    if (vesselTier >= 3) s.maxFlasks += 1;

    for (const rId of this.relics) {
      const r = RELICS[rId];
      if (r && r.apply) r.apply(s);
    }

    this.stats = s;
    if (healDelta) {
      this.hp = Math.min(s.maxHp, this.hp + Math.max(0, s.maxHp - prevMaxHp));
      this.mp = Math.min(s.maxMp, this.mp + Math.max(0, s.maxMp - prevMaxMp));
    } else {
      this.hp = Math.min(s.maxHp, this.hp);
      this.mp = Math.min(s.maxMp, this.mp);
    }

    const edgeTier = this.forgeTiers.edge_temper || 0;
    if (this.bladeMesh) {
      this.bladeMesh.material.emissiveIntensity = 0.32 + edgeTier * 0.32;
    }
    this.syncWeaponVisual();
  }

  getNextXp() {
    return XP_CURVE[this.level] || XP_CURVE[XP_CURVE.length - 1] + (this.level - XP_CURVE.length + 1) * 500;
  }

  gainXp(amount) {
    this.xp += amount;
    let leveledUp = false;
    while (this.level < 12 && this.xp >= this.getNextXp()) {
      this.xp -= this.getNextXp();
      this.level += 1;
      leveledUp = true;
    }
    if (leveledUp) {
      this.recomputeStats(false);
      this.hp = this.stats.maxHp;
      this.mp = this.stats.maxMp;
    }
    return leveledUp;
  }

  addRelic(relicId) {
    if (this.relics.includes(relicId)) return false;
    this.relics.push(relicId);
    this.recomputeStats(true);
    return true;
  }

  upgradeForge(upgradeId) {
    const def = FORGE_UPGRADES.find((u) => u.id === upgradeId);
    if (!def) return false;
    const tier = this.forgeTiers[upgradeId] || 0;
    if (tier >= def.maxTier) return false;
    const cost = def.costs[tier];
    if (this.gold < cost) return false;

    this.gold -= cost;
    this.forgeTiers[upgradeId] = tier + 1;
    this.recomputeStats(true);
    this.flasks = this.stats.maxFlasks;
    return true;
  }

  restAtShrine(respawnPoint) {
    if (respawnPoint) {
      this.respawnPos.set(respawnPoint.x, 0, respawnPoint.z);
    }
    this.hp = this.stats.maxHp;
    this.mp = this.stats.maxMp;
    this.flasks = this.stats.maxFlasks;
    this.alive = true;
  }

  respawn() {
    this.pos.copy(this.respawnPos);
    this.group.position.copy(this.pos);
    this.hp = this.stats.maxHp;
    this.mp = this.stats.maxMp;
    this.flasks = this.stats.maxFlasks;
    this.invulnTimer = 1.2;
    this.aegisTimer = 0;
    this.alive = true;
    this.group.visible = true;
  }

  tryAttack(aimWorldPos, particles, sound) {
    if (!this.alive || this.attackCooldown > 0 || this.dashTimer > 0) return null;

    if (aimWorldPos) {
      const dx = aimWorldPos.x - this.pos.x;
      const dz = aimWorldPos.z - this.pos.z;
      if (dx * dx + dz * dz > 0.04) {
        this.yaw = Math.atan2(dx, dz);
      }
    }

    const w = WEAPONS[this.weaponId] || WEAPONS.claymore;
    const isHammer = this.weaponId === 'hammer';
    const isGlaive = this.weaponId === 'glaive';
    const atkSpd = this.stats.attackSpeedMult || 1.0;
    const step = this.comboStep;
    this.comboStep = (this.comboStep + 1) % 3;
    this.comboResetTimer = 0.95;
    this.attackDuration = ((step === 2 ? 0.34 : 0.24) * w.cdMult) / atkSpd;
    this.attackTimer = this.attackDuration;
    this.attackCooldown = ((step === 2 ? 0.42 : 0.27) * w.cdMult) / atkSpd;

    this.knockback.x += Math.sin(this.yaw) * (step === 2 ? 6.5 : 3.5);
    this.knockback.z += Math.cos(this.yaw) * (step === 2 ? 6.5 : 3.5);

    const aegisMult = this.aegisTimer > 0 ? 1 + SPELLS.aegis.attackBonus : 1;
    const stepMult = step === 2 ? 1.55 : step === 1 ? 1.12 : 1.0;
    const damage = Math.round(this.stats.attack * w.dmgMult * stepMult * aegisMult);
    const range = (step === 2 ? 3.45 : 2.75) + w.rangeBonus;
    const arcHalf = isHammer ? Math.PI * 0.78 : isGlaive ? Math.PI * 0.6 : step === 2 ? Math.PI * 0.65 : Math.PI * 0.48;

    const arcScale = isGlaive ? 1.52 : isHammer ? 1.18 : this.weaponId === 'daggers' ? 0.85 : 1.0;
    particles.spawnSlashArc(this.pos, this.yaw, isHammer ? 2 : step, this.aegisTimer > 0 || isHammer, arcScale);
    if (isHammer) {
      const hitCenter = this.pos.clone().add(new THREE.Vector3(Math.sin(this.yaw) * 1.9, 0, Math.cos(this.yaw) * 1.9));
      particles.spawnRingWave(hitCenter, 3.6, PALETTE.kintsugiBright, 0.35);
    }
    sound.playSwing(step, isHammer);

    return {
      origin: this.pos.clone(),
      yaw: this.yaw,
      range,
      arcHalf,
      damage,
      step,
      heavy: step === 2 || w.heavyPoise,
      knockback: (step === 2 ? 9.5 : 4.5) * w.knockMult,
    };
  }

  tryCastBolt(aimWorldPos, particles, sound, splintering = false) {
    const sp = SPELLS.bolt;
    if (!this.alive || this.cooldowns.bolt > 0 || this.mp < sp.mpCost) return false;
    this.mp -= sp.mpCost;
    this.cooldowns.bolt = sp.cooldown * (this.stats.cooldownMult || 1.0);

    let dir = new THREE.Vector3(Math.sin(this.yaw), 0, Math.cos(this.yaw));
    if (aimWorldPos) {
      const dx = aimWorldPos.x - this.pos.x;
      const dz = aimWorldPos.z - this.pos.z;
      if (dx * dx + dz * dz > 0.05) {
        dir.set(dx, 0, dz).normalize();
        this.yaw = Math.atan2(dir.x, dir.z);
      }
    }

    const damage = Math.round((sp.baseDamage + this.level * 5) * this.stats.spellPower);
    const baseAng = Math.atan2(dir.x, dir.z);
    const offsets = splintering ? [-0.22, 0, 0.22] : [0];
    for (const off of offsets) {
      const shotDir = new THREE.Vector3(Math.sin(baseAng + off), 0, Math.cos(baseAng + off));
      particles.spawnProjectile({
        owner: 'player',
        pos: this.pos.clone().addScaledVector(shotDir, 0.9),
        dir: shotDir,
        speed: sp.speed,
        damage,
        radius: 0.46,
        color: PALETTE.aetherCyan,
        maxDist: sp.range,
      });
    }
    sound.playBolt();
    return true;
  }

  tryCastNova(particles, sound) {
    const sp = SPELLS.nova;
    if (!this.alive || !this.unlockedSpells.nova || this.cooldowns.nova > 0 || this.mp < sp.mpCost) {
      return null;
    }
    this.mp -= sp.mpCost;
    this.cooldowns.nova = sp.cooldown * (this.stats.cooldownMult || 1.0);

    const damage = Math.round((sp.baseDamage + this.level * 8) * this.stats.spellPower);
    particles.spawnRingWave(this.pos, sp.radius, PALETTE.kintsugiBright, 0.55);
    particles.spawnBurst(new THREE.Vector3(this.pos.x, 1.0, this.pos.z), PALETTE.kintsugiGold, 18, 9);
    sound.playNova();
    return {
      origin: this.pos.clone(),
      radius: sp.radius,
      damage,
    };
  }

  tryCastAegis(particles, sound) {
    const sp = SPELLS.aegis;
    if (!this.alive || !this.unlockedSpells.aegis || this.cooldowns.aegis > 0 || this.mp < sp.mpCost) {
      return false;
    }
    this.mp -= sp.mpCost;
    this.cooldowns.aegis = sp.cooldown * (this.stats.cooldownMult || 1.0);
    this.aegisTimer = sp.duration;
    particles.spawnRingWave(this.pos, 3.2, PALETTE.kintsugiGold, 0.42);
    sound.playChime(true);
    return true;
  }

  tryCastTether(aimWorldPos, sound) {
    const sp = SPELLS.tether;
    if (!this.alive || !this.unlockedSpells.tether || this.cooldowns.tether > 0 || this.mp < sp.mpCost) {
      return null;
    }
    this.mp -= sp.mpCost;
    this.cooldowns.tether = sp.cooldown * (this.stats.cooldownMult || 1.0);

    let dir = new THREE.Vector3(Math.sin(this.yaw), 0, Math.cos(this.yaw));
    if (aimWorldPos) {
      const dx = aimWorldPos.x - this.pos.x;
      const dz = aimWorldPos.z - this.pos.z;
      if (dx * dx + dz * dz > 0.05) {
        dir.set(dx, 0, dz).normalize();
        this.yaw = Math.atan2(dir.x, dir.z);
      }
    }
    sound.playTether();
    return {
      origin: this.pos.clone(),
      dir,
      range: sp.range,
      damage: Math.round((sp.baseDamage + this.level * 6) * this.stats.spellPower),
    };
  }

  tryDash(moveVec, sound) {
    if (!this.alive || this.dashCooldown > 0 || this.dashTimer > 0) return false;
    if (moveVec.lengthSq() > 0.01) {
      this.dashDir.copy(moveVec).normalize();
      this.yaw = Math.atan2(this.dashDir.x, this.dashDir.z);
    } else {
      this.dashDir.set(Math.sin(this.yaw), 0, Math.cos(this.yaw));
    }
    this.dashTimer = this.stats.dashDuration;
    this.dashCooldown = this.stats.dashCooldown;
    this.invulnTimer = Math.max(this.invulnTimer, this.stats.dashDuration + 0.1);
    sound.playDash();
    return true;
  }

  setAlignmentAura(resonance, cinder) {
    if (!this.lanternLight) return;
    if (cinder > resonance) {
      this.lanternLight.color.setHex(0xff5e3a);
      if (this.bladeMesh) this.bladeMesh.material.emissive.setHex(0xff5533);
    } else if (resonance > cinder) {
      this.lanternLight.color.setHex(0x69f0dc);
      if (this.bladeMesh) this.bladeMesh.material.emissive.setHex(PALETTE.kintsugiBright);
    }
  }

  onMeleeHitLanded() {
    const w = WEAPONS[this.weaponId] || WEAPONS.claymore;
    const gain = w.mpOnHit || 5;
    this.mp = Math.min(this.stats.maxMp, this.mp + gain);
  }

  tryFlask(particles, sound) {
    if (!this.alive || this.flasks <= 0 || this.cooldowns.flask > 0 || this.hp >= this.stats.maxHp) {
      return 0;
    }
    this.flasks -= 1;
    this.cooldowns.flask = 1.4;
    const heal = Math.round(this.stats.maxHp * this.stats.flaskHealRatio);
    this.hp = Math.min(this.stats.maxHp, this.hp + heal);
    particles.spawnRingWave(this.pos, 2.4, 0x6ef0b4, 0.4);
    particles.spawnBurst(new THREE.Vector3(this.pos.x, 1.0, this.pos.z), 0x6ef0b4, 10, 4.5);
    sound.playChime(false);
    return heal;
  }

  takeDamage(amount, sourcePos, sound) {
    if (!this.alive || this.invulnTimer > 0) return 0;

    let dmg = amount;
    if (this.aegisTimer > 0) {
      dmg = Math.max(1, Math.round(dmg * (1 - SPELLS.aegis.damageReduction)));
    }
    this.hp = Math.max(0, this.hp - dmg);
    this.invulnTimer = 0.32;
    this.hitFlashTimer = 0.2;

    if (sourcePos) {
      const dx = this.pos.x - sourcePos.x;
      const dz = this.pos.z - sourcePos.z;
      const len = Math.hypot(dx, dz) || 1;
      this.knockback.x += (dx / len) * 7.5;
      this.knockback.z += (dz / len) * 7.5;
    }

    sound.playHit(true);
    if (this.hp <= 0) {
      this.alive = false;
      this.group.visible = false;
      sound.playShatter();
    }
    return dmg;
  }

  update(dt, elapsed, moveInput, collision, particles) {
    if (!this.alive) return;

    this.mp = Math.min(this.stats.maxMp, this.mp + this.stats.mpRegen * dt);
    this.attackCooldown = Math.max(0, this.attackCooldown - dt);
    this.attackTimer = Math.max(0, this.attackTimer - dt);
    this.dashCooldown = Math.max(0, this.dashCooldown - dt);
    this.invulnTimer = Math.max(0, this.invulnTimer - dt);
    this.aegisTimer = Math.max(0, this.aegisTimer - dt);
    this.hitFlashTimer = Math.max(0, this.hitFlashTimer - dt);

    if (this.comboResetTimer > 0) {
      this.comboResetTimer -= dt;
      if (this.comboResetTimer <= 0) this.comboStep = 0;
    }
    for (const k of Object.keys(this.cooldowns)) {
      this.cooldowns[k] = Math.max(0, this.cooldowns[k] - dt);
    }

    let vx = 0;
    let vz = 0;
    if (this.dashTimer > 0) {
      this.dashTimer -= dt;
      vx = this.dashDir.x * this.stats.dashSpeed;
      vz = this.dashDir.z * this.stats.dashSpeed;
      this.dashGhostTimer -= dt;
      if (this.dashGhostTimer <= 0) {
        this.dashGhostTimer = 0.045;
        particles.spawnDashGhost(this.pos, this.yaw);
      }
    } else if (moveInput.lengthSq() > 0.001) {
      const slowFactor = this.attackTimer > 0 ? 0.45 : 1.0;
      vx = moveInput.x * this.stats.moveSpeed * slowFactor;
      vz = moveInput.z * this.stats.moveSpeed * slowFactor;
      if (this.attackTimer <= 0) {
        const targetYaw = Math.atan2(moveInput.x, moveInput.z);
        let diff = targetYaw - this.yaw;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        this.yaw += diff * Math.min(1, dt * 15);
      }
      this.walkPhase += dt * 11;
    }

    this.pos.x += (vx + this.knockback.x) * dt;
    this.pos.z += (vz + this.knockback.z) * dt;
    this.knockback.multiplyScalar(Math.exp(-12 * dt));

    collision.resolveCircle(this.pos, this.radius);

    this.group.position.set(this.pos.x, 0, this.pos.z);
    this.group.rotation.y = this.yaw;

    const isMoving = moveInput.lengthSq() > 0.01 && this.dashTimer <= 0;
    this.bodyGroup.position.y = isMoving ? Math.abs(Math.sin(this.walkPhase)) * 0.11 : Math.sin(elapsed * 2.5) * 0.03;

    if (this.attackTimer > 0) {
      const progress = 1 - this.attackTimer / this.attackDuration;
      const swingDir = this.comboStep === 2 ? -1 : 1;
      this.weaponPivot.rotation.y = (-1.1 + progress * 2.3) * swingDir;
      this.weaponPivot.rotation.x = 0.25;
    } else {
      this.weaponPivot.rotation.y += (-0.42 - this.weaponPivot.rotation.y) * Math.min(1, dt * 12);
      this.weaponPivot.rotation.x += (0 - this.weaponPivot.rotation.x) * Math.min(1, dt * 12);
    }

    this.aegisMesh.visible = this.aegisTimer > 0;
    if (this.aegisMesh.visible) {
      this.aegisMesh.rotation.y += dt * 2.2;
      this.aegisMesh.scale.setScalar(1 + Math.sin(elapsed * 8) * 0.04);
    }

    this.porcelainMat.emissive.setHex(this.hitFlashTimer > 0 ? 0xff4444 : 0x000000);
    this.porcelainMat.emissiveIntensity = this.hitFlashTimer > 0 ? 1.2 : 0;
  }
}
