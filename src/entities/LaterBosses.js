import * as THREE from 'three';
import { PALETTE } from '../config/palette.js';

/**
 * KILNWARD — Act II, III & IV Boss Encounters
 *   Act II:  The Twin Arch-Censers (Vael & Soren) — Synchronized duo w/ Kintsugi Resonance enrage
 *   Act III: Archivist Pelagius, The Kiln-Orrery  — Celestial astrolabe w/ rotating sweeper beams & quadrant scorch
 *   Act IV:  Arch-Prelate Aurelius, The Uncooled  — 3-phase sunlit Dawn Belfry finale
 */

// ============================================================================
// ACT II BOSS: THE TWIN ARCH-CENSERS (VAEL & SOREN)
// ============================================================================
export class TwinArchCensersBoss {
  constructor(scene, textures, vaelPos, sorenPos) {
    this.scene = scene;
    this.textures = textures;
    this.name = 'THE TWIN ARCH-CENSERS · VAEL & SOREN';
    this.active = false;
    this.alive = true;
    this.enraged = false;

    this.units = [
      this._createTwin('vael', 'Vael', vaelPos.x, vaelPos.z, 660, PALETTE.kintsugiGold),
      this._createTwin('soren', 'Soren', sorenPos.x, sorenPos.z, 580, PALETTE.stormCyan),
    ];
    this.maxHp = this.units[0].maxHp + this.units[1].maxHp;
  }

  get hp() {
    return this.units.reduce((sum, u) => sum + (u.alive ? u.hp : 0), 0);
  }

  get phase() {
    return this.enraged ? 2 : 1;
  }

  get phaseLabel() {
    if (this.enraged) {
      const survivor = this.units.find((u) => u.alive);
      return survivor ? `PHASE II · ${survivor.title.toUpperCase()} RESONANT` : 'QUIETED';
    }
    return 'PHASE I · TWIN HARMONY';
  }

