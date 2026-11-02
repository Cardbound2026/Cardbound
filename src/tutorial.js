  // ---------- Tutorial (Nov 2): an optional guided tour of Emberwatch, offered when a hero is created (and from the Menu any time).
  // A small panel walks through every system; "Show me" walks the hero to the townsperson and drops an arrow over them,
  // "Open it" opens what they run. The panel shrinks to a pill while a sheet or a window is open, and hides outside town.
  const TUT = { set: null, on: false, i: 0, mark: null, min: false, timer: null, after: null };
  const tutNpc = (id) => NPCS.find(n => n.id === id);
  // the road and fight tutorial: Wagoneer Arisha gives it the first time a hero talks to her (and whenever asked)
  const TUT_ROAD = [
    { t: 'Arisha: the roads', at: 'wagon',
      x: `<p>"Six roads, and every one hits with its own element. Start on Map 1."</p><p>Every road has <b>levels +0 to +19</b>. Each level up, monsters get 1.5x HP and 1.3x damage and drop better gear (higher item level). Push up once a level feels easy; drop back to farm when it doesn't.</p>` },
    { t: 'Arisha: a run, row by row', at: 'wagon',
      x: `<p>A run is a map of rows, and you pick the path: <b>fights</b>; <b>elites</b> (harder, better loot; <b>Enraged</b> ones drop everything twice); <b>shrines</b> (a buff for 2 fights); <b>merchants</b> (from row 5, paid from your bank) and <b>campfires</b>.</p><p>Monsters get tougher the deeper you go, and the <b>boss</b> waits at the end.</p>` },
    { t: 'Arisha: the loot sack', at: 'wagon',
      x: `<p>Everything you find goes in your <b>loot sack</b>. <b>Kill the boss</b> and you keep all of it. <b>Die</b> and the sack is lost (the gear you wear and your deck are safe).</p><p>At a campfire you can <b>Rest</b> (heal 30%), <b>Mend</b> (heal the party 10%), <b>Rummage</b> (extra loot) or <b>Extract</b>: go home with half the sack (75% at the row 7 campfire). Knowing when to leave is half the game.</p>` },
    { t: 'Arisha: fighting', at: 'wagon',
      x: `<p>Cards cost <b>mana</b>. Every round you draw cards and regain mana; your <b>amulet</b> sets how much of each. <b>Attacks</b> and <b>Skills</b> resolve once; <b>Powers</b> stay for the whole fight.</p><p>Your defense (<b>Block</b>, <b>Dodge</b>, <b>Barrier</b> or <b>Absorb</b>, by class) soaks hits. <b>Initiative</b> decides who acts first. Click a card, then its target.</p>` },
    { t: 'Arisha: reading the enemy', at: 'wagon',
      x: `<p>Each monster shows what it plans to play over its head: <b>hover it</b> to read it, and Block or kill before the big one lands. Every monster has a <b>weakness</b> on its nameplate.</p><p>Don't drag fights out: every reshuffle adds a <b>Fatigue</b> to your deck, and from round 5 <b>Pressure</b> makes enemies hit harder every round.</p>` },
    { t: 'Arisha: ready?', at: 'wagon', open: ['Pick a road', () => { tutStop(); openSheet('wagon'); }], last: true,
      x: `<p>"Map 1, +0 for your first run. Take the fights you can win, rest when you're low, and come back with a full sack."</p>` },
  ];
  const TUT_STEPS = [
    { t: 'Welcome to Emberwatch', x: `<p>This is the last city before the March. You'll ride out on <b>runs</b>, fight your way down a road, kill its boss and bring the loot home to make your hero stronger.</p><p>This tour takes a few minutes. <b>Skip</b> any time; it's in the Menu (Esc) if you want it again.</p>` },
    { t: 'Getting around', x: `<p><b>Walk</b> with the arrow keys or WASD, or click where you want to go. <b>Talk</b> to someone by clicking them (or press Space next to them). Gold names do something; grey ones just chat.</p><p><b>Esc</b> opens the Menu. <b>C</b> opens your character sheet, in town and in fights. <b>T</b> chats with everyone in town. <b>M</b> mounts your horse, and the map in the corner takes you anywhere: click a spot on it.</p>` },
    { t: 'Wagoneer Arisha: the roads', at: 'wagon', open: ['Pick a road', () => openSheet('wagon')],
      x: `<p>Arisha takes you out on the roads. The first time you talk to her she explains how a run and a fight work (ask her again any time).</p>` },
    { t: 'The Glossary', open: ['Open the Glossary', () => openGlossary()],
      x: `<p>Game words are <b>underlined</b> on cards, items and merchants. Hold <b>Alt</b> and hover one to see what it means.</p><p>The full list of stats and effects is in the Menu under <b>Glossary</b>.</p>` },
    { t: 'Quartermaster Old Arthur: gear', at: 'qm', open: ['Gear & stash', () => openSheet('gear')],
      x: `<p>Your gear and the <b>stash</b> (60 slots, shared by your heroes; hardcore heroes share their own). Every item shows <b>power</b> for your hero: it counts only the stats your codex uses, on the map you're playing, so the green arrows point at real upgrades. Hold <b>Shift</b> over an item to compare every stat.</p><p>Each road's gear resists that road's element (resistance caps at 75%). <b>Salvage</b> what you don't need for gold. Gear for another class? Keep it for an alt, or sell it.</p>` },
    { t: 'Scribe Vell: your deck', at: 'scribe', open: ['Deck & cards', () => openSheet('deck')],
      x: `<p>A deck holds <b>20 to 30 cards</b>: at most 2 Gold, 4 Blue and 6 Green. Monsters drop new cards for your class.</p><p><b>Feed</b> spare cards to a card to rank it up (up to +10; each rank costs a little gold). Or <b>break</b> spares into <b>Ink</b> and craft any card of your class (cards you've never owned cost 3x).</p>` },
    { t: 'Archivist Casey Jones: the Compendium', at: 'archivist', open: ['Open the Compendium', () => openSheet('codex')],
      x: `<p>Every card, every monster on every road, and every piece of gear: what it does and <b>where it drops</b>. Looking for a card for your deck? Ask here first.</p>` },
    { t: 'Codexes and talents', x: `<p>A <b>codex</b> goes in its own slot and turns your class into a playstyle (Shadow Knight, Spellstorm, Ninja...). Bosses drop one 25% of the time, for any class, so trade them or keep them for an alt.</p><p>Kills give your worn codex <b>XP</b>. Every 2 codex levels a new <b>talent</b> row opens: pick Offense, Defense or Support. The bar above town shows your codex's progress.</p><p>The <b>Build guide</b> (Menu) lists every playstyle with a ready-made deck to aim for.</p>` },
    { t: 'Jeweler Rook: amulets and rerolls', at: 'jeweler', open: ['Amulets and rerolls', () => openSheet('amulets')],
      x: `<p>Every amulet splits six points between <b>card draw</b> and <b>mana regen</b>: cheap combo decks want cards, big spells want mana.</p><p>Rook also <b>rerolls</b>: a <b>Reroll Token</b> plus one point of an item's reroll potential rerolls one line. Tokens are rare: a codex you break down only sometimes gives one (higher-level codexes more often).</p>` },
    { t: 'Merchant Dace', at: 'merchant', open: ['Browse wares', () => openSheet('shop')],
      x: `<p>New stock every 12 hours, rolled at the level of your last boss kill. You pay from your bank and it goes to your stash. Merchants out on the March take orders the same way.</p><p>Gold is scarce, so spend it on what moves your hero forward.</p>` },
    { t: 'The Training Dummy', at: 'dummy', open: ['Practice on it', () => startDummy()],
      x: `<p>99,999 HP and it never hits back. Try a new deck or combo here before you risk a run.</p>` },
    { t: 'Captain Ilsa: your heroes', at: 'captain', open: ['Heroes', () => openSheet('heroes')],
      x: `<p>Make more heroes (any class, up to 20) and switch between them here. They share the <b>stash</b>, the <b>gold</b> and the Ink, so an alt can use what your main finds.</p><p><b>Hardcore</b> heroes have one life, their own leaderboard, their own stash, gold, Ink and Reroll Tokens, and only group and trade with other Hardcore heroes.</p>` },
    { t: 'Chronicler Osk', at: 'chron', open: ['Run history', () => openSheet('log')],
      x: `<p>Every run you've played: where it ended, what you brought home, and a damage meter of every fight.</p>` },
    { t: 'The Hall of Records', at: { x: 73, y: 49, solid: true }, open: ['Read the records', () => openSheet('records')],
      x: `<p>The leaderboards: every hero's progress, the highest clear on every road, the most boss kills, and the raid records. Records run in <b>seasons</b>, and every new season starts with a clean board.</p>` },
    { t: 'The Bazaar: trading', at: { x: 112, y: 62 },
      x: `<p>East of Ember Square, down Market Street. Stand anywhere in the Bazaar and <b>Set up shop</b> to list stash items at your price; other players click you to browse and buy.</p><p>To trade directly, click another player in town. Gear for someone else's codex is worth gold to them.</p>` },
    { t: 'Friends, guilds, raids and the Arena', at: 'guildmaster', open: ['Guilds', () => openSheet('guild')],
      x: `<p><b>Friends</b> (button at the top, when signed in): invite them to your party and run together.</p><p><b>Guildmaster Strecks</b>: found a guild (${typeof GUILD_COST !== 'undefined' ? GUILD_COST : 50} gold) or join one. <b>Raid Warden Bagadee</b>: bigger bosses for 2 to 10 players, once a week. <b>Arenamaster Kord</b> at the Colosseum (south-east): wager gear or gold and duel other players.</p>` },
    { t: "You're ready", x: `<p>Next: pick a <b>playstyle</b> in the Build guide so you know which cards and codex to look for, then talk to <b>Wagoneer Arisha</b> and ride out on <b>Map 1 +0</b>.</p><p>Good luck out there.</p>`, open: ['Open the Build guide', () => { tutStop(); openGuide({ fresh: true }); }], last: true },
  ];
  function tutBox() { let b = document.getElementById('tutBox'); if (!b) { b = document.createElement('div'); b.id = 'tutBox'; b.className = 'tutbox'; b.setAttribute('role', 'dialog'); b.setAttribute('aria-live', 'polite'); document.body.appendChild(b); b.addEventListener('click', tutClick); } return b; }
  function tutWhere(s) { if (!s || !s.at) return null; if (typeof s.at === 'string') { const n = tutNpc(s.at); return n ? { x: n.x, y: n.y, solid: true } : null; } return s.at; }
  function tutWalk(s) {
    const w = tutWhere(s); if (!w) return; if (townBusy()) closeTalk();
    const path = bfs(w.x, w.y, !!w.solid); if (path) { P.path = path; P.talkTo = null; P.held = []; P.target = path.length ? path[path.length - 1] : null; }
  }
  function tutRender() {
    const b = tutBox(); if (!TUT.on || !TUT.set) { b.hidden = true; return; }
    const inTown = !$('scrStart').hidden; b.hidden = !inTown; if (!inTown) return;
    const s = TUT.set[TUT.i], busy = !$('sheet').hidden || !$('modal').hidden; TUT.mark = tutWhere(s);
    b.classList.toggle('min', busy || TUT.min);
    const sig = TUT.i + ':' + (busy || TUT.min) + ':' + (TUT.set === TUT_ROAD); if (b.dataset.sig === sig && b.innerHTML) return; b.dataset.sig = sig; // only redraw when something changed, so clicks aren't lost
    if (busy || TUT.min) { b.innerHTML = `<button class="tutpill" data-tut="max" title="Show the tutorial">Tutorial ${TUT.i + 1}/${TUT.set.length}: ${esc(s.t)} &#9656;</button>`; return; }
    b.innerHTML = `<div class="tuthead"><span class="muted">Tutorial ${TUT.i + 1}/${TUT.set.length}</span><button class="tutx" data-tut="min" title="Shrink">&ndash;</button></div>
      <h3>${esc(s.t)}</h3>${s.x}
      <div class="row">${TUT.i > 0 ? '<button class="btn" data-tut="back">Back</button>' : ''}${s.at ? '<button class="btn" data-tut="walk">Show me</button>' : ''}${s.open ? `<button class="btn" data-tut="open">${esc(s.open[0])}</button>` : ''}
      ${s.last ? '<button class="btn" data-tut="done">Finish</button>' : '<button class="btn primary" data-tut="next">Next</button>'}${s.last ? '' : '<button class="btn tutskip" data-tut="skip">Skip tutorial</button>'}</div>`;
  }
  function tutGo(i) { TUT.i = Math.max(0, Math.min(TUT.set.length - 1, i)); TUT.min = false; const s = TUT.set[TUT.i]; if (s.at) tutWalk(s); tutRender(); }
  function tutClick(ev) {
    const a = ev.target.closest('[data-tut]'); if (!a) return; const k = a.dataset.tut, s = TUT.set[TUT.i];
    if (k === 'next') tutGo(TUT.i + 1); else if (k === 'back') tutGo(TUT.i - 1);
    else if (k === 'walk') tutWalk(s);
    else if (k === 'open' && s.open) { s.open[1](); tutRender(); }
    else if (k === 'min') { TUT.min = true; tutRender(); }
    else if (k === 'max') { TUT.min = false; if (!$('modal').hidden) closeModal(); if (!$('sheet').hidden) $('sheetClose').click(); tutRender(); }
    else if (k === 'skip' || k === 'done') { tutStop(); if (k === 'skip') toast('Tutorial skipped. It\'s in the Menu (Esc) any time.'); }
    cv.focus({ preventScroll: true });
  }
  function tutStart(which) { tutBox().dataset.sig = ''; TUT.set = which === 'road' ? TUT_ROAD : TUT_STEPS; TUT.on = true; TUT.min = false; clearInterval(TUT.timer); TUT.timer = setInterval(tutRender, 400); tutGo(0); }
  function tutStop() { tutBox().dataset.sig = ''; TUT.on = false; TUT.mark = null; clearInterval(TUT.timer); tutRender(); }
  // the arrow over whoever the tutorial is talking about (drawn by the town each frame)
  function tutDraw(gx, TS, t) {
    if (!TUT.on || !TUT.mark || $('scrStart').hidden) return;
    const x = TUT.mark.x * TS + TS / 2, y = TUT.mark.y * TS - TS * 0.95 - Math.abs(Math.sin(t / 260)) * TS * 0.22, w = TS * 0.26;
    gx.save(); gx.lineJoin = 'miter';
    gx.beginPath(); gx.moveTo(x - w * 0.45, y - w * 1.3); gx.lineTo(x + w * 0.45, y - w * 1.3); gx.lineTo(x + w * 0.45, y - w * 0.35); gx.lineTo(x + w, y - w * 0.35); gx.lineTo(x, y + w * 0.7); gx.lineTo(x - w, y - w * 0.35); gx.lineTo(x - w * 0.45, y - w * 0.35); gx.closePath();
    gx.fillStyle = 'rgba(0,0,0,.35)'; gx.translate(2, 3); gx.fill(); gx.translate(-2, -3);
    gx.fillStyle = '#d6a14a'; gx.fill(); gx.lineWidth = Math.max(2, TS / 18); gx.strokeStyle = '#120d08'; gx.stroke();
    gx.beginPath(); gx.moveTo(x - w * 0.45, y - w * 1.3); gx.lineTo(x - w * 0.05, y - w * 1.3); gx.lineTo(x - w * 0.05, y + w * 0.25); gx.lineTo(x - w * 0.8, y - w * 0.3); gx.closePath(); gx.fillStyle = 'rgba(255,240,200,.35)'; gx.fill();
    gx.restore();
  }
