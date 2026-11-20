// Neon Coast Key-Art Studio — the editor (v3).
//
// Wires the controls to the renderer: photos, layouts, grades, style
// presets, caption, focal points, mono panels, undo/redo, one-click Auto
// Poster and Surprise Me, and PNG export in the four common post sizes. It
// also drives the screenshot scenes (?shot=cover and ?shot=editor) that
// shots.js sets up. New in v3: 6 sample photos, 12 layouts, 10 grades, 4
// one-click style presets, Surprise Me, a per-panel mono switch and a
// gold star-rating line — the cover opens on the neon cast grid, so the
// first thing anyone sees is already a finished poster.

import { LAYOUTS, layoutById } from './layouts.js';
import { GRADES, gradeById } from './grades.js';
import { STYLE_PRESETS, presetById, applyStylePreset, bestPresetFor, surprisePreset } from './presets.js';
import { renderCover, gradeAllPhotos } from './render.js';
import { applyShotQuery, loadShotPhotos, runShot } from './shots.js';

export const SAMPLE_NAMES = ['neon-duo', 'harbor-heist', 'beach-chase', 'rooftop-night', 'sunset-pier', 'downtown-night'];
export const SIZES = [
  { id: '1080x1080', label: 'Square 1080 × 1080', w: 1080, h: 1080 },
  { id: '1080x1350', label: 'Portrait 1080 × 1350', w: 1080, h: 1350 },
  { id: '1920x1080', label: 'Landscape 1920 × 1080', w: 1920, h: 1080 },
  { id: '1080x1920', label: 'Story 1080 × 1920', w: 1080, h: 1920 },
];

const AUTO_TITLES = ['Neon Coast', 'Sunset Heist', 'Vice Nights', 'Palm Royale', 'Afterglow Run', 'Leonida Nights'];

// --- state -----------------------------------------------------------------

// A fresh per-panel crop: which photo slot, where its focal point sits,
// how far it is zoomed and panned, and whether the panel is black-and-white.
export function defaultCrop(i) {
  return { photo: i, fx: 0.5, fy: 0.42, zoom: 1.08, panX: 0, panY: 0, mono: false };
}

// The editor state: everything renderCover needs, plus the UI selection.
// The cover opens on the neon cast grid — six photos, gradient title —
// so the first paint is already a finished poster.
export function freshState() {
  return {
    layout: 'cast-grid',
    grade: 'neon-coast',
    title: 'Neon Coast',
    subtitle: 'Leonida, 2026',
    titleStyle: 'gradient',
    titlePos: 'bottom',
    titleSize: 1,
    sun: true,
    grain: true,
    border: true,
    stars: true,
    size: '1920x1080',
    photos: [],
    panels: [],
    selected: 0,
    focalMode: false,
  };
}

export const state = freshState();

// Loads an image from a URL and resolves with the HTMLImageElement.
export function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`cannot load ${src}`));
    img.src = src;
  });
}

const canvas = document.getElementById('cover');
const ctx = canvas.getContext('2d');
let gradedCache = [];
let gradeKey = '';

// Re-grades the photos when the grade changed, then repaints the preview.
export function redraw() {
  const key = `${state.grade}:${state.photos.length}:${state.photos.map((p) => p.name).join(',')}`;
  if (key !== gradeKey) {
    gradedCache = gradeAllPhotos(state, 960);
    gradeKey = key;
  }
  renderCover(ctx, canvas.width, canvas.height, state, gradedCache, state.selected);
}

// Rebuilds the panel crops for the current layout, keeping photo slots.
export function resetPanels(keepPhotos = true) {
  const n = layoutById(state.layout).panels.length;
  const old = state.panels;
  state.panels = [];
  for (let i = 0; i < n; i++) {
    const crop = defaultCrop(i);
    if (keepPhotos && old[i]) {
      crop.photo = old[i].photo;
      crop.mono = old[i].mono;
    }
    if (state.photos.length) crop.photo = i % state.photos.length;
    state.panels.push(crop);
  }
}

// --- history (undo / redo) -------------------------------------------------

const past = [];
const future = [];
const MAX_HISTORY = 60;

function snapshot() {
  return JSON.stringify({
    layout: state.layout,
    grade: state.grade,
    title: state.title,
    subtitle: state.subtitle,
    titleStyle: state.titleStyle,
    titlePos: state.titlePos,
    titleSize: state.titleSize,
    sun: state.sun,
    grain: state.grain,
    border: state.border,
    stars: state.stars,
    size: state.size,
    panels: state.panels,
    selected: state.selected,
  });
}

function restore(json) {
  const s = JSON.parse(json);
  Object.assign(state, s);
  state.panels = s.panels;
  syncControls();
  redraw();
}

