import * as THREE from 'three';
import { ENEMY_ARCHETYPES } from '../config/gameData.js';
import { PALETTE } from '../config/palette.js';

/**
 * KILNWARD — Procedural Enemies (Acts I–IV)
 * Husk, Censer Acolyte, Kiln Skitterer, Reliquary Sentinel,
 * Gale Harrier (Act II), Salt Halberdier (Act II/IV), Mosaic Prism (Act III).
 */
export class Enemy {
  constructor(scene, textures, type, x, z, opts = {}) {
    const def = ENEMY_ARCHETYPES[type];
    this.scene = scene;
    this.textures = textures;
    this.type = type;
    this.def = def;
    this.zone = opts.zone || 'crossroads';
    this.gauntletWave = opts.gauntletWave || false;

    this.pos = new THREE.Vector3(x, 0, z);
    this.homePos = new THREE.Vector3(x, 0, z);
    this.yaw = Math.random() * Math.PI * 2;
    this.radius = def.radius;

    this.maxHp = def.maxHp;
    this.hp = def.maxHp;
    this.alive = true;

    this.state = 'idle';
    this.stateTimer = 0;
    this.attackCooldown = 0.5 + Math.random() * 0.5;
    this.hitFlashTimer = 0;
    this.staggerTimer = 0;
    this.knockback = new THREE.Vector3();
    this.lungeDir = new THREE.Vector3();
    this.hasDealtLungeHit = false;

    this._buildMesh();
  }

