  // ---------- guilds (tables: guilds, guild_members, guild_invites; players.power): Guildmaster Vorn in town
  // One guild per player. Leaders and officers invite; the invited player accepts; the roster shows power and last time online.
  const GUILD = { me: null, roster: [], invites: [], err: null, busy: false, loadedAt: 0 };
  const GUILD_COST = 50;
  const isSetupErr = (e) => e && /relation|does not exist|schema cache|column/i.test(e.message || '') ;
  async function guildLoad() {
    if (!supa || !supaUser) return;
    try {
      const me = supaUser.id;
      const { data: mem, error } = await supa.from('guild_members').select('guild_id,rank').eq('user_id', me).maybeSingle();
      if (error) { GUILD.err = isSetupErr(error) ? 'setup' : (error.message || 'error'); renderGuild(); return; }
      GUILD.err = null; GUILD.me = null; GUILD.roster = [];
      if (mem) {
        const { data: g } = await supa.from('guilds').select('id,name,leader,motd').eq('id', mem.guild_id).maybeSingle();
        if (g) {
          GUILD.me = { id: g.id, name: g.name, leader: g.leader, motd: g.motd || '', rank: mem.rank };
          const { data: ms } = await supa.from('guild_members').select('user_id,rank,joined_at').eq('guild_id', g.id);
          const ids = (ms || []).map(m => m.user_id);
          const { data: cards } = ids.length ? await supa.from('players').select('user_id,display_name,hero_name,hero_class,power,updated_at').in('user_id', ids) : { data: [] };
          GUILD.roster = (ms || []).map(m => Object.assign({ rank: m.rank, joined_at: m.joined_at }, (cards || []).find(c => c.user_id === m.user_id) || { user_id: m.user_id }));
        }
      }
      const { data: inv } = await supa.from('guild_invites').select('guild_id,invited_by,created_at').eq('user_id', me);
      const gids = (inv || []).map(i => i.guild_id);
      const { data: gs } = gids.length ? await supa.from('guilds').select('id,name').in('id', gids) : { data: [] };
      GUILD.invites = (inv || []).map(i => ({ guild_id: i.guild_id, name: ((gs || []).find(g => g.id === i.guild_id) || {}).name || 'A guild' }));
      GUILD.loadedAt = Date.now();
    } catch (e) { GUILD.err = String(e && e.message || e); }
    renderGuild(); if (typeof renderSocial === 'function') renderSocial();
  }
  const RANK_ORDER = { leader: 0, officer: 1, member: 2 };
  const agoText = (t) => { if (!t) return 'never'; const s = (Date.now() - new Date(t).getTime()) / 1000; return s < 120 ? 'just now' : s < 3600 ? Math.round(s / 60) + ' min ago' : s < 86400 ? Math.round(s / 3600) + ' h ago' : Math.round(s / 86400) + ' days ago'; };
  function renderGuild() {
    const el = $('hpGuild'); if (!el || el.hidden) return;
    if (!supa || !supaUser) { el.innerHTML = '<p>Sign in to join or create a guild.</p>'; return; }
    if (GUILD.err === 'setup') { el.innerHTML = `<p class="down">Guilds need a one-time database update. Open Supabase, then SQL Editor, New query, paste the file <b>supabase/schema.sql</b> from the game's repository, and press Run. Then reload the game.</p>`; return; }
    if (GUILD.err) { el.innerHTML = `<p class="down">Could not load guilds: ${esc(GUILD.err)}</p><button class="btn" data-g="reload">Try again</button>`; return; }
    const G = GUILD.me;
    if (!G) {
      el.innerHTML = `${GUILD.invites.length ? `<h3>Invitations</h3><div class="list">${GUILD.invites.map(i => `<div class="item" style="--rc:#7fd36a"><div class="ih"><b>${esc(i.name)}</b><span>wants you to join</span></div><div class="acts"><button class="btn primary" data-g="accept" data-id="${i.guild_id}">Join</button><button class="btn" data-g="decline" data-id="${i.guild_id}">Decline</button></div></div>`).join('')}</div>` : ''}
        <h3>Found a guild</h3><p class="savenote">A guild is a group of players with its own chat (/g) and roster. It costs ${GUILD_COST} gold from your bank (you have ${profile.gold}). You become its leader and can invite others.</p>
        <div class="namerow"><div class="field"><label for="gName">Guild name</label><input id="gName" maxlength="24" autocomplete="off" placeholder="3 to 24 characters"></div><button class="btn primary" data-g="create" ${profile.gold < GUILD_COST ? 'disabled' : ''}>Found guild (${GUILD_COST} gold)</button></div><p class="down" id="gMsg"></p>`;
      return;
    }
    const meRank = G.rank, off = meRank === 'leader' || meRank === 'officer';
    const rows = GUILD.roster.slice().sort((a, b) => RANK_ORDER[a.rank] - RANK_ORDER[b.rank] || (SOC.online.has(b.user_id) - SOC.online.has(a.user_id)) || (b.power || 0) - (a.power || 0));
    const nOn = rows.filter(r => SOC.online.has(r.user_id) || r.user_id === SOC.me).length;
    el.innerHTML = `<div class="ghead"><h3>${esc(G.name)}</h3><span class="muted">${rows.length} member${rows.length === 1 ? '' : 's'} &middot; ${nOn} online &middot; you are ${meRank}</span></div>
      ${G.motd ? `<p class="gmotd">${esc(G.motd)}</p>` : ''}
      <table class="groster"><thead><tr><th>Hero</th><th>Class</th><th>Power</th><th>Rank</th><th>Last online</th><th></th></tr></thead><tbody>${rows.map(r => { const on = SOC.online.has(r.user_id) || r.user_id === SOC.me, o = SOC.online.get(r.user_id);
        const name = (o && o.name) || r.hero_name || r.display_name || 'Unknown', cls = (o && o.cls) || r.hero_class || '';
        const acts = r.user_id === SOC.me ? '' : [meRank === 'leader' && r.rank === 'member' ? `<button class="pilebtn" data-g="promote" data-id="${r.user_id}">Make officer</button>` : '', meRank === 'leader' && r.rank === 'officer' ? `<button class="pilebtn" data-g="demote" data-id="${r.user_id}">Make member</button>` : '', meRank === 'leader' ? `<button class="pilebtn" data-g="lead" data-id="${r.user_id}">Make leader</button>` : '', off && RANK_ORDER[r.rank] > RANK_ORDER[meRank] ? `<button class="pilebtn" data-g="kick" data-id="${r.user_id}">Remove</button>` : ''].join(' ');
        return `<tr class="${on ? 'on' : ''}"><td><b style="color:${CC[cls] || 'var(--text)'}">${esc(name)}</b>${r.user_id === SOC.me ? ' <span class="muted">(you)</span>' : ''}</td><td>${esc(cls)}</td><td>${r.user_id === SOC.me && profile.chars[heroKey] ? CBHub.powerLevel(profile.chars[heroKey]) : (r.power || 0)}</td><td>${r.rank}</td><td>${on ? '<span class="up">Online</span>' : agoText(r.updated_at)}</td><td>${acts}</td></tr>`; }).join('')}</tbody></table>
      ${off ? `<div class="namerow" style="margin-top:10px"><div class="field"><label for="gInv">Invite a player (their hero name if online, or friend code)</label><input id="gInv" maxlength="24" autocomplete="off" placeholder="Name or friend code"></div><button class="btn primary" data-g="invite">Invite</button></div>` : ''}
      ${meRank === 'leader' ? `<div class="namerow"><div class="field"><label for="gMotd">Message of the day</label><input id="gMotd" maxlength="140" value="${esc(G.motd)}"></div><button class="btn" data-g="motd">Save</button></div>` : ''}
      <p class="down" id="gMsg"></p>
      <div class="row" style="display:flex;gap:8px;margin-top:6px">${meRank === 'leader' && rows.length > 1 ? '' : `<button class="btn" data-g="${meRank === 'leader' ? 'disband' : 'leave'}">${meRank === 'leader' ? 'Disband the guild' : 'Leave the guild'}</button>`}${meRank === 'leader' && rows.length > 1 ? '<span class="muted" style="font-size:12px">To leave, make someone else leader first.</span>' : ''}<button class="btn" data-g="reload">Refresh</button></div>
      <p class="savenote">Guild chat: type <b>/g</b> and your message.</p>`;
  }
  const gMsg = (t) => { const m = $('gMsg'); if (m) m.textContent = t; else toast(t); };
  async function guildAct(kind, id) {
    if (GUILD.busy) return; GUILD.busy = true;
    try {
      const me = supaUser.id, G = GUILD.me;
      if (kind === 'reload') {}
      else if (kind === 'create') {
        const name = ($('gName').value || '').trim().replace(/\s+/g, ' ');
        if (name.length < 3 || name.length > 24) return gMsg('Guild names need 3 to 24 characters.');
        if (profile.gold < GUILD_COST) return gMsg(`You need ${GUILD_COST} gold.`);
        const gid = (crypto.randomUUID && crypto.randomUUID()) || 'xxxxxxxx-xxxx-4xxx-8xxx-xxxxxxxxxxxx'.replace(/x/g, () => (Math.random() * 16 | 0).toString(16));
        let { error } = await supa.from('guilds').insert({ id: gid, name, leader: me });
        if (error) return gMsg(/duplicate|unique/i.test(error.message || '') ? 'That name is taken.' : 'Could not found the guild: ' + error.message);
        ({ error } = await supa.from('guild_members').insert({ user_id: me, guild_id: gid, rank: 'leader' }));
        if (error) { await supa.from('guilds').delete().eq('id', gid); return gMsg('Could not join your new guild: ' + error.message); }
        profile.gold -= GUILD_COST; save(); renderTownBar(); sysChat(`You founded the guild ${name}.`);
      }
      else if (kind === 'accept') {
        const { error } = await supa.from('guild_members').insert({ user_id: me, guild_id: id, rank: 'member' });
        if (error) return gMsg('Could not join: ' + error.message);
        await supa.from('guild_invites').delete().eq('user_id', me);
        guildPing(id); sysChat('You joined the guild.');
      }
      else if (kind === 'decline') await supa.from('guild_invites').delete().eq('user_id', me).eq('guild_id', id);
      else if (kind === 'invite') {
        const q = ($('gInv').value || '').trim(); if (!q) return gMsg('Type a hero name or friend code.');
        let target = null;
        const f = typeof findOnline === 'function' ? findOnline(q) : null; if (f && f.n.length === q.length) target = { id: f.o.uid, name: f.o.name };
        if (!target) { const { data } = await supa.from('players').select('user_id,hero_name,display_name').eq('friend_code', q.toUpperCase()).maybeSingle(); if (data) target = { id: data.user_id, name: data.hero_name || data.display_name }; }
        if (!target) return gMsg(`No online hero called "${q}" and no friend code like that.`);
        if (GUILD.roster.some(r => r.user_id === target.id)) return gMsg(`${target.name} is already in the guild.`);
        const { error } = await supa.from('guild_invites').insert({ guild_id: G.id, user_id: target.id, invited_by: me });
        if (error && !/duplicate|unique/i.test(error.message || '')) return gMsg('Could not invite: ' + error.message);
        if (socOn()) SOC.ch.send({ type: 'broadcast', event: 'guild', payload: { kind: 'invite', to: target.id, gname: G.name, from: SOC.me, name: (profile.chars[heroKey] || {}).name } });
        gMsg(`Invited ${target.name}.`); sysChat(`You invited ${target.name} to ${G.name}.`);
      }
      else if (kind === 'kick') { const { error } = await supa.from('guild_members').delete().eq('user_id', id).eq('guild_id', G.id); if (error) return gMsg(error.message); guildPing(G.id, id); }
      else if (kind === 'promote' || kind === 'demote') { const { error } = await supa.from('guild_members').update({ rank: kind === 'promote' ? 'officer' : 'member' }).eq('user_id', id).eq('guild_id', G.id); if (error) return gMsg(error.message); guildPing(G.id); }
      else if (kind === 'lead') {
        if (!confirm('Make them the guild leader? You become an officer.')) return;
        let { error } = await supa.from('guild_members').update({ rank: 'leader' }).eq('user_id', id).eq('guild_id', G.id); if (error) return gMsg(error.message);
        ({ error } = await supa.from('guilds').update({ leader: id }).eq('id', G.id)); if (error) return gMsg(error.message);
        await supa.from('guild_members').update({ rank: 'officer' }).eq('user_id', me).eq('guild_id', G.id); guildPing(G.id);
      }
      else if (kind === 'motd') { const { error } = await supa.from('guilds').update({ motd: ($('gMotd').value || '').slice(0, 140) }).eq('id', G.id); if (error) return gMsg(error.message); guildPing(G.id); }
      else if (kind === 'leave') { await supa.from('guild_members').delete().eq('user_id', me); guildPing(G.id); sysChat(`You left ${G.name}.`); }
      else if (kind === 'disband') { if (!confirm(`Disband ${G.name}? This cannot be undone.`)) return; await supa.from('guilds').delete().eq('id', G.id); guildPing(G.id); sysChat(`${G.name} was disbanded.`); }
      await guildLoad();
    } finally { GUILD.busy = false; }
  }
  function guildPing(gid, kicked) { if (socOn()) SOC.ch.send({ type: 'broadcast', event: 'guild', payload: { kind: 'update', gid, kicked, from: SOC.me } }); }
  function guildIn(p) {
    if (!p || p.from === SOC.me) return;
    if (p.kind === 'invite' && p.to === SOC.me) { sysChat(`${p.name || 'Someone'} invited you to the guild ${p.gname}. Visit Guildmaster Vorn in town to answer.`); guildLoad(); }
    if (p.kind === 'update' && GUILD.me && p.gid === GUILD.me.id) { if (p.kicked === SOC.me) sysChat('You were removed from the guild.'); guildLoad(); }
  }
  $('hpGuild').addEventListener('click', (ev) => { const b = ev.target.closest('[data-g]'); if (!b || b.disabled) return; guildAct(b.dataset.g, b.dataset.id); });
  $('hpGuild').addEventListener('keydown', (ev) => { if (ev.key !== 'Enter') return; if (ev.target.id === 'gName') guildAct('create'); if (ev.target.id === 'gInv') guildAct('invite'); if (ev.target.id === 'gMotd') guildAct('motd'); });
