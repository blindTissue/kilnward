import * as THREE from 'three';
import { PALETTE } from '../config/palette.js';

/**
 * KILNWARD — Boss: SAINT CASSIAN, THE FRACTURED KILN
 * Multi-phase Diablo/Swordigo-style cathedral warden:
 *   Phase 1 (100%–55%): Sweeping Halberd Cleave, Molten Pillar Slam, Cinder Volley
 *   Phase 2 (<55% "THE GLAZE SHATTERS"): Ignited molten cracks, Kiln Dash Charge,
 *     Radial Bell-Toll Volley, and one-time Skitterer summon.
 */
export class Boss {
  constructor(scene, textures, x, z) {
    this.scene = scene;
    this.textures = textures;
    this.pos = new THREE.Vector3(x, 0, z);
    this.homePos = new THREE.Vector3(x, 0, z);
    this.yaw = 0; // Facing South (+z) toward entrance
    this.radius = 1.45;

    this.name = 'SAINT CASSIAN, THE FRACTURED KILN';
    this.maxHp = 1050;
    this.hp = this.maxHp;
    this.phase = 1;
    this.active = false;
    this.alive = true;
    this.summonedAdds = false;

    this.state = 'dormant'; // dormant | chase | windup | charge | recover
    this.stateTimer = 0;
    this.attackCooldown = 1.1;
    this.currentPattern = null;
    this.patternIndex = 0;
    this.hitFlashTimer = 0;
    this.slamTarget = new THREE.Vector3();
    this.chargeDir = new THREE.Vector3();
    this.chargeHitDone = false;

    this._buildMesh();
  }