  _createTwin(id, title, x, z, maxHp, accentColor) {
    const group = new THREE.Group();
    group.position.set(x, 0, z);

    const bodyMat = new THREE.MeshStandardMaterial({
      color: PALETTE.saltWhite,
      map: this.textures.porcelain,
      roughness: 0.4,
      metalness: 0.2,
    });
    const accentMat = new THREE.MeshStandardMaterial({
      color: accentColor,
      emissive: accentColor,
      emissiveIntensity: 1.15,
      roughness: 0.25,
      metalness: 0.78,
    });
    const robe = new THREE.Mesh(
      new THREE.CylinderGeometry(0.55, 0.92, 1.9, 10),
      new THREE.MeshStandardMaterial({ color: id === 'vael' ? 0x2b364d : 0x1e4359, roughness: 0.5 })
    );
    robe.position.y = 0.95;
    robe.castShadow = true;

    const chest = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.85, 0.75), bodyMat);
    chest.position.y = 2.0;
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.38, 10, 10), bodyMat);
    head.position.y = 2.75;
    const halo = new THREE.Mesh(new THREE.TorusGeometry(0.58, 0.06, 6, 18), accentMat);
    halo.position.set(0, 3.05, -0.2);

    const weapon = new THREE.Mesh(
      id === 'vael' ? new THREE.DodecahedronGeometry(0.45, 0) : new THREE.OctahedronGeometry(0.42, 0),
      accentMat
    );
    weapon.position.set(0.95, 1.85, 0.65);

    const light = new THREE.PointLight(accentColor, 5.5, 14);
    light.position.y = 2.3;

    group.add(robe, chest, head, halo, weapon, light);
    this.scene.add(group);

    return {
      id,
      title,
      pos: new THREE.Vector3(x, 0, z),
      homePos: new THREE.Vector3(x, 0, z),
      yaw: 0,
      radius: 1.05,
      maxHp,
      hp: maxHp,
      alive: true,
      state: 'dormant',
      stateTimer: 0,
      cooldown: id === 'vael' ? 0.9 : 1.5,
      patternIdx: 0,
      currentPattern: null,
      hitFlash: 0,
      slamPos: new THREE.Vector3(),
      group,
      bodyMat,
      accentMat,
      light,
      accentColor,
    };
  }

  awaken(sound, particles) {
    if (this.active || !this.alive) return;
    this.active = true;
    for (const u of this.units) {
      if (u.alive) u.state = 'chase';
      particles.spawnRingWave(u.pos, 6.5, u.accentColor, 0.7);
    }
    sound.playBossHorn();
  }

  reset() {
    this.active = false;
    this.alive = true;
    this.enraged = false;
    for (const u of this.units) {
      u.pos.copy(u.homePos);
      u.group.position.copy(u.pos);
      u.hp = u.maxHp;
      u.alive = true;
      u.state = 'dormant';
      u.group.visible = true;
      u.accentMat.emissiveIntensity = 1.15;
    }
  }

  getHitTargets() {
    return this.units.filter((u) => u.alive);
  }

  damageUnit(unit, amount, particles, sound, onEnrage) {
    if (!this.active || !unit.alive) return 0;
    unit.hp = Math.max(0, unit.hp - amount);
    unit.hitFlash = 0.14;

    if (unit.hp <= 0) {
      unit.alive = false;
      unit.group.visible = false;
      particles.spawnBurst(new THREE.Vector3(unit.pos.x, 1.8, unit.pos.z), unit.accentColor, 26, 10, true);
      sound.playShatter();

      const survivor = this.units.find((u) => u.alive);
      if (survivor && !this.enraged) {
        this.enraged = true;
        survivor.hp = Math.min(survivor.maxHp, survivor.hp + Math.round(survivor.maxHp * 0.2));
        survivor.accentMat.emissiveIntensity = 2.6;
        survivor.light.intensity = 12;
        particles.spawnRingWave(survivor.pos, 10, PALETTE.kintsugiBright, 0.8);
        sound.playBossHorn();
        if (onEnrage) onEnrage(survivor.title);
      } else if (!survivor) {
        this.alive = false;
        this.active = false;
        sound.playBellToll(261.63, 3.0);
      }
    }
    return amount;
  }

  update(dt, elapsed, player, collision, particles, sound, onPlayerHit, onTrauma) {
    if (!this.active || !this.alive || !player.alive) return;

    for (const u of this.units) {
      if (!u.alive) continue;
      u.hitFlash = Math.max(0, u.hitFlash - dt);
      u.cooldown = Math.max(0, u.cooldown - dt);
      u.bodyMat.emissive.setHex(u.hitFlash > 0 ? 0xffd57a : this.enraged ? 0x3b6682 : 0x000000);
      u.bodyMat.emissiveIntensity = u.hitFlash > 0 ? 1.4 : this.enraged ? 0.55 : 0;

      const dx = player.pos.x - u.pos.x;
      const dz = player.pos.z - u.pos.z;
      const dist = Math.hypot(dx, dz) || 1;
      const toYaw = Math.atan2(dx, dz);

      let vx = 0;
      let vz = 0;
      const spd = (u.id === 'vael' ? 5.2 : 4.2) * (this.enraged ? 1.25 : 1);

      if (u.state === 'chase') {
        u.yaw = toYaw;
        if (u.id === 'vael') {
          if (dist > 3.4) {
            vx = (dx / dist) * spd;
            vz = (dz / dist) * spd;
          }
          if (u.cooldown <= 0) {
            u.currentPattern = dist < 5.2 ? 'flail_cleave' : 'leap_slam';
            u.state = 'windup';
            u.stateTimer = this.enraged ? 0.58 : 0.72;
            if (u.currentPattern === 'flail_cleave') {
              particles.spawnTelegraphCone(u.pos, u.yaw, 4.9, Math.PI * 0.9, u.stateTimer, PALETTE.telegraphRed);
            } else {
              u.slamPos.copy(player.pos);
              particles.spawnTelegraphCircle(u.slamPos.x, u.slamPos.z, 3.8, u.stateTimer, PALETTE.kintsugiGold);
            }
          }
        } else {
          // Soren: storm caster keeping mid-range & blinking
          if (dist < 7.0) {
            vx = -(dx / dist) * spd;
            vz = -(dz / dist) * spd;
          } else if (dist > 13.0) {
            vx = (dx / dist) * spd;
            vz = (dz / dist) * spd;
          }
          if (u.cooldown <= 0) {
            u.currentPattern = u.patternIdx++ % 2 === 0 ? 'storm_fan' : 'blink_ring';
            u.state = 'windup';
            u.stateTimer = this.enraged ? 0.58 : 0.75;
            particles.spawnTelegraphCircle(u.pos.x, u.pos.z, 2.2, u.stateTimer, PALETTE.stormCyan);
          }
        }
      } else if (u.state === 'windup') {
        u.stateTimer -= dt;
        if (u.stateTimer <= 0) {
          u.cooldown = this.enraged ? 1.15 : 1.75;
          if (u.currentPattern === 'flail_cleave') {
            particles.spawnSlashArc(u.pos, u.yaw, 2, true, 1.25);
            sound.playSwing(2, true);
            onTrauma(0.28);
            if (dist <= 5.0) onPlayerHit(24, u.pos);
          } else if (u.currentPattern === 'leap_slam') {
            u.pos.copy(u.slamPos);
            collision.resolveCircle(u.pos, u.radius);
            particles.spawnRingWave(u.pos, 4.2, PALETTE.kintsugiBright, 0.45);
            sound.playNova();
            onTrauma(0.45);
            if (Math.hypot(player.pos.x - u.pos.x, player.pos.z - u.pos.z) <= 3.9) {
              onPlayerHit(28, u.pos);
            }
          } else if (u.currentPattern === 'storm_fan') {
            const count = this.enraged ? 5 : 3;
            const spread = 0.24;
            for (let i = 0; i < count; i++) {
              const a = toYaw + (i - (count - 1) / 2) * spread;
              const dir = new THREE.Vector3(Math.sin(a), 0, Math.cos(a));
              particles.spawnProjectile({
                owner: 'enemy',
                pos: u.pos.clone().addScaledVector(dir, 1.2),
                dir,
                speed: 15.5,
                damage: 20,
                radius: 0.44,
                color: PALETTE.stormCyan,
                maxDist: 28,
              });
            }
            sound.playBolt();
          } else if (u.currentPattern === 'blink_ring') {
            const cx = u.homePos.x - (u.id === 'soren' ? 7 : -7);
            const cz = u.homePos.z;
            const corners = [
              { x: cx - 12, z: cz - 6 },
              { x: cx + 12, z: cz - 6 },
              { x: cx - 12, z: cz + 6 },
              { x: cx + 12, z: cz + 6 },
            ];
            const pick = corners[Math.floor(Math.random() * corners.length)];
            particles.spawnRingWave(u.pos, 3.2, PALETTE.stormCyan, 0.35);
            u.pos.set(pick.x, 0, pick.z);
            particles.spawnRingWave(u.pos, 4.5, PALETTE.stormCyan, 0.45);
            sound.playTether();
            const shots = this.enraged ? 8 : 6;
            for (let i = 0; i < shots; i++) {
              const a = (i / shots) * Math.PI * 2 + elapsed;
              const dir = new THREE.Vector3(Math.sin(a), 0, Math.cos(a));
              particles.spawnProjectile({
                owner: 'enemy',
                pos: u.pos.clone().addScaledVector(dir, 1.2),
                dir,
                speed: 13.0,
                damage: 18,
                radius: 0.42,
                color: PALETTE.stormCyan,
                maxDist: 26,
              });
            }
          }
          u.state = 'recover';
          u.stateTimer = 0.45;
        }
      } else if (u.state === 'recover') {
        u.stateTimer -= dt;
        if (u.stateTimer <= 0) u.state = 'chase';
      }

      u.pos.x += vx * dt;
      u.pos.z += vz * dt;
      collision.resolveCircle(u.pos, u.radius);
      u.group.position.set(u.pos.x, 0, u.pos.z);
      u.group.rotation.y = u.yaw;
    }
  }
}

