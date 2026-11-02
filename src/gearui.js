  // ---------- character sheet (paperdoll), item tooltips and upgrade checks, inspecting other players, trading
  const DOLL_L = ['Helm', 'Shoulders', 'Amulet', 'Cloak', 'Chest', 'Bracers', 'Gloves'], DOLL_R = ['Belt', 'Pants', 'Boots', 'Ring 1', 'Ring 2', 'Codex'], DOLL_B = ['Weapon', 'Off-hand'];
  const SLOT_PATH = {
    Helm: 'M5 15a7 7 0 0 1 14 0v4H5z M9 19v-4h6v4', Shoulders: 'M3 15c0-5 3-8 7-8h4c4 0 7 3 7 8l-4 1-2-4H9l-2 4z M9 7V5h6v2', Amulet: 'M6 3c0 6 3 9 6 9s6-3 6-9 M12 12v2 M9.5 17a2.5 2.5 0 1 0 5 0a2.5 2.5 0 1 0-5 0',
    Cloak: 'M8 3h8l3 18H5z M12 3v18', Chest: 'M7 4l5 2 5-2 3 4-3 2v10H7V10L4 8z', Bracers: 'M6 5h12v6H6z M6 13h12v6H6z',
    Gloves: 'M7 21v-8L5 9l2-1 2 2V4h2v6V3h2v7V4h2v7l2-3 2 1-3 6v6z', Belt: 'M3 10h18v5H3z M10 9h4v7h-4z', Pants: 'M6 3h12l1 18h-5l-2-11-2 11H5z',
    Boots: 'M8 3h5v11l6 3v4H6v-4l2-2z', Ring: 'M7 14a5 5 0 1 0 10 0a5 5 0 1 0-10 0 M10 4h4l-2 4z',
    Codex: 'M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z M5 17a3 3 0 0 1 3-3h11 M10 8h5 M10 11h5',
    Weapon: 'M14 3h7v7l-9 9-3-3z M4 20l4-4 M6 15l3 3', 'Off-hand': 'M12 3l8 3v6c0 5-4 8-8 9-4-1-8-4-8-9V6z',
  };
  const slotKey = (sl) => /^Ring/.test(sl) ? 'Ring' : sl;
  const slotIcon = (sl) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round" aria-hidden="true"><path d="${SLOT_PATH[slotKey(sl)] || SLOT_PATH.Chest}"/></svg>`;

  // item power (Nov 2): what the item is worth to the hero you're playing, for its codex and the gear it already wears (CBHub.itemPower).
  // Stats your codex doesn't use, resistances past the 75% cap and resistances to other maps' elements add nothing. 1 power = 0.1% fight strength.
  const powerMap = () => (run && run.mapKey) || (profile.last && profile.last.map) || 'physical';
  function powerHero(gear, cls) { const c = profile.chars[heroKey] || { cls: cls || hcls(), deck: [], gear: [] }; return { cls: cls || c.cls, deck: c.deck, gear: gear || c.gear }; }
  function itemPower(it, cls, gear) { return CBHub.itemPower(powerHero(gear || wornGear(), cls), it, powerMap()); }
  function powerBasis(gear) { const g = CBHub.gearProfile(powerHero(gear || wornGear())); const cx = g.codex && CB.CODEX_BY_KEY[g.codex]; return cx ? `${cx.name}${g.guess ? ' (closest to your deck)' : ''}` : 'your class'; }
  // is an item better than what this hero wears? the change in the hero's whole-gear value if it goes on (best slot)
  function upgradeInfo(it, gear, cls) {
    if (!it || it.kind === 'card' || !gear) return null;
    if (it.slot === 'Codex' && it.cls && it.cls !== (cls || hcls())) return { kind: 'other', cls: it.cls };
    const cur = CBHub.slotOptions(it).map(sl => gear.find(g => g.slot === sl));
    if (cur.some(x => !x)) return { kind: 'empty' };
    const worn = gear.find(g => g.slot === 'Codex');
    if (it.slot === 'Codex' && it.codex && worn && worn.codex !== it.codex) return { kind: 'swap', vs: worn };
    const h = powerHero(gear, cls), u = CBHub.upgradeDelta(h, it, powerMap());
    return { kind: u.d > 0 ? 'up' : u.d < 0 ? 'down' : 'same', d: u.d, vs: u.vs || cur[0], p: CBHub.itemPower(h, it, powerMap()), h };
  }
  function upBadge(it, gear, cls) {
    const u = upgradeInfo(it, gear, cls); if (!u) return '';
    if (u.kind === 'empty') return `<span class="upb up" title="You have nothing in this slot">&#9650; Fills an empty slot</span>`;
    if (u.kind === 'other') return `<span class="upb same">${u.cls} only</span>`;
    if (u.kind === 'swap') return `<span class="upb same" title="A different codex changes how your deck plays, so power can't compare it with your ${esc(u.vs.name)}.">Different codex</span>`;
    const why = `Power for ${esc(powerBasis(gear))} on ${esc((DATA.maps[powerMap()] || {}).name || 'this map')}: this ${u.p}, your ${esc(u.vs.name)} ${CBHub.itemPower(u.h, u.vs, powerMap())}. Power counts only the stats your codex uses; resistance past 75% or for another map's element counts for nothing. 10 power = 1% fight strength.`;
    return u.kind === 'up' ? `<span class="upb up" title="${why}">&#9650; Upgrade +${u.d} power</span>`
      : u.kind === 'down' ? `<span class="upb down" title="${why}">&#9660; ${u.d} power</span>`
      : `<span class="upb same" title="${why}">= Even</span>`;
  }
  const myGear = () => (profile.chars[heroKey] || { gear: [] }).gear;
  // ---------- hold Shift over any item to compare it with what you wear (every stat with + / -)
  const CMP = { shift: false, el: null, x: 0, y: 0 };
  const cmpPop = document.createElement('div'); cmpPop.className = 'cmppop'; cmpPop.hidden = true; document.body.appendChild(cmpPop);
  const wornGear = () => run && run.members ? (run.members[run.online ? run.myMi : 0] || run.members[0]).gear : myGear();
  function itemStats(it) {
    const o = {}; for (const src of [it.stats || {}, it.imp2 || {}]) for (const [k, v] of Object.entries(src)) o[k] = (o[k] || 0) + v;
    const wf = it._merged ? it._wf : CB.weaponFlat(it); if (wf) o['Weapon damage'] = wf; return o;
  }
  const statName = (k) => k === 'Draw' ? 'Draw' : k === 'Regen' ? 'Regen' : k === 'Weapon damage' ? 'Damage per Attack hit' : k.replace('Elemental/Holy Damage:', '').replace('Resistance:', '') + (k.startsWith('Elemental') ? ' Damage' : k.startsWith('Resistance:') ? ' Resistance' : '');
  const statPct = (k) => /Chance|Damage|Resistance|Dexterity|Strength|Intelligence|Spirit|Defense|Lifesteal|Efficiency/.test(k) && k !== 'Weapon damage' ? '%' : '';
  function cmpTable(it, cur) {
    const a = itemStats(it), b = cur ? itemStats(cur) : {}, keys = [...new Set([...Object.keys(a), ...Object.keys(b)])];
    keys.sort((x, y) => Math.abs((a[y] || 0) - (b[y] || 0)) - Math.abs((a[x] || 0) - (b[x] || 0)));
    const rows = keys.map(k => { const d = (a[k] || 0) - (b[k] || 0), u = statPct(k); return `<tr><td>${esc(statName(k))}</td><td>${a[k] != null ? a[k] + u : '-'}</td><td>${b[k] != null ? b[k] + u : '-'}</td><td class="${d > 0 ? 'up' : d < 0 ? 'down' : 'muted'}">${d > 0 ? '+' : ''}${d ? d + u : '='}</td></tr>`; }).join('');
    const pd = itemPower(it) - (cur ? itemPower(cur) : 0); // each item's power over an empty slot, for the hero you're playing
    return `<table class="cmptab"><thead><tr><th>Stat</th><th>This</th><th>${cur ? 'Worn' : 'Empty'}</th><th>+ / -</th></tr></thead><tbody>${rows}<tr class="cmppow"><td>Item power</td><td>${itemPower(it)}</td><td>${cur ? itemPower(cur) : 0}</td><td class="${pd > 0 ? 'up' : pd < 0 ? 'down' : 'muted'}">${pd > 0 ? '+' : ''}${pd || '='}</td></tr></tbody></table>`;
  }
  function itemFromEl(el) {
    if (el.dataset.ilink) return typeof ILINK !== 'undefined' ? ILINK.get(el.dataset.ilink) : null;
    if (el.dataset.tip) { const t = TIPS.get(el.dataset.tip); return t && t.it; }
    if (el.dataset.chatlink) { const [i, j] = el.dataset.chatlink.split(':').map(Number), m = SOC.chat[i], l = m && m.items && m.items[j]; return l && l.it; } // an item linked in chat
    return null;
  }
  function showCmp() {
    const el = CMP.el, it = el && itemFromEl(el);
    if (!CMP.shift || !it || it.kind === 'card' || !it.slot) { cmpPop.hidden = true; return; }
    const gear = wornGear(), slots = CBHub.slotOptions(it), worn = slots.map(sl => ({ sl, cur: gear.find(g => g.slot === sl) }));
    if (worn.some(w => w.cur === it)) { cmpPop.hidden = true; return; } // hovering your own equipped item
    if (it.slot === 'Codex' && it.cls && it.cls !== hcls()) { cmpPop.innerHTML = `<p class="muted">${esc(it.cls)} only: your ${esc(hcls())} can't use it.</p>`; }
    else cmpPop.innerHTML = `<div class="cmphead"><b>Compared with what you wear</b> <span class="muted">(release Shift to close)</span></div>
      ${worn.map(w => { const off = /^2H/.test(it.hands || '') && w.sl === 'Weapon' ? gear.find(g => g.slot === 'Off-hand') : null; // a two-hander also replaces the off-hand
        const both = off ? { stats: Object.assign({}, itemStats(w.cur || {}), {}), imp2: {} } : null; if (both) { for (const [k, v] of Object.entries(itemStats(off))) both.stats[k] = (both.stats[k] || 0) + v; delete both.stats['Weapon damage']; both._wf = (CB.weaponFlat(w.cur || {}) || 0) + (CB.weaponFlat(off) || 0); }
        return `<div class="cmpblock"><div class="cmpcols"><div><div class="cmplab">This item</div>${itemHtml(it)}</div><div><div class="cmplab">Worn: ${esc(w.sl)}</div>${w.cur ? itemHtml(w.cur) : '<div class="item"><span class="muted">Nothing equipped</span></div>'}${off ? `<div class="cmplab" style="margin-top:4px">and your off-hand (a two-hander replaces it)</div>${itemHtml(off)}` : ''}</div></div>${cmpTable(it, both ? Object.assign(both, { _merged: true }) : w.cur)}</div>`; }).join('')}`;
    cmpPop.hidden = false; gtip.hidden = true;
    const w = cmpPop.offsetWidth, h = cmpPop.offsetHeight;
    let x = CMP.x + 18; if (x + w > innerWidth - 8) x = Math.max(8, CMP.x - w - 18);
    cmpPop.style.left = x + 'px'; cmpPop.style.top = Math.max(8, Math.min(innerHeight - h - 8, CMP.y - 40)) + 'px';
  }
  document.addEventListener('mousemove', (ev) => {
    CMP.x = ev.clientX; CMP.y = ev.clientY;
    const el = ev.target.closest && ev.target.closest('.item[data-ilink], [data-tip], [data-chatlink]');
    if (el !== CMP.el) { CMP.el = el; if (CMP.shift) showCmp(); }
    if (ev.shiftKey !== CMP.shift) { CMP.shift = ev.shiftKey; showCmp(); }
  });
  document.addEventListener('keydown', (ev) => { if (ev.key === 'Shift' && !CMP.shift) { CMP.shift = true; showCmp(); } });
  document.addEventListener('keyup', (ev) => { if (ev.key === 'Shift') { CMP.shift = false; cmpPop.hidden = true; } });
  window.addEventListener('blur', () => { CMP.shift = false; cmpPop.hidden = true; });

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

  // paperdoll: portrait in the middle, the 14 slots around it, stats underneath
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
      <div class="dmid"><canvas class="dportrait" width="220" height="250" data-cls="${cls}" data-rc="${esc(JSON.stringify(rcOf(ch)))}" data-gear="${esc(JSON.stringify((ch.gear || []).map(g => ({ slot: g.slot, name: g.name, arch: g.arch, rarity: g.rarity }))))}"></canvas>
        <div class="dname" style="color:${CC[cls]}">${esc(ch.name || cls)}</div><div class="muted" style="font-size:13px">${cls}${o.acct ? ' &middot; ' + esc(o.acct) : ''}</div>${o.own && typeof titlePicker === 'function' ? titlePicker(ch) : ch.titleText ? `<div class="dtitle">${esc(ch.titleText)}</div>` : ''}
        <div class="dpow"><span><b>${CBHub.powerLevel(ch)}</b>Power</span><span><b>${CBHub.gearScore(ch)}</b>Gear</span><span><b>${CB.deckLevel(ch.deck)}</b>Deck</span></div></div>
      <div class="dcol">${DOLL_R.map(slot).join('')}</div>
      <div class="dbot">${DOLL_B.map(slot).join('')}</div>
      <dl class="kv dstats"><dt>Max HP</dt><dd>${s.maxHp}</dd><dt>Mana</dt><dd ${s.manaOver ? `title="Gear adds at most +${CB.MANA_GEAR_CAP} max mana: ${s.manaOver} of yours is wasted"` : ''}>${s.maxMana}${s.manaOver ? ' <span class="down">(capped)</span>' : ''}, +${s.regen}/turn</dd><dt>Draw</dt><dd>${s.draw}/round</dd>
        <dt>Strength / Int</dt><dd>+${s.strength}% / +${s.intelligence}%</dd><dt>Dexterity</dt><dd>+${s.dexterity + s.defGain}% ${CLASSES[cls].defense}</dd><dt>Crit</dt><dd>${s.crit}% x${s.critMult.toFixed(2)}</dd>${s.weaponDmg ? `<dt>Weapon damage</dt><dd>+${s.weaponDmg} per Attack hit</dd>` : ''}
        <dt>Initiative</dt><dd>${s.init}</dd><dt>Resist</dt><dd>${res}</dd>${s.luck ? `<dt>Luck</dt><dd>${s.luck}</dd>` : ''}${ch.duels ? `<dt>Duels</dt><dd>${ch.duels.w} won, ${ch.duels.l} lost</dd>` : ''}</dl>
    </div>`;
  }
  window.addEventListener('forge-ready', () => paintPortraits()); // a Forge sprite finished drawing: repaint the dolls with it
  function paintPortraits(root) {
    (root || document).querySelectorAll('canvas.dportrait').forEach(cv => {
      const g = cv.getContext('2d'); g.clearRect(0, 0, cv.width, cv.height);
      const bg = g.createRadialGradient(110, 120, 10, 110, 130, 140); bg.addColorStop(0, '#3a2c1e'); bg.addColorStop(1, '#120e0b'); g.fillStyle = bg; g.fillRect(0, 0, cv.width, cv.height);
      let rc = {}; try { rc = JSON.parse(cv.dataset.rc); } catch (e) {}
      let gear = null; try { gear = JSON.parse(cv.dataset.gear || 'null'); } catch (e) {}
      drawChar(g, 110, 232, 'down', 0, Object.assign(palFor(cv.dataset.cls, rc), gear ? { forge: { cls: cv.dataset.cls, gear, who: 'doll' } } : {}), 4.2, 0);
    });
  }
  // own sheet: click a slot to see the item (and unequip) or, if empty, to equip something from the stash
  document.addEventListener('click', (ev) => {
    const d = ev.target.closest('[data-dslot]'); if (!d || !d.closest('#hpGear')) return;
    gtip.hidden = true;
    slotPicker(d.dataset.dslot);
  });
  // a gear slot: what's equipped, and every stash item that fits it, compared with your gear (equip or salvage right here)
  function slotPicker(sl) {
    const c = CBHub.char(profile, heroKey), it = c.gear.find(g => g.slot === sl);
    const fits = profile.stash.filter(x => x.kind !== 'card' && CBHub.slotOptions(x).includes(sl) && !(x.slot === 'Codex' && x.cls && x.cls !== hcls())).sort((a, b) => (b.ilvl || 0) - (a.ilvl || 0));
    const choose = fits.map(x => itemHtml(x, `<div class="acts">${upBadge(x, c.gear)}<button class="btn" data-eq="${x.id}">Equip</button><button class="btn" data-salv="${x.id}" title="Scrap it for gold right now">Salvage +${CBHub.salvageValue(x)}g</button></div>`)).join('');
    modal(`<h2>${sl}</h2>${it ? itemHtml(it, `<div class="acts"><button class="btn" id="mUneq">Unequip to stash</button></div>`) : '<p class="muted">Nothing equipped.</p>'}
      <h3 style="font-size:18px;color:var(--accent);margin-top:10px">From your stash (${fits.length})</h3><div class="list" style="max-height:340px">${choose || '<span class="muted">Nothing in the stash fits this slot.</span>'}</div>
      <div class="row"><button class="btn primary" id="mClose">Close</button></div>`);
    $('mClose').onclick = closeModal;
    if ($('mUneq')) $('mUneq').onclick = () => { if (!CBHub.unequip(profile, heroKey, sl)) return toast(CBHub.arenaLock(profile, heroKey) || 'Stash is full.'); save(); closeModal(); renderHub(); };
    for (const b of $('modalBox').querySelectorAll('[data-eq]')) b.onclick = () => { const r = CBHub.equip(profile, heroKey, b.dataset.eq, sl); if (!r.ok) return toast(r.why); save(); closeModal(); renderHub(); };
    for (const b of $('modalBox').querySelectorAll('[data-salv]')) b.onclick = () => { const sc = $('modalBox').querySelector('.list') ? $('modalBox').querySelector('.list').scrollTop : 0; const g = CBHub.salvage(profile, b.dataset.salv); if (!g) return; save(); renderHub(); slotPicker(sl); const l = $('modalBox').querySelector('.list'); if (l) l.scrollTop = sc; sysChat(`Salvaged for ${g} gold.`); };
  }

  // ---------- inspecting another player (they answer with their hero's gear and deck)
  const INS = { waiting: null };
  function inspect(uid) {
    if (!socOn()) return;
    INS.waiting = uid; netSend('insp-req', { to: uid });
    modal(`<h2>Inspecting ${esc(nameOfUid(uid))}...</h2><p class="muted">Asking their game for their hero.</p><div class="row"><button class="btn primary" id="mClose">Close</button></div>`); $('mClose').onclick = closeModal;
    setTimeout(() => { if (INS.waiting === uid) { INS.waiting = null; if (!$('modal').hidden && /Inspecting/.test($('modalBox').innerText)) toast(`${nameOfUid(uid)} didn't answer. They may have just gone offline.`); } }, 6000);
  }
  function inspectCard() { const c = profile.chars[heroKey]; if (!c) return null; return { name: c.name, cls: c.cls, gear: c.gear.map(g => { const x = Object.assign({}, g); delete x.id; return x; }), deck: c.deck.map(k => ({ key: k.key, rank: k.rank || 0 })), runs: c.runs, best: c.best, bossKills: c.bossKills, duels: c.duels || null, titleText: CBHub.titleOf(c, profile), acct: supaUser ? acctName(supaUser) : '' }; }
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
    if (hcBlock(uid, 'trade')) return;
    const c = profile.chars[heroKey]; netSend('tr-ask', { to: uid, name: c ? c.name : acctName(supaUser), hc: myHc() });
    TR.asked = uid; sysChat(`Trade request sent to ${nameOfUid(uid)}.`);
  }
  function answerTrade(from, ok) {
    const inv = TR.inv.find(i => i.from === from); TR.inv = TR.inv.filter(i => i.from !== from); renderSocial();
    if (ok && inv && inv.hc != null && !!inv.hc !== myHc()) { toast(inv.hc ? `${inv.name} is playing a Hardcore hero. Hardcore heroes can only trade with other Hardcore heroes.` : 'Your hero is Hardcore: Hardcore heroes can only trade with other Hardcore heroes.'); ok = false; }
    if (ok && (run || cb || NET.s || TR.s)) { toast('You can only trade from Emberwatch, one trade at a time.'); ok = false; }
    if (ok && hcBlock(from, 'trade')) ok = false;
    const n = Math.random().toString(36).slice(2, 10); // each trade gets its own id on the server's ledger
    netSend('tr-ans', { to: from, ok, n });
    if (ok) openTrade(from, n);
  }
  function openTrade(uid, n) { TR.s = { tid: [SOC.me, uid].sort().join('-') + '-' + (n || ''), with: uid, name: nameOfUid(uid), mine: [], myGold: 0, theirs: [], theirGold: 0, myAcc: null, theirAcc: null }; renderTrade(); }
  function sendOffer() { const S = TR.s; S.myAcc = null; S.theirAcc = null; netSend('tr-offer', { to: S.with, items: myOffer(), gold: S.myGold }); renderTrade(); }
  function tradeAccept() {
    const S = TR.s; if (!S) return;
    const room = CBHub.STASH_MAX - (profile.stash.length - myOffer().length);
    if (S.theirs.length > room) { toast(`Your stash can't hold ${S.theirs.length} more item${S.theirs.length === 1 ? '' : 's'}. Make room first.`); return; }
    S.myAcc = tradeHash(); netSend('tr-acc', { to: S.with, hash: S.myAcc });
    if (S.theirAcc === S.myAcc) doTrade(); else renderTrade();
  }
  // Nov 2: both games first register the trade with the server, which checks each side owns what it hands over (in its saved
  // stash) and writes it to the ledger. Only when the server says both sides agreed does either game move anything.
  async function doTrade() {
    const S = TR.s; if (!S || S.done) return; S.done = true;
    const mine = myOffer(), ids = new Set(mine.map(x => x.id));
    renderTrade(); const st = document.querySelector('#modalBox .trst'); if (st) st.textContent = 'Confirming the trade with the server...';
    await savedNow();
    let res = 'error';
    for (let i = 0; i < 16; i++) {
      res = await trustRpc('trade_submit', { p_tid: S.tid, p_partner: S.with, p_give: mine, p_gold: S.myGold || 0, p_get: S.theirs, p_get_gold: S.theirGold || 0 });
      if (res !== 'waiting') break; await new Promise(r => setTimeout(r, 1200));
      if (TR.s !== S) break; // cancelled while waiting
    }
    if (res === 'waiting') res = await trustRpc('trade_cancel', { p_tid: S.tid }); // gave up: take our side back, unless the other game confirmed just now
    if (res !== 'done' && res !== 'skip') {
      const why = { cancelled: `${S.name}'s game didn't confirm in time`, 'not saved': 'your items or gold haven\'t reached your online save yet; try again in a moment', blocked: 'one of these accounts is under review', mismatch: 'the two offers didn\'t match', 'not enough gold': 'not enough gold in your online save' }[res] || 'the server could not be reached';
      if (TR.s === S) { netSend('tr-cancel', { to: S.with }); TR.s = null; closeModal(); toast(`Trade cancelled: ${why}. Nothing changed hands.`); } return;
    }
    if (TR.s !== S && res === 'skip') return;
    profile.stash = profile.stash.filter(x => !ids.has(x.id));
    profile.gold = Math.max(0, profile.gold - (S.myGold || 0)) + (S.theirGold || 0);
    for (const it of S.theirs) profile.stash.unshift(Object.assign({}, it, { id: 'g' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8) }));
    save(); if (TR.s === S) { TR.s = null; closeModal(); } renderHub();
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
      case 'tr-ask': { if (TR.inv.some(i => i.from === p.from)) return; TR.inv.push({ from: p.from, name: p.name, hc: p.hc }); sysChat(`${p.name} wants to trade with you.`); renderSocial(); return; }
      case 'tr-ans': { if (TR.asked !== p.from) return; TR.asked = null; if (!p.ok) { sysChat(`${nameOfUid(p.from)} declined the trade.`); return; } if (TR.s || run || cb) { netSend('tr-cancel', { to: p.from }); return; } openTrade(p.from, p.n); return; }
      case 'tr-offer': { const S = TR.s; if (!S || S.with !== p.from) return; S.theirs = (p.items || []).slice(0, 12); S.theirGold = Math.max(0, Math.floor(p.gold || 0)); S.myAcc = null; S.theirAcc = null; renderTrade(); return; }
      case 'tr-acc': { const S = TR.s; if (!S || S.with !== p.from) return; S.theirAcc = p.hash; if (S.myAcc && S.myAcc === p.hash) doTrade(); else renderTrade(); return; }
      case 'tr-cancel': { if (TR.s && TR.s.with === p.from && !TR.s.done) { TR.s = null; closeModal(); sysChat(`${nameOfUid(p.from)} cancelled the trade.`); } TR.inv = TR.inv.filter(i => i.from !== p.from); renderSocial(); return; }
    }
  }

  // ---------- clicking another player in town
  function playerMenu(uid) {
    const st = SOC.online.get(uid) || {}, o = SOC.others.get(uid) || {};
    const inParty = SOC.party && SOC.party.members.some(m => m.uid === uid), mineParty = SOC.party && SOC.party.members.some(m => m.uid === SOC.me);
    $('talk').innerHTML = `<b style="color:${CC[o.cls || st.cls] || 'var(--text)'}">${esc(o.name || st.name || 'Player')}</b><p>${esc(o.cls || st.cls || '')} &middot; ${placeText(st)}</p>
      <div class="row">${st.shop ? `<button class="btn primary" data-bzview="${uid}">Browse shop</button>` : ''}<button class="btn ${st.shop ? '' : 'primary'}" data-whisper="${uid}">Message</button><button class="btn" data-insp="${uid}">Inspect</button><button class="btn" data-trade="${uid}">Trade</button>${canGuildInvite(uid) ? `<button class="btn" data-ginv="${uid}">Invite to guild</button>` : ''}${!inParty && (!SOC.party || SOC.party.leader === SOC.me) ? `<button class="btn" id="pmInv">Invite to party</button>` : ''}${inParty && mineParty ? `<button class="btn" id="pmDuel">Duel</button>` : ''}<button class="btn" id="tBye">Close</button></div>`;
    $('talk').hidden = false; updatePrompt();
    $('tBye').onclick = closeTalk;
    if ($('pmInv')) $('pmInv').onclick = () => { closeTalk(); invite(uid); };
    if ($('pmDuel')) $('pmDuel').onclick = () => { closeTalk(); challenge(uid); };
  }
