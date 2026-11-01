# Gothic Ink art pack

Fight-screen figures for every hero class and every monster, plus the town walkers (heroes and NPCs, also the
character-screen doll), and the town itself: ground (grass, paths, cobbles, water, palisade) and every
prop (tents, trees, wagon, longhouse, stall, campfire, torches, fountain, signs, chest, lecterns, the dummy), in the Gothic Ink style (heavy black ink,
big shadow shapes, muted colours, cut-paper angles).

- `paperforge.html`: PAPERFORGE v0.4.4, used to draw humans, undead, giants and demons from gear loadouts.
- `ink.js` + `monsters.js`: hand-coded bodies in the same style for beasts, constructs, elementals, plants
  and fliers, coloured by the monster's element.
- `looks.js`: which drawing each hero, monster and town NPC gets (gear loadouts, faces, sizes).
  Town walkers are strips of 4 idle + 6 walk frames (`town_*.webp`), mirrored to face left.
- `render.js`: renders everything to `public/img/ink/*.webp` and writes the manifest into `src/inkart.js`.
  Run from the repo root: `node design/inkart/render.js` (needs Playwright with Chromium), then `node build.js`.

New monster in data.js? Re-run render.js; until then it shows the old drawn figure.

## Removing it

1. Delete `src/inkart.js` (the build skips the pack when the file is missing).
2. Delete `public/img/ink/`.
3. Optional tidy-up: the `/*INKART*/` line in `src/template.html`, the INKART replace in `build.js`,
   the `CB_INK` lines at the top of `figure()`, `drawChar()`, `buildGround()`, `drawProp()` and `drawScarecrow()`, the `ink:` key in `palFor()` and the
   `n.pal.ink` line after `NPCS` (all in `src/template.html`).

The game falls back to the original drawn figures by itself.

## The interface theme (src/inkui.js)
Stone frames, wooden buttons and inked controls for the whole UI, drawn in code at load (no image files) and scoped
under `body.inkui`. Players can switch it off in Menu > Settings ("Gothic Ink interface"); the choice is saved per browser.
To remove it: delete `src/inkui.js` (the build skips the missing file). Optional tidy-up: the `/*INKUI*/` line in
src/template.html, its `.replace` in build.js, and the `setInkUi` checkbox in openMenu (it hides itself when the file is gone).
