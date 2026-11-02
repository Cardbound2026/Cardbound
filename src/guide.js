  // ---------- Build guide (Nov 1): "What kind of Warrior do you want to play?"
  // Class -> playstyle -> codex -> one of that codex's three builds -> a checklist: which cards you have, which you are missing and where
  // they drop, the codex and where it drops, the gear stats to look for, the cards to rank up first, and the best places to farm.
  // Builds are the premade codex decks (src/testdecks.js, from design/scripts/test_decks.py). A hero can track one build (c.build).
  const GDECKS = window.CB_TESTDECKS || [];
  const GUIDE_FEELS = {
    Warrior: [
      { label: 'A tank', blurb: 'Stand in front and soak it: a wall of Block or Parry, enemies hurt themselves on you.', codexes: ['bulwark', 'riposte'] },
      { label: 'Big two-handed hits', blurb: 'Few, heavy swings. Bank mana, then one huge blow that Stuns or crits.', codexes: ['colossus', 'hemorrhage'] },
      { label: 'Many small hits', blurb: 'Lots of cheap Attacks every turn, stacking Vulnerable and Stuns.', codexes: ['sunderer', 'colossus'] },
      { label: 'Blood and Bleed', blurb: 'Hurt yourself on purpose, bank Blood Debt and Bleed, then cash it all in.', codexes: ['bloodbound'] },
      { label: 'Critical strikes', blurb: 'Crit chance and crit payoffs: crits that Bleed and cleave.', codexes: ['hemorrhage'] },
    ],
    Rogue: [
      { label: 'Stealth assassin', blurb: 'Vanish, then strike from the shadows for 50% more.', codexes: ['nightstalker'] },
      { label: 'Poison', blurb: 'Stack Poison that ignores Block and watch it snowball.', codexes: ['venomancer'] },
      { label: 'Bleed', blurb: 'Open wounds and keep them open, then cash the Bleed in.', codexes: ['bloodletter'] },
      { label: 'Lots of cards per turn', blurb: 'Throwing stars every turn, cheap cards, hits on every enemy.', codexes: ['ninja'] },
      { label: 'Untouchable dodger', blurb: 'Dodge everything and turn each dodge into damage.', codexes: ['phantom', 'nightstalker'] },
      { label: 'Wreck their plans', blurb: 'Make enemies discard, lose mana and draw less.', codexes: ['saboteur'] },
    ],
    Mage: [
      { label: 'Big spells', blurb: 'Expensive spells that hit like a truck.', codexes: ['heart_of_winter', 'conflagration'] },
      { label: 'Lots of spells per turn', blurb: 'Cheap spells chained together, card draw, mana flood.', codexes: ['spellstorm', 'archmage'] },
      { label: 'Burn', blurb: 'Set everything on fire and keep it burning.', codexes: ['conflagration'] },
      { label: 'Control', blurb: 'Freeze them, drain their mana, never let them act.', codexes: ['heart_of_winter', 'entropy'] },
      { label: 'Shield mage', blurb: 'Big Barrier that also powers your damage.', codexes: ['barrier_savant'] },
    ],
    Paladin: [
      { label: 'Sword and board', blurb: 'Shield in hand: every hit also blocks, Block and Attacks feed each other.', codexes: ['bastion_of_faith', 'righteous_crusader'] },
      { label: 'Holy fire', blurb: 'Holy damage that sets enemies Burning.', codexes: ['sacred_flame', 'purifier'] },
      { label: 'Healer', blurb: 'Keep the party alive, and turn healing into damage.', codexes: ['equilibrium', 'purifier'] },
      { label: 'Pray, then smite', blurb: 'Build Devotion with prayers, then one judgment blow.', codexes: ['divine_wrath'] },
      { label: 'A tank', blurb: 'Big Block that turns into shield hits.', codexes: ['bastion_of_faith', 'righteous_crusader'] },
    ],
    Warlock: [
      { label: 'Damage over time', blurb: 'Dread and Rot: apply it, step back, let it work.', codexes: ['blightcaller', 'umbral_ruin'] },
      { label: 'Summoner', blurb: 'Call demons that fight and protect you.', codexes: ['demonologist'] },
      { label: 'Two-handed Shadow Knight', blurb: 'A shadow bruiser in heavy armor that heals off its hits.', codexes: ['shadow_knight'] },
      { label: 'Healer and support', blurb: 'Damage that heals the whole party.', codexes: ['soulbinder'] },
      { label: 'Blood magic', blurb: 'Pay with HP instead of mana. Glass cannon or a self-healing wall.', codexes: ['bloodmancer'] },
      { label: 'Critical strikes', blurb: 'Crit nukes whose crits leave Rot behind.', codexes: ['umbral_ruin'] },
    ],
  };
  const GD = { cls: null, feel: null, codex: null, deck: null, fresh: false };
  const G_RAR = ['Gold', 'Blue', 'Green', 'White'];
  const gTier = (t) => t === 'Elite' || t === 'Boss' ? t : 'tier ' + t;
  const gRows = (t) => t === '1' ? 'rows 1-4' : t === '2' ? 'rows 5-9' : t === '3' ? 'rows 10-14' : t === 'Elite' ? 'elite nodes' : 'the boss';
  function openGuide(o) {
    o = o || {}; const c = profile.chars[heroKey];
    GD.fresh = !!o.fresh; GD.feel = null; GD.codex = null; GD.deck = null;
    GD.cls = o.cls || (c && c.cls) || null;
    if (o.deck) { const d = GDECKS.find(x => x.id === o.deck); if (d) { GD.cls = d.cls; GD.codex = d.codex; GD.deck = d.id; } }
    renderGuide();
  }
  // what the hero owns: copies per card key (deck + collection), and which are in the deck
  function gOwned(c) { const own = {}, deck = {}; for (const k of (c && c.cards) || []) own[k.key] = (own[k.key] || 0) + 1; for (const k of (c && c.deck) || []) { own[k.key] = (own[k.key] || 0) + 1; deck[k.key] = (deck[k.key] || 0) + 1; } return { own, deck }; }
  function gBestRank(c, key) { let r = -1; for (const k of [...((c && c.cards) || []), ...((c && c.deck) || [])]) if (k.key === key) r = Math.max(r, k.rank || 0); return r; }
  function gSources(key) { // named drops: [{ e, ek, pct, map }], easiest map first
    const d = CARDS[key], out = [];
    for (const [ek, e] of Object.entries(DATA.enemies)) { if (e.raid || e.map === 'town') continue; for (const x of e.loot || []) if (x.type === 'Card' && x.item === d.name && x.cls === d.cls) out.push({ e, ek, pct: x.pct, map: DATA.maps[e.map || 'physical'] }); }
    return out.sort((a, b) => a.map.num - b.map.num || b.pct - a.pct);
  }
  function gCodexSrc(key) { const cx = CB.CODEX_BY_KEY[key]; if (!cx) return []; const name = cx.name + ' Codex', out = [];
    for (const [mk, M] of Object.entries(DATA.maps)) { const b = DATA.enemies[M.boss]; const x = b && (b.loot || []).find(l => l.type === 'Codex' && l.item === name); if (x) out.push({ M, b, pct: +CB.bossCodexPct(b).toFixed(1) }); }
    return out.sort((a, b) => a.M.num - b.M.num); }
  function gHasCodex(key) { return profile.stash.some(it => it.slot === 'Codex' && it.codex === key) || Object.values(profile.chars).some(c => (c.gear || []).some(g => g.slot === 'Codex' && g.codex === key)); }
  // gear stats to look for, read from the build's cards (and the codex passive)
  const G_WHY = { Strength: 'your Attacks hit harder', Intelligence: 'your damaging Skills hit harder', Dexterity: 'more Block/Barrier/Dodge/Absorb from every card', 'Defense Gain': 'more defense from everything',
    Spirit: 'bigger heals', 'Bleed Chance': 'free Bleed on your Attacks', Thorns: 'attackers take damage back', 'Crit Chance': 'more crits', 'Crit Damage': 'harder crits',
    'Multi-hit Chance': 'cheap Attacks hit twice', 'Multicast Chance': 'Skills cast again for free', Stamina: 'more HP to spend', Lifesteal: 'heal from your hits', Initiative: 'act before the enemy' };
  function gStats(d) {
    const w = {}, el = {}; const add = (k, v) => { w[k] = (w[k] || 0) + v; };
    for (const [k, n] of d.cards) { const c = CARDS[k]; if (!c) continue; const t = c.text || '', tg = c.tags || {};
      if (tg.dmg && c.type === 'Attack') add('Strength', n); if (tg.dmg && c.type === 'Skill') add('Intelligence', n);
      if (tg.def || /\bgain \d+ (block|barrier|dodge|parry|absorb)/i.test(t)) add('Dexterity', n);
      if (tg.heal || /\bheal/i.test(t)) add('Spirit', 0.6 * n);
      if (/bleed/i.test(t) && c.type === 'Attack') add('Bleed Chance', 0.6 * n);
      if (/\b(dread|rot)\b/i.test(t)) add('Intelligence', 0.7 * n); // Dread and Rot scale with Intelligence
      if (/thorns|retaliat/i.test(t)) add('Thorns', n);
      if (/\bcrit/i.test(t)) { add('Crit Chance', n); add('Crit Damage', 0.8 * n); }
      if (c.type === 'Attack' && (c.cost || 0) <= 10 && tg.dmg) add('Multi-hit Chance', 0.35 * n);
      if (c.type === 'Skill' && (c.cost || 0) <= 10 && tg.dmg) add('Multicast Chance', 0.3 * n);
      if (/lose \d+ hp|hp instead|blood debt|costs? hp/i.test(t)) { add('Stamina', 0.8 * n); add('Lifesteal', 0.4 * n); }
      if (tg.dmg && c.dtype && c.dtype !== 'Physical') el[c.dtype] = (el[c.dtype] || 0) + n;
    }
    const cx = CB.CODEX_BY_KEY[d.codex] || {}; const ct = cx.text || '';
    if (/crit/i.test(ct)) { add('Crit Chance', 4); add('Crit Damage', 3); } if (/Block you gain|Barrier you gain/i.test(ct)) add('Defense Gain', 4);
    if (/heal/i.test(ct)) add('Spirit', 2);
    if (w.Dexterity >= 8) add('Defense Gain', w.Dexterity * 0.35);
    delete w.Stamina; // always listed at the end
    const top = Object.entries(w).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([k]) => k);
    const elem = Object.entries(el).sort((a, b) => b[1] - a[1]).filter(([, v]) => v >= 4).slice(0, 1).map(([k]) => k);
    return { top, elem };
  }
  // the build checklist numbers
  function gProgress(c, d) { const { own } = gOwned(c); let have = 0, need = 0; for (const [k, n] of d.cards) { need += n; have += Math.min(n, own[k] || 0); } return { have, need }; }
  function gCrumbs() {
    const parts = [['Class', GD.cls ? 'top' : 'cls', GD.cls ? `<b style="color:${CC[GD.cls]}">${GD.cls}</b>` : 'Class']];
    if (GD.cls && GD.feel != null) parts.push(['Playstyle', 'feel', esc(GUIDE_FEELS[GD.cls][GD.feel].label)]);
    if (GD.codex) parts.push(['Codex', 'codex', esc(CB.CODEX_BY_KEY[GD.codex].name)]);
    if (GD.deck) parts.push(['Build', 'deck', esc((GDECKS.find(x => x.id === GD.deck) || {}).name || '')]);
    return `<div class="gdcrumbs">${parts.map(([, step, h], i) => i < parts.length - 1 ? `<button class="linkbtn" data-gdstep="${step}">${h}</button>` : `<span>${h}</span>`).join(' &rsaquo; ')}</div>`;
  }
  function renderGuide() {
    const c = profile.chars[heroKey]; let body = '', title = 'Build guide';
    if (!GD.cls) {
      title = 'Which class?';
      body = `<div class="gdgrid">${Object.keys(GUIDE_FEELS).map(k => `<button class="gdtile" data-gdcls="${k}"><b style="color:${CC[k]}">${k}</b><span>${esc(CB.CLASSES[k].blurb || '')}</span></button>`).join('')}</div>`;
    } else if (GD.deck) return gDeckPage(c);
    else if (GD.codex) {
      const cx = CB.CODEX_BY_KEY[GD.codex], decks = GDECKS.filter(d => d.codex === GD.codex), src = gCodexSrc(GD.codex), has = gHasCodex(GD.codex);
      title = `${cx.name}: pick a build`;
      body = `<p class="gdcx"><b style="color:#f0b070">${esc(cx.name)} Codex:</b> ${esc(cx.text)}<br><span class="${has ? 'up' : 'muted'}">${has ? '&#10003; You have this codex.' : `Drops from ${src.map(s => `${esc(s.b.name)} (Map ${s.M.num} boss, ${s.pct}%)`).join(' or ') || 'map bosses'}. You can start the build before you find it.`}</span></p>
        <div class="gdgrid">${decks.map(d => { const pr = c && c.cls === d.cls ? gProgress(c, d) : null; return `<button class="gdtile" data-gddeck="${d.id}"><b>${esc(d.name)}</b><i>${esc(d.style)}</i><span>${esc(d.plan)}</span>${pr ? `<em>You have ${pr.have} of ${pr.need} cards</em>` : ''}</button>`; }).join('')}</div>`;
    } else if (GD.feel != null) {
      const f = GUIDE_FEELS[GD.cls][GD.feel];
      title = f.label;
      body = `<p class="muted" style="margin:0 0 8px">${esc(f.blurb)} Each codex below is a different take on it. A codex is a class-only gear piece that drops from map bosses; its passive is what the build is built around.</p>
        <div class="gdgrid">${f.codexes.map(k => { const cx = CB.CODEX_BY_KEY[k], decks = GDECKS.filter(d => d.codex === k), has = gHasCodex(k);
          return `<button class="gdtile" data-gdcodex="${k}"><b>${esc(cx.name)}</b>${has ? '<em class="up">&#10003; you have it</em>' : ''}<span>${esc(cx.text)}</span><i>Builds: ${decks.map(d => esc(d.name) + ' (' + esc(d.style.toLowerCase()) + ')').join(', ')}</i></button>`; }).join('')}</div>`;
    } else {
      const nm = c && c.cls === GD.cls ? c.name : null;
      title = `What kind of ${GD.cls} do you want to play?`;
      body = `${GD.fresh && nm ? `<p style="margin:0 0 8px">Welcome, <b>${esc(nm)}</b>. There are a lot of cards: pick a direction and this guide shows a deck to aim for, what you're missing, where it drops and what gear to wear. You can reopen it any time from your character sheet (C).</p>` : ''}
        <div class="gdgrid">${GUIDE_FEELS[GD.cls].map((f, i) => `<button class="gdtile" data-gdfeel="${i}"><b>${esc(f.label)}</b><span>${esc(f.blurb)}</span><i>${f.codexes.map(k => esc(CB.CODEX_BY_KEY[k].name)).join(' or ')}</i></button>`).join('')}</div>
        <p class="muted" style="font-size:12.5px;margin:8px 0 0"><button class="linkbtn" data-gdstep="cls">Another class</button></p>`;
    }
    modal(`<h2>${esc(title)}</h2>${gCrumbs()}${body}<div class="row"><button class="btn primary" id="mClose">${GD.fresh ? 'Skip for now' : 'Close'}</button></div>`);
    $('modalBox').classList.add('wide', 'guidebox'); $('mClose').onclick = closeModal;
  }
  function gDeckPage(c) {
    const d = GDECKS.find(x => x.id === GD.deck); if (!d) return;
    const mine = c && c.cls === d.cls, { own, deck } = gOwned(mine ? c : null), pr = mine ? gProgress(c, d) : { have: 0, need: d.cards.reduce((s, x) => s + x[1], 0) };
    const cx = CB.CODEX_BY_KEY[d.codex], hasCx = gHasCodex(d.codex), cxSrc = gCodexSrc(d.codex), why = d.why || {};
    const cards = d.cards.slice().sort((a, b) => G_RAR.indexOf(CARDS[a[0]].rarity) - G_RAR.indexOf(CARDS[b[0]].rarity) || CARDS[a[0]].name.localeCompare(CARDS[b[0]].name));
    const missing = [];
    const rows = cards.map(([k, n]) => { const card = CARDS[k], have = own[k] || 0, inDeck = deck[k] || 0, src = gSources(k);
      const st = !mine ? 'muted' : have >= n ? (inDeck >= n ? 'done' : 'owned') : have ? 'part' : 'miss';
      if (mine && have < n) missing.push({ k, n: n - have, src });
      const where = src.length ? src.slice(0, 2).map(s => `${esc(s.e.name)} <span class="muted">(Map ${s.map.num} ${gTier(s.e.tier)}, ${s.pct}%)</span>`).join(', ') + (src.length > 2 ? ` <span class="muted">+${src.length - 2} more</span>` : '') : '<span class="muted">random card drops</span>';
      const state = !mine ? '' : have >= n ? (inDeck >= n ? 'In your deck' : 'Owned: add it at the Scribe') : have ? `Have ${have} of ${n}` : 'Missing';
      return `<tr class="gd-${st}"><td class="gdck">${!mine ? '&middot;' : have >= n ? '&#10003;' : have ? '&#9680;' : '&#10007;'}</td><td><span class="gdcard" data-cardinfo="${k}" style="color:${RC[card.rarity]}">${esc(card.name)}</span>${n > 1 ? ` <b>x${n}</b>` : ''}<div class="gdwhy">${esc(why[k] || card.text)}</div></td><td>${state ? `<b>${state}</b><br>` : ''}${have >= n && mine ? '' : `<span class="gdsrc">${where}</span>`}</td></tr>`; }).join('');
    // where to farm: maps that drop the most missing copies
    const farm = {}; for (const m of missing) { const seen = new Set(); for (const s of m.src) { const mk = s.map.key || s.e.map || 'physical'; const F = farm[mk] || (farm[mk] = { M: s.map, n: 0, mobs: {} }); if (!seen.has(mk)) { F.n += m.n; seen.add(mk); } (F.mobs[s.e.name] = F.mobs[s.e.name] || { e: s.e, cards: [] }).cards.push(CARDS[m.k].name); } }
    const farmTop = Object.values(farm).sort((a, b) => a.M.num - b.M.num).slice(0, 4); // easiest map first: a path through the maps
    const farmHtml = !mine ? '<p class="muted">Track this build on a hero of this class to see where to farm.</p>' : !missing.length ? '<p class="up">You have every card. Now rank up the key cards below.</p>'
      : `<ol class="gdfarm">${farmTop.map(F => `<li><b>Map ${F.M.num}: ${esc(F.M.name)}</b> <span class="muted">(${F.n} missing card${F.n === 1 ? '' : 's'})</span><br>${Object.values(F.mobs).sort((a, b) => b.cards.length - a.cards.length).slice(0, 4).map(x => `${esc(x.e.name)} <span class="muted">(${gRows(x.e.tier)})</span>: ${x.cards.map(esc).join(', ')}`).join('<br>')}</li>`).join('')}</ol>
        <p class="muted" style="font-size:12.5px;margin:2px 0 0">Every kill can also drop a random ${esc(d.cls)} card, so anything can show up anywhere. Luck raises all drop chances. Ink from salvaged cards lets you craft a card you've already seen at the Scribe.</p>`;
    const { top, elem } = gStats(d);
    let keys = Object.keys(why).filter(k => d.cards.some(x => x[0] === k)).sort((a, b) => G_RAR.indexOf(CARDS[a].rarity) - G_RAR.indexOf(CARDS[b].rarity)).slice(0, 4);
    if (!keys.length) keys = d.cards.map(x => x[0]).filter(k => ['Gold', 'Blue'].includes(CARDS[k].rarity)).sort((a, b) => G_RAR.indexOf(CARDS[a].rarity) - G_RAR.indexOf(CARDS[b].rarity) || (CARDS[a].type === 'Power' ? -1 : 0) - (CARDS[b].type === 'Power' ? -1 : 0)).slice(0, 4); // builds without notes: their Gold and Blue cards
    const tracked = mine && c.build === d.id;
    modal(`<h2>${esc(d.name)} <span class="muted" style="font-size:15px">${esc(d.style)}</span></h2>${gCrumbs()}
      <div class="gdtop"><div><p style="margin:0 0 6px">${esc(d.plan)}</p>${(d.tips || []).length ? `<ul class="gdtips">${d.tips.map(t => `<li>${esc(t)}</li>`).join('')}</ul>` : ''}</div>
        <div class="gdprog">${mine ? `<div class="gdbar"><i style="width:${Math.round(100 * pr.have / pr.need)}%"></i></div><b>${pr.have} / ${pr.need}</b> cards` : `<span class="muted">${esc(d.cls)} build</span>`}
          <p class="${hasCx ? 'up' : ''}" style="margin:6px 0 0;font-size:13px">${hasCx ? '&#10003;' : '&#10007;'} <b>${esc(cx.name)} Codex</b><br><span class="muted">${esc(cx.text)}</span>${hasCx ? '' : `<br>Drops from ${cxSrc.map(s => `${esc(s.b.name)} (Map ${s.M.num} boss, ${s.pct}%)`).join(' or ')}`}</p></div></div>
      <div class="gdcols">
        <div><h3>Card checklist</h3><table class="gdlist"><tbody>${rows}</tbody></table></div>
        <div>
          <h3>Rank these up first</h3><ul class="gdkeys">${keys.map(k => { const r = mine ? gBestRank(c, k) : -1; return `<li><span class="gdcard" data-cardinfo="${k}" style="color:${RC[CARDS[k].rarity]}">${esc(CARDS[k].name)}</span>${r >= 0 ? ` <span class="muted">(you have +${r})</span>` : ''}<br><span class="muted">${esc(why[k] || CARDS[k].text)}</span></li>`; }).join('')}</ul>
          <h3>Gear stats to look for</h3><ul class="gdkeys">${top.map(s => `<li><b>${esc(s)}</b> <span class="muted">${esc(G_WHY[s] || '')}</span></li>`).join('')}${elem.length ? `<li><b>${elem[0]} Damage</b> <span class="muted">most of the deck's damage is ${elem[0]}</span></li>` : ''}<li><b>Stamina and Resistance</b> <span class="muted">for the map you're on (each map's gear resists that map's own element)</span></li></ul>
          <h3>Where to farm</h3>${mine && missing.length ? '<p class="muted" style="font-size:12.5px;margin:0 0 4px">Easiest map first. Named drops below; tier 1 monsters are on rows 1-4, tier 2 on rows 5-9, tier 3 on rows 10-14.</p>' : ''}${farmHtml}
        </div>
      </div>
      <div class="row">${mine ? `<button class="btn ${tracked ? '' : 'primary'}" id="gdTrack">${tracked ? 'Stop tracking' : 'Track this build'}</button>` : ''}<button class="btn" data-gdstep="codex">Back</button><button class="btn ${mine ? '' : 'primary'}" id="mClose">Close</button></div>`);
    $('modalBox').classList.add('wide', 'guidebox'); $('mClose').onclick = closeModal;
    if ($('gdTrack')) $('gdTrack').onclick = () => { c.build = tracked ? null : d.id; save(); renderHub(); gDeckPage(c); if (!tracked) sysChat(`Tracking ${d.name}: your character sheet (C) shows how many of its cards you have.`); };
  }
  $('modalBox').addEventListener('click', (ev) => {
    if (!$('modalBox').classList.contains('guidebox')) return;
    const t = ev.target.closest('[data-gdcls],[data-gdfeel],[data-gdcodex],[data-gddeck],[data-gdstep]'); if (!t) return;
    if (t.dataset.gdcls) { GD.cls = t.dataset.gdcls; GD.feel = null; GD.codex = null; GD.deck = null; }
    else if (t.dataset.gdfeel != null) { GD.feel = +t.dataset.gdfeel; GD.codex = null; GD.deck = null; }
    else if (t.dataset.gdcodex) { GD.codex = t.dataset.gdcodex; GD.deck = null; }
    else if (t.dataset.gddeck) GD.deck = t.dataset.gddeck;
    else { const s = t.dataset.gdstep; if (s === 'cls') { GD.cls = null; GD.feel = null; GD.codex = null; GD.deck = null; } else if (s === 'top') { GD.feel = null; GD.codex = null; GD.deck = null; } else if (s === 'feel') { GD.codex = null; GD.deck = null; } else if (s === 'codex') { GD.deck = null; if (GD.feel == null) GD.feel = Math.max(0, GUIDE_FEELS[GD.cls].findIndex(f => f.codexes.includes(GD.codex))); } }
    renderGuide();
  });
  // the tracked build on the character sheet
  function guideLine(c) {
    const d = c && c.build && GDECKS.find(x => x.id === c.build);
    if (!d) return `<p class="gdline"><button class="btn" data-guide="1">Build guide</button> <span class="muted">Not sure what to aim for? Pick a playstyle and get a deck, a checklist and where to farm it.</span></p>`;
    const pr = gProgress(c, d);
    return `<p class="gdline"><button class="btn" data-guide="${d.id}">Build guide</button><span>Tracking <b>${esc(d.name)}</b> <span class="muted">(${esc(CB.CODEX_BY_KEY[d.codex].name)})</span>: <b>${pr.have}/${pr.need}</b> cards${gHasCodex(d.codex) ? ', codex &#10003;' : ', codex not found yet'}</span></p>`;
  }
