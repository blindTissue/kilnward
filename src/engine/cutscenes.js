import * as THREE from 'three';

/**
 * KILNWARD — In-Engine 3D Cutscene Director
 * Drives real-time Three.js camera pans, orbits, zooms, timed VFX/audio cues,
 * cinematic letterbox bars, and subtitle captions. Skippable anytime with Space/Esc.
 */
export class CutsceneDirector {
  constructor(renderer, particles, sound) {
    this.renderer = renderer;
    this.particles = particles;
    this.sound = sound;

    this.active = false;
    this.shots = [];
    this.shotIndex = 0;
    this.shotElapsed = 0;
    this.onComplete = null;
    this.cleanupObjects = [];

    this.rootEl = document.getElementById('cutscene-layer');
    this.kickerEl = document.getElementById('cutscene-kicker');
    this.captionEl = document.getElementById('cutscene-caption');
    this.skipBtn = document.getElementById('btn-skip-cutscene');

    if (this.skipBtn) {
      this.skipBtn.addEventListener('click', () => this.skip());
    }
  }

  /**
   * Play a sequence of 3D camera shots.
   * Each shot: {
   *   duration: number,
   *   fromPos: [x,y,z], toPos: [x,y,z],
   *   fromLook: [x,y,z], toLook: [x,y,z],
   *   kicker?: string, caption?: string,
   *   onStart?: (director) => void,
   *   onUpdate?: (t, dt, director) => void
   * }
   */
  play(shots, onComplete) {
    this.stopCleanup();
    this.shots = shots;
    this.shotIndex = 0;
    this.shotElapsed = 0;
    this.onComplete = onComplete || null;
    this.active = true;

    this.rootEl.classList.remove('hidden');
    requestAnimationFrame(() => this.rootEl.classList.add('bars-in'));

    this._startShot(0);
  }

  addTempObject(obj) {
    this.renderer.scene.add(obj);
    this.cleanupObjects.push(obj);
    return obj;
  }

  stopCleanup() {
    for (const obj of this.cleanupObjects) {
      this.renderer.scene.remove(obj);
    }
    this.cleanupObjects = [];
  }

  _startShot(idx) {
    this.shotIndex = idx;
    this.shotElapsed = 0;
    const shot = this.shots[idx];
    if (!shot) {
      this.finish();
      return;
    }

    this.kickerEl.textContent = shot.kicker || '';
    this.captionEl.textContent = shot.caption || '';
    this.captionEl.classList.toggle('hidden', !shot.caption);

    this.renderer.setCutsceneCamera(
      new THREE.Vector3(...shot.fromPos),
      new THREE.Vector3(...shot.fromLook)
    );

    if (shot.onStart) shot.onStart(this);
  }

  skip() {
    if (!this.active) return;
    this.finish();
  }

  finish() {
    if (!this.active) return;
    this.active = false;
    this.rootEl.classList.remove('bars-in');
    this.rootEl.classList.add('hidden');
    this.renderer.clearCutsceneCamera();
    this.stopCleanup();

    const cb = this.onComplete;
    this.onComplete = null;
    if (cb) cb();
  }

  update(dt) {
    if (!this.active) return;
    const shot = this.shots[this.shotIndex];
    if (!shot) {
      this.finish();
      return;
    }

    this.shotElapsed += dt;
    const rawT = Math.min(1, this.shotElapsed / shot.duration);
    // Smoothstep ease-in-out for cinema-grade camera motion
    const t = rawT * rawT * (3 - 2 * rawT);

    const pos = new THREE.Vector3(...shot.fromPos).lerp(new THREE.Vector3(...shot.toPos), t);
    const look = new THREE.Vector3(...shot.fromLook).lerp(new THREE.Vector3(...shot.toLook), t);
    this.renderer.setCutsceneCamera(pos, look);

    if (shot.onUpdate) shot.onUpdate(rawT, dt, this);

    if (this.shotElapsed >= shot.duration) {
      this._startShot(this.shotIndex + 1);
    }
  }
}
