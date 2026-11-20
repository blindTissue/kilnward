/**
 * KILNWARD — Procedural Web Audio Synthesizer (Acts I–IV)
 */

export class SoundEngine {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.muted = false;
    this.droneOsc1 = null;
    this.droneOsc2 = null;
    this.droneGain = null;
    this.initialized = false;
  }

  unlock() {
    if (this.initialized) {
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      return;
    }
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;

    this.ctx = new AudioCtx();
    this.master = this.ctx.createGain();
    this.master.gain.value = this.muted ? 0 : 0.42;
    this.master.connect(this.ctx.destination);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 340;

    this.droneGain = this.ctx.createGain();
    this.droneGain.gain.value = 0.085;

    this.droneOsc1 = this.ctx.createOscillator();
    this.droneOsc1.type = 'triangle';
    this.droneOsc1.frequency.value = 110;

    this.droneOsc2 = this.ctx.createOscillator();
    this.droneOsc2.type = 'sine';
    this.droneOsc2.frequency.value = 164.81;

    this.droneOsc1.connect(filter);
    this.droneOsc2.connect(filter);
    filter.connect(this.droneGain);
    this.droneGain.connect(this.master);

    this.droneOsc1.start();
    this.droneOsc2.start();
    this.initialized = true;
  }

  setMuted(muted) {
    this.muted = muted;
    if (this.master && this.ctx) {
      this.master.gain.setTargetAtTime(muted ? 0 : 0.42, this.ctx.currentTime, 0.05);
    }
  }

  toggleMute() {
    this.setMuted(!this.muted);
    return this.muted;
  }

  setZoneDrone(baseFreq) {
    if (!this.initialized || !this.droneOsc1 || !this.ctx) return;
    const now = this.ctx.currentTime;
    this.droneOsc1.frequency.setTargetAtTime(baseFreq, now, 0.7);
    this.droneOsc2.frequency.setTargetAtTime(baseFreq * 1.498, now, 0.7);
  }

  _noiseBuffer(duration = 0.2) {
    const sampleRate = this.ctx.sampleRate;
    const length = Math.floor(sampleRate * duration);
    const buffer = this.ctx.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  playSwing(comboStep = 0, isHammer = false) {
    if (!this.initialized || this.muted) return;
    const now = this.ctx.currentTime;

    if (isHammer) {
      this.playBellToll(146.8 + comboStep * 22, 0.75);
    }

    const src = this.ctx.createBufferSource();
    src.buffer = this._noiseBuffer(isHammer ? 0.22 : 0.16);
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    const startF = (isHammer ? 480 : 900) + comboStep * 180;
    filter.frequency.setValueAtTime(startF, now);
    filter.frequency.exponentialRampToValueAtTime(isHammer ? 120 : 280, now + 0.16);
    filter.Q.value = 2.4;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.24 + comboStep * 0.05, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + (isHammer ? 0.21 : 0.15));

    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.master);
    src.start(now);

    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime((isHammer ? 290 : 520) + comboStep * 80, now);
    osc.frequency.exponentialRampToValueAtTime(isHammer ? 95 : 220, now + 0.14);
    const og = this.ctx.createGain();
    og.gain.setValueAtTime(0.09, now);
    og.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
    osc.connect(og);
    og.connect(this.master);
    osc.start(now);
    osc.stop(now + 0.15);
  }

  playHit(heavy = false) {
    if (!this.initialized || this.muted) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(heavy ? 185 : 240, now);
    osc.frequency.exponentialRampToValueAtTime(48, now + (heavy ? 0.18 : 0.11));

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(heavy ? 0.42 : 0.28, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + (heavy ? 0.19 : 0.12));

    osc.connect(gain);
    gain.connect(this.master);
    osc.start(now);
    osc.stop(now + 0.2);

    const ping = this.ctx.createOscillator();
    ping.type = 'sine';
    ping.frequency.setValueAtTime(heavy ? 1180 : 1480, now);
    ping.frequency.exponentialRampToValueAtTime(640, now + 0.09);
    const pg = this.ctx.createGain();
    pg.gain.setValueAtTime(heavy ? 0.15 : 0.09, now);
    pg.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
    ping.connect(pg);
    pg.connect(this.master);
    ping.start(now);
    ping.stop(now + 0.1);
  }

  playShatter() {
    if (!this.initialized || this.muted) return;
    const now = this.ctx.currentTime;

    const src = this.ctx.createBufferSource();
    src.buffer = this._noiseBuffer(0.24);
    const hp = this.ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 1400;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.28, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
    src.connect(hp);
    hp.connect(g);
    g.connect(this.master);
    src.start(now);

    [1620, 2140, 2680].forEach((freq, idx) => {
      const o = this.ctx.createOscillator();
      o.type = 'sine';
      o.frequency.setValueAtTime(freq, now + idx * 0.025);
      const og = this.ctx.createGain();
      og.gain.setValueAtTime(0.09, now + idx * 0.025);
      og.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.025 + 0.11);
      o.connect(og);
      og.connect(this.master);
      o.start(now + idx * 0.025);
      o.stop(now + idx * 0.025 + 0.12);
    });
  }

  playBolt() {
    if (!this.initialized || this.muted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(760, now);
    osc.frequency.exponentialRampToValueAtTime(260, now + 0.18);

    const lp = this.ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 1600;

    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.18, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.19);
    osc.connect(lp);
    lp.connect(g);
    g.connect(this.master);
    osc.start(now);
    osc.stop(now + 0.2);
  }

  playTether() {
    if (!this.initialized || this.muted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(360, now);
    osc.frequency.exponentialRampToValueAtTime(1280, now + 0.14);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.2, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
    osc.connect(g);
    g.connect(this.master);
    osc.start(now);
    osc.stop(now + 0.17);
  }

  playNova() {
    if (!this.initialized || this.muted) return;
    const now = this.ctx.currentTime;
    const sub = this.ctx.createOscillator();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(140, now);
    sub.frequency.exponentialRampToValueAtTime(34, now + 0.45);
    const sg = this.ctx.createGain();
    sg.gain.setValueAtTime(0.45, now);
    sg.gain.exponentialRampToValueAtTime(0.001, now + 0.46);
    sub.connect(sg);
    sg.connect(this.master);
    sub.start(now);
    sub.stop(now + 0.48);

    [440, 554.37, 659.25, 880].forEach((f, i) => {
      const o = this.ctx.createOscillator();
      o.type = 'triangle';
      o.frequency.setValueAtTime(f, now + i * 0.02);
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.11, now + i * 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.52);
      o.connect(g);
      g.connect(this.master);
      o.start(now + i * 0.02);
      o.stop(now + 0.55);
    });
  }

  playDash() {
    if (!this.initialized || this.muted) return;
    const now = this.ctx.currentTime;
    const src = this.ctx.createBufferSource();
    src.buffer = this._noiseBuffer(0.14);
    const bp = this.ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.setValueAtTime(600, now);
    bp.frequency.exponentialRampToValueAtTime(1900, now + 0.13);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.2, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
    src.connect(bp);
    bp.connect(g);
    g.connect(this.master);
    src.start(now);
  }

  playBellToll(pitch = 220, duration = 2.6) {
    if (!this.initialized || this.muted) return;
    const now = this.ctx.currentTime;
    const ratios = [1.0, 2.0, 2.756, 4.07];
    const amps = [0.28, 0.16, 0.11, 0.06];
    ratios.forEach((r, idx) => {
      const o = this.ctx.createOscillator();
      o.type = 'sine';
      o.frequency.setValueAtTime(pitch * r, now);
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.001, now);
      g.gain.linearRampToValueAtTime(amps[idx], now + 0.015);
      g.gain.exponentialRampToValueAtTime(0.0008, now + duration / (1 + idx * 0.35));
      o.connect(g);
      g.connect(this.master);
      o.start(now);
      o.stop(now + duration);
    });
  }

  playChime(high = false) {
    if (!this.initialized || this.muted) return;
    const now = this.ctx.currentTime;
    const notes = high ? [587.33, 880, 1174.66] : [440, 659.25];
    notes.forEach((n, i) => {
      const o = this.ctx.createOscillator();
      o.type = 'sine';
      o.frequency.setValueAtTime(n, now + i * 0.07);
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.14, now + i * 0.07);
      g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.07 + 0.45);
      o.connect(g);
      g.connect(this.master);
      o.start(now + i * 0.07);
      o.stop(now + i * 0.07 + 0.48);
    });
  }

  playBossHorn() {
    if (!this.initialized || this.muted) return;
    const now = this.ctx.currentTime;
    [82.41, 123.47, 164.81].forEach((f, i) => {
      const o = this.ctx.createOscillator();
      o.type = 'sawtooth';
      o.frequency.setValueAtTime(f, now);
      o.frequency.linearRampToValueAtTime(f * 0.96, now + 1.2);
      const lp = this.ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.setValueAtTime(420, now);
      lp.frequency.linearRampToValueAtTime(920, now + 0.4);
      lp.frequency.exponentialRampToValueAtTime(220, now + 1.2);
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.001, now);
      g.gain.linearRampToValueAtTime(i === 0 ? 0.22 : 0.1, now + 0.18);
      g.gain.exponentialRampToValueAtTime(0.001, now + 1.25);
      o.connect(lp);
      lp.connect(g);
      g.connect(this.master);
      o.start(now);
      o.stop(now + 1.3);
    });
  }
}
