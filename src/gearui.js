  // ---------- character sheet (paperdoll), item tooltips and upgrade checks, inspecting other players, trading
  const DOLL_L = ['Helm', 'Amulet', 'Cloak', 'Chest', 'Bracers', 'Gloves'], DOLL_R = ['Belt', 'Pants', 'Boots', 'Ring 1', 'Ring 2', 'Codex'], DOLL_B = ['Weapon', 'Off-hand'];
  const SLOT_PATH = {
    Helm: 'M5 15a7 7 0 0 1 14 0v4H5z M9 19v-4h6v4', Amulet: 'M6 3c0 6 3 9 6 9s6-3 6-9 M12 12v2 M9.5 17a2.5 2.5 0 1 0 5 0a2.5 2.5 0 1 0-5 0',
    Cloak: 'M8 3h8l3 18H5z M12 3v18', Chest: 'M7 4l5 2 5-2 3 4-3 2v10H7V10L4 8z', Bracers: 'M6 5h12v6H6z M6 13h12v6H6z',
    Gloves: 'M7 21v-8L5 9l2-1 2 2V4h2v6V3h2v7V4h2v7l2-3 2 1-3 6v6z', Belt: 'M3 10h18v5H3z M10 9h4v7h-4z', Pants: 'M6 3h12l1 18h-5l-2-11-2 11H5z',
    Boots: 'M8 3h5v11l6 3v4H6v-4l2-2z', Ring: 'M7 14a5 5 0 1 0 10 0a5 5 0 1 0-10 0 M10 4h4l-2 4z',
    Codex: 'M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z M5 17a3 3 0 0 1 3-3h11 M10 8h5 M10 11h5',
    Weapon: 'M14 3h7v7l-9 9-3-3z M4 20l4-4 M6 15l3 3', 'Off-hand': 'M12 3l8 3v6c0 5-4 8-8 9-4-1-8-4-8-9V6z',
  };
  const slotKey = (sl) => /^Ring/.test(sl) ? 'Ring' : sl;
  const slotIcon = (sl) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round" aria-hidden="true"><path d="${SLOT_PATH[slotKey(sl)] || SLOT_PATH.Chest}"/></svg>`;

  // item power: every stat weighted the way item generation values it (the same point costs), with stats your class barely uses counted at a quarter
  // elemental damage only helps cards of that element: Warriors are all Physical, Rogues have one Nature card, Paladins hit Holy, Mages Fire/Frost/Arcane
  const ELEM_USE = { Warrior: [], Rogue: ['Nature'], Paladin: ['Holy'], Mage: ['Fire', 'Frost', 'Arcane'] };
  const OFF_STAT = { Warrior: ['Intelligence', 'Multicast Chance'], Mage: ['Strength', 'Multi-hit Chance', 'Multiplay Chance', 'Bleed Chance'], Rogue: ['Multicast Chance'], Paladin: [] };
  const isOff = (k, cls) => { const base = k.replace(/:.*$/, ''); if (base === 'Elemental/Holy Damage') return !(ELEM_USE[cls] || []).includes(k.split(':')[1]); return (OFF_STAT[cls] || []).includes(base); };
  function statPts(k) {
    const G = DATA.gear.stats, base = k.replace(/:.*$/, '');
    if (k === 'Draw') return 3; if (k === 'Regen') return 0.3;
    if (base === 'Resistance') return k === 'Resistance:Fire' ? 1 : 0.8;
    return G[base] ? G[base].pts : 1;
  }
  function itemPower(it, cls) {
    let p = 0; cls = cls || heroCls;
    for (const src of [it.stats || {}, it.imp2 || {}]) for (const [k, v] of Object.entries(src)) p += v * statPts(k) * (isOff(k, cls) ? 0.25 : 1);
    return Math.round(p);
  }
  // is an item better than what this hero wears? compares item power with the weaker of the slots it can go in
  function upgradeInfo(it, gear, cls) {
    if (!it || it.kind === 'card' || !gear) return null;
    if (it.slot === 'Codex' && it.cls && it.cls !== (cls || heroCls)) return { kind: 'other', cls: it.cls };
    const cur = CBHub.slotOptions(it).map(sl => gear.find(g => g.slot === sl));
    if (cur.some(x => !x)) return { kind: 'empty' };
    const mine = itemPower(it, cls), worst = cur.reduce((a, b) => itemPower(a, cls) <= itemPower(b, cls) ? a : b), d = mine - itemPower(worst, cls);
    return { kind: d > 0 ? 'up' : d < 0 ? 'down' : 'same', d, vs: worst, p: mine };
  }
  function upBadge(it, gear, cls) {
    const u = upgradeInfo(it, gear, cls); if (!u) return '';
    if (u.kind === 'empty') return `<span class="upb up" title="You have nothing in this slot">&#9650; Fills an empty slot</span>`;
    if (u.kind === 'other') return `<span class="upb same">${u.cls} only</span>`;
    const why = `Item power ${u.p} vs ${itemPower(u.vs, cls)} for your ${esc(u.vs.name)}. Power adds up every stat by its value; stats your class barely uses count for a quarter.`;
    return u.kind === 'up' ? `<span class="upb up" title="${why}">&#9650; Upgrade +${u.d} power</span>`
      : u.kind === 'down' ? `<span class="upb down" title="${why}">&#9660; ${u.d} power</span>`
      : `<span class="upb same" title="${why}">= Even</span>`;
  }
  const myGear = () => (profile.chars[heroCls] || { gear: [] }).gear;

  // hover tooltips for item slots: data-tip points into TIPS
  const TIPS = new Map(); let tipN = 0;
  function tipKey(it, cmp) { if (TIPS.size > 600) TIPS.clear(); const k = 't' + (tipN++); TIPS.set(k, { it, cmp }); return k; }
  const gtip = document.createElement('div'); gtip.className = 'gtip'; gtip.hidden = true; document.body.appendChild(gtip);
  function showTip(el) {
    const t = TIPS.get(el.dataset.tip); if (!t) return;
    gtip.innerHTML = itemHtml(t.it, `<div class="il">Item power ${itemPower(t.it)}</div>`) + (t.cmp ? `<div style="margin-top:4px">${upBadge(t.it, t.cmp)}</div>` : '');
    gtip.hidden = false;
    const r = el.getBoundingClientRect(), w = gtip.offsetWidth, h = gtip.offsetHeight;
    let x = r.right + 8; if (x + w > innerWidth - 8) x = r.left - w - 8; if (x < 8) x = Math.max(8, Math.min(innerWidth - w - 8, r.left));
    gtip.style.left = x + 'px'; gtip.style.top = Math.max(8, Math.min(innerHeight - h - 8, r.top)) + 'px';
  }
  document.addEventListener('mouseover', (ev) => { const el = ev.target.closest('[data-tip]'); if (el) showTip(el); else if (!gtip.hidden && !ev.target.closest('.gtip')) gtip.hidden = true; });
  document.addEventListener('focusin', (ev) => { const el = ev.target.closest && ev.target.closest('[data-tip]'); if (el) showTip(el); });
  document.addEventListener('scroll', () => { gtip.hidden = true; }, true);

  // paperdoll: portrait in the middle, the 13 slots around it, stats underneath
  function paperdoll(ch, cls, o) {
    o = o || {};
    const slot = (sl) => {
      const it = ch.gear.find(g => g.slot === sl);
      if (!it) return `<div class="dslot empty" ${o.own ? `data-dslot="${sl}" role="button" tabindex="0"` : ''} title="${sl}: empty${o.own ? ' (click to equip something)' : ''}"><span class="dic">${slotIcon(sl)}</span><span class="dtx"><b>${sl}</b><small>empty</small></span></div>`;
      return `<div class="dslot" style="--rc:${RC[it.rarity] || 'var(--line)'}" data-tip="${tipKey(it, o.cmp)}" ${o.own ? `data-dslot="${sl}" role="button"` : ''} tabindex="0"><span class="dic">${slotIcon(sl)}</span><span class="dtx"><b>${esc(it.name)}</b><small>${sl} &middot; ilvl ${it.ilvl}</small></span></div>`;
    };
    const s = CB.sumGear(ch.gear), res = Object.entries(s.resist || {}).filter(x => x[1]).map(([k, v]) => `${k} ${v}%`).join(', ') || 'none';
    return `<div class="doll">
      <div class="dcol">${DOLL_L.map(slot).join('')}</div>
      <div class="dmid"><canvas class="dportrait" width="220" height="250" data-cls="${cls}" data-rc="${esc(JSON.stringify(rcOf(ch)))}"></canvas>
        <div class="dname" style="color:${CC[cls]}">${esc(ch.name || cls)}</div><div class="muted" style="font-size:13px">${cls}${o.acct ? ' &middot; ' + esc(o.acct) : ''}</div>
        <div class="dpow"><span><b>${CBHub.powerLevel(ch)}</b>Power</span><span><b>${CBHub.gearScore(ch)}</b>Gear</span><span><b>${CB.deckLevel(ch.deck)}</b>Deck</span></div></div>
      <div class="dcol">${DOLL_R.map(slot).join('')}</div>
      <div class="dbot">${DOLL_B.map(slot).join('')}</div>
      <dl class="kv dstats"><dt>Max HP</dt><dd>${s.maxHp}</dd><dt>Mana</dt><dd>${s.maxMana}, +${s.regen}/turn</dd><dt>Draw</dt><dd>${s.draw}/round</dd>
        <dt>Strength / Int</dt><dd>+${s.strength}% / +${s.intelligence}%</dd><dt>Dexterity</dt><dd>+${s.dexterity + s.defGain}% ${CLASSES[cls].defense}</dd><dt>Crit</dt><dd>${s.crit}% x${s.critMult.toFixed(2)}</dd>
        <dt>Initiative</dt><dd>${s.init}</dd><dt>Resist</dt><dd>${res}</dd>${s.luck ? `<dt>Luck</dt><dd>${s.luck}</dd>` : ''}${ch.duels ? `<dt>Duels</dt><dd>${ch.duels.w} won, ${ch.duels.l} lost</dd>` : ''}</dl>
    </div>`;
  }
  function paintPortraits(root) {
    (root || document).querySelectorAll('canvas.dportrait').forEach(cv => {
      const g = cv.getContext('2d'); g.clearRect(0, 0, cv.width, cv.height);
      const bg = g.createRadialGradient(110, 120, 10, 110, 130, 140); bg.addColorStop(0, '#3a2c1e'); bg.addColorStop(1, '#120e0b'); g.fillStyle = bg; g.fillRect(0, 0, cv.width, cv.height);
      let rc = {}; try { rc = JSON.parse(cv.dataset.rc); } catch (e) {}
      drawChar(g, 110, 232, 'down', 0, palFor(cv.dataset.cls, rc), 4.2, 0);
    });
  }
  // own sheet: click a slot to see the item (and unequip) or, if empty, to equip something from the stash
  document.addEventListener('click', (ev) => {
    const d = ev.target.closest('[data-dslot]'); if (!d || !d.closest('#hpGear')) return;
    gtip.hidden = true;
    const sl = d.dataset.dslot, c = CBHub.char(profile, heroCls), it = c.gear.find(g => g.slot === sl);
    const fits = profile.stash.filter(x => x.kind !== 'card' && CBHub.slotOptions(x).includes(sl) && !(x.slot === 'Codex' && x.cls && x.cls !== heroCls)).sort((a, b) => (b.ilvl || 0) - (a.ilvl || 0));
    const choose = fits.map(x => itemHtml(x, `<div class="acts">${upBadge(x, c.gear)}<button class="btn" data-eq="${x.id}">Equip</button></div>`)).join('');
    modal(`<h2>${sl}</h2>${it ? itemHtml(it, `<div class="acts"><button class="btn" id="mUneq">Unequip to stash</button></div>`) : '<p class="muted">Nothing equipped.</p>'}
      <h3 style="font-size:18px;color:var(--accent);margin-top:10px">From your stash (${fits.length})</h3><div class="list" style="max-height:340px">${choose || '<span class="muted">Nothing in the stash fits this slot.</span>'}</div>
      <div class="row"><button class="btn primary" id="mClose">Close</button></div>`);
    $('mClose').onclick = closeModal;
    if ($('mUneq')) $('mUneq').onclick = () => { if (!CBHub.unequip(profile, heroCls, sl)) return toast('Stash is full.'); save(); closeModal(); renderHub(); };
    for (const b of $('modalBox').querySelectorAll('[data-eq]')) b.onclick = () => { const r = CBHub.equip(profile, heroCls, b.dataset.eq, sl); if (!r.ok) return toast(r.why); save(); closeModal(); renderHub(); };
  });

  // ---------- inspecting another player (they answer with their hero's gear and deck)
  const INS = { waiting: null };
  function inspect(uid) {
    if (!socOn()) return;
    INS.waiting = uid; netSend('insp-req', { to: uid });
    modal(`<h2>Inspecting ${esc(nameOfUid(uid))}...</h2><p class="muted">Asking their game for their hero.</p><div class="row"><button class="btn primary" id="mClose">Close</button></div>`); $('mClose').onclick = closeModal;
    setTimeout(() => { if (INS.waiting === uid) { INS.waiting = null; if (!$('modal').hidden && /Inspecting/.test($('modalBox').innerText)) toast(`${nameOfUid(uid)} didn't answer. They may have just gone offline.`); } }, 6000);
  }
  function inspectCard() { const c = profile.chars[heroCls]; if (!c) return null; return { name: c.name, cls: heroCls, gear: c.gear.map(g => { const x = Object.assign({}, g); delete x.id; return x; }), deck: c.deck.map(k => ({ key: k.key, rank: k.rank || 0 })), runs: c.runs, best: c.best, bossKills: c.bossKills, duels: c.duels || null, acct: supaUser ? acctName(supaUser) : '' }; }
  function showInspect(ch) {
    const deck = ch.deck.slice().sort((a, b) => RAR_ORDER[CARDS[a.key].rarity] - RAR_ORDER[CARDS[b.key].rarity] || CARDS[a.key].name.localeCompare(CARDS[b.key].name));
    const groups = []; for (const k of deck) { const g = groups.find(x => x.key === k.key && x.rank === k.rank); if (g) g.n++; else groups.push({ key: k.key, rank: k.rank, n: 1 }); }
    modal(`<h2>${esc(ch.name)}</h2>${paperdoll(ch, ch.cls, { cmp: myGear(), acct: ch.acct })}
      <p class="muted" style="font-size:13px">Hover their gear to compare it with yours. Runs ${ch.runs || 0}, best row ${ch.best > ROWS ? 'Boss' : ch.best || 0}, Warlord kills ${ch.bossKills || 0}.</p>
      <h3 style="font-size:18px;color:var(--accent)">Deck (${ch.deck.length})</h3><div class="pilegrid">${groups.map(g => `<div class="pilecard">${cardBox(CB.rankedCard(g.key, g.rank), 130)}${g.n > 1 ? `<span class="pilecount">x${g.n}</span>` : ''}</div>`).join('')}</div>
      <div class="row"><button class="btn primary" id="mClose">Close</button></div>`);
    $('modalBox').classList.add('wide'); paintPortraits($('modalBox')); fitCards($('modalBox')); $('mClose').onclick = closeModal;
  }

  // ---------- trading: both players pick items from their stash (and gold); when both accept the same offer, both games swap
  const TR = { inv: [], s: null };
  const sideKey = (items, gold) => items.map(i => i.id).sort().join(',') + '$' + (gold || 0);
  function tradeHash() { const S = TR.s; return [[SOC.me, sideKey(myOffer(), S.myGold)], [S.with, sideKey(S.theirs, S.theirGold)]].sort((a, b) => a[0] < b[0] ? -1 : 1).map(x => x.join(':')).join('|'); }
  const myOffer = () => TR.s ? TR.s.mine.map(id => profile.stash.find(x => x.id === id)).filter(Boolean) : [];
  function tradeAsk(uid) {
    if (!socOn()) return; if (run || cb || NET.s) { toast('You can only trade in Emberwatch.'); return; }
    if (TR.s) { toast('Finish your current trade first.'); return; }
    const c = profile.chars[heroCls]; netSend('tr-ask', { to: uid, name: c ? c.name : acctName(supaUser) });
    TR.asked = uid; sysChat(`Trade request sent to ${nameOfUid(uid)}.`);
  }
  function answerTrade(from, ok) {
    TR.inv = TR.inv.filter(i => i.from !== from); renderSocial();
    if (ok && (run || cb || NET.s || TR.s)) { toast('You can only trade from Emberwatch, one trade at a time.'); ok = false; }
    netSend('tr-ans', { to: from, ok });
    if (ok) openTrade(from);
  }
  function openTrade(uid) { TR.s = { tid: [SOC.me, uid].sort().join('-'), with: uid, name: nameOfUid(uid), mine: [], myGold: 0, theirs: [], theirGold: 0, myAcc: null, theirAcc: null }; renderTrade(); }
  function sendOffer() { const S = TR.s; S.myAcc = null; S.theirAcc = null; netSend('tr-offer', { to: S.with, items: myOffer(), gold: S.myGold }); renderTrade(); }
  function tradeAccept() {
    const S = TR.s; if (!S) return;
    const room = CBHub.STASH_MAX - (profile.stash.length - myOffer().length);
    if (S.theirs.length > room) { toast(`Your stash can't hold ${S.theirs.length} more item${S.theirs.length === 1 ? '' : 's'}. Make room first.`); return; }
    S.myAcc = tradeHash(); netSend('tr-acc', { to: S.with, hash: S.myAcc });
    if (S.theirAcc === S.myAcc) doTrade(); else renderTrade();
  }
  function doTrade() {
    const S = TR.s; if (!S || S.done) return; S.done = true;
    const mine = myOffer(), ids = new Set(mine.map(x => x.id));
    profile.stash = profile.stash.filter(x => !ids.has(x.id));
    profile.gold = Math.max(0, profile.gold - (S.myGold || 0)) + (S.theirGold || 0);
    for (const it of S.theirs) profile.stash.unshift(Object.assign({}, it, { id: 'g' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8) }));
    save(); TR.s = null; closeModal(); renderHub();
    const got = S.theirs.length + (S.theirGold ? 1 : 0), gave = mine.length + (S.myGold ? 1 : 0);
    sysChat(`Trade with ${S.name} complete: you gave ${mine.length} item${mine.length === 1 ? '' : 's'}${S.myGold ? ' and ' + S.myGold + ' gold' : ''}, and got ${S.theirs.length} item${S.theirs.length === 1 ? '' : 's'}${S.theirGold ? ' and ' + S.theirGold + ' gold' : ''}.`);
    toast(`Trade complete. ${got || gave ? 'New items are in your stash.' : ''}`);
  }
  function cancelTrade(quiet) { const S = TR.s; if (!S) return; TR.s = null; if (!quiet) netSend('tr-cancel', { to: S.with }); closeModal(); sysChat(`Trade with ${S.name} cancelled.`); }
  function renderTrade() {
    const S = TR.s; if (!S) return;
    const mine = myOffer(), gear = myGear();
    const avail = profile.stash.filter(x => x.kind !== 'card' && !S.mine.includes(x.id));
    const row = (it, act) => `<div class="tritem" style="--rc:${RC[it.rarity] || 'var(--line)'}" data-tip="${tipKey(it, gear)}">${slotIcon(it.slot)}<span><b>${esc(it.name)}</b><small>${rarName(it.rarity)} &middot; ilvl ${it.ilvl}</small></span>${act || ''}</div>`;
    const both = S.myAcc && S.theirAcc === S.myAcc;
    modal(`<h2>Trade with ${esc(S.name)}</h2>
      <div class="tradegrid">
        <div class="panel"><h3>You offer</h3><div class="trlist">${mine.map(it => row(it, `<button class="pilebtn" data-trrm="${it.id}">Remove</button>`)).join('') || '<span class="muted">Click items in your stash below to offer them.</span>'}</div>
          <label class="trgold">Gold <input type="number" id="trGold" min="0" max="${profile.gold}" value="${S.myGold || 0}"> <span class="muted">of ${profile.gold}</span></label>
          <p class="trst ${S.myAcc ? 'up' : ''}">${S.myAcc ? 'You accepted.' : ''}</p></div>
        <div class="panel"><h3>${esc(S.name)} offers</h3><div class="trlist">${S.theirs.map(it => row(it, upBadge(it, gear))).join('') || '<span class="muted">Nothing yet.</span>'}</div>
          <p class="trgold">Gold: <b>${S.theirGold || 0}</b></p>
          <p class="trst ${S.theirAcc ? 'up' : ''}">${S.theirAcc ? (S.theirAcc === tradeHash() ? `${esc(S.name)} accepted this offer.` : `${esc(S.name)} accepted an earlier offer.`) : ''}</p></div>
      </div>
      <h3 style="font-size:16px;margin:10px 0 4px">Your stash (${profile.stash.length}/${CBHub.STASH_MAX})</h3><div class="trstash">${avail.map(it => row(it, `<button class="pilebtn" data-tradd="${it.id}">Offer</button>`)).join('') || '<span class="muted">Nothing else to offer. Unequip gear at the Quartermaster to trade it.</span>'}</div>
      <p class="muted" style="font-size:12px">Changing either offer clears both accepts. The swap happens when you both accept the same offer.</p>
      <div class="row"><button class="btn primary" id="trAcc" ${S.myAcc || both ? 'disabled' : ''}>${S.myAcc ? 'Waiting for ' + esc(S.name) + '...' : 'Accept trade'}</button><button class="btn" id="trCancel">Cancel trade</button></div>`);
    $('modalBox').classList.add('wide');
    $('trAcc').onclick = tradeAccept; $('trCancel').onclick = () => cancelTrade();
    $('trGold').onchange = (e) => { S.myGold = Math.max(0, Math.min(profile.gold, Math.floor(+e.target.value || 0))); sendOffer(); };
    for (const b of $('modalBox').querySelectorAll('[data-tradd]')) b.onclick = () => { if (S.mine.length >= 12) return; S.mine.push(b.dataset.tradd); sendOffer(); };
    for (const b of $('modalBox').querySelectorAll('[data-trrm]')) b.onclick = () => { S.mine = S.mine.filter(x => x !== b.dataset.trrm); sendOffer(); };
  }
  function tradeInvitesHtml() { return TR.inv.map(i => `<div class="ppinv"><span><b>${esc(i.name)}</b> wants to trade</span><span><button class="btn primary" data-tracc="${i.from}">Trade</button> <button class="btn" data-trdec="${i.from}">Decline</button></span></div>`).join(''); }
  document.addEventListener('click', (ev) => {
    const t = ev.target.closest('[data-tracc],[data-trdec],[data-insp],[data-trade]'); if (!t) return;
    if (t.dataset.tracc) answerTrade(t.dataset.tracc, true);
    if (t.dataset.trdec) answerTrade(t.dataset.trdec, false);
    if (t.dataset.insp) { closeTalk(); inspect(t.dataset.insp); }
    if (t.dataset.trade) { closeTalk(); tradeAsk(t.dataset.trade); }
  });
  function gearNetIn(p) {
    if (p.to !== SOC.me) return;
    switch (p.type) {
      case 'insp-req': { const ch = inspectCard(); if (ch) netSend('insp', { to: p.from, ch }); return; }
      case 'insp': { if (INS.waiting !== p.from) return; INS.waiting = null; showInspect(p.ch); return; }
      case 'tr-ask': { if (TR.inv.some(i => i.from === p.from)) return; TR.inv.push({ from: p.from, name: p.name }); sysChat(`${p.name} wants to trade with you.`); renderSocial(); return; }
      case 'tr-ans': { if (TR.asked !== p.from) return; TR.asked = null; if (!p.ok) { sysChat(`${nameOfUid(p.from)} declined the trade.`); return; } if (TR.s || run || cb) { netSend('tr-cancel', { to: p.from }); return; } openTrade(p.from); return; }
      case 'tr-offer': { const S = TR.s; if (!S || S.with !== p.from) return; S.theirs = (p.items || []).slice(0, 12); S.theirGold = Math.max(0, Math.floor(p.gold || 0)); S.myAcc = null; S.theirAcc = null; renderTrade(); return; }
      case 'tr-acc': { const S = TR.s; if (!S || S.with !== p.from) return; S.theirAcc = p.hash; if (S.myAcc && S.myAcc === p.hash) doTrade(); else renderTrade(); return; }
      case 'tr-cancel': { if (TR.s && TR.s.with === p.from) { TR.s = null; closeModal(); sysChat(`${nameOfUid(p.from)} cancelled the trade.`); } TR.inv = TR.inv.filter(i => i.from !== p.from); renderSocial(); return; }
    }
  }

  // ---------- clicking another player in town
  function playerMenu(uid) {
    const st = SOC.online.get(uid) || {}, o = SOC.others.get(uid) || {};
    const inParty = SOC.party && SOC.party.members.some(m => m.uid === uid), mineParty = SOC.party && SOC.party.members.some(m => m.uid === SOC.me);
    $('talk').innerHTML = `<b style="color:${CC[o.cls || st.cls] || 'var(--text)'}">${esc(o.name || st.name || 'Player')}</b><p>${esc(o.cls || st.cls || '')} &middot; ${placeText(st)}</p>
      <div class="row"><button class="btn primary" data-insp="${uid}">Inspect</button><button class="btn" data-trade="${uid}">Trade</button>${!inParty && (!SOC.party || SOC.party.leader === SOC.me) ? `<button class="btn" id="pmInv">Invite to party</button>` : ''}${inParty && mineParty ? `<button class="btn" id="pmDuel">Duel</button>` : ''}<button class="btn" id="tBye">Close</button></div>`;
    $('talk').hidden = false; updatePrompt();
    $('tBye').onclick = closeTalk;
    if ($('pmInv')) $('pmInv').onclick = () => { closeTalk(); invite(uid); };
    if ($('pmDuel')) $('pmDuel').onclick = () => { closeTalk(); challenge(uid); };
  }
