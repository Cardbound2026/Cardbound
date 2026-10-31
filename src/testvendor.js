  // ---------- TEMPORARY test vendor (Tinker Pip): every card and every codex, free. Remove before launch.
  const TV = { tab: 'cards', rar: 'All', q: '' };
  function renderTestVendor() {
    const el = $('hpTest'); if (!el) return;
    const c = profile.chars[heroCls]; if (!c) { el.innerHTML = '<p>Make a hero first.</p>'; return; }
    const own = {}; for (const k of [...c.deck, ...c.cards]) own[k.key] = (own[k.key] || 0) + 1;
    const q = TV.q.toLowerCase();
    const cards = Object.entries(CARDS).filter(([k, d]) => d.cls === heroCls && !d.designOnly && ['White', 'Green', 'Blue', 'Gold'].includes(d.rarity) && (TV.rar === 'All' || d.rarity === TV.rar) && (!q || (d.name + ' ' + d.text + ' ' + d.type + ' ' + d.rarity).toLowerCase().includes(q)))
      .sort((a, b) => RAR_ORDER[b[1].rarity] - RAR_ORDER[a[1].rarity] || a[1].name.localeCompare(b[1].name));
    const room = CBHub.STASH_MAX - profile.stash.length;
    el.innerHTML = `<p class="savenote" style="margin:0 0 8px"><b style="color:#e0802a">Test vendor (temporary).</b> Everything here is free so you can try cards and codexes. Cards go to ${esc(c.name)}'s collection (add them to the deck at the Scribe); codexes go to the stash (equip them in the Codex slot with C).</p>
      <div class="cxtop"><div class="tabs cxtabs" role="tablist">${[['cards', `${heroCls} cards`], ['codex', 'Codexes'], ['misc', 'Gold']].map(([k, l]) => `<button role="tab" aria-selected="${TV.tab === k}" data-tvtab="${k}">${l}</button>`).join('')}</div>
        ${TV.tab === 'cards' ? `<input id="tvQ" type="search" placeholder="Search ${heroCls} cards by name or text..." value="${esc(TV.q)}" autocomplete="off">` : ''}
        <button class="btn" data-tvshop="1" title="Merchant Dace normally restocks every 12 hours">Restock Merchant Dace now</button></div>
      ${TV.tab === 'cards' ? `<div class="cxchips">${['All', 'White', 'Green', 'Blue', 'Gold'].map(r => `<button class="cxchip ${TV.rar === r ? 'on' : ''}" data-tvrar="${r}">${r}</button>`).join('')}<button class="btn primary" data-tvall="1" style="margin-left:auto">Take one of each${q || TV.rar !== 'All' ? ' shown' : ''} (${cards.length})</button></div>
        <div class="pilegrid cxgrid nozoom">${cards.length ? '' : '<span class="muted">No cards match.</span>'}${cards.map(([k, d]) => `<div class="pilecard" style="display:grid;gap:4px;justify-items:center">${cardBox(d, 140)}${own[k] ? `<span class="pilecount">x${own[k]}</span>` : ''}<button class="pilebtn" data-tvcard="${k}">Take</button></div>`).join('')}</div>`
      : TV.tab === 'codex' ? `<p class="muted">Stash space: ${room}. Codexes roll random stats at map level +${profile.last.level || 0} (the Wagon's level). Only that class can equip one.</p>
        ${Object.entries(CB.CODEXES).map(([cls, list]) => `<h3 style="color:${CC[cls]};margin:10px 0 4px">${cls}</h3><div class="list" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:6px">${list.map(([key, name, text]) => `<div class="item" style="--rc:#e0802a"><div class="ih"><b>${esc(name)} Codex</b><span>${cls}</span></div><div class="st" style="color:#f0b070">${esc(text)}</div><div class="acts"><button class="btn" data-tvcx="${key}" ${room > 0 ? '' : 'disabled'}>Take</button></div></div>`).join('')}</div>`).join('')}`
      : `<div class="row"><button class="btn primary" data-tvgold="1000">+1,000 gold</button><button class="btn" data-tvgold="10000">+10,000 gold</button></div><p class="muted">Bank: ${profile.gold} gold.</p>`}`;
    fitCards(el);
  }
  $('hpTest').addEventListener('click', (ev) => {
    const b = ev.target.closest('[data-tvtab],[data-tvrar],[data-tvcard],[data-tvall],[data-tvcx],[data-tvgold],[data-tvshop]'); if (!b) return;
    const c = profile.chars[heroCls];
    if (b.dataset.tvtab) TV.tab = b.dataset.tvtab;
    else if (b.dataset.tvrar) TV.rar = b.dataset.tvrar;
    else if (b.dataset.tvcard) { c.cards.push({ id: 'k' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7), key: b.dataset.tvcard, rank: 0 }); save(); }
    else if (b.dataset.tvshop) { CBHub.refreshShop(profile, DATA, profile.last.level || 0); save(); toast(`Merchant Dace has new stock (map level +${profile.last.level || 0}, ${DATA.maps[curMap()].name} gear).`); }
    else if (b.dataset.tvall) { const q = TV.q.toLowerCase(); let n = 0; for (const [k, d] of Object.entries(CARDS)) if (d.cls === heroCls && !d.designOnly && ['White', 'Green', 'Blue', 'Gold'].includes(d.rarity) && (TV.rar === 'All' || d.rarity === TV.rar) && (!q || (d.name + ' ' + d.text + ' ' + d.type + ' ' + d.rarity).toLowerCase().includes(q)) && ++n) c.cards.push({ id: 'k' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7), key: k, rank: 0 }); save(); toast(`Added ${n} ${heroCls} card${n === 1 ? '' : 's'} to ${c.name}'s collection.`); }
    else if (b.dataset.tvcx) { if (profile.stash.length >= CBHub.STASH_MAX) return toast('Stash is full.'); const it = CB.makeCodex(DATA, CB.makeRng(Date.now() % 2147483646), b.dataset.tvcx, profile.last.level || 0); profile.stash.unshift(Object.assign({ id: 'g' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6) }, it)); save(); }
    else if (b.dataset.tvgold) { profile.gold += +b.dataset.tvgold; save(); renderTownBar(); }
    renderTestVendor();
  });

  $('hpTest').addEventListener('input', (ev) => { if (ev.target.id !== 'tvQ') return; TV.q = ev.target.value; const pos = ev.target.selectionStart; renderTestVendor(); const i = $('tvQ'); i.focus(); i.setSelectionRange(pos, pos); });