// ============================================================================
// ACT III BOSS: ARCHIVIST PELAGIUS, THE KILN-ORRERY
// ============================================================================
export class ArchivistPelagiusBoss {
  constructor(scene, textures, x, z) {
    this.scene = scene;
    this.textures = textures;
    this.pos = new THREE.Vector3(x, 0, z);
    this.homePos = new THREE.Vector3(x, 0, z);
    this.radius = 1.85;
    this.name = 'ARCHIVIST PELAGIUS, THE KILN-ORRERY';
    this.maxHp = 1450;
    this.hp = this.maxHp;
    this.phase = 1;
    this.active = false;
    this.alive = true;

    this.beamAngle = 0;
    this.beamsActive = false;
    this.beamDamageCd = 0;
    this.attackTimer = 1.6;
    this.pendingQuadrants = null;
    this.hitFlash = 0;

    this._buildMesh();
  }

  get phaseLabel() {
    return this.phase === 2 ? 'PHASE II · THE MEMORY UNSPINS' : 'PHASE I · CELESTIAL ARCHIVE';
  }

  _buildMesh() {
    this.group = new THREE.Group();
    this.group.position.copy(this.pos);

    this.porcMat = new THREE.MeshStandardMaterial({
      color: 0x22438a,
      map: this.textures.porcelain,
      roughness: 0.3,
      metalness: 0.35,
    });
    this.goldMat = new THREE.MeshStandardMaterial({
      color: PALETTE.laserGold,
      emissive: PALETTE.kintsugiGold,
      emissiveIntensity: 1.4,
      roughness: 0.2,
      metalness: 0.85,
    });

    const core = new THREE.Mesh(new THREE.OctahedronGeometry(1.35, 1), this.porcMat);
    core.position.y = 2.6;
    core.castShadow = true;

    this.ringA = new THREE.Mesh(new THREE.TorusGeometry(2.15, 0.14, 10, 32), this.goldMat);
    this.ringA.position.y = 2.6;
    this.ringB = new THREE.Mesh(new THREE.TorusGeometry(2.85, 0.12, 10, 32), this.goldMat);
    this.ringB.position.y = 2.6;

    // Rotating twin golden sweeper lasers
    this.beamPivot = new THREE.Group();
    this.beamPivot.position.y = 1.2;
    const beamMat = new THREE.MeshBasicMaterial({
      color: PALETTE.laserGold,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const beamMesh = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.35, 34), beamMat);
    const crossBeamMesh = new THREE.Mesh(new THREE.BoxGeometry(34, 0.35, 0.45), beamMat);
    crossBeamMesh.visible = false;
    this.crossBeamMesh = crossBeamMesh;
    this.beamPivot.add(beamMesh, crossBeamMesh);
    this.beamPivot.visible = false;

    this.light = new THREE.PointLight(PALETTE.laserGold, 9, 24);
    this.light.position.y = 3.2;

    this.group.add(core, this.ringA, this.ringB, this.beamPivot, this.light);
    this.scene.add(this.group);
  }

