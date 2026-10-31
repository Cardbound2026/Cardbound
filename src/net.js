  // ---------- online play: shared Wagon runs and duels (lockstep, no game server)
  // The host (the party leader, or whoever threw down the duel challenge) numbers every action and broadcasts it.
  // Every browser applies the same numbered actions, in order, to the same seeded Run or Combat, so all copies of the
  // game stay identical. Each player only ever sends actions for their own hero.
  const NET = { s: null, pend: null, duelIn: [], duelOut: null };
  const TURN_S = 90, VOTE_S = 45, GONE_S = 15;
  const netOn = () => !!NET.s;
  const netHost = () => !!(NET.s && NET.s.host === SOC.me);
  const newSid = () => 's' + Math.random().toString(36).slice(2, 10);
  function netSend(type, payload) { if (socOn()) SOC.ch.send({ type: 'broadcast', event: 'net', payload: Object.assign({ type, from: SOC.me }, payload) }); }
  function nameOfUid(uid) { const m = SOC.party && SOC.party.members.find(x => x.uid === uid); if (m) return m.name; const o = SOC.online.get(uid); return o ? o.name : 'A player'; }

  // what I bring: my current hero, gear, deck, bank and stash space
  function mySpec() {
    if (run || cb) return { err: 'is already on the March or in a fight' };
    const c = profile.chars[heroCls]; if (!c) return { err: 'has no hero yet' };
    const chk = CBHub.deckCheck(c.deck); if (!chk.ok) return { err: `needs to fix their deck (it ${chk.problems.join(', ')})` };
    const o = CBHub.runOpts(profile, heroCls); delete o.members;
    return Object.assign(o, { uid: SOC.me });
  }

  // ---------- starting a session: the host asks everyone for their hero, then sends the seed
  function netStart(kind, uids, level, map) {
    if (!socOn() || NET.s || NET.pend) return;
    const me = mySpec(); if (me.err) { toast(`You ${me.err.replace(/^is /, 'are ').replace(/^has /, 'have ').replace(/^needs /, 'need ').replace(/their/, 'your')}.`); return; }
    const sid = newSid();
    NET.pend = { sid, kind, uids, level, map, specs: { [SOC.me]: me } };
    NET.pend.timer = setTimeout(() => { if (!NET.pend || NET.pend.sid !== sid) return; clearInterval(NET.pend.again); const miss = uids.filter(u => !NET.pend.specs[u]).map(nameOfUid); NET.pend = null; toast(`${miss.join(', ')} didn't answer. ${kind === 'duel' ? 'The duel' : 'The run'} is called off. If they're online, ask them to reload the page (both of you should be on the latest version).`); }, 15000);
    // realtime messages can get lost: ask again every 2 seconds until everyone has answered
    NET.pend.again = setInterval(() => { if (!NET.pend || NET.pend.sid !== sid) return; netSend('req', { sid, kind, uids, level, map }); }, 2000);
    netSend('req', { sid, kind, uids, level, map });
    sysChat(kind === 'duel' ? 'Setting up the duel...' : 'Gathering the party at the Wagon...');
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
    } else {
      run = new Run({ members: go.specs.map(s => ({ cls: s.cls, name: s.name, gear: s.gear, deck: s.deck, bank: s.bank, stashFree: s.stashFree })), level: go.level, map: go.map || 'physical', seed: go.seed, data: DATA });
      run.online = true; run.myMi = S.mi; run.uids = go.uids.slice();
      show('map'); renderMap(true);
    }
    sysChat(go.kind === 'duel' ? `Duel: ${go.specs.map(s => s.name).join(' vs ')}.` : `The party sets out: ${go.specs.map(s => s.name).join(', ')}.`);
    retrack(true);
  }
  function netEnd() { NET.s = null; NET.pend = null; retrack(true); }

  // ---------- actions
  function netAct(a) {
    const S = NET.s; if (!S) return;
    if (netHost()) hostSeq(Object.assign({}, a, { mi: S.mi }));
    else netSend('act', { sid: S.sid, a });
  }
  function hostSeq(a) {
    const S = NET.s; const seq = S.next++;
    netSend('do', { sid: S.sid, seq, a });
    S.buf.set(seq, a); netDrain();
  }
  function netDrain() {
    const S = NET.s; if (!S) return;
    while (!busy && NET.s === S && S.buf.has(S.seq)) {
      const a = S.buf.get(S.seq); S.buf.delete(S.seq); S.log[S.seq] = a; S.seq++;
      try { netApply(a); } catch (e) { console.error('net apply', a, e); }
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
    switch (a.t) {
      case 'vote': {
        if (!run || run.over || run.combat || (run.pending && run.pending.type === 'rest') || !run.reachable().includes(a.node)) return;
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
      case 'play': { if (!cb || cb.over || cb.phase !== 'player' || cb.current !== cb.players[mi]) return; if (selected && mi === S.mi) selected = null; cb.play(a.uid, a.tgt); render(true); if (cb.over) combatOver(); return; }
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
    const S = NET.s; if (!S || !cb || cb.over || busy) return;
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
    switch (p.type) {
      case 'req': {
        if (!p.uids.includes(SOC.me)) return;
        if (NET.s) { netSend('spec', { sid: p.sid, to: p.from, spec: { err: 'is already in a game' } }); return; }
        const spec = mySpec();
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
        if (spec.err) toast(`${nameOfUid(p.from)} tried to start ${p.kind === 'duel' ? 'a duel' : 'a run'}, but you ${spec.err.replace(/^is /, 'are ').replace(/^has /, 'have ').replace(/^needs /, 'need ').replace(/their/, 'your')}.`);
        return;
      }
      case 'spec': {
        const P = NET.pend; if (!P || P.sid !== p.sid || p.to !== SOC.me || !P.uids.includes(p.from)) return;
        if (p.spec.err) { clearTimeout(P.timer); clearInterval(P.again); NET.pend = null; toast(`${nameOfUid(p.from)} ${p.spec.err}. ${P.kind === 'duel' ? 'The duel' : 'The run'} is called off.`); netSend('cancel', { sid: P.sid }); return; }
        P.specs[p.from] = p.spec; netCheckSpecs(); return;
      }
      case 'cancel': if (NET.wait && NET.wait.sid === p.sid) { clearInterval(NET.wait.timer); NET.wait = null; } return;
      case 'needgo': { const g = NET.lastGo; if (p.to === SOC.me && g && g.sid === p.sid && NET.s && NET.s.sid === g.sid && g.uids.includes(p.from)) netSend('go', g); return; }
      case 'go': {
        if (!p.uids.includes(SOC.me) || NET.s) return;
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
    const c = profile.chars[heroCls]; if (!c) return;
    NET.duelOut = uid;
    netSend('duel-ask', { to: uid, name: c.name, cls: heroCls });
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
    const c = profile.chars[heroCls]; if (c && S && !S.counted) { S.counted = true; c.duels = c.duels || { w: 0, l: 0 }; if (won) c.duels.w++; else c.duels.l++; save(); }
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
    S.uids.forEach((u, i) => { if (u === SOC.me || S.gone[i]) return; if (SOC.online.has(u)) delete S.missing[u]; else if (!S.missing[u]) S.missing[u] = now; });
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
      const key = cb.round + ':' + cb.turnIndex;
      if (S.turnKey !== key) { S.turnKey = key; S.turnAt = now; }
      else if (now - S.turnAt > TURN_S * 1000) { S.turnAt = now + 5000; const mi = cb.players.indexOf(cb.current); if (mi >= 0) hostSeq({ t: 'end', mi, auto: true }); }
    }
    netClock();
  }, 1000);
  // everyone shows the turn clock (counted locally from when the turn began here)
  function netClock() {
    const S = NET.s, el = $('tclock'); if (!S || !cb || !el) return;
    const key = cb.round + ':' + cb.turnIndex;
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
