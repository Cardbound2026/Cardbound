// crash check for every class after the Shaman's engine hooks went in: node tools/shaman/fuzz_all.js
const { CB, D } = require('./h.js'); const C = CB.CARDS; let bad = 0, n = 0;
for (const cls of Object.keys(CB.CLASSES)) { const pool = CB.cardPool(cls), cxs = CB.CODEXES[cls].map(x => x[0]);
  for (let s = 1; s <= 40; s++) { const rnd = CB.makeRng(s * 77 + cls.length); const deck = Array.from({ length: 24 }, () => [pool[Math.floor(rnd() * pool.length)], 1]);
    const cx = cxs[s % cxs.length], gear = CB.STARTER_GEAR[cls].concat([CB.makeCodex(D, rnd, cx, 0)]);
    const E = Object.keys(D.enemies).filter(k => !D.enemies[k].raid && !D.enemies[k].group);
    try { const cb = new CB.Combat({ party: [{ cls, name: 'A', gear, deck, talents: { codex: cx, picks: Array.from({ length: 10 }, () => Math.floor(rnd() * 3)) } }].concat(s % 3 ? [] : [{ cls: 'Shaman', name: 'S' }]), enemies: [E[Math.floor(rnd() * E.length)], E[Math.floor(rnd() * E.length)]], seed: s, data: D, partyStep: 0, level: s % 6 });
      for (const p of cb.players) { p.maxHp *= 4; p.hp = p.maxHp; } let g = 0;
      while (!cb.over && g++ < 3000) { if (cb.phase === 'enemy') { cb.enemyStep(); continue; } if (cb.phase !== 'player') { if (cb.phase === 'between') cb.nextTurn(); else break; continue; }
        const p = cb.current; cb.player = p; if (p.pick) cb.autoPick(p); const can = p.hand.filter(c => cb.canPlay(c, p).ok);
        if (can.length && rnd() < 0.85) { const c = can[Math.floor(rnd() * can.length)], d = cb.card(c), ts = d.target === 'ally' ? cb.allies() : cb.alive(); cb.play(c.uid, ts.length ? ts[Math.floor(rnd() * ts.length)].id : null); } else cb.endPlayerTurn(); }
      n++; } catch (e) { bad++; console.log('FAIL', cls, cx, s, String(e.stack).split('\n').slice(0, 3).join(' | ')); } } }
console.log(n, 'fights,', bad, 'crashes'); process.exit(bad ? 1 : 0);
