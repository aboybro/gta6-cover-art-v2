// Neon Coast Key-Art Studio — panel layouts.
// Every layout is a list of panels inside the art area (the cover minus the
// title band). Coordinates are fractions of the art area, 0..1. A panel is a
// polygon (pts) so diagonal "slashed" panels are possible, plus an optional
// rotation in degrees for the tilted snapshot look. Gutters and ink frames
// are drawn by the renderer, not baked into the geometry.

/** A plain rectangle panel from fractions of the art area. */
function rect(x, y, w, h, rot = 0) {
  return { pts: [[x, y], [x + w, y], [x + w, y + h], [x, y + h]], rot };
}

/** A parallelogram panel: a rectangle sheared by `slant` on its top edge. */
function slash(x, y, w, h, slant) {
  return { pts: [[x + slant, y], [x + w, y], [x + w - slant, y + h], [x, y + h]], rot: 0 };
}

export const LAYOUTS = [
  {
    id: 'hero-trio',
    name: 'Hero + Trio',
    blurb: 'One big hero panel, three stacked beside it.',
    panels: [
      rect(0, 0, 0.62, 1),
      rect(0.62, 0, 0.38, 0.34),
      rect(0.62, 0.34, 0.38, 0.33),
      rect(0.62, 0.67, 0.38, 0.33),
    ],
  },
  {
    id: 'cast-grid',
    name: 'Whole-Cast Grid',
    blurb: 'Nine panels — the whole cast on one poster.',
    panels: [
      rect(0, 0, 1 / 3, 1 / 3), rect(1 / 3, 0, 1 / 3, 1 / 3), rect(2 / 3, 0, 1 / 3, 1 / 3),
      rect(0, 1 / 3, 1 / 3, 1 / 3), rect(1 / 3, 1 / 3, 1 / 3, 1 / 3), rect(2 / 3, 1 / 3, 1 / 3, 1 / 3),
      rect(0, 2 / 3, 1 / 3, 1 / 3), rect(1 / 3, 2 / 3, 1 / 3, 1 / 3), rect(2 / 3, 2 / 3, 1 / 3, 1 / 3),
    ],
  },
  {
    id: 'slashed',
    name: 'Slashed Comic',
    blurb: 'Three diagonal comic slashes across the poster.',
    panels: [
      slash(0, 0, 0.42, 1, 0.10),
      slash(0.36, 0, 0.42, 1, 0.10),
      slash(0.72, 0, 0.38, 1, 0.10),
    ],
  },
  {
    id: 'tilted-snaps',
    name: 'Tilted Snapshots',
    blurb: 'Overlapping tilted snapshots, polaroid style.',
    panels: [
      rect(0.02, 0.06, 0.44, 0.82, -5),
      rect(0.30, 0.12, 0.44, 0.82, 4),
      rect(0.58, 0.04, 0.40, 0.82, -3),
    ],
  },
  {
    id: 'full-bleed',
    name: 'Full Bleed',
    blurb: 'One photo edge to edge, title over the sky.',
    panels: [rect(0, 0, 1, 1)],
  },
  {
    id: 'duo-strip',
    name: 'Duo + Strip',
    blurb: 'Two leads on top, a wide strip below.',
    panels: [
      rect(0, 0, 0.5, 0.66),
      rect(0.5, 0, 0.5, 0.66),
      rect(0, 0.66, 1, 0.34),
    ],
  },
  {
    id: 'triptych',
    name: 'Triptych',
    blurb: 'Three tall panels, three moments.',
    panels: [
      rect(0, 0, 1 / 3, 1),
      rect(1 / 3, 0, 1 / 3, 1),
      rect(2 / 3, 0, 1 / 3, 1),
    ],
  },
  {
    id: 'hero-top',
    name: 'Hero Top',
    blurb: 'Wide hero on top, three small frames below.',
    panels: [
      rect(0, 0, 1, 0.62),
      rect(0, 0.62, 1 / 3, 0.38),
      rect(1 / 3, 0.62, 1 / 3, 0.38),
      rect(2 / 3, 0.62, 1 / 3, 0.38),
    ],
  },
  {
    id: 'quad-banner',
    name: 'Quad + Banner',
    blurb: 'Four squares over a wide banner panel.',
    panels: [
      rect(0, 0, 0.5, 0.36),
      rect(0.5, 0, 0.5, 0.36),
      rect(0, 0.36, 0.5, 0.36),
      rect(0.5, 0.36, 0.5, 0.36),
      rect(0, 0.72, 1, 0.28),
    ],
  },
];

/** Finds a layout by id, falling back to the first one. */
export function layoutById(id) {
  return LAYOUTS.find((l) => l.id === id) ?? LAYOUTS[0];
}