  _buildMesh() {
    this.group = new THREE.Group();
    this.group.position.copy(this.pos);

    this.porcelainMat = new THREE.MeshStandardMaterial({
      color: PALETTE.porcelainWhite,
      map: this.textures.porcelain,
      roughness: 0.38,
      metalness: 0.18,
    });
    this.furnaceMat = new THREE.MeshStandardMaterial({
      color: PALETTE.moltenGold,
      emissive: PALETTE.kilnAmber,
      emissiveIntensity: 1.35,
      roughness: 0.25,
    });
    const bronzeMat = new THREE.MeshStandardMaterial({
      color: 0x3b2c2a,
      roughness: 0.42,
      metalness: 0.78,
    });
    const goldMat = new THREE.MeshStandardMaterial({
      color: PALETTE.kintsugiGold,
      emissive: PALETTE.kintsugiGold,
      emissiveIntensity: 0.65,
      roughness: 0.28,
      metalness: 0.85,
    });

    // Monumental bell-shaped armored lower skirt
    const skirt = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 1.45, 1.9, 14), bronzeMat);
    skirt.position.y = 0.95;
    skirt.castShadow = true;

    // Furnace ribcage core (glows dramatically brighter in Phase 2)
    const core = new THREE.Mesh(new THREE.CylinderGeometry(0.72, 0.82, 1.25, 12), this.furnaceMat);
    core.position.y = 2.25;

    // Cracked porcelain cuirass plates
    const chestPlate = new THREE.Mesh(new THREE.BoxGeometry(1.75, 1.05, 1.1), this.porcelainMat);
    chestPlate.position.y = 2.35;
    chestPlate.castShadow = true;

    // Broad ornate shoulder bells
    for (const side of [-1, 1]) {
      const pauldron = new THREE.Mesh(new THREE.ConeGeometry(0.68, 0.95, 10), this.porcelainMat);
      pauldron.position.set(side * 1.18, 2.85, 0);
      pauldron.rotation.z = side * -0.35;
      pauldron.castShadow = true;
      this.group.add(pauldron);
    }

    // Porcelain Saint Head & Bell-Mitre Crown
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.46, 12, 12), this.porcelainMat);
    head.position.y = 3.25;
    const mitre = new THREE.Mesh(new THREE.ConeGeometry(0.55, 1.15, 8), goldMat);
    mitre.position.y = 4.05;
    const halo = new THREE.Mesh(new THREE.TorusGeometry(0.95, 0.08, 8, 24), goldMat);
    halo.position.set(0, 3.65, -0.35);
    this.halo = halo;

    // Crucible Glaive Weapon Pivot
    this.glaivePivot = new THREE.Group();
    this.glaivePivot.position.set(1.25, 2.35, 0.2);
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.09, 4.4, 8), bronzeMat);
    shaft.rotation.x = Math.PI / 2.6;
    shaft.position.set(0, 0, 1.1);
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.85, 1.55), this.furnaceMat);
    blade.position.set(0, 0.65, 2.75);
    this.glaivePivot.add(shaft, blade);

    this.auraLight = new THREE.PointLight(PALETTE.moltenGold, 7.5, 18, 1.5);
    this.auraLight.position.set(0, 2.6, 0.6);

    this.group.add(skirt, core, chestPlate, head, mitre, halo, this.glaivePivot, this.auraLight);
    this.scene.add(this.group);
  }

  awaken(sound, particles) {
    if (this.active || !this.alive) return;
    this.active = true;
    this.state = 'chase';
    this.attackCooldown = 1.0;
    sound.playBossHorn();
    particles.spawnRingWave(this.pos, 9.5, PALETTE.moltenGold, 0.85);
  }

  reset() {
    this.pos.copy(this.homePos);
    this.group.position.copy(this.pos);
    this.hp = this.maxHp;
    this.phase = 1;
    this.active = false;
    this.alive = true;
    this.summonedAdds = false;
    this.state = 'dormant';
    this.furnaceMat.emissiveIntensity = 1.35;
    this.auraLight.intensity = 7.5;
    this.group.visible = true;
  }

  takeDamage(amount, particles, sound, onPhaseTwo) {
    if (!this.alive || !this.active) return 0;
    this.hp = Math.max(0, this.hp - amount);
    this.hitFlashTimer = 0.14;

    if (this.phase === 1 && this.hp > 0 && this.hp <= this.maxHp * 0.55) {
      this.phase = 2;
      this.furnaceMat.emissiveIntensity = 2.6;
      this.auraLight.intensity = 13.5;
      particles.spawnRingWave(this.pos, 11.5, PALETTE.kintsugiBright, 0.85);
      particles.spawnBurst(new THREE.Vector3(this.pos.x, 2.2, this.pos.z), PALETTE.porcelainWhite, 26, 11, true);
      sound.playShatter();
      sound.playBossHorn();
      if (onPhaseTwo) onPhaseTwo();
    }

    if (this.hp <= 0) {
      this.alive = false;
      this.active = false;
      particles.spawnBurst(new THREE.Vector3(this.pos.x, 2.2, this.pos.z), PALETTE.kintsugiBright, 36, 12, true);
      particles.spawnRingWave(this.pos, 14, PALETTE.kintsugiGold, 1.0);
      sound.playShatter();
      sound.playBellToll(196, 3.2);
      this.group.visible = false;
    }
    return amount;
  }

  update(dt, elapsed, player, collision, particles, sound, onPlayerHit, onTrauma) {
    if (!this.alive) return;

    this.halo.rotation.z = elapsed * (this.phase === 2 ? 1.8 : 0.65);
    this.hitFlashTimer = Math.max(0, this.hitFlashTimer - dt);
    this.porcelainMat.emissive.setHex(this.hitFlashTimer > 0 ? 0xffd57a : this.phase === 2 ? 0x6b2809 : 0x000000);
    this.porcelainMat.emissiveIntensity = this.hitFlashTimer > 0 ? 1.5 : this.phase === 2 ? 0.55 : 0;

    if (!this.active || !player.alive) return;

    this.attackCooldown = Math.max(0, this.attackCooldown - dt);
    const dx = player.pos.x - this.pos.x;
    const dz = player.pos.z - this.pos.z;
    const dist = Math.hypot(dx, dz) || 1;
    const targetYaw = Math.atan2(dx, dz);

    let vx = 0;
    let vz = 0;
    const moveSpeed = this.phase === 2 ? 5.2 : 4.1;

    if (this.state === 'chase') {
      this.yaw = targetYaw;
      if (dist > 4.2) {
        vx = (dx / dist) * moveSpeed;
        vz = (dz / dist) * moveSpeed;
      }

      if (this.attackCooldown <= 0) {
        this._chooseNextAttack(player, dist, dx, dz, particles, sound);
      }
    } else if (this.state === 'windup') {
      this.stateTimer -= dt;
      this.glaivePivot.rotation.x = -0.65;
      if (this.stateTimer <= 0) {
        this.glaivePivot.rotation.x = 0.4;
        this._executePattern(player, dist, dx, dz, particles, sound, onPlayerHit, onTrauma);
      }
    } else if (this.state === 'charge') {
      this.stateTimer -= dt;
      vx = this.chargeDir.x * 19.5;
      vz = this.chargeDir.z * 19.5;
      if (!this.chargeHitDone && dist < this.radius + player.radius + 0.75) {
        this.chargeHitDone = true;
        onPlayerHit(28, this.pos);
        onTrauma(0.5);
      }
      if (this.stateTimer <= 0) {
        particles.spawnRingWave(this.pos, 4.8, PALETTE.moltenGold, 0.4);
        sound.playHit(true);
        onTrauma(0.35);
        this.state = 'recover';
        this.stateTimer = 0.65;
      }
    } else if (this.state === 'recover') {
      this.stateTimer -= dt;
      this.glaivePivot.rotation.x += (0 - this.glaivePivot.rotation.x) * Math.min(1, dt * 7);
      if (this.stateTimer <= 0) {
        this.state = 'chase';
      }
    }

    this.pos.x += vx * dt;
    this.pos.z += vz * dt;
    collision.resolveCircle(this.pos, this.radius);

    this.group.position.set(this.pos.x, 0, this.pos.z);
    this.group.rotation.y = this.yaw;
  }

  _chooseNextAttack(player, dist, dx, dz, particles, sound) {
    const p1Patterns = ['cleave', 'slam', 'volley'];
    const p2Patterns = ['cleave', 'charge', 'bell_nova', 'slam'];
    const list = this.phase === 2 ? p2Patterns : p1Patterns;

    // Pick cleave if close, otherwise cycle deterministically for fair rhythm
    let pat = list[this.patternIndex % list.length];
    this.patternIndex++;
    if (dist < 4.5 && pat === 'volley') pat = 'cleave';

    this.currentPattern = pat;
    this.state = 'windup';

    if (pat === 'cleave') {
      this.stateTimer = this.phase === 2 ? 0.62 : 0.76;
      particles.spawnTelegraphCone(this.pos, this.yaw, 5.4, Math.PI * 0.9, this.stateTimer, PALETTE.telegraphRed);
    } else if (pat === 'slam') {
      this.stateTimer = 0.88;
      this.slamTarget.copy(player.pos);
      particles.spawnTelegraphCircle(this.slamTarget.x, this.slamTarget.z, 4.1, this.stateTimer, PALETTE.moltenGold);
    } else if (pat === 'volley') {
      this.stateTimer = 0.65;
      particles.spawnTelegraphCircle(this.pos.x, this.pos.z, 2.3, this.stateTimer, PALETTE.kilnAmber);
    } else if (pat === 'charge') {
      this.stateTimer = 0.68;
      this.chargeDir.set(dx / dist, 0, dz / dist);
      particles.spawnTelegraphCone(this.pos, this.yaw, 11.5, 0.34, this.stateTimer, PALETTE.telegraphRed);
      sound.playBossHorn();
    } else if (pat === 'bell_nova') {
      this.stateTimer = 0.85;
      particles.spawnTelegraphCircle(this.pos.x, this.pos.z, 6.2, this.stateTimer, PALETTE.kintsugiBright);
    }
  }

  _executePattern(player, dist, dx, dz, particles, sound, onPlayerHit, onTrauma) {
    const cdBase = this.phase === 2 ? 0.82 : 1.18;
    this.attackCooldown = cdBase;

    if (this.currentPattern === 'cleave') {
      particles.spawnSlashArc(this.pos, this.yaw, 2, true, 1.3);
      sound.playSwing(2);
      onTrauma(0.32);
      if (dist <= 5.8) {
        const ang = Math.atan2(dx, dz);
        let diff = Math.abs(ang - this.yaw);
        if (diff > Math.PI) diff = Math.PI * 2 - diff;
        if (diff < 1.55) {
          onPlayerHit(30, this.pos);
        }
      }
      this.state = 'recover';
      this.stateTimer = 0.42;
    } else if (this.currentPattern === 'slam') {
      particles.spawnRingWave(this.slamTarget, 4.5, PALETTE.moltenGold, 0.5);
      particles.spawnBurst(new THREE.Vector3(this.slamTarget.x, 0.8, this.slamTarget.z), PALETTE.kilnAmber, 18, 9);
      sound.playNova();
      onTrauma(0.5);
      const dSlam = Math.hypot(player.pos.x - this.slamTarget.x, player.pos.z - this.slamTarget.z);
      if (dSlam <= 4.35) {
        onPlayerHit(34, this.slamTarget);
      }
      // Radial cinder sparks from slam impact
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        particles.spawnProjectile({
          owner: 'enemy',
          pos: this.slamTarget.clone(),
          dir: new THREE.Vector3(Math.sin(a), 0, Math.cos(a)),
          speed: 13.0,
          damage: 20,
          radius: 0.4,
          color: PALETTE.kilnAmber,
          maxDist: 20,
        });
      }
      this.state = 'recover';
      this.stateTimer = 0.48;
    } else if (this.currentPattern === 'volley') {
      const baseAngle = Math.atan2(dx, dz);
      for (const offset of [-0.38, -0.19, 0, 0.19, 0.38]) {
        const a = baseAngle + offset;
        const dir = new THREE.Vector3(Math.sin(a), 0, Math.cos(a));
        particles.spawnProjectile({
          owner: 'enemy',
          pos: this.pos.clone().addScaledVector(dir, 1.4),
          dir,
          speed: 16.0,
          damage: 23,
          radius: 0.48,
          color: PALETTE.moltenGold,
          maxDist: 28,
        });
      }
      sound.playBolt();
      this.state = 'recover';
      this.stateTimer = 0.4;
    } else if (this.currentPattern === 'charge') {
      this.state = 'charge';
      this.stateTimer = 0.5;
      this.chargeHitDone = false;
      sound.playDash();
    } else if (this.currentPattern === 'bell_nova') {
      sound.playBellToll(164.8, 1.6);
      particles.spawnRingWave(this.pos, 6.8, PALETTE.kintsugiBright, 0.55);
      onTrauma(0.55);
      if (dist <= 6.5) {
        onPlayerHit(34, this.pos);
      }
      const count = 12;
      for (let i = 0; i < count; i++) {
        const a = (i / count) * Math.PI * 2 + this.yaw;
        const dir = new THREE.Vector3(Math.sin(a), 0, Math.cos(a));
        particles.spawnProjectile({
          owner: 'enemy',
          pos: this.pos.clone().addScaledVector(dir, 1.6),
          dir,
          speed: 13.5,
          damage: 22,
          radius: 0.45,
          color: PALETTE.kintsugiBright,
          maxDist: 28,
        });
      }
      this.state = 'recover';
      this.stateTimer = 0.52;
    }
  }
}
