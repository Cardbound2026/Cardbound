  // ---------- Hall of Records (Nov 1): the notice board in town (and Menu). Tables: hero_records, raid_kills (supabase/records.sql)
  // Every hero publishes a small public snapshot (progress per map, gear, deck, codex talents) when they come home from a run.
  // Raid leaders record each raid boss kill with their guild, level and number of rounds.
  const REC = { tab: 'heroes', sort: 'progress', cls: 'All', heroes: null, kills: null, err: null, at: 0, busy: false, pubAt: {} };
  const recSetupErr = (e) => e && /relation|does not exist|schema cache|column/i.test(e.message || '');
  const ROWTXT = (r) => r >= 15 ? 'boss killed' : `row ${r}`;
  function heroSnapshot(c) {
    const cx = CBHub.wornCodex(c), info = cx ? CBHub.codexInfo(c, cx) : null;
    const gear = c.gear.map(g => { const o = Object.assign({}, g); delete o.id; delete o.lines; return o; });
    return { gear, deck: c.deck.map(k => [k.key, k.rank || 0]), codex: cx ? { key: cx, level: info.level, picks: info.picks.slice(0, info.rows) } : null,
      codexLv: Object.fromEntries(Object.entries(c.codexes || {}).map(([k, st]) => [k, CB.codexLevel(st.xp || 0).level]).filter(x => x[1] > 0)),
      runs: c.runs || 0, bossKills: c.bossKills || 0, raidKills: c.raidKills || 0, gearScore: CBHub.gearScore(c), deckLevel: CB.deckLevel(c.deck), starter: c.starter, hardcore: !!c.hardcore, hcFell: c.hcFell || null };
  }
  // publish one hero (throttled to once a minute unless forced)
  async function publishHero(key, force) {
    if (!supa || !supaUser) return; const c = profile.chars[key]; if (!c) return;
    if (!force && Date.now() - (REC.pubAt[key] || 0) < 60000) return; REC.pubAt[key] = Date.now();
    const row = { user_id: supaUser.id, hero_key: key, hero_name: c.name, hero_class: c.cls, guild_name: typeof GUILD !== 'undefined' && GUILD.me ? GUILD.me.name : null,
      progress: CBHub.progressScore(c), power: CBHub.powerLevel(c), maps: c.mapBest || {}, snapshot: heroSnapshot(c), updated_at: new Date().toISOString() };
    const { error } = await supa.from('hero_records').upsert(row);
    if (error) { if (recSetupErr(error)) REC.err = 'setup'; else console.warn('hero_records', error); }
  }
  async function publishAllHeroes(force) { for (const k of Object.keys(profile.chars || {})) await publishHero(k, force); }
  // the raid leader records a kill (once per fight)
  async function recordRaidKill(cbx) {
    if (!supa || !supaUser || !cbx || cbx._recKill) return; cbx._recKill = true;
    const G = typeof GUILD !== 'undefined' ? GUILD.me : null;
    const row = { created_by: supaUser.id, map: cbx.raidMap, level: cbx.level || 0, rounds: cbx.round, guild_id: G ? G.id : null, guild_name: G ? G.name : null,
      heroes: cbx.players.map(p => ({ name: p.name, cls: p.cls, alive: p.hp > 0 })) };
    const { error } = await supa.from('raid_kills').insert(row);
    if (error && !recSetupErr(error)) console.warn('raid_kills', error);
  }
  async function loadRecords(force) {
    if (!supa || !supaUser) { REC.err = 'offline'; renderRecords(); return; }
    if (REC.busy || (!force && REC.heroes && Date.now() - REC.at < 30000)) { renderRecords(); return; }
    REC.busy = true; renderRecords();
    try {
      await publishAllHeroes(true);
      const [h, k] = await Promise.all([supa.from('hero_records').select('*').order('progress', { ascending: false }).limit(500), supa.from('raid_kills').select('*').order('killed_at', { ascending: true }).limit(2000)]);
      if (h.error || k.error) { const e = h.error || k.error; REC.err = recSetupErr(e) ? 'setup' : (e.message || 'error'); }
      else { REC.err = null; REC.heroes = h.data || []; REC.kills = k.data || []; REC.at = Date.now(); }
    } catch (e) { REC.err = String(e.message || e); }
    REC.busy = false; renderRecords();
  }
  const mapsInOrder = () => Object.values(DATA.maps).sort((a, b) => a.num - b.num);
  const bestMapOf = (h) => { let best = null; for (const M of mapsInOrder()) { const b = (h.maps || {})[M.key]; if (b && (!best || b.lvl * 15 + b.row + M.num * .01 > best.score)) best = { M, b, score: b.lvl * 15 + b.row + M.num * .01 }; } return best; };
  function renderRecords() {
    const el = $('hpRec'); if (!el) return;
    const tabs = [['heroes', 'Heroes'], ['hardcore', 'Hardcore'], ['maps', 'Map records'], ['raids', 'Raid records']].map(([k, n]) => `<button role="tab" data-rectab="${k}" aria-selected="${REC.tab === k}">${n}</button>`).join('');
    let body = '';
    if (REC.err === 'offline') body = '<p class="muted">Sign in to see the Hall of Records: it lists every player\'s heroes.</p>';
    else if (REC.err === 'setup') body = '<p class="down">The Hall of Records needs a one-time database update: run supabase/records.sql in the Supabase SQL editor.</p>';
    else if (REC.err) body = `<p class="down">Could not load the records: ${esc(REC.err)}</p>`;
    else if (!REC.heroes) body = '<p class="muted">Reading the records...</p>';
    else if (REC.tab === 'heroes') body = recHeroes();
    else if (REC.tab === 'hardcore') body = recHardcore();
    else if (REC.tab === 'maps') body = recMaps();
    else body = recRaids();
    el.innerHTML = `<div class="rechead"><div class="tabs" role="tablist">${tabs}</div><span class="muted">${REC.busy ? 'Updating...' : REC.at ? 'Updated ' + new Date(REC.at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : ''}</span><button class="btn" id="recRefresh">Refresh</button></div>${body}`;
  }
  function recHeroes() {
    let list = REC.heroes.filter(h => REC.cls === 'All' || h.hero_class === REC.cls);
    list = list.slice().sort((a, b) => REC.sort === 'power' ? b.power - a.power || b.progress - a.progress : b.progress - a.progress || b.power - a.power);
    const filt = `<div class="recfilt"><span class="muted">Sort</span>${[['progress', 'Progress'], ['power', 'Power']].map(([k, n]) => `<button class="chip ${REC.sort === k ? 'on' : ''}" data-recsort="${k}">${n}</button>`).join('')}<span class="muted" style="margin-left:10px">Class</span>${['All', 'Warrior', 'Rogue', 'Mage', 'Paladin', 'Warlock'].map(k => `<button class="chip ${REC.cls === k ? 'on' : ''}" data-reccls="${k}">${k}</button>`).join('')}</div>
      <p class="savenote" style="margin:0 0 6px">Progress adds up every map: 15 points per map level reached plus the furthest row at that level (the boss counts as row 15). Click a hero to see their gear, deck and talents.</p>`;
    if (!list.length) return filt + '<p class="muted">No heroes yet.</p>';
    const rows = list.slice(0, 100).map((h, i) => { const bm = bestMapOf(h), cx = h.snapshot && h.snapshot.codex, cxn = cx && CB.CODEX_BY_KEY[cx.key] ? CB.CODEX_BY_KEY[cx.key].name : '';
      return `<tr data-rechero="${h.user_id}|${esc(h.hero_key)}" class="${supaUser && h.user_id === supaUser.id ? 'mine' : ''}"><td class="rk">${i + 1}</td><td><b style="color:${CC[h.hero_class] || 'var(--text)'}">${esc(h.hero_name)}</b> <span class="muted">${esc(h.hero_class)}</span></td><td class="muted">${esc(h.guild_name || '')}</td><td class="num">${h.progress}</td><td class="num">${h.power}</td><td>${bm ? `${esc(bm.M.name)} +${bm.b.lvl}, ${ROWTXT(bm.b.row)}` : '<span class="muted">no runs yet</span>'}</td><td class="muted">${cxn ? `${esc(cxn)} Lv ${cx.level}` : ''}</td></tr>`; }).join('');
    return filt + `<div class="rectable"><table><thead><tr><th>#</th><th>Hero</th><th>Guild</th><th class="num">Progress</th><th class="num">Power</th><th>Furthest</th><th>Codex</th></tr></thead><tbody>${rows}</tbody></table></div>`;
  }
  // Nov 1: hardcore heroes have their own ladder (living ones), plus a graveyard of hardcore heroes who fell (they play on as normal heroes)
  function recHardcore() {
    const alive = REC.heroes.filter(h => h.snapshot && h.snapshot.hardcore && (REC.cls === 'All' || h.hero_class === REC.cls)).sort((a, b) => b.progress - a.progress || b.power - a.power);
    const fell = REC.heroes.filter(h => h.snapshot && !h.snapshot.hardcore && h.snapshot.hcFell).sort((a, b) => (b.snapshot.hcFell.progress || 0) - (a.snapshot.hcFell.progress || 0));
    const filt = `<div class="recfilt"><span class="muted">Class</span>${['All', ...Object.keys(CLASSES)].map(k => `<button class="chip ${REC.cls === k ? 'on' : ''}" data-reccls="${k}">${k}</button>`).join('')}</div>
      <p class="savenote" style="margin:0 0 6px">Hardcore heroes have one life: the first time one falls in a fight (duels and the training dummy don't count) it becomes a normal hero and leaves this ladder for the graveyard.</p>`;
    const rows = alive.slice(0, 100).map((h, i) => { const bm = bestMapOf(h); return `<tr data-rechero="${h.user_id}|${esc(h.hero_key)}" class="${supaUser && h.user_id === supaUser.id ? 'mine' : ''}"><td class="rk">${i + 1}</td><td><b style="color:${CC[h.hero_class] || 'var(--text)'}">${esc(h.hero_name)}</b> <span class="muted">${esc(h.hero_class)}</span></td><td class="muted">${esc(h.guild_name || '')}</td><td class="num">${h.progress}</td><td class="num">${h.power}</td><td>${bm ? `${esc(bm.M.name)} +${bm.b.lvl}, ${ROWTXT(bm.b.row)}` : '<span class="muted">-</span>'}</td></tr>`; }).join('');
    const grave = fell.slice(0, 50).map(h => { const f = h.snapshot.hcFell; return `<li data-rechero="${h.user_id}|${esc(h.hero_key)}"><b style="color:${CC[h.hero_class] || 'var(--text)'}">${esc(h.hero_name)}</b> <span class="muted">${esc(h.hero_class)}</span> &middot; fell ${f.where ? 'on ' + esc(f.where) : ''}${f.progress != null ? ` with ${f.progress} progress` : ''}${f.at ? ' &middot; ' + new Date(f.at).toLocaleDateString() : ''}</li>`; }).join('');
    return filt + (rows ? `<div class="rectable"><table><thead><tr><th>#</th><th>Hero</th><th>Guild</th><th class="num">Progress</th><th class="num">Power</th><th>Furthest</th></tr></thead><tbody>${rows}</tbody></table></div>` : '<p class="muted">No living hardcore heroes yet. Tick Hardcore when you create a hero.</p>')
      + `<h4 style="margin:14px 0 4px;color:var(--accent)">The graveyard</h4>${grave ? `<ol class="recgrave">${grave}</ol>` : '<p class="muted">No hardcore hero has fallen yet.</p>'}`;
  }
  function recMaps() {
    return `<p class="savenote" style="margin:0 0 6px">For each road: the highest map level any hero has reached, then the furthest row at that level.</p><div class="recgrid">${mapsInOrder().map(M => {
      const top = REC.heroes.filter(h => h.maps && h.maps[M.key]).map(h => ({ h, b: h.maps[M.key] })).sort((x, y) => y.b.lvl - x.b.lvl || y.b.row - x.b.row || (x.b.at || 0) - (y.b.at || 0)).slice(0, 5);
      return `<div class="reccard" style="--ec:${ELC[M.element] || 'var(--accent)'}"><h4>${M.num}. ${esc(M.name)}</h4>${top.length ? `<ol>${top.map(({ h, b }, i) => `<li data-rechero="${h.user_id}|${esc(h.hero_key)}"><b style="color:${CC[h.hero_class]}">${esc(h.hero_name)}</b> <span class="muted">${esc(h.guild_name || '')}</span><span class="rv">+${b.lvl} &middot; ${ROWTXT(b.row)}</span></li>`).join('')}</ol>` : '<p class="muted">Nobody has walked this road yet.</p>'}</div>`; }).join('')}</div>`;
  }
  function recRaids() {
    const who = (k) => k.guild_name ? esc(k.guild_name) : `<span class="muted">No guild</span> (${esc((k.heroes[0] || {}).name || '?')}'s party)`;
    const when = (k) => new Date(k.killed_at).toLocaleDateString([], { month: 'short', day: 'numeric' });
    return `<p class="savenote" style="margin:0 0 6px">Every raid kill is recorded by the raid leader, under the leader's guild. Fastest counts the fewest rounds at any level.</p><div class="recgrid">${mapsInOrder().map(M => {
      const ks = REC.kills.filter(k => k.map === M.key), nm = CB.RAID_NAMES[M.key] || M.name;
      if (!ks.length) return `<div class="reccard" style="--ec:${ELC[M.element] || 'var(--accent)'}"><h4>${esc(nm)}</h4><p class="muted">Not killed yet. The first guild to bring it down goes here.</p></div>`;
      const first = ks.slice().sort((a, b) => new Date(a.killed_at) - new Date(b.killed_at))[0], high = ks.slice().sort((a, b) => b.level - a.level || a.rounds - b.rounds)[0], fast = ks.slice().sort((a, b) => a.rounds - b.rounds || b.level - a.level)[0];
      const guilds = {}; for (const k of ks) { const g = k.guild_name || '(no guild)'; guilds[g] = (guilds[g] || 0) + 1; }
      return `<div class="reccard" style="--ec:${ELC[M.element] || 'var(--accent)'}"><h4>${esc(nm)}</h4><dl>
        <dt>First kill</dt><dd>${who(first)} <span class="muted">${when(first)}, +${first.level}</span></dd>
        <dt>Highest level</dt><dd>${who(high)} <span class="rv">+${high.level}</span> <span class="muted">${high.rounds} rounds</span></dd>
        <dt>Fastest</dt><dd>${who(fast)} <span class="rv">${fast.rounds} round${fast.rounds === 1 ? '' : 's'}</span> <span class="muted">+${fast.level}</span></dd>
        <dt>Kills</dt><dd>${ks.length} <span class="muted">by ${Object.keys(guilds).length} guild${Object.keys(guilds).length === 1 ? '' : 's'}</span></dd></dl></div>`; }).join('')}</div>`;
  }
  function recHeroModal(uid, key, H) { // H: a record to show instead of one from the list (the Arena shows a wager's locked hero)
    const h = H || (REC.heroes || []).find(x => x.user_id === uid && x.hero_key === key); if (!h) return;
    const S = h.snapshot || {}, cx = S.codex, cxd = cx && CB.CODEX_BY_KEY[cx.key], tr = cx && CB.TALENTS[cx.key];
    const gear = (S.gear || []).slice().sort((a, b) => (CBHub.SLOTS.indexOf(a.slot) - CBHub.SLOTS.indexOf(b.slot))).map((g, gi) => `<div class="recgear" data-recgear="${gi}" title="Click to see the item" style="--rc:${RC[g.rarity] || 'var(--line)'}"><span class="muted">${esc(g.slot)}</span><b>${esc(g.name)}</b><span class="muted">${esc(g.rarity === 'Purple (Epic)' ? 'Epic' : g.rarity || '')} &middot; ilvl ${g.ilvl || 1}</span><small>${Object.entries(g.stats || {}).map(([k, v]) => `+${v} ${esc(k.replace(/^(Resistance|Elemental\/Holy Damage):(.*)$/, (m, a, b) => b + (a[0] === 'R' ? ' Res' : ' Dmg')))}`).join(', ')}</small></div>`).join('');
    const grp = {}; for (const [k, r] of S.deck || []) { const id = k + '|' + r; grp[id] = (grp[id] || 0) + 1; }
    const deck = Object.entries(grp).map(([id, n]) => { const [k, r] = id.split('|'), d = CARDS[k]; return d ? { d, r: +r, n } : null; }).filter(Boolean).sort((a, b) => (['Gold', 'Blue', 'Green', 'White'].indexOf(a.d.rarity) - ['Gold', 'Blue', 'Green', 'White'].indexOf(b.d.rarity)) || a.d.name.localeCompare(b.d.name))
      .map(x => `<span class="reccardn" style="--rc:${RC[x.d.rarity]}" data-reccard="${x.d.key || ''}|${x.r}" title="Click to see the card">${x.n > 1 ? x.n + 'x ' : ''}${esc(x.d.name)}${x.r ? ` <b>+${x.r}</b>` : ''}</span>`).join('');
    const tal = cx && tr ? (cx.picks || []).map((j, i) => { if (j == null) return ''; let nm; if (i === 9) { const d = CARDS[tr.cap[j]]; nm = d ? d.name : tr.cap[j]; } else nm = (tr.rows[i][j] || {}).n; return `<li><span class="muted">Lv ${(i + 1) * 2}</span> ${esc(nm || '?')}</li>`; }).join('') : '';
    const maps = mapsInOrder().map(M => { const b = (h.maps || {})[M.key]; return `<tr><td>${M.num}. ${esc(M.name)}</td><td>${b ? `+${b.lvl}, ${ROWTXT(b.row)}` : '<span class="muted">-</span>'}</td></tr>`; }).join('');
    modal(`<h2 style="color:${CC[h.hero_class]}">${esc(h.hero_name)} <span class="muted" style="font-size:17px">${esc(h.hero_class)}${h.guild_name ? ' &middot; ' + esc(h.guild_name) : ''}</span></h2>
      <div class="recstats"><span><b>${h.progress}</b> progress</span><span><b>${h.power}</b> power</span><span><b>${S.gearScore ?? '-'}</b> gear</span><span><b>${S.deckLevel ?? '-'}</b> deck</span><span><b>${S.runs ?? 0}</b> runs</span><span><b>${S.bossKills ?? 0}</b> boss kills</span><span><b>${S.raidKills ?? 0}</b> raid kills</span></div>
      <div class="recmodal"><div><h3>Gear</h3><div class="recgearl">${gear || '<span class="muted">No gear recorded.</span>'}</div></div>
      <div><h3>Codex &amp; talents</h3>${cxd ? `<p style="margin:0 0 4px"><b>${esc(cxd.name)} Codex</b> <span class="muted">Lv ${cx.level}</span></p><ul class="rectal">${tal || '<li class="muted">No talents picked.</li>'}</ul>` : '<p class="muted">No codex worn.</p>'}
        <h3>Map records</h3><table class="recmaps">${maps}</table></div></div>
      <h3>Deck (${(S.deck || []).length})</h3><div class="recdeck">${deck}</div>
      <p class="muted" style="font-size:12px;margin:6px 0 0">Snapshot from ${new Date(h.updated_at).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}.</p>
      <div class="row"><button class="btn primary" id="mClose">Close</button></div>`);
    $('modalBox').classList.add('wide'); $('mClose').onclick = closeModal;
    REC.view = { gear: (S.gear || []).slice().sort((a, b) => (CBHub.SLOTS.indexOf(a.slot) - CBHub.SLOTS.indexOf(b.slot))) };
  }
  // click a card or an item on a hero's record to see it big (the same viewer as dropped cards)
  document.addEventListener('click', (ev) => {
    const c = ev.target.closest('#modalBox [data-reccard], #modalBox [data-recgear]'); if (!c) return;
    const zoom = $('cardZoom'); if (!zoom) return;
    if (c.dataset.reccard) { const [k, r] = c.dataset.reccard.split('|'); if (!CARDS[k]) return;
      zoom.innerHTML = `<div class="zoomin">${cardBox(CB.rankedCard(k, +r || 0), 300)}<p>${esc(CARDS[k].rarity)} ${esc(CARDS[k].cls || '')} card${+r ? ' at +' + r : ''} &middot; click anywhere to close</p></div>`; }
    else { const g = REC.view && REC.view.gear[+c.dataset.recgear]; if (!g) return; zoom.innerHTML = `<div class="zoomin"><div class="reczoomitem">${itemHtml(g)}</div><p>click anywhere to close</p></div>`; }
    zoom.hidden = false; fitCards(zoom); requestAnimationFrame(() => fitCards(zoom));
  });
  $('hpRec').addEventListener('click', (ev) => {
    const t = ev.target.closest('[data-rectab]'); if (t) { REC.tab = t.dataset.rectab; return renderRecords(); }
    const so = ev.target.closest('[data-recsort]'); if (so) { REC.sort = so.dataset.recsort; return renderRecords(); }
    const cl = ev.target.closest('[data-reccls]'); if (cl) { REC.cls = cl.dataset.reccls; return renderRecords(); }
    if (ev.target.closest('#recRefresh')) return loadRecords(true);
    const h = ev.target.closest('[data-rechero]'); if (h) { const [u, k] = h.dataset.rechero.split('|'); recHeroModal(u, k); }
  });
  function openRecords() { closeTalk(); openSheet('records'); }
  // publish this player's heroes a little after signing in, so the board fills up without anyone opening it
  setTimeout(function pubLater() { if (supa && supaUser && profile && Object.keys(profile.chars || {}).length) publishAllHeroes(true); else setTimeout(pubLater, 15000); }, 8000);
