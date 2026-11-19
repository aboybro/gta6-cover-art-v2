// Neon Coast Key-Art Studio — the cover renderer.
//
// One function paints a finished poster onto any canvas: ink-framed photo
// panels on white gutters, a gradient title band with a retro sun strip,
// halftone title lettering, a neon-script subtitle, a LEONIDA ribbon badge,
// grain and a vignette. The live preview and the PNG export both call it,
// so what you see is exactly what you get.

import { layoutById } from './layouts.js';
import { gradeById, gradePhoto } from './grades.js';

const INK = '#171226';
const PAPER = '#fff6e8';

// --- texture tiles (built once, reused for every paint) --------------------

// A small deterministic noise tile for the film grain. Same seed every
// time, so two renders of the same cover are byte-identical.
let noiseTile = null;
export function grainTile() {
  if (noiseTile) return noiseTile;
  const c = document.createElement('canvas');
  c.width = 160;
  c.height = 160;
  const ctx = c.getContext('2d');
  const data = ctx.createImageData(160, 160);
  let seed = 20261120;
  for (let i = 0; i < data.data.length; i += 4) {
    seed = (seed * 16807) % 2147483647;
    const v = seed % 256;
    data.data[i] = v;
    data.data[i + 1] = v;
    data.data[i + 2] = v;
    data.data[i + 3] = 255;
  }
  ctx.putImageData(data, 0, 0);
  noiseTile = c;
  return c;
}

// A halftone dot tile, stamped over the title for the comic print look.
let dotTile = null;
export function halftoneTile() {
  if (dotTile) return dotTile;
  const c = document.createElement('canvas');
  c.width = 12;
  c.height = 12;
  const ctx = c.getContext('2d');
  ctx.fillStyle = 'rgba(23,18,38,0.55)';
  ctx.beginPath();
  ctx.arc(6, 6, 2.4, 0, Math.PI * 2);
  ctx.fill();
  dotTile = c;
  return c;
}

// --- photo placement -------------------------------------------------------

// The source rectangle of `img` that cover-fits a panel of size (pw, ph),
// centred on the panel's focal point and shifted by its pan. Zoom scales
// the fit; pan moves the window in fractions of the image.
export function coverSource(img, pw, ph, crop) {
  const iw = img.width;
  const ih = img.height;
  const scale = Math.max(pw / iw, ph / ih) * (crop.zoom || 1);
  let sw = Math.min(pw / scale, iw);
  let sh = Math.min(ph / scale, ih);
  const fx = crop.fx ?? 0.5;
  const fy = crop.fy ?? 0.5;
  let sx = fx * iw - sw / 2 + (crop.panX || 0) * (iw / 200);
  let sy = fy * ih - sh / 2 + (crop.panY || 0) * (ih / 200);
  sx = Math.max(0, Math.min(iw - sw, sx));
  sy = Math.max(0, Math.min(ih - sh, sy));
  return { sx, sy, sw, sh };
}

// Paints one photo panel: the graded photo clipped to the panel polygon,
// then the ink frame, a thin paper line, and a pink ring when selected.
export function drawPanel(ctx, panel, art, graded, crop, gutter, selected) {
  const pts = panel.pts.map(([fx, fy]) => [art.x + fx * art.w, art.y + fy * art.h]);
  const cx = pts.reduce((sum, p) => sum + p[0], 0) / pts.length;
  const cy = pts.reduce((sum, p) => sum + p[1], 0) / pts.length;
  ctx.save();
  ctx.translate(cx, cy);
  if (panel.rot) ctx.rotate((panel.rot * Math.PI) / 180);
  ctx.translate(-cx, -cy);
  ctx.beginPath();
  pts.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
  ctx.closePath();
  if (graded) {
    const xs = pts.map((p) => p[0]);
    const ys = pts.map((p) => p[1]);
    const x0 = Math.min(...xs);
    const y0 = Math.min(...ys);
    const x1 = Math.max(...xs);
    const y1 = Math.max(...ys);
    const src = coverSource(graded, x1 - x0, y1 - y0, crop);
    ctx.save();
    ctx.clip();
    ctx.drawImage(graded, src.sx, src.sy, src.sw, src.sh, x0, y0, x1 - x0, y1 - y0);
    ctx.restore();
  } else {
    ctx.fillStyle = '#2a2140';
    ctx.fill();
  }
  ctx.lineWidth = gutter;
  ctx.strokeStyle = INK;
  ctx.stroke();
  ctx.lineWidth = Math.max(2, gutter * 0.22);
  ctx.strokeStyle = 'rgba(255,246,232,0.9)';
  ctx.stroke();
  if (selected) {
    ctx.lineWidth = Math.max(3, gutter * 0.5);
    ctx.strokeStyle = '#ff2e88';
    ctx.stroke();
  }
  ctx.restore();
}

