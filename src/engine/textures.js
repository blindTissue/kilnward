import * as THREE from 'three';

/**
 * Procedural Painterly PBR-style Canvas Texture Library (Acts I–IV)
 */

function makeCanvas(size = 256) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  return { canvas, ctx: canvas.getContext('2d'), size };
}

function finalizeTexture(canvas, repeatX = 1, repeatY = 1, isColor = true) {
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  if (isColor) tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function addNoise(ctx, size, alpha = 0.08) {
  const img = ctx.getImageData(0, 0, size, size);
  const d = img.data;
  let seed = 1337;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
  for (let i = 0; i < d.length; i += 4) {
    const n = (rand() - 0.5) * 255 * alpha;
    d[i] = Math.max(0, Math.min(255, d[i] + n));
    d[i + 1] = Math.max(0, Math.min(255, d[i + 1] + n));
    d[i + 2] = Math.max(0, Math.min(255, d[i + 2] + n));
  }
  ctx.putImageData(img, 0, 0);
}

function drawKintsugiCracks(ctx, size, color = '#f5b942', count = 3, width = 1.8) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.shadowColor = color;
  ctx.shadowBlur = 4;
  let seed = 9187;
  const rand = () => {
    seed = (seed * 48271) % 2147483647;
    return (seed - 1) / 2147483646;
  };
  for (let c = 0; c < count; c++) {
    let x = rand() * size;
    let y = rand() * size;
    ctx.beginPath();
    ctx.moveTo(x, y);
    for (let s = 0; s < 5; s++) {
      x += (rand() - 0.5) * size * 0.42;
      y += (rand() - 0.5) * size * 0.42;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  ctx.restore();
}

function buildFlagstone(baseHex, tileHex, mortarHex, goldCracks = true, goldColor = '#f5b942') {
  const { canvas, ctx, size } = makeCanvas(256);
  ctx.fillStyle = mortarHex;
  ctx.fillRect(0, 0, size, size);

  const rows = 4;
  const rowH = size / rows;
  const cols = 4;
  const colW = size / cols;

  for (let r = 0; r < rows; r++) {
    const offset = (r % 2) * (colW * 0.5);
    for (let c = -1; c <= cols; c++) {
      const x = c * colW + offset + 3;
      const y = r * rowH + 3;
      const w = colW - 6;
      const h = rowH - 6;
      const shade = ((r * 7 + c * 13) % 5) * 4 - 8;

      ctx.fillStyle = (r + c) % 2 === 0 ? baseHex : tileHex;
      ctx.fillRect(x, y, w, h);

      ctx.fillStyle = `rgba(255,255,255,${0.05 + Math.max(0, shade) * 0.004})`;
      ctx.fillRect(x, y, w, 3);
      ctx.fillRect(x, y, 3, h);
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      ctx.fillRect(x, y + h - 3, w, 3);
      ctx.fillRect(x + w - 3, y, 3, h);

      if ((r + c) % 3 === 0) {
        ctx.fillStyle = 'rgba(245, 185, 66, 0.16)';
        ctx.beginPath();
        ctx.moveTo(x + w / 2, y + 8);
        ctx.lineTo(x + w - 8, y + h / 2);
        ctx.lineTo(x + w / 2, y + h - 8);
        ctx.lineTo(x + 8, y + h / 2);
        ctx.closePath();
        ctx.fill();
      }
    }
  }

  addNoise(ctx, size, 0.08);
  if (goldCracks) {
    drawKintsugiCracks(ctx, size, goldColor, 4, 1.6);
  }
  return finalizeTexture(canvas, 1, 1, true);
}

function buildWallTexture(baseHex, trimHex, accentHex) {
  const { canvas, ctx, size } = makeCanvas(256);
  ctx.fillStyle = baseHex;
  ctx.fillRect(0, 0, size, size);

  const bands = 6;
  const bh = size / bands;
  for (let b = 0; b < bands; b++) {
    const y = b * bh;
    ctx.fillStyle = b % 2 === 0 ? baseHex : trimHex;
    ctx.fillRect(0, y + 2, size, bh - 4);
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(0, y, size, 2);

    const offset = (b % 2) * 32;
    for (let x = offset; x < size; x += 64) {
      ctx.fillRect(x, y, 2, bh);
    }
  }

  ctx.fillStyle = accentHex;
  ctx.fillRect(0, 26, size, 5);
  ctx.fillRect(0, 42, size, 2);
  for (let x = 8; x < size; x += 24) {
    ctx.fillRect(x, 32, 8, 8);
  }

  addNoise(ctx, size, 0.07);
  return finalizeTexture(canvas, 1, 1, true);
}

function buildGoldRunner() {
  const { canvas, ctx, size } = makeCanvas(256);
  ctx.fillStyle = '#182236';
  ctx.fillRect(0, 0, size, size);

  ctx.fillStyle = '#c8922f';
  ctx.fillRect(14, 0, 8, size);
  ctx.fillRect(size - 22, 0, 8, size);
  ctx.fillStyle = '#f5b942';
  ctx.fillRect(28, 0, 3, size);
  ctx.fillRect(size - 31, 0, 3, size);

  ctx.strokeStyle = 'rgba(245, 185, 66, 0.55)';
  ctx.lineWidth = 3;
  for (let y = 32; y < size; y += 64) {
    ctx.beginPath();
    ctx.arc(size / 2, y, 18, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = 'rgba(62, 168, 156, 0.25)';
    ctx.fill();
  }
  addNoise(ctx, size, 0.06);
  return finalizeTexture(canvas, 1, 1, true);
}

function buildPorcelainTexture() {
  const { canvas, ctx, size } = makeCanvas(256);
  ctx.fillStyle = '#e7dcc6';
  ctx.fillRect(0, 0, size, size);
  addNoise(ctx, size, 0.05);
  drawKintsugiCracks(ctx, size, '#f5b942', 6, 2.2);
  return finalizeTexture(canvas, 1, 1, true);
}

function buildGlowSprite() {
  const { canvas, ctx, size } = makeCanvas(128);
  const g = ctx.createRadialGradient(size / 2, size / 2, 2, size / 2, size / 2, size / 2);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.28, 'rgba(255,245,210,0.75)');
  g.addColorStop(0.65, 'rgba(255,200,110,0.2)');
  g.addColorStop(1, 'rgba(255,200,110,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  return finalizeTexture(canvas, 1, 1, true);
}

export function createTextureLibrary() {
  return {
    floorSlate: buildFlagstone('#1c273d', '#22304a', '#0c111d', true, '#d8a23a'),
    floorVerdigris: buildFlagstone('#173b3e', '#1f4e51', '#0a1d20', true, '#45d6c5'),
    floorTerracotta: buildFlagstone('#47251d', '#5c2f23', '#1c0e0b', true, '#f0923b'),
    floorCrucible: buildFlagstone('#241a22', '#2f1f24', '#0e090c', true, '#ffad3b'),
    floorRunner: buildGoldRunner(),
    floorSalt: buildFlagstone('#59697f', '#6b7d96', '#263145', true, '#9adfff'),
    floorCistern: buildFlagstone('#152c5c', '#1e3c78', '#09142e', true, '#f5c754'),
    floorDawn: buildFlagstone('#8f7b72', '#a89284', '#4d3a36', true, '#ffe182'),

    wallSlate: buildWallTexture('#1f2a42', '#263450', 'rgba(245,185,66,0.5)'),
    wallVerdigris: buildWallTexture('#1d4447', '#26585b', 'rgba(82,224,207,0.48)'),
    wallTerracotta: buildWallTexture('#582d22', '#6b3628', 'rgba(245,160,66,0.52)'),
    wallCrucible: buildWallTexture('#2b1c22', '#3a2227', 'rgba(245,185,66,0.68)'),
    wallSalt: buildWallTexture('#64768f', '#778ba6', 'rgba(139,228,255,0.58)'),
    wallCistern: buildWallTexture('#173066', '#214185', 'rgba(245,199,84,0.62)'),
    wallDawn: buildWallTexture('#9c867a', '#b89f90', 'rgba(255,224,138,0.78)'),

    porcelain: buildPorcelainTexture(),
    glowSprite: buildGlowSprite(),
  };
}
