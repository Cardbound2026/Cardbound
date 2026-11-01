# Gothic Ink art pack

Fight-screen figures for every hero class and every monster, in the Gothic Ink style (heavy black ink,
big shadow shapes, muted colours, cut-paper angles).

- `paperforge.html`: PAPERFORGE v0.4.4, used to draw humans, undead, giants and demons from gear loadouts.
- `ink.js` + `monsters.js`: hand-coded bodies in the same style for beasts, constructs, elementals, plants
  and fliers, coloured by the monster's element.
- `looks.js`: which drawing each hero and monster gets (gear loadouts, faces, sizes).
- `render.js`: renders everything to `public/img/ink/*.webp` and writes the manifest into `src/inkart.js`.
  Run from the repo root: `node design/inkart/render.js` (needs Playwright with Chromium), then `node build.js`.

New monster in data.js? Re-run render.js; until then it shows the old drawn figure.

## Removing it

1. Delete `src/inkart.js` (the build skips the pack when the file is missing).
2. Delete `public/img/ink/`.
3. Optional tidy-up: the `/*INKART*/` line in `src/template.html`, the INKART replace in `build.js`,
   and the one `CB_INK` line at the top of `figure()` in `src/template.html`.

The game falls back to the original drawn figures by itself.
