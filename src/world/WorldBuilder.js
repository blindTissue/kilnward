import * as THREE from 'three';
import { WORLD_LAYOUT } from '../config/worldLayout.js';
import { PALETTE } from '../config/palette.js';

/**
 * KILNWARD — Procedural 4-Act Cathedral World Builder
 * Builds Acts I–IV geometry, Counterweight Bells, Mosaic Mirror Light Puzzle,
 * animated gates, crystal switch, braziers, and contextual locked-gate hints.
 */
export class WorldBuilder {
  constructor(scene, textures, collision) {
    this.scene = scene;
    this.textures = textures;
    this.collision = collision;

    this.braziers = [];
    this.gates = {};
    this.waterMeshes = [];
    this.lavaMeshes = [];
    this.sanctumSigils = {};
    this.crystalSwitch = null;
    this.counterweightBells = [];
    this.mirrorState = null;
    this.greatBellGroup = null;
  }

  build() {
    this._buildFloors();
    this._buildBasins();
    this._buildWalls();
    this._buildPillarsAndArches();
    this._buildCloisterFountain();
    this._buildCrossroadsCompass();
    this._buildBraziers();
    this._buildGates();
    this._buildCrystalSwitch();
    this._buildCounterweightBells();
    this._buildMirrorPuzzle();
    this._buildGreatBell();
  }

  _cloneTex(tex, rx, ry) {
    const t = tex.clone();
    t.needsUpdate = true;
    t.repeat.set(rx, ry);
    return t;
  }

  _buildFloors() {
    for (const f of WORLD_LAYOUT.floors) {
      let baseTex = this.textures.floorSlate;
      if (f.style === 'verdigris') baseTex = this.textures.floorVerdigris;
      else if (f.style === 'terracotta') baseTex = this.textures.floorTerracotta;
      else if (f.style === 'crucible') baseTex = this.textures.floorCrucible;
      else if (f.style === 'gold_runner') baseTex = this.textures.floorRunner;
      else if (f.style === 'salt') baseTex = this.textures.floorSalt;
      else if (f.style === 'cistern') baseTex = this.textures.floorCistern;
      else if (f.style === 'dawn') baseTex = this.textures.floorDawn;

      const rx = f.style === 'gold_runner' ? 1 : Math.max(1, Math.round(f.w / 6));
      const ry = Math.max(1, Math.round(f.d / 6));
      const mat = new THREE.MeshStandardMaterial({
        map: this._cloneTex(baseTex, rx, ry),
        roughness: f.style === 'verdigris' || f.style === 'cistern' ? 0.38 : 0.68,
        metalness: f.style === 'dawn' ? 0.2 : 0.14,
      });

      const mesh = new THREE.Mesh(new THREE.BoxGeometry(f.w, 0.8, f.d), mat);
      mesh.position.set(f.x, -0.4, f.z);
      mesh.receiveShadow = true;
      this.scene.add(mesh);

      const trimMat = new THREE.MeshStandardMaterial({
        color: f.style === 'salt' ? PALETTE.stormCyan : PALETTE.kintsugiGold,
        roughness: 0.35,
        metalness: 0.72,
      });
      const trim = new THREE.Mesh(new THREE.BoxGeometry(f.w + 0.25, 0.12, f.d + 0.25), trimMat);
      trim.position.set(f.x, -0.45, f.z);
      this.scene.add(trim);
    }
  }

  _buildBasins() {
    for (const b of WORLD_LAYOUT.basins) {
      const geo = new THREE.PlaneGeometry(b.w, b.d);
      geo.rotateX(-Math.PI / 2);
      let mat;
      if (b.kind === 'lava') {
        mat = new THREE.MeshStandardMaterial({
          color: PALETTE.moltenGold,
          emissive: PALETTE.kilnAmber,
          emissiveIntensity: 0.95,
          roughness: 0.35,
        });
      } else if (b.kind === 'abyss') {
        mat = new THREE.MeshStandardMaterial({
          color: PALETTE.abyssVoid,
          emissive: 0x101c34,
          emissiveIntensity: 0.4,
          roughness: 0.9,
        });
      } else if (b.kind === 'cistern_water') {
        mat = new THREE.MeshStandardMaterial({
          color: PALETTE.cisternTurquoise,
          emissive: 0x134e63,
          emissiveIntensity: 0.58,
          roughness: 0.12,
          metalness: 0.72,
        });
      } else if (b.kind === 'dawn_clouds') {
        mat = new THREE.MeshStandardMaterial({
          color: 0xd9967a,
          emissive: 0x7c4438,
          emissiveIntensity: 0.65,
          roughness: 0.85,
        });
      } else {
        mat = new THREE.MeshStandardMaterial({
          color: PALETTE.floodWater,
          emissive: PALETTE.verdigrisBronze,
          emissiveIntensity: 0.42,
          roughness: 0.12,
          metalness: 0.65,
        });
      }
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(b.x, b.y !== undefined ? b.y : -0.35, b.z);
      this.scene.add(mesh);
      if (b.kind === 'lava' || b.kind === 'dawn_clouds') this.lavaMeshes.push(mesh);
      else this.waterMeshes.push(mesh);
    }
  }

