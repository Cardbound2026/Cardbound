// ---------- Hero puppets (Nov 12): pixel-art heroes built from parts. Each body is cut at the joints (tools/heroart/bake_body.py):
// torso, head, upper and lower arms, thighs and shins, for three views (s = facing the camera, n = facing away, e = side; west is the
// side view mirrored). Gear and hair are cut the same way and ride on the part they cover. Animations move the parts.
// CB_PUPPET.draw(g, look, view, anim, t, x, footY, scale) draws one frame with the feet at (x, footY).
window.CB_PUPPET = (function () {
  const D = window.CB_PUPPET_DATA; if (!D) return null;
  const S = D.S, IMG = new Map(), PAR = [-1, 0, 0, 2, 0, 4, 0, 6, 0, 8], TAU = Math.PI * 2;
  function img(name) { let e = IMG.get(name); if (!e) { e = { im: new Image(), ok: false }; e.im.onload = () => { e.ok = true; }; e.im.src = 'img/hero/' + name + '.webp'; IMG.set(name, e); } return e.ok ? e.im : null; }
  // ---------- poses: for each part { r: turn (radians, + = clockwise), sy: stretch along the limb, dx, dy }, plus the whole body's dx, dy
  const Z = () => ({ r: 0, sy: 1, dx: 0, dy: 0 });
  function pose(anim, p, view) {
    const P = { dx: 0, dy: 0, parts: Array.from({ length: 10 }, Z) }, q = P.parts, s = Math.sin(p * TAU), c = Math.cos(p * TAU), side = view === 'e';
    if (anim === 'idle') { const b = (s + 1) / 2; q[1].dy = -b * .9; q[2].dy = q[4].dy = -b * .6; q[0].sy = 1 + b * .012; if (side) { q[2].r = .03 * s; q[4].r = -.03 * s; } }
    else if (anim === 'walk') {
      if (side) {
        q[6].r = -.33 * s; q[7].r = .5 * Math.max(0, c); q[8].r = .33 * s; q[9].r = .5 * Math.max(0, -c);
        q[2].r = .28 * s; q[3].r = -.2 - .1 * s; q[4].r = -.28 * s; q[5].r = -.2 + .1 * s; q[1].r = .02 * c; P.dy = -Math.abs(c) * 1.6;
      } else {
        const la = Math.max(0, s), lb = Math.max(0, -s);
        q[6].sy = 1 - .13 * la; q[7].sy = 1 - .2 * la; q[8].sy = 1 - .13 * lb; q[9].sy = 1 - .2 * lb;
        q[2].r = .07 * s; q[2].sy = 1 - .05 * s; q[4].r = .07 * s; q[4].sy = 1 + .05 * s; q[3].sy = 1 - .06 * s; q[5].sy = 1 + .06 * s;
        P.dy = -Math.abs(s) * 1.4; P.dx = s * .7; q[1].dy = -Math.abs(c) * .5;
      }
    }
    return P;
  }
  const CLIP = { idle: 1600, walk: 760 }; // ms per loop
  // ---------- drawing: every layer (body, then what the hero wears) is a strip of the ten parts; a part is drawn with its parents' moves applied
  const work = document.createElement('canvas'); work.width = work.height = S * 2; const wg = work.getContext('2d');
  function chain(g, B, P, i) { if (PAR[i] >= 0) chain(g, B, P, PAR[i]); const a = P.parts[i], pv = B.piv[i]; g.translate(pv[0] + a.dx, pv[1] + a.dy); if (a.r) g.rotate(a.r); if (a.sy !== 1) g.scale(1, a.sy); g.translate(-pv[0], -pv[1]); }
  function draw(g, look, view, anim, t, x, footY, scale) {
    const flip = view === 'w', v = flip ? 'e' : view, B = D.bodies[look.body] && D.bodies[look.body][v]; if (!B) return false;
    const layers = [look.body + '_' + v].concat((look.layers || []).map(n => n + '_' + v)).map(img); if (!layers[0]) return false;
    const P = pose(anim, ((t % (CLIP[anim] || 1000)) / (CLIP[anim] || 1000)), v);
    wg.setTransform(1, 0, 0, 1, 0, 0); wg.clearRect(0, 0, work.width, work.height); wg.imageSmoothingEnabled = false;
    for (const i of B.order) { wg.setTransform(1, 0, 0, 1, S / 2 + Math.round(P.dx), S / 2 + Math.round(P.dy)); chain(wg, B, P, i); for (const im of layers) if (im) wg.drawImage(im, i * S, 0, S, S, 0, 0, S, S); }
    g.save(); g.imageSmoothingEnabled = false; g.translate(x, footY); if (flip) g.scale(-1, 1);
    g.drawImage(work, -(S / 2 + B.cx) * scale, -(S / 2 + B.foot) * scale, work.width * scale, work.height * scale); g.restore(); return true;
  }
  return { draw, pose, ready: (look, view) => !!img(look.body + '_' + (view === 'w' ? 'e' : view)), S };
})();
