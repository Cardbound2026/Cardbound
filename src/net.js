  // ---------- online play: shared Wagon runs and duels (lockstep, no game server)
  // The host (the party leader, or whoever threw down the duel challenge) numbers every action and broadcasts it.
  // Every browser applies the same numbered actions, in order, to the same seeded Run or Combat, so all copies of the
  // game stay identical. Each player only ever sends actions for their own hero.
  const NET = { s: null, pend: null, duelIn: [], duelOut: null };
  const CB_BUILT_AT = +'__CB_BUILT_AT__';
  const CB_BUILD = '__CB_BUILD__'; // fingerprint of this build: everyone in a game must be on the same version
  const TURN_S = 90, VOTE_S = 45, GONE_S = 15;
  const netOn = () => !!NET.s;
  const netHost = () => !!(NET.s && NET.s.host === SOC.me);
  const newSid = () => 's' + Math.random().toString(36).slice(2, 10);
  const NETLOG = []; const nlog = (dir, type, extra) => { NETLOG.push(`${new Date().toISOString().slice(11, 19)} ${dir} ${type}${extra ? ' ' + extra : ''}`); if (NETLOG.length > 60) NETLOG.shift(); };
  function netSend(type, payload) {
    if (!socOn()) { nlog('x', type, '(not connected)'); return; }
    if (type !== 'hb') nlog('>', type, payload && payload.seq != null ? '#' + payload.seq : payload && payload.a ? payload.a.t : '');
    Promise.resolve(SOC.ch.send({ type: 'broadcast', event: 'net', payload: Object.assign({ type, from: SOC.me }, payload) })).then(r => { if (r && r !== 'ok') nlog('!', type, 'send result: ' + r); }).catch(e => nlog('!', type, 'send failed: ' + (e && e.message || e)));
  }
  function nameOfUid(uid) { const m = SOC.party && SOC.party.members.find(x => x.uid === uid); if (m) return m.name; const o = SOC.online.get(uid); return o ? o.name : 'A player'; }

  // what I bring: my current hero, gear, deck, bank and stash space
  function mySpec(req) {
    if (run || cb) return { err: 'is already on the March or in a fight' };
    const c = profile.chars[heroKey]; if (!c) return { err: 'has no hero yet' };
    if (req && req.kind === 'raid') { const why = raidBlock(c, req.map, req.level); if (why) return { err: why }; }
    const chk = CBHub.deckCheck(c.deck); if (!chk.ok) return { err: `needs to fix their deck (it ${chk.problems.join(', ')})` };
    const o = CBHub.runOpts(profile, heroKey); delete o.members;
    return Object.assign(o, { uid: SOC.me });
  }

  // ---------- starting a session: the host asks everyone for their hero, then sends the seed
  // a session whose run/fight is already gone is stale (left without the usual exit): drop it instead of blocking new games
  function clearStale() { if (NET.s && !run && !cb) { nlog('!', 'stale session cleared', NET.s.sid); netEnd(); } if (NET.pend && Date.now() - (NET.pend.at || 0) > 20000) { clearTimeout(NET.pend.timer); clearInterval(NET.pend.again); NET.pend = null; } }
  function netStart(kind, uids, level, map) {
    clearStale();
    if (!socOn()) { toast('You are not connected to the online world. Reload the page and sign in again.'); return; }
    if (NET.s) { toast('You are still in another co-op game. Finish or leave it first (Esc menu).'); return; }
    if (NET.pend) { toast('Already setting out: waiting for the party to answer.'); return; }
    const me = mySpec({ kind, level, map }); if (me.err) { toast(`You ${me.err.replace(/^is /, 'are ').replace(/^has /, 'have ').replace(/^needs /, 'need ').replace(/their/, 'your')}.`); return; }
    const sid = newSid();
    NET.pend = { sid, kind, uids, level, map, specs: { [SOC.me]: me }, at: Date.now() };
    NET.pend.timer = setTimeout(() => { if (!NET.pend || NET.pend.sid !== sid) return; clearInterval(NET.pend.again); const miss = uids.filter(u => !NET.pend.specs[u]).map(nameOfUid); NET.pend = null; toast(`${miss.join(', ')} didn't answer. ${kind === 'duel' ? 'The duel' : kind === 'raid' ? 'The raid' : 'The run'} is called off. If they're online, ask them to reload the page (both of you should be on the latest version).`); }, 15000);
    // realtime messages can get lost: ask again every 2 seconds until everyone has answered
    NET.pend.again = setInterval(() => { if (!NET.pend || NET.pend.sid !== sid) return; netSend('req', { sid, kind, uids, level, map, build: CB_BUILD }); }, 2000);
    netSend('req', { sid, kind, uids, level, map, build: CB_BUILD });
    sysChat(kind === 'duel' ? 'Setting up the duel...' : kind === 'raid' ? 'Gathering the raid...' : 'Gathering the party at the Wagon...');
    netCheckSpecs();
  }
  function netCheckSpecs() {
    const P = NET.pend; if (!P || !P.uids.every(u => P.specs[u])) return;
    clearTimeout(P.timer); clearInterval(P.again); NET.pend = null;
    const go = { sid: P.sid, kind: P.kind, host: SOC.me, uids: P.uids, level: P.level, map: P.map, seed: Math.floor(Math.random() * 2147483646) + 1, specs: P.uids.map(u => P.specs[u]) };
    netSend('go', go); netBegin(go);
    // send the start again a few times in case it got lost (players who already started ignore repeats)
    NET.lastGo = go; for (const ms of [1000, 3000, 6000]) setTimeout(() => { if (NET.lastGo === go && NET.s && NET.s.sid === go.sid) netSend('go', go); }, ms);
  }
  function netBegin(go) {
    const S = NET.s = { sid: go.sid, kind: go.kind, host: go.host, uids: go.uids, mi: go.uids.indexOf(SOC.me), seq: 1, next: 1, buf: new Map(), log: [], votes: {}, camp: {}, gone: {}, voteAt: 0, turnKey: '', turnAt: 0, missing: {} };
    if (TR.s) cancelTrade(); closeModal(); $('sheet').hidden = true; if ($('talk')) $('talk').hidden = true;
    if (go.kind === 'duel') {
      run = null;
      cb = new CB.Combat({ duel: true, party: go.specs.map(s => ({ cls: s.cls, name: s.name, gear: s.gear, deck: s.deck, uid: s.uid })), seed: go.seed, data: DATA });
      cb.myMi = S.mi; startCombatUI();
    } else if (go.kind === 'raid') {
      run = null; const bk = CB.raidBoss(DATA, go.map);
      cb = new CB.Combat({ raid: true, party: go.specs.map(s => ({ cls: s.cls, name: s.name, gear: s.gear, deck: s.deck, uid: s.uid })), enemies: [bk], level: go.level, seed: go.seed, data: DATA });
      cb.myMi = S.mi; cb.raidMap = go.map; startCombatUI();
    } else {
      run = new Run({ members: go.specs.map(s => ({ key: s.key, cls: s.cls, name: s.name, gear: s.gear, deck: s.deck, bank: s.bank, stashFree: s.stashFree })), level: go.level, map: go.map || 'physical', seed: go.seed, data: DATA });
      run.online = true; run.myMi = S.mi; run.uids = go.uids.slice();
      show('map'); renderMap(true);
      if (go.host !== SOC.me) { modal(`<h2>Your party sets out</h2><p>${esc(nameOfUid(go.host))} is leading ${go.specs.map(x => esc(x.name)).join(', ')} onto <b>${esc(run.mapName)}</b> (+${go.level}).</p><p class="muted">Click a node on the map to vote where to go. The party moves when everyone has voted (ties are a coin flip; after 45 seconds the votes in count).</p><div class="row"><button class="btn primary" id="mClose">Let's go</button></div>`); $('mClose').onclick = closeModal; }
    }
    sysChat(go.kind === 'duel' ? `Duel: ${go.specs.map(s => s.name).join(' vs ')}.` : go.kind === 'raid' ? `The raid begins: ${go.specs.map(s => s.name).join(', ')} against ${CB.RAID_NAMES[go.map]} (+${go.level}).` : `The party sets out: ${go.specs.map(s => s.name).join(', ')}.`);
    retrack(true);
  }
  function netEnd() { NET.s = null; NET.pend = null; retrack(true); }

  // ---------- actions
  // the host applies its own actions directly; everyone else's are sent with an id and re-sent every 2 seconds
  // until they come back numbered from the host (lost messages happen). The host ignores repeats of the same id.
  function netAct(a) {
    const S = NET.s; if (!S) return;
    if (netHost()) { hostSeq(Object.assign({}, a, { mi: S.mi })); return; }
    const aid = SOC.me.slice(0, 6) + '-' + (++NET.aidN || (NET.aidN = 1)) + '-' + Date.now().toString(36);
    const msg = Object.assign({}, a, { aid });
    S.outbox = S.outbox || new Map(); S.outbox.set(aid, { a: msg, tries: 0 });
    netSend('act', { sid: S.sid, a: msg });
  }
  function hostSeq(a) {
    const S = NET.s;
    if (a.aid) { S.aids = S.aids || new Set(); if (S.aids.has(a.aid)) return; S.aids.add(a.aid); }
    const seq = S.next++;
    netSend('do', { sid: S.sid, seq, a });
    S.buf.set(seq, a); netDrain();
  }
  function netDrain() {
    const S = NET.s; if (!S) return;
    while (!busy && NET.s === S && S.buf.has(S.seq)) {
      const a = S.buf.get(S.seq); S.buf.delete(S.seq); S.log[S.seq] = a; S.seq++;
      if (a.aid && S.outbox) S.outbox.delete(a.aid);
      try { netApply(a); } catch (e) { console.error('net apply', a, e); nlog('!', 'apply ' + a.t, String(e && e.message || e).slice(0, 80)); sysChat(`Game error while syncing (${a.t}): ${String(e && e.message || e).slice(0, 80)}`); }
    }
    if (NET.s === S && !busy) autoSkip();
  }
  const active = () => NET.s.uids.map((u, i) => i).filter(i => !NET.s.gone[i]);
  const tallyDone = (box) => active().every(i => box[i] != null);
  function netApply(a) {
    const S = NET.s, mi = a.mi, who = S.uids[mi] ? nameOfUid(S.uids[mi]) : 'A player';
    if (S.kind === 'duel') {
      if (!cb || cb.over) return;
      if (a.t === 'leave') { S.gone[mi] = true; const p = cb.players[mi]; if (p.hp > 0) { cb.say('loss', `${p.name} leaves the duel.`); p.hp = 0; cb.onDeath(p); } render(); combatOver(); return; }
    }
    if (S.kind === 'raid') {
      if (!cb) return;
      if (a.t === 'roll' || a.t === 'rollforce') { raidRollIn(a); return; }
      if (a.t === 'leave') {
        if (S.gone[mi]) return; S.gone[mi] = true; if (mi !== S.mi) sysChat(`${who} left the raid.`);
        const p = cb.players[mi]; if (!cb.over && p.hp > 0) { cb.say('loss', `${p.name} leaves the raid.`); p.hp = 0; cb.onDeath(p); }
        if (cb.raidLoot) raidRollIn({ t: 'check' });
        else if (!$('scrCombat').hidden) { render(); if (cb.over) combatOver(); else pump(); }
        return;
      }
      if (cb.over) return;
      const p = cb.players[mi]; if (!cb.canAct(p)) return;
      if (a.t === 'play') { if (mi === S.mi) selected = null; cb.playAs(p, a.uid, a.tgt); render(true); if (cb.over) combatOver(); else if (cb.phase === 'enemy') pump(); return; }
      if (a.t === 'end') { if (mi === S.mi) selected = null; if (a.auto) cb.say('sys', `${p.name} ran out of time.`); cb.endTurnAs(p); render(true); if (cb.over) combatOver(); else pump(); return; }
      return;
    }
    switch (a.t) {
      case 'vote': {
        if (!run || run.over || run.combat || (run.pending && run.pending.type === 'rest')) return;
        if (!run.reachable().includes(a.node)) { sysChat(`Out of sync: ${who} voted for a node your map doesn't have. Both of you: leave the run and reload the page.`); return; }
        if (!Object.keys(S.votes).length) S.voteAt = Date.now();
        S.votes[mi] = a.node;
        if (tallyDone(S.votes)) resolveMove(); else { renderMap(); if (run.pending && $('modal').hidden === false && run.pending.type === 'merchant' && redrawShop) redrawShop(); }
        return;
      }
      case 'camp': {
        if (!run || !run.pending || run.pending.type !== 'rest' || !['rest', 'extract'].includes(a.choice)) return;
        if (!Object.keys(S.camp).length) S.voteAt = Date.now();
        S.camp[mi] = a.choice;
        if (tallyDone(S.camp)) resolveCamp(); else if (!$('modal').hidden) pendingModal();
        return;
      }
      case 'force': {
        if (!run || run.over) return;
        if (run.pending && run.pending.type === 'rest' && Object.keys(S.camp).length) resolveCamp();
        else if (Object.keys(S.votes).length && !run.combat) resolveMove();
        return;
      }
      case 'buy': { if (!run || !run.pending || run.pending.type !== 'merchant') return; run.buy(a.i, mi); if (redrawShop && !$('modal').hidden) redrawShop(); renderSide(); return; }
      case 'play': { if (!cb || cb.over || cb.phase !== 'player' || cb.current !== cb.players[mi]) return; if (selected && mi === S.mi) selected = null; const who = cb.players[mi], pc = who.hand.find(c => c.uid === a.uid), tg = a.tgt && cb.actorById(a.tgt); const ok = cb.play(a.uid, a.tgt); if (ok && pc && mi !== S.mi) showPlayed(who, pc, tg); render(true); if (cb.over) combatOver(); return; }
      case 'end': { if (!cb || cb.over || cb.phase !== 'player' || cb.current !== cb.players[mi]) return; if (mi === S.mi) selected = null; if (a.auto) cb.say('sys', `${cb.current.name} ran out of time.`); cb.endPlayerTurn(); render(true); pump(); return; }
      case 'leave': {
        if (S.gone[mi]) return; S.gone[mi] = true;
        if (run) { const m = run.members[mi]; m.kept = { items: [], gold: 0 }; m.left = true; run.note(`${m.name} left the March. Their sack is lost.`); }
        if (mi !== S.mi) sysChat(`${who} left the ${S.kind === 'duel' ? 'duel' : 'run'}.`);
        if (!active().length) return;
        if (run && !run.over && !run.combat) { if (run.pending && run.pending.type === 'rest' && Object.keys(S.camp).length && tallyDone(S.camp)) resolveCamp(); else if (Object.keys(S.votes).length && tallyDone(S.votes)) resolveMove(); else if (!$('scrMap').hidden) renderMap(); }
        if (cb && !$('scrCombat').hidden) render();
        return;
      }
    }
  }
  // a hero whose player left skips their turns
  function autoSkip() {
    const S = NET.s; if (!S || !cb || cb.over || busy || cb.raid) return;
    let g = 0;
    while (cb && !cb.over && cb.phase === 'player' && S.gone[cb.players.indexOf(cb.current)] && g++ < 10) cb.endPlayerTurn();
    if (cb && cb.phase === 'enemy' && !busy) { render(); pump(); }
  }
  function resolveMove() {
    const S = NET.s; const list = active().map(i => S.votes[i]).filter(Boolean);
    const node = list.length > 1 ? run.resolveVote(list) : list[0];
    const split = new Set(list).size > 1;
    S.votes = {}; S.voteAt = 0;
    if (run.pending) run.closePending();
    closeModal();
    if (!run.enter(node)) { renderMap(); return; }
    if (split) run.note(`The party was split on where to go; ${run.map.nodes[node].type} on row ${run.map.nodes[node].row} won${new Set(list).size === list.length ? ' the coin flip' : ''}.`);
    if (run.combat) { cb = run.combat; startCombatUI(); return; }
    show('map'); renderMap(true);
    if (run.pending) pendingModal();
  }
  function resolveCamp() {
    const S = NET.s; const list = active().map(i => S.camp[i]).filter(Boolean);
    const pick = list.length > 1 ? run.resolveVote(list) : list[0];
    S.camp = {}; S.voteAt = 0; closeModal();
    if (pick === 'extract') run.extract(); else run.rest();
    renderMap();
  }

  // ---------- incoming messages
  function netIn(p) {
    if (!p || p.from === SOC.me) return;
    const S = NET.s;
    if (p.type !== 'hb') nlog('<', p.type, (nameOfUid(p.from) || '').slice(0, 12) + (p.seq != null ? ' #' + p.seq : '') + (p.a ? ' ' + p.a.t : ''));
    if (S && p.sid === S.sid) { S.seen = S.seen || {}; S.seen[p.from] = Date.now(); }
    switch (p.type) {
      case 'hb': {
        // heartbeat: the host says how many actions exist; anyone behind asks for the missing ones
        if (!S || p.sid !== S.sid || p.from !== S.host) return;
        if (p.next > S.seq && !S.buf.has(S.seq) && Date.now() - (S.askedAt || 0) > 1500) { S.askedAt = Date.now(); netSend('need', { sid: S.sid, seq: S.seq }); }
        return;
      }
      case 'req': {
        if (!p.uids.includes(SOC.me)) return;
        clearStale();
        if (NET.s) { if (NET.s.sid !== p.sid) netSend('spec', { sid: p.sid, to: p.from, spec: { err: 'is already in a game' } }); return; }
        if (p.build !== CB_BUILD) { netSend('spec', { sid: p.sid, to: p.from, spec: { err: 'is on a different version of the game. Both of you reload the page (Ctrl+F5), then try again' } }); if (NET.verWarn !== p.sid) { NET.verWarn = p.sid; toast(`${nameOfUid(p.from)} tried to start ${p.kind === 'duel' ? 'a duel' : p.kind === 'raid' ? 'a raid' : 'a run'}, but you two are on different versions of the game. Both of you reload the page (Ctrl+F5), then try again.`); } return; }
        if (!NET.wait || NET.wait.sid !== p.sid) sysChat(`${nameOfUid(p.from)} is ${p.kind === 'duel' ? 'starting the duel' : p.kind === 'raid' ? 'starting a raid' : 'setting out'}...`);
        const spec = mySpec(p);
        netSend('spec', { sid: p.sid, to: p.from, spec });
        // if the start doesn't arrive, ask the host for it again
        if (!spec.err && (!NET.wait || NET.wait.sid !== p.sid)) {
          const W = NET.wait = { sid: p.sid, host: p.from, tries: 0 };
          W.timer = setInterval(() => {
            if (NET.wait !== W || (NET.s && NET.s.sid === W.sid)) { clearInterval(W.timer); if (NET.wait === W) NET.wait = null; return; }
            if (++W.tries > 5) { clearInterval(W.timer); NET.wait = null; toast(`The start from ${nameOfUid(W.host)} never arrived. Ask them to set out again (reload the page if it keeps happening).`); return; }
            netSend('needgo', { sid: W.sid, to: W.host });
          }, 2500);
        }
        if (spec.err) toast(`${nameOfUid(p.from)} tried to start ${p.kind === 'duel' ? 'a duel' : p.kind === 'raid' ? 'a raid' : 'a run'}, but you ${spec.err.replace(/^is /, 'are ').replace(/^has /, 'have ').replace(/^needs /, 'need ').replace(/their/, 'your')}.`);
        return;
      }
      case 'spec': {
        const P = NET.pend; if (!P || P.sid !== p.sid || p.to !== SOC.me || !P.uids.includes(p.from)) return;
        if (p.spec.err) { clearTimeout(P.timer); clearInterval(P.again); NET.pend = null; toast(`${nameOfUid(p.from)} ${p.spec.err}. ${P.kind === 'duel' ? 'The duel' : P.kind === 'raid' ? 'The raid' : 'The run'} is called off.`); netSend('cancel', { sid: P.sid }); return; }
        P.specs[p.from] = p.spec; netCheckSpecs(); return;
      }
      case 'cancel': if (NET.wait && NET.wait.sid === p.sid) { clearInterval(NET.wait.timer); NET.wait = null; } return;
      case 'needgo': { const g = NET.lastGo; if (p.to === SOC.me && g && g.sid === p.sid && NET.s && NET.s.sid === g.sid && g.uids.includes(p.from)) netSend('go', g); return; }
      case 'go': {
        if (!p.uids.includes(SOC.me)) return;
        clearStale();
        if (NET.s) { if (NET.s.sid !== p.sid && NET.busySid !== p.sid) { NET.busySid = p.sid; sysChat(`${nameOfUid(p.from)} set out, but you are still in another co-op game. Leave it (Esc menu), then ask them to set out again.`); } return; }
        if (run || cb) { if (NET.busySid === p.sid) return; NET.busySid = p.sid; toast(`${nameOfUid(p.from)} set out, but you're still in another run or fight. Finish or leave it, then ask them to set out again.`); return; }
        if (NET.wait) { clearInterval(NET.wait.timer); NET.wait = null; }
        netBegin(p); return;
      }
      case 'act': {
        if (!S || p.sid !== S.sid || !netHost()) return;
        const mi = S.uids.indexOf(p.from); if (mi < 0 || S.gone[mi]) return;
        hostSeq(Object.assign({}, p.a, { mi })); return;
      }
      case 'do': {
        if (!S || p.sid !== S.sid || p.seq < S.seq || S.buf.has(p.seq)) return;
        S.buf.set(p.seq, p.a);
        if (!S.buf.has(S.seq) && Date.now() - (S.askedAt || 0) > 1500) { S.askedAt = Date.now(); netSend('need', { sid: S.sid, seq: S.seq }); }
        netDrain(); return;
      }
      case 'need': {
        if (!S || p.sid !== S.sid || !netHost()) return;
        for (let q = p.seq; q < S.next; q++) { const a = S.log[q] || S.buf.get(q); if (a) netSend('do', { sid: S.sid, seq: q, a }); }
        return;
      }
      case 'host': {
        if (!S || p.sid !== S.sid) return;
        S.host = p.host; if (p.host === SOC.me) S.next = Math.max(S.next, p.seq);
        if (S.seq < p.seq) { S.askedAt = Date.now(); netSend('need', { sid: S.sid, seq: S.seq }); }
        return;
      }
      case 'duel-ask': {
        if (p.to !== SOC.me || NET.duelIn.some(d => d.from === p.from)) return;
        NET.duelIn.push({ from: p.from, name: p.name, cls: p.cls }); sysChat(`${p.name} challenges you to a duel.`); renderSocial(); return;
      }
      case 'insp-req': case 'insp': case 'tr-ask': case 'tr-ans': case 'tr-offer': case 'tr-acc': case 'tr-cancel': gearNetIn(p); return;
      case 'duel-answer': {
        if (p.to !== SOC.me || !NET.duelOut || NET.duelOut !== p.from) return;
        NET.duelOut = null;
        if (!p.accept) { sysChat(`${nameOfUid(p.from)} declined the duel.`); renderSocial(); return; }
        netStart('duel', [SOC.me, p.from], 0); renderSocial(); return;
      }
    }
  }

  // ---------- duels: challenge a party member
  function challenge(uid) {
    if (!socOn() || NET.s || NET.duelOut) return;
    if (run || cb) { toast('Finish what you are doing first.'); return; }
    const c = profile.chars[heroKey]; if (!c) return;
    NET.duelOut = uid;
    netSend('duel-ask', { to: uid, name: c.name, cls: c.cls });
    sysChat(`You challenged ${nameOfUid(uid)} to a duel.`); renderSocial();
    setTimeout(() => { if (NET.duelOut === uid) { NET.duelOut = null; sysChat(`${nameOfUid(uid)} didn't answer the challenge.`); renderSocial(); } }, 30000);
  }
  function answerDuel(from, accept) {
    NET.duelIn = NET.duelIn.filter(d => d.from !== from);
    if (accept) { const s = mySpec(); if (s.err) { toast(`You can't duel right now: you ${s.err.replace(/^is /, 'are ').replace(/^has /, 'have ').replace(/^needs /, 'need ').replace(/their/, 'your')}.`); accept = false; } }
    netSend('duel-answer', { to: from, accept });
    renderSocial();
  }
  function duelOver() {
    const S = NET.s, me = cb.players[cb.myMi], won = cb.winner === me;
    const c = profile.chars[heroKey]; if (c && S && !S.counted) { S.counted = true; c.duels = c.duels || { w: 0, l: 0 }; if (won) c.duels.w++; else c.duels.l++; save(); }
    const foe = cb.players.find(p => p !== me);
    modal(`<h2 class="${won ? '' : 'loss'}">${won ? 'Victory' : cb.winner ? 'Defeat' : 'Draw'}</h2><p>${won ? `You beat ${esc(foe.name)} in ${cb.round} rounds.` : cb.winner ? `${esc(cb.winner.name)} wins in ${cb.round} rounds.` : 'Nobody is left standing.'} Duels are for glory: nobody loses gear, gold or HP.</p>
      <dl class="kv"><dt>Your duel record</dt><dd>${c && c.duels ? c.duels.w + ' won, ' + c.duels.l + ' lost' : '-'}</dd></dl>
      <div class="row"><button class="btn primary" id="mNew">Back to Emberwatch</button><button class="btn" id="mClose">Look at the fight</button></div>`);
    $('mNew').onclick = backToTown; $('mClose').onclick = closeModal;
  }

  // ---------- host duties: turn timer, vote timer, players who drop; and taking over if the host drops
  setInterval(() => {
    const S = NET.s; if (!S || !socOn()) return;
    const now = Date.now();
    // who is still here
    // a player is here if presence shows them or we heard from them in the last 10 seconds
    S.uids.forEach((u, i) => { if (u === SOC.me || S.gone[i]) return; if (SOC.online.has(u) || now - ((S.seen || {})[u] || 0) < 10000) delete S.missing[u]; else if (!S.missing[u]) S.missing[u] = now; });
    // heartbeat every 2 seconds; guests re-send actions the host hasn't numbered yet
    if (now - (S.hbAt || 0) >= 2000) {
      S.hbAt = now; netSend('hb', { sid: S.sid, next: netHost() ? S.next : S.seq });
      if (!netHost() && S.outbox) for (const [aid, o] of S.outbox) { if (++o.tries > 15) { S.outbox.delete(aid); continue; } netSend('act', { sid: S.sid, a: o.a }); }
    }
    const hostGone = S.host !== SOC.me && S.missing[S.host] && now - S.missing[S.host] > GONE_S * 1000;
    if (hostGone) {
      const heir = S.uids.find((u, i) => !S.gone[i] && u !== S.host && (u === SOC.me || !S.missing[u]));
      if (heir === SOC.me) {
        const old = S.uids.indexOf(S.host); S.host = SOC.me; S.next = Math.max(S.next, S.seq + S.buf.size);
        netSend('host', { sid: S.sid, host: SOC.me, seq: S.next }); sysChat('The leader dropped out. You are running the game now.');
        hostSeq({ t: 'leave', mi: old });
      }
    }
    if (!netHost()) { netClock(); return; }
    for (const [u, t] of Object.entries(S.missing)) { const i = S.uids.indexOf(u); if (i >= 0 && !S.gone[i] && now - t > GONE_S * 1000) hostSeq({ t: 'leave', mi: i }); }
    if (S.voteAt && now - S.voteAt > VOTE_S * 1000) { S.voteAt = 0; hostSeq({ t: 'force' }); }
    if (cb && !cb.over && cb.phase === 'player' && !busy) {
      const key = cb.round + ':' + (cb.raid ? 'raid' : cb.turnIndex);
      if (S.turnKey !== key) { S.turnKey = key; S.turnAt = now; }
      else if (now - S.turnAt > TURN_S * 1000) {
        S.turnAt = now + 5000;
        if (cb.raid) cb.players.forEach((p, mi) => { if (cb.canAct(p)) hostSeq({ t: 'end', mi, auto: true }); });
        else { const mi = cb.players.indexOf(cb.current); if (mi >= 0) hostSeq({ t: 'end', mi, auto: true }); }
      }
    }
    // raid loot: unanswered rolls count as Pass after the vote timer
    if (cb && cb.raid && cb.raidLoot && S.lootAt && !S.lootForced && now - S.lootAt > VOTE_S * 1000 && cb.raidLoot.some(x => !x.done)) { S.lootForced = true; hostSeq({ t: 'rollforce' }); }
    netClock();
  }, 1000);
  // everyone shows the turn clock (counted locally from when the turn began here)
  function netClock() {
    const S = NET.s, el = $('tclock'); if (!S || !cb || !el) return;
    const key = cb.round + ':' + (cb.raid ? 'raid' : cb.turnIndex);
    if (S.clockKey !== key) { S.clockKey = key; S.clockAt = Date.now(); }
    const left = Math.max(0, TURN_S - Math.floor((Date.now() - S.clockAt) / 1000));
    el.textContent = cb.phase === 'player' && !cb.over && left <= 30 ? ` (${left}s left)` : '';
  }
  function netLeave() {
    const S = NET.s; if (!S) return;
    if (netHost()) {
      hostSeq({ t: 'leave', mi: S.mi });
      const heir = S.uids.find((u, i) => !S.gone[i] && u !== SOC.me);
      if (heir) netSend('host', { sid: S.sid, host: heir, seq: S.next });
    } else netAct({ t: 'leave' });
    netEnd();
  }

  // ---------- connection details (Esc menu): everything needed to see where co-op breaks
  function netReport() {
    const S = NET.s, now = Date.now(), ago = (t) => t ? Math.round((now - t) / 1000) + 's ago' : 'never';
    const L = [`Build ${CB_BUILD} · you ${SOC.me ? SOC.me.slice(0, 8) : '-'} · connected ${socOn() ? 'yes' : 'no'} · ${SOC.online ? SOC.online.size : 0} online`];
    if (SOC.party) L.push('Party: ' + SOC.party.members.map(m => `${m.name}${m.uid === SOC.party.leader ? ' (leader)' : ''}${m.uid === SOC.me ? ' (you)' : ''} online:${m.uid === SOC.me || SOC.online.has(m.uid) ? 'yes' : 'NO'}${S && S.seen && S.seen[m.uid] ? ' heard ' + ago(S.seen[m.uid]) : ''}`).join(' | '));
    else L.push('Party: none');
    if (NET.pend) L.push(`Starting ${NET.pend.kind}: answers from ${Object.keys(NET.pend.specs).length}/${NET.pend.uids.length}`);
    if (S) L.push(`Session ${S.kind} ${S.sid} · host ${S.host === SOC.me ? 'you' : nameOfUid(S.host)} · applied #${S.seq - 1} · next #${S.next} · buffered ${S.buf.size} · unconfirmed ${S.outbox ? S.outbox.size : 0} · gone ${Object.keys(S.gone).filter(k => S.gone[k]).map(i => S.uids[i] ? nameOfUid(S.uids[i]) : i).join(',') || 'none'} · votes ${JSON.stringify(S.votes)}`);
    else L.push('Session: none');
    L.push(`Screen: ${['scrTitle', 'scrStart', 'scrMap', 'scrCombat'].filter(id => !$(id).hidden).join(',')} · run ${run ? (run.mapKey + ' row ' + run.currentRow() + (run.combat ? ' in fight' : '')) : 'none'} · busy ${busy}`);
    L.push('--- recent messages (> sent, < received, ! problem)'); L.push(...NETLOG.slice(-40));
    return L.join('\n');
  }
  function openNetReport() {
    const txt = netReport();
    modal(`<h2>Connection details</h2><p class="muted" style="margin:0">If co-op gets stuck, open this on <b>both</b> computers and send both texts. Both "Build" values must match.</p><pre class="netrep">${esc(txt)}</pre><div class="row"><button class="btn primary" id="mCopy">Copy</button><button class="btn" id="mClose">Close</button></div>`);
    $('modalBox').classList.add('wide');
    $('mClose').onclick = closeModal;
    $('mCopy').onclick = async () => { try { await navigator.clipboard.writeText(txt); $('mCopy').textContent = 'Copied'; } catch (e) { $('mCopy').textContent = 'Select the text and copy it'; } };
  }

  // version tag in the bottom-right corner: compare with your co-op partner
  (function () {
    const el = document.createElement('div'); el.id = 'verTag';
    const when = CB_BUILT_AT ? new Date(CB_BUILT_AT).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : '';
    el.textContent = `Build ${CB_BUILD}${when ? ' · ' + when : ''}`; el.title = 'The version you have loaded. Co-op partners must show the same build (reload with Ctrl+F5 if not).';
    document.body.appendChild(el);
  })();
