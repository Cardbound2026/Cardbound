  // ---------- the Codex (Archivist Mora): every card, every enemy with its deck and loot, every gear base and what it can roll
  const CX = { own: 'All', map: null, tab: 'cards', cls: 'All', rar: 'All', built: 'All', tier: 'All', slot: 'All', q: '' };
  const TIER_NAME = t => t === 'Elite' || t === 'Boss' ? t : 'Tier ' + t;
  function cxChips(key, vals, label) { return `<div class="cxchips" role="group" aria-label="${label}">${vals.map(v => `<button class="cxchip ${CX[key] === v ? 'on' : ''}" data-cx="${key}" data-v="${esc(v)}">${esc(v)}</button>`).join('')}</div>`; }
  function ownedCounts() { const c = profile.chars[heroCls], n = {}; if (c) for (const k of [...c.deck, ...c.cards]) n[k.key] = (n[k.key] || 0) + 1; return n; }
  function codexCards() {
    const own = ownedCounts(), q = CX.q.toLowerCase();
    const all = Object.entries(CARDS).filter(([k, d]) => d.cls && d.rarity !== 'Status' && d.rarity !== 'Token');
    const list = all.filter(([k, d]) => (CX.cls === 'All' || d.cls === CX.cls) && (CX.rar === 'All' || d.rarity === CX.rar) && (CX.built === 'All' || (CX.built === 'Playable') === !d.designOnly) && (CX.own === 'All' || (CX.own === 'Owned') === !!own[k]) && (!q || (d.name + ' ' + d.text + ' ' + d.type + ' ' + (d.id || '')).toLowerCase().includes(q)))
      .sort((a, b) => Object.keys(CLASSES).indexOf(a[1].cls) - Object.keys(CLASSES).indexOf(b[1].cls) || RAR_ORDER[b[1].rarity] - RAR_ORDER[a[1].rarity] || a[1].name.localeCompare(b[1].name));
    const drops = CB.CARD_DROPS;
    const nBuilt = all.filter(([k, d]) => !d.designOnly).length;
    return `${cxChips('cls', ['All', ...Object.keys(CLASSES)], 'Class')}${cxChips('rar', ['All', 'White', 'Green', 'Blue', 'Gold'], 'Rarity')}${cxChips('own', ['All', 'Owned', 'Not owned'], 'Owned')}
      <p class="savenote">${list.length} of ${all.length} cards. <b>${nBuilt} are playable</b>; the other ${all.length - nBuilt} are from the card design and are marked <i>Not built yet</i>: they don't drop until their mechanics are added to the game. <b>How cards drop:</b> each kill can drop a card for <i>your</i> class: tier 1 ${drops[1].chance}%, tier 2 ${drops[2].chance}%, tier 3 ${drops[3].chance}% (mostly White, some Green and Blue); elites always drop one Green or better (${drops.Elite.w.Gold}% Gold); the Warlord drops two Blue or Gold. Luck raises every chance. Cards marked <b>owned</b> are in ${esc(profile.chars[heroCls] ? profile.chars[heroCls].name : 'your hero')}'s deck or collection.</p>
      <div class="pilegrid cxgrid">${list.map(([k, d]) => `<div class="pilecard ${d.designOnly ? 'design' : ''}" data-cxcard="${k}" style="cursor:pointer" title="${esc((d.id || '') + (d.designOnly ? ' (not built yet)' : ''))} - click for ranks and drop sources">${cardBox(d, 150) || rowHtml(1, d)}${d.designOnly ? '<span class="dstamp">Not built yet</span>' : ''}${own[k] ? `<span class="pilecount" title="In your deck or collection">owned${own[k] > 1 ? ' x' + own[k] : ''}</span>` : ''}</div>`).join('') || '<span class="muted">No cards match.</span>'}</div>`;
  }
  // map filter: defaults to the map picked at the Wagon
  const cxMapName = () => CX.map || DATA.maps[curMap()].name; // 'All' means every map
  const cxMapKey = () => { const n = cxMapName(); const m = Object.values(DATA.maps).find(m => m.name === n); return m ? m.key : null; };
  const cxMapChips = () => { const was = CX.map; CX.map = cxMapName(); const h = cxChips('map', ['All', ...Object.values(DATA.maps).map(m => m.name)], 'Map'); CX.map = was; return h; };
  function codexEnemies() {
    const q = CX.q.toLowerCase(), G = DATA.gear, mk = cxMapKey(), M = mk && DATA.maps[mk];
    const list = Object.entries(DATA.enemies).filter(([k, e]) => e.map !== 'town' && (!mk || (e.map || 'physical') === mk) && (CX.tier === 'All' || TIER_NAME(e.tier) === CX.tier) && (!q || (e.name + ' ' + e.creature + ' ' + (e.desc || '') + ' ' + e.deck.map(c => c.name).join(' ')).toLowerCase().includes(q)));
    const rows = (e) => e.deck.map(c => `<div class="cardrow" style="--rc:${c.phase2 ? 'var(--hp)' : 'var(--line)'}"><span class="n">${c.n}x</span><b>${esc(c.name)}${c.phase2 ? ' <span class="muted">(phase 2)</span>' : ''}</b><span class="cst">${c.cost} mana</span><span class="tx">${esc(c.text)}${c.dtype !== 'Physical' && /amage/.test(c.text) ? ' [' + c.dtype + ']' : ''}</span></div>`).join('');
    return `${cxMapChips()}${cxChips('tier', ['All', 'Tier 1', 'Tier 2', 'Tier 3', 'Elite', 'Boss'], 'Tier')}
      <p class="savenote">${list.length} enemies ${M ? `on Map ${M.num}: ${esc(M.name)} (${M.element}${M.dmgScale ? `, enemy damage x${M.dmgScale}` : ''}; its gear rolls ${M.dropResist} Resistance)` : 'across all six maps'}. Stats at map +0: each map level multiplies enemy HP by 1.5 and damage by 1.3. Rows 1 to 4 are tier 1, 5 to 9 tier 2, 10 to 14 tier 3; elites appear from row 5.</p>
      ${list.map(([k, e]) => { const t = G.drops[e.tier], cd = CB.CARD_DROPS[e.tier];
        return `<details class="cxenemy"><summary><b>${esc(e.name)}</b> <span class="muted">${TIER_NAME(e.tier)} &middot; ${e.hp} HP &middot; ${esc(e.creature)} &middot; ${e.type}, weak to ${e.weak}</span></summary>
        <p>${esc(e.desc || '')}</p><p class="muted">${esc(e.arch || '')}. Draws ${e.draw} a round${e.draw2 ? ` (${e.draw2} in phase 2)` : ''}, ${e.maxMana} max mana, +${e.regen} per turn.</p>
        <h4>Deck (${e.deck.reduce((s, x) => s + x.n, 0)} cards)</h4>${enemyGrid(e.deck.map(c => ({ c, n: c.n, tag: c.phase2 ? 'phase 2' : '' })), k, 140)}
        <div><h4>Loot</h4><p><b>Gold:</b> ${e.gold[0]} to ${e.gold[1]} per kill.</p>
          ${t ? `<p><b>${t.rolls} gear rolls per kill</b>, each: ${['White', 'Green', 'Blue', 'Purple (Epic)'].filter(r => t.chance[r]).map(r => `<span style="color:${RC[r]}">${r === 'Purple (Epic)' ? 'Purple' : r} ${t.chance[r]}%</span>`).join(' &middot; ')}</p>
          <p><b>Bases:</b> ${e.pool.map(b => `<button class="pilebtn" data-cxbase="${esc(b)}">${esc(b)}</button>`).join(' ')}</p>` : ''}
          ${cd ? `<p><b>Cards:</b> ${cd.n ? cd.n + ' guaranteed' : cd.chance + '% chance'} for your class (${Object.entries(cd.w).filter(x => x[1]).map(([r, w]) => `${r} ${w}%`).join(', ')}).</p>` : ''}
          ${(e.loot || []).length ? `<p class="muted"><b>Named drops</b> (each kill rolls these; each hero only gets their own class's cards):</p><div class="cardlist">${e.loot.map(x => `<div class="cardrow" style="--rc:${RC[x.rarity] || 'var(--line)'}"><span class="n">${x.pct}%</span><b>${esc(x.item)} <span class="muted">${esc(x.cls)} ${esc(x.rarity)}${x.type === 'Codex' ? ' codex' : ''}</span></b><span class="cst"></span><span class="tx">${esc(x.note || '')}</span></div>`).join('')}</div>` : ''}
        </div></details>`; }).join('') || '<p class="muted">No enemies match.</p>'}`;
  }
  const statRange = (s, mult) => { const S = DATA.gear.stats[s]; if (!S) return ''; return `${Math.max(1, Math.round(S.min * (mult || 1)))}-${Math.max(1, Math.round(S.max * (mult || 1)))}${S.unit}`; };
  function implicitText(A, b) {
    const G = DATA.gear, two = A.hands && A.hands.startsWith('2H') ? G.twoHand : 1;
    if (!A.imp2) return '';
    if (A.imp2 === 'Draw / regen pool') return 'Card draw 3-5 plus Mana Regen: a pool of 6 (White) to 9 (Purple) points split between them, each point not spent on draw is +10 regen';
    if (A.imp2.startsWith('Elemental damage')) return `+${statRange('Elemental/Holy Damage', two)} damage of one random element`;
    if (A.imp2 === 'Elemental/Holy Damage') return /Mace|Warhammer/.test(b.arch) ? `+${statRange('Elemental/Holy Damage', two)} Holy damage` : `+${statRange('Elemental/Holy Damage', two)} damage of one random element`;
    return `+${statRange(A.imp2, two)} ${A.imp2}`;
  }
  function codexGear() {
    const G = DATA.gear, q = CX.q.toLowerCase();
    const slotOf = (A) => /Shield|Focus|Codex/.test(A.slot) ? 'Off-hand' : /Axe|Sword|Dagger|Mace|Wand|Maul|Warhammer|Staff/.test(A.slot) ? 'Weapon' : A.slot;
    const SLOTN = ['Weapon', 'Off-hand', 'Helm', 'Amulet', 'Cloak', 'Chest', 'Bracers', 'Gloves', 'Belt', 'Pants', 'Boots', 'Ring'];
    const droppers = {}; for (const e of Object.values(DATA.enemies)) for (const b of e.pool || []) (droppers[b] = droppers[b] || []).push(e.name);
    const mk = cxMapKey(), M = mk && DATA.maps[mk];
    const bases = G.bases.map(b => ({ b, A: G.arche[b.arch] })).filter(x => x.A).filter(({ b }) => !mk || (b.map || 'physical') === mk).filter(({ b, A }) => (CX.slot === 'All' || slotOf(A) === CX.slot) && (!q || (b.name + ' ' + b.label + ' ' + b.arch + ' ' + (A.imp2 || '') + ' ' + Object.keys(A.weights).join(' ')).toLowerCase().includes(q)))
      .sort((x, y) => SLOTN.indexOf(slotOf(x.A)) - SLOTN.indexOf(slotOf(y.A)) || x.b.name.localeCompare(y.b.name));
    const affixOdds = (A, epic) => { const w = Object.entries(A.weights).filter(([s]) => epic || s !== 'Efficiency'); const tot = w.reduce((s, x) => s + x[1], 0) / (1 - G.resChance); const out = w.map(([s, x]) => [s, x / tot * 100]); const r = out.find(x => x[0] === 'Resistance'); if (r) r[1] += G.resChance * 100; else out.push(['Resistance', G.resChance * 100]); return out.sort((a, b) => b[1] - a[1]); };
    const sel = CX.base;
    return `${cxMapChips()}${cxChips('slot', ['All', ...SLOTN], 'Slot')}
      <div class="cxrules">
        <div><h4>Rarity</h4>${G.rarity.map(r => `<div style="color:${RC[r.name]}">${r.name === 'Purple (Epic)' ? 'Purple' : r.name}: ${r.affixes} affix${r.affixes > 1 ? 'es' : ''}, stats x${r.mult}</div>`).join('')}</div>
        <div><h4>Every item</h4><p>An implicit <b>+${statRange('Map resistance (implicit)')} ${M ? M.dropResist : 'map'} Resistance</b> (${M ? 'Map ' + M.num + ' gear rolls the resistance the next map hits with' : 'each map rolls the next map\'s element'}), plus its base's implicit below. Each map level multiplies every roll by ${G.levelGrowth}; two-handed weapons roll x${G.twoHand}. Affixes pick a stat by the weights shown (the same stat can roll twice and stacks).</p></div>
        <div><h4>Affix ranges (White, +0)</h4><div class="cxranges">${Object.keys(G.stats).filter(s => !/implicit/.test(s)).map(s => `<span>${esc(s)} <b>${statRange(s)}</b></span>`).join('')}</div></div>
      </div>
      <p class="savenote">${bases.length} item bases${M ? ` on ${esc(M.name)}` : ''}.${M ? '' : ' Bases come from every map; each map\'s versions roll that map\'s resistance.'}</p>
      <div class="cxbases">${bases.map(({ b, A }) => { const imp = implicitText(A, b); return `<details class="cxenemy" ${sel === b.name ? 'open id="cxSel"' : ''}><summary><b>${esc(b.name)}</b> <span class="muted">${esc(b.label)} &middot; ${slotOf(A)}${A.hands ? ' &middot; ' + esc(A.hands) : ''}${A.type && A.type !== 'None' ? ' &middot; ' + esc(A.type) : ''}</span>${imp ? `<span class="cximp">${esc(imp)}</span>` : ''}</summary>
        <p><b>Implicit:</b> ${imp ? esc(imp) : `none beyond the ${esc(DATA.maps[b.map || 'physical'].dropResist)} Resistance every item from ${esc(DATA.maps[b.map || 'physical'].name)} has`}.</p>
        <p><b>Affix odds</b> (per affix): ${affixOdds(A, false).map(([s, p]) => `${esc(s)} ${p.toFixed(p < 10 ? 1 : 0)}%`).join(' &middot; ')}${A.weights.Efficiency ? ' &middot; <i>Efficiency only on Purples</i>' : ''}</p>
        <p class="muted"><b>Dropped by:</b> ${(droppers[b.name] || []).map(esc).join(', ') || 'merchants only'}</p></details>`; }).join('') || '<p class="muted">No bases match.</p>'}</div>`;
  }
  // ---------- card detail: rank slider (+0 to +10) and where it drops
  function cardDetail(key) {
    const d = CARDS[key]; if (!d) return;
    const pool = d.cls && !d.designOnly ? CB.cardPool(d.cls) : [], same = pool.filter(k => CARDS[k].rarity === d.rarity).length;
    const rand = same ? Object.entries(CB.CARD_DROPS).map(([t, x]) => { const tot = Object.values(x.w).reduce((a, b) => a + b, 0), pr = (x.w[d.rarity] || 0) / tot; const per = (x.chance / 100) * pr / same * (x.n || 1) * 100; return [TIER_NAME(t), per]; }).filter(x => x[1] > 0) : [];
    const named = [];
    for (const [ek, e] of Object.entries(DATA.enemies)) for (const x of e.loot || []) if (x.type === 'Card' && x.item === d.name && x.cls === d.cls) named.push({ e, pct: x.pct, map: DATA.maps[e.map || 'physical'] });
    named.sort((a, b) => a.map.num - b.map.num || b.pct - a.pct);
    const fmt = (v) => v >= 1 ? v.toFixed(1) + '%' : v >= 0.1 ? v.toFixed(2) + '%' : v.toFixed(3) + '%';
    const costs = (r) => { let xp = 0, gold = 0; for (let i = 0; i < r; i++) { const c = CBHub.rankCost({ key, rank: i }); xp += c.xp; gold += c.gold; } return { xp, gold }; };
    modal2(`<h2>${esc(d.name)} <span class="muted" style="font-size:15px">${esc(d.cls || '')} &middot; <span style="color:${RC[d.rarity] || 'inherit'}">${d.rarity}</span> &middot; ${esc(d.type || '')}</span></h2>
      <div class="cxdetail">
        <div class="cxrank">
          <div id="cxdCard"></div>
          <label for="cxdR" class="cxdlab">Rank <b id="cxdRv">+0</b></label>
          <input type="range" id="cxdR" min="0" max="${CB.MAX_RANK}" step="1" value="0">
          <div class="cxdticks">${Array.from({ length: CB.MAX_RANK + 1 }, (_, i) => `<span>${i}</span>`).join('')}</div>
          <p class="muted" id="cxdCost" style="font-size:12.5px;margin:6px 0 0"></p>
        </div>
        <div class="cxsrc">
          ${d.designOnly ? '<p class="down">Not built yet: this card does not drop until its mechanics are in the game.</p>' : ''}
          <h4>Named drops</h4>
          ${named.length ? `<table class="cxdt"><thead><tr><th>Enemy</th><th>Map</th><th>Tier</th><th>Chance</th></tr></thead><tbody>${named.map(x => `<tr><td><b>${esc(x.e.name)}</b></td><td><span style="color:${ELC[x.map.element]}">${x.map.num}. ${esc(x.map.name)}</span></td><td>${TIER_NAME(x.e.tier)}</td><td>${x.pct}%</td></tr>`).join('')}</tbody></table><p class="muted" style="font-size:12px">Per kill, for a ${esc(d.cls)} in the party. Luck raises it.</p>` : '<p class="muted">No enemy has this card on its named loot list.</p>'}
          <h4>Random card drops (any map)</h4>
          ${rand.length ? `<p class="muted" style="font-size:12.5px;margin:0 0 4px">Every kill can also roll a random ${esc(d.cls)} card of its rarity. Chance this exact card drops from one kill:</p><div class="cxdrand">${rand.map(([t, v]) => `<span>${t} <b>${fmt(v)}</b></span>`).join('')}</div><p class="muted" style="font-size:12px">${same} ${d.rarity} ${esc(d.cls)} cards share that roll.</p>` : `<p class="muted">${d.designOnly ? 'None yet.' : `${d.rarity} cards don't come from random drops.`}</p>`}
        </div>
      </div>
      <div class="row"><button class="btn" id="mClose">Close</button></div>`);
    const draw = () => { const r = +$('cxdR').value; $('cxdRv').textContent = '+' + r; $('cxdCard').innerHTML = cardBox(CB.rankedCard(key, r), 240) || rowHtml(1, d); fitCards($('cxdCard'));
      const c = costs(r); $('cxdCost').textContent = r ? `Reaching +${r} from +0 takes ${c.xp} XP and ${c.gold} gold (feed spare cards at the Scribe).` : 'Drag the slider to see each rank.'; };
    $('modalBox').classList.add('wide'); $('cxdR').oninput = draw; draw();
    $('mClose').onclick = closeModal;
  }
  function renderCodex() {
    const el = $('hpCodex'); if (!el) return;
    el.innerHTML = `<div class="cxtop"><div class="tabs cxtabs" role="tablist">${[['cards', 'Cards'], ['enemies', 'Enemies & loot'], ['gear', 'Gear bases']].map(([k, l]) => `<button role="tab" aria-selected="${CX.tab === k}" data-cxtab="${k}">${l}</button>`).join('')}</div>
      <input id="cxQ" type="search" placeholder="Search ${CX.tab === 'cards' ? 'cards' : CX.tab === 'enemies' ? 'enemies and their cards' : 'gear and stats'}..." value="${esc(CX.q)}" autocomplete="off"></div>
      <div id="cxBody">${CX.tab === 'cards' ? codexCards() : CX.tab === 'enemies' ? codexEnemies() : codexGear()}</div>`;
    fitCards(el);
    const s = $('cxSel'); if (s) { s.scrollIntoView({ block: 'center' }); CX.base = null; }
  }
  $('hpCodex').addEventListener('click', (ev) => {
    const cc = ev.target.closest('[data-cxcard]'); if (cc) return cardDetail(cc.dataset.cxcard);
    const t = ev.target.closest('[data-cxtab],[data-cx],[data-cxbase]'); if (!t) return;
    if (t.dataset.cxtab) { CX.tab = t.dataset.cxtab; CX.q = ''; }
    else if (t.dataset.cx) CX[t.dataset.cx] = t.dataset.v;
    else if (t.dataset.cxbase) { CX.tab = 'gear'; CX.slot = 'All'; const bb = DATA.gear.bases.find(x => x.name === t.dataset.cxbase); if (bb) CX.map = DATA.maps[bb.map || 'physical'].name; CX.q = ''; CX.base = t.dataset.cxbase; }
    renderCodex();
  });
  $('hpCodex').addEventListener('toggle', (ev) => { if (ev.target.open) fitCards(ev.target); }, true);
  $('hpCodex').addEventListener('input', (ev) => { if (ev.target.id !== 'cxQ') return; CX.q = ev.target.value; const pos = ev.target.selectionStart; renderCodex(); const i = $('cxQ'); i.focus(); i.setSelectionRange(pos, pos); });
