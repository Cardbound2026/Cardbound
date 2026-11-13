// ---------- Sound (Nov 13): background music for each part of the game and effects for hits, spells, blocks, cards and clicks.
// The music and effects were made for Cardbound with PixelLab (tools/audio/urls.txt lists them). To host them with the game instead,
// put the files in public/audio/ and change the addresses below. Menu > Sound has the volume sliders; nothing plays until your first click.
window.CB_AUDIO = (function () {
  const MUSIC = { "town": "https://backblaze.pixellab.ai/file/pixellab-characters/audio/a9b16777-50de-4267-a590-5e77ac4df623/d4461fbf-6664-4b02-ba27-2857400913ce/cardbound-emberwatch.mp3", "title": "https://backblaze.pixellab.ai/file/pixellab-characters/audio/a9b16777-50de-4267-a590-5e77ac4df623/8a9acba6-9176-445f-806a-9d52e624e50e/cardbound-title.mp3", "road": "https://backblaze.pixellab.ai/file/pixellab-characters/audio/a9b16777-50de-4267-a590-5e77ac4df623/7973ebd3-f127-40c8-b0ae-f6517a0cc083/cardbound-the-road.mp3", "battle": "https://backblaze.pixellab.ai/file/pixellab-characters/audio/a9b16777-50de-4267-a590-5e77ac4df623/e6a5c0bd-7501-47ef-90fe-2e1385a3ad56/cardbound-battle.mp3", "boss": "https://backblaze.pixellab.ai/file/pixellab-characters/audio/a9b16777-50de-4267-a590-5e77ac4df623/84279f70-7e19-47e6-8985-edf0f5175188/cardbound-boss.mp3", "victory": "https://backblaze.pixellab.ai/file/pixellab-characters/audio/a9b16777-50de-4267-a590-5e77ac4df623/29a29e39-5a26-48c5-8888-e3d854e9bb6f/cardbound-victory.mp3", "defeat": "https://backblaze.pixellab.ai/file/pixellab-characters/audio/a9b16777-50de-4267-a590-5e77ac4df623/54161a03-c3df-4551-97dd-0e309303032e/cardbound-defeat.mp3" }, SFX = { "hit": "https://backblaze.pixellab.ai/file/pixellab-characters/audio/a9b16777-50de-4267-a590-5e77ac4df623/4db5bdb4-6d2b-480d-8715-c3f52136930d/cb-hit.wav", "crit": "https://backblaze.pixellab.ai/file/pixellab-characters/audio/a9b16777-50de-4267-a590-5e77ac4df623/a5293a38-b072-4cc3-9b88-85263453e626/cb-crit.wav", "cast": "https://backblaze.pixellab.ai/file/pixellab-characters/audio/a9b16777-50de-4267-a590-5e77ac4df623/ac32622e-d337-40ea-90bc-bfb3e07fb2ae/cb-cast.wav", "block": "https://backblaze.pixellab.ai/file/pixellab-characters/audio/a9b16777-50de-4267-a590-5e77ac4df623/86c80141-d934-42fc-845d-4504b48e7fb3/cb-block.wav", "heal": "https://backblaze.pixellab.ai/file/pixellab-characters/audio/a9b16777-50de-4267-a590-5e77ac4df623/45ac008e-938a-44c6-95c5-c433fdfd8895/cb-heal.wav", "card": "https://backblaze.pixellab.ai/file/pixellab-characters/audio/a9b16777-50de-4267-a590-5e77ac4df623/b669b193-1422-482e-b877-aa8daf8293f9/cb-card.wav", "click": "https://backblaze.pixellab.ai/file/pixellab-characters/audio/a9b16777-50de-4267-a590-5e77ac4df623/75a9b196-6abc-4344-9740-18574a59f8e7/cb-click.wav", "coins": "https://backblaze.pixellab.ai/file/pixellab-characters/audio/a9b16777-50de-4267-a590-5e77ac4df623/669e61b4-8b38-4741-ac6e-d2b0040c3315/cb-coins.wav", "death": "https://backblaze.pixellab.ai/file/pixellab-characters/audio/a9b16777-50de-4267-a590-5e77ac4df623/2e03c5b2-6d7b-4bf8-9a85-e0b6c8780366/cb-death.wav", "equip": "https://backblaze.pixellab.ai/file/pixellab-characters/audio/a9b16777-50de-4267-a590-5e77ac4df623/02c7aaec-ac2e-4925-997a-7ce9d71845f5/cb-equip.wav", "door": "https://backblaze.pixellab.ai/file/pixellab-characters/audio/a9b16777-50de-4267-a590-5e77ac4df623/bf63ebbb-1923-4ff9-90cf-1fb3d69233f9/cb-door.wav", "horn": "https://backblaze.pixellab.ai/file/pixellab-characters/audio/a9b16777-50de-4267-a590-5e77ac4df623/d3f3a6ce-19c5-4870-964b-f373dacb60c6/cb-horn.wav" };
  let set = { music: .35, sfx: .6 }; try { Object.assign(set, JSON.parse(localStorage.getItem('cb-sound') || '{}')); } catch (e) {}
  const save = () => { try { localStorage.setItem('cb-sound', JSON.stringify(set)); } catch (e) {} };
  let unlocked = false, want = null, cur = null, curKey = null, jing = null; const pool = {}, last = {};
  function fade(a, to, ms, then) { if (!a) return; const from = a.volume, t0 = performance.now(); clearInterval(a._f); a._f = setInterval(() => { const k = Math.min(1, (performance.now() - t0) / ms); a.volume = Math.max(0, Math.min(1, from + (to - from) * k)); if (k >= 1) { clearInterval(a._f); if (then) then(); } }, 40); }
  function music(key) {
    want = key; if (!unlocked || key === curKey) return; const old = cur; curKey = key; cur = null;
    if (old) fade(old, 0, 900, () => { old.pause(); old.src = ''; });
    if (!key || !MUSIC[key] || set.music <= 0) return;
    const a = new Audio(MUSIC[key]); a.loop = true; a.volume = 0; a.preload = 'auto'; cur = a; a.play().then(() => fade(a, set.music, 1400)).catch(() => {});
  }
  function jingle(key, secs) {   // a short piece over the top: the music ducks under it
    if (!unlocked || !MUSIC[key] || set.music <= 0) return; if (jing) { jing.pause(); jing = null; }
    const a = jing = new Audio(MUSIC[key]); a.volume = Math.min(1, set.music * 1.25); if (cur) fade(cur, set.music * .15, 300);
    a.play().catch(() => {}); setTimeout(() => fade(a, 0, 1500, () => { a.pause(); if (jing === a) jing = null; if (cur) fade(cur, set.music, 900); }), (secs || 9) * 1000);
  }
  function sfx(key, vol, delay) {
    if (!unlocked || !SFX[key] || set.sfx <= 0) return; const now = performance.now() + (delay || 0); if (last[key] && now - last[key] < 70) return; last[key] = now;
    const go = () => { const p = pool[key] || (pool[key] = []); let a = p.find(x => x.paused || x.ended); if (!a) { if (p.length >= 4) return; a = new Audio(SFX[key]); a.preload = 'auto'; p.push(a); } a.volume = Math.min(1, set.sfx * (vol == null ? 1 : vol)); try { a.currentTime = 0; } catch (e) {} a.play().catch(() => {}); };
    if (delay) setTimeout(go, delay); else go();
  }
  // fight effects (src/fx.js add(kind...)) -> sounds
  const FXS = { slash: 'hit', blunt: 'hit', claw: 'hit', pierce: 'hit', fire: 'hit', frost: 'hit', shadow: 'hit', arcane: 'hit', nature: 'hit', holy: 'hit', crit: 'crit', clank: 'block', block: 'block', shimmer: 'block', heal: 'heal', bolt: 'cast', aura: 'cast', smoke: 'cast' };
  function fx(kind, delay) { const k = FXS[kind]; if (k) sfx(k, k === 'hit' ? .8 : 1, delay); }
  function scene(which, cb) {
    if (which === 'title') music('title'); else if (which === 'start') music('town'); else if (which === 'map') music('road');
    else if (which === 'combat') { const boss = cb && cb.enemies && cb.enemies.some(e => e.tier === 'Boss' || e.raid || e.boss); music(boss ? 'boss' : 'battle'); if (cb && !cb.practice) sfx('horn', .5); }
  }
  function unlock() { if (unlocked) return; unlocked = true; if (want) { const w = want; curKey = null; music(w); } for (const k of ['click', 'card', 'hit']) { const a = new Audio(SFX[k]); a.preload = 'auto'; (pool[k] = pool[k] || []).push(a); } }
  document.addEventListener('pointerdown', unlock, true); document.addEventListener('keydown', unlock, true);
  document.addEventListener('click', (ev) => { const b = ev.target.closest && ev.target.closest('button, .btn, .seat, .selrow, [role="button"], .tabs button'); if (b && !b.disabled) sfx(b.matches('[data-equip], [data-dslot]') ? 'equip' : 'click', .55); }, true);
  document.addEventListener('visibilitychange', () => { if (cur) { if (document.hidden) cur.pause(); else cur.play().catch(() => {}); } });
  return { music, jingle, sfx, fx, scene, get: () => Object.assign({}, set), vol: (k, v) => { set[k] = Math.max(0, Math.min(1, v)); save(); if (k === 'music') { if (cur) cur.volume = set.music; if (set.music <= 0) { const w = curKey; music(null); want = w; } else if (!cur && want) { curKey = null; music(want); } } } };
})();
