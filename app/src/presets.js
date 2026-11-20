// Neon Coast Key-Art Studio — one-click style presets (v3).
//
// A preset is a whole poster look in one click: a layout, a grade, a
// lettering style, a title position and a title that fits the mood. It is
// the fastest way from photos to a finished cover — one click, no fiddling
// — and the Auto Poster button picks the best preset for the photo count.
// A preset never touches the photos or the panel crops, so a cover built
// by hand keeps its photos when a preset is tried on top of it.

// Each preset: the layout and grade it pairs, the title lettering, where
// the title band sits, and a title that matches the mood.
export const STYLE_PRESETS = [
  {
    id: 'sunset-boulevard', name: 'Sunset Boulevard',
    layout: 'hero-trio', grade: 'vice-sunset',
    titleStyle: 'halftone', titlePos: 'bottom', title: 'Sunset Heist',
    blurb: 'Warm hero poster, sunset grade, halftone title.',
  },
  {
    id: 'neon-nights', name: 'Neon Nights',
    layout: 'cast-grid', grade: 'neon-coast',
    titleStyle: 'gradient', titlePos: 'bottom', title: 'Neon Coast',
    blurb: 'The whole cast on one neon grid, gradient title.',
  },
  {
    id: 'vice-vice', name: 'Vice Vice',
    layout: 'slashed', grade: 'vice-pink',
    titleStyle: 'outline', titlePos: 'top', title: 'Pink Vice',
    blurb: 'Comic slashes, hot pink grade, outlined title on top.',
  },
  {
    id: 'heat-wave', name: 'Heat Wave',
    layout: 'hero-top', grade: 'afterglow',
    titleStyle: 'chrome', titlePos: 'bottom', title: 'Afterglow Run',
    blurb: 'Wide hero under an afterglow sky, chrome title.',
  },
];

// Look a preset up by id; unknown ids fall back to the first preset.
export function presetById(id) {
  for (const preset of STYLE_PRESETS) {
    if (preset.id === id) return preset;
  }
  return STYLE_PRESETS[0];
}

// Apply a preset to the editor state: layout, grade, lettering, position
// and title. Photos and panel crops are left exactly as they are.
export function applyStylePreset(state, presetId) {
  const preset = presetById(presetId);
  state.layout = preset.layout;
  state.grade = preset.grade;
  state.titleStyle = preset.titleStyle;
  state.titlePos = preset.titlePos;
  state.title = preset.title;
  return preset;
}

// The best preset for a photo count: the neon cast grid when there are
// enough photos to fill it, the warm hero poster otherwise. Deterministic:
// the same photo count always picks the same preset.
export function bestPresetFor(count) {
  if (count >= 5) return 'neon-nights';
  if (count >= 3) return 'sunset-boulevard';
  if (count === 2) return 'vice-vice';
  return 'heat-wave';
}

// Surprise Me: a random preset and a random photo in every panel, so one
// click re-rolls the whole poster. Random by design — the shuffle button
// only re-rolls the crops.
export function surprisePreset(state) {
  const preset = STYLE_PRESETS[Math.floor(Math.random() * STYLE_PRESETS.length)];
  applyStylePreset(state, preset.id);
  const n = state.photos.length;
  if (n) {
    state.panels.forEach((panel) => {
      panel.photo = Math.floor(Math.random() * n);
    });
  }
  return preset;
}
