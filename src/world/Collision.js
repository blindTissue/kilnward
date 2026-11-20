/**
 * KILNWARD — Fast 2D Circle-vs-AABB & Circle-vs-Circle Collision System
 * Supports smooth wall sliding and dynamic toggleable gates/barriers.
 */

export class CollisionWorld {
  constructor() {
    this.boxes = [];   // { id?, minX, maxX, minZ, maxZ, active, blocksProjectiles }
    this.circles = []; // { id?, x, z, r, active }
  }

  addBox(x, z, w, d, opts = {}) {
    const box = {
      id: opts.id || null,
      minX: x - w / 2,
      maxX: x + w / 2,
      minZ: z - d / 2,
      maxZ: z + d / 2,
      active: opts.active !== undefined ? opts.active : true,
      blocksProjectiles: opts.blocksProjectiles !== undefined ? opts.blocksProjectiles : true,
    };
    this.boxes.push(box);
    return box;
  }

  addCircle(x, z, r, opts = {}) {
    const c = {
      id: opts.id || null,
      x,
      z,
      r,
      active: opts.active !== undefined ? opts.active : true,
    };
    this.circles.push(c);
    return c;
  }

  setActive(id, active) {
    for (const b of this.boxes) {
      if (b.id === id) b.active = active;
    }
    for (const c of this.circles) {
      if (c.id === id) c.active = active;
    }
  }

  /**
   * Resolves circle (x, z, radius) against all active static walls, pillars, and gates.
   * Mutates and returns { x, z }.
   */
  resolveCircle(pos, radius) {
    // 2 iterations eliminate corner jitter
    for (let iter = 0; iter < 2; iter++) {
      for (const b of this.boxes) {
        if (!b.active) continue;
        const closestX = Math.max(b.minX, Math.min(pos.x, b.maxX));
        const closestZ = Math.max(b.minZ, Math.min(pos.z, b.maxZ));
        const dx = pos.x - closestX;
        const dz = pos.z - closestZ;
        const distSq = dx * dx + dz * dz;

        if (distSq < radius * radius) {
          if (distSq > 1e-6) {
            const dist = Math.sqrt(distSq);
            const overlap = radius - dist;
            pos.x += (dx / dist) * overlap;
            pos.z += (dz / dist) * overlap;
          } else {
            // Inside AABB fallback: push out along shallowest axis
            const left = Math.abs(pos.x - b.minX);
            const right = Math.abs(b.maxX - pos.x);
            const top = Math.abs(pos.z - b.minZ);
            const bottom = Math.abs(b.maxZ - pos.z);
            const m = Math.min(left, right, top, bottom);
            if (m === left) pos.x = b.minX - radius;
            else if (m === right) pos.x = b.maxX + radius;
            else if (m === top) pos.z = b.minZ - radius;
            else pos.z = b.maxZ + radius;
          }
        }
      }

      for (const c of this.circles) {
        if (!c.active) continue;
        const dx = pos.x - c.x;
        const dz = pos.z - c.z;
        const minDist = radius + c.r;
        const distSq = dx * dx + dz * dz;
        if (distSq < minDist * minDist && distSq > 1e-6) {
          const dist = Math.sqrt(distSq);
          const overlap = minDist - dist;
          pos.x += (dx / dist) * overlap;
          pos.z += (dz / dist) * overlap;
        }
      }
    }
    return pos;
  }

  /**
   * Checks if a projectile point hits any solid wall or pillar (ignores low balustrades).
   */
  hitsSolid(x, z, radius = 0.25) {
    for (const b of this.boxes) {
      if (!b.active || !b.blocksProjectiles) continue;
      if (
        x + radius > b.minX &&
        x - radius < b.maxX &&
        z + radius > b.minZ &&
        z - radius < b.maxZ
      ) {
        return true;
      }
    }
    for (const c of this.circles) {
      if (!c.active) continue;
      const dx = x - c.x;
      const dz = z - c.z;
      if (dx * dx + dz * dz < (c.r + radius) * (c.r + radius)) {
        return true;
      }
    }
    return false;
  }
}
