  // ---------- codex talent trees (Nov 1): N opens the tree for your hero; the Compendium shows any codex's tree
  // Pick one talent per open row (free to change in town). Rows open every 2 codex levels; talents only work while that codex is worn.
  const TCOL = [['Offense', '#e07a4f'], ['Defense', '#5fb3a1'], ['Support', '#9b8fe0']];
  const talentText = (t, cls, c) => t.replace(/\{D\}/g, (c && c.cls === cls && CBHub.defWord(c)) || (CLASSES[cls] || {}).defense || 'Block');
  const inTownNow = () => !run && !cb;
  // Nov 13: a picture for every talent, chosen by what it does (img/ui/talents.webp: rows of six 40 px icons, tools/talicons)
  const TLIC = { sword: 0, fire: 1, frost: 2, shadow: 3, holy: 4, arcane: 5, nature: 6, bleed: 7, burn: 8, dread: 9, rot: 10, chill: 11, crit: 12, critX: 13, flat: 14, per: 15, every: 16, double: 17,
    def: 18, incoming: 19, startBlock: 20, turnBlock: 21, thorns: 22, reflect: 23, lowhp: 24, cheat: 25, heal: 26, healIn: 27, killHeal: 28, spirit: 29, startMana: 30, turnMana: 31, maxMana: 32, regen: 33, killMana: 34, cost: 35,
    killDraw: 36, startDraw: 37, draw: 38, discard: 39, shuriken: 40, stealth: 41, taunt: 42, slow: 43, debuffRes: 44, statusSkip: 45, init: 46, weak: 47, party: 48, run: 49, partyHeal: 50, summon: 51, demon: 52, devotion: 53,
    resPhysical: 54, resShadow: 55, resArcane: 56, resNature: 57, resFire: 58, resFrost: 59, convert: 60, multicast: 61, drain: 62, cleanse: 63, spread: 64, extra: 65, cap: 66, blood: 67, parry: 68, bash: 69, vuln: 70, gear: 71 };
  const ELIC = { Fire: 'fire', Frost: 'frost', Shadow: 'shadow', Holy: 'holy', Arcane: 'arcane', Nature: 'nature', Physical: 'sword' }, DOTIC = { poison: 'nature', bleed: 'bleed', burn: 'burn', dread: 'dread', rot: 'rot', chill: 'chill', weak: 'weak', vulnerable: 'vuln', slow: 'slow', exposure: 'vuln' };
  function talIconKey(t, cap) {
    if (cap) return 'cap'; const f = (t.fx || [])[0] || [], k = f[0], a = f[1], b = f[2], c = f[3];
    switch (k) {
      case 'dmg': { const o = b || {}; return o.key === 'shuriken' ? 'shuriken' : o.dtype ? ELIC[o.dtype] : o.vs ? (DOTIC[String(o.vs).split(':')[0]] || 'sword') : o.self && /^stealth/.test(o.self) ? 'stealth' : o.self && /^devotion/.test(o.self) ? 'devotion' : 'sword'; }
      case 'crit': return 'crit'; case 'critX': return 'critX'; case 'flat': return 'flat'; case 'dmgPer': return DOTIC[a] || 'per'; case 'dotPlus': case 'dotX': case 'dotCrit': return DOTIC[a] || 'bleed'; case 'stealthDot': return 'stealth';
      case 'every': return 'every'; case 'extraStrike': return 'double'; case 'extraTarget': return 'extra'; case 'def': return 'def'; case 'incoming': return 'incoming'; case 'lowhp': return 'lowhp'; case 'cheat': return 'cheat';
      case 'heal': return 'healIn'; case 'party': return a === 'recovery' || a === 'heal' ? 'partyHeal' : 'party'; case 'run': return a === 'partyHealthRegen' ? 'partyHeal' : 'run'; case 'aura': return 'party';
      case 'start': return a === 'block' ? 'startBlock' : a === 'mana' ? 'startMana' : a === 'draw' ? 'startDraw' : a === 'summon' ? 'summon' : a === 'shuriken' ? 'shuriken' : a === 'stealth' ? 'stealth' : a === 'devotion' ? 'devotion' : a === 'discard' || a === 'dazed' ? 'discard' : a === 'str' ? 'sword' : DOTIC[c] || 'weak';
      case 'turn': return a === 'block' ? 'turnBlock' : a === 'mana' || a === 'manaPer' ? 'turnMana' : a === 'heal' ? 'heal' : a === 'draw' ? 'draw' : a === 'drain' ? 'drain' : a === 'cleanse' ? 'cleanse' : a === 'shuriken' ? 'shuriken' : a === 'devotion' ? 'devotion' : a === 'discard' ? 'discard' : DOTIC[c] || 'weak';
      case 'kill': return a === 'mana' ? 'killMana' : a === 'draw' ? 'killDraw' : a === 'heal' ? 'killHeal' : a === 'spread' ? 'spread' : a === 'stealth' ? 'stealth' : a === 'block' ? 'def' : 'killMana';
      case 'hitBy': return a === 'back' ? 'thorns' : DOTIC[c] || 'thorns'; case 'full': return a === 'back' ? 'parry' : a === 'mana' ? 'killMana' : a === 'draw' ? 'draw' : 'parry';
      case 'stat': return a === 'thorns' ? 'thorns' : a === 'reflect' ? 'reflect' : a === 'healIn' ? 'healIn' : a === 'spirit' ? 'spirit' : a === 'maxMana' ? 'maxMana' : a === 'regen' ? 'regen' : a === 'draw' ? 'draw' : a === 'tauntChance' ? 'taunt' : a === 'slowChance' ? 'slow' : a === 'debuffRes' ? 'debuffRes'
        : a === 'statusSkip' ? 'statusSkip' : a === 'baseInit' ? 'init' : a === 'demonDmg' || a === 'demonTurns' ? 'demon' : a === 'multicast' ? 'multicast' : a === 'intelligence' ? 'arcane' : a === 'bloodCapPlus' ? 'blood' : a === 'resistAll' ? 'resPhysical' : /^resist:/.test(a) ? 'res' + a.slice(7) : 'gear';
      case 'statFrom': case 'convert': return 'convert'; case 'firstCost': case 'cost': return 'cost'; case 'shurPlus': return 'shuriken'; case 'devPlus': return 'devotion'; case 'vulnX': return 'vuln'; case 'dealtDef': return 'bash';
      case 'dealtBleed': return 'bleed'; case 'parryFirst': case 'parryExtra': return 'parry'; case 'arcRegen': return 'regen'; case 'gear': return 'gear';
    }
    return 'gear';
  }
  const talIcon = (t, cap) => { const i = TLIC[talIconKey(t, cap)] == null ? 71 : TLIC[talIconKey(t, cap)]; return `<i class="tlic" style="background-position:${-(i % 6) * 40}px ${-Math.floor(i / 6) * 40}px"></i>`; };
  function openTalents(cxKey, opt) {
    opt = opt || {};
    const me = profile && profile.chars[heroKey] ? CBHub.char(profile, heroKey) : null;
    if (!cxKey) { const cls = me ? me.cls : 'Warrior'; cxKey = (me && CBHub.wornCodex(me)) || CB.CODEXES[cls][0][0]; }
    const cx = CB.CODEX_BY_KEY[cxKey], tr = CB.TALENTS[cxKey]; if (!cx || !tr) return;
    const mine = !!me && me.cls === cx.cls, info = mine ? CBHub.codexInfo(me, cxKey) : null, worn = mine && CBHub.wornCodex(me) === cxKey;
    const edit = mine && inTownNow(), picks = info ? info.picks : [];
    const tabs = CB.CODEXES[cx.cls].map(([k, n]) => { const li = mine ? CBHub.codexInfo(me, k) : null, w = mine && CBHub.wornCodex(me) === k;
      return `<button class="tltab ${k === cxKey ? 'on' : ''}" data-tltab="${k}">${esc(n)}${li ? ` <small>Lv ${li.level}</small>` : ''}${w ? ' <span class="tag good">Worn</span>' : ''}</button>`; }).join('');
    const prog = info ? `<div class="tlprog"><b>Level ${info.level} / ${CB.CODEX_MAX}</b><div class="xpbar tlxp"><i style="width:${info.need ? Math.round(100 * info.into / info.need) : 100}%"></i></div>
        <span class="muted">${info.need ? `${info.into} / ${info.need} XP to level ${info.level + 1}` : 'Maxed: +10% codex XP on your other codexes'} &middot; ${info.rows} of 10 rows open${info.rows > picks.filter((x, i) => x != null && i < info.rows).length ? ` &middot; <b style="color:var(--warn)">${info.rows - picks.filter((x, i) => x != null && i < info.rows).length} to pick</b>` : ''}</span></div>`
      : `<p class="muted" style="margin:4px 0 8px">${me ? `Your hero is a ${esc(me.cls)}: this is a ${esc(cx.cls)} codex, so you can look but not pick.` : 'Make a hero to start earning codex XP.'}</p>`;
    const rows = [];
    for (let i = 0; i < 10; i++) {
      const lv = (i + 1) * 2, open = info ? i < info.rows : false, dim = info && !open, cap = i === 9, mini = i === 4;
      const cells = [0, 1, 2].map(j => {
        let name, text;
        if (cap) { const d = CARDS[tr.cap[j]]; name = d ? d.name : tr.cap[j]; text = (d ? d.text : '') + ' Already in play at the start of every fight.'; }
        else { const t = tr.rows[i][j]; name = t.n; text = talentText(t.t, cx.cls, me); }
        const on = picks[i] === j && (info ? i < info.rows : false); const other = !on && open && picks[i] != null && picks[i] !== j; // another talent on this row is picked
        return `<button class="tlcell ${on ? 'on' : ''} ${other ? 'other' : ''} ${dim ? 'locked' : ''} ${open ? '' : 'noclick'} ${cap ? 'cap' : mini ? 'mini' : ''}" style="--tc:${TCOL[j][1]}" data-tlr="${i}" data-tlc="${j}" ${edit && open ? '' : 'tabindex="-1"'} aria-pressed="${on}">${talIcon(cap ? {} : tr.rows[i][j], cap)}<span class="tltx"><b>${esc(name)}</b><span>${esc(text)}</span></span></button>`;
      }).join('');
      rows.push(`<div class="tllv ${dim ? 'locked' : ''}">Lv ${lv}${cap ? '<small>Capstone</small>' : mini ? '<small>Mini capstone</small>' : ''}</div>${cells}`);
    }
    modal2(`<h2>${esc(cx.name)} talents <span class="muted" style="font-size:15px"><span style="color:${CC[cx.cls]}">${esc(cx.cls)}</span> &middot; ${worn ? 'worn now' : mine ? 'not worn: talents are kept but switched off' : 'preview'}</span></h2>
      <div class="tltabs">${tabs}</div>${prog}
      <div class="tltree"><div></div>${TCOL.map(([n, c]) => `<div class="tlhead" style="color:${c}">${n}</div>`).join('')}${rows.join('')}</div>
      <p class="muted" style="font-size:12.5px;margin:8px 0 0">Every kill while wearing this codex gives it XP (normal 1, elite 3, boss 10; a party splits kills but gets +10% per extra hero). A new row opens every 2 levels. ${edit ? 'Click a talent to pick it; changing picks is free in town.' : mine ? 'Picks can be changed in town.' : ''}</p>
      <div class="row">${edit && picks.some(x => x != null) ? '<button class="btn" id="tlReset">Clear picks</button>' : ''}${opt.compendium ? '<button class="btn" id="tlDrops">Where it drops</button>' : ''}<button class="btn primary" id="mClose">Close <span class="muted">N</span></button></div>`);
    $('modalBox').classList.add('wide', 'tlbox');
    $('mClose').onclick = () => { closeModal(); if (opt.back) opt.back(); };
    $('modalBox').querySelectorAll('[data-tltab]').forEach(b => b.onclick = () => openTalents(b.dataset.tltab, opt));
    if (edit) $('modalBox').querySelectorAll('.tlcell:not(.noclick)').forEach(b => b.onclick = () => {
      const r = +b.dataset.tlr, c = +b.dataset.tlc; CBHub.pickTalent(profile, heroKey, cxKey, r, picks[r] === c ? null : c); save(); openTalents(cxKey, opt); renderCodexBar(); });
    if ($('tlDrops')) $('tlDrops').onclick = () => codexDetail(cxKey);
    if ($('tlReset')) $('tlReset').onclick = () => { CBHub.resetTalents(profile, heroKey, cxKey); save(); openTalents(cxKey, opt); renderCodexBar(); };
  }
  // town bar: XP toward the next level of the codex you wear
  function renderCodexBar() {
    const el = $('tbCodex'); if (!el || !profile || !profile.chars[heroKey]) return;
    const c = CBHub.char(profile, heroKey), k = CBHub.wornCodex(c);
    el.hidden = !k; if (!k) { el.innerHTML = ''; return; }   // Nov 13: no bar until you wear a codex
    if (0) {}
    else { const i = CBHub.codexInfo(c, k), unspent = i.rows - i.picks.filter((x, j) => x != null && j < i.rows).length;
      const need = CB.codexNeed(k, c.gear, window.CB_DATA); // Nov 2: weapon requirements
      const tip = `${CB.CODEX_BY_KEY[k].name} Codex, level ${i.level}: ${i.need ? `${i.into} / ${i.need} XP` : 'max level'}`;   /* Nov 13: just a bar and the level; the XP numbers show when you point at it */
      el.innerHTML = `${need ? `<span class="tag bad" title="The codex passive needs ${esc(need)}. Talents still work.">Inactive: needs ${esc(need)}</span>` : ''}<div class="xpbar cxxp" title="${esc(tip)}" data-tip="${esc(tip)}"><i style="width:${i.need ? Math.round(100 * i.into / i.need) : 100}%"></i></div><b class="cxlv" title="${esc(tip)}">${i.level}</b>${unspent > 0 ? `<button type="button" class="cxbang" data-cxtal="1" title="Push N to allocate your talent points" data-tip="Push N to allocate your talent points">!</button>` : ''}`; const bg = el.querySelector('[data-cxtal]'); if (bg) bg.onclick = () => openTalents(); }   /* Nov 13: a big ! by the level while a talent point is unspent */
  }
  // N: the talent tree, from town, the character screen, the map or a fight (closes it again if it is open)
  document.addEventListener('keydown', (ev) => {
    if ((ev.key !== 'n' && ev.key !== 'N') || ev.ctrlKey || ev.metaKey || ev.altKey || ev.target.matches('input, select, textarea')) return;
    if (!$('scrTitle').hidden || !profile || !profile.chars[heroKey]) return;
    if (!$('modal').hidden) { if ($('modalBox').classList.contains('tlbox')) { ev.preventDefault(); closeModal(); } return; }
    ev.preventDefault(); if (typeof P !== 'undefined' && P.held) P.held = []; openTalents();
  });
