  // ---------- codex talent trees (Nov 1): N opens the tree for your hero; the Compendium shows any codex's tree
  // Pick one talent per open row (free to change in town). Rows open every 2 codex levels; talents only work while that codex is worn.
  const TCOL = [['Offense', '#e07a4f'], ['Defense', '#5fb3a1'], ['Support', '#9b8fe0']];
  const talentText = (t, cls) => t.replace(/\{D\}/g, (CLASSES[cls] || {}).defense || 'Block');
  const inTownNow = () => !run && !cb;
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
        else { const t = tr.rows[i][j]; name = t.n; text = talentText(t.t, cx.cls); }
        const on = picks[i] === j && (info ? i < info.rows : false);
        return `<button class="tlcell ${on ? 'on' : ''} ${dim ? 'locked' : ''} ${open ? '' : 'noclick'} ${cap ? 'cap' : mini ? 'mini' : ''}" style="--tc:${TCOL[j][1]}" data-tlr="${i}" data-tlc="${j}" ${edit && open ? '' : 'tabindex="-1"'} aria-pressed="${on}"><b>${esc(name)}</b><span>${esc(text)}</span></button>`;
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
    if (!k) { el.innerHTML = `<span class="muted">No codex worn: equip one (Quartermaster) to earn codex XP and talents.</span> <button class="pilebtn" id="tbTal">Talents <span class="muted">N</span></button>`; }
    else { const i = CBHub.codexInfo(c, k), unspent = i.rows - i.picks.filter((x, j) => x != null && j < i.rows).length;
      el.innerHTML = `<b>${esc(CB.CODEX_BY_KEY[k].name)}</b> <span class="muted">Lv</span> <b>${i.level}</b><div class="xpbar cxxp" title="${i.need ? `${i.into} / ${i.need} XP` : 'Max level'}"><i style="width:${i.need ? Math.round(100 * i.into / i.need) : 100}%"></i></div><span class="muted">${i.need ? `${i.into} / ${i.need} XP` : 'Max level'}</span>${unspent > 0 ? ` <span class="tag good">${unspent} talent${unspent > 1 ? 's' : ''} to pick</span>` : ''} <button class="pilebtn" id="tbTal">Talents <span class="muted">N</span></button>`; }
    $('tbTal').onclick = () => openTalents();
  }
  // N: the talent tree, from town, the character screen, the map or a fight (closes it again if it is open)
  document.addEventListener('keydown', (ev) => {
    if ((ev.key !== 'n' && ev.key !== 'N') || ev.ctrlKey || ev.metaKey || ev.altKey || ev.target.matches('input, select, textarea')) return;
    if (!$('scrTitle').hidden || !profile || !profile.chars[heroKey]) return;
    if (!$('modal').hidden) { if ($('modalBox').classList.contains('tlbox')) { ev.preventDefault(); closeModal(); } return; }
    ev.preventDefault(); if (typeof P !== 'undefined' && P.held) P.held = []; openTalents();
  });
