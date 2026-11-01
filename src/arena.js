  // ---------- The Arena (Nov 1): south of town, through the gap in the old palisade. Wager duels between players.
  // A player pins a wager on the board (up to 3 stash items and/or gold, plus a note). Others answer with offers: what they
  // put up against it. The poster can accept, decline or counter (a note and the gold they want); the offerer can meet the
  // counter, revise or withdraw. On accept the two heroes duel; the winner takes the other side's stake.
  // Stakes leave the stash while the wager is open (held in profile.arena) and come back on a decline, a withdraw or a draw.
  // The hero behind a post or an offer has its gear and deck locked (CBHub.arenaLock), and both sides can see each other's hero.
  // Everything goes player to player over the realtime channel: posts ride on presence, offers and answers are messages.
  const AR = { offers: {}, view: null, form: null, heroes: {}, note: '', gone: {} };
  const AR_ITEMS = 3, AR_GOLD_MAX = 100000;
  const arSlim = (it) => { const o = JSON.parse(JSON.stringify(it)); for (const k of ['id', 'price', 'sold', 'test', 'autoSalvage']) delete o[k]; return o; };
  const arId = () => 'w' + Math.random().toString(36).slice(2, 10);
  const arMe = () => profile.arena || null;
  const arName = () => { const a = arMe(), c = a && profile.chars[a.hero] || profile.chars[heroKey]; return c ? c.name : 'Someone'; };
  const arSend = (type, payload) => { if (typeof netSend === 'function') netSend(type, payload); };
  const stakeTxt = (st) => [st.gold ? `${st.gold.toLocaleString()} gold` : '', ...(st.items || []).map(it => it.name)].filter(Boolean).join(', ') || 'nothing';
  function heroRecord(c) { return { hero_name: c.name, hero_class: c.cls, guild_name: typeof GUILD !== 'undefined' && GUILD.me ? GUILD.me.name : null, progress: CBHub.progressScore(c), power: CBHub.powerLevel(c), maps: c.mapBest || {}, snapshot: heroSnapshot(c), updated_at: new Date().toISOString() }; }

  // ----- escrow: the stake leaves the stash (and the bank) while the wager is open
  function takeStake(ids, gold) {
    gold = Math.max(0, Math.min(AR_GOLD_MAX, Math.floor(+gold || 0)));
    if (gold > profile.gold) return { why: `You only have ${profile.gold} gold.` };
    const items = []; for (const id of ids.slice(0, AR_ITEMS)) { const i = profile.stash.findIndex(x => x.id === id); if (i >= 0) items.push(profile.stash.splice(i, 1)[0]); }
    if (!items.length && !gold) return { why: 'Put up at least one item or some gold.' };
    profile.gold -= gold; return { stake: { gold, items } };
  }
  function giveBack(st) { if (!st) return; profile.gold += st.gold || 0; for (const it of st.items || []) profile.stash.unshift(it); }
  function clearArena(how) { const a = arMe(); if (!a) return; if (how !== 'forfeit') giveBack(a.stake); profile.arena = null; AR.offers = {}; save(); if (typeof retrack === 'function') retrack(true); renderTownBar(); }

  // what other players see on the board (on presence)
  function arenaPresence() {
    const a = arMe(); if (!a || a.role !== 'post' || a.status !== 'open') return null;
    const c = profile.chars[a.hero]; return { pid: a.pid, hero: c ? c.name : '', cls: c ? c.cls : '', gold: a.stake.gold, items: a.stake.items.map(arSlim), note: a.note || '', n: Object.keys(AR.offers).length };
  }
  const boardPosts = () => [...((typeof SOC !== 'undefined' && SOC.online) || new Map()).entries()].filter(([uid, st]) => uid !== SOC.me && st && st.arena && st.arena.pid).map(([uid, st]) => Object.assign({ uid, who: st.name }, st.arena));

  // ----- posting
  function postWager(ids, gold, note) {
    if (!socOn()) return toast('Sign in and connect to the online world to use the Arena.');
    if (arMe()) return toast('You already have a wager open.');
    const c = profile.chars[heroKey]; if (!c) return; const chk = CBHub.deckCheck(c.deck); if (!chk.ok) return toast(`Fix your deck first (it ${chk.problems.join(', ')}).`);
    const r = takeStake(ids, gold); if (r.why) return toast(r.why);
    profile.arena = { role: 'post', pid: arId(), hero: heroKey, stake: r.stake, note: (note || '').slice(0, 120), status: 'open', at: Date.now() };
    AR.offers = {}; save(); retrack(true); sysChat(`Your wager is on the board: ${stakeTxt(r.stake)}. ${c.name}'s gear and deck are locked until it is settled.`); renderArena();
  }
  function takeDown() {
    const a = arMe(); if (!a || a.role !== 'post' || a.status !== 'open') return;
    for (const o of Object.values(AR.offers)) arSend('ar-decline', { to: o.from, pid: a.pid, oid: o.oid, why: 'took the wager down' });
    arSend('ar-closed', { pid: a.pid }); clearArena(); sysChat('Your wager is off the board. Your stake is back in your stash.'); renderArena();
  }
  // ----- offering
  function makeOffer(post, ids, gold, note, reviseOf) {
    if (!socOn()) return toast('You are not connected.');
    const a0 = arMe(); if (a0 && !(reviseOf && a0.role === 'offer' && a0.oid === reviseOf)) return toast('You already have a wager open. Withdraw it first.');
    const c = profile.chars[a0 ? a0.hero : heroKey]; if (!c) return; const chk = CBHub.deckCheck(c.deck); if (!chk.ok) return toast(`Fix your deck first (it ${chk.problems.join(', ')}).`);
    if (a0) giveBack(a0.stake); // revising: the old stake comes back first
    const r = takeStake(ids, gold); if (r.why) { if (a0) { a0.stake = takeStake(a0.stake.items.map(x => x.id), a0.stake.gold).stake || { gold: 0, items: [] }; } return toast(r.why); }
    const oid = reviseOf || arId();
    profile.arena = { role: 'offer', pid: post.pid, oid, to: post.uid, hero: a0 ? a0.hero : heroKey, stake: r.stake, note: (note || '').slice(0, 120), status: 'pending', at: Date.now(), post: { who: post.who, hero: post.hero, cls: post.cls, gold: post.gold, items: post.items, note: post.note } };
    save(); retrack(true);
    arSend('ar-offer', { to: post.uid, pid: post.pid, oid, gold: r.stake.gold, items: r.stake.items.map(arSlim), note: profile.arena.note, name: c.name, cls: c.cls, hero: heroRecord(c) });
    sysChat(`${reviseOf ? 'Revised offer' : 'Offer'} sent to ${post.who}: ${stakeTxt(r.stake)}.`); renderArena();
  }
  function withdraw() {
    const a = arMe(); if (!a || a.role !== 'offer' || a.status === 'dueling') return;
    arSend('ar-withdraw', { to: a.to, pid: a.pid, oid: a.oid }); clearArena(); sysChat('Offer withdrawn. Your stake is back in your stash.'); renderArena();
  }
  // ----- the poster answers
  function decline(oid, why) { const a = arMe(), o = AR.offers[oid]; if (!a || !o) return; arSend('ar-decline', { to: o.from, pid: a.pid, oid, why: why || 'declined' }); delete AR.offers[oid]; retrack(true); renderArena(); }
  function counter(oid, gold, note) { const a = arMe(), o = AR.offers[oid]; if (!a || !o) return; o.counter = { gold: Math.max(0, Math.floor(+gold || 0)), note: (note || '').slice(0, 120) }; arSend('ar-counter', { to: o.from, pid: a.pid, oid, gold: o.counter.gold, note: o.counter.note }); sysChat(`Counter sent to ${o.name}.`); renderArena(); }
  function accept(oid) {
    const a = arMe(), o = AR.offers[oid]; if (!a || !o || a.status !== 'open') return;
    if (run || cb) return toast('Finish what you are doing first.');
    if (!SOC.online.has(o.from)) return toast(`${o.name} is not online any more.`);
    for (const x of Object.values(AR.offers)) if (x.oid !== oid) arSend('ar-decline', { to: x.from, pid: a.pid, oid: x.oid, why: 'took another offer' });
    a.status = 'accepted'; a.deal = { foe: o.from, foeName: o.name, foeStake: { gold: o.gold, items: o.items }, oid, at: Date.now() };
    AR.offers = { [oid]: o }; save(); retrack(true);
    const c = profile.chars[a.hero];
    arSend('ar-accept', { to: o.from, pid: a.pid, oid, gold: a.stake.gold, items: a.stake.items.map(arSlim), name: c.name, cls: c.cls, hero: heroRecord(c) });
    sysChat(`You accepted ${o.name}'s offer. Waiting for them to step into the ring...`); renderArena();
    setTimeout(() => { const b = arMe(); if (b && b.status === 'accepted' && b.deal && b.deal.oid === oid) { sysChat(`${o.name} never stepped into the ring. The wager is called off.`); arSend('ar-decline', { to: o.from, pid: b.pid, oid, why: 'timed out' }); clearArena(); renderArena(); } }, 45000);
  }

  // ----- messages
  function arenaIn(p) {
    if (p.to && p.to !== SOC.me) return;
    const a = arMe();
    switch (p.type) {
      case 'ar-offer': {
        if (!a || a.role !== 'post' || a.pid !== p.pid || a.status !== 'open') { arSend('ar-decline', { to: p.from, pid: p.pid, oid: p.oid, why: 'is no longer on the board' }); return; }
        const was = AR.offers[p.oid];
        AR.offers[p.oid] = { oid: p.oid, from: p.from, name: p.name, cls: p.cls, gold: Math.max(0, +p.gold || 0), items: (p.items || []).slice(0, AR_ITEMS), note: p.note || '', hero: p.hero, at: Date.now() };
        sysChat(`${p.name} ${was ? 'revised their offer' : 'made an offer'} on your wager: ${stakeTxt(AR.offers[p.oid])}. Open the Wager Board to answer.`);
        retrack(true); if (!$('hpArena').hidden) renderArena(); return;
      }
      case 'ar-withdraw': { if (a && a.role === 'post' && a.pid === p.pid && AR.offers[p.oid]) { sysChat(`${AR.offers[p.oid].name} withdrew their offer.`); delete AR.offers[p.oid]; if (a.status === 'accepted' && a.deal && a.deal.oid === p.oid) { a.status = 'open'; a.deal = null; save(); } retrack(true); renderArena(); } return; }
      case 'ar-decline': case 'ar-closed': {
        if (!a || a.role !== 'offer' || a.pid !== p.pid || (p.oid && p.oid !== a.oid) || a.status === 'dueling') return;
        sysChat(`Your offer to ${a.post.who} was ${p.type === 'ar-closed' ? 'closed: they took the wager down' : 'declined' + (p.why && p.why !== 'declined' ? ` (${p.why})` : '')}. Your stake is back in your stash.`);
        clearArena(); renderArena(); return;
      }
      case 'ar-counter': {
        if (!a || a.role !== 'offer' || a.oid !== p.oid) return;
        a.status = 'countered'; a.counter = { gold: Math.max(0, +p.gold || 0), note: p.note || '' }; save();
        sysChat(`${a.post.who} countered your offer${a.counter.gold ? `: they want ${a.counter.gold.toLocaleString()} gold` : ''}${a.counter.note ? ` ("${a.counter.note}")` : ''}. Open the Wager Board to answer.`); renderArena(); return;
      }
      case 'ar-accept': {
        if (!a || a.role !== 'offer' || a.oid !== p.oid) { arSend('ar-decline', { to: p.from, pid: p.pid, oid: p.oid, why: 'the offer is gone' }); return; }
        if (run || cb) { arSend('ar-withdraw', { to: p.from, pid: p.pid, oid: p.oid }); clearArena(); sysChat('Your offer was accepted, but you were busy, so it was withdrawn.'); return; }
        a.status = 'accepted'; a.deal = { foe: p.from, foeName: p.name, foeStake: { gold: Math.max(0, +p.gold || 0), items: (p.items || []).slice(0, AR_ITEMS) }, oid: a.oid, at: Date.now(), hero: p.hero }; save();
        heroKey = a.hero; profile.last.cls = heroKey; renderHub();
        sysChat(`${p.name} accepted your offer! Into the ring: ${stakeTxt(a.stake)} against ${stakeTxt(a.deal.foeStake)}.`);
        arSend('ar-go', { to: p.from, oid: a.oid }); renderArena(); return;
      }
      case 'ar-go': {
        if (!a || a.role !== 'post' || a.status !== 'accepted' || !a.deal || a.deal.oid !== p.oid || a.deal.foe !== p.from) return;
        heroKey = a.hero; profile.last.cls = heroKey; renderHub(); $('sheet').hidden = true;
        netStart('duel', [SOC.me, p.from], 0); return;
      }
      case 'ar-look': { if (a && a.role === 'post' && a.pid === p.pid) { const c = profile.chars[a.hero]; if (c) arSend('ar-hero', { to: p.from, pid: a.pid, hero: heroRecord(c) }); } return; }
      case 'ar-hero': { AR.heroes[p.pid] = p.hero; if (AR.view === p.pid) recHeroModal(null, null, p.hero); return; }
    }
  }
  // the duel started: the stake is now on the line (leaving the duel loses it)
  function arenaDuelBegan(go) { const a = arMe(); if (a && a.status === 'accepted' && a.deal && go.uids.includes(a.deal.foe)) { a.status = 'dueling'; a.duelSid = go.sid; save(); } }
  // the duel ended (net.js duelOver): the winner takes the other stake, the loser's is gone, a draw gives both back
  function arenaSettle(foe, how) {
    const a = arMe(); if (!a || a.status !== 'dueling' || !a.deal || !foe || foe.uid !== a.deal.foe) return null;
    const theirs = a.deal.foeStake, mine = a.stake, foeName = a.deal.foeName;
    if (how === 'won') { giveBack(mine); profile.gold += theirs.gold || 0; for (const it of theirs.items || []) profile.stash.unshift(Object.assign({ id: 'g' + Math.random().toString(36).slice(2, 10) }, it)); profile.arena = null; }
    else if (how === 'lost') profile.arena = null;
    else { giveBack(mine); profile.arena = null; }
    AR.offers = {}; save(); retrack(true);
    const c = profile.chars[heroKey]; if (c) { c.wagers = c.wagers || { w: 0, l: 0 }; if (how === 'won') c.wagers.w++; else if (how === 'lost') c.wagers.l++; }
    sysChat(how === 'won' ? `You won the wager against ${foeName}: ${stakeTxt(theirs)} is yours.` : how === 'lost' ? `You lost the wager to ${foeName}: ${stakeTxt(mine)} is theirs.` : `The wager against ${foeName} is a draw: both stakes go back.`);
    return `<div class="arsettle ${how}"><b>${how === 'won' ? 'Wager won' : how === 'lost' ? 'Wager lost' : 'Wager drawn'}</b><p>${how === 'won' ? `You take <b>${esc(stakeTxt(theirs))}</b> and keep your own stake. Items went to your stash.` : how === 'lost' ? `${esc(foeName)} takes <b>${esc(stakeTxt(mine))}</b>.` : 'Both stakes go back to their owners.'}</p></div>`;
  }
  // keep things tidy: offers whose player left, deals that never started, and old saves
  setInterval(() => {
    const a = arMe(); if (!a) return;
    if (a.status === 'dueling' && !cb) { sysChat('You left a wager duel before it ended: your stake is forfeit.'); clearArena('forfeit'); return; }
    if (!socOn()) return;
    if (a.role === 'offer' && a.status !== 'dueling') { const st = SOC.online.get(a.to); if (!st || !st.arena || st.arena.pid !== a.pid) { if (a.status === 'accepted') return; AR.gone[a.pid] = (AR.gone[a.pid] || 0) + 1; if (AR.gone[a.pid] >= 3) { sysChat(`${a.post.who}'s wager is gone from the board. Your stake is back in your stash.`); clearArena(); renderArena(); } } else AR.gone[a.pid] = 0; }
    if (a.role === 'post') { let ch = false; for (const o of Object.values(AR.offers)) if (!SOC.online.has(o.from)) { delete AR.offers[o.oid]; ch = true; } if (ch) { retrack(true); renderArena(); } }
  }, 10000);
  // a wager from a session that ended (closed tab) can't still be open: give the stake back, unless the duel had started
  setTimeout(() => { const a = arMe(); if (!a) return; if (a.status === 'dueling') { profile.arena = null; save(); sysChat('A wager duel was left unfinished: its stake is forfeit.'); } else if (Date.now() - (a.at || 0) > 5000) { giveBack(a.stake); profile.arena = null; save(); sysChat('Your Arena wager from last time was closed. The stake is back in your stash.'); } }, 1500);

  // ----- the board
  function stakeHtml(st, label) {
    return `<div class="arstake"><span class="muted">${label}</span>${st.gold ? `<b class="argold">${st.gold.toLocaleString()} gold</b>` : ''}${(st.items || []).map(it => itemHtml(it)).join('')}${!st.gold && !(st.items || []).length ? '<span class="muted">nothing</span>' : ''}</div>`;
  }
  function pickForm(kind, ctx) {
    const stash = profile.stash.filter(it => it.kind !== 'card');
    return `<div class="arform" data-arform="${kind}"><h4>${kind === 'post' ? 'Post a wager' : kind === 'revise' ? 'Revise your offer' : `Offer against ${esc(ctx.who)}'s wager`}</h4>
      <p class="muted" style="margin:0 0 6px;font-size:12px">Pick up to ${AR_ITEMS} items from your stash and/or some gold. They leave your stash until the wager is settled. ${esc((profile.chars[(arMe() && arMe().hero) || heroKey] || {}).name || '')}'s gear and deck lock while it is open.</p>
      <div class="arpick">${stash.map(it => `<label class="arpi"><input type="checkbox" value="${it.id}">${itemHtml(it)}</label>`).join('') || '<span class="muted">Your stash is empty: wager gold.</span>'}</div>
      <div class="namerow"><div class="field"><label>Gold (you have ${profile.gold.toLocaleString()})</label><input type="number" min="0" max="${Math.min(AR_GOLD_MAX, profile.gold)}" value="${ctx && ctx.gold || 0}" class="argoldin"></div>
        <div class="field" style="flex:2"><label>Note (optional)</label><input maxlength="120" class="arnotein" placeholder="${kind === 'post' ? 'Best of one, no hard feelings' : 'Make it worth my while'}"></div>
        <button class="btn primary" data-arsubmit="${kind}" ${ctx && ctx.pid ? `data-pid="${ctx.pid}"` : ''}>${kind === 'post' ? 'Pin it to the board' : kind === 'revise' ? 'Send the revised offer' : 'Send the offer'}</button><button class="btn" data-arcancel="1">Cancel</button></div></div>`;
  }
  function renderArena() {
    const el = $('hpArena'); if (!el) return;
    const a = arMe(), posts = boardPosts(), c = profile.chars[heroKey];
    let mine = '';
    if (!socOn()) mine = '<p class="down">Sign in to use the Arena: wagers go between online players.</p>';
    else if (!a) mine = AR.form && AR.form.kind === 'post' ? pickForm('post') : `<div class="arbox"><p style="margin:0">No wager open. ${c ? `Your hero: <b style="color:${CC[c.cls]}">${esc(c.name)}</b>.` : ''}</p><button class="btn primary" data-arnew="1">Post a wager</button></div>`;
    else if (a.role === 'post') {
      const offers = Object.values(AR.offers);
      mine = `<div class="arbox mine"><h4>Your wager <span class="muted">${a.status === 'open' ? 'on the board' : a.status === 'accepted' ? 'accepted: waiting for the duel' : 'in the ring'}</span></h4>${stakeHtml(a.stake, `${esc(arName())} puts up`)}${a.note ? `<p class="arnote">"${esc(a.note)}"</p>` : ''}
        ${a.status === 'open' ? '<div class="acts"><button class="btn" data-ardown="1">Take it down</button></div>' : ''}
        <h4 style="margin-top:10px">Offers (${offers.length})</h4>${offers.length ? offers.map(o => `<div class="aroffer"><div class="arofhead"><b style="color:${CC[o.cls] || 'var(--text)'}">${esc(o.name)}</b> <span class="muted">${esc(o.cls || '')}</span><button class="pilebtn" data-arhero="${o.oid}">See their hero (locked)</button></div>
          ${stakeHtml(o, 'puts up')}${o.note ? `<p class="arnote">"${esc(o.note)}"</p>` : ''}${o.counter ? `<p class="muted">You countered${o.counter.gold ? `: ${o.counter.gold.toLocaleString()} gold` : ''}${o.counter.note ? ` "${esc(o.counter.note)}"` : ''}. Waiting for their answer.</p>` : ''}
          ${a.status === 'open' ? `<div class="acts"><button class="btn primary" data-araccept="${o.oid}">Accept and fight</button><button class="btn" data-arcounter="${o.oid}">Counter</button><button class="btn" data-ardecline="${o.oid}">Decline</button></div>
          ${AR.form && AR.form.kind === 'counter' && AR.form.oid === o.oid ? `<div class="namerow arform"><div class="field"><label>Gold you want from them</label><input type="number" min="0" value="${o.gold}" class="argoldin"></div><div class="field" style="flex:2"><label>Your counter</label><input maxlength="120" class="arnotein" placeholder="Add your Blue cloak and you have a deal"></div><button class="btn primary" data-arsendcounter="${o.oid}">Send counter</button><button class="btn" data-arcancel="1">Cancel</button></div>` : ''}` : ''}</div>`).join('') : '<p class="muted">No offers yet. Players in town see your wager on this board.</p>'}</div>`;
    } else {
      const P0 = a.post;
      mine = `<div class="arbox mine"><h4>Your offer to <b>${esc(P0.who)}</b> <span class="muted">${a.status === 'pending' ? 'waiting for an answer' : a.status === 'countered' ? 'they countered' : a.status === 'accepted' ? 'accepted: into the ring' : 'in the ring'}</span><button class="pilebtn" data-arlook="${a.pid}" data-arto="${a.to}">See their hero (locked)</button></h4>
        <div class="arvs">${stakeHtml(P0, `${esc(P0.hero)} puts up`)}<span class="arvsx">vs</span>${stakeHtml(a.stake, `${esc(arName())} puts up`)}</div>
        ${a.counter && a.status === 'countered' ? `<p class="arnote">Counter: ${a.counter.gold ? `they want <b>${a.counter.gold.toLocaleString()} gold</b>` : ''}${a.counter.note ? ` "${esc(a.counter.note)}"` : ''}</p>` : ''}
        ${a.status === 'pending' || a.status === 'countered' ? `<div class="acts">${a.status === 'countered' && a.counter.gold ? `<button class="btn primary" data-armeet="1">Meet it (${a.counter.gold.toLocaleString()} gold)</button>` : ''}<button class="btn" data-arrevise="1">Revise my offer</button><button class="btn" data-arwithdraw="1">Withdraw</button></div>` : ''}
        ${AR.form && AR.form.kind === 'revise' ? pickForm('revise', { gold: a.stake.gold }) : ''}</div>`;
    }
    const others = posts.map(pp => `<div class="arpost ${a && a.role === 'offer' && a.pid === pp.pid ? 'on' : ''}"><div class="arofhead"><b style="color:${CC[pp.cls] || 'var(--text)'}">${esc(pp.hero || pp.who)}</b> <span class="muted">${esc(pp.cls || '')} &middot; ${esc(pp.who)}</span><span class="chip">${pp.n || 0} offer${pp.n === 1 ? '' : 's'}</span></div>
      ${stakeHtml(pp, 'puts up')}${pp.note ? `<p class="arnote">"${esc(pp.note)}"</p>` : ''}
      <div class="acts"><button class="pilebtn" data-arlook="${pp.pid}" data-arto="${pp.uid}">See their hero</button>${!a ? `<button class="btn primary" data-aroffer="${pp.pid}">Make an offer</button>` : ''}</div>
      ${AR.form && AR.form.kind === 'offer' && AR.form.pid === pp.pid ? pickForm('offer', pp) : ''}</div>`).join('');
    el.innerHTML = `<p class="savenote" style="margin:0 0 8px">Put up gear or gold and fight for it. Offers answer a wager with a stake of their own; the poster accepts, declines or counters. Once a wager or offer is open, that hero's <b>gear and deck are locked</b> and both sides can see each other's hero. Win the duel and you take the other stake; lose and yours is gone; a draw gives both back. Leaving the duel early forfeits.</p>
      ${mine}<h3 class="rrhead">On the board</h3><div class="arposts">${others || '<p class="muted">No other wagers right now. Only players who are online show up.</p>'}</div>`;
    fitCards(el);
  }
  $('hpArena').addEventListener('click', (ev) => {
    const b = ev.target.closest('button'); if (!b || b.disabled) return; const D = b.dataset, a = arMe();
    const form = b.closest('.arform') || b.closest('.aroffer') || b.closest('.arpost') || el0();
    const vals = () => ({ ids: [...form.querySelectorAll('.arpick input:checked')].map(i => i.value), gold: (form.querySelector('.argoldin') || {}).value, note: (form.querySelector('.arnotein') || {}).value });
    if (D.arnew) AR.form = { kind: 'post' };
    else if (D.arcancel) AR.form = null;
    else if (D.aroffer) AR.form = { kind: 'offer', pid: D.aroffer };
    else if (D.arrevise) AR.form = { kind: 'revise' };
    else if (D.arcounter) AR.form = { kind: 'counter', oid: D.arcounter };
    else if (D.arsubmit) { const v = vals(); if (v.ids.length > AR_ITEMS) return toast(`At most ${AR_ITEMS} items.`); AR.form = null;
      if (D.arsubmit === 'post') return postWager(v.ids, v.gold, v.note);
      if (D.arsubmit === 'offer') { const pp = boardPosts().find(x => x.pid === D.pid); if (!pp) return toast('That wager is gone.'); return makeOffer(pp, v.ids, v.gold, v.note); }
      if (D.arsubmit === 'revise' && a) { const pp = boardPosts().find(x => x.pid === a.pid) || Object.assign({ uid: a.to, pid: a.pid }, a.post); return makeOffer(pp, v.ids, v.gold, v.note, a.oid); } }
    else if (D.armeet && a && a.counter) { const pp = boardPosts().find(x => x.pid === a.pid) || Object.assign({ uid: a.to, pid: a.pid }, a.post); const ids = a.stake.items.map(x => x.id); return makeOffer(pp, ids, Math.max(a.counter.gold, a.stake.gold), a.note, a.oid); }
    else if (D.arwithdraw) return withdraw();
    else if (D.ardown) return takeDown();
    else if (D.araccept) return accept(D.araccept);
    else if (D.ardecline) return decline(D.ardecline);
    else if (D.arsendcounter) { const v = vals(); AR.form = null; return counter(D.arsendcounter, v.gold, v.note); }
    else if (D.arhero) { const o = AR.offers[D.arhero]; if (o && o.hero) return recHeroModal(null, null, o.hero); return; }
    else if (D.arlook) { AR.view = D.arlook; if (AR.heroes[D.arlook]) recHeroModal(null, null, AR.heroes[D.arlook]); else if (a && a.role === 'offer' && a.pid === D.arlook && a.deal && a.deal.hero) recHeroModal(null, null, a.deal.hero); else { arSend('ar-look', { to: D.arto, pid: D.arlook }); toast('Asking for their hero...'); } return; }
    else return;
    renderArena();
  });
  const el0 = () => $('hpArena');
