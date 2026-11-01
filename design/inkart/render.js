// Renders every hero and monster figure in the Gothic Ink style into public/img/ink/*.webp and writes the
// manifest into src/inkart.js (between the INK-MANIFEST markers). Usage (repo root): node design/inkart/render.js
// Needs Playwright with Chromium. Heroes face right; monsters face left, toward the heroes.
const { chromium } = require('playwright'); const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..', '..'), OUT = path.join(ROOT, 'public', 'img', 'ink');
const src = fs.readFileSync(path.join(ROOT, 'src', 'data.js'), 'utf8'); const DATA = JSON.parse(src.slice(src.indexOf('{'), src.lastIndexOf('}') + 1));
const { HEROES, NPCS, spec } = require('./looks.js');
const BASE = 220; // image height in px for a normal fighter (shown at half size, so it stays sharp)
(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const b = await chromium.launch(); const pg = await b.newPage({ viewport: { width: 1400, height: 900 } });
  const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.goto('file://' + path.join(__dirname, 'paperforge.html')); await pg.waitForTimeout(1200);
  await pg.addScriptTag({ content: fs.readFileSync(path.join(__dirname, 'ink.js'), 'utf8') });
  await pg.addScriptTag({ content: fs.readFileSync(path.join(__dirname, 'monsters.js'), 'utf8') });
  // crop to the drawn pixels, then scale so a normal fighter is BASE px tall (bigger monsters by their size)
  await pg.evaluate(`window.__fit = (cv, targetH) => { const c = cv.getContext('2d'), d = c.getImageData(0, 0, cv.width, cv.height).data; let x0 = cv.width, y0 = cv.height, x1 = 0, y1 = 0;
    for (let y = 0; y < cv.height; y++) for (let x = 0; x < cv.width; x++) if (d[(y * cv.width + x) * 4 + 3] > 8) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    const w = x1 - x0 + 1, h = y1 - y0 + 1, k = targetH / h, o = document.createElement('canvas'); o.width = Math.round(w * k); o.height = Math.round(targetH);
    const oc = o.getContext('2d'); oc.imageSmoothingQuality = 'high'; oc.drawImage(cv, x0, y0, w, h, 0, 0, o.width, o.height); return o.toDataURL('image/webp', 0.86); };`);
  // ONLY=hero_warlock (comma list of image names) renders just those and keeps the rest of the manifest
  const ONLY = process.env.ONLY ? process.env.ONLY.split(',') : null, want = (n) => !ONLY || ONLY.includes(n);
  const manifest = ONLY ? JSON.parse(fs.readFileSync(path.join(ROOT, 'src', 'inkart.js'), 'utf8').match(/\/\*INK-MANIFEST\*\/([\s\S]*?)\/\*END\*\//)[1]) : { heroes: {}, enemies: {} };
  const save = (name, url) => fs.writeFileSync(path.join(OUT, name + '.webp'), Buffer.from(url.split(',')[1], 'base64'));
  const pfShot = (look, mirror, h) => pg.evaluate(`(() => { const L = ${JSON.stringify(look)}; const next = makeState(); next.art = clone(state.art); next.body = clone(state.body); next.ink = state.ink; next.darkness = state.darkness; next.wear = state.wear;
      next.faceType = L.face; next.hair = L.hair; next.beard = L.beard; next.mark = L.mark; next.skin = L.skin || (L.face === 'orc' ? SKINS[8] : L.face === 'skull' ? SKINS[6] : L.face === 'revenant' ? SKINS[9] : SKINS[1]); next.hairColor = '#4a4037';
      for (let i = 0; i < SLOTS.length; i++) next.gear[SLOTS[i]].id = L.items[i]; applyPalette(next, L.scheme, false); state = next; invalidate();
      return __fit(compose(state, 540, 0, ${mirror ? 'true' : 'false'}), ${h}); })()`);
  // PAPERFORGE heads/weapons stick out above the body: a hero's image is a bit taller than BASE for the same body size
  for (const [cls, look] of Object.entries(HEROES)) { if (!want('hero_' + cls.toLowerCase())) continue; save('hero_' + cls.toLowerCase(), await pfShot(look, false, BASE * 1.12)); manifest.heroes[cls] = 1.12; }
  let n = 0;
  for (const [key, e] of Object.entries(DATA.enemies)) {
    if (!want(key)) continue; const s = spec(key, e); let url, size;
    if (s.kind === 'pf') { const look = Object.assign({}, s.look); if (s.faceOverride) look.face = s.faceOverride; if (s.skin) look.skin = s.skin; size = s.size * 1.12; url = await pfShot(look, true, BASE * size); }
    else {
      size = s.size * (s.body === 'beast' ? .82 : s.body === 'flier' ? .7 : 1);
      url = await pg.evaluate(`(() => { const B = InkMonsters.bodies[${JSON.stringify(s.body)}], k = 1.6, cv = document.createElement('canvas'); cv.width = B.w * k; cv.height = B.h * k; const c = cv.getContext('2d'); c.scale(k, k);
        B.draw(c, ${JSON.stringify(s.el)}, ${JSON.stringify(s.o)}); return __fit(cv, ${BASE * size}); })()`);
    }
    save(key, url); manifest.enemies[key] = Math.round(size * 100) / 100; n++;
  }
  // town walkers: 4 idle + 6 walk frames per character in one strip, all cropped to one shared box so the feet stay put
  manifest.town = ONLY ? manifest.town || {} : {};
  const townLooks = Object.assign({}, ...Object.entries(HEROES).map(([c, l]) => ({ ['hero_' + c.toLowerCase()]: l })), ...Object.entries(NPCS).map(([k, l]) => ({ ['npc_' + k]: l })));
  for (const [key, look] of Object.entries(townLooks)) {
    if (!want('town_' + key)) continue;
    const r = await pg.evaluate(`(() => { const L = ${JSON.stringify(look)}; const next = makeState(); next.art = clone(state.art); next.body = clone(state.body); next.ink = state.ink; next.darkness = state.darkness; next.wear = state.wear;
      next.faceType = L.face; next.hair = L.hair; next.beard = L.beard; next.mark = L.mark; next.skin = L.skin || (L.face === 'orc' ? SKINS[8] : L.face === 'skull' ? SKINS[6] : L.face === 'revenant' ? SKINS[9] : SKINS[1]); next.hairColor = '#4a4037';
      for (let i = 0; i < SLOTS.length; i++) next.gear[SLOTS[i]].id = L.items[i]; applyPalette(next, L.scheme, false); state = next; invalidate();
      const frames = []; for (let i = 0; i < 4; i++) frames.push(motionCompose(state, 360, 'idle', i / 4)); for (let i = 0; i < 6; i++) frames.push(motionCompose(state, 360, 'walk', i / 6));
      let x0 = 1e9, y0 = 1e9, x1 = 0, y1 = 0; const W = frames[0].width, H = frames[0].height;
      for (const f of frames) { const d = f.getContext('2d').getImageData(0, 0, W, H).data; for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (d[(y * W + x) * 4 + 3] > 8) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; } }
      // the feet: centre of the lowest drawn rows of the first idle frame
      const d0 = frames[0].getContext('2d').getImageData(0, 0, W, H).data; let fx = 0, fn = 0; for (let y = y1 - 6; y <= y1; y++) for (let x = 0; x < W; x++) if (d0[(y * W + x) * 4 + 3] > 8) { fx += x; fn++; }
      const k = 130 / (y1 - y0 + 1), cw = Math.round((x1 - x0 + 1) * k), ch = 130, o = document.createElement('canvas'); o.width = cw * frames.length; o.height = ch; const oc = o.getContext('2d'); oc.imageSmoothingQuality = 'high';
      frames.forEach((f, i) => oc.drawImage(f, x0, y0, x1 - x0 + 1, y1 - y0 + 1, i * cw, 0, cw, ch));
      return { url: o.toDataURL('image/webp', 0.88), w: cw, h: ch, ax: Math.round(((fn ? fx / fn : (x0 + x1) / 2) - x0) * k) }; })()`);
    save('town_' + key, r.url); manifest.town[key] = { w: r.w, h: r.h, ax: r.ax, n: 10 };
  }
  await b.close();
  if (errs.length) { console.log('render errors', errs); process.exit(1); }
  // write the manifest into src/inkart.js
  const f = path.join(ROOT, 'src', 'inkart.js'); let js = fs.readFileSync(f, 'utf8');
  js = js.replace(/\/\*INK-MANIFEST\*\/[\s\S]*?\/\*END\*\//, '/*INK-MANIFEST*/' + JSON.stringify(manifest) + '/*END*/');
  fs.writeFileSync(f, js);
  console.log('rendered', n, 'monsters and', Object.keys(manifest.heroes).length, 'heroes into public/img/ink');
})();
