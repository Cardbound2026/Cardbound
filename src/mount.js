  // ---------- Mounts (Nov 2): press M in town to ride, 25% faster, no cast time. Everyone in town sees you ride.
  // Drawn in the same cut-paper ink as the heroes: flat colour, one hard shadow mass, a cut highlight, heavy black outline.
  // drawMount(..., 'back') goes under the rider and drawMount(..., 'front') over the rider's legs, so they sit in the saddle.
  const MOUNT_SPEED = 2.25, MOUNT_RISE = 31, MOUNT_SCALE = 1.55; // the rider sits this many (town) pixels higher; the horse is drawn this much bigger than its sketch
  const MOUNTS = { horse: { name: 'Horse', coat: ['#6b4a2e', '#3c2817', '#94704a'], mane: '#1a120c', hoof: '#16100b' } };
  const MINK = '#0b0a07';
  function mpoly(g, pts, fill, lw) { g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]); g.closePath(); if (fill) { g.fillStyle = fill; g.fill(); } if (lw) { g.lineWidth = lw; g.strokeStyle = MINK; g.lineJoin = 'miter'; g.miterLimit = 2.4; g.stroke(); } }
  // a shaded piece: base colour, hard shadow on the far side, a light sliver near the top
  function mpiece(g, pts, pal, lw, shadeFrom) {
    mpoly(g, pts, pal[0]); g.save(); g.clip();
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (const [x, y] of pts) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
    const w = x1 - x0, h = y1 - y0;
    if (shadeFrom === 'below') mpoly(g, [[x0 - 2, y0 + h * .62], [x1 + 2, y0 + h * .55], [x1 + 2, y1 + 2], [x0 - 2, y1 + 2]], pal[1]);
    else mpoly(g, [[x0 + w * .58, y0 - 2], [x1 + 2, y0 - 2], [x1 + 2, y1 + 2], [x0 + w * .4, y1 + 2]], pal[1]);
    g.globalAlpha = .7; mpoly(g, [[x0 + w * .1, y0 + h * .28], [x0 + w * .3, y0 + h * .08], [x0 + w * .55, y0 + h * .06], [x0 + w * .3, y0 + h * .18]], pal[2]); g.globalAlpha = 1;
    g.restore(); mpoly(g, pts, null, lw);
  }
  // phase 0..1 through a stride (0 when standing); blanket: the rider's class colour
  function drawMount(g, cx, by, dir, phase, s, layer, kind, blanket) {
    s *= MOUNT_SCALE; const M = MOUNTS[kind] || MOUNTS.horse, C = M.coat, lw = Math.max(1.6, 2 * s), moving = phase > 0;
    const sw = moving ? Math.sin(phase * Math.PI * 2) : 0, bob = moving ? -Math.abs(Math.sin(phase * Math.PI * 2)) * 1.6 * s : 0;
    const leg = (x, top, swing, near) => { const kx = x + swing * 4 * s, fx = x + swing * 7 * s; mpoly(g, [[x - 2.2 * s, top], [x + 2.2 * s, top], [kx + 2 * s, by - 7 * s], [fx + 1.8 * s, by - 1.5 * s], [fx - 2.2 * s, by - 1.5 * s], [kx - 2 * s, by - 7 * s]], near ? C[0] : C[1], lw * .8); mpoly(g, [[fx - 2.4 * s, by - 2.5 * s], [fx + 2.2 * s, by - 2.5 * s], [fx + 2.6 * s, by + .5 * s], [fx - 2.6 * s, by + .5 * s]], M.hoof, lw * .6); };
    if (dir === 'left' || dir === 'right') {
      const f = dir === 'right' ? 1 : -1, X = (dx) => cx + dx * f * s, Y = (dy) => by + dy * s + bob;
      if (layer === 'back') {
        g.fillStyle = 'rgba(0,0,0,.4)'; g.beginPath(); g.ellipse(cx, by, 26 * s, 6 * s, 0, 0, Math.PI * 2); g.fill();
        leg(X(-15), Y(-17), -sw, false); leg(X(13), Y(-17), sw, false); // far legs
        mpoly(g, [[X(-20), Y(-27)], [X(-27), Y(-22)], [X(-29), Y(-12)], [X(-25), Y(-14)], [X(-22), Y(-21)]], M.mane, lw * .8); // tail
        mpiece(g, [[X(-21), Y(-30)], [X(-8), Y(-33)], [X(10), Y(-32)], [X(19), Y(-29)], [X(21), Y(-21)], [X(14), Y(-15)], [X(-14), Y(-15)], [X(-22), Y(-20)]], C, lw, 'below'); // barrel
        mpiece(g, [[X(12), Y(-30)], [X(20), Y(-45)], [X(25), Y(-50)], [X(33), Y(-46)], [X(35), Y(-41)], [X(30), Y(-38)], [X(25), Y(-40)], [X(21), Y(-26)]], C, lw); // neck and head
        mpoly(g, [[X(13), Y(-31)], [X(19), Y(-46)], [X(24), Y(-51)], [X(22), Y(-44)], [X(17), Y(-30)]], M.mane, lw * .7); // mane
        mpoly(g, [[X(23), Y(-50)], [X(24), Y(-55)], [X(26.5), Y(-50)]], C[1], lw * .7); // ear
        g.fillStyle = MINK; g.beginPath(); g.arc(X(28), Y(-46), 1.1 * s, 0, Math.PI * 2); g.fill(); // eye
      } else {
        mpoly(g, [[X(-11), Y(-33)], [X(8), Y(-33)], [X(9), Y(-21)], [X(-10), Y(-21)]], blanket || '#5a1f1a', lw * .8); // saddle blanket over the rider's legs
        mpoly(g, [[X(-11), Y(-33)], [X(8), Y(-33)], [X(8), Y(-30)], [X(-11), Y(-30)]], 'rgba(0,0,0,.35)');
        mpoly(g, [[X(-1), Y(-24)], [X(2), Y(-24)], [X(2.5), Y(-17)], [X(-1.5), Y(-17)]], '#2a221a', lw * .6); // stirrup
        leg(X(-12), Y(-17), sw, true); leg(X(15), Y(-17), -sw, true); // near legs
      }
      return;
    }
    // facing up or down: the horse seen end-on, narrow
    const Y = (dy) => by + dy * s + bob, X = (dx) => cx + dx * s;
    if (dir === 'down') {
      if (layer === 'back') {
        g.fillStyle = 'rgba(0,0,0,.4)'; g.beginPath(); g.ellipse(cx, by, 15 * s, 6 * s, 0, 0, Math.PI * 2); g.fill();
        leg(X(-6), Y(-16), 0, false); leg(X(6), Y(-16), 0, false);
        mpiece(g, [[X(-12), Y(-33)], [X(12), Y(-33)], [X(13), Y(-20)], [X(8), Y(-14)], [X(-8), Y(-14)], [X(-13), Y(-20)]], C, lw, 'below');
      } else {
        mpoly(g, [[X(-12), Y(-31)], [X(12), Y(-31)], [X(12), Y(-20)], [X(-12), Y(-20)]], blanket || '#5a1f1a', lw * .8);
        mpiece(g, [[X(-5), Y(-38)], [X(5), Y(-38)], [X(6), Y(-22)], [X(4), Y(-10)], [X(-4), Y(-10)], [X(-6), Y(-22)]], C, lw); // neck and long face in front
        mpoly(g, [[X(-5), Y(-38)], [X(-7), Y(-44)], [X(-3), Y(-39)]], C[1], lw * .7); mpoly(g, [[X(5), Y(-38)], [X(7), Y(-44)], [X(3), Y(-39)]], C[1], lw * .7);
        mpoly(g, [[X(-3), Y(-39)], [X(3), Y(-39)], [X(1), Y(-30)], [X(-1), Y(-30)]], M.mane, lw * .5);
        g.fillStyle = MINK; for (const dx of [-3.2, 3.2]) { g.beginPath(); g.arc(X(dx), Y(-28), 1 * s, 0, Math.PI * 2); g.fill(); }
        leg(X(-6), Y(-13), sw * .3, true); leg(X(6), Y(-13), -sw * .3, true);
      }
      return;
    }
    // up: we see its back; the rump and tail cover the rider's legs
    if (layer === 'back') {
      g.fillStyle = 'rgba(0,0,0,.4)'; g.beginPath(); g.ellipse(cx, by, 15 * s, 6 * s, 0, 0, Math.PI * 2); g.fill();
      mpiece(g, [[X(-4), Y(-50)], [X(4), Y(-50)], [X(5), Y(-34)], [X(-5), Y(-34)]], C, lw); // head and neck peek out ahead
      mpoly(g, [[X(-4), Y(-50)], [X(-6), Y(-55)], [X(-2), Y(-50)]], C[1], lw * .7); mpoly(g, [[X(4), Y(-50)], [X(6), Y(-55)], [X(2), Y(-50)]], C[1], lw * .7);
      mpoly(g, [[X(-2), Y(-50)], [X(2), Y(-50)], [X(1.5), Y(-34)], [X(-1.5), Y(-34)]], M.mane, lw * .5);
    } else {
      leg(X(-7), Y(-16), sw * .3, true); leg(X(7), Y(-16), -sw * .3, true);
      mpiece(g, [[X(-13), Y(-31)], [X(13), Y(-31)], [X(13), Y(-19)], [X(7), Y(-13)], [X(-7), Y(-13)], [X(-13), Y(-19)]], C, lw, 'below'); // rump
      mpoly(g, [[X(-12), Y(-31)], [X(12), Y(-31)], [X(12), Y(-27)], [X(-12), Y(-27)]], blanket || '#5a1f1a', lw * .7);
      mpoly(g, [[X(-2), Y(-26)], [X(2), Y(-26)], [X(3), Y(-11)], [X(0), Y(-9)], [X(-3), Y(-11)]], M.mane, lw * .7); // tail
    }
  }
  // a rider and mount, drawn in the right order (the town calls this instead of drawChar while mounted)
  function drawRider(g, cx, by, dir, phase, pal, s, t, kind, blanket) {
    if (window.CB_HEROPUP && CB_HEROPUP.ride(g, pal, cx, by, dir, !!phase, s, t)) return; // Nov 12: the pixel horse and rider (src/heropup.js)
    drawMount(g, cx, by, dir, phase, s, 'back', kind, blanket);
    drawChar(g, cx, by - MOUNT_RISE * s, dir, 0, pal, s, t);
    drawMount(g, cx, by, dir, phase, s, 'front', kind, blanket);
  }
  function toggleMount() {
    if ($('scrStart').hidden || (typeof BZ !== 'undefined' && BZ.open)) return;
    P.mount = P.mount ? null : 'horse'; settings.mount = P.mount; saveSettings();
    if (typeof sysChat === 'function') sysChat(P.mount ? 'You mount your horse (225% speed). Press M to get down.' : 'You get down from your horse.');
    if (typeof retrack === 'function') retrack(true);
  }
  setTimeout(() => { try { if (settings.mount && MOUNTS[settings.mount]) P.mount = settings.mount; } catch (e) {} }, 0); // you stay mounted between sessions
