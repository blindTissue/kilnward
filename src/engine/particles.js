import * as THREE from 'three';
import { PALETTE } from '../config/palette.js';

/**
 * KILNWARD — 3D VFX, Slash Arcs, Tether Beams, Telegraphs & Ambient Ash Motes
 */
export class ParticleSystem {
  constructor(scene, textures) {
    this.scene = scene;
    this.textures = textures;
    this.effects = [];
    this.projectiles = [];
    this.skyBeams = [];

    this._initAmbientAsh();
  }

  _initAmbientAsh() {
    const count = 240;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 90;
      positions[i * 3 + 1] = 0.5 + Math.random() * 9.5;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 90;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({
      color: PALETTE.kintsugiBright,
      map: this.textures.glowSprite,
      size: 0.42,
      transparent: true,
      opacity: 0.55,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.ashPoints = new THREE.Points(geo, mat);
    this.scene.add(this.ashPoints);
  }

  setAshColor(hex) {
    if (this.ashPoints) this.ashPoints.material.color.setHex(hex);
  }

  spawnSlashArc(origin, yaw, comboStep = 0, empowered = false, radiusScale = 1.0) {
    const radius = (comboStep === 2 ? 3.2 : 2.55) * radiusScale;
    const arcSpan = comboStep === 2 ? Math.PI * 1.15 : Math.PI * 0.82;
    const geo = new THREE.RingGeometry(radius * 0.48, radius, 22, 1, -arcSpan / 2, arcSpan);
    geo.rotateX(-Math.PI / 2);

    const color = empowered || comboStep === 2 ? PALETTE.kintsugiBright : PALETTE.kintsugiGold;
    const mat = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.92,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(origin.x, 1.05, origin.z);
    const baseRot = Math.atan2(Math.sin(yaw), Math.cos(yaw)) - Math.PI / 2;
    mesh.rotation.y = baseRot;
    if (comboStep === 1) {
      mesh.scale.z = -1;
    }

    this.scene.add(mesh);
    this.effects.push({
      mesh,
      age: 0,
      life: comboStep === 2 ? 0.24 : 0.17,
      spin: comboStep === 1 ? -4.2 : 4.2,
      scaleGrow: comboStep === 2 ? 1.25 : 1.12,
    });
  }

  spawnTetherBeam(fromPos, toPos, color = PALETTE.verdigrisGlow) {
    const curve = new THREE.LineCurve3(
      new THREE.Vector3(fromPos.x, 1.25, fromPos.z),
      new THREE.Vector3(toPos.x, 1.35, toPos.z)
    );
    const geo = new THREE.TubeGeometry(curve, 12, 0.14, 6, false);
    const mat = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const mesh = new THREE.Mesh(geo, mat);
    this.scene.add(mesh);
    this.effects.push({ mesh, age: 0, life: 0.34 });
  }

  spawnRingWave(pos, maxRadius, color = PALETTE.kintsugiGold, duration = 0.48) {
    const geo = new THREE.RingGeometry(0.75, 1.0, 36);
    geo.rotateX(-Math.PI / 2);
    const mat = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.9,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(pos.x, 0.14, pos.z);
    mesh.scale.setScalar(0.3);
    this.scene.add(mesh);

    this.effects.push({
      mesh,
      age: 0,
      life: duration,
      ringExpandTo: maxRadius,
    });
  }

  spawnBurst(pos, color = PALETTE.kintsugiGold, count = 12, speed = 7, shard = false) {
    for (let i = 0; i < count; i++) {
      const geo = shard
        ? new THREE.OctahedronGeometry(0.11 + Math.random() * 0.1, 0)
        : new THREE.BoxGeometry(0.12, 0.12, 0.12);
      const mat = new THREE.MeshStandardMaterial({
        color,
        emissive: color,
        emissiveIntensity: shard ? 0.45 : 1.35,
        roughness: 0.4,
        transparent: true,
        opacity: 1,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(pos.x, pos.y || 1.0, pos.z);
      const ang = Math.random() * Math.PI * 2;
      const spd = speed * (0.45 + Math.random() * 0.75);
      const vy = 2.4 + Math.random() * 4.5;
      this.scene.add(mesh);

      this.effects.push({
        mesh,
        age: 0,
        life: 0.38 + Math.random() * 0.34,
        vel: new THREE.Vector3(Math.cos(ang) * spd, vy, Math.sin(ang) * spd),
        gravity: 15,
        tumble: true,
      });
    }
  }

  spawnDashGhost(pos, yaw, color = PALETTE.kintsugiGold) {
    const geo = new THREE.CylinderGeometry(0.28, 0.42, 1.55, 8);
    const mat = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.52,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(pos.x, 0.85, pos.z);
    mesh.rotation.y = yaw;
    this.scene.add(mesh);
    this.effects.push({ mesh, age: 0, life: 0.28, scaleGrow: 0.92 });
  }

  spawnTelegraphCircle(x, z, radius, duration, color = PALETTE.telegraphRed) {
    const group = new THREE.Group();
    group.position.set(x, 0.08, z);

    const outerGeo = new THREE.RingGeometry(radius - 0.12, radius, 36);
    outerGeo.rotateX(-Math.PI / 2);
    const outerMat = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.85,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const outer = new THREE.Mesh(outerGeo, outerMat);

    const fillGeo = new THREE.CircleGeometry(radius, 36);
    fillGeo.rotateX(-Math.PI / 2);
    const fillMat = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.26,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const fill = new THREE.Mesh(fillGeo, fillMat);
    fill.scale.setScalar(0.05);

    group.add(outer, fill);
    this.scene.add(group);

    this.effects.push({
      mesh: group,
      fillMesh: fill,
      age: 0,
      life: duration,
      isTelegraph: true,
    });
  }

  spawnTelegraphRect(cx, cz, w, d, duration, color = PALETTE.kilnAmber) {
    const geo = new THREE.PlaneGeometry(w, d);
    geo.rotateX(-Math.PI / 2);
    const mat = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.24,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(cx, 0.09, cz);
    this.scene.add(mesh);

    this.effects.push({
      mesh,
      age: 0,
      life: duration,
      isStaticTelegraph: true,
    });
  }

  spawnTelegraphCone(origin, yaw, radius, angleSpan, duration, color = PALETTE.telegraphRed) {
    const geo = new THREE.CircleGeometry(radius, 24, -angleSpan / 2, angleSpan);
    geo.rotateX(-Math.PI / 2);
    const mat = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.34,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(origin.x, 0.09, origin.z);
    mesh.rotation.y = Math.atan2(Math.sin(yaw), Math.cos(yaw)) - Math.PI / 2;
    this.scene.add(mesh);

    this.effects.push({
      mesh,
      age: 0,
      life: duration,
      isStaticTelegraph: true,
    });
  }

  spawnProjectile({ owner, pos, dir, speed, damage, radius = 0.42, color = PALETTE.aetherCyan, maxDist = 28 }) {
    const group = new THREE.Group();
    const core = new THREE.Mesh(
      new THREE.OctahedronGeometry(radius * 0.72, 1),
      new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    const halo = new THREE.Mesh(
      new THREE.SphereGeometry(radius * 1.15, 10, 10),
      new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.62,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    group.add(core, halo);
    group.position.set(pos.x, 1.15, pos.z);
    this.scene.add(group);

    const proj = {
      owner,
      mesh: group,
      pos: new THREE.Vector3(pos.x, 1.15, pos.z),
      dir: dir.clone().normalize(),
      speed,
      damage,
      radius,
      color,
      traveled: 0,
      maxDist,
      alive: true,
    };
    this.projectiles.push(proj);
    return proj;
  }

  spawnBellSkyBeam(fromPos, toPos, color = PALETTE.kintsugiGold) {
    const mid = new THREE.Vector3(
      (fromPos.x + toPos.x) * 0.5,
      16,
      (fromPos.z + toPos.z) * 0.5
    );
    const curve = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(fromPos.x, 4.4, fromPos.z),
      mid,
      new THREE.Vector3(toPos.x, 5.2, toPos.z)
    );
    const tubeGeo = new THREE.TubeGeometry(curve, 36, 0.16, 8, false);
    const tubeMat = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const mesh = new THREE.Mesh(tubeGeo, tubeMat);
    this.scene.add(mesh);
    this.skyBeams.push(mesh);
  }

  clearDynamic() {
    for (const p of this.projectiles) {
      this.scene.remove(p.mesh);
    }
    this.projectiles = [];
    for (const e of this.effects) {
      this.scene.remove(e.mesh);
    }
    this.effects = [];
  }

  update(dt, elapsed, playerPos) {
    const posAttr = this.ashPoints.geometry.attributes.position;
    for (let i = 0; i < posAttr.count; i++) {
      let x = posAttr.getX(i);
      let y = posAttr.getY(i);
      let z = posAttr.getZ(i);
      y += dt * (0.28 + (i % 5) * 0.06);
      x += Math.sin(elapsed * 0.6 + i) * dt * 0.22;
      if (y > 10.5) y = 0.4;
      if (x - playerPos.x > 42) x -= 84;
      if (x - playerPos.x < -42) x += 84;
      if (z - playerPos.z > 42) z -= 84;
      if (z - playerPos.z < -42) z += 84;
      posAttr.setXYZ(i, x, y, z);
    }
    posAttr.needsUpdate = true;

    for (const b of this.skyBeams) {
      b.material.opacity = 0.62 + Math.sin(elapsed * 4.5) * 0.22;
    }

    for (let i = this.effects.length - 1; i >= 0; i--) {
      const e = this.effects[i];
      e.age += dt;
      const t = Math.min(1, e.age / e.life);

      if (e.isTelegraph) {
        e.fillMesh.scale.setScalar(0.05 + t * 0.95);
      } else if (e.isStaticTelegraph) {
        e.mesh.material.opacity = 0.16 + t * 0.44;
      } else if (e.ringExpandTo) {
        const s = 0.3 + (e.ringExpandTo - 0.3) * (1 - Math.pow(1 - t, 3));
        e.mesh.scale.setScalar(s);
        e.mesh.material.opacity = (1 - t) * 0.9;
      } else if (e.vel) {
        e.vel.y -= (e.gravity || 12) * dt;
        e.mesh.position.addScaledVector(e.vel, dt);
        if (e.mesh.position.y < 0.08) {
          e.mesh.position.y = 0.08;
          e.vel.y *= -0.35;
          e.vel.x *= 0.6;
          e.vel.z *= 0.6;
        }
        if (e.tumble) {
          e.mesh.rotation.x += dt * 7;
          e.mesh.rotation.z += dt * 5;
        }
        e.mesh.material.opacity = 1 - t;
      } else {
        if (e.spin) e.mesh.rotation.y += e.spin * dt;
        if (e.scaleGrow) {
          const s = 1 + (e.scaleGrow - 1) * t;
          e.mesh.scale.x = s;
          e.mesh.scale.z = Math.sign(e.mesh.scale.z || 1) * s;
        }
        if (e.mesh.material) e.mesh.material.opacity = (1 - t) * 0.92;
      }

      if (e.age >= e.life) {
        this.scene.remove(e.mesh);
        this.effects.splice(i, 1);
      }
    }
  }
}
