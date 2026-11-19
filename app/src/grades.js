// Neon Coast Key-Art Studio — colour grades.
// Each grade is a poster gradient map: shadows, midtones and highlights are
// remapped onto a sunset / neon palette and posterized into flat comic
// levels. Skin-safe: pixels that read as skin keep more of the original
// photo, so faces never turn plastic orange or green.

export const GRADES = [
  {
    id: 'vice-sunset', name: 'Vice Sunset',
    shadow: [26, 8, 46], mid: [214, 74, 110], high: [255, 196, 110],
    levels: 6, skinKeep: 0.72, tint: 'rgba(255,120,40,0.10)',
  },
  {
    id: 'neon-coast', name: 'Neon Coast',
    shadow: [8, 16, 54], mid: [24, 160, 190], high: [255, 214, 120],
    levels: 6, skinKeep: 0.72, tint: 'rgba(0,220,255,0.08)',
  },
  {
    id: 'magenta-nights', name: 'Magenta Nights',
    shadow: [30, 4, 44], mid: [196, 30, 130], high: [255, 170, 220],
    levels: 5, skinKeep: 0.75, tint: 'rgba(255,0,160,0.08)',
  },
  {
    id: 'afterglow', name: 'Afterglow',
    shadow: [40, 14, 10], mid: [232, 110, 40], high: [255, 232, 170],
    levels: 6, skinKeep: 0.7, tint: 'rgba(255,140,0,0.10)',
  },
  {
    id: 'palm-teal', name: 'Palm Teal',
    shadow: [6, 34, 34], mid: [20, 150, 130], high: [220, 255, 200],
    levels: 6, skinKeep: 0.75, tint: 'rgba(0,200,170,0.08)',
  },
  {
    id: 'ink-noir', name: 'Ink Noir',
    shadow: [10, 10, 14], mid: [90, 90, 110], high: [245, 245, 250],
    levels: 5, skinKeep: 0.68, tint: 'rgba(120,120,255,0.06)',
  },
  {
    id: 'candy-pop', name: 'Candy Pop',
    shadow: [50, 10, 80], mid: [255, 90, 160], high: [255, 240, 120],
    levels: 7, skinKeep: 0.755, tint: 'rgba(255,80,200,0.07)',
  },
  {
    id: 'golden-hour', name: 'Golden Hour',
    shadow: [52, 28, 8], mid: [220, 140, 50], high: [255, 246, 210],
    levels: 6, skinKeep: 0.7, tint: 'rgba(255,180,60,0.10)',
  },
];

/** Finds a grade by id, falling back to the first one. */
export function gradeById(id) {
  return GRADES.find((g) => g.id === id) ?? GRADES[0];
}

/** Rough skin test on an sRGB pixel: warm, mid-saturation, red-dominant. */
export function isSkin(r, g, b) {
  if (!(r > 90 && r > g && g > b)) return false;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  if (max - min < 18 || max - min > 110) return false;
  const hue = (r - g) / Math.max(1, max - min);
  return hue > 0.25 && hue < 1.4;
}

/**
 * Grades one photo image into a cached offscreen canvas. The photo is drawn
 * at `width` pixels wide, then every pixel is posterized and gradient-mapped
 * (shadow -> mid -> high). Skin pixels keep `skinKeep` of the original.
 * Returns a canvas the renderer draws panels from.
 */
export function gradePhoto(img, grade, width = 960) {
  const scale = width / img.naturalWidth;
  const height = Math.max(1, Math.round(img.naturalHeight * scale));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0, width, height);
  const data = ctx.getImageData(0, 0, width, height);
  const px = data.data;
  const { shadow, mid, high, levels, skinKeep } = grade;
  const mix = grade.mix ?? 0.62;
  const step = 1 / levels;
  for (let i = 0; i < px.length; i += 4) {
    const r = px[i];
    const g = px[i + 1];
    const b = px[i + 2];
    // Luminance, posterized into flat comic levels.
    let lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    lum = Math.min(1, Math.floor(lum / step) * step + step / 2);
    // Gradient map: shadow -> mid below 0.5, mid -> high above it.
    let mr;
    let mg;
    let mb;
    if (lum < 0.5) {
      const t = lum / 0.5;
      mr = shadow[0] + (mid[0] - shadow[0]) * t;
      mg = shadow[1] + (mid[1] - shadow[1]) * t;
      mb = shadow[2] + (mid[2] - shadow[2]) * t;
    } else {
      const t = (lum - 0.5) / 0.5;
      mr = mid[0] + (high[0] - mid[0]) * t;
      mg = mid[1] + (high[1] - mid[1]) * t;
      mb = mid[2] + (high[2] - mid[2]) * t;
    }
    // Blend the poster map with the original so the photo stays readable,
    // and keep skin pixels closer to the original than the rest.
    if (isSkin(r, g, b)) {
      px[i] = mr + (r - mr) * skinKeep;
      px[i + 1] = mg + (g - mg) * skinKeep;
      px[i + 2] = mb + (b - mb) * skinKeep;
    } else {
      px[i] = mr * mix + r * (1 - mix);
      px[i + 1] = mg * mix + g * (1 - mix);
      px[i + 2] = mb * mix + b * (1 - mix);
    }
  }
  ctx.putImageData(data, 0, 0);
  if (grade.tint) {
    ctx.fillStyle = grade.tint;
    ctx.fillRect(0, 0, width, height);
  }
  return canvas;
}
