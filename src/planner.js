  // ---------- Deck Planner (Nov 13): theorycraft a build (class, codex, talents, cards, notes), name it, save it, post it for
  // everyone, browse and vote on other players' builds, and follow one as your active guide: a quest-style list on the right of
  // the town and the route map says which maps to farm and which monsters to look for. Posted builds live in Supabase
  // (supabase/builds.sql: builds, build_votes); your own builds are kept on your account (profile.builds). Builds on the old
  // Build guide (src/guide.js) can be followed the same way.
  const PL = { tab: 'mine', edit: null, view: null, back: 'mine', list: null, sort: 'top', q: '', cls: '', votes: {}, err: '', busy: false, pick: { q: '', type: '' }, fold: false, sig: '' };
  const PL_CLS = ['Warrior', 'Rogue', 'Mage', 'Paladin', 'Warlock'], PL_RAR = ['Gold', 'Blue', 'Green', 'White'];
  const plBuilds = () => (profile.builds = profile.builds || []);
  const plCount = (b) => (b.cards || []).reduce((s, x) => s + x[1], 0);
  const plCodexes = (cls) => Object.values(CB.CODEX_BY_KEY).filter(x => x.cls === cls);
  const plPool = (cls) => Object.entries(CARDS).filter(([k, d]) => d.cls === cls && d.type !== 'Status' && PL_RAR.includes(d.rarity) && !(k in (CB.REMOVED_CARDS || {}))).map(([k, d]) => Object.assign({ k }, { d })).sort((a, b) => PL_RAR.indexOf(a.d.rarity) - PL_RAR.indexOf(b.d.rarity) || a.d.name.localeCompare(b.d.name));
  const plClean = (b) => ({ id: b.id, rid: b.rid || null, name: String(b.name || 'Untitled build').slice(0, 60), cls: PL_CLS.includes(b.cls) ? b.cls : 'Warrior', codex: CB.CODEX_BY_KEY[b.codex] ? b.codex : null,
    cards: (b.cards || []).filter(x => CARDS[x[0]] && x[1] > 0).map(x => [x[0], Math.min(9, x[1] | 0)]), talents: (b.talents || []).slice(0, 10).map(x => x === 0 || x === 1 || x === 2 ? x : null), desc: String(b.desc || '').slice(0, 4000), author: b.author || null });
  const plFromRow = (r) => plClean({ id: 'r' + r.id, rid: r.id, name: r.name, cls: r.cls, codex: r.codex, cards: (r.data || {}).cards, talents: (r.data || {}).talents, desc: r.descr, author: r.author });
  // the build a hero follows: one from the planner (c.plan), or one tracked on the old Build guide (c.build)
  function plActive(c) { if (!c) return null; if (c.plan && c.plan.cards) return c.plan; const d = c.build && GDECKS.find(x => x.id === c.build); return d ? { id: 'g' + d.id, name: d.name, cls: d.cls, codex: d.codex, cards: d.cards, talents: [], desc: d.plan || '', guide: d.id } : null; }
  function openPlanner(tab) { PL.tab = tab || 'mine'; PL.err = ''; if (PL.tab === 'browse') plFetch(); plRender(); }
  function plNew() { const c = profile.chars[heroKey]; PL.edit = { id: CBHub.uid ? CBHub.uid('b') : 'b' + Date.now().toString(36), name: '', cls: (c && c.cls) || 'Warrior', codex: null, cards: [], talents: [], desc: '' }; PL.tab = 'edit'; plRender(); }
  // ---- what is missing and where it drops (the same sources the Build guide reads)
  function plTodo(c, b) {
    const mine = c && c.cls === b.cls, { own } = gOwned(mine ? c : null), missing = [], farm = {};
    for (const [k, n] of b.cards) { const have = own[k] || 0; if (have < n) missing.push({ k, n: n - have, src: gSources(k) }); }
    for (const m of missing) { const s = m.src[0]; if (!s) continue; const mk = s.e.map || 'physical', F = farm[mk] || (farm[mk] = { M: s.map, mobs: {} }); const X = F.mobs[s.e.name] || (F.mobs[s.e.name] = { e: s.e, cards: [] }); X.cards.push(m); }
    const cx = b.codex && CB.CODEX_BY_KEY[b.codex], hasCx = !cx || gHasCodex(b.codex), cxSrc = cx && !hasCx ? gCodexSrc(b.codex) : [];
    return { mine, own, missing, farm: Object.values(farm).sort((a, b2) => a.M.num - b2.M.num), anywhere: missing.filter(m => !m.src.length), cx, hasCx, cxSrc, pr: gProgress(mine ? c : null, b) };
  }
  // ---- pages
  function plTabs() { return `<div class="shoptabs" style="margin:6px 0 10px">${[['mine', 'My builds'], ['browse', 'Browse builds']].map(([k, n]) => `<button class="${PL.tab === k ? 'on' : ''}" data-pltab="${k}">${n}</button>`).join('')}<button data-plnew="1">+ New build</button></div>`; }
  function plCardRows(b, todo) {
    return b.cards.slice().sort((x, y) => PL_RAR.indexOf(CARDS[x[0]].rarity) - PL_RAR.indexOf(CARDS[y[0]].rarity) || CARDS[x[0]].name.localeCompare(CARDS[y[0]].name)).map(([k, n]) => { const d = CARDS[k], have = todo.mine ? Math.min(n, todo.own[k] || 0) : -1, src = gSources(k);
      return `<tr class="gd-${have < 0 ? 'muted' : have >= n ? 'done' : have ? 'part' : 'miss'}"><td class="gdck">${have < 0 ? '&middot;' : have >= n ? '&#10003;' : have ? '&#9680;' : '&#10007;'}</td><td><span style="color:${RC[d.rarity]};font-weight:600" title="${esc(d.text)}">${esc(d.name)}</span>${n > 1 ? ` <b>x${n}</b>` : ''} <span class="muted">${d.cost == null ? '' : d.cost + ' mana &middot; '}${d.type}</span><div class="gdwhy">${esc(d.text)}</div></td><td>${have < 0 || have >= n ? '' : src.length ? src.slice(0, 2).map(s => `${esc(s.e.name)} <span class="muted">(Map ${s.map.num} ${gTier(s.e.tier)}, ${s.pct}%)</span>`).join(', ') : '<span class="muted">random card drops</span>'}</td></tr>`; }).join('');
  }
  function plTalentsHtml(b, edit) {
    const tr = b.codex && window.CB_TALENTS && CB_TALENTS[b.codex]; if (!tr) return edit ? '<p class="muted" style="margin:0">Pick a codex to plan its talents.</p>' : '';
    return `<div class="pltal">${tr.rows.map((row, ri) => `<div class="pltrow"><i>${ri + 1}</i>${row.map((t, ci) => { const on = (b.talents || [])[ri] === ci; return edit || on ? `<button type="button" class="${on ? 'on' : ''}" ${edit ? `data-pltal="${ri}:${ci}"` : 'disabled'} style="--tc:${TCOL[ci][1]}" title="${esc(talentText(t.t, b.cls))}"><b>${esc(t.n)}</b>${edit ? '' : `<span>${esc(talentText(t.t, b.cls))}</span>`}</button>` : ''; }).join('')}${!edit && (b.talents || [])[ri] == null ? '<span class="muted" style="font-size:12px">no pick</span>' : ''}</div>`).join('')}</div>`;
  }
  function plRender() {
    const c = profile.chars[heroKey], act = plActive(c); let body = '';
    if (PL.tab === 'edit' && PL.edit) return plEditPage();
    if (PL.tab === 'view' && PL.view) return plViewPage();
    if (PL.tab === 'mine') {
      const L = plBuilds();
      body = (act ? `<p class="gdcx" style="margin:0 0 8px"><b style="color:#f0b070">Active guide:</b> ${esc(act.name)} <span class="muted">(${esc(act.cls)})</span> <button class="linkbtn" data-plview="active">Open</button> &middot; <button class="linkbtn" data-plstop="1">Stop following</button></p>` : '<p class="muted" style="margin:0 0 8px">No active guide. Set a build as your active guide and a to-do list on the right of the screen shows which maps to farm and which monsters to look for.</p>')
        + (L.length ? `<div class="gdgrid">${L.map(b => { const cx = CB.CODEX_BY_KEY[b.codex]; return `<div class="gdtile pltile"><b style="color:${CC[b.cls]}">${esc(b.name)}</b><i>${esc(b.cls)}${cx ? ' &middot; ' + esc(cx.name) : ''} &middot; ${plCount(b)} cards${b.rid ? ' &middot; posted' : ''}</i><span>${esc((b.desc || '').slice(0, 140))}</span><div class="plbtns"><button class="btn primary" data-plview="${b.id}">Open</button><button class="btn" data-pledit="${b.id}">Edit</button><button class="btn" data-pldel="${b.id}">Delete</button></div></div>`; }).join('')}</div>` : '<p class="muted">You have not saved a build yet. Start one with <b>+ New build</b>, or copy one from <b>Browse builds</b>.</p>')
        + `<p class="muted" style="font-size:12.5px;margin:10px 0 0">Not sure where to start? The <button class="linkbtn" data-plguide="1">Build guide</button> has a ready-made deck for every codex.</p>`;
    } else {
      const signed = !!(supa && supaUser);
      body = !signed ? '<p class="muted">Sign in (Menu, Game) to browse and vote on the builds other players have posted, and to post your own.</p>'
        : `<div class="plfilt"><input id="plQ" type="text" placeholder="Search by name" value="${esc(PL.q)}" maxlength="40"><select id="plCls"><option value="">Every class</option>${PL_CLS.map(k => `<option ${PL.cls === k ? 'selected' : ''}>${k}</option>`).join('')}</select><select id="plSort">${[['top', 'Most upvoted'], ['new', 'Newest'], ['ups', 'Most votes'], ['low', 'Most downvoted']].map(([k, n]) => `<option value="${k}" ${PL.sort === k ? 'selected' : ''}>${n}</option>`).join('')}</select><button class="btn" data-plgo="1">Search</button></div>`
          + (PL.err === 'setup' ? '<p class="muted">Posted builds are not switched on yet: the game\'s owner needs to run <b>supabase/builds.sql</b> once.</p>' : PL.err ? `<p class="down">${esc(PL.err)}</p>` : PL.list == null ? '<p class="muted">Loading builds...</p>' : !PL.list.length ? '<p class="muted">No builds match. Be the first: make one and post it.</p>'
            : `<table class="gdlist plbrowse"><tbody>${PL.list.map(r => `<tr><td class="plvote"><button class="${PL.votes[r.id] === 1 ? 'on up' : ''}" data-plvote="${r.id}:1" title="Upvote">&#9650;</button><b>${r.score > 0 ? '+' : ''}${r.score}</b><button class="${PL.votes[r.id] === -1 ? 'on dn' : ''}" data-plvote="${r.id}:-1" title="Downvote">&#9660;</button></td><td><button class="linkbtn" data-plrow="${r.id}" style="font-size:16px;font-weight:700;color:${CC[r.cls]}">${esc(r.name)}</button> <span class="muted">${esc(r.cls)}${CB.CODEX_BY_KEY[r.codex] ? ' &middot; ' + esc(CB.CODEX_BY_KEY[r.codex].name) : ''} &middot; ${((r.data || {}).cards || []).reduce((s, x) => s + (x[1] || 0), 0)} cards</span><div class="gdwhy">${esc((r.descr || '').slice(0, 160))}</div></td><td class="muted" style="white-space:nowrap;font-size:12.5px">by ${esc(r.author)}<br>${r.up} up &middot; ${r.down} down</td></tr>`).join('')}</tbody></table>`);
    }
    modal(`<h2>Deck Planner</h2>${plTabs()}${body}<div class="row"><button class="btn primary" id="mClose">Close</button></div>`);
    $('modalBox').classList.add('wide', 'guidebox', 'plbox'); $('mClose').onclick = closeModal;
  }
  function plViewPage() {
    const b = PL.view, c = profile.chars[heroKey], T = plTodo(c, b), cx = T.cx, act = plActive(c), isAct = act && act.id === b.id, mineB = plBuilds().some(x => x.id === b.id), row = b.rid && (PL.list || []).find(r => r.id === b.rid);
    const farm = !T.mine ? `<p class="muted">Open this on a ${esc(b.cls)} to see what you are missing and where to farm it.</p>` : !T.missing.length ? '<p class="up">You have every card in this build.</p>'
      : `<ol class="gdfarm">${T.farm.map(F => `<li><b>Map ${F.M.num}: ${esc(F.M.name)}</b><br>${Object.values(F.mobs).map(x => `${esc(x.e.name)} <span class="muted">(${gRows(x.e.tier)})</span>: ${x.cards.map(m => `<span style="color:${RC[CARDS[m.k].rarity]}">${esc(CARDS[m.k].name)}</span>${m.n > 1 ? ' x' + m.n : ''}`).join(', ')}`).join('<br>')}</li>`).join('')}</ol>${T.anywhere.length ? `<p class="muted" style="font-size:12.5px">No named drop (any monster can drop them, or craft them with Ink): ${T.anywhere.map(m => esc(CARDS[m.k].name)).join(', ')}.</p>` : ''}`;
    modal(`<h2><span style="color:${CC[b.cls]}">${esc(b.name)}</span> <span class="muted" style="font-size:15px">${esc(b.cls)}${b.author ? ' &middot; by ' + esc(b.author) : ''}</span></h2>
      ${row ? `<p style="margin:0 0 6px"><span class="plvote inline"><button class="${PL.votes[row.id] === 1 ? 'on up' : ''}" data-plvote="${row.id}:1">&#9650; Upvote</button><b>${row.score > 0 ? '+' : ''}${row.score}</b><button class="${PL.votes[row.id] === -1 ? 'on dn' : ''}" data-plvote="${row.id}:-1">&#9660; Downvote</button></span></p>` : ''}
      <div class="gdtop"><div>${b.desc ? `<p class="pldesc">${esc(b.desc)}</p>` : '<p class="muted">No description.</p>'}</div>
        <div class="gdprog">${T.mine ? `<div class="gdbar"><i style="width:${T.pr.need ? Math.round(100 * T.pr.have / T.pr.need) : 0}%"></i></div><b>${T.pr.have} / ${T.pr.need}</b> cards` : `<span class="muted">${plCount(b)} cards</span>`}
          ${cx ? `<p class="${T.hasCx ? 'up' : ''}" style="margin:6px 0 0;font-size:13px">${T.hasCx ? '&#10003;' : '&#10007;'} <b>${esc(cx.name)} Codex</b><br><span class="muted">${esc(cx.text)}</span>${T.hasCx ? '' : `<br>Drops from ${T.cxSrc.map(s => `${esc(s.b.name)} (Map ${s.M.num} boss, ${s.pct}%)`).join(' or ') || 'map bosses'}`}</p>` : '<p class="muted" style="margin:6px 0 0;font-size:13px">No codex chosen.</p>'}</div></div>
      <div class="gdcols"><div><h3>Cards</h3>${b.cards.length ? `<table class="gdlist"><tbody>${plCardRows(b, T)}</tbody></table>` : '<p class="muted">No cards yet.</p>'}</div>
        <div><h3>Where to farm</h3>${farm}${cx ? `<h3>Talents</h3>${plTalentsHtml(b, false)}` : ''}</div></div>
      <div class="row">${b.cls === (c && c.cls) ? `<button class="btn ${isAct ? '' : 'primary'}" data-plact="1">${isAct ? 'Stop following' : 'Set as my active guide'}</button>` : ''}${mineB ? `<button class="btn" data-pledit="${b.id}">Edit</button><button class="btn" data-plpost="1" ${PL.busy ? 'disabled' : ''}>${b.rid ? 'Update the posted build' : 'Post it for everyone'}</button>${b.rid ? '<button class="btn" data-plunpost="1">Take the post down</button>' : ''}` : b.guide ? '' : '<button class="btn" data-plcopy="1">Save a copy to my builds</button>'}<button class="btn" data-pltab="${PL.back}">Back</button><button class="btn" id="mClose">Close</button></div>`);
    $('modalBox').classList.add('wide', 'guidebox', 'plbox'); $('mClose').onclick = closeModal;
  }
  function plEditPage() {
    const b = PL.edit, pool = plPool(b.cls), q = PL.pick.q.toLowerCase(), n = plCount(b), inB = Object.fromEntries(b.cards), rar = { Gold: 0, Blue: 0, Green: 0 };
    for (const [k, x] of b.cards) if (rar[CARDS[k].rarity] != null) rar[CARDS[k].rarity] += x;
    const caps = CB.DECK_CAPS || {}, over = Object.keys(rar).filter(r => caps[r] && rar[r] > caps[r]);
    const list = pool.filter(p => (!q || p.d.name.toLowerCase().includes(q) || (p.d.text || '').toLowerCase().includes(q)) && (!PL.pick.type || p.d.type === PL.pick.type));
    modal(`<h2>${plBuilds().some(x => x.id === b.id) ? 'Edit build' : 'New build'}</h2>
      <div class="pledit"><div class="plform"><label>Name<input id="plName" type="text" maxlength="60" placeholder="Name your build" value="${esc(b.name)}"></label>
        <label>Class<select id="plECls">${PL_CLS.map(k => `<option ${b.cls === k ? 'selected' : ''}>${k}</option>`).join('')}</select></label>
        <label>Codex<select id="plECodex"><option value="">None yet</option>${plCodexes(b.cls).map(x => `<option value="${x.key}" ${b.codex === x.key ? 'selected' : ''}>${esc(x.name)}</option>`).join('')}</select></label></div>
        ${b.codex ? `<p class="gdcx" style="margin:4px 0 0"><b style="color:#f0b070">${esc(CB.CODEX_BY_KEY[b.codex].name)}:</b> ${esc(CB.CODEX_BY_KEY[b.codex].text)}</p>` : ''}
        <label class="pldesclab">Description and notes <span class="muted">(how it plays, the cards you are looking for, what to rank up)</span><textarea id="plDesc" maxlength="4000" rows="4" placeholder="Write out the plan: what the deck does, which cards matter most, what you are still hunting for...">${esc(b.desc)}</textarea></label>
        <div class="plcols"><div><h3>Cards to pick from <span class="muted" style="font-size:12.5px">click to add</span></h3>
            <div class="plfilt"><input id="plPickQ" type="text" placeholder="Search cards" value="${esc(PL.pick.q)}"><select id="plPickT"><option value="">Every type</option>${['Attack', 'Skill', 'Power'].map(t => `<option ${PL.pick.type === t ? 'selected' : ''}>${t}</option>`).join('')}</select></div>
            <div class="plpool">${list.map(p => `<button type="button" data-pladd="${p.k}" title="${esc(p.d.text)}" style="--rc:${RC[p.d.rarity]}"><b>${esc(p.d.name)}</b><i>${p.d.cost == null ? '' : p.d.cost} ${p.d.type}</i>${inB[p.k] ? `<em>x${inB[p.k]}</em>` : ''}<span>${esc(p.d.text)}</span></button>`).join('') || '<p class="muted">No cards match.</p>'}</div></div>
          <div><h3>The deck <span class="${n < CB.DECK_MIN || n > CB.DECK_MAX ? 'down' : 'up'}" style="font-size:13px">${n} card${n === 1 ? '' : 's'}</span> <span class="muted" style="font-size:12.5px">a deck holds ${CB.DECK_MIN} to ${CB.DECK_MAX}${over.length ? `</span> <span class="down" style="font-size:12.5px">too many ${over.join(' and ')} cards (at most ${Object.entries(caps).map(([r, v]) => v + ' ' + r).join(', ')})` : ''}</span></h3>
            <div class="pldeck">${b.cards.slice().sort((x, y) => PL_RAR.indexOf(CARDS[x[0]].rarity) - PL_RAR.indexOf(CARDS[y[0]].rarity) || CARDS[x[0]].name.localeCompare(CARDS[y[0]].name)).map(([k, x]) => `<div style="--rc:${RC[CARDS[k].rarity]}" title="${esc(CARDS[k].text)}"><b>${esc(CARDS[k].name)}</b><em>x${x}</em><button type="button" data-plsub="${k}" title="Take one out">&minus;</button><button type="button" data-pladd="${k}" title="Add another">+</button></div>`).join('') || '<p class="muted" style="margin:0">Empty. Click cards on the left.</p>'}</div>
            <h3 style="margin-top:10px">Talents <span class="muted" style="font-size:12.5px">one per row</span></h3>${plTalentsHtml(b, true)}</div></div></div>
      <div class="row"><button class="btn primary" data-plsave="1">Save build</button><button class="btn" data-pltab="mine">Cancel</button></div>`);
    $('modalBox').classList.add('wide', 'guidebox', 'plbox');
  }
  // ---- posted builds
  async function plFetch() {
    PL.list = null; PL.err = ''; if (!(supa && supaUser)) return;
    try { let qy = supa.from('builds').select('id,user_id,author,name,cls,codex,data,descr,up,down,score,created_at'); if (PL.cls) qy = qy.eq('cls', PL.cls); if (PL.q.trim()) qy = qy.ilike('name', '%' + PL.q.trim().replace(/[%_]/g, '') + '%');
      qy = PL.sort === 'new' ? qy.order('created_at', { ascending: false }) : PL.sort === 'ups' ? qy.order('up', { ascending: false }) : PL.sort === 'low' ? qy.order('score', { ascending: true }) : qy.order('score', { ascending: false }).order('created_at', { ascending: false });
      const { data, error } = await qy.limit(80); if (error) throw error; PL.list = data || [];
      if (PL.list.length) { const v = await supa.from('build_votes').select('build_id,vote').eq('user_id', supaUser.id).in('build_id', PL.list.map(r => r.id)); PL.votes = {}; for (const x of (v.data || [])) PL.votes[x.build_id] = x.vote; }
    } catch (e) { PL.list = []; PL.err = recSetupErr(e) ? 'setup' : 'Could not load builds: ' + (e.message || e); }
    if (!$('modal').hidden && $('modalBox').classList.contains('plbox') && PL.tab === 'browse') plRender();
  }
  async function plVote(id, v) {
    if (!(supa && supaUser)) return; const row = (PL.list || []).find(r => r.id === id), old = PL.votes[id] || 0, nv = old === v ? 0 : v;
    try { const res = nv ? await supa.from('build_votes').upsert({ build_id: id, user_id: supaUser.id, vote: nv }) : await supa.from('build_votes').delete().eq('build_id', id).eq('user_id', supaUser.id); if (res.error) throw res.error;
      if (nv) PL.votes[id] = nv; else delete PL.votes[id];
      if (row) { row.score += nv - old; row.up += (nv === 1 ? 1 : 0) - (old === 1 ? 1 : 0); row.down += (nv === -1 ? 1 : 0) - (old === -1 ? 1 : 0); }
    } catch (e) { PL.err = recSetupErr(e) ? 'setup' : 'Your vote was not saved: ' + (e.message || e); }
    plRender();
  }
  async function plPost(b) {
    if (!(supa && supaUser)) return toast('Sign in (Menu, Game) to post a build.'); if (!b.cards.length) return toast('Add some cards before you post it.'); if (!b.name.trim()) return toast('Give the build a name first.');
    const c = profile.chars[heroKey], row = { author: String((c && c.name) || 'A hero').slice(0, 40), name: b.name.trim().slice(0, 60), cls: b.cls, codex: b.codex, data: { cards: b.cards, talents: b.talents }, descr: b.desc || '' };
    PL.busy = true; plRender();
    try { if (b.rid) { const { data, error } = await supa.from('builds').update(row).eq('id', b.rid).eq('user_id', supaUser.id).select('id'); if (error) throw error; if (!data || !data.length) b.rid = null; }
      if (!b.rid) { const { data, error } = await supa.from('builds').insert(Object.assign({ user_id: supaUser.id }, row)).select('id').single(); if (error) throw error; b.rid = data.id; }
      save(); PL.busy = false; plRender(); sysChat(`Posted "${b.name}". Other players can find it in the Deck Planner under Browse builds.`);
    } catch (e) { PL.busy = false; plRender(); toast(recSetupErr(e) ? 'Posted builds are not switched on yet: supabase/builds.sql needs to be run once.' : 'Could not post: ' + (e.message || e)); }
  }
  async function plUnpost(b) { if (!(supa && supaUser) || !b.rid) return; try { const { error } = await supa.from('builds').delete().eq('id', b.rid).eq('user_id', supaUser.id); if (error) throw error; b.rid = null; save(); PL.list = null; plRender(); } catch (e) { toast('Could not take it down: ' + (e.message || e)); } }
  // ---- clicks and typing inside the planner
  $('modalBox').addEventListener('input', (ev) => { if (!$('modalBox').classList.contains('plbox')) return; const t = ev.target, b = PL.edit;
    if (t.id === 'plName' && b) b.name = t.value; else if (t.id === 'plDesc' && b) b.desc = t.value; else if (t.id === 'plQ') PL.q = t.value;
    else if (t.id === 'plPickQ') { PL.pick.q = t.value; const at = t.selectionStart; plEditPage(); const n = $('plPickQ'); if (n) { n.focus(); try { n.setSelectionRange(at, at); } catch (e) {} } } });
  $('modalBox').addEventListener('change', (ev) => { if (!$('modalBox').classList.contains('plbox')) return; const t = ev.target, b = PL.edit;
    if (t.id === 'plECls' && b) { if (b.cards.length && b.cls !== t.value) { b.cards = []; } b.cls = t.value; b.codex = null; b.talents = []; plEditPage(); }
    else if (t.id === 'plECodex' && b) { b.codex = t.value || null; b.talents = []; plEditPage(); }
    else if (t.id === 'plPickT') { PL.pick.type = t.value; plEditPage(); }
    else if (t.id === 'plCls') { PL.cls = t.value; plFetch(); plRender(); } else if (t.id === 'plSort') { PL.sort = t.value; plFetch(); plRender(); } });
  $('modalBox').addEventListener('keydown', (ev) => { if ($('modalBox').classList.contains('plbox') && ev.target.id === 'plQ' && ev.key === 'Enter') { plFetch(); plRender(); } });
  $('modalBox').addEventListener('click', (ev) => {
    if (!$('modalBox').classList.contains('plbox')) return;
    const t = ev.target.closest('[data-pltab],[data-plnew],[data-plview],[data-pledit],[data-pldel],[data-plstop],[data-plguide],[data-plgo],[data-plvote],[data-plrow],[data-plact],[data-plpost],[data-plunpost],[data-plcopy],[data-pladd],[data-plsub],[data-pltal],[data-plsave]'); if (!t) return;
    const D = t.dataset, c = profile.chars[heroKey], L = plBuilds(), b = PL.edit;
    const keep = (fn) => { const sc = [...$('modalBox').querySelectorAll('.plpool, .pldeck')].map(e => e.scrollTop), top = $('modalBox').scrollTop; fn(); [...$('modalBox').querySelectorAll('.plpool, .pldeck')].forEach((e, i) => { e.scrollTop = sc[i] || 0; }); $('modalBox').scrollTop = top; };
    if (D.pltab) { PL.tab = D.pltab; PL.edit = null; if (PL.tab === 'browse' && PL.list == null) plFetch(); return plRender(); }
    if (D.plnew) return plNew();
    if (D.plguide) return openGuide();
    if (D.plgo) { plFetch(); return plRender(); }
    if (D.plview) { const v = D.plview === 'active' ? plActive(c) : L.find(x => x.id === D.plview); if (!v) return; PL.view = v; PL.back = 'mine'; PL.tab = 'view'; return plRender(); }
    if (D.plrow) { const r = (PL.list || []).find(x => x.id === D.plrow); if (!r) return; const own = L.find(x => x.rid === r.id); PL.view = own || plFromRow(r); PL.back = 'browse'; PL.tab = 'view'; return plRender(); }
    if (D.pledit) { const v = L.find(x => x.id === D.pledit); if (!v) return; PL.edit = JSON.parse(JSON.stringify(v)); PL.tab = 'edit'; return plRender(); }
    if (D.pldel) { const i = L.findIndex(x => x.id === D.pldel); if (i < 0) return; if (t.dataset.sure !== '1') { t.dataset.sure = '1'; t.textContent = 'Really delete?'; return; } L.splice(i, 1); save(); return plRender(); }
    if (D.plstop) { if (c) { c.plan = null; c.build = null; save(); plTrack(true); } return plRender(); }
    if (D.plvote) { const [id, v] = D.plvote.split(':'); return plVote(id, +v); }
    if (D.plact) { const v = PL.view, a = plActive(c); if (!c || !v) return; if (a && a.id === v.id) { c.plan = null; c.build = null; } else { if (v.guide) { c.build = v.guide; c.plan = null; } else { c.plan = JSON.parse(JSON.stringify(plClean(v))); c.build = null; } sysChat(`Following ${v.name}: the list on the right shows where to farm what you are missing.`); } save(); plTrack(true); try { renderHub(); } catch (e) {} return plViewPage(); }
    if (D.plpost) return plPost(PL.view);
    if (D.plunpost) return plUnpost(PL.view);
    if (D.plcopy) { const v = plClean(PL.view); v.id = CBHub.uid ? CBHub.uid('b') : 'b' + Date.now().toString(36); v.rid = null; v.name = (v.name + ' (copy)').slice(0, 60); L.unshift(v); save(); PL.view = v; PL.back = 'mine'; return plRender(); }
    if (!b) return;
    if (D.pladd) { const e = b.cards.find(x => x[0] === D.pladd); if (e) e[1] = Math.min(9, e[1] + 1); else b.cards.push([D.pladd, 1]); return keep(plEditPage); }
    if (D.plsub) { const i = b.cards.findIndex(x => x[0] === D.plsub); if (i >= 0 && --b.cards[i][1] <= 0) b.cards.splice(i, 1); return keep(plEditPage); }
    if (D.pltal) { const [ri, ci] = D.pltal.split(':').map(Number); b.talents = b.talents || []; while (b.talents.length < 10) b.talents.push(null); b.talents[ri] = b.talents[ri] === ci ? null : ci; return keep(plEditPage); }
    if (D.plsave) { if (!b.name.trim()) { const n = $('plName'); if (n) { n.focus(); n.placeholder = 'Give it a name first'; } return; } const v = plClean(b), i = L.findIndex(x => x.id === v.id); if (i >= 0) { v.rid = L[i].rid; L[i] = v; } else L.unshift(v);
      for (const h of Object.values(profile.chars)) if (h.plan && h.plan.id === v.id) h.plan = JSON.parse(JSON.stringify(v));     /* heroes following it follow the new version */
      save(); PL.edit = null; PL.view = v; PL.back = 'mine'; PL.tab = 'view'; plTrack(true); return plRender(); }
  });
  // ---- the active guide's to-do list: on the right of the town and the route map
  function plTrack(force) {
    let el = $('questTrk'); const c = profile && profile.chars && profile.chars[heroKey], b = plActive(c);
    const where = !c || !b || !$('scrTitle').hidden ? '' : (typeof cb !== 'undefined' && cb) ? '' : !$('scrMap').hidden ? 'map' : !$('scrStart').hidden ? 'town' : '';
    if (!where) { if (el) el.hidden = true; PL.sig = ''; return; }
    const T = plTodo(c, b), sig = [where, b.id, T.pr.have, T.pr.need, T.hasCx, PL.fold, T.missing.map(m => m.k + m.n).join(',')].join('|');
    if (!el) { el = document.createElement('div'); el.id = 'questTrk'; document.body.appendChild(el); el.addEventListener('click', (ev) => { if (ev.target.closest('[data-qfold]')) { PL.fold = !PL.fold; return plTrack(true); } if (ev.target.closest('[data-qopen]')) { const a = plActive(profile.chars[heroKey]); if (a) { PL.view = a; PL.back = 'mine'; PL.tab = 'view'; plRender(); } } }); }
    { const home = where === 'map' ? $('scrMap').querySelector('aside.side') || document.body : document.body; if (el.parentNode !== home) home.appendChild(el); }   /* on the route map it sits in the right column, under the loot sack */
    el.hidden = false; el.className = where; if (sig === PL.sig && !force) return; PL.sig = sig;
    const lines = [];
    if (T.cx && !T.hasCx) for (const s of T.cxSrc.slice(0, 2)) lines.push([`Map ${s.M.num}: ${s.M.name}`, `<li><i></i><span><b>${esc(s.b.name)}</b> <em>boss</em><br>${esc(T.cx.name)} Codex <em>${s.pct}%</em></span></li>`]);
    for (const F of T.farm) for (const x of Object.values(F.mobs)) lines.push([`Map ${F.M.num}: ${F.M.name}`, `<li><i></i><span><b>${esc(x.e.name)}</b> <em>${gRows(x.e.tier)}</em><br>${x.cards.map(m => `<u style="color:${RC[CARDS[m.k].rarity]}">${esc(CARDS[m.k].name)}</u>${m.n > 1 ? ' x' + m.n : ''}`).join(', ')}</span></li>`]);
    lines.sort((a, z) => parseInt(a[0].slice(4)) - parseInt(z[0].slice(4)));
    const MAXL = 7; let html = '', last = '';
    for (const [m, li] of lines.slice(0, MAXL)) { if (m !== last) { html += `${last ? '</ul>' : ''}<h5>${esc(m)}</h5><ul>`; last = m; } html += li; } if (last) html += '</ul>';
    if (lines.length > MAXL) html += `<p>and ${lines.length - MAXL} more</p>`;
    if (T.anywhere.length) html += `<p>${T.anywhere.length} card${T.anywhere.length === 1 ? ' has' : 's have'} no named drop: any kill, or Ink.</p>`;
    if (!lines.length && !T.anywhere.length) html = '<p class="done">&#10003; You have every card' + (T.cx ? ' and the codex' : '') + '. Rank them up.</p>';
    el.innerHTML = `<div class="qh"><button type="button" data-qopen="1" title="Open the build">${esc(b.name)}</button><button type="button" data-qfold="1" title="${PL.fold ? 'Show' : 'Hide'} the list">${PL.fold ? '+' : '&minus;'}</button></div><div class="qp"><i style="width:${T.pr.need ? Math.round(100 * T.pr.have / T.pr.need) : 0}%"></i></div><div class="qs">${T.pr.have} / ${T.pr.need} cards${T.cx ? (T.hasCx ? ' &middot; codex &#10003;' : ' &middot; codex missing') : ''}</div>${PL.fold ? '' : html}`;
  }
  setInterval(() => { try { plTrack(false); } catch (e) {} }, 1200);