  _buildWalls() {
    for (const w of WORLD_LAYOUT.walls) {
      let baseTex = this.textures.wallSlate;
      if (w.style === 'verdigris') baseTex = this.textures.wallVerdigris;
      else if (w.style === 'terracotta') baseTex = this.textures.wallTerracotta;
      else if (w.style === 'crucible') baseTex = this.textures.wallCrucible;
      else if (w.style === 'salt') baseTex = this.textures.wallSalt;
      else if (w.style === 'cistern') baseTex = this.textures.wallCistern;
      else if (w.style === 'dawn') baseTex = this.textures.wallDawn;

      const isBalustrade = w.style === 'balustrade';
      const span = Math.max(w.w, w.d);
      const mat = new THREE.MeshStandardMaterial({
        map: this._cloneTex(baseTex, Math.max(1, Math.round(span / 5)), Math.max(1, Math.round(w.h / 4))),
        roughness: 0.72,
        metalness: 0.16,
      });

      const mesh = new THREE.Mesh(new THREE.BoxGeometry(w.w, w.h, w.d), mat);
      mesh.position.set(w.x, w.h / 2 - 0.15, w.z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      this.scene.add(mesh);

      const capMat = new THREE.MeshStandardMaterial({
        color: isBalustrade || w.style === 'dawn' ? PALETTE.kintsugiGold : PALETTE.boneIvory,
        roughness: isBalustrade ? 0.35 : 0.62,
        metalness: isBalustrade ? 0.68 : 0.2,
      });
      const cap = new THREE.Mesh(new THREE.BoxGeometry(w.w + 0.18, 0.22, w.d + 0.18), capMat);
      cap.position.set(w.x, w.h - 0.08, w.z);
      this.scene.add(cap);

      this.collision.addBox(w.x, w.z, w.w, w.d, {
        blocksProjectiles: !isBalustrade,
      });
    }
  }

  _buildPillarsAndArches() {
    const goldMat = new THREE.MeshStandardMaterial({
      color: PALETTE.kintsugiGold,
      roughness: 0.32,
      metalness: 0.78,
    });

    for (const p of WORLD_LAYOUT.pillars) {
      let colColor = PALETTE.boneIvory;
      if (p.style === 'verdigris') colColor = 0x5c8b87;
      else if (p.style === 'terracotta') colColor = 0x9e5842;
      else if (p.style === 'crucible') colColor = 0x523b42;
      else if (p.style === 'salt') colColor = PALETTE.saltWhite;
      else if (p.style === 'cistern') colColor = 0x3b63ad;
      else if (p.style === 'dawn') colColor = PALETTE.dawnAlabaster;

      const mat = new THREE.MeshStandardMaterial({
        color: colColor,
        map: this.textures.porcelain,
        roughness: 0.56,
        metalness: 0.14,
      });

      const group = new THREE.Group();
      group.position.set(p.x, 0, p.z);

      const plinth = new THREE.Mesh(new THREE.BoxGeometry(p.r * 2.2, 0.6, p.r * 2.2), mat);
      plinth.position.y = 0.3;
      plinth.castShadow = true;
      plinth.receiveShadow = true;

      const shaft = new THREE.Mesh(new THREE.CylinderGeometry(p.r * 0.78, p.r * 0.9, p.h, 10), mat);
      shaft.position.y = p.h / 2 + 0.3;
      shaft.castShadow = true;
      shaft.receiveShadow = true;

      const collarLow = new THREE.Mesh(new THREE.CylinderGeometry(p.r * 0.94, p.r * 0.94, 0.22, 10), goldMat);
      collarLow.position.y = 0.75;

      const collarHigh = new THREE.Mesh(new THREE.CylinderGeometry(p.r * 0.98, p.r * 0.85, 0.35, 10), goldMat);
      collarHigh.position.y = p.h + 0.2;

      group.add(plinth, shaft, collarLow, collarHigh);
      this.scene.add(group);
      this.collision.addCircle(p.x, p.z, p.r * 1.05);
    }

    // Grand Portal Archways across all 4 Acts
    this._addArchway(0, 20, 10.6, 6.4, 0, PALETTE.kintsugiGold);
    this._addArchway(-16, 0, 10.6, 6.2, Math.PI / 2, PALETTE.verdigrisGlow);
    this._addArchway(16, 0, 10.6, 6.2, Math.PI / 2, PALETTE.kilnAmber);
    this._addArchway(0, -14.2, 10.8, 7.2, 0, PALETTE.kintsugiBright);
    this._addArchway(0, -28.2, 12.2, 7.4, 0, PALETTE.moltenGold);
    this._addArchway(0, -73, 10.6, 7.2, 0, PALETTE.stormCyan);
    this._addArchway(0, -124, 14.4, 6.8, 0, PALETTE.stormCyan);
    this._addArchway(0, -152, 14.4, 6.8, 0, PALETTE.aetherCyan);
    this._addArchway(0, -202, 10.8, 7.0, 0, PALETTE.laserGold);
    this._addArchway(0, -230, 10.8, 7.6, 0, PALETTE.dawnSun);
    this._addArchway(0, -254, 16.4, 8.2, 0, PALETTE.kintsugiBright);
  }

  _addArchway(x, z, span, height, rotY, accentHex) {
    const group = new THREE.Group();
    group.position.set(x, 0, z);
    group.rotation.y = rotY;

    const stoneMat = new THREE.MeshStandardMaterial({
      color: PALETTE.cobaltSlate,
      roughness: 0.65,
      metalness: 0.2,
    });
    const accentMat = new THREE.MeshStandardMaterial({
      color: accentHex,
      emissive: accentHex,
      emissiveIntensity: 0.6,
      roughness: 0.3,
      metalness: 0.7,
    });

    const lintel = new THREE.Mesh(new THREE.BoxGeometry(span + 1.4, 1.0, 2.2), stoneMat);
    lintel.position.y = height;
    lintel.castShadow = true;

    const crest = new THREE.Mesh(new THREE.BoxGeometry(span * 0.65, 0.26, 2.35), accentMat);
    crest.position.y = height - 0.15;

    const keystone = new THREE.Mesh(new THREE.OctahedronGeometry(0.62, 0), accentMat);
    keystone.position.y = height + 0.65;

    group.add(lintel, crest, keystone);
    this.scene.add(group);
  }

  _buildCloisterFountain() {
    const f = WORLD_LAYOUT.fountain;
    const group = new THREE.Group();
    group.position.set(f.x, 0, f.z);

    const basinMat = new THREE.MeshStandardMaterial({
      color: PALETTE.boneIvory,
      map: this.textures.porcelain,
      roughness: 0.45,
      metalness: 0.15,
    });
    const goldMat = new THREE.MeshStandardMaterial({
      color: PALETTE.kintsugiGold,
      emissive: PALETTE.kintsugiGold,
      emissiveIntensity: 0.35,
      roughness: 0.3,
      metalness: 0.8,
    });

    const rim = new THREE.Mesh(new THREE.CylinderGeometry(f.r, f.r * 1.08, 0.9, 16), basinMat);
    rim.position.y = 0.45;
    rim.castShadow = true;
    rim.receiveShadow = true;

    const pool = new THREE.Mesh(
      new THREE.CylinderGeometry(f.r * 0.84, f.r * 0.84, 0.78, 16),
      new THREE.MeshStandardMaterial({
        color: PALETTE.verdigrisGlow,
        emissive: PALETTE.verdigrisBronze,
        emissiveIntensity: 0.65,
        roughness: 0.15,
      })
    );
    pool.position.y = 0.52;

    const spire = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.62, 2.6, 12), basinMat);
    spire.position.y = 1.6;
    spire.castShadow = true;