  _buildMesh() {
    this.group = new THREE.Group();
    this.group.position.copy(this.pos);

    let bodyColor = PALETTE.boneIvory;
    if (this.type === 'acolyte') bodyColor = 0x263f47;
    else if (this.type === 'skitterer') bodyColor = 0xb55336;
    else if (this.type === 'gale_harrier') bodyColor = PALETTE.saltWhite;
    else if (this.type === 'salt_halberdier') bodyColor = 0xcfdbe8;
    else if (this.type === 'mosaic_construct') bodyColor = 0x214594;

    this.bodyMat = new THREE.MeshStandardMaterial({
      color: bodyColor,
      map: this.textures.porcelain,
      roughness: 0.48,
      metalness: 0.18,
    });
    const darkBronze = new THREE.MeshStandardMaterial({
      color: 0x2b363c,
      roughness: 0.48,
      metalness: 0.72,
    });
    const accentHex =
      this.type === 'acolyte'
        ? PALETTE.verdigrisGlow
        : this.type === 'gale_harrier' || this.type === 'salt_halberdier'
          ? PALETTE.stormCyan
          : this.type === 'mosaic_construct'
            ? PALETTE.laserGold
            : PALETTE.kilnAmber;
    const emberMat = new THREE.MeshBasicMaterial({ color: accentHex });

    this.visual = new THREE.Group();

    if (this.type === 'husk') {
      const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.44, 1.15, 8), this.bodyMat);
      torso.position.y = 0.75;
      torso.castShadow = true;
      const head = new THREE.Mesh(new THREE.DodecahedronGeometry(0.3, 0), this.bodyMat);
      head.position.set(0, 1.52, 0.08);
      head.castShadow = true;
      const eye = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.08, 0.1), emberMat);
      eye.position.set(0, 1.54, 0.28);
      const club = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.14, 1.2, 6), darkBronze);
      club.position.set(0.45, 0.95, 0.35);
      club.rotation.x = 0.7;
      this.visual.add(torso, head, eye, club);
    } else if (this.type === 'acolyte') {
      const robe = new THREE.Mesh(new THREE.ConeGeometry(0.55, 1.55, 10), this.bodyMat);
      robe.position.y = 0.98;
      robe.castShadow = true;
      const hood = new THREE.Mesh(new THREE.ConeGeometry(0.36, 0.55, 8), darkBronze);
      hood.position.y = 1.85;
      const censer = new THREE.Mesh(new THREE.OctahedronGeometry(0.24, 0), emberMat);
      censer.position.set(0.52, 1.35, 0.35);
      this.censer = censer;
      this.visual.add(robe, hood, censer);
    } else if (this.type === 'skitterer') {
      const body = new THREE.Mesh(new THREE.SphereGeometry(0.48, 10, 8), this.bodyMat);
      body.scale.set(1.15, 0.72, 1.3);
      body.position.y = 0.58;
      body.castShadow = true;
      const core = new THREE.Mesh(new THREE.SphereGeometry(0.24, 8, 8), emberMat);
      core.position.set(0, 0.72, -0.25);
      this.visual.add(body, core);
      for (const side of [-1, 1]) {
        for (const zOff of [-0.32, 0.22]) {
          const leg = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.1, 0.1), darkBronze);
          leg.position.set(side * 0.58, 0.35, zOff);
          leg.rotation.z = side * -0.55;
          this.visual.add(leg);
        }
      }
    } else if (this.type === 'reliquary_guard' || this.type === 'salt_halberdier') {
      const armor = new THREE.Mesh(
        new THREE.CylinderGeometry(0.56, 0.72, 1.65, 10),
        this.type === 'salt_halberdier' ? new THREE.MeshStandardMaterial({ color: 0x2d4368, metalness: 0.72 }) : darkBronze
      );
      armor.position.y = 0.92;
      armor.castShadow = true;
      const pauldrons = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.45, 0.65), this.bodyMat);
      pauldrons.position.y = 1.65;
      pauldrons.castShadow = true;
      const helm = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.4, 0.55, 8), this.bodyMat);
      helm.position.y = 2.15;
      const crown = new THREE.Mesh(new THREE.TorusGeometry(0.38, 0.06, 6, 14), emberMat);
      crown.rotation.x = Math.PI / 2;
      crown.position.y = 2.48;
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.75, 6), darkBronze);
      pole.position.set(0.75, 1.4, 0.35);
      pole.rotation.x = 0.35;
      const axe = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.68, 0.54), emberMat);
      axe.position.set(0.75, 2.42, 0.82);
      this.visual.add(armor, pauldrons, helm, crown, pole, axe);
    } else if (this.type === 'gale_harrier') {
      // Winged porcelain storm gargoyle
      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.38, 1.25, 8), this.bodyMat);
      body.position.y = 1.25;
      body.castShadow = true;
      const crest = new THREE.Mesh(new THREE.ConeGeometry(0.32, 0.65, 6), emberMat);
      crest.position.y = 2.15;
      for (const side of [-1, 1]) {
        const wing = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.42, 0.1), this.bodyMat);
        wing.position.set(side * 0.75, 1.55, -0.15);
        wing.rotation.z = side * 0.35;
        this.visual.add(wing);
      }
      this.visual.add(body, crest);
    } else if (this.type === 'mosaic_construct') {
      // Levitating lapis-and-gold celestial prism
      const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.72, 0), this.bodyMat);
      core.position.y = 1.45;
      core.castShadow = true;
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.95, 0.07, 8, 20), emberMat);
      ring.position.y = 1.45;
      this.censer = ring;
      this.visual.add(core, ring);
    }

    const barW = this.def.elite ? 1.55 : 1.05;
    this.hpBarGroup = new THREE.Group();
    this.hpBarGroup.position.y = this.def.height + 0.55;
    const bg = new THREE.Mesh(
      new THREE.PlaneGeometry(barW, 0.14),
      new THREE.MeshBasicMaterial({ color: 0x0b0e16, side: THREE.DoubleSide })
    );
    this.hpFill = new THREE.Mesh(
      new THREE.PlaneGeometry(barW - 0.06, 0.09),
      new THREE.MeshBasicMaterial({
        color: this.def.elite ? PALETTE.kintsugiGold : PALETTE.emberCrimson,
        side: THREE.DoubleSide,
      })
    );
    this.hpFill.position.z = 0.01;
    this.hpBarW = barW - 0.06;
    this.hpBarGroup.add(bg, this.hpFill);
    this.hpBarGroup.visible = false;

    this.group.add(this.visual, this.hpBarGroup);
    this.scene.add(this.group);
  }

  takeDamage(amount, sourcePos, knockStrength, heavy = false) {
    if (!this.alive) return 0;
    this.hp = Math.max(0, this.hp - amount);
    this.hitFlashTimer = 0.16;
    this.hpBarGroup.visible = true;
    const ratio = Math.max(0.001, this.hp / this.maxHp);
    this.hpFill.scale.x = ratio;
    this.hpFill.position.x = -(1 - ratio) * (this.hpBarW * 0.5);

    if (sourcePos) {
      const dx = this.pos.x - sourcePos.x;
      const dz = this.pos.z - sourcePos.z;
      const len = Math.hypot(dx, dz) || 1;
      const poiseScale = 1 / this.def.poise;
      this.knockback.x += (dx / len) * knockStrength * poiseScale;
      this.knockback.z += (dz / len) * knockStrength * poiseScale;
    }

    if (heavy && this.def.poise <= 2) {
      this.staggerTimer = 0.25;
      if (this.state === 'windup') {
        this.state = 'chase';
      }
    }

    if (this.hp <= 0) {
      this.alive = false;
      this.scene.remove(this.group);
    }
    return amount;
  }

  update(dt, elapsed, player, collision, particles, sound, camera, onPlayerHit) {
    if (!this.alive) return;

    this.hitFlashTimer = Math.max(0, this.hitFlashTimer - dt);
    this.attackCooldown = Math.max(0, this.attackCooldown - dt);
    this.staggerTimer = Math.max(0, this.staggerTimer - dt);

    if (this.hpBarGroup.visible) {
      this.hpBarGroup.quaternion.copy(camera.quaternion);
    }

    this.bodyMat.emissive.setHex(this.hitFlashTimer > 0 ? 0xffd275 : 0x000000);
    this.bodyMat.emissiveIntensity = this.hitFlashTimer > 0 ? 1.4 : 0;

    const dx = player.pos.x - this.pos.x;
    const dz = player.pos.z - this.pos.z;
    const dist = Math.hypot(dx, dz);
    const toPlayerYaw = Math.atan2(dx, dz);
    const isRanged = this.type === 'acolyte' || this.type === 'gale_harrier' || this.type === 'mosaic_construct';

    let vx = 0;
    let vz = 0;

    if (this.staggerTimer <= 0 && player.alive) {
      if (this.state === 'idle') {
        if (dist < this.def.aggroRange || this.gauntletWave) {
          this.state = 'chase';
        }
      } else if (this.state === 'chase') {
        this.yaw = toPlayerYaw;

        if (isRanged) {
          if (dist > this.def.preferredDist + 1.5) {
            vx = (dx / dist) * this.def.speed;
            vz = (dz / dist) * this.def.speed;
          } else if (dist < this.def.preferredDist - 2.5) {
            vx = -(dx / dist) * this.def.speed * 0.7;
            vz = -(dz / dist) * this.def.speed * 0.7;
          }
          if (dist <= this.def.attackRange && this.attackCooldown <= 0) {
            this.state = 'windup';
            this.stateTimer = this.def.windup;
            particles.spawnTelegraphCircle(
              this.pos.x,
              this.pos.z,
              1.45,
              this.def.windup,
              this.type === 'mosaic_construct' ? PALETTE.laserGold : PALETTE.stormCyan
            );
          }
        } else {
          if (dist > this.def.attackRange * 0.85) {
            vx = (dx / dist) * this.def.speed;
            vz = (dz / dist) * this.def.speed;
          }
          if (dist <= this.def.attackRange && this.attackCooldown <= 0) {
            this.state = 'windup';
            this.stateTimer = this.def.windup;
            this.lungeDir.set(dx / (dist || 1), 0, dz / (dist || 1));

            if (this.type === 'skitterer') {
              particles.spawnTelegraphCone(this.pos, this.yaw, 5.0, 0.55, this.def.windup, PALETTE.kilnAmber);
            } else if (this.type === 'reliquary_guard' || this.type === 'salt_halberdier') {
              particles.spawnTelegraphCone(this.pos, this.yaw, 3.85, Math.PI * 0.85, this.def.windup, PALETTE.telegraphRed);
            } else {
              particles.spawnTelegraphCone(this.pos, this.yaw, 2.7, Math.PI * 0.65, this.def.windup, PALETTE.telegraphRed);
            }
          }
        }
      } else if (this.state === 'windup') {
        this.stateTimer -= dt;
        this.visual.position.y = Math.sin(elapsed * 42) * 0.06;
        if (this.stateTimer <= 0) {
          this.visual.position.y = 0;
          this._executeAttack(player, dist, dx, dz, particles, sound, onPlayerHit);
        }
      } else if (this.state === 'lunge') {
        this.stateTimer -= dt;
        vx = this.lungeDir.x * this.def.lungeSpeed;
        vz = this.lungeDir.z * this.def.lungeSpeed;
        if (!this.hasDealtLungeHit && dist < this.radius + player.radius + 0.45) {
          this.hasDealtLungeHit = true;
          onPlayerHit(this.def.damage, this.pos);
        }
        if (this.stateTimer <= 0) {
          this.state = 'recover';
          this.stateTimer = 0.45;
        }
      } else if (this.state === 'recover') {
        this.stateTimer -= dt;
        if (this.stateTimer <= 0) {
          this.state = 'chase';
        }
      }
    }

    this.pos.x += (vx + this.knockback.x) * dt;
    this.pos.z += (vz + this.knockback.z) * dt;
    this.knockback.multiplyScalar(Math.exp(-10 * dt));
    collision.resolveCircle(this.pos, this.radius);

    this.group.position.set(this.pos.x, 0, this.pos.z);
    this.group.rotation.y = this.yaw;

    if (isRanged) {
      this.visual.position.y = 0.25 + Math.sin(elapsed * 3.4 + this.homePos.x) * 0.16;
      if (this.censer) {
        this.censer.rotation.y += dt * 3;
        this.censer.rotation.x += dt * 1.4;
      }
    } else if (this.state === 'chase' && Math.hypot(vx, vz) > 0.5) {
      this.visual.position.y = Math.abs(Math.sin(elapsed * 10 + this.homePos.z)) * 0.1;
    }
  }

  _executeAttack(player, dist, dx, dz, particles, sound, onPlayerHit) {
    this.attackCooldown = this.def.cooldown;

    if (this.type === 'acolyte') {
      // 2-bolt staggered arcane spread
      const base = Math.atan2(dx, dz);
      for (const off of [-0.14, 0.14]) {
        const dir = new THREE.Vector3(Math.sin(base + off), 0, Math.cos(base + off));
        particles.spawnProjectile({
          owner: 'enemy',
          pos: this.pos.clone().addScaledVector(dir, 0.8),
          dir,
          speed: this.def.projectileSpeed,
          damage: this.def.damage,
          radius: 0.4,
          color: PALETTE.kilnAmber,
          maxDist: 23,
        });
      }
      sound.playBolt();
      this.state = 'recover';
      this.stateTimer = 0.28;
    } else if (this.type === 'gale_harrier') {
      // 3-bolt storm fan!
      const base = Math.atan2(dx, dz);
      for (const off of [-0.24, 0, 0.24]) {
        const dir = new THREE.Vector3(Math.sin(base + off), 0, Math.cos(base + off));
        particles.spawnProjectile({
          owner: 'enemy',
          pos: this.pos.clone().addScaledVector(dir, 0.9),
          dir,
          speed: this.def.projectileSpeed,
          damage: this.def.damage,
          radius: 0.4,
          color: PALETTE.stormCyan,
          maxDist: 25,
        });
      }
      sound.playBolt();
      this.state = 'recover';
      this.stateTimer = 0.32;
    } else if (this.type === 'mosaic_construct') {
      // 6-way golden prism volley!
      const base = Math.atan2(dx, dz);
      for (let i = 0; i < 6; i++) {
        const a = base + (i * Math.PI) / 3;
        const dir = new THREE.Vector3(Math.sin(a), 0, Math.cos(a));
        particles.spawnProjectile({
          owner: 'enemy',
          pos: this.pos.clone().addScaledVector(dir, 0.9),
          dir,
          speed: this.def.projectileSpeed,
          damage: this.def.damage,
          radius: 0.42,
          color: PALETTE.laserGold,
          maxDist: 23,
        });
      }
      sound.playChime(true);
      this.state = 'recover';
      this.stateTimer = 0.36;
    } else if (this.type === 'skitterer') {
      this.state = 'lunge';
      this.stateTimer = 0.28;
      this.hasDealtLungeHit = false;
      sound.playDash();
    } else {
      const isElite = this.type === 'reliquary_guard' || this.type === 'salt_halberdier';
      const reach = isElite ? 4.35 : 2.95;
      particles.spawnSlashArc(this.pos, this.yaw, isElite ? 2 : 0, isElite, isElite ? 1.25 : 1.0);
      if (isElite) {
        particles.spawnRingWave(this.pos, 4.4, PALETTE.kilnAmber, 0.38);
      }
      sound.playSwing(isElite ? 2 : 0, isElite);
      if (dist <= reach) {
        const angToPlayer = Math.atan2(dx, dz);
        let diff = Math.abs(angToPlayer - this.yaw);
        if (diff > Math.PI) diff = Math.PI * 2 - diff;
        if (isElite || diff < 1.2) {
          onPlayerHit(this.def.damage, this.pos);
        }
      }
      this.state = 'recover';
      this.stateTimer = 0.34;
    }
  }
}