  awaken(sound, particles) {
    if (this.active || !this.alive) return;
    this.active = true;
    this.beamsActive = true;
    this.beamPivot.visible = true;
    particles.spawnRingWave(this.pos, 12, PALETTE.laserGold, 0.85);
    sound.playBossHorn();
  }

  reset() {
    this.hp = this.maxHp;
    this.phase = 1;
    this.active = false;
    this.alive = true;
    this.beamsActive = false;
    this.beamPivot.visible = false;
    this.pendingQuadrants = null;
    this.group.visible = true;
  }

  getHitTargets() {
    return this.alive ? [this] : [];
  }

  damageUnit(_u, amount, particles, sound, onPhaseTwo) {
    if (!this.active || !this.alive) return 0;
    this.hp = Math.max(0, this.hp - amount);
    this.hitFlash = 0.14;

    if (this.phase === 1 && this.hp > 0 && this.hp <= this.maxHp * 0.52) {
      this.phase = 2;
      this.goldMat.emissiveIntensity = 2.6;
      if (this.crossBeamMesh) this.crossBeamMesh.visible = true;
      particles.spawnRingWave(this.pos, 14, PALETTE.aetherCyan, 0.85);
      sound.playShatter();
      sound.playBossHorn();
      if (onPhaseTwo) onPhaseTwo();
    }

    if (this.hp <= 0) {
      this.alive = false;
      this.active = false;
      this.beamPivot.visible = false;
      this.group.visible = false;
      particles.spawnBurst(new THREE.Vector3(this.pos.x, 2.4, this.pos.z), PALETTE.laserGold, 36, 12, true);
      sound.playShatter();
      sound.playBellToll(220, 3.2);
    }
    return amount;
  }

