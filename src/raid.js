  // ---------- raids: Raid Warden Bagadee in town. One raid per map, 2 to 10 heroes, unlocked by beating that map's boss.
  // You can raid at any level up to the highest level you beat the map's boss on. Killing a raid boss locks that hero
  // out of that raid for 7 days; wipes cost nothing and can be retried as often as you like.
  // In the fight everyone plays at the same time; the boss acts once every hero has ended their turn (engine: opts.raid).
  // Loot: one item per hero plus one, and a codex. Everyone rolls Need / Greed / Pass on each item; ties are settled with 1-100 dice in chat.
  const RAIDS = { lvl: {} };
  const raidLockLeft = (c, mk) => { const t = c && c.raidLocks && c.raidLocks[mk]; return t ? Math.max(0, t + CB.RAID.lockMs - Date.now()) : 0; };
  const raidBest = (c, mk) => { const k = c && c.mapKills && c.mapKills[mk]; return k == null ? -1 : k; };
  function fmtLeft(ms) { const h = Math.ceil(ms / 3600000); return h > 48 ? Math.ceil(h / 24) + ' days' : h + ' hours'; }
  // why this hero can't raid this map at this level (null = can)
  function raidBlock(c, mk, lvl) {
    const M = DATA.maps[mk]; if (!c) return 'has no hero';
    const best = raidBest(c, mk), boss = DATA.enemies[M.boss].name.split(',')[0];
    if (best < 0) return `has not beaten ${boss} on ${M.name} yet`;
    if (lvl > best) return `has only beaten ${boss} up to +${best} on ${M.name}`;
    const left = raidLockLeft(c, mk); if (left) return `already killed this raid boss this week (locked out for ${fmtLeft(left)})`;
    return null;
  }
  function renderRaid() {
    const el = $('hpRaid'); if (!el) return;
    const c = profile.chars[heroKey], pt = typeof SOC !== 'undefined' && SOC.party, n = pt ? pt.members.length : 1, lead = !pt || pt.leader === SOC.me;
    const partyLine = !socOn() ? 'You are not connected to the online world: raids need a party of 2 to 10 players.'
      : !pt || n < CB.RAID.min ? `Raids need a party of ${CB.RAID.min} to ${CB.RAID.max} players. You can invite from the Friends list or the chat (right-click a name).`
      : `Your party: ${pt.members.map(m => esc(m.name)).join(', ')} (${n}/${CB.RAID.max}).${lead ? '' : ' Only the party leader can start a raid.'}`;
    el.innerHTML = `<div class="panel"><h3>Raids</h3>
      <p class="muted" style="margin:0 0 6px">Each road has a raid boss: its warlord, back and bigger. Beat the road's boss to unlock its raid at that level (or any level below). Every hero in the party must have unlocked it.</p>
      <ul class="raidrules">
        <li><b>2 to 10 heroes.</b> The boss gets more HP for each hero (and a little more mana from 3 on). Each extra hero adds one more piece of loot.</li>
        <li><b>Everyone plays at once.</b> No turn order: all heroes play their hands, and the boss acts once everyone has ended their turn.</li>
        <li><b>Every boss attack hits the whole raid.</b> Its debuffs land on everyone too.</li>
        <li><b>Debuff resistant.</b> Only one hero a round can land non-damaging debuffs on it (Weak, Vulnerable, Slow, Chill, mana burn, discards...). The first hero to debuff it each round claims that round. Damage always lands, but raid bosses shrug off 25% of damage over time (Bleed, Poison, Burn).</li>
        <li><b>Weekly lockout.</b> Killing a raid boss locks that hero out of that raid for 7 days. Wiping costs nothing (no gear or gold lost): try as often as you like.</li>
        <li><b>Loot is rolled.</b> Everyone picks Need, Greed or Pass on each item. Everyone who wants it rolls 1-100 (shown on the loot screen and in chat); the highest Need wins, or the highest Greed if nobody needs it.</li>
      </ul>
      <p class="${n >= CB.RAID.min && lead ? '' : 'alert'}" style="margin:6px 0">${partyLine}</p></div>
      <div class="raidlist">${Object.values(DATA.maps).map(M => {
        const mk = M.key, best = raidBest(c, mk), left = raidLockLeft(c, mk), lv = Math.max(0, Math.min(best, RAIDS.lvl[mk] != null ? RAIDS.lvl[mk] : best));
        const bossE = DATA.enemies[M.boss], name = CB.RAID_NAMES[mk] || bossE.name, rbHp = DATA.enemies[CB.raidBoss(DATA, mk)].hp / bossE.hp, rbDmg = DATA.enemies[CB.raidKey(mk)].raidDmg || 1;
        const state = best < 0 ? `<span class="tag bad">Locked</span> Beat ${esc(bossE.name.split(',')[0])} on ${esc(M.name)} to unlock.` : left ? `<span class="tag bad">Killed this week</span> Back in ${fmtLeft(left)}.` : `<span class="tag good">Unlocked</span> up to +${best}.`;
        const can = best >= 0 && !left && socOn() && pt && n >= CB.RAID.min && n <= CB.RAID.max && lead;
        return `<div class="panel raidrow" data-raid="${mk}"><div class="raidhead"><b>${esc(name)}</b><span class="muted">Map ${M.num}: ${esc(M.name)}</span></div>
          <div class="muted">${state}</div>
          ${best >= 0 ? `<div class="field" style="margin:6px 0"><label>Level <b>+${lv}</b> &middot; boss HP x${(Math.pow(1.5, lv) * rbHp * n).toFixed(1)} for ${n} hero${n > 1 ? 'es' : ''}, damage x${(Math.pow(1.3, lv) * CB.RAID.dmg * rbDmg).toFixed(2)}</label><input type="range" min="0" max="${best}" step="1" value="${lv}" data-raidlvl="${mk}" ${best > 0 ? '' : 'disabled'}></div>` : ''}
          <div class="row"><button class="btn ${can ? 'primary' : ''}" data-raidgo="${mk}" ${can ? '' : 'disabled'}>Start the raid</button><button class="btn" data-raidinfo="${mk}">Look at the boss</button></div></div>`;
      }).join('')}</div>`;
  }
  $('hpRaid').addEventListener('input', (ev) => { const r = ev.target.closest('[data-raidlvl]'); if (r) { RAIDS.lvl[r.dataset.raidlvl] = +r.value; renderRaid(); const again = $('hpRaid').querySelector(`[data-raidlvl="${r.dataset.raidlvl}"]`); if (again) again.focus(); } });
  $('hpRaid').addEventListener('click', (ev) => {
    const g = ev.target.closest('[data-raidgo]'), info = ev.target.closest('[data-raidinfo]');
    if (info) { const k = CB.raidBoss(DATA, info.dataset.raidinfo); if (typeof lootModal === 'function') lootModal(k); return; }
    if (!g) return;
    const mk = g.dataset.raidgo, c = profile.chars[heroKey], best = raidBest(c, mk), lvl = Math.max(0, Math.min(best, RAIDS.lvl[mk] != null ? RAIDS.lvl[mk] : best));
    const why = raidBlock(c, mk, lvl); if (why) return toast(`Your hero ${why}.`);
    if (!SOC.party || SOC.party.leader !== SOC.me) return toast('Only the party leader can start a raid.');
    const n = SOC.party.members.length; if (n < CB.RAID.min || n > CB.RAID.max) return toast(`Raids take ${CB.RAID.min} to ${CB.RAID.max} heroes.`);
    $('sheet').hidden = true; netStart('raid', SOC.party.members.map(m => m.uid), lvl, mk);
  });

  // ---------- after the fight
  function raidLootRoll(cbt) {
    const mk = cbt.raidMap, bk = CB.raidKey(mk), d = DATA.enemies[bk], rng = cbt.rng, lvl = cbt.level + 2, out = []; // +2 map levels = item levels 10 above what the map's boss drops
    const nItems = cbt.players.length + 1;
    for (let i = 0; i < nItems; i++) { const rar = rng() < Math.min(0.3, 0.1 + 0.01 * cbt.level) ? 'Purple (Epic)' : 'Blue'; /* each piece rolls on its own: 10% Epic at +0, +1% per level (max 30%) */ const it = CB.rollItem(DATA, rng, d.pool[Math.floor(rng() * d.pool.length)], rar, lvl); if (it) out.push(Object.assign(it, { raid: d.name })); }
    const cx = (d.loot || []).filter(x => x.type === 'Codex').map(x => Object.keys(CB.CODEX_BY_KEY).find(k => CB.CODEX_BY_KEY[k].name + ' Codex' === x.item)).filter(Boolean);
    if (cx.length) out.push(Object.assign(CB.makeCodex(DATA, rng, cx[Math.floor(rng() * cx.length)], lvl), { raid: d.name }));
    return out.map(it => ({ it, votes: {}, done: false, winner: null }));
  }
  // the Chronicler keeps raids too, with the fight's damage meter
  function raidHistory(won) {
    if (cb._hist) return;
    const c = profile.chars[heroKey], r = (o) => Object.fromEntries(Object.entries(o || {}).filter(x => x[1] > 0).map(([k, v]) => [k, Math.round(v)]));
    const meter = Object.values(cb.meter || {}).map(m => ({ id: m.id, name: m.name, isPlayer: m.isPlayer, cls: m.cls, dealt: r(m.dealt), healed: r(m.healed), taken: r(m.taken), absorbed: Math.round(m.absorbed || 0) }));
    const h = cb._hist = { raid: true, result: won ? 'raid-win' : 'raid-loss', boss: CB.RAID_NAMES[cb.raidMap] || 'Raid boss', map: cb.raidMap, level: cb.level, cls: c ? c.cls : '', name: c ? c.name : '', party: cb.players.map(p => p.cls), rounds: cb.round, meter: meter.length ? meter : undefined, loot: won ? 0 : undefined, at: Date.now() };
    profile.history.unshift(h); profile.history = profile.history.slice(0, 20); save();
  }
  function raidOver() {
    const S = NET.s, won = cb.over === 'win', mk = cb.raidMap, c = profile.chars[heroKey];
    raidHistory(won);
    if (!won) {
      modal(`<h2 class="loss">The raid falls</h2><p>${esc(CB.RAID_NAMES[mk] || 'The boss')} wiped the raid in ${cb.round} rounds. Nothing is lost: no gear, no gold, and no lockout. Regroup and try again.</p><div class="row"><button class="btn primary" id="mNew">Back to Emberwatch</button><button class="btn" id="mClose">Look at the fight</button></div>`);
      $('mNew').onclick = backToTown; $('mClose').onclick = closeModal; return;
    }
    if (c && !cb._locked) { cb._locked = true; c.raidLocks = c.raidLocks || {}; c.raidLocks[mk] = Date.now(); c.raidKills = (c.raidKills || 0) + 1; save(); }
    if (!cb.raidLoot) { cb.raidLoot = raidLootRoll(cb); if (S) S.lootAt = Date.now(); sysChat(`${CB.RAID_NAMES[mk]} falls! ${cb.raidLoot.length} items dropped: roll Need, Greed or Pass.`); }
    raidLootModal();
  }
  function raidLootModal() {
    if (!cb || !cb.raidLoot) return;
    const S = NET.s, mi = cb.myMi, all = cb.raidLoot.every(x => x.done), nm = (i) => cb.players[i] ? cb.players[i].name : '?';
    const left = S && S.lootAt ? Math.max(0, VOTE_S - Math.floor((Date.now() - S.lootAt) / 1000)) : 0;
    modal(`<h2>${esc(CB.RAID_NAMES[cb.raidMap] || 'The raid boss')} falls</h2><p>Won in ${cb.round} rounds. This hero is locked out of this raid for 7 days. ${all ? 'All loot is handed out.' : `Roll on each item: <b>Need</b> beats <b>Greed</b>; ties roll 1-100 (watch the chat).${left ? ` Unanswered rolls count as Pass in ${left}s.` : ''}`}</p>
      <div class="raidloot">${cb.raidLoot.map((x, i) => { const v = x.votes[mi];
        return `<div class="rlrow">${itemHtml(x.it)}<div class="rlvote">${x.done ? (x.winner != null ? `<b style="color:${CC[cb.players[x.winner].cls]}">${x.winner === mi ? 'You win it' : esc(nm(x.winner)) + ' wins'}</b> <span class="muted">(${x.how})</span>` : '<span class="muted">Everyone passed.</span>')
          : v ? `<span class="muted">You chose ${v}. Waiting for ${Object.keys(x.votes).length}/${raidVoters().length}...</span>` : ['need', 'greed', 'pass'].map(k => `<button class="btn ${k === 'need' ? 'primary' : ''}" data-rl="${i}" data-rv="${k}">${k[0].toUpperCase() + k.slice(1)}</button>`).join('')}</div>
          ${x.done ? `<div class="rlrolls">${rollLine(x).map(([j, ch, r]) => `<span style="color:${CC[cb.players[j].cls]}" class="${j === x.winner ? 'win' : ''}">${esc(nm(j))}: ${ch}${r != null ? ' <b>' + r + '</b>' : ''}</span>`).join('')}</div>` : ''}</div>`; }).join('')}</div>
      <div class="row"><button class="btn ${all ? 'primary' : ''}" id="mNew">${all ? 'Back to Emberwatch' : 'Leave (pass on the rest)'}</button><button class="btn" id="mClose">Look at the fight</button></div>`);
    $('modalBox').classList.add('wide');
    $('mNew').onclick = () => { if (NET.s && !all) netLeave(); backToTown(); }; $('mClose').onclick = closeModal;
    $('modalBox').querySelectorAll('[data-rl]').forEach(b => b.onclick = () => { b.parentElement.querySelectorAll('button').forEach(x => x.disabled = true); netAct({ t: 'roll', i: +b.dataset.rl, v: b.dataset.rv }); });
  }
  // everyone's choice and roll for one item, highest first: [playerIndex, 'Need'|'Greed'|'Pass'|'-', roll]
  function rollLine(x) {
    const order = { Need: 0, Greed: 1, Pass: 2, '-': 3 };
    return (NET.s ? NET.s.uids.map((u, i) => i) : cb.players.map((p, i) => i)).map(j => { const v = x.votes[j]; return [j, v ? v[0].toUpperCase() + v.slice(1) : '-', x.rolls ? x.rolls[j] : null]; })
      .sort((a, b) => order[a[1]] - order[b[1]] || (b[2] || 0) - (a[2] || 0));
  }
  const raidVoters = () => NET.s ? NET.s.uids.map((u, i) => i).filter(i => !NET.s.gone[i]) : [];
  // applied in the same order on every computer (lockstep), so the dice come out the same everywhere
  function raidRollIn(a) {
    if (!cb || !cb.raidLoot) return;
    const x = cb.raidLoot[a.i];
    if (a.t === 'roll') { if (!x || x.done || x.votes[a.mi] || !['need', 'greed', 'pass'].includes(a.v)) return; x.votes[a.mi] = a.v; }
    for (const y of cb.raidLoot) if (!y.done && (a.t === 'rollforce' || raidVoters().every(i => y.votes[i]))) raidSettle(y);
    if (!$('modal').hidden && $('modalBox').querySelector('.raidloot')) raidLootModal();
  }
  function raidSettle(x) {
    x.done = true; const voters = raidVoters(), need = voters.filter(i => x.votes[i] === 'need'), greed = voters.filter(i => x.votes[i] === 'greed');
    const pool = need.length ? need : greed, kind = need.length ? 'Need' : 'Greed', nm = (i) => cb.players[i].name, iname = x.it.name || 'item';
    if (!pool.length) { sysChat(`Everyone passed on ${iname}.`); return; }
    // everyone who chose Need or Greed rolls 1-100 so the whole raid can see the dice; Need beats Greed; ties in the winning group reroll
    x.rolls = {}; for (const i of [...need, ...greed]) x.rolls[i] = CB.ri(cb.rng, 1, 100);
    let cands = pool.slice(), top = Math.max(...cands.map(i => x.rolls[i])); cands = cands.filter(i => x.rolls[i] === top); const re = [];
    for (let g = 0; g < 10 && cands.length > 1; g++) { const rr = cands.map(i => [i, CB.ri(cb.rng, 1, 100)]); re.push(rr.map(([i, r]) => `${nm(i)} ${r}`).join(', ')); const t2 = Math.max(...rr.map(r => r[1])); cands = rr.filter(r => r[1] === t2).map(r => r[0]); }
    x.winner = cands[0]; x.how = `${kind} ${x.rolls[x.winner]}${re.length ? ', won the reroll' : ''}`;
    sysChat(`Rolls for ${iname}: ${rollLine(x).filter(r => r[1] !== '-').map(([j, ch, r]) => `${nm(j)} ${ch}${r != null ? ' ' + r : ''}`).join(', ')}${re.length ? ` | tie, reroll: ${re.join(' | ')}` : ''}. ${nm(x.winner)} wins it (${kind}).`);
    if (x.winner === cb.myMi && cb._hist) cb._hist.loot = (cb._hist.loot || 0) + 1;
    if (x.winner === cb.myMi) {
      const it = Object.assign({ id: 'g' + Math.random().toString(36).slice(2, 10) }, x.it, { slot: /^Ring/.test(x.it.slot) ? 'Ring' : x.it.slot });
      if (profile.stash.length < CBHub.STASH_MAX) { profile.stash.unshift(it); save(); sysChat(`${iname} is in your stash.`); }
      else sysChat(`Your stash is full: ${iname} is lost.`);
    }
  }
