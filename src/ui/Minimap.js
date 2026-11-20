import { WORLD_LAYOUT } from '../config/worldLayout.js';

/**
 * KILNWARD — Player-Centered Scrolling Cathedral Minimap (Acts I–IV)
 */
export class Minimap {
  constructor() {
    this.canvas = document.getElementById('minimap-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.labelEl = document.getElementById('minimap-zone-label');
    this.w = this.canvas.width;
    this.h = this.canvas.height;
    this.scale = 1.65;
  }

  _toCanvas(wx, wz, px, pz) {
    return {
      x: this.w / 2 + (wx - px) * this.scale,
      y: this.h / 2 + (wz - pz) * this.scale,
    };
  }

  setZoneLabel(name) {
    this.labelEl.textContent = name;
  }

  render(player, enemies, activeBosses, worldBuilder, interactables) {
    const ctx = this.ctx;
    const px = player.pos.x;
    const pz = player.pos.z;

    ctx.clearRect(0, 0, this.w, this.h);
    ctx.fillStyle = '#090e17';
    ctx.fillRect(0, 0, this.w, this.h);

    // Floors
    for (const f of WORLD_LAYOUT.floors) {
      const p = this._toCanvas(f.x - f.w / 2, f.z - f.d / 2, px, pz);
      const rw = f.w * this.scale;
      const rh = f.d * this.scale;
      if (p.x + rw < 0 || p.x > this.w || p.y + rh < 0 || p.y > this.h) continue;

      if (f.style === 'verdigris') ctx.fillStyle = '#1b474a';
      else if (f.style === 'terracotta') ctx.fillStyle = '#4f281f';
      else if (f.style === 'crucible') ctx.fillStyle = '#381e24';
      else if (f.style === 'gold_runner') ctx.fillStyle = '#3c3424';
      else if (f.style === 'salt') ctx.fillStyle = '#4d5d73';
      else if (f.style === 'cistern') ctx.fillStyle = '#19356e';
      else if (f.style === 'dawn') ctx.fillStyle = '#755c54';
      else ctx.fillStyle = '#1f2b42';

      ctx.fillRect(p.x, p.y, rw, rh);
      ctx.strokeStyle = 'rgba(245, 185, 66, 0.24)';
      ctx.lineWidth = 0.8;
      ctx.strokeRect(p.x, p.y, rw, rh);
    }

    // Closed gates
    for (const [id, gate] of Object.entries(worldBuilder.gates)) {
      if (gate.isOpen) continue;
      const gDef = WORLD_LAYOUT.gates[id];
      const p = this._toCanvas(gDef.x - gDef.w / 2, gDef.z - gDef.d / 2, px, pz);
      ctx.fillStyle = gDef.kind === 'verdigris_rune' ? '#45d6c5' : '#f5b942';
      ctx.fillRect(p.x, p.y, Math.max(2.5, gDef.w * this.scale), Math.max(2.5, gDef.d * this.scale));
    }

    // Counterweight Bells (Act II)
    for (const cw of worldBuilder.counterweightBells) {
      const p = this._toCanvas(cw.x, cw.z, px, pz);
      ctx.fillStyle = cw.activated ? '#ffe48f' : '#8be4ff';
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3.6, 0, Math.PI * 2);
      ctx.fill();
    }

    // Interactables
    for (const it of interactables.interactables) {
      const p = this._toCanvas(it.x, it.z, px, pz);
      if (p.x < -8 || p.x > this.w + 8 || p.y < -8 || p.y > this.h + 8) continue;

      if (it.kind === 'bell') {
        ctx.fillStyle = it.rung ? '#ffe48f' : '#45d6c5';
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4.2, 0, Math.PI * 2);
        ctx.fill();
      } else if (it.kind === 'shrine') {
        ctx.fillStyle = '#6ef0b4';
        ctx.fillRect(p.x - 3, p.y - 3, 6, 6);
      } else if (it.kind === 'chest' && !it.opened) {
        ctx.fillStyle = '#f5b942';
        ctx.fillRect(p.x - 2.5, p.y - 2.5, 5, 5);
      } else if (it.kind === 'npc' || it.kind === 'kiln_heart' || it.kind === 'echo') {
        ctx.fillStyle = '#8cc8ff';
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3.2, 0, Math.PI * 2);
        ctx.fill();
      } else if (it.kind === 'mirror') {
        ctx.fillStyle = '#ffe97d';
        ctx.fillRect(p.x - 2, p.y - 2, 4, 4);
      }
    }

    // Active enemies
    for (const e of enemies) {
      if (!e.alive) continue;
      const p = this._toCanvas(e.pos.x, e.pos.z, px, pz);
      if (p.x < -6 || p.x > this.w + 6 || p.y < -6 || p.y > this.h + 6) continue;
      ctx.fillStyle = e.def.elite ? '#ff9d3b' : '#e04850';
      ctx.beginPath();
      ctx.arc(p.x, p.y, e.def.elite ? 3.4 : 2.4, 0, Math.PI * 2);
      ctx.fill();
    }

    // All living bosses
    for (const b of activeBosses) {
      if (!b || !b.alive) continue;
      const targets = b.getHitTargets ? b.getHitTargets() : [b];
      for (const t of targets) {
        const p = this._toCanvas(t.pos.x, t.pos.z, px, pz);
        if (p.x < -8 || p.x > this.w + 8 || p.y < -8 || p.y > this.h + 8) continue;
        ctx.fillStyle = '#ff4b55';
        ctx.strokeStyle = '#ffe48f';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
    }

    // Player chevron centered
    ctx.save();
    ctx.translate(this.w / 2, this.h / 2);
    ctx.rotate(-player.yaw + Math.PI);
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#f5b942';
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(0, -5.5);
    ctx.lineTo(4.2, 4.5);
    ctx.lineTo(0, 2.2);
    ctx.lineTo(-4.2, 4.5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
}