  update(dt, elapsed, player, _collision, particles, sound, onPlayerHit, onTrauma) {
    this.ringA.rotation.x = elapsed * (this.phase === 2 ? 1.8 : 0.9);
    this.ringA.rotation.y = elapsed * 0.7;
    this.ringB.rotation.y = -elapsed * (this.phase === 2 ? 1.6 : 0.8);
    this.ringB.rotation.z = elapsed * 0.5;

    this.hitFlash = Math.max(0, this.hitFlash - dt);
    this.porcMat.emissive.setHex(this.hitFlash > 0 ? 0xffe48f : 0x0b1f4d);
    this.porcMat.emissiveIntensity = this.hitFlash > 0 ? 1.5 : 0.4;

    if (!this.active || !this.alive || !player.alive) return;

    // 1. Rotating Sweeper Laser Beam
    const rotSpeed = this.phase === 2 ? 0.85 : 0.52;
    this.beamAngle += dt * rotSpeed;
    this.beamPivot.rotation.y = this.beamAngle;
    this.beamDamageCd = Math.max(0, this.beamDamageCd - dt);

    if (this.beamsActive && this.beamDamageCd <= 0) {
      const dx = player.pos.x - this.pos.x;
      const dz = player.pos.z - this.pos.z;
      const dist = Math.hypot(dx, dz);
      if (dist > 2.2 && dist < 17.2) {
        const bx = Math.sin(this.beamAngle);
        const bz = Math.cos(this.beamAngle);
        const perp1 = Math.abs(dx * bz - dz * bx);
        const perp2 = this.phase === 2 ? Math.abs(dx * bx + dz * bz) : 99;
        if (perp1 < 0.9 || perp2 < 0.9) {
          this.beamDamageCd = 0.52;
          onPlayerHit(27, this.pos);
        }
      }
    }

    // 2. Scorched Mosaic Quadrant Telegraphs + Radial Shard Waves
    this.attackTimer -= dt;
    if (this.attackTimer <= 0 && !this.pendingQuadrants) {
      this.attackTimer = this.phase === 2 ? 3.1 : 4.2;
      // Pick 2 diagonal quadrants (top-left/bottom-right or top-right/bottom-left)
      const flip = Math.random() < 0.5 ? 1 : -1;
      const quads = [
        { cx: this.pos.x - 11 * flip, cz: this.pos.z - 6.5, w: 20, d: 12 },
        { cx: this.pos.x + 11 * flip, cz: this.pos.z + 6.5, w: 20, d: 12 },
      ];
      for (const q of quads) {
        particles.spawnTelegraphRect(q.cx, q.cz, q.w, q.d, 1.35, PALETTE.aetherCyan);
      }
      this.pendingQuadrants = { quads, timer: 1.35 };

      // Also fire orbital prism volley
      const shots = this.phase === 2 ? 8 : 5;
      for (let i = 0; i < shots; i++) {
        const a = (i / shots) * Math.PI * 2 + this.beamAngle;
        const dir = new THREE.Vector3(Math.sin(a), 0, Math.cos(a));
        particles.spawnProjectile({
          owner: 'enemy',
          pos: this.pos.clone().addScaledVector(dir, 2.2),
          dir,
          speed: 12.5,
          damage: 20,
          radius: 0.45,
          color: PALETTE.aetherCyan,
          maxDist: 24,
        });
      }
      sound.playChime(true);
    }

    if (this.pendingQuadrants) {
      this.pendingQuadrants.timer -= dt;
      if (this.pendingQuadrants.timer <= 0) {
        const { quads } = this.pendingQuadrants;
        this.pendingQuadrants = null;
        sound.playNova();
        onTrauma(0.45);
        for (const q of quads) {
          particles.spawnRingWave(new THREE.Vector3(q.cx, 0, q.cz), 8.5, PALETTE.aetherCyan, 0.5);
          if (
            Math.abs(player.pos.x - q.cx) < q.w / 2 &&
            Math.abs(player.pos.z - q.cz) < q.d / 2
          ) {
            onPlayerHit(28, new THREE.Vector3(q.cx, 0, q.cz));
          }
        }
      }
    }
  }
}

// ============================================================================
// ACT IV FINAL BOSS: ARCH-PRELATE AURELIUS, THE UNCOOLED
// ============================================================================
export class ArchPrelateAureliusBoss {
  constructor(scene, textures, x, z) {
    this.scene = scene;
    this.textures = textures;
    this.pos = new THREE.Vector3(x, 0, z);
    this.homePos = new THREE.Vector3(x, 0, z);
    this.yaw = 0;
    this.radius = 1.55;
    this.name = 'ARCH-PRELATE AURELIUS, THE UNCOOLED';
    this.maxHp = 2100;
    this.hp = this.maxHp;
    this.phase = 1; // 1 (100-65%), 2 (65-30%), 3 (30-0%)
    this.active = false;
    this.alive = true;

    this.state = 'dormant';
    this.stateTimer = 0;
    this.cooldown = 1.0;
    this.patternIdx = 0;
    this.currentPattern = null;
    this.chargeDir = new THREE.Vector3();
    this.chargeHit = false;
    this.meteors = [];
    this.hitFlash = 0;

    this._buildMesh();
  }

