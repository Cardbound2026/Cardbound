  // ---------- Pixel hit effects (Nov 11): animated pixel-art sprite sheets for the fight effects, drawn on the same #fxLayer canvas.
  // Made in PixelLab's VFX workbench (slash, claw marks, stab, bonk, crit, fire, frost, shadow, holy beam, arcane burst, thorns, blood,
  // poison bubbles, burning ground, frost crust, curse skulls, rot miasma, heal pluses, shield block, fire/ice/arcane bolts) and packed by
  // tools/pack_fx.py into one atlas inlined below (a row of frames per effect; manifest: [row y, frame w, frame h, frames, fps, anchor x, y]).
  // Each pixel effect replaces the matching CB_FX.DRAW entry; the old cut-paper drawing still runs until the atlas has loaded.
  // TO REMOVE: delete this file and its line in build.js.
  (function () {
    if (!window.CB_FX) return;
    const M = /*PIXFX-MAN*/{};
    const img = new Image(); let ok = false; img.onload = () => { ok = true; }; img.src = '/*PIXFX-IMG*/';
    const FX = window.CB_FX, D = FX.DRAW;
    // how each effect sits on the fighter: where (centre, feet, head), size against the figure, and whether it loops for its whole life
    const P = {
      slash: { z: 1.5 }, claw: { z: 1.7 }, pierce: { z: 2.6 }, blunt: { z: 1.5 }, crit: { z: 1.5 }, fire: { z: 1.15 }, frost: { z: 0.95 },
      shadow: { z: 1.3 }, holy: { z: 1.25, at: 'feet' }, arcane: { z: 2.4 }, nature: { z: 1.8, at: 'feet' }, bleed: { z: 2 },
      poison: { z: 2.2, loop: 900 }, burn: { z: 2.2, at: 'feet', loop: 800 }, chill: { z: 2.8, at: 'feet', loop: 800 },
      dread: { z: 2, at: 'head', loop: 1000 }, rot: { z: 2, at: 'feet', loop: 900 }, heal: { z: 2.2 }, block: { z: 1.8, face: true },
    };
    const ctx = () => document.getElementById('fxLayer').getContext('2d');
    function blit(k, u, ms, x, y, z, flip, rot, alpha) {
      const m = M[k]; if (!m) return; const [ry, fw, fh, n, fps, ax, ay] = m, loop = !!(P[k] && P[k].loop) || k.startsWith('bolt_');
      const i = loop ? Math.floor((u * ms / 1000) * fps) % n : Math.min(n - 1, Math.floor(u * n));
      const g = ctx(); g.imageSmoothingEnabled = false; g.globalAlpha = alpha == null ? 1 : alpha;
      g.translate(Math.round(x), Math.round(y)); if (rot) g.rotate(rot); if (flip) g.scale(-1, 1);
      g.drawImage(img, i * fw, ry, fw, fh, -ax * z, -ay * z, fw * z, fh * z);
    }
    for (const k in P) {
      if (!M[k] || !D[k]) continue;
      const old = D[k].d, p = P[k], m = M[k];
      const ms = p.loop || Math.round((m[3] / m[4]) * 1000);
      D[k] = { ms, d(u, x, y, s, o) {
        if (!ok) return old(u, x, y, s, o);
        const sp = FX.spot(o.id) || { side: -1, feet: y + 55 * s, h: 110 * s }; let yy = y;
        if (p.at === 'feet') yy = sp.feet - 4; else if (p.at === 'head') yy = sp.feet - sp.h * 0.92;
        // hits on a foe come from the heroes' side (left); hits on a hero come from the right; a Block faces the enemy
        const flip = p.face ? sp.side === -1 : o.self ? sp.side === -1 : sp.side === 1;
        const z = Math.max(1, Math.round(s * p.z * (o.big ? 1.3 : 1) * 2) / 2);
        const fade = p.loop ? Math.min(1, (1 - u) * 5, u * 8) : 1;
        blit(k, u, ms, x, yy, z, flip, 0, fade);
      } };
    }
    // spell bolts: fire, frost, arcane and shadow fly as pixel projectiles; the rest keep their drawn look
    const B = { Fire: 'bolt_fire', Frost: 'bolt_ice', Arcane: 'bolt_arcane', Shadow: 'bolt_arcane' };
    if (D.bolt) {
      const old = D.bolt.d;
      D.bolt.d = function (u, x, y, s, o) {
        const k = B[o.el]; if (!ok || !k || o.star || !M[k]) return old(u, x, y, s, o);
        const a = FX.spot(o.from, 0.4), b = FX.spot(o.to); if (!a || !b) return;
        const sx = a.x + a.side * a.w * 0.35, px = sx + (b.x - sx) * u, py = a.y + (b.y - a.y) * u - Math.sin(u * Math.PI) * 24 * a.s;
        const ang = Math.atan2(b.y - a.y - Math.cos(u * Math.PI) * 24 * a.s * Math.PI, b.x - sx);
        const g = ctx(); if (o.el === 'Shadow') g.filter = 'hue-rotate(40deg) brightness(0.55) saturate(1.4)';
        blit(k, u, D.bolt.ms, px, py, Math.max(1, Math.round(a.s * (k === 'bolt_arcane' ? 2.6 : 1.8) * 2) / 2), false, ang);
        g.filter = 'none';
      };
    }
  })();
