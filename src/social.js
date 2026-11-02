  // ---------- social: other players in Emberwatch, world chat, friends and parties (Supabase Realtime)
  // One shared channel. Presence says who is online and where; broadcasts carry movement, chat and party messages.
  const SOC = { ch: null, me: null, card: null, online: new Map(), others: new Map(), chat: [], friends: [], requestsIn: [], requestsOut: [], party: null, invites: [], lastPos: 0, retrackTimer: null };
  const PARTY_MAX = 10; // raids take up to 10; Wagon runs take up to 4 (WAGON_MAX)
  const WAGON_MAX = 4;
  const socOn = () => !!(SOC.ch && SOC.me);

  function rcOf(c) { const slot = sl => c.gear.find(g => g.slot === sl); const rc = sl => { const it = slot(sl); return it ? it.rarity : null; }; return { helm: rc('Helm'), chest: rc('Chest'), weapon: rc('Weapon'), cloak: rc('Cloak'), boots: rc('Boots') }; }
  // where I am, for friends and guildmates: "The Cinder Reach +2, row 12 (fighting)", "In Emberwatch", "Raiding ..."
  function whereText() {
    try {
      if (cb && cb.practice) return 'At the training dummy';
      if (cb && cb.raid) return `Raiding ${CB.RAID_NAMES[cb.raidMap] || 'a raid boss'} +${cb.level}${cb.over ? '' : ` (round ${cb.round})`}`;
      if (cb && cb.duel) return 'In a duel';
      if (run) { const row = run.currentRow(), boss = run.at && run.map.nodes[run.at].type === 'boss'; return run.over ? `${run.mapName} +${run.level}: heading home` : `${run.mapName} +${run.level}, ${boss ? 'at the boss' : row ? 'row ' + row : 'setting out'}${run.combat ? ' (fighting)' : ''}`; }
      if (!$('scrStart').hidden) return 'In Emberwatch';
      if (!$('scrTitle').hidden) return 'Choosing a hero';
    } catch (e) {}
    return 'Online';
  }
  // the gear other players see on your hero in town (Nov 2): slot, item name and rarity for every slot that shows on the sprite
  const LOOK_SLOTS = ['Helm', 'Chest', 'Shoulders', 'Gloves', 'Bracers', 'Belt', 'Pants', 'Boots', 'Cloak', 'Weapon', 'Off-hand'];
  function lookList(c) { return c ? (c.gear || []).filter(g => g && LOOK_SLOTS.includes(g.slot)).map(g => [g.slot, g.name, (g.rarity || 'White')[0]]) : null; }
  const RAR_OF = { W: 'White', G: 'Green', B: 'Blue', P: 'Purple (Epic)', C: 'Codex' };
  function lookGear(lk) { return (lk || []).map(([slot, name, r]) => ({ slot, name, rarity: RAR_OF[r] || 'White' })); }
  let lookSent = '';
  setInterval(() => { if (typeof socOn !== 'function' || !socOn() || !profile) return; const sig = JSON.stringify(lookList(profile.chars[heroKey])); if (sig !== lookSent) { lookSent = sig; retrack(); } }, 3000); // gear changed: let the town see it
  function myPresence() {
    const c = profile.chars[heroKey];
    const place = !$('scrStart').hidden ? 'town' : run ? 'run' : cb && cb.duel ? 'duel' : 'menu';
    return { lk: lookList(c), uid: SOC.me, guild: typeof GUILD !== 'undefined' && GUILD.me ? GUILD.me.name : null, name: c ? c.name : (supaUser ? acctName(supaUser) : 'Adventurer'), acct: supaUser ? acctName(supaUser) : '', cls: c ? c.cls : null, rc: c ? rcOf(c) : {}, place, where: whereText(), shop: typeof BZ !== 'undefined' && BZ.open ? { t: shopTitle(), n: bzState().items.length } : null, arena: typeof arenaPresence === 'function' ? arenaPresence() : null, x: P.x, y: P.y, dir: P.dir, mount: P.mount || null, title: c ? CBHub.titleOf(c, profile) || null : null, party: SOC.party ? SOC.party.id : null };
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
      if (typeof renderArena === 'function' && !$('sheet').hidden && $('sheet').dataset.kind === 'arena' && !AR.form) renderArena(); // the wager board stays live
    });
    ch.on('broadcast', { event: 'pos' }, ({ payload }) => moveOther(payload));
    ch.on('broadcast', { event: 'chat' }, ({ payload }) => chatIn(payload));
    ch.on('broadcast', { event: 'guild' }, ({ payload }) => guildIn(payload));
    ch.on('broadcast', { event: 'bazaar' }, ({ payload }) => bazaarIn(payload));
    ch.on('broadcast', { event: 'invite' }, ({ payload }) => { if (payload.to === SOC.me) gotInvite(payload); });
    ch.on('broadcast', { event: 'invite-reply' }, ({ payload }) => { if (payload.to === SOC.me) gotReply(payload); });
    ch.on('broadcast', { event: 'party' }, ({ payload }) => gotParty(payload));
    ch.on('broadcast', { event: 'party-leave' }, ({ payload }) => gotLeave(payload));
    ch.on('broadcast', { event: 'net' }, ({ payload }) => netIn(payload));
    ch.on('broadcast', { event: 'friend-ping' }, ({ payload }) => { if (payload.to === SOC.me) { loadFriends(); sysChat(`${payload.name} sent you a friend request. Open Friends to accept it.`); } });
    ch.subscribe(async (status) => { if (status === 'SUBSCRIBED') { SOC.trackAt = Date.now(); await ch.track(myPresence()); renderSocial(); } });
    // the party leader repeats the party now and then, so anyone who missed an update catches up
    if (!SOC.partyTimer) SOC.partyTimer = setInterval(() => { if (socOn() && SOC.party && SOC.party.leader === SOC.me && SOC.party.members.length > 1) SOC.ch.send({ type: 'broadcast', event: 'party', payload: SOC.party }); }, 20000);
    setTimeout(() => guildLoad(), 500);
    if (!SOC.cardTimer) SOC.cardTimer = setInterval(() => { if (supaUser) saveCard(); }, 5 * 60 * 1000); // keeps 'last online' fresh
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
  // Supabase allows each client only 5 presence updates per 30 seconds (and 100 messages a second for the whole project,
  // counting every delivery), so presence goes out at most every 8 seconds and town movement is batched (Oct 31)
  const TRACK_GAP = 8000, POS_GAP = 700;
  function retrack(now) {
    if (!socOn()) return;
    clearTimeout(SOC.retrackTimer);
    const wait = Math.max(now ? 0 : 2000, (SOC.trackAt || 0) + TRACK_GAP - Date.now());
    SOC.retrackTimer = setTimeout(() => { if (socOn()) { SOC.trackAt = Date.now(); SOC.ch.track(myPresence()); } }, wait);
  }
  // each step is buffered; every 0.7 s the steps go out as one message (only if someone else is in town to see them)
  function socPos() {
    if (!socOn() || $('scrStart').hidden) return;
    SOC.posBuf = SOC.posBuf || []; SOC.posBuf.push([P.x, P.y, P.dir]);
    if (!SOC.posTimer) SOC.posTimer = setTimeout(flushPos, POS_GAP);
    retrack();
  }
  function flushPos() {
    SOC.posTimer = null; const b = SOC.posBuf || []; SOC.posBuf = [];
    if (!b.length || !socOn() || !SOC.others.size) return;
    const last = b[b.length - 1];
    SOC.ch.send({ type: 'broadcast', event: 'pos', payload: { uid: SOC.me, x: last[0], y: last[1], dir: last[2], m: P.mount || null, path: b.slice(-6) } });
  }

  // ---------- other players walking around town
  function syncOthers() {
    for (const [uid, st] of SOC.online) {
      if (uid === SOC.me || st.place !== 'town' || !st.cls) { SOC.others.delete(uid); continue; }
      const o = SOC.others.get(uid);
      if (!o) SOC.others.set(uid, { uid, x: st.x, y: st.y, fx: st.x, fy: st.y, t: 1, dir: st.dir || 'down', step: 0, name: st.name, guild: st.guild || null, cls: st.cls, rc: st.rc || {}, lk: st.lk || null, party: st.party, shop: st.shop || null, mount: st.mount || null, title: st.title || null });
      else Object.assign(o, { guild: st.guild || null, name: st.name, cls: st.cls, rc: st.rc || {}, lk: st.lk || null, party: st.party, shop: st.shop || null, mount: st.mount || null, title: st.title || null });
    }
    for (const uid of [...SOC.others.keys()]) if (!SOC.online.has(uid)) SOC.others.delete(uid);
  }
  function moveOther(p) {
    const o = SOC.others.get(p.uid); if (!o) return; if ('m' in p) o.mount = p.m;
    o.q = o.q || []; for (const s of (p.path || [[p.x, p.y, p.dir]])) o.q.push(s);
    if (o.q.length > 8) { const s = o.q[o.q.length - 1]; o.q = []; Object.assign(o, { fx: s[0], fy: s[1], x: s[0], y: s[1], t: 1, dir: s[2] }); } // fell far behind: jump
  }
  function otherPos(o) { const k = Math.min(1, o.t); return { x: o.fx + (o.x - o.fx) * k, y: o.fy + (o.y - o.fy) * k }; }
  function updateOthers(dt) { for (const o of SOC.others.values()) { if (o.t < 1) o.t += dt / (o.mount ? STEP_MS / MOUNT_SPEED : STEP_MS); if (o.t >= 1 && o.q && o.q.length) { const s = o.q.shift(); Object.assign(o, { fx: o.x, fy: o.y, x: s[0], y: s[1], t: 0, dir: s[2] || o.dir, step: o.step + 1 }); } } }
  function othersDrawList(TS, s, t) {
    const out = [];
    for (const o of SOC.others.values()) {
      const p = otherPos(o), moving = o.t < 1;
      const pal = Object.assign(palFor(o.cls, o.rc || {}), o.lk ? { forge: { cls: o.cls, gear: lookGear(o.lk), who: o.uid } } : {}); // their real gear (src/forge.js)
      out.push({ y: p.y + 0.5, f: () => {
        if (o.mount) drawRider(gx, p.x * TS + TS / 2, p.y * TS + TS * 0.92, o.dir, moving ? ((o.step % 2) + o.t) / 2 : 0, pal, s, t, o.mount, CC[o.cls]);
        else drawChar(gx, p.x * TS + TS / 2, p.y * TS + TS * 0.92, o.dir, moving ? ((o.step + (o.t > 0.5 ? 1 : 0)) % 2 ? 1 : 2) : 0, pal, s, t);
        const tx = p.x * TS + TS / 2, ty = townTag(gx, tx, p.y * TS + TS * 0.92, o.name, SOC.party && SOC.party.members.some(m => m.uid === o.uid) ? '#7cc261' : '#ede3d0', o.guild, s, o.mount ? 72 + MOUNT_RISE : null, o.title);
        if (o.shop && o.shop.t) drawShopSign(gx, tx, ty - 4, o.shop.t, s);
      } });
    }
    return out;
  }

  // ---------- world chat
  // channels: world (default), /p party, /g guild, /w Name whisper, /r reply to the last whisper
  function addChat(m) {
    if (!m || !m.text) return;
    SOC.chat.push({ from: m.uid, name: String(m.name || '?').slice(0, 24), text: String(m.text).slice(0, 200), sys: !!m.sys, at: m.at || Date.now(), ch: m.ch || 'world', toName: m.toName, mine: m.uid === SOC.me, items: Array.isArray(m.items) ? m.items.slice(0, 3) : undefined });
    SOC.chat = SOC.chat.slice(-80); renderChat();
  }
  function sysChat(text) { addChat({ sys: true, name: '', text }); }
  function chatIn(m) {
    if (!m || m.uid === SOC.me) return;
    const ch = m.ch || 'world';
    if (ch === 'whisper') { if (m.to !== SOC.me) return; SOC.lastWhisper = { uid: m.uid, name: m.name }; }
    else if (ch === 'party') { if (!SOC.party || SOC.party.id !== m.pid) return; }
    else if (ch === 'guild') { const g = myGuild(); if (!g || g.id !== m.gid) return; }
    addChat(m);
  }
  const myGuild = () => (typeof GUILD !== 'undefined' && GUILD.me) || null;
  function findOnline(name) { // longest online name that the text starts with (names can contain spaces)
    const lower = name.toLowerCase(); let best = null;
    for (const o of SOC.online.values()) for (const n of [o.name, o.acct]) if (n && o.uid !== SOC.me && lower.startsWith(n.toLowerCase()) && (!best || n.length > best.n.length) && (lower.length === n.length || lower[n.length] === ' ')) best = { o, n };
    return best;
  }
  function sendChat(text) {
    text = (text || '').trim().slice(0, 240); if (!text) return;
    if (!socOn()) { sysChat('Sign in to chat with other players.'); return; }
    const c = profile.chars[heroKey], me = { uid: SOC.me, name: c ? c.name : acctName(supaUser), at: Date.now() };
    let m = null; const cmd = text.match(/^\/(\w+)\s*(.*)$/s);
    if (!cmd) m = Object.assign(me, { ch: 'world', text });
    else {
      const [, k, rest] = cmd, key = k.toLowerCase();
      if (key === 'help' || key === '?') { sysChat('Chat: just type for world chat. /p party, /g guild, /w Name message to whisper, /r reply to the last whisper, /world (or /s) world.'); return; }
      if (!rest.trim() && key !== 'help') { sysChat(`Type a message after /${k}.`); return; }
      if (key === 'world' || key === 's' || key === 'y') m = Object.assign(me, { ch: 'world', text: rest });
      else if (key === 'p' || key === 'party') { if (!SOC.party) { sysChat('You are not in a party.'); return; } m = Object.assign(me, { ch: 'party', pid: SOC.party.id, text: rest }); }
      else if (key === 'g' || key === 'guild') { const g = myGuild(); if (!g) { sysChat('You are not in a guild. Visit Guildmaster Strecks in town.'); return; } m = Object.assign(me, { ch: 'guild', gid: g.id, text: rest }); }
      else if (key === 'w' || key === 'whisper' || key === 'tell' || key === 'r') {
        let to, body;
        if (key === 'r') { if (!SOC.lastWhisper) { sysChat('Nobody has whispered you yet.'); return; } to = SOC.lastWhisper; body = rest; }
        else { const f = findOnline(rest); if (!f) { sysChat(`Nobody called "${rest.split(' ')[0]}" is online. Use /w Name message.`); return; } to = { uid: f.o.uid, name: f.o.name }; body = rest.slice(f.n.length).trim(); }
        if (!body) { sysChat('Type a message after the name.'); return; }
        m = Object.assign(me, { ch: 'whisper', to: to.uid, toName: to.name, text: body }); SOC.lastWhisper = SOC.lastWhisper || null;
      } else { sysChat(`Unknown command /${k}. Type /help.`); return; }
    }
    m.text = m.text.slice(0, 200);
    const links = (SOC.links || []).filter(l => m.text.includes(l.tok)).slice(0, 3); SOC.links = [];
    if (links.length) m.items = links.map(l => ({ tok: l.tok, it: l.it }));
    SOC.ch.send({ type: 'broadcast', event: 'chat', payload: m }); addChat(m);
  }
  // ---------- item links: shift-click any item (stash, shop, loot, gear slot...) to drop "[Item name]" into the chat box;
  // the item travels with the message and anyone can click the name to see it
  const ILINK = new Map(); let ilinkN = 0;
  function linkKey(it) { if (ILINK.size > 1500) ILINK.clear(); const k = 'L' + (ilinkN++); ILINK.set(k, it); return k; }
  function linkName(it) { return it.kind === 'card' ? (CARDS[it.key] ? CARDS[it.key].name : 'Card') + (it.rank ? ' +' + it.rank : '') : it.name || 'Item'; }
  function slimItem(it) { const o = JSON.parse(JSON.stringify(it)); for (const k of ['id', 'price', 'sold', 'test']) delete o[k]; return o; }
  function insertLink(it) {
    const box = $('chatIn'); if (!box) return;
    const tok = `[${linkName(it)}]`;
    SOC.links = (SOC.links || []).filter(l => l.tok !== tok).slice(-4); SOC.links.push({ tok, it: slimItem(it) });
    box.value = (box.value && !/\s$/.test(box.value) ? box.value + ' ' : box.value) + tok + ' ';
    box.focus(); box.setSelectionRange(box.value.length, box.value.length);
  }
  document.addEventListener('click', (ev) => {
    if (!ev.shiftKey) return;
    const a = ev.target.closest('[data-ilink],[data-tip],[data-cardinfo],[data-cxcard],[data-dcard]'); if (!a) return;
    let it = null;
    if (a.dataset.ilink) it = ILINK.get(a.dataset.ilink);
    else if (a.dataset.tip) it = ((typeof TIPS !== 'undefined' && TIPS.get(a.dataset.tip)) || {}).it;
    else if (a.dataset.cardinfo) it = { kind: 'card', key: a.dataset.cardinfo, rank: +a.dataset.cardrank || 0 }; // cards link too (Scribe, deck, Compendium)
    else if (a.dataset.cxcard) it = { kind: 'card', key: a.dataset.cxcard, rank: 0 };
    else if (a.dataset.dcard) { const c = profile.chars[heroKey], k = c && [...c.deck, ...c.cards].find(x => x.id === a.dataset.dcard); if (k) it = { kind: 'card', key: k.key, rank: k.rank || 0 }; }
    if (!it || (it.kind === 'card' && !CARDS[it.key])) return;
    ev.preventDefault(); ev.stopPropagation(); insertLink(it);
  }, true);
  document.addEventListener('click', (ev) => { const a = ev.target.closest('[data-chatlink]'); if (!a) return; const [i, j] = a.dataset.chatlink.split(':').map(Number); const m = SOC.chat[i], l = m && m.items && m.items[j]; if (l && l.it) showLinked(l.it); });
  // click a dropped card (loot screens, sack, trades...) to see it big; click anywhere to close
  const zoom = document.createElement('div'); zoom.id = 'cardZoom'; zoom.hidden = true; document.body.appendChild(zoom);
  zoom.addEventListener('click', () => { zoom.hidden = true; });
  document.addEventListener('keydown', (ev) => { if (ev.key === 'Escape' && !zoom.hidden) { zoom.hidden = true; ev.cbHandled = true; ev.stopPropagation(); } }, true);
  document.addEventListener('click', (ev) => {
    if (ev.shiftKey || ev.target.closest('button, input, #cardZoom')) return;
    const a = ev.target.closest('.item[data-ilink]'); if (!a) return; const it = ILINK.get(a.dataset.ilink); if (!it || it.kind !== 'card' || !CARDS[it.key]) return;
    zoom.innerHTML = `<div class="zoomin">${cardBox(CB.rankedCard(it.key, it.rank || 0), 300)}<p>${esc(CARDS[it.key].rarity)} ${esc(CARDS[it.key].cls || '')} card &middot; click anywhere to close</p></div>`; zoom.hidden = false; fitCards(zoom); requestAnimationFrame(() => fitCards(zoom));
  });
  function showLinked(it) {
    const body = it.kind === 'card' ? (cardBox(CB.rankedCard(it.key, it.rank || 0), 230) || itemHtml(it)) : itemHtml(it);
    modal(`<h2>${esc(linkName(it))}</h2><div class="linkview">${body}</div><p class="muted" style="font-size:13px">Linked in chat. Shift-click your own items to link them.</p><div class="row"><button class="btn primary" id="mClose">Close</button></div>`);
    fitCards($('modalBox')); $('mClose').onclick = closeModal;
  }
  const CHAN = { world: ['', ''], party: ['[Party] ', 'cparty'], guild: ['[Guild] ', 'cguild'], whisper: ['', 'cwhisper'] };
  function renderChat() {
    const el = $('chatLog'); if (!el) return;
    el.innerHTML = SOC.chat.map((m, i) => { if (m.sys) return `<div class="sys">${esc(m.text)}</div>`; const [tag, cls] = CHAN[m.ch] || CHAN.world;
      const who = m.ch === 'whisper' ? (m.mine ? `To ${esc(m.toName || '?')}` : `From ${esc(m.name)}`) : esc(m.name);
      let body = esc(m.text); (m.items || []).forEach((l, j) => { if (!l || !l.it || !l.tok) return; const r = l.it.kind === 'card' ? (CARDS[l.it.key] || {}).rarity : l.it.rarity; body = body.split(esc(l.tok)).join(`<a class="ilink" data-chatlink="${i}:${j}" style="color:${RC[r] || 'var(--accent)'}" role="button" tabindex="0">${esc(l.tok)}</a>`); });
      return `<div class="${cls}">${tag}<b>${who}:</b> ${body}</div>`; }).join('') || `<div class="sys">${socOn() ? 'World chat. Say hello. Press T to type, /help for channels.' : 'Sign in to see other players and chat.'}</div>`;
    el.scrollTop = el.scrollHeight;
  }

  // ---------- friends (tables: players, friends)
  async function saveCard() {
    if (!supa || !supaUser) return;
    const c = profile.chars[heroKey];
    const row = { user_id: supaUser.id, display_name: acctName(supaUser).slice(0, 40), hero_name: c ? c.name : null, hero_class: c ? c.cls : null, updated_at: new Date().toISOString() };
    if (SOC.hasPower !== false && c) row.power = CBHub.powerLevel(c);
    let { error } = await supa.from('players').upsert(row);
    if (error && 'power' in row && /power|column/i.test(error.message || '')) { SOC.hasPower = false; delete row.power; ({ error } = await supa.from('players').upsert(row)); }
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
    if (socOn()) { const c = profile.chars[heroKey]; SOC.ch.send({ type: 'broadcast', event: 'friend-ping', payload: { to: p.user_id, name: c ? c.name : acctName(supaUser) } }); }
    await loadFriends(); return null;
  }
  async function acceptFriend(id) { await supa.from('friends').update({ status: 'accepted' }).eq('user_id', id).eq('friend_id', SOC.me); await loadFriends(); }
  async function removeFriend(id) { await supa.from('friends').delete().eq('user_id', id).eq('friend_id', SOC.me); await supa.from('friends').delete().eq('user_id', SOC.me).eq('friend_id', id); await loadFriends(); }

  // ---------- parties: the inviter leads; up to 4 players
  const newPartyId = () => 'p' + Math.random().toString(36).slice(2, 10);
  function meMember() { const c = profile.chars[heroKey]; return { uid: SOC.me, name: c ? c.name : acctName(supaUser), cls: c ? c.cls : null }; }
  function invite(uid) {
    if (!socOn()) return;
    if (SOC.party && SOC.party.leader !== SOC.me) { toast('Only the party leader can invite.'); return; }
    if (!SOC.party) SOC.party = { id: newPartyId(), leader: SOC.me, members: [meMember()] };
    if (SOC.party.members.length >= PARTY_MAX) { toast(`The party is full (${PARTY_MAX} players).`); return; }
    const c = profile.chars[heroKey];
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
    const msg = { type: 'broadcast', event: 'invite-reply', payload: Object.assign({ to: from, partyId: inv.partyId, accept }, meMember()) };
    SOC.ch.send(msg);
    // messages can get lost: keep answering until the party shows up with us in it (up to 15 s)
    if (accept) { clearInterval(SOC.joinTimer); let n = 0; SOC.joinTimer = setInterval(() => { if ((SOC.party && SOC.party.id === inv.partyId) || ++n > 5 || !socOn()) { clearInterval(SOC.joinTimer); if (n > 5 && !(SOC.party && SOC.party.id === inv.partyId)) sysChat('The party invite answer did not get through. Ask for a new invite.'); return; } SOC.ch.send(msg); }, 3000); }
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
  function placeText(st) { return !st ? 'Offline' : st.where ? st.where : st.place === 'town' ? 'In Emberwatch' : st.place === 'run' ? 'On the March' : st.place === 'duel' ? 'In a duel' : 'Online'; }
  function renderSocial() {
    const nOn = SOC.friends.filter(f => SOC.online.has(f.id)).length;
    if ($('tbFriends')) { $('tbFriends').hidden = !supa; $('tbFriends').innerHTML = `Friends${SOC.requestsIn.length ? ` <b class="badge">${SOC.requestsIn.length}</b>` : ''} <span class="muted">${socOn() ? nOn + ' online' : 'sign in'}</span>`; }
    // party panel
    const pp = $('partyPanel');
    if (pp) {
      const pt = SOC.party;
      pp.hidden = !pt && !SOC.invites.length && !NET.duelIn.length && !TR.inv.length;
      const canDuel = (m) => m.uid !== SOC.me && SOC.online.has(m.uid) && SOC.online.get(m.uid).place === 'town' && !NET.s && !NET.duelOut;
      pp.innerHTML = (pt ? `<div class="pph"><b>Party ${pt.members.length}/${PARTY_MAX}</b><button class="pilebtn" id="ppLeave">${pt.leader === SOC.me ? 'Disband' : 'Leave'}</button></div>` + pt.members.map(m => `<div class="ppm"><span class="dot ${SOC.online.has(m.uid) || m.uid === SOC.me ? 'on' : ''}"></span><b style="color:${CC[m.cls] || 'var(--text)'}">${esc(m.name)}</b>${m.uid === pt.leader ? ' <span class="muted">leader</span>' : ''}${m.uid !== SOC.me && SOC.online.has(m.uid) ? ` <button class="pilebtn" data-insp="${m.uid}" title="See their gear and deck">Inspect</button>` : ''}${canDuel(m) ? ` <button class="pilebtn" data-duel="${m.uid}" title="Challenge to a duel">Duel</button>` : NET.duelOut === m.uid ? ' <span class="muted">challenged...</span>' : ''}${pt.leader === SOC.me && m.uid !== SOC.me ? ` <button class="pilebtn" data-kick="${m.uid}">Remove</button>` : ''}</div>`).join('') + `<p class="muted" style="margin:4px 0 0;font-size:12px">${pt.leader === SOC.me ? 'Talk to the Wagoneer to set out together.' : 'The leader sets out from the Wagon; you ride along.'}</p>` : '')
        + tradeInvitesHtml() + NET.duelIn.map(d => `<div class="ppinv"><span><b>${esc(d.name)}</b> challenges you to a duel</span><span><button class="btn primary" data-dacc="${d.from}">Fight</button> <button class="btn" data-ddec="${d.from}">Decline</button></span></div>`).join('')
        + SOC.invites.map(i => `<div class="ppinv"><span><b>${esc(i.name)}</b> invites you to a party</span><span><button class="btn primary" data-acc="${i.from}">Join</button> <button class="btn" data-dec="${i.from}">Decline</button></span></div>`).join('');
    }
    renderChat();
    if (!$('sheet').hidden && $('sheet').dataset.kind === 'friends') renderFriendsTab();
    if (!$('sheet').hidden && $('sheet').dataset.kind === 'wagon' && !run && !cb) renderHub();
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
        ${friends.map(f => row(f, `${canGuildInvite(f.id) ? `<button class="btn" data-ginv="${f.id}">Invite to guild</button>` : ''}${SOC.online.has(f.id) ? `<button class="btn" data-whisper="${f.id}">Message</button><button class="btn" data-insp="${f.id}">Inspect</button><button class="btn" data-trade="${f.id}">Trade</button>` : ''}${SOC.online.has(f.id) && !inParty(f.id) ? `<button class="btn primary" data-inv="${f.id}">Invite to party</button>` : inParty(f.id) ? '<span class="muted">In your party</span>' : ''}<button class="btn" data-fr="${f.id}">Remove</button>`)).join('') || '<p class="muted">No friends yet. Share your code, or add theirs.</p>'}
        ${SOC.requestsOut.length ? `<h3 style="margin-top:10px">Sent requests</h3>${SOC.requestsOut.map(f => row(Object.assign({ req: true }, f), `<button class="btn" data-fr="${f.id}">Cancel</button>`)).join('')}` : ''}
        ${[...SOC.others.values()].filter(o => !SOC.friends.some(f => f.id === o.uid)).length ? `<h3 style="margin-top:10px">Also in Emberwatch</h3>${[...SOC.others.values()].filter(o => !SOC.friends.some(f => f.id === o.uid)).map(o => row({ id: o.uid, name: o.name, cls: o.cls }, !inParty(o.uid) ? `<button class="btn" data-inv="${o.uid}">Invite to party</button>` : '')).join('')}` : ''}
      </div></div>`;
    $('frCopy').onclick = async () => { try { await navigator.clipboard.writeText(SOC.card ? SOC.card.friend_code : ''); $('frCopy').textContent = 'Copied'; } catch (e) { $('frCopy').textContent = 'Select and copy the code'; } };
    const add = async () => { $('frMsg').textContent = 'Sending...'; const err = await addFriend($('frCode').value); $('frMsg').textContent = err || 'Request sent. It appears in their Friends tab.'; $('frMsg').className = err ? 'down' : 'up'; };
    $('frAdd').onclick = add; $('frCode').onkeydown = (e) => { if (e.key === 'Enter') add(); };
  }
  // start a whisper: fills the chat box with "/w Name " and puts the cursor there
  function whisperTo(uid) {
    const st = SOC.online.get(uid), f = SOC.friends.find(x => x.id === uid), name = (st && st.name) || (f && f.name);
    if (!name || !SOC.online.has(uid)) { toast('They are not online.'); return; }
    if (!$('talk').hidden) closeTalk();
    if (!$('sheet').hidden) closeSheet();
    const box = $('chatIn'); box.value = `/w ${name} `; box.focus(); box.setSelectionRange(box.value.length, box.value.length);
  }
  document.addEventListener('click', (ev) => { const w = ev.target.closest('[data-whisper]'); if (w) { ev.stopPropagation(); whisperTo(w.dataset.whisper); } }, true);
  document.addEventListener('click', (ev) => {
    const t = ev.target.closest('[data-inv],[data-fa],[data-fr],[data-acc],[data-dec],[data-kick],[data-duel],[data-dacc],[data-ddec],#ppLeave,#tbFriends'); if (!t) return;
    if (t.dataset.duel) { challenge(t.dataset.duel); return; }
    if (t.dataset.dacc) { answerDuel(t.dataset.dacc, true); return; }
    if (t.dataset.ddec) { answerDuel(t.dataset.ddec, false); return; }
    if (t.id === 'tbFriends') { openSheet('friends'); return; }
    if (t.id === 'ppLeave') { leaveParty(); return; }
    if (t.dataset.inv) invite(t.dataset.inv);
    if (t.dataset.fa) acceptFriend(t.dataset.fa);
    if (t.dataset.fr) removeFriend(t.dataset.fr);
    if (t.dataset.acc) answerInvite(t.dataset.acc, true);
    if (t.dataset.dec) answerInvite(t.dataset.dec, false);
    if (t.dataset.kick) kick(t.dataset.kick);
  });
