// Neon Coast Key-Art Studio — panel layouts (v3: 12 layouts).
//
// A layout splits the poster's art area (everything except the title band)
// into panels. Coordinates are fractions of that area, 0 to 1. Each panel
// is a polygon, so diagonal "slashed" panels are possible, and a panel may
// carry a small rotation for the tilted-snapshot look. The renderer draws
// the gutters and ink frames; the geometry here only says where each photo
// goes. New in v3: Film Strip (four tall frames over a wide banner),
// Spotlight (one big centre panel flanked by two narrow wings) and
// Diagonal Duo (two comic slashes, one photo each, face to face).

// Rectangle panel: (x, y) is the top-left corner, (w, h) its size, all as
// fractions of the art area. `tilt` rotates it a few degrees, in degrees.
function box(x, y, w, h, tilt = 0) {
  return {
    pts: [
      [x, y],
      [x + w, y],
      [x + w, y + h],
      [x, y + h],
    ],
    rot: tilt,
  };
}

// Diagonal panel: same rectangle, but the top edge is sheared sideways by
// `shear`, so the panel reads as a comic-book slash.
function diagonal(x, y, w, h, shear) {
  return {
    pts: [
      [x + shear, y],
      [x + w, y],
      [x + w - shear, y + h],
      [x, y + h],
    ],
    rot: 0,
  };
}

export const LAYOUTS = [
  {
    id: 'hero-trio',
    name: 'Hero + Trio',
    blurb: 'One big hero panel, three stacked beside it.',
    panels: [
      box(0, 0, 0.62, 1),
      box(0.62, 0, 0.38, 0.34),
      box(0.62, 0.34, 0.38, 0.33),
      box(0.62, 0.67, 0.38, 0.33),
    ],
  },
  {
    id: 'cast-grid',
    name: 'Whole-Cast Grid',
    blurb: 'Nine panels — the whole cast on one poster.',
    panels: [
      box(0, 0, 1 / 3, 1 / 3),
      box(1 / 3, 0, 1 / 3, 1 / 3),
      box(2 / 3, 0, 1 / 3, 1 / 3),
      box(0, 1 / 3, 1 / 3, 1 / 3),
      box(1 / 3, 1 / 3, 1 / 3, 1 / 3),
      box(2 / 3, 1 / 3, 1 / 3, 1 / 3),
      box(0, 2 / 3, 1 / 3, 1 / 3),
      box(1 / 3, 2 / 3, 1 / 3, 1 / 3),
      box(2 / 3, 2 / 3, 1 / 3, 1 / 3),
    ],
  },
  {
    id: 'slashed',
    name: 'Slashed Comic',
    blurb: 'Three diagonal comic slashes across the poster.',
    panels: [
      diagonal(0, 0, 0.42, 1, 0.1),
      diagonal(0.36, 0, 0.42, 1, 0.1),
      diagonal(0.72, 0, 0.38, 1, 0.1),
    ],
  },
  {
    id: 'tilted-snaps',
    name: 'Tilted Snapshots',
    blurb: 'Overlapping tilted snapshots, polaroid style.',
    panels: [
      box(0.02, 0.06, 0.44, 0.82, -5),
      box(0.3, 0.12, 0.44, 0.82, 4),
      box(0.58, 0.04, 0.4, 0.82, -3),
    ],
  },
  {
    id: 'full-bleed',
    name: 'Full Bleed',
    blurb: 'One photo edge to edge, title over the sky.',
    panels: [box(0, 0, 1, 1)],
  },
  {
    id: 'duo-strip',
    name: 'Duo + Strip',
    blurb: 'Two leads on top, a wide strip below.',
    panels: [
      box(0, 0, 0.5, 0.66),
      box(0.5, 0, 0.5, 0.66),
      box(0, 0.66, 1, 0.34),
    ],
  },
  {
    id: 'triptych',
    name: 'Triptych',
    blurb: 'Three tall panels, three moments.',
    panels: [
      box(0, 0, 1 / 3, 1),
      box(1 / 3, 0, 1 / 3, 1),
      box(2 / 3, 0, 1 / 3, 1),
    ],
  },
  {
    id: 'hero-top',
    name: 'Hero Top',
    blurb: 'Wide hero on top, three small frames below.',
    panels: [
      box(0, 0, 1, 0.62),
      box(0, 0.62, 1 / 3, 0.38),
      box(1 / 3, 0.62, 1 / 3, 0.38),
      box(2 / 3, 0.62, 1 / 3, 0.38),
    ],
  },
  {
    id: 'quad-banner',
    name: 'Quad + Banner',
    blurb: 'Four squares over a wide banner panel.',
    panels: [
      box(0, 0, 0.5, 0.36),
      box(0.5, 0, 0.5, 0.36),
      box(0, 0.36, 0.5, 0.36),
      box(0.5, 0.36, 0.5, 0.36),
      box(0, 0.72, 1, 0.28),
    ],
  },
  {
    id: 'film-strip',
    name: 'Film Strip',
    blurb: 'Four tall film frames over a wide closing shot.',
    panels: [
      box(0, 0, 0.25, 0.7),
      box(0.25, 0, 0.25, 0.7),
      box(0.5, 0, 0.25, 0.7),
      box(0.75, 0, 0.25, 0.7),
      box(0, 0.7, 1, 0.3),
    ],
  },
  {
    id: 'spotlight',
    name: 'Spotlight',
    blurb: 'One big centre panel, two narrow wings watching it.',
    panels: [
      box(0, 0, 0.26, 1),
      box(0.26, 0, 0.48, 1),
      box(0.74, 0, 0.26, 1),
    ],
  },
  {
    id: 'diagonal-duo',
    name: 'Diagonal Duo',
    blurb: 'Two big comic slashes leaning into each other.',
    panels: [
      diagonal(0, 0, 0.56, 1, 0.14),
      diagonal(0.44, 0, 0.56, 1, -0.14),
    ],
  },
];

// Look a layout up by id; unknown ids fall back to the first layout.
export function layoutById(id) {
  for (const layout of LAYOUTS) {
    if (layout.id === id) return layout;
  }
  return LAYOUTS[0];
}