  get phaseLabel() {
    if (this.phase === 3) return 'PHASE III · UNFIRED ASH';
    if (this.phase === 2) return 'PHASE II · THE FIRST KILN AWAKES';
    return 'PHASE I · THE ETERNAL GLAZE';
  }

  _buildMesh() {
    this.group = new THREE.Group();
    this.group.position.copy(this.pos);

    this.porcMat = new THREE.MeshStandardMaterial({
      color: PALETTE.dawnAlabaster,
      map: this.textures.porcelain,
      roughness: 0.28,
      metalness: 0.25,
    });
    this.sunMat = new THREE.MeshStandardMaterial({
      color: PALETTE.kintsugiBright,
      emissive: PALETTE.dawnSun,
      emissiveIntensity: 1.5,
      roughness: 0.2,
      metalness: 0.85,
    });

    const robe = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.55, 2.2, 14), this.porcMat);
    robe.position.y = 1.1;
    robe.castShadow = true;

    const torso = new THREE.Mesh(new THREE.BoxGeometry(1.75, 1.25, 1.05), this.sunMat);
    torso.position.y = 2.65;
    torso.castShadow = true;

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.46, 12, 12), this.porcMat);
    head.position.y = 3.65;

    const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.68, 0.45, 0.95, 8), this.sunMat);
    crown.position.y = 4.35;

    // Radiant Dawn Wings (ignite wider in Phase II & III)
    this.wings = new THREE.Group();
    this.wings.position.set(0, 2.9, -0.55);
    for (const side of [-1, 1]) {
      for (let i = 0; i < 3; i++) {
        const feather = new THREE.Mesh(new THREE.BoxGeometry(2.1 - i * 0.35, 0.24, 0.14), this.sunMat);
        feather.position.set(side * (1.55 - i * 0.15), 0.7 - i * 0.48, -0.15 * i);
        feather.rotation.z = side * (0.35 - i * 0.18);
        this.wings.add(feather);
      }
    }

    // Kintsugi Greatspear
    this.spear = new THREE.Group();
    this.spear.position.set(1.25, 2.4, 0.2);
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 5.2, 8), this.sunMat);
    pole.rotation.x = Math.PI / 2.5;
    pole.position.set(0, 0, 1.25);
    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.32, 1.4, 6), this.sunMat);
    tip.rotation.x = Math.PI / 2.5;
    tip.position.set(0, 0.85, 3.65);
    this.spear.add(pole, tip);

    this.light = new THREE.PointLight(PALETTE.dawnSun, 10, 26);
    this.light.position.y = 3.4;

    this.group.add(robe, torso, head, crown, this.wings, this.spear, this.light);
    this.scene.add(this.group);
  }

  awaken(sound, particles) {
    if (this.active || !this.alive) return;
    this.active = true;
    this.state = 'chase';
    particles.spawnRingWave(this.pos, 14, PALETTE.dawnSun, 0.9);
    sound.playBellToll(196, 2.6);
    sound.playBossHorn();
  }

  reset() {
    this.pos.copy(this.homePos);
    this.group.position.copy(this.pos);
    this.hp = this.maxHp;
    this.phase = 1;
    this.active = false;
    this.alive = true;
    this.state = 'dormant';
    this.meteors = [];
    this.sunMat.emissiveIntensity = 1.5;
    this.wings.scale.setScalar(1);
    this.group.visible = true;
  }

  getHitTargets() {
    return this.alive ? [this] : [];
  }

  damageUnit(_u, amount, particles, sound, onPhaseChange) {
    if (!this.active || !this.alive) return 0;
    this.hp = Math.max(0, this.hp - amount);
    this.hitFlash = 0.13;

    if (this.phase === 1 && this.hp <= this.maxHp * 0.65 && this.hp > 0) {
      this.phase = 2;
      this.sunMat.emissiveIntensity = 2.3;
      this.wings.scale.setScalar(1.3);
      particles.spawnRingWave(this.pos, 14, PALETTE.kintsugiBright, 0.85);
      sound.playBossHorn();
      if (onPhaseChange) onPhaseChange(2);
    } else if (this.phase === 2 && this.hp <= this.maxHp * 0.3 && this.hp > 0) {
      this.phase = 3;
      this.sunMat.emissiveIntensity = 3.2;
      this.wings.scale.setScalar(1.55);
      particles.spawnRingWave(this.pos, 16, PALETTE.dawnSun, 0.95);
      particles.spawnBurst(new THREE.Vector3(this.pos.x, 2.5, this.pos.z), PALETTE.dawnAlabaster, 30, 12, true);
      sound.playShatter();
      sound.playBellToll(146.83, 3.0);
      if (onPhaseChange) onPhaseChange(3);
    }

    if (this.hp <= 0) {
      this.alive = false;
      this.active = false;
      this.group.visible = false;
      particles.spawnBurst(new THREE.Vector3(this.pos.x, 2.6, this.pos.z), PALETTE.dawnSun, 48, 13, true);
      particles.spawnRingWave(this.pos, 18, PALETTE.kintsugiBright, 1.2);
      sound.playShatter();
      sound.playBellToll(293.66, 3.8);
    }
    return amount;
  }

  update(dt, elapsed, player, collision, particles, sound, onPlayerHit, onTrauma) {
    if (!this.alive) return;

    this.hitFlash = Math.max(0, this.hitFlash - dt);
    this.porcMat.emissive.setHex(this.hitFlash > 0 ? 0xffffff : this.phase >= 2 ? 0x99581a : 0x000000);
    this.porcMat.emissiveIntensity = this.hitFlash > 0 ? 1.6 : this.phase === 3 ? 0.85 : this.phase === 2 ? 0.35 : 0;
    this.wings.rotation.y = Math.sin(elapsed * 3.2) * 0.14;

    if (!this.active || !player.alive) return;

    // Resolve pending dawn meteors
    for (let i = this.meteors.length - 1; i >= 0; i--) {
      const m = this.meteors[i];
      m.timer -= dt;
      if (m.timer <= 0) {
        this.meteors.splice(i, 1);
        particles.spawnRingWave(new THREE.Vector3(m.x, 0, m.z), 4.2, PALETTE.dawnSun, 0.45);
        particles.spawnBurst(new THREE.Vector3(m.x, 0.6, m.z), PALETTE.kintsugiBright, 12, 8);
        sound.playNova();
        onTrauma(0.32);
        if (Math.hypot(player.pos.x - m.x, player.pos.z - m.z) <= 4.0) {
          onPlayerHit(26, m);
        }
      }
    }

    this.cooldown = Math.max(0, this.cooldown - dt);
    const dx = player.pos.x - this.pos.x;
    const dz = player.pos.z - this.pos.z;
    const dist = Math.hypot(dx, dz) || 1;
    const targetYaw = Math.atan2(dx, dz);

    let vx = 0;
    let vz = 0;
    const moveSpd = this.phase === 3 ? 6.2 : this.phase === 2 ? 5.2 : 4.4;

    if (this.state === 'chase') {
      this.yaw = targetYaw;
      if (dist > 4.6) {
        vx = (dx / dist) * moveSpd;
        vz = (dz / dist) * moveSpd;
      }
      if (this.cooldown <= 0) {
        const patterns =
          this.phase === 1
            ? ['spear_sweep', 'dawn_meteors', 'sun_fan']
            : this.phase === 2
              ? ['winged_dash', 'bell_double_nova', 'dawn_meteors', 'spear_sweep']
              : ['winged_dash', 'bell_double_nova', 'dawn_meteors', 'sun_fan'];
        const pat = patterns[this.patternIdx++ % patterns.length];
        this.currentPattern = pat;
        this.state = 'windup';

        if (pat === 'spear_sweep') {
          this.stateTimer = this.phase === 3 ? 0.52 : 0.68;
          particles.spawnTelegraphCone(this.pos, this.yaw, 6.2, Math.PI * 0.95, this.stateTimer, PALETTE.telegraphRed);
        } else if (pat === 'winged_dash') {
          this.stateTimer = 0.58;
          this.chargeDir.set(dx / dist, 0, dz / dist);
          particles.spawnTelegraphCone(this.pos, this.yaw, 14, 0.32, this.stateTimer, PALETTE.telegraphRed);
        } else if (pat === 'dawn_meteors') {
          this.stateTimer = 0.45;
          particles.spawnTelegraphCircle(this.pos.x, this.pos.z, 2.8, 0.45, PALETTE.dawnSun);
        } else if (pat === 'bell_double_nova') {
          this.stateTimer = 0.78;
          particles.spawnTelegraphCircle(this.pos.x, this.pos.z, 7.2, this.stateTimer, PALETTE.kintsugiBright);
        } else {
          this.stateTimer = 0.55;
          particles.spawnTelegraphCircle(this.pos.x, this.pos.z, 2.6, 0.55, PALETTE.dawnSun);
        }
      }
    } else if (this.state === 'windup') {
      this.stateTimer -= dt;
      this.spear.rotation.x = -0.55;
      if (this.stateTimer <= 0) {
        this.spear.rotation.x = 0.35;
        this.cooldown = this.phase === 3 ? 0.62 : this.phase === 2 ? 0.88 : 1.15;

        if (this.currentPattern === 'spear_sweep') {
          particles.spawnSlashArc(this.pos, this.yaw, 2, true, 1.75);
          sound.playSwing(2, true);
          onTrauma(0.35);
          if (dist <= 6.5) onPlayerHit(35, this.pos);
          this.state = 'recover';
          this.stateTimer = 0.38;
        } else if (this.currentPattern === 'winged_dash') {
          this.state = 'charge';
          this.stateTimer = 0.48;
          this.chargeHit = false;
          sound.playDash();
        } else if (this.currentPattern === 'dawn_meteors') {
          const count = this.phase === 3 ? 6 : 4;
          for (let i = 0; i < count; i++) {
            const mx = player.pos.x + (i === 0 ? 0 : (Math.random() - 0.5) * 12);
            const mz = player.pos.z + (i === 0 ? 0 : (Math.random() - 0.5) * 12);
            const delay = 0.72 + i * 0.22;
            particles.spawnTelegraphCircle(mx, mz, 4.2, delay, PALETTE.dawnSun);
            this.meteors.push({ x: mx, z: mz, timer: delay });
          }
          sound.playChime(true);
          this.state = 'recover';
          this.stateTimer = 0.38;
        } else if (this.currentPattern === 'bell_double_nova') {
          sound.playBellToll(196, 1.8);
          particles.spawnRingWave(this.pos, 7.8, PALETTE.kintsugiBright, 0.55);
          onTrauma(0.55);
          if (dist <= 7.5) onPlayerHit(38, this.pos);
          const count = this.phase === 3 ? 16 : 12;
          for (let i = 0; i < count; i++) {
            const a = (i / count) * Math.PI * 2 + this.yaw;
            const dir = new THREE.Vector3(Math.sin(a), 0, Math.cos(a));
            particles.spawnProjectile({
              owner: 'enemy',
              pos: this.pos.clone().addScaledVector(dir, 1.7),
              dir,
              speed: 15.0,
              damage: 28,
              radius: 0.46,
              color: PALETTE.dawnSun,
              maxDist: 30,
            });
          }
          this.state = 'recover';
          this.stateTimer = 0.46;
        } else if (this.currentPattern === 'sun_fan') {
          const base = Math.atan2(dx, dz);
          for (const off of [-0.42, -0.21, 0, 0.21, 0.42]) {
            const dir = new THREE.Vector3(Math.sin(base + off), 0, Math.cos(base + off));
            particles.spawnProjectile({
              owner: 'enemy',
              pos: this.pos.clone().addScaledVector(dir, 1.5),
              dir,
              speed: 17.5,
              damage: 27,
              radius: 0.45,
              color: PALETTE.kintsugiBright,
              maxDist: 32,
            });
          }
          sound.playBolt();
          this.state = 'recover';
          this.stateTimer = 0.36;
        }
      }
    } else if (this.state === 'charge') {
      this.stateTimer -= dt;
      vx = this.chargeDir.x * 23.0;
      vz = this.chargeDir.z * 23.0;
      particles.spawnDashGhost(this.pos, this.yaw, PALETTE.dawnSun);
      if (!this.chargeHit && dist < this.radius + player.radius + 0.85) {
        this.chargeHit = true;
        onPlayerHit(32, this.pos);
        onTrauma(0.5);
      }
      if (this.stateTimer <= 0) {
        particles.spawnRingWave(this.pos, 5.2, PALETTE.dawnSun, 0.42);
        sound.playHit(true);
        this.state = 'recover';
        this.stateTimer = 0.52;
      }
    } else if (this.state === 'recover') {
      this.stateTimer -= dt;
      this.spear.rotation.x += (0 - this.spear.rotation.x) * Math.min(1, dt * 8);
      if (this.stateTimer <= 0) this.state = 'chase';
    }

    this.pos.x += vx * dt;
    this.pos.z += vz * dt;
    collision.resolveCircle(this.pos, this.radius);
    this.group.position.set(this.pos.x, 0, this.pos.z);
    this.group.rotation.y = this.yaw;
  }
}
