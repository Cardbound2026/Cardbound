  // ---------- Achievements and titles (Nov 2): the list (Menu, or the button on the character sheet), the unlock banner, and the
  // title picker on the character sheet (C). Definitions and checks are in src/hub.js (ACH, achCheck).
  const ACHQ = { q: [], busy: false };
  function achAnnounce(list) {
    for (const a of list) {
      ACHQ.q.push(a); const c = profile.chars[heroKey];
      if (typeof sysChat === 'function') sysChat(`Achievement unlocked: ${a.name}. New title: "${a.title}" (pick it on your character sheet, C).`);
      if (typeof socOn === 'function' && socOn() && c) { try { SOC.ch.send({ type: 'broadcast', event: 'chat', payload: { sys: true, uid: SOC.me, name: '', ch: 'world', text: `${c.name} earned the title "${a.title}": ${a.how}` } }); } catch (e) {} }
    }
    achShowNext();
  }
  function achShowNext() {
    if (ACHQ.busy || !ACHQ.q.length) return; const a = ACHQ.q.shift(); ACHQ.busy = true;
    let b = document.getElementById('achBanner'); if (!b) { b = document.createElement('div'); b.id = 'achBanner'; b.className = 'achbanner'; b.setAttribute('role', 'status'); document.body.appendChild(b); b.onclick = () => openAchievements(); }
    b.innerHTML = `<small>Achievement unlocked</small><b>${esc(a.name)}</b><span>${esc(a.how)}</span><em>Title: ${esc(a.title)}</em>`;
    b.classList.remove('on'); void b.offsetWidth; b.classList.add('on');
    setTimeout(() => { b.classList.remove('on'); setTimeout(() => { ACHQ.busy = false; achShowNext(); }, 450); }, 4200);
  }
  setInterval(() => { try { if (profile) { CBHub.achCheck(profile, {}); const f = CBHub.achTake(); if (f.length) { achAnnounce(f); save(); } } } catch (e) {} }, 1500); // unlocks from anywhere (runs, ranks, duels...)
  function achProgress(a) { if (!a.count) return ''; const n = Math.min(a.n, a.count(profile)); return `<span class="achbar" title="${n.toLocaleString()} / ${a.n.toLocaleString()}"><i style="width:${(100 * n / a.n).toFixed(1)}%"></i></span><small class="muted">${n.toLocaleString()} / ${a.n.toLocaleString()}</small>`; }
  function openAchievements() {
    const got = profile.ach || {}, c = profile.chars[heroKey], cats = [...new Set(CBHub.ACH.map(a => a.cat))];
    const n = CBHub.ACH.filter(a => got[a.id]).length;
    const rows = cats.map(cat => `<h3 class="achcat">${esc(cat)}</h3><div class="achlist">${CBHub.ACH.filter(a => a.cat === cat).map(a => { const u = got[a.id];
      return `<div class="ach ${u ? 'got' : ''}"><div class="achic">${u ? '&#10022;' : '&#9675;'}</div><div class="achtx"><b>${esc(a.name)}</b><span>${esc(a.how)}</span>${u ? `<small class="muted">Unlocked ${new Date(u.at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}${u.by ? ' by ' + esc(u.by) : ''}</small>` : achProgress(a)}</div>
        <div class="achtitle"><em>${esc(a.title)}</em>${u && c ? (c.title === a.id ? '<span class="muted">Worn</span>' : `<button class="btn" data-wear="${a.id}">Wear</button>`) : ''}</div></div>`; }).join('')}</div>`).join('');
    modal(`<h2>Achievements <span class="muted" style="font-size:16px">${n} / ${CBHub.ACH.length}</span></h2>
      <p class="savenote" style="margin:0 0 6px">Every achievement unlocks a title for all your heroes. Wear one from your character sheet (C)${c ? `; ${esc(c.name)} wears <b>${esc(CBHub.titleOf(c, profile) || 'no title')}</b>` : ''}.</p>
      <div class="achwrap">${rows}</div><div class="row"><button class="btn primary" id="mClose">Close</button></div>`);
    $('modalBox').classList.add('wide'); $('mClose').onclick = closeModal;
    $('modalBox').querySelectorAll('[data-wear]').forEach(b => b.onclick = () => { CBHub.setTitle(profile, heroKey, b.dataset.wear); save(); if (typeof retrack === 'function') retrack(true); renderHub(); openAchievements(); });
  }
  // the title picker for the character sheet
  function titlePicker(c) {
    const got = profile.ach || {}, have = CBHub.ACH.filter(a => got[a.id]);
    return `<div class="titlepick"><select data-titlepick aria-label="Title">${['<option value="">No title</option>', ...have.map(a => `<option value="${a.id}" ${c.title === a.id ? 'selected' : ''}>${esc(a.title)}</option>`)].join('')}</select><button class="btn" data-achopen title="Achievements and titles">&#10022; ${have.length}/${CBHub.ACH.length}</button></div>`;
  }
  document.addEventListener('change', (ev) => { const s = ev.target.closest('[data-titlepick]'); if (!s) return; CBHub.setTitle(profile, heroKey, s.value || null); save(); if (typeof retrack === 'function') retrack(true); });
  document.addEventListener('click', (ev) => { if (ev.target.closest('[data-achopen]')) openAchievements(); });
