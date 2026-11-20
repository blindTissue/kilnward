import * as THREE from 'three';
import { WORLD_LAYOUT } from '../config/worldLayout.js';
import { PALETTE } from '../config/palette.js';

/**
 * KILNWARD — Interactables, Breakable Urns & Magnetic Loot Orbs (Acts I–IV)
 */
export class InteractablesManager {
  constructor(scene, textures, collision) {
    this.scene = scene;
    this.textures = textures;
    this.collision = collision;

    this.interactables = [];
    this.urns = [];
    this.loot = [];
    this.discoveredShrines = new Set(['cloister_shrine']);
  }

  buildAll() {
    this._buildNPCs();
    this._buildShrines();
    this._buildSteles();
    this._buildBells();
    this._buildChests();
    this._buildWeaponPedestal();
    this._buildMirrorInteractables();
    this._buildUrns();
  }

  _buildNPCs() {
    for (const npc of WORLD_LAYOUT.npcs) {
      const group = new THREE.Group();
      group.position.set(npc.x, 0, npc.z);

      const isMaren = npc.style === 'maren';
      const robeMat = new THREE.MeshStandardMaterial({
        color: isMaren ? PALETTE.saltWhite : 0x2a454d,
        roughness: 0.7,
      });
      const porcMat = new THREE.MeshStandardMaterial({
        color: PALETTE.porcelainWhite,
        map: this.textures.porcelain,
        roughness: 0.38,
      });
      const accentMat = new THREE.MeshStandardMaterial({
        color: isMaren ? PALETTE.stormCyan : PALETTE.kintsugiGold,
        emissive: isMaren ? PALETTE.stormCyan : PALETTE.kintsugiGold,
        emissiveIntensity: 0.55,
      });

      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.54, 1.35, 10), robeMat);
      body.position.y = 0.68;
      body.castShadow = true;
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.28, 10, 10), porcMat);
      head.position.y = 1.62;
      const hat = new THREE.Mesh(new THREE.ConeGeometry(0.42, 0.52, 10), accentMat);
      hat.position.y = 2.02;
      const staff = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.2, 6), accentMat);
      staff.position.set(0.46, 1.1, 0.12);

      const marker = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.2, 0),
        new THREE.MeshBasicMaterial({ color: isMaren ? PALETTE.stormCyan : PALETTE.kintsugiBright })
      );
      marker.position.y = 2.75;

      group.add(body, head, hat, staff, marker);
      this.scene.add(group);
      this.collision.addCircle(npc.x, npc.z, 0.65);

      this.interactables.push({
        id: npc.id,
        kind: 'npc',
        x: npc.x,
        z: npc.z,
        radius: 3.2,
        label: `Speak to ${npc.name}`,
        group,
        marker,
      });
    }
  }

  spawnCassianEcho(x, z) {
    if (this.interactables.some((i) => i.id === 'cassian_echo')) return;
    const group = new THREE.Group();
    group.position.set(x, 0, z);

    const ghostMat = new THREE.MeshStandardMaterial({
      color: PALETTE.kintsugiBright,
      emissive: PALETTE.kintsugiGold,
      emissiveIntensity: 1.35,
      transparent: true,
      opacity: 0.78,
    });
    const figure = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.72, 2.2, 12), ghostMat);
    figure.position.y = 1.2;
    const crown = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.07, 8, 20), ghostMat);
    crown.position.y = 2.65;
    crown.rotation.x = Math.PI / 2;
    const light = new THREE.PointLight(PALETTE.kintsugiBright, 8, 16);
    light.position.y = 2.0;

    group.add(figure, crown, light);
    this.scene.add(group);

    this.interactables.push({
      id: 'cassian_echo',
      kind: 'echo',
      x,
      z,
      radius: 3.8,
      label: 'Commune with Echo of Saint Cassian',
      group,
      marker: crown,
    });
  }

  spawnKilnHeart(x, z) {
    if (this.interactables.some((i) => i.id === 'kiln_heart')) return;
    const group = new THREE.Group();
    group.position.set(x, 0, z);

    const coreMat = new THREE.MeshStandardMaterial({
      color: PALETTE.kintsugiBright,
      emissive: PALETTE.dawnSun,
      emissiveIntensity: 2.2,
      roughness: 0.15,
    });
    const heart = new THREE.Mesh(new THREE.OctahedronGeometry(1.1, 1), coreMat);
    heart.position.y = 2.1;
    const ring1 = new THREE.Mesh(new THREE.TorusGeometry(1.65, 0.08, 8, 28), coreMat);
    ring1.position.y = 2.1;
    const light = new THREE.PointLight(PALETTE.dawnSun, 14, 24);
    light.position.y = 2.4;

    group.add(heart, ring1, light);
    this.scene.add(group);

    this.interactables.push({
      id: 'kiln_heart',
      kind: 'kiln_heart',
      x,
      z,
      radius: 4.2,
      label: 'Approach the Heart of the First Kiln [Choose Ending]',
      group,
      marker: ring1,
    });
  }

  _buildShrines() {
    for (const s of WORLD_LAYOUT.shrines) {
      const group = new THREE.Group();
      group.position.set(s.x, 0, s.z);

      const base = new THREE.Mesh(
        new THREE.CylinderGeometry(0.95, 1.15, 0.85, 10),
        new THREE.MeshStandardMaterial({ color: 0x2b3242, roughness: 0.55, metalness: 0.45 })
      );
      base.position.y = 0.42;
      base.castShadow = true;

      const anvil = new THREE.Mesh(
        new THREE.BoxGeometry(1.1, 0.45, 0.65),
        new THREE.MeshStandardMaterial({ color: PALETTE.kintsugiGold, roughness: 0.3, metalness: 0.8 })
      );
      anvil.position.y = 1.05;

      const flame = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.38, 0),
        new THREE.MeshBasicMaterial({ color: PALETTE.kintsugiBright })
      );
      flame.position.y = 1.72;

      group.add(base, anvil, flame);
      this.scene.add(group);
      this.collision.addCircle(s.x, s.z, 1.05);

      this.interactables.push({
        id: s.id,
        act: s.act,
        name: s.name,
        kind: 'shrine',
        x: s.x,
        z: s.z,
        radius: 3.2,
        label: `Rest, Temper & Fast Travel — ${s.name}`,
        group,
        marker: flame,
        respawn: s.respawn,
      });
    }
  }

  _buildSteles() {
    for (const st of WORLD_LAYOUT.steles) {
      const group = new THREE.Group();
      group.position.set(st.x, 0, st.z);

      const slab = new THREE.Mesh(
        new THREE.BoxGeometry(1.05, 2.4, 0.38),
        new THREE.MeshStandardMaterial({
          color: PALETTE.boneIvory,
          map: this.textures.porcelain,
          roughness: 0.55,
        })
      );
      slab.position.y = 1.2;
      slab.castShadow = true;

      const rune = new THREE.Mesh(
        new THREE.PlaneGeometry(0.56, 1.4),
        new THREE.MeshBasicMaterial({ color: PALETTE.verdigrisGlow, side: THREE.DoubleSide })
      );
      rune.position.set(0, 1.32, 0.21);

      group.add(slab, rune);
      this.scene.add(group);
      this.collision.addCircle(st.x, st.z, 0.72);

      this.interactables.push({
        id: st.id,
        kind: 'stele',
        x: st.x,
        z: st.z,
        radius: 3.1,
        label: 'Read Carved Lore Stele',
        group,
        rune,
        read: false,
      });
    }
  }

  _buildBells() {
    for (const b of WORLD_LAYOUT.bells) {
      const group = new THREE.Group();
      group.position.set(b.x, 0, b.z);

      const frameMat = new THREE.MeshStandardMaterial({ color: 0x2c343d, roughness: 0.45, metalness: 0.7 });
      const plinth = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.65, 0.5, 10), frameMat);
      plinth.position.y = 0.25;

      const postL = new THREE.Mesh(new THREE.BoxGeometry(0.32, 4.4, 0.32), frameMat);
      postL.position.set(-1.1, 2.2, 0);
      const postR = new THREE.Mesh(new THREE.BoxGeometry(0.32, 4.4, 0.32), frameMat);
      postR.position.set(1.1, 2.2, 0);
      const top = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.35, 0.42), frameMat);
      top.position.y = 4.4;

      const bellMat = new THREE.MeshStandardMaterial({
        color: PALETTE.kintsugiGold,
        emissive: b.color,
        emissiveIntensity: 0.35,
        roughness: 0.28,
        metalness: 0.85,
      });
      const bell = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.95, 1.65, 14), bellMat);
      bell.position.y = 3.05;
      bell.castShadow = true;

      const light = new THREE.PointLight(b.color, 5.5, 14);
      light.position.y = 3.1;

      group.add(plinth, postL, postR, top, bell, light);
      this.scene.add(group);
      this.collision.addCircle(b.x, b.z, 1.45);

      this.interactables.push({
        id: b.id,
        kind: 'bell',
        side: b.side,
        color: b.color,
        x: b.x,
        z: b.z,
        radius: 3.6,
        label: `Ring ${b.name}`,
        group,
        bell,
        bellMat,
        light,
        rung: false,
      });
    }
  }

  _buildWeaponPedestal() {
    const wp = WORLD_LAYOUT.weaponPedestal;
    const group = new THREE.Group();
    group.position.set(wp.x, 0, wp.z);

    const ped = new THREE.Mesh(
      new THREE.CylinderGeometry(0.85, 1.05, 1.0, 10),
      new THREE.MeshStandardMaterial({ color: 0x1e3668, roughness: 0.45, metalness: 0.6 })
    );
    ped.position.y = 0.5;
    const hammer = new THREE.Mesh(
      new THREE.CylinderGeometry(0.32, 0.5, 0.85, 12),
      new THREE.MeshStandardMaterial({
        color: PALETTE.kintsugiGold,
        emissive: PALETTE.kintsugiBright,
        emissiveIntensity: 1.2,
        metalness: 0.85,
      })
    );
    hammer.position.y = 1.8;
    hammer.rotation.z = 0.6;
    const light = new THREE.PointLight(PALETTE.kintsugiGold, 6, 12);
    light.position.y = 2.0;

    group.add(ped, hammer, light);
    this.scene.add(group);
    this.collision.addCircle(wp.x, wp.z, 0.95);

    this.interactables.push({
      id: wp.id,
      kind: 'weapon_pedestal',
      x: wp.x,
      z: wp.z,
      radius: 3.1,
      label: wp.label,
      group,
      marker: hammer,
      claimed: false,
    });
  }

  _buildMirrorInteractables() {
    for (const m of WORLD_LAYOUT.mirrorPuzzle.mirrors) {
      this.interactables.push({
        id: m.id,
        kind: 'mirror',
        x: m.x,
        z: m.z,
        radius: 3.2,
        label: 'Rotate Bronze Mirror 90° [F]',
      });
    }
  }

  _buildChests() {
    for (const c of WORLD_LAYOUT.chests) {
      const group = new THREE.Group();
      group.position.set(c.x, 0, c.z);

      const boxMat = new THREE.MeshStandardMaterial({ color: 0x33241a, roughness: 0.45, metalness: 0.55 });
      const trimMat = new THREE.MeshStandardMaterial({
        color: PALETTE.kintsugiGold,
        emissive: PALETTE.kintsugiGold,
        emissiveIntensity: 0.9,
        roughness: 0.25,
        metalness: 0.85,
      });

      const base = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.72, 1.0), boxMat);
      base.position.y = 0.36;
      base.castShadow = true;

      const lid = new THREE.Mesh(new THREE.BoxGeometry(1.56, 0.32, 1.04), trimMat);
      lid.position.y = 0.88;

      const aura = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.28, 0),
        new THREE.MeshBasicMaterial({ color: PALETTE.kintsugiBright })
      );
      aura.position.y = 1.65;

      group.add(base, lid, aura);
      this.scene.add(group);
      this.collision.addCircle(c.x, c.z, 0.95);

      this.interactables.push({
        id: c.id,
        kind: 'chest',
        x: c.x,
        z: c.z,
        radius: 2.9,
        label: `Open ${c.label}`,
        group,
        lid,
        aura,
        light: { intensity: 0 },
        opened: false,
        locked: !!c.lockedByGauntlet,
        data: c,
      });
    }
  }

  _buildUrns() {
    const urnMat = new THREE.MeshStandardMaterial({
      color: PALETTE.boneIvory,
      map: this.textures.porcelain,
      roughness: 0.42,
      metalness: 0.14,
    });
    const bandMat = new THREE.MeshStandardMaterial({
      color: PALETTE.kintsugiGold,
      roughness: 0.3,
      metalness: 0.8,
    });

    for (const u of WORLD_LAYOUT.urns) {
      const group = new THREE.Group();
      group.position.set(u.x, 0, u.z);

      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.24, 0.95, 10), urnMat);
      body.position.y = 0.48;
      body.castShadow = true;
      const rim = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.05, 6, 12), bandMat);
      rim.rotation.x = Math.PI / 2;
      rim.position.y = 0.95;

      group.add(body, rim);
      this.scene.add(group);

      this.urns.push({
        x: u.x,
        z: u.z,
        radius: 0.62,
        alive: true,
        mesh: group,
      });
    }
  }

  unlockGauntletChest() {
    for (const it of this.interactables) {
      if (it.kind === 'chest' && it.locked) {
        it.locked = false;
      }
    }
  }

  spawnLoot(x, z, kind, value) {
    const color =
      kind === 'gold' ? PALETTE.kintsugiBright : kind === 'heal' ? 0x6ef0b4 : PALETTE.xpViolet;
    const size = kind === 'gold' ? 0.24 : 0.2;
    const mesh = new THREE.Mesh(
      new THREE.OctahedronGeometry(size, 0),
      new THREE.MeshBasicMaterial({ color })
    );
    const jitterX = (Math.random() - 0.5) * 1.1;
    const jitterZ = (Math.random() - 0.5) * 1.1;
    mesh.position.set(x + jitterX, 0.55, z + jitterZ);
    this.scene.add(mesh);

    this.loot.push({
      kind,
      value,
      pos: mesh.position.clone(),
      mesh,
      age: 0,
    });
  }

  breakUrn(urn, particles, sound) {
    if (!urn.alive) return false;
    urn.alive = false;
    this.scene.remove(urn.mesh);
    particles.spawnBurst(new THREE.Vector3(urn.x, 0.6, urn.z), PALETTE.porcelainWhite, 10, 6.5, true);
    sound.playShatter();

    const goldVal = 10 + Math.floor(Math.random() * 10);
    this.spawnLoot(urn.x, urn.z, 'gold', goldVal);
    if (Math.random() < 0.38) {
      this.spawnLoot(urn.x, urn.z, 'heal', 24);
    }
    return true;
  }

  findNearestInteractable(playerPos, mirrorSolved = false) {
    let best = null;
    let bestDist = Infinity;
    for (const it of this.interactables) {
      if (it.kind === 'chest' && (it.opened || it.locked)) continue;
      if (it.kind === 'bell' && it.rung) continue;
      if (it.kind === 'weapon_pedestal' && it.claimed) continue;
      if (it.kind === 'mirror' && mirrorSolved) continue;
      const d = Math.hypot(playerPos.x - it.x, playerPos.z - it.z);
      if (d <= it.radius && d < bestDist) {
        best = it;
        bestDist = d;
      }
    }
    return best;
  }

  update(dt, elapsed, player, onLootCollected) {
    for (const it of this.interactables) {
      if (it.marker && it.marker.visible) {
        it.marker.rotation.y += dt * 1.8;
        if (it.kind !== 'weapon_pedestal') {
          it.marker.position.y += Math.sin(elapsed * 3.5) * dt * 0.14;
        }
      }
      if (it.kind === 'bell' && it.rung) {
        it.bell.rotation.z = Math.sin(elapsed * 3.2) * 0.18;
      }
      if (it.kind === 'chest' && it.aura && !it.opened) {
        it.aura.visible = !it.locked;
        it.aura.rotation.y += dt * 2.2;
      }
    }

    for (let i = this.loot.length - 1; i >= 0; i--) {
      const l = this.loot[i];
      l.age += dt;
      l.mesh.rotation.y += dt * 3.6;
      l.mesh.position.y = 0.55 + Math.sin(elapsed * 5 + i) * 0.14;

      if (player.alive && l.age > 0.18) {
        const dx = player.pos.x - l.pos.x;
        const dz = player.pos.z - l.pos.z;
        const dist = Math.hypot(dx, dz);
        if (dist < 7.2) {
          const pull = Math.min(19, 8 + (7.2 - dist) * 2.5);
          l.pos.x += (dx / (dist || 1)) * pull * dt;
          l.pos.z += (dz / (dist || 1)) * pull * dt;
          l.mesh.position.x = l.pos.x;
          l.mesh.position.z = l.pos.z;
        }
        if (dist < 0.95) {
          this.scene.remove(l.mesh);
          this.loot.splice(i, 1);
          onLootCollected(l);
        }
      }
    }
  }
}
