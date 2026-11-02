  // ---------- the Bazaar (east of the main street): stand in the round market, set up shop, list stash items at your price.
  // While your shop is open you stay put and others can click you to browse and buy. Sales go player to player:
  // the buyer's gold is held, the seller hands over the item and takes the gold (sellers must be online to sell).
  const BZ = { open: false, view: null, pend: {}, done: {}, refunded: {}, MAX: 12 };
  const bzState = () => (profile.bazaar = profile.bazaar || { title: '', items: [] });
  const bzSlim = (it) => { const o = JSON.parse(JSON.stringify(it)); for (const k of ['id', 'price', 'sold', 'test']) delete o[k]; return o; };
  const bzSend = (payload) => { if (socOn()) SOC.ch.send({ type: 'broadcast', event: 'bazaar', payload: Object.assign({ from: SOC.me }, payload) }); };
  const myName = () => { const c = profile.chars[heroKey]; return c ? c.name : 'Someone'; };
  const shopTitle = () => bzState().title || `${myName()}'s wares`;

  // ----- your own shop
  function bazaarSheet() {
    const B = bzState(), here = inBazaar(P.x, P.y);
    const stash = profile.stash.filter(it => it.kind !== 'card');
    const listed = B.items.map((l, i) => itemHtml(l.it, `<div class="acts bzacts"><label>Price <input type="number" min="1" max="999999" value="${l.price}" data-bzprice="${i}"> gold</label><button class="btn" data-bzunlist="${i}" ${BZ.open ? 'disabled title="Close the shop to change it"' : ''}>Take back</button></div>`)).join('');
    const avail = stash.map(it => itemHtml(it, `<div class="acts bzacts"><span class="muted" style="font-size:12px">Salvage value ${CBHub.salvageValue(it)}g</span><button class="btn" data-bzlist="${it.id}" ${BZ.open || B.items.length >= BZ.MAX ? 'disabled' : ''}>List for sale</button></div>`)).join('');
    modal(`<h2>Your shop</h2>
      <p class="muted" style="margin:0 0 6px">${BZ.open ? '<b class="up">Your shop is open.</b> Other players can click you to browse and buy. You stay put while it is open; close it to walk again.' : here ? 'List items from your stash, set your prices, then open the shop. Listed items leave your stash until you take them back or someone buys them.' : '<b class="down">Walk into the round market square of the Bazaar (east of the main street) to open your shop.</b> You can still prepare your listings here.'}</p>
      <div class="namerow" style="margin:0 0 8px"><div class="field"><label for="bzTitle">Shop sign</label><input id="bzTitle" maxlength="28" value="${esc(B.title)}" placeholder="${esc(myName())}'s wares" ${BZ.open ? 'disabled' : ''}></div>
        ${BZ.open ? '<button class="btn primary" id="bzClose">Close shop</button>' : `<button class="btn primary" id="bzOpen" ${here && B.items.length && socOn() ? '' : 'disabled'}>Open shop</button>`}</div>
      <h3 style="font-size:18px;color:var(--accent);margin:6px 0">For sale (${B.items.length}/${BZ.MAX})</h3>
      <div class="list" style="max-height:30vh">${listed || '<span class="muted">Nothing listed yet.</span>'}</div>
      ${BZ.open ? '' : `<h3 style="font-size:18px;color:var(--accent);margin:10px 0 6px">Your stash (${stash.length})</h3><div class="list" style="max-height:30vh">${avail || '<span class="muted">Your stash is empty.</span>'}</div>`}
      <div class="row"><button class="btn" id="mClose">Done</button></div>`);
    $('modalBox').classList.add('wide'); $('mClose').onclick = closeModal;
    if ($('bzTitle')) $('bzTitle').onchange = (e) => { B.title = e.target.value.trim().slice(0, 28); save(); };
    if ($('bzOpen')) $('bzOpen').onclick = () => { if ($('bzTitle')) B.title = $('bzTitle').value.trim().slice(0, 28); openShop(); };
    if ($('bzClose')) $('bzClose').onclick = () => closeShop();
    $('modalBox').querySelectorAll('[data-bzprice]').forEach(inp => inp.onchange = () => { const l = B.items[+inp.dataset.bzprice]; if (l) { l.price = Math.max(1, Math.min(999999, Math.floor(+inp.value || 1))); save(); } });
    $('modalBox').querySelectorAll('[data-bzunlist]').forEach(b => b.onclick = () => {
      if (profile.stash.length >= CBHub.STASH_MAX) return toast('Your stash is full.');
      const l = B.items.splice(+b.dataset.bzunlist, 1)[0]; if (l) profile.stash.unshift(Object.assign({ id: 'g' + Math.random().toString(36).slice(2, 10) }, l.it)); save(); bazaarSheet();
    });
    $('modalBox').querySelectorAll('[data-bzlist]').forEach(b => b.onclick = () => {
      const i = profile.stash.findIndex(x => x.id === b.dataset.bzlist); if (i < 0 || B.items.length >= BZ.MAX) return;
      const it = profile.stash.splice(i, 1)[0];
      B.items.push({ lid: 'l' + Math.random().toString(36).slice(2, 10), it: bzSlim(it), price: Math.max(1, CBHub.salvageValue(it) * 3) }); save(); bazaarSheet();
    });
  }
  function openShop() {
    const B = bzState();
    if (!socOn()) return toast('Sign in to trade with other players.');
    if (!inBazaar(P.x, P.y)) return toast('Stand inside the round market square of the Bazaar to open your shop.');
    if (!B.items.length) return toast('List at least one item first.');
    BZ.open = true; P.path = []; P.held = []; P.target = null; retrack(true); sysChat(`Your shop "${shopTitle()}" is open. You stay here until you close it.`); bazaarSheet(); updateShopBtn();
  }
  function closeShop(quiet) {
    if (!BZ.open) return; BZ.open = false; retrack(true); if (!quiet) sysChat('Your shop is closed. Your listings are kept for next time.');
    if (!quiet && !$('modal').hidden && $('bzTitle')) bazaarSheet(); updateShopBtn();
  }
  function updateShopBtn() {
    const b = $('tbShop'); if (!b) return;
    const want = !$('scrStart').hidden && !!profile.chars[heroKey] && (BZ.open || inBazaar(P.x, P.y));
    if (b.hidden === want) b.hidden = !want;
    const txt = BZ.open ? 'Your shop (open)' : 'Set up shop'; if (b.textContent !== txt) b.textContent = txt;
    b.classList.toggle('primary', BZ.open);
  }
  // a shop sign over a vendor's head (theirs or yours)
  function drawShopSign(g, x, y, title, s) {
    g.font = `700 ${Math.round(11 * Math.max(0.9, s))}px "Barlow Semi Condensed", sans-serif`; g.textAlign = 'center';
    const t = title.length > 26 ? title.slice(0, 25) + '...' : title, w = g.measureText(t).width + 16, h = 18, top = y - 34;
    g.fillStyle = '#6a4a2a'; g.fillRect(x - w / 2, top, w, h); g.strokeStyle = '#d6a14a'; g.lineWidth = 1.5; g.strokeRect(x - w / 2, top, w, h);
    for (let i = 0; i < w; i += 8) { g.fillStyle = (i / 8) % 2 ? '#a3372a' : '#e8d9b0'; g.fillRect(x - w / 2 + i, top - 5, Math.min(8, w - i), 5); }
    g.fillStyle = '#f6e7c4'; g.fillText(t, x, top + 13);
  }

  // ----- browsing someone else's shop
  function browseShop(uid) {
    if (!socOn()) return; if (hcBlock(uid, 'trade')) return;
    BZ.view = { uid, items: null, at: Date.now() }; bzSend({ kind: 'req', to: uid });
    modal(`<h2>${esc(nameOfUid(uid))}'s shop</h2><p class="muted">Asking the shopkeeper for their wares...</p><div class="row"><button class="btn primary" id="mClose">Close</button></div>`); $('mClose').onclick = closeModal;
    setTimeout(() => { if (BZ.view && BZ.view.uid === uid && !BZ.view.items && !$('modal').hidden && /Asking the shopkeeper/.test($('modalBox').innerText)) toast(`${nameOfUid(uid)} didn't answer. Their shop may have just closed.`); }, 6000);
  }
  function drawBrowse() {
    const V = BZ.view; if (!V || !V.items) return;
    const c = profile.chars[heroKey], mine = c ? c.gear : [];
    const pendLids = new Set(Object.values(BZ.pend).filter(p => p.seller === V.uid).map(p => p.lid));
    modal(`<h2>${esc(V.title || nameOfUid(V.uid) + "'s shop")}</h2><p class="muted" style="margin:0 0 6px">Sold by ${esc(nameOfUid(V.uid))}. You have <b>${profile.gold}</b> gold and ${CBHub.STASH_MAX - profile.stash.length} free stash slots.</p>
      <div class="list" style="max-height:60vh">${V.items.map(l => itemHtml(l.it, `<div class="acts bzacts">${typeof upBadge === 'function' && mine.length ? upBadge(l.it, mine) : ''}<b style="color:var(--accent)">${l.price.toLocaleString()} gold</b>${pendLids.has(l.lid) ? '<span class="muted">Buying...</span>' : `<button class="btn primary" data-bzbuy="${l.lid}" ${profile.gold < l.price || profile.stash.length >= CBHub.STASH_MAX ? 'disabled' : ''}>Buy</button>`}</div>`)).join('') || '<span class="muted">Sold out.</span>'}</div>
      <div class="row"><button class="btn" id="bzRefresh">Refresh</button><button class="btn primary" id="mClose">Close</button></div>`);
    $('modalBox').classList.add('wide'); $('mClose').onclick = () => { BZ.view = null; closeModal(); };
    $('bzRefresh').onclick = () => browseShop(V.uid);
    $('modalBox').querySelectorAll('[data-bzbuy]').forEach(b => b.onclick = () => buy(V.uid, V.items.find(l => l.lid === b.dataset.bzbuy)));
  }
  function buy(seller, l) {
    if (!l) return;
    if (profile.gold < l.price) return toast('Not enough gold.');
    if (profile.stash.length >= CBHub.STASH_MAX) return toast('Your stash is full.');
    const rid = 'r' + Math.random().toString(36).slice(2, 10);
    profile.gold -= l.price; save(); renderTownBar(); // the gold is held until the seller answers
    BZ.pend[rid] = { rid, seller, lid: l.lid, price: l.price, name: l.it.name, at: Date.now(), tries: 0 };
    bzSend({ kind: 'buy', to: seller, rid, lid: l.lid, price: l.price, name: myName(), hc: myHc() });
    drawBrowse();
  }
  // buyers re-send until the seller answers; after 30 s the held gold comes back
  setInterval(() => {
    for (const p of Object.values(BZ.pend)) {
      if (Date.now() - p.at > 30000) { delete BZ.pend[p.rid]; BZ.refunded[p.rid] = p; profile.gold += p.price; save(); renderTownBar(); sysChat(`${nameOfUid(p.seller)} never answered: your ${p.price} gold for ${p.name} is back.`); if (BZ.view && !$('modal').hidden) drawBrowse(); continue; }
      if (++p.tries % 2 === 0) bzSend({ kind: 'buy', to: p.seller, rid: p.rid, lid: p.lid, price: p.price, name: myName() });
    }
  }, 1500);

  // ----- messages
  function bazaarIn(p) {
    if (!p || p.to !== SOC.me || p.from === SOC.me) return;
    const B = bzState();
    if (p.kind === 'req') { if (BZ.open) bzSend({ kind: 'list', to: p.from, title: shopTitle(), items: B.items.map(l => ({ lid: l.lid, price: l.price, it: l.it })) }); else bzSend({ kind: 'list', to: p.from, closed: true }); return; }
    if (p.kind === 'list') {
      if (!BZ.view || BZ.view.uid !== p.from) return;
      if (p.closed) { BZ.view = null; if (!$('modal').hidden) toast(`${nameOfUid(p.from)}'s shop is closed.`); return; }
      BZ.view.items = (p.items || []).slice(0, BZ.MAX); BZ.view.title = String(p.title || '').slice(0, 28); drawBrowse(); return;
    }
    if (p.kind === 'buy') { // seller side
      if (BZ.done[p.rid]) { bzSend(BZ.done[p.rid]); return; } // answered before: repeat the answer
      const i = B.items.findIndex(l => l.lid === p.lid);
      let res;
      if (!BZ.open) res = { kind: 'res', to: p.from, rid: p.rid, ok: false, why: 'the shop is closed' };
      else if (p.hc != null && !!p.hc !== myHc()) res = { kind: 'res', to: p.from, rid: p.rid, ok: false, why: 'Hardcore heroes only trade with Hardcore heroes' };
      else if (i < 0) res = { kind: 'res', to: p.from, rid: p.rid, ok: false, why: 'it was already sold' };
      else if (B.items[i].price !== p.price) res = { kind: 'res', to: p.from, rid: p.rid, ok: false, why: 'the price changed' };
      else {
        const l = B.items.splice(i, 1)[0]; profile.gold += l.price; CBHub.bump(profile, 'bazaarSales'); profile.stats.bazaarBest = Math.max(profile.stats.bazaarBest || 0, l.price); save(); renderTownBar(); // achievements: Merchant, Businessman
        res = { kind: 'res', to: p.from, rid: p.rid, ok: true, it: l.it, price: l.price };
        sysChat(`${String(p.name || nameOfUid(p.from)).slice(0, 24)} bought ${l.it.name} for ${l.price} gold.`);
        if (!B.items.length) { closeShop(true); sysChat('Sold out: your shop is closed.'); }
        if (!$('modal').hidden && $('bzTitle')) bazaarSheet();
      }
      BZ.done[p.rid] = res; bzSend(res); return;
    }
    if (p.kind === 'res') { // buyer side
      const pend = BZ.pend[p.rid], late = BZ.refunded[p.rid];
      if (!pend && !late) return;
      delete BZ.pend[p.rid]; delete BZ.refunded[p.rid];
      if (p.ok && p.it) {
        if (late) profile.gold = Math.max(0, profile.gold - (p.price || late.price)); // the answer came after we gave the gold back
        profile.stash.unshift(Object.assign({ id: 'g' + Math.random().toString(36).slice(2, 10) }, p.it, { slot: /^Ring/.test(p.it.slot) ? 'Ring' : p.it.slot }));
        save(); renderTownBar(); sysChat(`You bought ${p.it.name} for ${p.price || (pend || late).price} gold. It is in your stash.`);
        if (BZ.view && BZ.view.uid === p.from) browseShop(p.from);
      } else if (pend) { profile.gold += pend.price; save(); renderTownBar(); toast(`Couldn't buy ${pend.name}: ${p.why || 'the sale failed'}. Your gold is back.`); if (BZ.view && BZ.view.uid === p.from) browseShop(p.from); }
    }
  }
  $('tbShop').addEventListener('click', () => { closeTalk(); bazaarSheet(); });
  document.addEventListener('click', (ev) => { const b = ev.target.closest('[data-bzview]'); if (b) { if (!$('talk').hidden) closeTalk(); browseShop(b.dataset.bzview); } });
