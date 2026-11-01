// Gothic Ink drawing kit for Cardbound monsters (prototype). Same value rules as PAPERFORGE's engraved tools:
// flat base, a halftone plane, one connected black shadow mass, hard-cut highlight slivers, heavy mitred ink.
(function (root) {
  const INK = '#0b0e0f';
  const hex = (h) => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const toHex = (a) => '#' + a.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
  const mix = (a, b, t) => { const A = hex(a), B = hex(b); return toHex(A.map((v, i) => v + (B[i] - v) * t)); };
  // muted gothic grading: pull saturation down, warm slightly
  const grade = (c) => { const [r, g, b] = hex(c), l = r * .26 + g * .61 + b * .13; return toHex([r, g, b].map((v, i) => (l + (v - l) * .62 - 70) * 1.08 + 70 + [8, 3, -5][i])); };
  function rng(seed) { let s = seed >>> 0 || 1; return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) % 100000) / 100000; }; }
  function kit(c, o) {
    o = Object.assign({ ink: 4.2, black: .82 }, o || {});
    const poly = (pts) => { const p = new Path2D(); pts.forEach(([x, y], i) => i ? p.lineTo(x, y) : p.moveTo(x, y)); p.closePath(); return p; };
    const P = (pts, fill, lw = o.ink) => { const p = Array.isArray(pts) ? poly(pts) : pts; if (fill) { c.fillStyle = fill; c.fill(p); } if (lw) { c.strokeStyle = INK; c.lineWidth = lw; c.lineJoin = 'miter'; c.miterLimit = 2.4; c.stroke(p); } return p; };
    const L = (pts, color = INK, lw = 1.6) => { c.beginPath(); pts.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.strokeStyle = color; c.lineWidth = lw; c.lineJoin = 'bevel'; c.lineCap = 'butt'; c.stroke(); };
    const box = (pts) => { const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]); const x = Math.min(...xs), y = Math.min(...ys); return [x, y, Math.max(...xs) - x, Math.max(...ys) - y]; };
    // a shaded piece: pal = [base, shadow, light]; light comes from the upper left, so the mass sits right and low
    // (flip = true puts the light on the right instead, for pieces facing the other way)
    const C = (pts, pal, mat = 'cloth', opt = {}) => {
      const path = poly(pts), [x, y, w, h] = box(pts), base = grade(pal[0]), shadow = mix(base, grade(pal[1]), .9), light = mix(grade(pal[2]), '#efe3c8', .2), mid = mix(base, shadow, .4);
      const r = rng(Math.round(x * 13 + y * 7 + w * 3 + h));
      const fx = (t) => opt.flip ? x + w * (1 - t) : x + w * t;
      c.save(); c.fillStyle = base; c.fill(path); c.clip(path);
      const split = .7 - o.black * .25;
      P([[fx(.26), y - 2], [fx(.72), y - 2], [fx(.87), y + h * .38], [fx(.43), y + h * .86], [fx(.17), y + h + 4], [fx(.38), y + h * .44]], mid, 0);
      P(opt.shadow || [[fx(split), y - 3], [fx(1) + (opt.flip ? -5 : 5), y - 3], [fx(1) + (opt.flip ? -5 : 5), y + h + 4], [fx(.12), y + h + 4], [fx(.38), y + h * .72], [fx(.66), y + h * .49], [fx(.48), y + h * .23]], shadow, 0);
      if (h > 20 && w > 18) P([[x - 3, y + h * .84], [x + w * .25, y + h * .92], [x + w * .49, y + h * .83], [x + w * .8, y + h * .93], [x + w + 4, y + h * .78], [x + w + 4, y + h + 5], [x - 3, y + h + 5]], shadow, 0);
      if (mat === 'metal') { P([[fx(.08), y + h * .21], [fx(.22), y + h * .07], [fx(.46), y + h * .11], [fx(.29), y + h * .16], [fx(.13), y + h * .35]], light, 0); }
      else if (mat === 'fur') { // short cut strokes along the fur, light on the lit side, ink in the shade
        for (let i = 0; i < Math.min(60, w * h / 260); i++) { const px = x + r() * w, py = y + r() * h, lit = (opt.flip ? px > x + w * .55 : px < x + w * .45) && py < y + h * .6; L([[px, py], [px + (opt.flip ? 1 : -1) * (3 + r() * 5), py - 4 - r() * 6]], lit ? light : INK, lit ? 1.4 : 1.8); }
      } else { P([[fx(.1), y + h * .12], [fx(.3), y + h * .06], [fx(.18), y + h * .2]], light, 0); }
      for (let i = 0; i < (opt.cuts || 3); i++) { const px = x + w * (.15 + r() * .7), py = y + h * (.2 + r() * .6); L([[px, py], [px + 4 + r() * 6, py - 2 - r() * 3]], INK, 1.3); } // wear cut-marks
      c.restore(); c.strokeStyle = INK; c.lineWidth = o.ink; c.lineJoin = 'miter'; c.miterLimit = 2.4; c.stroke(path);
      return path;
    };
    const glow = (x, y, r, col) => { const g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, col); g.addColorStop(1, col + '00'); c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); };
    return { P, L, C, glow, INK, mix, grade };
  }
  root.InkKit = { kit, mix, grade, INK };
})(typeof window !== 'undefined' ? window : globalThis);