// --- title band ------------------------------------------------------------

// The retro sun: a gradient disc sliced by horizontal slits that widen
// toward the bottom. `top` is the colour the slits are cut with.
export function drawSun(ctx, x, y, r, top) {
  const grad = ctx.createLinearGradient(x, y - r, x, y + r);
  grad.addColorStop(0, '#ffd76a');
  grad.addColorStop(0.55, '#ff7a3c');
  grad.addColorStop(1, '#ff2e88');
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = grad;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
  ctx.fillStyle = top;
  let slitY = y + r * 0.05;
  let slitH = r * 0.045;
  while (slitY < y + r) {
    ctx.fillRect(x - r, slitY, r * 2, slitH);
    slitY += slitH + r * 0.16;
    slitH *= 1.45;
  }
  ctx.restore();
}

// The title band: sunset gradient, sun strip, title + neon subtitle, and
// the LEONIDA ribbon badge. The badge is measured first so a long title
// shrinks to fit the space left of it instead of running underneath.
export function drawTitleBand(ctx, band, state) {
  const { x, y, w, h } = band;
  const grad = ctx.createLinearGradient(x, y, x + w, y + h);
  grad.addColorStop(0, '#1b1030');
  grad.addColorStop(0.55, '#3d1450');
  grad.addColorStop(1, '#7a1e52');
  ctx.fillStyle = grad;
  ctx.fillRect(x, y, w, h);
  const sunR = h * 0.36;
  drawSun(ctx, x + w - sunR * 2.4, y + h * 0.58, sunR, '#1b1030');
  ctx.fillStyle = '#ffd76a';
  ctx.fillRect(x, y, w, Math.max(3, h * 0.03));
  ctx.fillRect(x, y + h - Math.max(3, h * 0.03), w, Math.max(3, h * 0.03));

  const pad = w * 0.045;
  const badge = 'LEONIDA • 2026';
  const badgeSize = h * 0.17;
  ctx.font = `bold ${badgeSize}px 'Arial Black', sans-serif`;
  const bw = ctx.measureText(badge).width + badgeSize * 1.6;
  const bh = badgeSize * 2;
  const bx = x + w - bw - pad * 0.4;
  const by = y + h * 0.1;

  const title = (state.title || 'NEON COAST').toUpperCase();
  let titleSize = h * 0.52 * (state.titleSize || 1);
  ctx.textBaseline = 'alphabetic';
  ctx.font = `${titleSize}px Anton, 'Arial Black', sans-serif`;
  const maxTitleW = Math.max(w * 0.3, bx - pad - (x + pad));
  const titleW = ctx.measureText(title).width;
  if (titleW > maxTitleW) {
    titleSize *= maxTitleW / titleW;
    ctx.font = `${titleSize}px Anton, 'Arial Black', sans-serif`;
  }
  const tx = x + pad;
  const ty = y + h * 0.58;
  // Hard offset shadow, then the title itself in paper white.
  ctx.fillStyle = '#ff2e88';
  ctx.fillText(title, tx + titleSize * 0.045, ty + titleSize * 0.05);
  ctx.fillStyle = '#fff6e8';
  ctx.fillText(title, tx, ty);
  if (state.titleStyle === 'halftone' || !state.titleStyle) {
    ctx.save();
    ctx.globalCompositeOperation = 'source-atop';
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip();
    ctx.globalAlpha = 0.28;
    ctx.fillStyle = ctx.createPattern(halftoneTile(), 'repeat');
    ctx.fillRect(tx, ty - titleSize, ctx.measureText(title).width, titleSize * 1.1);
    ctx.restore();
  } else if (state.titleStyle === 'outline') {
    ctx.strokeStyle = '#ffd76a';
    ctx.lineWidth = Math.max(2, titleSize * 0.03);
    ctx.strokeText(title, tx, ty);
  } else if (state.titleStyle === 'gradient') {
    const tg = ctx.createLinearGradient(tx, ty - titleSize, tx, ty);
    tg.addColorStop(0, '#ffd76a');
    tg.addColorStop(1, '#ff2e88');
    ctx.fillStyle = tg;
    ctx.fillText(title, tx, ty);
  }
  // Neon-script subtitle in Pacifico, glowing pink.
  if (state.subtitle) {
    const subSize = h * 0.26;
    ctx.font = `${subSize}px Pacifico, cursive`;
    ctx.shadowColor = '#ff2e88';
    ctx.shadowBlur = subSize * 0.45;
    ctx.fillStyle = '#7df9ff';
    ctx.fillText(state.subtitle, tx, y + h * 0.88);
    ctx.shadowBlur = 0;
  }
  // Ribbon badge, tilted a touch.
  ctx.font = `bold ${badgeSize}px 'Arial Black', sans-serif`;
  ctx.save();
  ctx.translate(bx + bw / 2, by + bh / 2);
  ctx.rotate(-0.03);
  ctx.fillStyle = '#ffd76a';
  ctx.fillRect(-bw / 2, -bh / 2, bw, bh);
  ctx.fillStyle = INK;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(badge, 0, 1);
  ctx.restore();
  ctx.textAlign = 'left';
}

