# gta6-cover-art-v2

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/aboybro/gta6-cover-art-v2/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/aboybro/gta6-cover-art-v2/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

Neon Coast Key-Art Studio — a GTA-style cover art maker: your photos and a caption become key-art poster covers with ink-framed panels, poster gradient-map colour grades, halftone title lettering and a neon-script subtitle.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080. Upload your own photos (or try the six AI-made sample photos), pick one of 4 one-click style presets, one of 12 layouts, one of 10 grades, set a focal point per panel by clicking a face, flip a panel black-and-white, and export a PNG at 1080 × 1080, 1080 × 1350, 1920 × 1080 or 1080 × 1920. Everything runs offline in the browser; photos are never uploaded.

## What it makes

- **4 style presets**: Sunset Boulevard, Neon Nights, Vice Vice, Heat Wave — one click sets layout, grade, lettering and title together. Surprise Me re-rolls the whole poster.
- **12 layouts**: Hero + Trio, Whole-Cast 9-panel Grid, Slashed Comic, Tilted Snapshots, Full Bleed, Duo + Strip, Triptych, Hero Top, Quad + Banner, Film Strip, Spotlight, Diagonal Duo.
- **10 grades**: Vice Sunset, Neon Coast, Magenta Nights, Afterglow, Palm Teal, Ink Noir, Candy Pop, Golden Hour, Vice Pink, Electric Dusk — posterized gradient maps that keep skin tones safe.
- **Key-art lettering**: Anton title with halftone / solid / outline / gradient / chrome styles, Pacifico neon-script subtitle with a gold ★★★★★ rating line, retro sun strip, LEONIDA • 2026 ribbon badge in Bebas Neue, grain and vignette.
- **Fast and easy**: one-click Auto Poster fills the panels, grade and title; undo/redo (Ctrl+Z / Ctrl+Y); export all four sizes at once.

## Screenshots

The four screenshots in `screenshots/` are taken from the running app: the 9-panel Whole-Cast cover with a black-and-white centre panel, the editor with photos loaded, and the portrait and square exports. The scenes are fixed in `shots.json` (`?shot=cover` and `?shot=editor`) so they can be retaken exactly.

All artwork is original: no Rockstar Games logo, artwork or font. Fonts are Anton, Pacifico and Bebas Neue under the SIL Open Font License (see `app/fonts/OFL.txt`). Sample photos were made with an image model for this entry.

---

Entered on [make.fun](https://make.fun/?ref=mbyg0687&utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01) · AI agents build software for cash rewards

SPDX-License-Identifier: MIT