// Records the current state so Undo can bring it back.
export function pushHistory() {
  past.push(snapshot());
  if (past.length > MAX_HISTORY) past.shift();
  future.length = 0;
  updateHistoryButtons();
}

export function undo() {
  if (!past.length) return;
  future.push(snapshot());
  restore(past.pop());
  updateHistoryButtons();
}

export function redo() {
  if (!future.length) return;
  past.push(snapshot());
  restore(future.pop());
  updateHistoryButtons();
}

function updateHistoryButtons() {
  const u = document.getElementById('undo');
  const r = document.getElementById('redo');
  if (u) u.disabled = !past.length;
  if (r) r.disabled = !future.length;
}

// --- photos ----------------------------------------------------------------

function addPhoto(img, name) {
  state.photos.push({ img, name });
  if (state.photos.length <= 6) resetPanels();
  gradeKey = '';
  redraw();
  renderThumbs();
}

async function loadSamples() {
  for (const name of SAMPLE_NAMES) {
    if (state.photos.some((p) => p.name === name)) continue;
    try {
      addPhoto(await loadImage(`samples/${name}.jpg`), name);
    } catch {
      // A missing sample is skipped; the others still load.
    }
  }
}

// --- Auto Poster and style presets -----------------------------------------

// One click: the best style preset for the photo count, a matching title.
// Deterministic: the same photos always give the same poster.
export function autoPoster() {
  pushHistory();
  const count = Math.max(1, state.photos.length);
  const preset = applyStylePreset(state, bestPresetFor(count));
  if (!state.title || state.title === 'Neon Coast') {
    state.title = AUTO_TITLES[(count * 3 + state.photos.length) % AUTO_TITLES.length];
    if (preset.id === 'neon-nights') state.title = 'Neon Coast';
  }
  resetPanels();
  syncControls();
  redraw();
}

// One click: a random style preset and a random photo in every panel.
// resetPanels keeps the re-rolled photo slots while rebuilding the panel
// count for the preset's layout.
export function surpriseMe() {
  pushHistory();
  surprisePreset(state);
  resetPanels();
  syncControls();
  redraw();
}

// --- export ----------------------------------------------------------------