    const finialBell = new THREE.Mesh(new THREE.ConeGeometry(0.7, 1.15, 12), goldMat);
    finialBell.position.y = 3.25;

    group.add(rim, pool, spire, finialBell);
    this.scene.add(group);
    this.collision.addCircle(f.x, f.z, f.r + 0.15);
  }

  _buildCrossroadsCompass() {
    const group = new THREE.Group();
    group.position.set(0, 0.03, 0);

    const ring = new THREE.Mesh(
      new THREE.RingGeometry(4.2, 4.75, 48),
      new THREE.MeshBasicMaterial({ color: PALETTE.kintsugiGold, side: THREE.DoubleSide })
    );
    ring.rotation.x = -Math.PI / 2;
    group.add(ring);

    const makeBar = (w, d, x, z, color) => {
      const m = new THREE.Mesh(
        new THREE.PlaneGeometry(w, d),
        new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.65 })
      );
      m.rotation.x = -Math.PI / 2;
      m.position.set(x, 0.01, z);
      group.add(m);
    };
    makeBar(12, 0.45, -10, 0, PALETTE.verdigrisGlow);
    makeBar(12, 0.45, 10, 0, PALETTE.kilnAmber);
    makeBar(0.55, 10, 0, -9, PALETTE.kintsugiBright);
    this.scene.add(group);
  }

  _buildBraziers() {
    const bowlMat = new THREE.MeshStandardMaterial({
      color: PALETTE.verdigrisBronze,
      roughness: 0.45,
      metalness: 0.72,
    });
    for (const b of WORLD_LAYOUT.braziers) {
      const group = new THREE.Group();
      group.position.set(b.x, 0, b.z);

      const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.36, 1.1, 8), bowlMat);
      stand.position.y = 0.55;
      stand.castShadow = true;

      const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.25, 0.38, 10), bowlMat);
      bowl.position.y = 1.22;

      const flameColor = b.color || 0xff9e3d;
      const flame = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.32, 0),
        new THREE.MeshBasicMaterial({ color: flameColor })
      );
      flame.position.y = 1.58;
      group.add(stand, bowl, flame);

      let light = null;
      if (b.light) {
        light = new THREE.PointLight(flameColor, 6.2, 16, 1.6);
        light.position.set(0, 2.1, 0);
        group.add(light);
      }
      this.scene.add(group);
      this.braziers.push({ flame, light, phase: Math.random() * Math.PI * 2, baseInt: 6.2 });
    }
  }

  _buildGates() {
    for (const [id, g] of Object.entries(WORLD_LAYOUT.gates)) {
      const group = new THREE.Group();
      group.position.set(g.x, 0, g.z);

      let mat;
      if (g.kind === 'sanctum' || g.kind === 'sanctum_gold') {
        mat = new THREE.MeshStandardMaterial({
          color: g.kind === 'sanctum_gold' ? 0x453520 : 0x3a2e22,
          roughness: 0.42,
          metalness: 0.72,
        });
      } else if (g.kind === 'verdigris_rune') {
        mat = new THREE.MeshStandardMaterial({
          color: PALETTE.verdigrisGlow,
          emissive: PALETTE.verdigrisGlow,
          emissiveIntensity: 1.15,
          transparent: true,
          opacity: 0.68,
        });
      } else {
        mat = new THREE.MeshStandardMaterial({
          color: PALETTE.kilnAmber,
          emissive: PALETTE.kilnAmber,
          emissiveIntensity: 1.15,
          transparent: true,
          opacity: 0.68,
        });
      }

      const panel = new THREE.Mesh(new THREE.BoxGeometry(g.w, g.h, g.d), mat);
      panel.position.y = g.h / 2;
      panel.castShadow = g.kind === 'sanctum' || g.kind === 'sanctum_gold';
      group.add(panel);

      // Ornate gilded bars on magical barriers
      if (g.kind !== 'sanctum' && g.kind !== 'sanctum_gold') {
        const barMat = new THREE.MeshStandardMaterial({
          color: PALETTE.kintsugiGold,
          roughness: 0.32,
          metalness: 0.82,
        });
        const alongZ = g.d > g.w;
        const span = alongZ ? g.d : g.w;
        const bars = 5;
        for (let i = 0; i < bars; i++) {
          const offset = -span * 0.42 + (i / (bars - 1)) * (span * 0.84);
          const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, g.h, 6), barMat);
          bar.position.set(alongZ ? 0 : offset, g.h / 2, alongZ ? offset : 0);
          group.add(bar);
        }
        const rail = new THREE.Mesh(
          new THREE.BoxGeometry(alongZ ? 0.35 : span, 0.24, alongZ ? span : 0.35),
          barMat
        );
        rail.position.y = g.h - 0.15;
        group.add(rail);
      }

      if (g.kind === 'sanctum') {
        const makeSigil = (sx, side) => {
          const sMat = new THREE.MeshStandardMaterial({
            color: 0x3b3d4a,
            emissive: 0x111520,
            emissiveIntensity: 0.2,
            roughness: 0.3,
            metalness: 0.7,
          });
          const ring = new THREE.Mesh(new THREE.TorusGeometry(0.85, 0.14, 10, 24), sMat);
          ring.position.set(sx, 3.2, g.d / 2 + 0.12);
          group.add(ring);
          this.sanctumSigils[side] = sMat;
        };
        makeSigil(-2.2, 'west');
        makeSigil(2.2, 'east');
      } else if (g.kind === 'sanctum_gold') {
        const emblem = new THREE.Mesh(
          new THREE.TorusGeometry(1.15, 0.16, 10, 24),
          new THREE.MeshStandardMaterial({
            color: PALETTE.kintsugiGold,
            emissive: PALETTE.kintsugiGold,
            emissiveIntensity: 0.55,
            metalness: 0.8,
          })
        );
        emblem.position.set(0, 3.3, g.d / 2 + 0.12);
        group.add(emblem);
      }

      const isOpen = !!g.startsOpen;
      if (isOpen) {
        group.position.y = -g.h - 1;
        group.visible = false;
      }

      this.scene.add(group);
      this.collision.addBox(g.x, g.z, g.w, g.d, {
        id,
        active: !isOpen,
        blocksProjectiles: true,
      });

      this.gates[id] = {
        id,
        x: g.x,
        z: g.z,
        w: g.w,
        d: g.d,
        hint: g.hint || null,
        group,
        height: g.h,
        isOpen,
        targetY: isOpen ? -g.h - 1 : 0,
      };
    }
  }

  setGateOpen(id, open) {
    const gate = this.gates[id];
    if (!gate) return;
    gate.isOpen = open;
    gate.targetY = open ? -gate.height - 1 : 0;
    if (!open) gate.group.visible = true;
    this.collision.setActive(id, !open);
  }

  findNearbyLockedGateHint(playerPos) {
    for (const g of Object.values(this.gates)) {
      if (g.isOpen || !g.hint) continue;
      const dx = Math.abs(playerPos.x - g.x) - g.w / 2;
      const dz = Math.abs(playerPos.z - g.z) - g.d / 2;
      if (dx < 2.6 && dz < 2.6) {
        return g.hint;
      }
    }
    return null;
  }

  lightSanctumSigil(side) {
    const mat = this.sanctumSigils[side];
    if (!mat) return;
    const color = side === 'west' ? PALETTE.verdigrisGlow : PALETTE.kintsugiBright;
    mat.color.setHex(color);
    mat.emissive.setHex(color);
    mat.emissiveIntensity = 2.0;
  }

  _buildCrystalSwitch() {
    const c = WORLD_LAYOUT.crystalSwitch;
    const group = new THREE.Group();
    group.position.set(c.x, 0, c.z);

    const ped = new THREE.Mesh(
      new THREE.CylinderGeometry(1.1, 1.35, 2.2, 8),
      new THREE.MeshStandardMaterial({ color: 0x3b6362, roughness: 0.7 })
    );
    ped.position.y = 0.35;
    group.add(ped);

    const crystalMat = new THREE.MeshStandardMaterial({
      color: PALETTE.verdigrisGlow,
      emissive: PALETTE.verdigrisGlow,
      emissiveIntensity: 1.6,
      roughness: 0.15,
      metalness: 0.2,
    });
    const crystal = new THREE.Mesh(new THREE.OctahedronGeometry(0.82, 0), crystalMat);
    crystal.position.y = 2.35;
    group.add(crystal);

    const curve = new THREE.LineCurve3(
      new THREE.Vector3(c.x, 1.8, c.z),
      new THREE.Vector3(c.conduitEnd.x, 1.8, c.conduitEnd.z)
    );
    const conduit = new THREE.Mesh(
      new THREE.TubeGeometry(curve, 12, 0.08, 6, false),
      new THREE.MeshBasicMaterial({ color: PALETTE.verdigrisGlow, transparent: true, opacity: 0.5 })
    );
    this.scene.add(conduit);

    const light = new THREE.PointLight(PALETTE.verdigrisGlow, 5, 11);
    light.position.y = 2.6;
    group.add(light);

    this.scene.add(group);
    this.crystalSwitch = {
      id: c.id,
      x: c.x,
      z: c.z,
      radius: 1.35,
      targetGate: c.targetGate,
      activated: false,
      crystal,
      crystalMat,
      conduit,
      light,
    };
  }

  activateCrystalSwitch() {
    if (!this.crystalSwitch || this.crystalSwitch.activated) return false;
    this.crystalSwitch.activated = true;
    this.crystalSwitch.crystalMat.color.setHex(PALETTE.kintsugiBright);
    this.crystalSwitch.crystalMat.emissive.setHex(PALETTE.kintsugiGold);
    this.crystalSwitch.crystalMat.emissiveIntensity = 2.4;
    this.crystalSwitch.conduit.material.color.setHex(PALETTE.kintsugiGold);
    this.crystalSwitch.light.color.setHex(PALETTE.kintsugiGold);
    this.setGateOpen(this.crystalSwitch.targetGate, true);
    return true;
  }

  _buildCounterweightBells() {
    for (const cw of WORLD_LAYOUT.counterweightBells) {
      const group = new THREE.Group();
      group.position.set(cw.x, 0, cw.z);

      const tower = new THREE.Mesh(
        new THREE.CylinderGeometry(0.95, 1.25, 4.4, 8),
        new THREE.MeshStandardMaterial({ color: PALETTE.saltWhite, roughness: 0.6 })
      );
      tower.position.y = 0.8;
      group.add(tower);

      const bellMat = new THREE.MeshStandardMaterial({
        color: PALETTE.stormCyan,
        emissive: PALETTE.stormCyan,
        emissiveIntensity: 1.35,
        roughness: 0.25,
        metalness: 0.75,
      });
      const bell = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.95, 1.65, 12), bellMat);
      bell.position.y = 3.5;
      group.add(bell);

      const conduitCurve = new THREE.LineCurve3(
        new THREE.Vector3(cw.x, 2.8, cw.z),
        new THREE.Vector3(cw.conduitEnd.x, 2.2, cw.conduitEnd.z)
      );
      const conduit = new THREE.Mesh(
        new THREE.TubeGeometry(conduitCurve, 10, 0.08, 6, false),
        new THREE.MeshBasicMaterial({ color: PALETTE.stormCyan, transparent: true, opacity: 0.5 })
      );
      this.scene.add(conduit);

      this.scene.add(group);
      this.counterweightBells.push({
        id: cw.id,
        x: cw.x,
        z: cw.z,
        radius: 1.85,
        activated: false,
        bell,
        bellMat,
        conduit,
        light: { color: { setHex() {} } },
      });
    }
  }

  activateCounterweightBell(bellObj) {
    if (!bellObj || bellObj.activated) return false;
    bellObj.activated = true;
    bellObj.bellMat.color.setHex(PALETTE.kintsugiBright);
    bellObj.bellMat.emissive.setHex(PALETTE.kintsugiGold);
    bellObj.bellMat.emissiveIntensity = 2.2;
    bellObj.conduit.material.color.setHex(PALETTE.kintsugiGold);
    bellObj.light.color.setHex(PALETTE.kintsugiGold);
    return true;
  }

  allCounterweightsActive() {
    return this.counterweightBells.every((b) => b.activated);
  }

  /**
   * Act III Mosaic Mirror Light Puzzle
   * Live-traced golden beam from Emitter -> Mirrors -> Receptor.
   */
  _buildMirrorPuzzle() {
    const cfg = WORLD_LAYOUT.mirrorPuzzle;
    const goldMat = new THREE.MeshStandardMaterial({
      color: PALETTE.kintsugiGold,
      emissive: PALETTE.laserGold,
      emissiveIntensity: 1.5,
      metalness: 0.8,
    });
    const baseMat = new THREE.MeshStandardMaterial({ color: 0x1a2d57, roughness: 0.45, metalness: 0.65 });

    // Emitter obelisk
    const emGroup = new THREE.Group();
    emGroup.position.set(cfg.emitter.x, 0, cfg.emitter.z);
    const emPed = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.85, 1.5, 8), baseMat);
    emPed.position.y = 0.75;
    const emOrb = new THREE.Mesh(new THREE.OctahedronGeometry(0.45, 0), goldMat);
    emOrb.position.y = 2.0;
    emGroup.add(emPed, emOrb);
    this.scene.add(emGroup);
    this.collision.addCircle(cfg.emitter.x, cfg.emitter.z, 0.85);

    // Receptor obelisk
    const recGroup = new THREE.Group();
    recGroup.position.set(cfg.receptor.x, 0, cfg.receptor.z);
    const recPed = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.9, 1.5, 8), baseMat);
    recPed.position.y = 0.75;
    const recMat = new THREE.MeshStandardMaterial({
      color: 0x3b4f78,
      emissive: 0x182644,
      emissiveIntensity: 0.4,
      roughness: 0.25,
    });
    const recCore = new THREE.Mesh(new THREE.OctahedronGeometry(0.55, 0), recMat);
    recCore.position.y = 2.05;
    recGroup.add(recPed, recCore);
    this.scene.add(recGroup);
    this.collision.addCircle(cfg.receptor.x, cfg.receptor.z, 0.9);

    // 3 Rotatable Bronze Mirrors
    const mirrors = [];
    for (const m of cfg.mirrors) {
      const group = new THREE.Group();
      group.position.set(m.x, 0, m.z);

      const ped = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.95, 1.1, 8), baseMat);
      ped.position.y = 0.55;

      const rotor = new THREE.Group();
      rotor.position.y = 1.9;
      const frame = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.4, 0.22), goldMat);
      const glass = new THREE.Mesh(
        new THREE.BoxGeometry(1.12, 1.12, 0.26),
        new THREE.MeshBasicMaterial({ color: PALETTE.aetherCyan })
      );
      // Directional gold pointer cone showing exactly which cardinal way this mirror shoots!
      const pointer = new THREE.Mesh(
        new THREE.ConeGeometry(0.28, 0.75, 6),
        new THREE.MeshBasicMaterial({ color: PALETTE.kintsugiBright })
      );
      pointer.rotation.x = -Math.PI / 2;
      pointer.position.set(0, 0, -0.85);

      rotor.add(frame, glass, pointer);
      group.add(ped, rotor);
      this.scene.add(group);
      this.collision.addCircle(m.x, m.z, 0.92);

      mirrors.push({
        id: m.id,
        x: m.x,
        z: m.z,
        dir: m.initialDir, // 0=N(-z), 1=E(+x), 2=S(+z), 3=W(-x)
        solutionDir: m.solutionDir,
        rotor,
      });
    }

    this.mirrorState = {
      emitter: cfg.emitter,
      receptor: cfg.receptor,
      recMat,
      mirrors,
      beamMeshes: [],
      solved: false,
    };
    this.updateMirrorBeams();
  }

  rotateMirror(mirrorId) {
    if (!this.mirrorState || this.mirrorState.solved) return false;
    const m = this.mirrorState.mirrors.find((item) => item.id === mirrorId);
    if (!m) return false;
    m.dir = (m.dir + 1) % 4;
    return this.updateMirrorBeams();
  }

  solveMirrorPuzzleImmediate() {
    if (!this.mirrorState) return;
    for (const m of this.mirrorState.mirrors) {
      m.dir = m.solutionDir;
    }
    this.updateMirrorBeams();
  }

  updateMirrorBeams() {
    const ms = this.mirrorState;
    if (!ms) return false;

    for (const bm of ms.beamMeshes) this.scene.remove(bm);
    ms.beamMeshes = [];

    const dirVec = [
      { x: 0, z: -1 }, // 0 = N
      { x: 1, z: 0 },  // 1 = E
      { x: 0, z: 1 },  // 2 = S
      { x: -1, z: 0 }, // 3 = W
    ];

    for (const m of ms.mirrors) {
      // dir 0 -> rotY 0 (cone points -z); dir 1 -> -PI/2 (+x); dir 2 -> PI (+z); dir 3 -> +PI/2 (-x)
      m.rotor.rotation.y = -m.dir * (Math.PI / 2);
    }

    let curX = ms.emitter.x;
    let curZ = ms.emitter.z;
    let curDir = ms.emitter.dir;
    const visited = new Set();
    let hitReceptor = false;

    for (let step = 0; step < 6; step++) {
      const dv = dirVec[curDir];
      // Find closest mirror or receptor along ray
      let bestDist = 18;
      let hitTarget = null;
      let hitKind = null;

      // Check mirrors
      for (const m of ms.mirrors) {
        if (visited.has(m.id)) continue;
        const dx = m.x - curX;
        const dz = m.z - curZ;
        const proj = dx * dv.x + dz * dv.z;
        const perp = Math.abs(dx * -dv.z + dz * dv.x);
        if (proj > 0.5 && perp < 1.2 && proj < bestDist) {
          bestDist = proj;
          hitTarget = m;
          hitKind = 'mirror';
        }
      }

      // Check receptor
      {
        const dx = ms.receptor.x - curX;
        const dz = ms.receptor.z - curZ;
        const proj = dx * dv.x + dz * dv.z;
        const perp = Math.abs(dx * -dv.z + dz * dv.x);
        if (proj > 0.5 && perp < 1.2 && proj < bestDist) {
          bestDist = proj;
          hitTarget = ms.receptor;
          hitKind = 'receptor';
        }
      }

      const endX = hitTarget ? hitTarget.x : curX + dv.x * bestDist;
      const endZ = hitTarget ? hitTarget.z : curZ + dv.z * bestDist;

      const curve = new THREE.LineCurve3(
        new THREE.Vector3(curX, 2.0, curZ),
        new THREE.Vector3(endX, 2.0, endZ)
      );
      const beam = new THREE.Mesh(
        new THREE.TubeGeometry(curve, 6, 0.14, 6, false),
        new THREE.MeshBasicMaterial({
          color: PALETTE.laserGold,
          transparent: true,
          opacity: 0.92,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        })
      );
      this.scene.add(beam);
      ms.beamMeshes.push(beam);

      if (hitKind === 'receptor') {
        hitReceptor = true;
        break;
      } else if (hitKind === 'mirror') {
        visited.add(hitTarget.id);
        curX = hitTarget.x;
        curZ = hitTarget.z;
        curDir = hitTarget.dir;
      } else {
        break;
      }
    }

    if (hitReceptor && !ms.solved) {
      ms.solved = true;
      ms.recMat.color.setHex(PALETTE.kintsugiBright);
      ms.recMat.emissive.setHex(PALETTE.kintsugiGold);
      ms.recMat.emissiveIntensity = 2.4;
      this.setGateOpen('libraryGate', true);
      return true;
    }
    return false;
  }

  _buildGreatBell() {
    const pos = WORLD_LAYOUT.boss.greatBellPos;
    const group = new THREE.Group();
    group.position.set(pos.x, 0, pos.z);

    const frameMat = new THREE.MeshStandardMaterial({ color: 0x3b2a2b, roughness: 0.55, metalness: 0.45 });
    const postL = new THREE.Mesh(new THREE.BoxGeometry(0.9, 8.5, 0.9), frameMat);
    postL.position.set(-2.8, 4.25, 0);
    const postR = new THREE.Mesh(new THREE.BoxGeometry(0.9, 8.5, 0.9), frameMat);
    postR.position.set(2.8, 4.25, 0);
    const beam = new THREE.Mesh(new THREE.BoxGeometry(7.0, 0.9, 1.1), frameMat);
    beam.position.set(0, 8.5, 0);

    const bellMat = new THREE.MeshStandardMaterial({
      color: PALETTE.kintsugiGold,
      emissive: PALETTE.kintsugiGold,
      emissiveIntensity: 0.22,
      roughness: 0.3,
      metalness: 0.85,
    });
    const bellBody = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 2.05, 3.2, 18), bellMat);
    bellBody.position.y = 5.4;
    bellBody.castShadow = true;

    const bellLight = new THREE.PointLight(PALETTE.kintsugiBright, 2.5, 18);
    bellLight.position.set(0, 4.5, 1.5);

    group.add(postL, postR, beam, bellBody, bellLight);
    this.scene.add(group);
    this.greatBellGroup = { group, bellBody, bellMat, bellLight, lit: false };
    this.collision.addCircle(pos.x, pos.z, 2.4);
  }

  igniteGreatBell() {
    if (!this.greatBellGroup) return;
    this.greatBellGroup.lit = true;
    this.greatBellGroup.bellMat.emissiveIntensity = 1.65;
    this.greatBellGroup.bellLight.intensity = 12;
  }

  update(dt, elapsed) {
    for (const b of this.braziers) {
      const f = Math.sin(elapsed * 7.5 + b.phase) * 0.14 + Math.cos(elapsed * 13.1 + b.phase) * 0.08;
      b.flame.scale.set(1 + f * 0.5, 1.15 + f, 1 + f * 0.5);
      b.flame.rotation.y += dt * 1.4;
      if (b.light) b.light.intensity = b.baseInt + f * 2.2;
    }

    for (const w of this.waterMeshes) {
      w.material.emissiveIntensity = 0.38 + Math.sin(elapsed * 1.7) * 0.08;
    }
    for (const l of this.lavaMeshes) {
      l.material.emissiveIntensity = 0.8 + Math.sin(elapsed * 2.4) * 0.15;
    }

    for (const g of Object.values(this.gates)) {
      const dy = g.targetY - g.group.position.y;
      if (Math.abs(dy) > 0.02) {
        g.group.position.y += dy * Math.min(1, dt * 5.2);
      } else if (g.isOpen) {
        g.group.visible = false;
      }
    }

    if (this.crystalSwitch) {
      this.crystalSwitch.crystal.rotation.y += dt * (this.crystalSwitch.activated ? 2.4 : 1.1);
      this.crystalSwitch.crystal.position.y = 2.35 + Math.sin(elapsed * 3.0) * 0.22;
    }

    for (const cw of this.counterweightBells) {
      cw.bell.rotation.z = Math.sin(elapsed * (cw.activated ? 4.5 : 1.6)) * (cw.activated ? 0.22 : 0.07);
    }

    if (this.greatBellGroup && this.greatBellGroup.lit) {
      this.greatBellGroup.bellBody.rotation.z = Math.sin(elapsed * 2.4) * 0.14;
    }
  }
}
