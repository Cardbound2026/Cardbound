  // ---------- social: other players in Emberwatch, world chat, friends and parties (Supabase Realtime)
  // One shared channel. Presence says who is online and where; broadcasts carry movement, chat and party messages.
  const SOC = { ch: null, me: null, card: null, online: new Map(), others: new Map(), chat: [], friends: [], requestsIn: [], requestsOut: [], party: null, invites: [], lastPos: 0, retrackTimer: null };
  const PARTY_MAX = 4;
  const socOn = () => !!(SOC.ch && SOC.me);

  function rcOf(c) { const slot = sl => c.gear.find(g => g.slot === sl); const rc = sl => { const it = slot(sl); return it ? it.rarity : null; }; return { helm: rc('Helm'), chest: rc('Chest'), weapon: rc('Weapon'), cloak: rc('Cloak'), boots: rc('Boots') }; }
  function myPresence() {
    const c = profile.chars[heroCls];
    const place = !$('scrStart').hidden ? 'town' : run ? 'run' : 'menu';
    return { uid: SOC.me, name: c ? c.name : (supaUser ? acctName(supaUser) : 'Adventurer'), acct: supaUser ? acctName(supaUser) : '', cls: c ? heroCls : null, rc: c ? rcOf(c) : {}, place, x: P.x, y: P.y, dir: P.dir, party: SOC.party ? SOC.party.id : null };
  }

  async function socStart() {
    if (!supa || !supaUser || SOC.ch) return;
    SOC.me = supaUser.id;
    await saveCard();
    loadFriends();
    const ch = supa.channel('cb-world', { config: { presence: { key: SOC.me }, broadcast: { self: false } } });
    ch.on('presence', { event: 'sync' }, () => {
      const was = new Set(SOC.online.keys());
      SOC.online = new Map();
      for (const [k, arr] of Object.entries(ch.presenceState())) if (arr && arr.length) SOC.online.set(k, arr[arr.length - 1]);
      for (const f of SOC.friends) { const on = SOC.online.has(f.id); if (on && !was.has(f.id) && was.size) sysChat(`${f.name} came online.`); }
      syncOthers(); renderSocial();
    });
    ch.on('broadcast', { event: 'pos' }, ({ payload }) => moveOther(payload));
    ch.on('broadcast', { event: 'chat' }, ({ payload }) => addChat(payload));
    ch.on('broadcast', { event: 'invite' }, ({ payload }) => { if (payload.to === SOC.me) gotInvite(payload); });
    ch.on('broadcast', { event: 'invite-reply' }, ({ payload }) => { if (payload.to === SOC.me) gotReply(payload); });
    ch.on('broadcast', { event: 'party' }, ({ payload }) => gotParty(payload));
    ch.on('broadcast', { event: 'party-leave' }, ({ payload }) => gotLeave(payload));
    ch.on('broadcast', { event: 'friend-ping' }, ({ payload }) => { if (payload.to === SOC.me) { loadFriends(); sysChat(`${payload.name} sent you a friend request. Open Friends to accept it.`); } });
    ch.subscribe(async (status) => { if (status === 'SUBSCRIBED') { await ch.track(myPresence()); renderSocial(); } });
    SOC.ch = ch;
    SOC.friendTimer = setInterval(loadFriends, 30000);
    renderSocial();
  }
  async function socStop() {
    if (SOC.party) leaveParty(true);
    if (SOC.ch) { try { await SOC.ch.untrack(); await supa.removeChannel(SOC.ch); } catch (e) {} }
    clearInterval(SOC.friendTimer);
    Object.assign(SOC, { ch: null, me: null, card: null, online: new Map(), others: new Map(), friends: [], requestsIn: [], requestsOut: [], party: null, invites: [] });
    renderSocial();
  }
  // presence is re-sent at most every 2 seconds (hero, place, party); movement goes out as broadcasts
  function retrack(now) {
    if (!socOn()) return;
    clearTimeout(SOC.retrackTimer);
    SOC.retrackTimer = setTimeout(() => { if (socOn()) SOC.ch.track(myPresence()); }, now ? 0 : 2000);
  }
  function socPos() {
    if (!socOn() || $('scrStart').hidden) return;
    SOC.ch.send({ type: 'broadcast', event: 'pos', payload: { uid: SOC.me, x: P.x, y: P.y, dir: P.dir } });
    retrack();
  }

  // ---------- other players walking around town
  function syncOthers() {
    for (const [uid, st] of SOC.online) {
      if (uid === SOC.me || st.place !== 'town' || !st.cls) { SOC.others.delete(uid); continue; }
      const o = SOC.others.get(uid);
      if (!o) SOC.others.set(uid, { uid, x: st.x, y: st.y, fx: st.x, fy: st.y, t: 1, dir: st.dir || 'down', step: 0, name: st.name, cls: st.cls, rc: st.rc || {}, party: st.party });
      else Object.assign(o, { name: st.name, cls: st.cls, rc: st.rc || {}, party: st.party });
    }
    for (const uid of [...SOC.others.keys()]) if (!SOC.online.has(uid)) SOC.others.delete(uid);
  }
  function moveOther(p) {
    const o = SOC.others.get(p.uid); if (!o) return;
    const cur = otherPos(o);
    Object.assign(o, { fx: cur.x, fy: cur.y, x: p.x, y: p.y, t: 0, dir: p.dir, step: o.step + 1 });
  }
  function otherPos(o) { const k = Math.min(1, o.t); return { x: o.fx + (o.x - o.fx) * k, y: o.fy + (o.y - o.fy) * k }; }
  function updateOthers(dt) { for (const o of SOC.others.values()) if (o.t < 1) o.t += dt / STEP_MS; }
  function othersDrawList(TS, s, t) {
    const out = [];
    for (const o of SOC.others.values()) {
      const p = otherPos(o), moving = o.t < 1;
      const pal = palFor(o.cls, o.rc || {});
      out.push({ y: p.y + 0.5, f: () => {
        drawChar(gx, p.x * TS + TS / 2, p.y * TS + TS * 0.92, o.dir, moving ? ((o.step + (o.t > 0.5 ? 1 : 0)) % 2 ? 1 : 2) : 0, pal, s, t);
        gx.font = `600 ${Math.round(12 * Math.max(0.9, s))}px "Barlow Semi Condensed", sans-serif`; gx.textAlign = 'center';
        const w = gx.measureText(o.name).width + 10, tx = p.x * TS + TS / 2, ty = p.y * TS - TS * 0.12;
        gx.fillStyle = 'rgba(10,8,6,.78)'; gx.fillRect(tx - w / 2, ty - 13, w, 17);
        gx.fillStyle = SOC.party && SOC.party.members.some(m => m.uid === o.uid) ? '#7cc261' : '#ede3d0'; gx.fillText(o.name, tx, ty);
      } });
    }
    return out;
  }

  // ---------- world chat
  function addChat(m) {
    if (!m || !m.text) return;
    SOC.chat.push({ from: m.uid, name: String(m.name || '?').slice(0, 24), text: String(m.text).slice(0, 200), sys: !!m.sys, at: m.at || Date.now() });
    SOC.chat = SOC.chat.slice(-60); renderChat();
  }
  function sysChat(text) { addChat({ sys: true, name: '', text }); }
  function sendChat(text) {
    text = (text || '').trim().slice(0, 200); if (!text) return;
    if (!socOn()) { sysChat('Sign in to chat with other players.'); return; }
    const c = profile.chars[heroCls];
    const m = { uid: SOC.me, name: c ? c.name : acctName(supaUser), text, at: Date.now() };
    SOC.ch.send({ type: 'broadcast', event: 'chat', payload: m }); addChat(m);
  }
  function renderChat() {
    const el = $('chatLog'); if (!el) return;
    el.innerHTML = SOC.chat.map(m => m.sys ? `<div class="sys">${esc(m.text)}</div>` : `<div><b>${esc(m.name)}:</b> ${esc(m.text)}</div>`).join('') || `<div class="sys">${socOn() ? 'World chat. Say hello. Press T to type.' : 'Sign in to see other players and chat.'}</div>`;
    el.scrollTop = el.scrollHeight;
  }

  // ---------- friends (tables: players, friends)
  async function saveCard() {
    if (!supa || !supaUser) return;
    const c = profile.chars[heroCls];
    const row = { user_id: supaUser.id, display_name: acctName(supaUser).slice(0, 40), hero_name: c ? c.name : null, hero_class: c ? heroCls : null, updated_at: new Date().toISOString() };
    const { error } = await supa.from('players').upsert(row);
    if (error) { console.warn('players upsert', error); return; }
    const { data } = await supa.from('players').select('friend_code').eq('user_id', supaUser.id).maybeSingle();
    SOC.card = data || null; renderSocial();
  }
  async function loadFriends() {
    if (!supa || !supaUser) return;
    const { data: rows, error } = await supa.from('friends').select('*');
    if (error) { console.warn('friends', error); return; }
    const me = supaUser.id, ids = [...new Set((rows || []).map(r => r.user_id === me ? r.friend_id : r.user_id))];
    let cards = [];
    if (ids.length) { const r = await supa.from('players').select('user_id,display_name,hero_name,hero_class').in('user_id', ids); cards = r.data || []; }
    const card = (id) => cards.find(c => c.user_id === id) || { display_name: 'Unknown' };
    const label = (id) => { const c = card(id); return c.hero_name ? `${c.hero_name}` : c.display_name; };
    SOC.friends = (rows || []).filter(r => r.status === 'accepted').map(r => { const id = r.user_id === me ? r.friend_id : r.user_id; return { id, name: label(id), acct: card(id).display_name, cls: card(id).hero_class }; });
    SOC.requestsIn = (rows || []).filter(r => r.status === 'pending' && r.friend_id === me).map(r => ({ id: r.user_id, name: label(r.user_id), acct: card(r.user_id).display_name }));
    SOC.requestsOut = (rows || []).filter(r => r.status === 'pending' && r.user_id === me).map(r => ({ id: r.friend_id, name: label(r.friend_id), acct: card(r.friend_id).display_name }));
    renderSocial();
  }
  async function addFriend(code) {
    code = (code || '').trim().toUpperCase();
    if (!/^[A-Z0-9]{6}$/.test(code)) return 'Friend codes are 6 letters and numbers, like K7Q2MD.';
    const { data: p } = await supa.from('players').select('user_id,display_name,hero_name').eq('friend_code', code).maybeSingle();
    if (!p) return 'No player has that code. Check it and try again.';
    if (p.user_id === SOC.me) return "That's your own code.";
    if ([...SOC.friends, ...SOC.requestsOut].some(f => f.id === p.user_id)) return 'You already added them.';
    if (SOC.requestsIn.some(f => f.id === p.user_id)) { await acceptFriend(p.user_id); return null; }
    const { error } = await supa.from('friends').insert({ user_id: SOC.me, friend_id: p.user_id, status: 'pending' });
    if (error) return 'Could not send the request: ' + error.message;
    if (socOn()) { const c = profile.chars[heroCls]; SOC.ch.send({ type: 'broadcast', event: 'friend-ping', payload: { to: p.user_id, name: c ? c.name : acctName(supaUser) } }); }
    await loadFriends(); return null;
  }
  async function acceptFriend(id) { await supa.from('friends').update({ status: 'accepted' }).eq('user_id', id).eq('friend_id', SOC.me); await loadFriends(); }
  async function removeFriend(id) { await supa.from('friends').delete().eq('user_id', id).eq('friend_id', SOC.me); await supa.from('friends').delete().eq('user_id', SOC.me).eq('friend_id', id); await loadFriends(); }

  // ---------- parties: the inviter leads; up to 4 players
  const newPartyId = () => 'p' + Math.random().toString(36).slice(2, 10);
  function meMember() { const c = profile.chars[heroCls]; return { uid: SOC.me, name: c ? c.name : acctName(supaUser), cls: c ? heroCls : null }; }
  function invite(uid) {
    if (!socOn()) return;
    if (SOC.party && SOC.party.leader !== SOC.me) { toast('Only the party leader can invite.'); return; }
    if (!SOC.party) SOC.party = { id: newPartyId(), leader: SOC.me, members: [meMember()] };
    if (SOC.party.members.length >= PARTY_MAX) { toast('The party is full (4 players).'); return; }
    const c = profile.chars[heroCls];
    SOC.ch.send({ type: 'broadcast', event: 'invite', payload: { to: uid, from: SOC.me, name: c ? c.name : acctName(supaUser), partyId: SOC.party.id } });
    const f = SOC.friends.find(x => x.id === uid) || SOC.others.get(uid);
    sysChat(`Party invite sent to ${f ? f.name : 'player'}.`); retrack(true); renderSocial();
  }
  function gotInvite(p) {
    if (SOC.invites.some(i => i.from === p.from)) return;
    SOC.invites.push(p); sysChat(`${p.name} invited you to a party.`); renderSocial();
  }
  function answerInvite(from, accept) {
    const inv = SOC.invites.find(i => i.from === from); if (!inv) return;
    SOC.invites = SOC.invites.filter(i => i.from !== from);
    if (accept && SOC.party) leaveParty(true);
    SOC.ch.send({ type: 'broadcast', event: 'invite-reply', payload: Object.assign({ to: from, partyId: inv.partyId, accept }, meMember()) });
    renderSocial();
  }
  function gotReply(p) {
    if (!SOC.party || SOC.party.id !== p.partyId || SOC.party.leader !== SOC.me) return;
    if (!p.accept) { sysChat(`${p.name} declined the invite.`); return; }
    if (SOC.party.members.length >= PARTY_MAX || SOC.party.members.some(m => m.uid === p.uid)) return;
    SOC.party.members.push({ uid: p.uid, name: p.name, cls: p.cls });
    sysChat(`${p.name} joined the party.`); sendParty();
  }
  function sendParty() { if (socOn() && SOC.party) SOC.ch.send({ type: 'broadcast', event: 'party', payload: SOC.party }); retrack(true); renderSocial(); }
  function gotParty(pt) {
    if (!pt) return;
    const mine = SOC.party && SOC.party.id === pt.id;
    const inIt = pt.members && pt.members.some(m => m.uid === SOC.me);
    if (pt.disbanded) { if (mine) { SOC.party = null; sysChat('The party was disbanded.'); retrack(true); renderSocial(); } return; }
    if (inIt) { if (!mine) sysChat(`You joined ${pt.members.find(m => m.uid === pt.leader)?.name || 'the'}'s party.`); SOC.party = pt; retrack(true); renderSocial(); }
    else if (mine) { SOC.party = null; sysChat('You left the party.'); retrack(true); renderSocial(); }
  }
  function leaveParty(quiet) {
    if (!SOC.party) return;
    const pt = SOC.party; SOC.party = null;
    if (socOn()) {
      if (pt.leader === SOC.me) SOC.ch.send({ type: 'broadcast', event: 'party', payload: { id: pt.id, disbanded: true } });
      else SOC.ch.send({ type: 'broadcast', event: 'party-leave', payload: { partyId: pt.id, uid: SOC.me } });
    }
    if (!quiet) sysChat('You left the party.');
    retrack(true); renderSocial();
  }
  function gotLeave(p) {
    if (!SOC.party || SOC.party.id !== p.partyId || SOC.party.leader !== SOC.me) return;
    const m = SOC.party.members.find(x => x.uid === p.uid); if (!m) return;
    SOC.party.members = SOC.party.members.filter(x => x.uid !== p.uid);
    sysChat(`${m.name} left the party.`);
    if (SOC.party.members.length <= 1) { const id = SOC.party.id; SOC.party = null; if (socOn()) SOC.ch.send({ type: 'broadcast', event: 'party', payload: { id, disbanded: true } }); retrack(true); renderSocial(); }
    else sendParty();
  }
  function kick(uid) { if (!SOC.party || SOC.party.leader !== SOC.me) return; gotLeave({ partyId: SOC.party.id, uid }); }

  // ---------- social UI: town bar button, party panel, invite cards, Friends sheet
  function placeText(st) { return !st ? 'Offline' : st.place === 'town' ? 'In Emberwatch' : st.place === 'run' ? 'On the March' : 'Online'; }
  function renderSocial() {
    const nOn = SOC.friends.filter(f => SOC.online.has(f.id)).length;
    if ($('tbFriends')) { $('tbFriends').hidden = !supa; $('tbFriends').innerHTML = `Friends${SOC.requestsIn.length ? ` <b class="badge">${SOC.requestsIn.length}</b>` : ''} <span class="muted">${socOn() ? nOn + ' online' : 'sign in'}</span>`; }
    // party panel
    const pp = $('partyPanel');
    if (pp) {
      const pt = SOC.party;
      pp.hidden = !pt && !SOC.invites.length;
      pp.innerHTML = (pt ? `<div class="pph"><b>Party ${pt.members.length}/${PARTY_MAX}</b><button class="pilebtn" id="ppLeave">${pt.leader === SOC.me ? 'Disband' : 'Leave'}</button></div>` + pt.members.map(m => `<div class="ppm"><span class="dot ${SOC.online.has(m.uid) || m.uid === SOC.me ? 'on' : ''}"></span><b style="color:${CC[m.cls] || 'var(--text)'}">${esc(m.name)}</b>${m.uid === pt.leader ? ' <span class="muted">leader</span>' : ''}${pt.leader === SOC.me && m.uid !== SOC.me ? ` <button class="pilebtn" data-kick="${m.uid}">Remove</button>` : ''}</div>`).join('') + `<p class="muted" style="margin:4px 0 0;font-size:12px">Riding out together from the Wagon is coming next.</p>` : '')
        + SOC.invites.map(i => `<div class="ppinv"><span><b>${esc(i.name)}</b> invites you to a party</span><span><button class="btn primary" data-acc="${i.from}">Join</button> <button class="btn" data-dec="${i.from}">Decline</button></span></div>`).join('');
    }
    renderChat();
    if (!$('sheet').hidden && $('sheet').dataset.kind === 'friends') renderFriendsTab();
  }
  function renderFriendsTab() {
    const el = $('hpFriends'); if (!el) return;
    if (!supa) { el.innerHTML = '<p class="muted">Friends need the online version of the game.</p>'; return; }
    if (!supaUser) { el.innerHTML = `<p>Sign in to add friends, see who is online and form parties.</p><button class="btn primary" id="frSignIn">Sign in</button>`; $('frSignIn').onclick = signInModal; return; }
    const row = (f, actions) => { const st = SOC.online.get(f.id); return `<div class="frow"><span class="dot ${st ? 'on' : ''}"></span><div><b style="color:${CC[(st && st.cls) || f.cls] || 'var(--text)'}">${esc(f.name)}</b> <span class="muted">${esc(f.acct || '')}</span><br><small class="muted">${f.req ? 'Friend request' : placeText(st)}</small></div><div class="acts">${actions}</div></div>`; };
    const friends = SOC.friends.slice().sort((a, b) => (SOC.online.has(b.id) ? 1 : 0) - (SOC.online.has(a.id) ? 1 : 0) || a.name.localeCompare(b.name));
    const inParty = (id) => SOC.party && SOC.party.members.some(m => m.uid === id);
    el.innerHTML = `<div class="frgrid">
      <div class="panel"><h3>Your friend code</h3><div class="fcode">${esc(SOC.card ? SOC.card.friend_code : '......')}</div><button class="btn" id="frCopy">Copy code</button><p class="muted" style="font-size:13px">Send this to a friend. They type it under Add a friend.</p>
        <h3 style="margin-top:12px">Add a friend</h3><div class="namerow" style="margin:0"><input id="frCode" maxlength="6" placeholder="Their code" autocomplete="off" style="text-transform:uppercase;min-width:140px"><button class="btn primary" id="frAdd">Send request</button></div><p class="down" id="frMsg" style="margin:4px 0 0;min-height:18px;font-size:13px"></p></div>
      <div class="panel">
        ${SOC.requestsIn.length ? `<h3>Requests</h3>${SOC.requestsIn.map(f => row(Object.assign({ req: true }, f), `<button class="btn primary" data-fa="${f.id}">Accept</button><button class="btn" data-fr="${f.id}">Decline</button>`)).join('')}` : ''}
        <h3>Friends (${SOC.friends.filter(f => SOC.online.has(f.id)).length} online)</h3>
        ${friends.map(f => row(f, `${SOC.online.has(f.id) && !inParty(f.id) ? `<button class="btn primary" data-inv="${f.id}">Invite to party</button>` : inParty(f.id) ? '<span class="muted">In your party</span>' : ''}<button class="btn" data-fr="${f.id}">Remove</button>`)).join('') || '<p class="muted">No friends yet. Share your code, or add theirs.</p>'}
        ${SOC.requestsOut.length ? `<h3 style="margin-top:10px">Sent requests</h3>${SOC.requestsOut.map(f => row(Object.assign({ req: true }, f), `<button class="btn" data-fr="${f.id}">Cancel</button>`)).join('')}` : ''}
        ${[...SOC.others.values()].filter(o => !SOC.friends.some(f => f.id === o.uid)).length ? `<h3 style="margin-top:10px">Also in Emberwatch</h3>${[...SOC.others.values()].filter(o => !SOC.friends.some(f => f.id === o.uid)).map(o => row({ id: o.uid, name: o.name, cls: o.cls }, !inParty(o.uid) ? `<button class="btn" data-inv="${o.uid}">Invite to party</button>` : '')).join('')}` : ''}
      </div></div>`;
    $('frCopy').onclick = async () => { try { await navigator.clipboard.writeText(SOC.card ? SOC.card.friend_code : ''); $('frCopy').textContent = 'Copied'; } catch (e) { $('frCopy').textContent = 'Select and copy the code'; } };
    const add = async () => { $('frMsg').textContent = 'Sending...'; const err = await addFriend($('frCode').value); $('frMsg').textContent = err || 'Request sent. It appears in their Friends tab.'; $('frMsg').className = err ? 'down' : 'up'; };
    $('frAdd').onclick = add; $('frCode').onkeydown = (e) => { if (e.key === 'Enter') add(); };
  }
  document.addEventListener('click', (ev) => {
    const t = ev.target.closest('[data-inv],[data-fa],[data-fr],[data-acc],[data-dec],[data-kick],#ppLeave,#tbFriends'); if (!t) return;
    if (t.id === 'tbFriends') { openSheet('friends'); return; }
    if (t.id === 'ppLeave') { leaveParty(); return; }
    if (t.dataset.inv) invite(t.dataset.inv);
    if (t.dataset.fa) acceptFriend(t.dataset.fa);
    if (t.dataset.fr) removeFriend(t.dataset.fr);
    if (t.dataset.acc) answerInvite(t.dataset.acc, true);
    if (t.dataset.dec) answerInvite(t.dataset.dec, false);
    if (t.dataset.kick) kick(t.dataset.kick);
  });
