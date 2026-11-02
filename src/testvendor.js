  // ---------- TEMPORARY test vendor (Tinker Pip): every card and every codex, free. Remove before launch.
  const TV = { tab: 'decks', rar: 'All', q: '', open: null };
  // ---------- premade codex test decks (design/Cardbound_Codex_Test_Decks.xlsx): load one and its codex in a click
  const TDECKS = window.CB_TESTDECKS || [];
  function testDecksHtml(c) {
    const mine = TDECKS.filter(d => d.cls === hcls()), eq = c.gear.find(g => g.slot === 'Codex');
    const others = Object.keys(CLASSES).filter(k => k !== hcls()).map(k => `${TDECKS.filter(d => d.cls === k).length} ${k}`).join(', ');
    const groups = []; for (const d of mine) { let g = groups.find(x => x.codex === d.codex); if (!g) groups.push(g = { codex: d.codex, decks: [] }); g.decks.push(d); }
    const cx = (k) => (CB.CODEXES[hcls()] || []).find(x => x[0] === k) || [k, k, ''];
    return `<p class="savenote" style="margin:0 0 8px"><b>${mine.length} ${hcls()} test decks</b>, three per codex (the deck sheets are in the Codex Test Decks workbook). <b>Load deck</b> equips that codex and replaces ${esc(c.name)}'s deck with the 22 cards at +0. Your own cards go back to the collection; test-deck cards are removed when you load another. Other classes: ${others} (switch hero to load those).</p>
      ${groups.map(g => { const [k, nm, txt] = cx(g.codex); return `<div class="tdgroup"><div class="tdhead"><b style="color:#e0802a">${esc(nm)} Codex</b> <span class="muted">${esc(txt)}</span>${eq && eq.codex === k ? ' <span class="chip">equipped</span>' : ''}</div>
        <div class="tdrow">${g.decks.map(d => { const loaded = c.testDeck === d.id, cnt = { Gold: 0, Blue: 0, Green: 0, White: 0 }; for (const [ck, n] of d.cards) cnt[CARDS[ck].rarity] += n;
          return `<div class="tdcard ${loaded ? 'on' : ''}"><div class="ih"><b>${esc(nm)} ${hcls()} ${d.n}: ${esc(d.name)}</b></div><div class="il">${esc(d.style)}</div><p>${esc(d.plan)}</p>
            <div class="il">${['Gold', 'Blue', 'Green', 'White'].map(r => `<span style="color:${RC[r]}">${cnt[r]} ${r}</span>`).join(' &middot; ')}</div>
            ${TV.open === d.id ? `<div class="tdlist">${d.cards.slice().sort((a, b) => RAR_ORDER[CARDS[b[0]].rarity] - RAR_ORDER[CARDS[a[0]].rarity] || CARDS[a[0]].name.localeCompare(CARDS[b[0]].name)).map(([ck, n]) => `<span style="color:${RC[CARDS[ck].rarity]}" title="${esc(CARDS[ck].text)}">${n}x ${esc(CARDS[ck].name)}</span>`).join('')}</div>` : ''}
            <div class="acts"><button class="btn ${loaded ? '' : 'primary'}" data-tvdeck="${d.id}">${loaded ? 'Loaded (reload)' : 'Load deck'}</button><button class="btn" data-tvpeek="${d.id}">${TV.open === d.id ? 'Hide cards' : 'Show cards'}</button></div></div>`; }).join('')}</div></div>`; }).join('')}`;
  }
  function loadTestDeck(id) {
    const d = TDECKS.find(x => x.id === id), c = profile.chars[heroKey]; if (!d || !c) return;
    if (d.cls !== hcls()) return toast(`That deck is for a ${d.cls}.`);
    const nid = () => 'k' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
    // your own cards go back to the collection; cards from an earlier test deck just disappear
    for (const k of c.deck) if (!k.test) c.cards.push(k);
    c.deck = []; for (const [key, n] of d.cards) for (let i = 0; i < n; i++) c.deck.push({ id: nid(), key, rank: 0, test: true });
    c.testDeck = d.id;
    let note = '';
    const eq = c.gear.find(g => g.slot === 'Codex');
    if (!eq || eq.codex !== d.codex) {
      let it = profile.stash.find(x => x.codex === d.codex);
      if (!it) { if (profile.stash.length >= CBHub.STASH_MAX) note = ' Your stash is full, so the codex could not be added: make room and load again.'; else { it = Object.assign({ id: 'g' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6) }, CB.makeCodex(DATA, CB.makeRng(Date.now() % 2147483646), d.codex, profile.last.level || 0)); profile.stash.unshift(it); } }
      if (it) { const r = CBHub.equip(profile, heroKey, it.id, 'Codex'); if (!r.ok) note = ` The codex could not be equipped: ${r.why}.`; }
    }
    save(); renderHub(); renderTestVendor();
    toast(`Loaded ${d.name} (${d.cards.reduce((t, x) => t + x[1], 0)} cards) and equipped the ${CB.CODEX_BY_KEY ? (CB.CODEX_BY_KEY[d.codex] || {}).name || d.codex : d.codex} Codex.${note} Press C to see the deck.`);
  }
  function renderTestVendor() {
    const el = $('hpTest'); if (!el) return;
    const c = profile.chars[heroKey]; if (!c) { el.innerHTML = '<p>Make a hero first.</p>'; return; }
    const own = {}; for (const k of [...c.deck, ...c.cards]) own[k.key] = (own[k.key] || 0) + 1;
    const q = TV.q.toLowerCase();
    const cards = Object.entries(CARDS).filter(([k, d]) => d.cls === hcls() && !d.designOnly && ['White', 'Green', 'Blue', 'Gold'].includes(d.rarity) && (TV.rar === 'All' || d.rarity === TV.rar) && (!q || (d.name + ' ' + d.text + ' ' + d.type + ' ' + d.rarity).toLowerCase().includes(q)))
      .sort((a, b) => RAR_ORDER[b[1].rarity] - RAR_ORDER[a[1].rarity] || a[1].name.localeCompare(b[1].name));
    const room = CBHub.STASH_MAX - profile.stash.length;
    el.innerHTML = `<p class="savenote" style="margin:0 0 8px"><a href="forge.html" target="_blank" rel="noopener" style="color:var(--accent);font-weight:600">Open the Forge</a> <span class="muted">(hero sprites, gear pieces, moves and fight effects)</span></p><p class="savenote" style="margin:0 0 8px"><b style="color:#e0802a">Test vendor (temporary).</b> Everything here is free so you can try cards and codexes. Cards go to ${esc(c.name)}'s collection (add them to the deck at the Scribe); codexes go to the stash (equip them in the Codex slot with C).</p>
      <div class="cxtop"><div class="tabs cxtabs" role="tablist">${[['decks', 'Test decks'], ['cards', `${hcls()} cards`], ['codex', 'Codexes'], ['misc', 'Gold']].map(([k, l]) => `<button role="tab" aria-selected="${TV.tab === k}" data-tvtab="${k}">${l}</button>`).join('')}</div>
        ${TV.tab === 'cards' ? `<input id="tvQ" type="search" placeholder="Search ${hcls()} cards by name or text..." value="${esc(TV.q)}" autocomplete="off">` : ''}
        <button class="btn" data-tvgold="clear" title="Sets the bank to 0 gold (to test a new player)">Clear all gold (${profile.gold})</button>
        <button class="btn" data-tvgold="tokens" title="Reroll Tokens, spent at Jeweler Rook">+10 Reroll Tokens (${profile.rerollTokens || 0})</button>
        <button class="btn" data-tvshop="1" title="Merchant Dace normally restocks every 12 hours">Restock Merchant Dace now</button>
        <button class="btn" data-tvkit="Blue" title="Equips a full set of Blue gear for your class (the set the raid balance was tuned with). Your current gear goes to the stash; your codex stays on.">Full Blue gear kit</button>
        <button class="btn" data-tvraid="reset" title="Raid kills lock a hero out of that raid for 7 days">Reset raid lockouts</button>
        <button class="btn" data-tvraid="unlock" title="Counts every map's boss as beaten at +10 for this hero, so every raid opens">Unlock all raids (+10)</button>
        <button class="btn" data-tvcxp="5" title="Adds 5 levels to the codex you wear (talent rows open every 2 levels)">Worn codex +5 levels</button>
        <button class="btn" data-tvcxp="max" title="Every codex of your class jumps to level 20, so every talent row opens">Max all my codexes</button>
        <button class="btn" data-tvcxp="zero" title="Every codex of your class back to level 0 (picks are cleared)">Reset my codex XP</button></div>
      ${TV.tab === 'decks' ? testDecksHtml(c) : TV.tab === 'cards' ? `<div class="cxchips">${['All', 'White', 'Green', 'Blue', 'Gold'].map(r => `<button class="cxchip ${TV.rar === r ? 'on' : ''}" data-tvrar="${r}">${r}</button>`).join('')}<button class="btn primary" data-tvall="1" style="margin-left:auto">Take one of each${q || TV.rar !== 'All' ? ' shown' : ''} (${cards.length})</button></div>
        <div class="pilegrid cxgrid nozoom">${cards.length ? '' : '<span class="muted">No cards match.</span>'}${cards.map(([k, d]) => `<div class="pilecard" style="display:grid;gap:4px;justify-items:center">${cardBox(d, 140)}${own[k] ? `<span class="pilecount">x${own[k]}</span>` : ''}<button class="pilebtn" data-tvcard="${k}">Take</button></div>`).join('')}</div>`
      : TV.tab === 'codex' ? `<p class="muted">Stash space: ${room}. Codexes roll random stats at map level +${profile.last.level || 0} (the Wagon's level). Only that class can equip one.</p>
        ${Object.entries(CB.CODEXES).map(([cls, list]) => `<h3 style="color:${CC[cls]};margin:10px 0 4px">${cls}</h3><div class="list" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:6px">${list.map(([key, name, text]) => `<div class="item" style="--rc:#e0802a"><div class="ih"><b>${esc(name)} Codex</b><span>${cls}</span></div><div class="st" style="color:#f0b070">${esc(text)}</div><div class="acts"><button class="btn" data-tvcx="${key}" ${room > 0 ? '' : 'disabled'}>Take</button></div></div>`).join('')}</div>`).join('')}`
      : `<div class="row"><button class="btn primary" data-tvgold="1000">+1,000 gold</button><button class="btn" data-tvgold="10000">+10,000 gold</button><button class="btn" data-tvgold="clear" title="Sets your bank to 0 gold">Clear all gold</button></div><p class="muted">Bank: ${profile.gold} gold.</p>`}`;
    fitCards(el);
  }
  $('hpTest').addEventListener('click', (ev) => {
    const b = ev.target.closest('[data-tvcxp],[data-tvtab],[data-tvrar],[data-tvcard],[data-tvall],[data-tvcx],[data-tvgold],[data-tvshop],[data-tvraid],[data-tvkit],[data-tvdeck],[data-tvpeek]'); if (!b) return;
    if (b.dataset.tvdeck) return loadTestDeck(b.dataset.tvdeck);
    if (b.dataset.tvpeek) { TV.open = TV.open === b.dataset.tvpeek ? null : b.dataset.tvpeek; return renderTestVendor(); }
    const c = profile.chars[heroKey];
    if (b.dataset.tvtab) TV.tab = b.dataset.tvtab;
    else if (b.dataset.tvrar) TV.rar = b.dataset.tvrar;
    else if (b.dataset.tvcard) { c.cards.push({ id: 'k' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7), key: b.dataset.tvcard, rank: 0 }); save(); }
    else if (b.dataset.tvkit) {
      const c = profile.chars[heroKey]; if (!c) return;
      const kit = CB.presetGear(c.cls, b.dataset.tvkit).map(g => Object.assign({ id: 'g' + Math.random().toString(36).slice(2, 10), test: true }, g));
      const old = (c.gear || []).filter(g => g.slot !== 'Codex'); let kept = 0, lost = 0;
      for (const g of old) { if (profile.stash.length < CBHub.STASH_MAX) { profile.stash.unshift(Object.assign({}, g, { slot: /^Ring/.test(g.slot) ? 'Ring' : g.slot })); kept++; } else lost++; }
      c.gear = [...kit, ...(c.gear || []).filter(g => g.slot === 'Codex')]; save(); renderHub();
      toast(`${c.name} is wearing a full ${b.dataset.tvkit} kit. ${kept} old item${kept === 1 ? '' : 's'} moved to the stash${lost ? `; ${lost} didn't fit and were dropped` : ''}.`);
    }
    else if (b.dataset.tvcxp) { const c = profile.chars[heroKey]; if (!c) return; const v = b.dataset.tvcxp, need = (lv) => { let x = 0; for (let i = 1; i <= lv; i++) x += CB.CODEX_XP(i); return x; };
      if (v === '5') { const k = CBHub.wornCodex(c); if (!k) return toast('Equip a codex first (Quartermaster).'); const st = CBHub.codexState(c, k), lv = Math.min(CB.CODEX_MAX, CB.codexLevel(st.xp).level + 5); st.xp = need(lv); toast(`${CB.CODEX_BY_KEY[k].name} is now level ${lv}. Press N for its talents.`); }
      else for (const [k] of CB.CODEXES[c.cls]) { const st = CBHub.codexState(c, k); st.xp = v === 'max' ? need(CB.CODEX_MAX) : 0; if (v === 'zero') st.picks = []; }
      if (v !== '5') toast(v === 'max' ? 'Every codex of your class is level 20. Press N for the talent trees.' : 'Codex XP reset.'); save(); renderCodexBar(); }
    else if (b.dataset.tvraid) { const c = profile.chars[heroKey]; if (!c) return; if (b.dataset.tvraid === 'reset') { c.raidLocks = {}; toast(`${c.name}'s raid lockouts are cleared.`); } else { c.mapKills = c.mapKills || {}; for (const mk of Object.keys(DATA.maps)) c.mapKills[mk] = Math.max(c.mapKills[mk] == null ? -1 : c.mapKills[mk], 10); toast(`${c.name} counts as having beaten every map's boss at +10: all raids are open.`); } save(); }
    else if (b.dataset.tvshop) { CBHub.refreshShop(profile, DATA); save(); toast(`Merchant Dace has new stock (from your last boss kill: ${DATA.maps[profile.shop.map].name} +${profile.shop.level}).`); }
    else if (b.dataset.tvall) { const q = TV.q.toLowerCase(); let n = 0; for (const [k, d] of Object.entries(CARDS)) if (d.cls === hcls() && !d.designOnly && ['White', 'Green', 'Blue', 'Gold'].includes(d.rarity) && (TV.rar === 'All' || d.rarity === TV.rar) && (!q || (d.name + ' ' + d.text + ' ' + d.type + ' ' + d.rarity).toLowerCase().includes(q)) && ++n) c.cards.push({ id: 'k' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7), key: k, rank: 0 }); save(); toast(`Added ${n} ${hcls()} card${n === 1 ? '' : 's'} to ${c.name}'s collection.`); }
    else if (b.dataset.tvcx) { if (profile.stash.length >= CBHub.STASH_MAX) return toast('Stash is full.'); const it = CB.makeCodex(DATA, CB.makeRng(Date.now() % 2147483646), b.dataset.tvcx, profile.last.level || 0); profile.stash.unshift(Object.assign({ id: 'g' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6) }, it)); save(); }
    else if (b.dataset.tvgold) { if (b.dataset.tvgold === 'tokens') { profile.rerollTokens = (profile.rerollTokens || 0) + 10; toast(`+10 Reroll Tokens (${profile.rerollTokens}).`); save(); return renderTestVendor(); } if (b.dataset.tvgold === 'clear') { profile.gold = 0; toast('Bank emptied: 0 gold.'); } else profile.gold += +b.dataset.tvgold; save(); renderTownBar(); }
    renderTestVendor();
  });

  $('hpTest').addEventListener('input', (ev) => { if (ev.target.id !== 'tvQ') return; TV.q = ev.target.value; const pos = ev.target.selectionStart; renderTestVendor(); const i = $('tvQ'); i.focus(); i.setSelectionRange(pos, pos); });
