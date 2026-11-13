  // ---------- More pixel effects (Nov 13): 38 extra hit, spell and status effects from PixelLab's VFX workbench, packed by the script in
  // tools/fx2 into public/img/fx2.webp (manifest: [y, frame w, frame h, frames, fps, anchor x, y, frames per row]). CB_FXPICK swaps the
  // basic effect for a variant (a different slash each swing, a meteor for a big fire hit, a smite for a big holy hit...), so the same
  // card does not always look the same. TO REMOVE: delete this file and its line in build.js.
  (function () {
    if (!window.CB_FX) return;
    const M = {"slash2":[0,58,67,12,16,29,26,12],"dash":[67,123,37,9,16,54,21,8],"rising":[141,50,115,9,16,26,55,9],"heavy":[256,63,94,14,16,8,79,14],"spin":[350,100,48,11,16,48,23,10],"thrust":[446,41,16,7,16,5,7,7],"hitstar":[462,45,43,6,16,21,22,6],"crit2":[505,66,69,8,16,35,30,8],"bite":[574,50,66,14,20,23,25,14],"claw2":[640,48,49,8,16,27,20,8],"zap":[689,70,52,10,18,28,22,10],"sparks":[741,53,53,7,11,8,25,7],"blood":[794,51,56,9,15,12,22,9],"combo":[850,68,60,15,16,29,24,15],"fire2":[910,80,78,12,14,39,39,12],"meteor":[988,132,151,18,18,55,128,7],"ice2":[1441,60,78,10,12,31,29,10],"icespikes":[1519,56,65,14,14,31,43,14],"snare":[1584,64,58,22,14,32,44,16],"bats":[1700,91,71,16,14,51,59,11],"drain":[1842,54,28,14,16,1,13,14],"smite":[1870,72,122,11,14,36,106,11],"vines":[1992,59,47,14,12,29,35,14],"earth":[2039,103,65,18,16,51,47,9],"lightning":[2169,99,144,12,20,49,138,10],"stun":[2457,39,23,12,12,19,15,12],"buff":[2480,57,66,12,12,27,50,12],"debuff":[2546,61,58,12,12,30,56,12],"shbreak":[2604,69,94,12,12,38,31,12],"poof":[2698,73,58,10,12,39,35,10],"levelup":[2756,60,99,14,14,30,86,14],"coins":[2855,81,81,14,15,34,33,12],"summon":[3017,59,90,10,12,29,76,10],"shock":[3107,116,50,8,14,58,25,8],"orb":[3157,54,25,8,12,41,12,8],"charge":[3182,67,67,12,12,33,33,12],"aura2":[3249,68,112,8,12,34,97,8],"thorns2":[3361,83,73,16,14,41,45,12]};
    const img = new Image(); let ok = false; img.onload = () => { ok = true; }; img.src = 'img/fx2.webp';
    const FX = window.CB_FX, D = FX.DRAW;
    // at: where on the fighter (c centre, f feet, h head); z: size; dir: drawn facing right, so flip toward the target; dx: shift back toward the attacker
    const P = {
      slash2: { z: 1.9 }, combo: { z: 1.8 }, dash: { z: 1.5, dir: 1 }, rising: { z: 1.25 }, heavy: { z: 1.5, at: 'f', dir: 1, dx: -18 }, spin: { z: 1.7 },
      thrust: { z: 2.6, dir: 1, dx: -26 }, hitstar: { z: 2 }, crit2: { z: 1.9 }, bite: { z: 1.8 }, claw2: { z: 2.2 }, zap: { z: 1.7 }, sparks: { z: 1.8, dir: 1 },
      blood: { z: 1.8, dir: 1 }, fire2: { z: 1.6 }, meteor: { z: 1.35, at: 'f', dir: 1 }, ice2: { z: 1.8 }, icespikes: { z: 2, at: 'f' }, snare: { z: 2, at: 'f' },
      bats: { z: 1.7 }, drain: { z: 2.4, dir: -1 }, smite: { z: 1.6, at: 'f' }, vines: { z: 2.3, at: 'f' }, earth: { z: 1.5, at: 'f' }, lightning: { z: 1.3, at: 'f' },
      stun: { z: 2, at: 'h', loop: 1300 }, buff: { z: 1.8, at: 'f', loop: 1000 }, debuff: { z: 1.8, at: 'f', loop: 1000 }, shbreak: { z: 1.7 }, poof: { z: 1.8 },
      levelup: { z: 1.6, at: 'f' }, coins: { z: 1.6 }, summon: { z: 1.6, at: 'f' }, shock: { z: 1.4, at: 'f' }, charge: { z: 1.8 }, aura2: { z: 1.2, at: 'f', loop: 900 }, thorns2: { z: 1.7, at: 'f' },
    };
    const TINT = { frost: 'hue-rotate(170deg)', shadow: 'hue-rotate(235deg) brightness(.75)', arcane: 'hue-rotate(250deg)', nature: 'hue-rotate(75deg)', gold: 'hue-rotate(12deg) brightness(1.1)', holy: 'hue-rotate(12deg) brightness(1.1)',
      mana: 'hue-rotate(215deg) brightness(1.15)', dark: 'brightness(.45) saturate(.6)' };
    const ctx = () => document.getElementById('fxLayer').getContext('2d');
    function blit(k, u, ms, x, y, z, flip, rot, alpha, loop) {
      const m = M[k]; if (!m) return; const [ry, fw, fh, n, fps, ax, ay, per] = m;
      const i = loop ? Math.floor((u * ms / 1000) * fps) % n : Math.min(n - 1, Math.floor(u * n));
      const g = ctx(); g.imageSmoothingEnabled = false; g.globalAlpha = alpha == null ? 1 : alpha;
      g.translate(Math.round(x), Math.round(y)); if (rot) g.rotate(rot); if (flip) g.scale(-1, 1);
      g.drawImage(img, (i % per) * fw, ry + Math.floor(i / per) * fh, fw, fh, -ax * z, -ay * z, fw * z, fh * z);
    }
    for (const k in P) {
      const m = M[k], p = P[k]; if (!m) continue;
      const ms = p.loop || Math.round((m[3] / m[4]) * 1000);
      D[k] = { ms, d(u, x, y, s, o) {
        if (!ok) return;
        const sp = FX.spot(o.id) || { side: -1, feet: y + 55 * s, h: 110 * s }; let yy = y;
        if (p.at === 'f') yy = sp.feet - 4; else if (p.at === 'h') yy = sp.feet - sp.h * 0.9;
        const from = sp.side === 1 ? -1 : 1; // a hit on a hero comes from the right, on a foe from the left
        const flip = p.dir ? (from * p.dir < 0) !== !!o.self : false;
        const z = Math.max(1, Math.round(s * p.z * (o.big ? 1.2 : 1) * (o.z || 1) * 2) / 2);
        const g = ctx(); if (o.tint && TINT[o.tint]) g.filter = TINT[o.tint];
        blit(k, u, ms, x + (p.dx || 0) * z * (flip ? -1 : 1), yy, z, flip, 0, p.loop ? Math.min(1, (1 - u) * 5, u * 8) : 1, !!p.loop);
        g.filter = 'none';
      } };
    }
    // spell bolts for the elements that had none: a grey orb tinted by element
    const ORB = { Holy: 'sepia(1) saturate(4)', Nature: 'sepia(1) saturate(4) hue-rotate(70deg)', Shadow: 'sepia(1) saturate(4) hue-rotate(225deg) brightness(.8)', Physical: 'none' };
    if (D.bolt) {
      const old = D.bolt.d;
      D.bolt.d = function (u, x, y, s, o) {
        if (!ok || !(o.el in ORB) || o.star) return old(u, x, y, s, o);
        const a = FX.spot(o.from, 0.4), b = FX.spot(o.to); if (!a || !b) return;
        const sx = a.x + a.side * a.w * 0.35, px = sx + (b.x - sx) * u, py = a.y + (b.y - a.y) * u - Math.sin(u * Math.PI) * 24 * a.s;
        const ang = Math.atan2(b.y - a.y - Math.cos(u * Math.PI) * 24 * a.s * Math.PI, b.x - sx);
        const g = ctx(); g.filter = ORB[o.el]; blit('orb', u, D.bolt.ms, px, py, Math.max(1, Math.round(a.s * 2.2 * 2) / 2), false, ang, 1, true); g.filter = 'none';
      };
    }
    const one = (a) => a[Math.floor(Math.random() * a.length)];
    // the variant for a basic effect (called by CB_FX.add); may queue extras
    window.CB_FXPICK = function (kind, o, delay) {
      if (!ok) return null; const big = !!o.big;
      switch (kind) {
        case 'slash': if (o.self) return 'spin'; return big ? one(['heavy', 'slash2', 'rising', 'combo']) : one(['slash', 'slash', 'slash2', 'dash']);
        case 'pierce': return big ? 'dash' : one(['pierce', 'thrust']);
        case 'blunt': if (big) FX.add('shock', { id: o.id }, delay); return one(['blunt', 'hitstar']);
        case 'claw': return one(['claw', 'claw2', 'bite']);
        case 'crit': return one(['crit', 'crit2']);
        case 'fire': return big ? one(['fire2', 'meteor']) : one(['fire', 'fire', 'fire2']);
        case 'frost': return big ? 'icespikes' : one(['frost', 'ice2']);
        case 'shadow': return big ? one(['snare', 'bats']) : 'shadow';
        case 'holy': return big ? 'smite' : 'holy';
        case 'arcane': return big ? 'lightning' : one(['arcane', 'zap']);
        case 'nature': return big ? one(['earth', 'thorns2']) : one(['nature', 'vines']);
        case 'clank': FX.add('sparks', { id: o.id }, delay); return null;
        case 'smoke': return 'poof';
        case 'dust': return 'shock';
        case 'aura': FX.add('aura2', { id: o.id, tint: o.col === 'fire' ? null : o.col }, delay); FX.add('buff', { id: o.id }, (delay || 0) + 200); return null;
      }
      return null;
    };
  })();