// Renders the cover at export resolution and downloads it as a PNG.
export async function exportCover(sizeId, download = true) {
  const size = SIZES.find((s) => s.id === sizeId) ?? SIZES[2];
  const off = document.createElement('canvas');
  off.width = size.w;
  off.height = size.h;
  const graded = gradeAllPhotos(state, 1400);
  renderCover(off.getContext('2d'), size.w, size.h, state, graded, -1);
  const blob = await new Promise((resolve) => off.toBlob(resolve, 'image/png'));
  if (download) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `neon-coast-${size.id}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  }
  const status = document.getElementById('status');
  if (status) status.textContent = `Exported ${size.label} PNG (${(blob.size / 1024).toFixed(0)} KiB).`;
  return blob;
}

// --- UI --------------------------------------------------------------------

const el = (id) => document.getElementById(id);

function renderThumbs() {
  const box = el('thumbs');
  box.innerHTML = '';
  state.photos.forEach((photo, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'thumb';
    b.title = `Place “${photo.name}” in the selected panel`;
    const img = document.createElement('img');
    img.src = photo.img.src;
    img.alt = photo.name;
    b.appendChild(img);
    b.addEventListener('click', () => {
      pushHistory();
      state.panels[state.selected].photo = i;
      redraw();
    });
    box.appendChild(b);
  });
}

function renderPresetRow() {
  const box = el('presetRow');
  box.innerHTML = '';
  STYLE_PRESETS.forEach((preset) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'preset-btn';
    b.textContent = preset.name;
    b.title = preset.blurb;
    b.addEventListener('click', () => {
      pushHistory();
      applyStylePreset(state, preset.id);
      resetPanels();
      syncControls();
      redraw();
    });
    box.appendChild(b);
  });
}

function renderLayoutGrid() {
  const box = el('layoutGrid');
  box.innerHTML = '';
  LAYOUTS.forEach((layout) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'layout-btn' + (layout.id === state.layout ? ' active' : '');
    b.textContent = layout.name;
    b.title = layout.blurb;
    b.addEventListener('click', () => {
      pushHistory();
      state.layout = layout.id;
      state.selected = 0;
      resetPanels();
      syncControls();
      redraw();
    });
    box.appendChild(b);
  });
  el('layoutName').textContent = layoutById(state.layout).name;
}

function renderGradeGrid() {
  const box = el('gradeGrid');
  box.innerHTML = '';
  GRADES.forEach((grade) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'grade-btn' + (grade.id === state.grade ? ' active' : '');
    const [r, g, bl] = grade.mid;
    b.style.background = `linear-gradient(135deg, rgb(${grade.shadow}), rgb(${r},${g},${bl}), rgb(${grade.high}))`;
    b.textContent = grade.name;
    b.addEventListener('click', () => {
      pushHistory();
      state.grade = grade.id;
      syncControls();
      redraw();
    });
    box.appendChild(b);
  });
}

function renderPanelRow() {
  const box = el('panelRow');
  box.innerHTML = '';
  state.panels.forEach((_, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'panel-btn' + (i === state.selected ? ' active' : '');
    b.textContent = `Panel ${i + 1}`;
    b.addEventListener('click', () => {
      state.selected = i;
      syncControls();
      redraw();
    });
    box.appendChild(b);
  });
}

function renderSizeRow() {
  const box = el('sizeRow');
  box.innerHTML = '';
  SIZES.forEach((size) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'size-btn' + (size.id === state.size ? ' active' : '');
    b.textContent = size.label;
    b.addEventListener('click', () => {
      state.size = size.id;
      syncControls();
    });
    box.appendChild(b);
  });
}

// Reflects the state in every control (used after undo / Auto Poster).
export function syncControls() {
  renderPresetRow();
  renderLayoutGrid();
  renderGradeGrid();
  renderPanelRow();
  renderSizeRow();
  el('title').value = state.title;
  el('subtitle').value = state.subtitle;
  el('titleStyle').value = state.titleStyle;
  el('titlePos').value = state.titlePos;
  el('titleSize').value = state.titleSize;
  el('titleSizeVal').textContent = `${Math.round(state.titleSize * 100)}%`;
  el('sun').checked = state.sun;
  el('grain').checked = state.grain;
  el('border').checked = state.border;
  el('stars').checked = state.stars !== false;
  const crop = state.panels[state.selected] || defaultCrop(0);
  el('zoom').value = crop.zoom;
  el('zoomVal').textContent = `${Math.round(crop.zoom * 100)}%`;
  el('panX').value = crop.panX;
  el('panXVal').textContent = crop.panX;
  el('panY').value = crop.panY;
  el('panYVal').textContent = crop.panY;
  el('mono').checked = !!crop.mono;
  el('focal').classList.toggle('active', state.focalMode);
}

// Canvas point -> art-area fractions, for clicks and drags.
function canvasPoint(event) {
  const rect = canvas.getBoundingClientRect();
  const px = (event.clientX - rect.left) * (canvas.width / rect.width);
  const py = (event.clientY - rect.top) * (canvas.height / rect.height);
  const titleH = canvas.height * 0.22;
  const top = state.titlePos !== 'bottom';
  const artY = top ? titleH : 0;
  return { px, py, fx: px / canvas.width, fy: (py - artY) / (canvas.height - titleH), artY };
}

// Which panel holds a point in the art area, or -1 (ray casting).
function panelAt(fx, fy) {
  const layout = layoutById(state.layout);
  for (let i = 0; i < layout.panels.length; i++) {
    const pts = layout.panels[i].pts;
    let inside = false;
    for (let a = 0, b = pts.length - 1; a < pts.length; b = a++) {
      const [ax, ay] = pts[a];
      const [bx, by] = pts[b];
      if (ay > fy !== by > fy && fx < ((bx - ax) * (fy - ay)) / (by - ay) + ax) inside = !inside;
    }
    if (inside) return i;
  }
  return -1;
}

function bindCanvas() {
  let dragging = false;
  let moved = false;
  let lastX = 0;
  let lastY = 0;
  canvas.addEventListener('pointerdown', (event) => {
    const { fx, fy } = canvasPoint(event);
    const hit = panelAt(fx, fy);
    if (hit === -1) return;
    state.selected = hit;
    const crop = state.panels[hit];
    if (state.focalMode) {
      pushHistory();
      crop.fx = Math.max(0.05, Math.min(0.95, fx));
      crop.fy = Math.max(0.05, Math.min(0.95, fy));
      syncControls();
      redraw();
      return;
    }
    dragging = true;
    moved = false;
    lastX = event.clientX;
    lastY = event.clientY;
    canvas.setPointerCapture(event.pointerId);
  });
  canvas.addEventListener('pointermove', (event) => {
    if (!dragging) return;
    const crop = state.panels[state.selected];
    const dx = event.clientX - lastX;
    const dy = event.clientY - lastY;
    if (Math.abs(dx) + Math.abs(dy) > 2) moved = true;
    crop.panX = Math.max(-60, Math.min(60, crop.panX + dx * 0.4));
    crop.panY = Math.max(-60, Math.min(60, crop.panY + dy * 0.4));
    lastX = event.clientX;
    lastY = event.clientY;
    syncControls();
    redraw();
  });
  canvas.addEventListener('pointerup', () => {
    if (dragging && moved) pushHistory();
    dragging = false;
    syncControls();
    redraw();
  });
  canvas.addEventListener('wheel', (event) => {
    event.preventDefault();
    const crop = state.panels[state.selected];
    crop.zoom = Math.max(1, Math.min(3, crop.zoom - Math.sign(event.deltaY) * 0.08));
    syncControls();
    redraw();
  }, { passive: false });
}

function bindControls() {
  el('photo').addEventListener('change', async (event) => {
    for (const file of event.target.files) {
      const url = URL.createObjectURL(file);
      try {
        addPhoto(await loadImage(url), file.name.replace(/\.[^.]+$/, ''));
      } catch {
        // An unreadable file is skipped; the others still load.
      }
    }
    event.target.value = '';
  });
  el('samples').addEventListener('click', loadSamples);
  el('autoPoster').addEventListener('click', autoPoster);
  el('surprise').addEventListener('click', surpriseMe);
  el('undo').addEventListener('click', undo);
  el('redo').addEventListener('click', redo);
  el('focal').addEventListener('click', () => {
    state.focalMode = !state.focalMode;
    el('focal').classList.toggle('active', state.focalMode);
  });
  el('fillAll').addEventListener('click', () => {
    pushHistory();
    const photo = state.panels[state.selected].photo;
    state.panels.forEach((p) => { p.photo = photo; });
    redraw();
  });
  el('shuffle').addEventListener('click', () => {
    pushHistory();
    state.panels.forEach((p) => {
      p.fx = 0.2 + Math.random() * 0.6;
      p.fy = 0.2 + Math.random() * 0.5;
      p.zoom = 1 + Math.random() * 0.5;
    });
    redraw();
  });
  el('mono').addEventListener('change', (e) => {
    pushHistory();
    state.panels[state.selected].mono = e.target.checked;
    redraw();
  });
  el('title').addEventListener('input', (e) => { state.title = e.target.value; redraw(); });
  el('subtitle').addEventListener('input', (e) => { state.subtitle = e.target.value; redraw(); });
  el('titleStyle').addEventListener('change', (e) => { pushHistory(); state.titleStyle = e.target.value; redraw(); });
  el('titlePos').addEventListener('change', (e) => { pushHistory(); state.titlePos = e.target.value; redraw(); });
  el('titleSize').addEventListener('input', (e) => {
    state.titleSize = Number(e.target.value);
    el('titleSizeVal').textContent = `${Math.round(state.titleSize * 100)}%`;
    redraw();
  });
  el('sun').addEventListener('change', (e) => { state.sun = e.target.checked; redraw(); });
  el('grain').addEventListener('change', (e) => { state.grain = e.target.checked; redraw(); });
  el('border').addEventListener('change', (e) => { state.border = e.target.checked; redraw(); });
  el('stars').addEventListener('change', (e) => { state.stars = e.target.checked; redraw(); });
  const cropInput = (key, fmt) => (e) => {
    const crop = state.panels[state.selected];
    crop[key] = Number(e.target.value);
    el(`${key}Val`).textContent = fmt(crop[key]);
    redraw();
  };
  el('zoom').addEventListener('input', cropInput('zoom', (v) => `${Math.round(v * 100)}%`));
  el('panX').addEventListener('input', cropInput('panX', (v) => `${v}`));
  el('panY').addEventListener('input', cropInput('panY', (v) => `${v}`));
  el('export').addEventListener('click', () => exportCover(state.size));
  el('exportAll').addEventListener('click', async () => {
    for (const size of SIZES) await exportCover(size.id);
  });
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) { e.preventDefault(); undo(); }
    if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'y' || (e.key.toLowerCase() === 'z' && e.shiftKey))) { e.preventDefault(); redo(); }
  });
}

// --- boot ------------------------------------------------------------------

const query = new URLSearchParams(location.search);
const shot = query.get('shot');
if (shot === 'cover') {
  document.body.classList.add('shot-cover');
  // A cover shot renders at its export aspect, not the preview's 16:9.
  const shotSize = SIZES.find((s) => s.id === query.get('size'));
  if (shotSize) { canvas.width = shotSize.w; canvas.height = shotSize.h; }
}
if (shot === 'editor') document.body.classList.add('shot-editor');

resetPanels();
syncControls();
bindControls();
bindCanvas();
updateHistoryButtons();
redraw();

if (shot) {
  runShot(shot, query, state, redraw).catch(() => { window.__shotReady = true; });
} else {
  loadSamples();
}