// --- whole cover -----------------------------------------------------------

// Renders the whole cover. `state` carries layout, grade, title, subtitle,
// titleStyle, titlePos, titleSize, sun, grain, border, photos and panels
// (per panel: {photo, fx, fy, zoom, panX, panY}). `gradedCache` maps a
// photo index to its graded canvas for the current grade. `selected`
// highlights one panel index, or -1 for none.
export function renderCover(ctx, W, H, state, gradedCache, selected = -1) {
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = INK;
  ctx.fillRect(0, 0, W, H);
  const titleH = Math.round(H * 0.22);
  const top = state.titlePos !== 'bottom';
  const band = { x: 0, y: top ? 0 : H - titleH, w: W, h: titleH };
  const art = { x: 0, y: top ? titleH : 0, w: W, h: H - titleH };
  const gutter = Math.max(6, Math.round(W * 0.011));
  const layout = layoutById(state.layout);
  // Paper gutters: paint the art area paper-white first, panels sit on it.
  ctx.fillStyle = PAPER;
  ctx.fillRect(art.x, art.y, art.w, art.h);
  layout.panels.forEach((panel, i) => {
    const crop = state.panels[i] || { photo: 0, fx: 0.5, fy: 0.5, zoom: 1, panX: 0, panY: 0 };
    const graded = state.photos.length ? gradedCache[crop.photo % state.photos.length] : null;
    drawPanel(ctx, panel, art, graded, crop, gutter, i === selected);
  });
  drawTitleBand(ctx, band, state);
  // Poster frame around the whole cover.
  if (state.border !== false) {
    ctx.lineWidth = Math.max(8, W * 0.012);
    ctx.strokeStyle = PAPER;
    ctx.strokeRect(0, 0, W, H);
    ctx.lineWidth = Math.max(3, W * 0.004);
    ctx.strokeStyle = INK;
    ctx.strokeRect(0, 0, W, H);
  }
  // Vignette: darkened corners, brighter centre.
  const vg = ctx.createRadialGradient(
    W / 2, H / 2, Math.min(W, H) * 0.42,
    W / 2, H / 2, Math.max(W, H) * 0.75,
  );
  vg.addColorStop(0, 'rgba(10,6,20,0)');
  vg.addColorStop(1, 'rgba(10,6,20,0.34)');
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, W, H);
  // Film grain, faint and deterministic.
  if (state.grain !== false) {
    ctx.save();
    ctx.globalAlpha = 0.07;
    ctx.globalCompositeOperation = 'overlay';
    ctx.fillStyle = ctx.createPattern(grainTile(), 'repeat');
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }
}

// Grades every loaded photo for the current grade, at `width` px wide.
export function gradeAllPhotos(state, width = 960) {
  const grade = gradeById(state.grade);
  return state.photos.map((p) => gradePhoto(p.img, grade, width));
}
