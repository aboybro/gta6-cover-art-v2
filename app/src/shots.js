// Fixed scenes for screenshots: ?shot=cover shows one exported cover alone,
// ?shot=editor shows the editor with photos loaded. Query parameters pick the
// scene: layout, grade, title, subtitle, titleStyle, titlePos, size, photos
// (a comma list of sample names) and sun/grain/border (0 or 1).
// window.__shotReady is set once the scene is painted.
import { loadImage } from './main.js';
import { defaultCrop } from './main.js';
import { layoutById } from './layouts.js';

/** Applies the scene's query parameters to the editor state. */
export function applyShotQuery(query, state) {
  const set = (key, value) => {
    if (value !== null && value !== undefined && value !== '') state[key] = value;
  };
  set('layout', query.get('layout'));
  set('grade', query.get('grade'));
  set('title', query.get('title'));
  set('subtitle', query.get('subtitle'));
  set('titleStyle', query.get('titleStyle'));
  set('titlePos', query.get('titlePos'));
  set('size', query.get('size'));
  if (query.get('titleSize')) state.titleSize = Number(query.get('titleSize'));
  for (const key of ['sun', 'grain', 'border']) {
    const value = query.get(key);
    if (value === '0') state[key] = false;
    if (value === '1') state[key] = true;
  }
}

/** Loads the named samples and spreads them across the panels. */
export async function loadShotPhotos(query, state) {
  const names = (query.get('photos') ?? 'neon-duo,harbor-heist,beach-chase,rooftop-night').split(',').map((s) => s.trim()).filter(Boolean);
  state.photos = [];
  for (const name of names) {
    try {
      const img = await loadImage(`samples/${name}.jpg`);
      state.photos.push({ img, name: name[0].toUpperCase() + name.slice(1) });
    } catch {
      // A missing sample is skipped; the other photos still fill the cover.
    }
  }
  // Panels alternate through the photos so one scene shows them all.
  state.panels = [];
  const n = layoutById(state.layout).panels.length;
  for (let i = 0; i < n; i++) {
    const crop = defaultCrop(i);
    crop.photo = state.photos.length ? i % state.photos.length : 0;
    state.panels.push(crop);
  }
}

/** Runs one screenshot scene, then flags the page ready to capture. */
export async function runShot(shot, query, state, redraw) {
  if (shot === 'cover') document.body.classList.add('shot-cover');
  applyShotQuery(query, state);
  await loadShotPhotos(query, state);
  // The Anton and Pacifico display fonts must be in before the title paints.
  try {
    await document.fonts.load('100px Anton');
    await document.fonts.load('40px Pacifico');
    await document.fonts.ready;
  } catch {
    // The fallback fonts still paint the title if a webfont fails to load.
  }
  redraw();
  requestAnimationFrame(() => requestAnimationFrame(() => {
    window.__shotReady = true;
  }));
}
