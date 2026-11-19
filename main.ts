// Neon Coast Key-Art Studio — a gta6-cover-art-01 entry (Node 22, standard
// library only). The app is this directory's app/ folder: plain static files
// a desktop browser loads offline (app/index.html and its ES modules, the
// Anton + Pacifico fonts under app/fonts/, four AI-made sample photos under
// app/samples/ — no network request, no Rockstar artwork or font). This
// program hands the entry in: it copies app/ and screenshots/ from beside
// this file to /output and writes /output/dossier.json, the summary the
// judge reads, with the vendored make.fun library.
//
// The app turns a person's photos and a caption into key-art poster covers:
// 9 layouts (hero, whole-cast 9-panel grid, slashed comic, tilted
// snapshots, full bleed and more), 8 poster gradient-map grades that keep
// skin tones safe, focal-point cropping per panel, halftone title lettering
// with a neon-script subtitle, a retro sun strip and a LEONIDA ribbon badge,
// undo/redo and one-click Auto Poster. Exports are PNGs at 1080x1080,
// 1080x1350, 1920x1080 and 1080x1920.
//
// Serve it locally with `node serve.ts`, then open http://localhost:8080.
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// The gate refuses more than 4 screenshots or one over 256 KiB, so check
// the snapshot before the dossier is built and fail loudly instead of
// handing in an entry the scorer would refuse.
const SHOT_DIR = join(here, 'screenshots');
const shotNames = existsSync(SHOT_DIR) ? readdirSync(SHOT_DIR).filter((n) => !n.startsWith('.')).sort() : [];
if (shotNames.length < 3 || shotNames.length > 4) {
  throw new Error(`expected 3 or 4 screenshots, found ${shotNames.length}`);
}
for (const name of shotNames) {
  const bytes = statSync(join(SHOT_DIR, name)).size;
  if (bytes > 262144) throw new Error(`screenshot ${name} is ${bytes} bytes, over the 256 KiB cap`);
  // A screenshot must be a whole PNG or JPEG, not a truncated file: check
  // the magic bytes before the dossier is built.
  const head = readFileSync(join(SHOT_DIR, name));
  const isPng = head[0] === 0x89 && head[1] === 0x50 && head[2] === 0x4e && head[3] === 0x47;
  const isJpeg = head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff;
  if (!isPng && !isJpeg) throw new Error(`screenshot ${name} is not a PNG or JPEG`);
}
if (!existsSync(join(here, 'app', 'index.html'))) {
  throw new Error('app/index.html is missing');
}

mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
cpSync(SHOT_DIR, join(out, 'screenshots'), { recursive: true });

// The scorer's own caps (reference/gate.json): only text_max_bytes shapes
// the bytes; the others refuse an entry the scorer would refuse (more than
// 4 screenshots or one over 256 KiB; more than 993 files in app/ or 48 MiB
// of app files, in all, or a path under app/ over 1000 bytes: app/ counts
// beside /output's own 1000-entry cap, its screenshots/ and dossier.json).
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
    app_path_max_bytes: 1000,
  }),
);

// A one-line receipt on stdout: the dossier's bytes and the screenshots it
// carries, so a run's output can be eyeballed without opening the files.
const dossierBytes = statSync(join(out, 'dossier.json')).size;
console.log(`neon-coast: dossier.json ${dossierBytes} bytes, screenshots: ${shotNames.join(', ')}`);
