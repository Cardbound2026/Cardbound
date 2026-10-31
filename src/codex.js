  // ---------- the Codex (Archivist Mora): every card, every enemy with its deck and loot, every gear base and what it can roll
  const CX = { tab: 'cards', cls: 'All', rar: 'All', tier: 'All', slot: 'All', q: '' };
  const TIER_NAME = t => t === 'Elite' || t === 'Boss' ? t : 'Tier ' + t;
  function cxChips(key, vals, label) { return `<div class="cxchips" role="group" aria-label="${label}">${vals.map(v => `<button class="cxchip ${CX[key] === v ? 'on' : ''}" data-cx="${key}" data-v="${esc(v)}">${esc(v)}</button>`).join('')}</div>`; }
  function ownedCounts() { const c = profile.chars[heroCls], n = {}; if (c) for (const k of [...c.deck, ...c.cards]) n[k.key] = (n[k.key] || 0) + 1; return n; }
  function codexCards() {
    const own = ownedCounts(), q = CX.q.toLowerCase();
    const all = Object.entries(CARDS).filter(([k, d]) => d.cls && d.rarity !== 'Status' && d.rarity !== 'Token');
    const list = all.filter(([k, d]) => (CX.cls === 'All' || d.cls === CX.cls) && (CX.rar === 'All' || d.rarity === CX.rar) && (!q || (d.name + ' ' + d.text + ' ' + d.type).toLowerCase().includes(q)))
      .sort((a, b) => Object.keys(CLASSES).indexOf(a[1].cls) - Object.keys(CLASSES).indexOf(b[1].cls) || RAR_ORDER[b[1].rarity] - RAR_ORDER[a[1].rarity] || a[1].name.localeCompare(b[1].name));
    const drops = CB.CARD_DROPS;
    return `${cxChips('cls', ['All', ...Object.keys(CLASSES)], 'Class')}${cxChips('rar', ['All', 'White', 'Green', 'Blue', 'Gold'], 'Rarity')}
      <p class="savenote">${list.length} of ${all.length} cards. <b>How cards drop:</b> each kill can drop a card for <i>your</i> class: tier 1 ${drops[1].chance}%, tier 2 ${drops[2].chance}%, tier 3 ${drops[3].chance}% (mostly White, some Green and Blue); elites always drop one Green or better (${drops.Elite.w.Gold}% Gold); the Warlord drops two Blue or Gold. Luck raises every chance. Cards marked <b>owned</b> are in ${esc(profile.chars[heroCls] ? profile.chars[heroCls].name : 'your hero')}'s deck or collection.</p>
      <div class="pilegrid cxgrid">${list.map(([k, d]) => `<div class="pilecard">${cardBox(d, 150) || rowHtml(1, d)}${own[k] ? `<span class="pilecount" title="In your deck or collection">owned${own[k] > 1 ? ' x' + own[k] : ''}</span>` : ''}</div>`).join('') || '<span class="muted">No cards match.</span>'}</div>`;
  }
  function codexEnemies() {
    const q = CX.q.toLowerCase(), G = DATA.gear;
    const list = Object.entries(DATA.enemies).filter(([k, e]) => (CX.tier === 'All' || TIER_NAME(e.tier) === CX.tier) && (!q || (e.name + ' ' + e.creature + ' ' + (e.desc || '') + ' ' + e.deck.map(c => c.name).join(' ')).toLowerCase().includes(q)));
    const rows = (e) => e.deck.map(c => `<div class="cardrow" style="--rc:${c.phase2 ? 'var(--hp)' : 'var(--line)'}"><span class="n">${c.n}x</span><b>${esc(c.name)}${c.phase2 ? ' <span class="muted">(phase 2)</span>' : ''}</b><span class="cst">${c.cost} mana</span><span class="tx">${esc(c.text)}${c.dtype !== 'Physical' && /amage/.test(c.text) ? ' [' + c.dtype + ']' : ''}</span></div>`).join('');
    return `${cxChips('tier', ['All', 'Tier 1', 'Tier 2', 'Tier 3', 'Elite', 'Boss'], 'Tier')}
      <p class="savenote">${list.length} enemies on Map 1: The Broken March. Stats at map +0: each map level multiplies enemy HP by 1.5 and damage by 1.3. Rows 1 to 4 are tier 1, 5 to 9 tier 2, 10 to 14 tier 3; elites appear from row 5.</p>
      ${list.map(([k, e]) => { const t = G.drops[e.tier], cd = CB.CARD_DROPS[e.tier];
        return `<details class="cxenemy"><summary><b>${esc(e.name)}</b> <span class="muted">${TIER_NAME(e.tier)} &middot; ${e.hp} HP &middot; ${esc(e.creature)} &middot; ${e.type}, weak to ${e.weak}</span></summary>
        <p>${esc(e.desc || '')}</p><p class="muted">${esc(e.arch || '')}. Draws ${e.draw} a round${e.draw2 ? ` (${e.draw2} in phase 2)` : ''}, ${e.maxMana} max mana, +${e.regen} per turn.</p>
        <h4>Deck (${e.deck.reduce((s, x) => s + x.n, 0)} cards)</h4>${enemyGrid(e.deck.map(c => ({ c, n: c.n, tag: c.phase2 ? 'phase 2' : '' })), k, 140)}
        <div><h4>Loot</h4><p><b>Gold:</b> ${e.gold[0]} to ${e.gold[1]} per kill.</p>
          ${t ? `<p><b>${t.rolls} gear rolls per kill</b>, each: ${['White', 'Green', 'Blue', 'Purple (Epic)'].filter(r => t.chance[r]).map(r => `<span style="color:${RC[r]}">${r === 'Purple (Epic)' ? 'Purple' : r} ${t.chance[r]}%</span>`).join(' &middot; ')}</p>
          <p><b>Bases:</b> ${e.pool.map(b => `<button class="pilebtn" data-cxbase="${esc(b)}">${esc(b)}</button>`).join(' ')}</p>` : ''}
          ${cd ? `<p><b>Cards:</b> ${cd.n ? cd.n + ' guaranteed' : cd.chance + '% chance'} for your class (${Object.entries(cd.w).filter(x => x[1]).map(([r, w]) => `${r} ${w}%`).join(', ')}).</p>` : ''}
          ${(e.loot || []).length ? `<p class="muted"><b>Named drops from the Map 1 design</b> (arrive as the cards are built):</p><div class="cardlist">${e.loot.map(x => `<div class="cardrow" style="--rc:${RC[x.rarity] || 'var(--line)'}"><span class="n">${x.pct}%</span><b>${esc(x.item)} <span class="muted">${esc(x.cls)} ${esc(x.rarity)}${x.type === 'Codex' ? ' codex' : ''}</span></b><span class="cst"></span><span class="tx">${esc(x.note || '')}</span></div>`).join('')}</div>` : ''}
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
    const bases = G.bases.map(b => ({ b, A: G.arche[b.arch] })).filter(x => x.A).filter(({ b, A }) => (CX.slot === 'All' || slotOf(A) === CX.slot) && (!q || (b.name + ' ' + b.label + ' ' + b.arch + ' ' + (A.imp2 || '') + ' ' + Object.keys(A.weights).join(' ')).toLowerCase().includes(q)))
      .sort((x, y) => SLOTN.indexOf(slotOf(x.A)) - SLOTN.indexOf(slotOf(y.A)) || x.b.name.localeCompare(y.b.name));
    const affixOdds = (A, epic) => { const w = Object.entries(A.weights).filter(([s]) => epic || s !== 'Efficiency'); const tot = w.reduce((s, x) => s + x[1], 0) / (1 - G.resChance); const out = w.map(([s, x]) => [s, x / tot * 100]); const r = out.find(x => x[0] === 'Resistance'); if (r) r[1] += G.resChance * 100; else out.push(['Resistance', G.resChance * 100]); return out.sort((a, b) => b[1] - a[1]); };
    const sel = CX.base;
    return `${cxChips('slot', ['All', ...SLOTN], 'Slot')}
      <div class="cxrules">
        <div><h4>Rarity</h4>${G.rarity.map(r => `<div style="color:${RC[r.name]}">${r.name === 'Purple (Epic)' ? 'Purple' : r.name}: ${r.affixes} affix${r.affixes > 1 ? 'es' : ''}, stats x${r.mult}</div>`).join('')}</div>
        <div><h4>Every item</h4><p>An implicit <b>+${statRange('Map resistance (implicit)')} Fire Resistance</b> (Map 1), plus its base's implicit below. Each map level multiplies every roll by ${G.levelGrowth}; two-handed weapons roll x${G.twoHand}. Affixes pick a stat by the weights shown (the same stat can roll twice and stacks).</p></div>
        <div><h4>Affix ranges (White, +0)</h4><div class="cxranges">${Object.keys(G.stats).filter(s => !/implicit/.test(s)).map(s => `<span>${esc(s)} <b>${statRange(s)}</b></span>`).join('')}</div></div>
      </div>
      <p class="savenote">${bases.length} item bases.</p>
      <div class="cxbases">${bases.map(({ b, A }) => { const imp = implicitText(A, b); return `<details class="cxenemy" ${sel === b.name ? 'open id="cxSel"' : ''}><summary><b>${esc(b.name)}</b> <span class="muted">${esc(b.label)} &middot; ${slotOf(A)}${A.hands ? ' &middot; ' + esc(A.hands) : ''}${A.type && A.type !== 'None' ? ' &middot; ' + esc(A.type) : ''}</span>${imp ? `<span class="cximp">${esc(imp)}</span>` : ''}</summary>
        <p><b>Implicit:</b> ${imp ? esc(imp) : 'none beyond the Fire Resistance every Map 1 item has'}.</p>
        <p><b>Affix odds</b> (per affix): ${affixOdds(A, false).map(([s, p]) => `${esc(s)} ${p.toFixed(p < 10 ? 1 : 0)}%`).join(' &middot; ')}${A.weights.Efficiency ? ' &middot; <i>Efficiency only on Purples</i>' : ''}</p>
        <p class="muted"><b>Dropped by:</b> ${(droppers[b.name] || []).map(esc).join(', ') || 'merchants only'}</p></details>`; }).join('') || '<p class="muted">No bases match.</p>'}</div>`;
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
    const t = ev.target.closest('[data-cxtab],[data-cx],[data-cxbase]'); if (!t) return;
    if (t.dataset.cxtab) { CX.tab = t.dataset.cxtab; CX.q = ''; }
    else if (t.dataset.cx) CX[t.dataset.cx] = t.dataset.v;
    else if (t.dataset.cxbase) { CX.tab = 'gear'; CX.slot = 'All'; CX.q = ''; CX.base = t.dataset.cxbase; }
    renderCodex();
  });
  $('hpCodex').addEventListener('toggle', (ev) => { if (ev.target.open) fitCards(ev.target); }, true);
  $('hpCodex').addEventListener('input', (ev) => { if (ev.target.id !== 'cxQ') return; CX.q = ev.target.value; const pos = ev.target.selectionStart; renderCodex(); const i = $('cxQ'); i.focus(); i.setSelectionRange(pos, pos); });
