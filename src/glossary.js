  // ---------- Glossary (Esc menu): every stat and effect, in plain words
  const GLOSSARY = [
    ['Stats', [
      ['Max HP', 'How much damage you can take. HP carries from fight to fight on a run; campfires heal 30%.'],
      ['Stamina', 'Gear stat: +1 Max HP per point.'],
      ['Mana', 'Spent to play cards. You start each turn with your regeneration added (double on your first turn of a fight), up to your max. Unspent mana carries over to the next turn.'],
      ['Mana Regen', 'Mana gained at the start of each of your turns. On gear, only amulets have it.'],
      ['Max Mana', 'The most mana you can hold.'],
      ['Draw', 'Cards drawn at the start of each round. A full hand is 10 cards; extra draws go to the discard pile.'],
      ['Strength', '+1% damage from Attack cards per point.'],
      ['Intelligence', '+1% damage from Skill (spell) cards per point.'],
      ['Dexterity', '+1% to the Block, Barrier or Dodge your cards give per point.'],
      ['Spirit', '+1% healing received per point, from every source: your heals, allies\' heals, Recovery, Lifesteal, Health Regen between fights and resting.'],
      ['Crit Chance', 'Chance for a hit to critically strike.'],
      ['Crit Damage', 'How hard a critical strike hits: shown as a multiplier, x1.5 by default.'],
      ['Initiative', 'Turn order: highest acts first each round (ties are random). Slow and Chill lower it.'],
      ['Resistance', 'Less damage taken of that element, up to 75%. Every item from a map resists that map\'s element (Cinder Reach gear: Fire), so you can farm resistance where you need it.'],
      ['Elemental Damage', '+% damage for cards of that element (Fire, Frost, Arcane, Nature, Shadow, Holy).'],
      ['Luck', 'Raises every drop chance: +1% per point.'],
      ['Multi-hit Chance', 'Chance an Attack hits twice.'],
      ['Multiplay / Multicast', 'Chance a damaging Attack (Multiplay) or Skill (Multicast) is played again for free.'],
      ['Bleed Chance', 'Chance your Attacks also apply 3 Bleed.'],
      ['Lifesteal', 'Heal for this % of the HP damage your hits deal.'],
      ['Thorns', 'Attackers take this much damage back each time they hit you.'],
      ['Recovery', 'Heal this much at the start of each of your turns.'],
      ['Health Regen', 'Heal this much after each fight you win.'],
      ['Defense Gain', '+% to the Block, Barrier or Dodge you gain.'],
      ['Codex', 'A class-only gear slot (bottom right of the character sheet). Random stats like gear (the only source of All Resistances) plus one fixed passive that boosts a playstyle. Codexes drop only from map bosses: each kill has a 25% chance to drop one, picked at random from the five on that boss (any class, so trade or break the ones you can\'t use).'],
      ['Gear Score / Deck Level / Power', 'Gear score is the average item level of your 14 slots; deck level rates your best 20 cards; Power is the average of the two.'],
      ['Item power', 'Shown on upgrade badges: an item\'s stats added up by their value. Stats your class barely uses count for a quarter.'],
    ]],
    ['Defense', [
      ['Block / Barrier / Dodge / Parry / Absorb', 'Your class\'s defense (Warrior and Paladin: Block, Mage: Barrier, Rogue: Dodge, Warlock: Absorb; Parry is Warrior Block). It absorbs damage before HP. Half of it fades at the start of your turn. Poison goes straight past it.'],
      ['Absorb (Warlock)', 'The Warlock\'s defense. Works like Block, and any healing a Warlock gets beyond full HP becomes Absorb.'],
      ['Armors (Warlock)', 'Shadow, Blood, Soul, Nether and Demon Armor: a 3-turn buff (less damage taken, healing, mana regeneration, Absorb when hit, or damage passed to your demons). Only one Armor at a time; a new one replaces the old.'],
      ['Demons (Warlock)', 'Summoned helpers, up to 3 at once. Each acts at the end of your turn and stays 2 turns. Single-target enemy attacks can\'t hit them (a Bulwark Fiend taunts and takes them instead); area attacks hit them too.'],
      ['Soul Beacon (Warlock)', 'A mark on one enemy: damage any hero deals to it heals every hero for a share of that damage, until it dies.'],
      ['Full parry', 'An enemy hit fully absorbed by your defense. Some cards and Powers trigger on it.'],
      ['Stealth', 'Single-target enemy cards can\'t pick you. It lasts until you attack out of it (after that Attack resolves), play a card that hits all enemies, or an enemy area attack gets through (fully Dodging it keeps you hidden).'],
      ['Taunt', 'Enemies must attack this hero until their next turn.'],
      ['Untouchable / Immune', 'No damage (or no damage of a named type) until your next turn.'],
      ['Reflect', 'The next debuff on you goes back to the enemy that applied it.'],
    ]],
    ['Debuffs', [
      ['Weak', 'Deals that % less damage. Halves at the end of each turn.'],
      ['Vulnerable', 'Takes that % more Physical damage, up to +50%. Halves at the end of each turn. (Magic damage has Magic Vulnerability.)'],
      ['Bleed', 'Damage over time. At the start of its turn the target takes damage equal to its Bleed stacks; Block can soak it. Then the Bleed shrinks by 10% (at least 1), so 10 Bleed deals 10, then 9, then 8, and so on. More Bleed adds to the stack. Your Strength makes the Bleed you apply bigger.'],
      ['Poison', 'Damage over time that goes straight through Block. At the start of its turn the target takes damage equal to its Poison stacks. Then the Poison shrinks by 10% (at least 1), so 10 Poison deals 10, then 9, then 8, and so on. More Poison adds to the stack. Your Strength makes the Poison you apply bigger.'],
      ['Burn', 'Fire damage over time. At the start of its turn the target takes damage equal to its Burn stacks; Block can soak it. Then the Burn drops by 1, so 10 Burn deals 10, then 9, then 8, and so on. More Burn adds to the stack.'],
      ['Dread', 'Warlock. Shadow damage over time that goes straight through Block. At the start of its turn the target takes damage equal to its Dread stacks, then the Dread shrinks by 10% (at least 1). More Dread adds to the stack. Your Intelligence makes the Dread you apply bigger.'],
      ['Rot', 'Warlock. Each application deals its amount over 4 turns (12 Rot: 3 a turn) and ignores Block; every application keeps its own timer. Scales with Intelligence.'],
      ['Fear', 'The enemy skips its attacks on its next turn. Monsters resist Fear 25% of the time (bosses 50%), and direct damage that lands on a Feared monster has a 75% chance to snap it out (damage over time: 10% per tick). After a Fear or Stun lands, that enemy can\'t be Feared or Stunned for 2 rounds (3 for bosses).'],
      ['Stunned', 'The enemy loses its whole next turn. Bosses are only Feared by it.'],
      ['Curse', 'Warlock cards that put debuffs (Weak, Vulnerable, Unwarded, Exposure, Rot, Doom) on an enemy.'],
      ['Chill', 'Lowers Initiative by its stacks. At 10 Chill it Freezes: loses its next turn. Drops by 1 each turn.'],
      ['Slow', 'Lowers Initiative by its stacks.'],
      ['Disarm', 'Can\'t play Attacks next turn.'],
      ['Silence', 'An enemy that is Silenced only plays Attacks on its next turn.'],
      ['Counterspell', 'The enemy\'s next card does nothing.'],
      ['Condemnation', 'Takes +1% Holy damage per stack. Halves after each enemy turn.'],
      ['Unwarded', 'Takes +1% Skill (spell) damage per stack. Halves after each enemy turn.'],
      ['Exposure', 'Its cards cost 5% more mana per stack, up to +50% (10 stacks).'],
      ['Magic Vulnerability', 'Takes +1% magic (non-Physical) damage per stack, up to +50%. Loses 10% of its stacks after each enemy turn.'],
      ['Freeze', 'A Frozen enemy loses its next turn, like a Stun.'],
      ['Raid bosses', 'Can\'t be controlled or slowed: no Stun, Fear, Freeze, Disarm, Silence, Slow, Chill, counters, cost increases or draw loss. Mana burn works and Stun cards can go in their hand, but they still play all their attacks every turn.'],
      ['Cannot heal / Grievous', 'Cannot heal until your next turn / healing received is halved for 2 turns.'],
      ['Draws fewer', 'The enemy draws that many fewer cards for its next turn.'],
      ['Mana drain', 'Stealing or burning an enemy\'s mana takes what it has, then what it would regenerate next turn, so it plans fewer cards.'],
    ]],
    ['Cards', [
      ['Attack / Skill / Power', 'Attacks scale with Strength, Skills with Intelligence. A Power is played once and stays active for the whole fight (shown with a ◆ on your hero).'],
      ['Holy damage', 'Paladin damage type. Holy ignores resistance and weakness: it always hits for its full amount.'],
      ['Revealed', 'Can\'t enter Stealth until the end of its next turn.'],
      ['Exhaust', 'Removed for the rest of the fight after it is played.'],
      ['Retain', 'Stays in your hand at the end of your turn instead of being discarded.'],
      ['Fatigue', 'Every time your deck reshuffles, a Fatigue (unplayable) is shuffled in. Long fights clog your deck.'],
      ['Dazed', 'A junk card. Costs 5 mana and does nothing; playing it exhausts it.'],
      ['Stun', 'Unplayable junk that stays in the deck.'],
      ['Cards in enemy decks', 'Some of your cards add cards to an enemy\'s deck: Dazed, Stun and Fatigue are wasted draws; Venom gives 3 Poison, Frostbite 3 Chill, Hex 10 Vulnerable and Living Bomb explodes for 15 Fire damage when drawn.'],
      ['Ranks (+1 to +10)', 'Feed spare cards to a card at the Scribe to rank it up: bigger numbers, or cheaper to play.'],
      ['Devotion', 'Paladin. Stacks up until you play a Holy damage card: each stack adds +2 to that card\'s damage, then all of it is spent. Physical cards never spend it.'],
      ['Blood Magic', 'Warlock (Bloodmancer codex or Crimson Rite). Pay for cards with HP instead of mana: 1 HP per 2 mana, up to 15 HP a turn.'],
      ['Blood Debt', 'Warrior. Stores the HP you lose; some cards turn it into damage or Block.'],
      ['Card rarity', 'White, Green, Blue, Gold. A deck holds 20 to 30 cards: at most 2 Gold, 4 Blue and 6 Green.'],
    ]],
    ['Combat', [
      ['Turn order', 'Everyone acts in Initiative order each round. The bar at the top shows it; the glowing tile is acting now.'],
      ['Enemy intents', 'The chips above an enemy are the cards it will play next turn, in order, with their damage and who they are aimed at. Crossed-out ones it can\'t afford.'],
      ['Group', 'Some tier 2 and 3 fights are a group (Pack of Wolves, Bandit Party, Magma Golems...): three smaller bodies that share one monster\'s HP and damage. It counts as one monster: one loot roll, one kill. Area damage shines here.'],
      ['Pressure', 'From round 5, enemies deal 2% more damage every round (10% in duels), so fights end.'],
      ['Elites and the boss', 'Elites appear from row 5 and always drop a card. The Warlord has a second phase at half HP with new cards.'],
      ['Party fights', 'A party meets one monster per hero (each with +30% HP per extra hero). Elites and the boss get +85% HP, mana and regen per extra hero instead.'],
      ['Damage meter', 'The Meter tab next to the combat log: damage done, healing and damage taken, by ability. Click a bar for the breakdown.'],
    ]],
    ['The run', [
      ['Loot sack', 'What you find on a run. Die and it is lost. Extract at a campfire to keep part of it (75% at the row-7 campfire, 50% later), or kill the Warlord to keep it all.'],
      ['Bank', 'Your gold in town. Merchants on the March take orders paid from the bank; they wait in your stash even if you die.'],
      ['Map level', 'Each level: enemies have x1.5 HP and deal x1.3 damage, and drops roll higher item levels.'],
      ['Shrines', 'A buff for your next 2 fights.'],
    ]],
  ];
  function openGlossary(q) {
    q = (q || '').toLowerCase();
    const body = GLOSSARY.map(([sec, rows]) => { const r = rows.filter(([t, d]) => !q || (t + ' ' + d).toLowerCase().includes(q)); return r.length ? `<h3 class="glh">${sec}</h3><dl class="gloss">${r.map(([t, d]) => `<dt>${esc(t)}</dt><dd>${esc(d)}</dd>`).join('')}</dl>` : ''; }).join('') || '<p class="muted">Nothing matches.</p>';
    modal(`<h2>Glossary</h2><input id="glQ" type="search" placeholder="Search stats and effects..." value="${esc(q)}" autocomplete="off" class="glq"><div id="glBody" class="glbody">${body}</div><div class="row"><button class="btn primary" id="mClose">Close</button></div>`);
    $('modalBox').classList.add('wide');
    $('mClose').onclick = closeModal;
    const i = $('glQ'); i.oninput = () => { const v = i.value; openGlossary(v); const j = $('glQ'); j.focus(); j.setSelectionRange(v.length, v.length); };
    if (!q) i.focus();
  }
  // ---------- Keyword tooltips (Nov 1): every glossary term in the game's text gets a faint dotted underline.
  // Hold Alt while pointing at one to read its glossary entry. Works on cards, gear, merchants, tags, the log: anything on screen.
  // A MutationObserver finds new text as screens render and wraps the terms in <span class="kw">; nothing else is touched.
  const KW_SKIP = new Set(['Gear Score / Deck Level / Power', 'Item power', 'Full parry', 'Cards in enemy decks', 'Ranks (+1 to +10)', 'Card rarity', 'Turn order', 'Enemy intents', 'Elites and the boss', 'Party fights', 'Damage meter', 'Loot sack', 'Bank', 'Map level', 'Mana drain', 'Draws fewer', 'Draw', 'Mana', 'Elemental Damage', 'Untouchable / Immune', 'Attack / Skill / Power', 'Cannot heal / Grievous', 'Shrines']);
  const KW_ALIAS = { Feared: 'Fear', Stunned: 'Stunned', Silenced: 'Silence', Disarmed: 'Disarm', Bleeding: 'Bleed', Poisoned: 'Poison', Burning: 'Burn', Chilled: 'Chill', Frozen: 'Chill', Freezes: 'Chill', Freeze: 'Chill', Exposed: 'Exposure',
    Taunting: 'Taunt', taunts: 'Taunt', Taunts: 'Taunt', Exhausts: 'Exhaust', Grievous: 'Cannot heal / Grievous', Untouchable: 'Untouchable / Immune', Multicast: 'Multiplay / Multicast', Multiplay: 'Multiplay / Multicast', 'Multicast Chance': 'Multiplay / Multicast', 'Multiplay Chance': 'Multiplay / Multicast',
    'Multi-hit': 'Multi-hit Chance', 'Shadow Armor': 'Armors (Warlock)', 'Blood Armor': 'Armors (Warlock)', 'Soul Armor': 'Armors (Warlock)', 'Nether Armor': 'Armors (Warlock)', 'Demon Armor': 'Armors (Warlock)',
    demon: 'Demons (Warlock)', demons: 'Demons (Warlock)', Demons: 'Demons (Warlock)', Summon: 'Demons (Warlock)', 'Soul Beacon': 'Soul Beacon (Warlock)', 'Mana Regen': 'Mana Regen', 'mana regen': 'Mana Regen', 'mana regeneration': 'Mana Regen', regen: 'Mana Regen', Regen: 'Mana Regen',
    'crit chance': 'Crit Chance', 'Crit chance': 'Crit Chance', 'crit damage': 'Crit Damage', 'Max Mana': 'Max Mana', 'max mana': 'Max Mana', 'maximum mana': 'Max Mana', 'Max HP': 'Max HP', 'Health Regen': 'Health Regen', Curse: 'Curse', Cursed: 'Curse', Fatigue: 'Fatigue', Dazed: 'Dazed' };
  const KW = new Map();
  for (const [, rows] of GLOSSARY) for (const [t, d] of rows) { if (KW_SKIP.has(t)) continue; for (const n of t.replace(/\s*\(.*?\)/, '').split(' / ')) if (n.length > 2 && !KW.has(n)) KW.set(n, { t, d }); }
  const KW_BY_T = new Map(); for (const [, rows] of GLOSSARY) for (const [t, d] of rows) KW_BY_T.set(t, { t, d });
  for (const [a, t] of Object.entries(KW_ALIAS)) if (KW_BY_T.has(t) && !KW.has(a)) KW.set(a, KW_BY_T.get(t));
  const kwEsc = (x) => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const KW_RE = new RegExp('(^|[^A-Za-z-])(' + [...KW.keys()].sort((a, b) => b.length - a.length).map(kwEsc).join('|') + ')(?![A-Za-z])', 'g');
  const KW_NO = 'script, style, textarea, input, select, option, svg, canvas, .kw, .fname, .ftype, h1, h2, h3, button, .uhead, .onm, .seatname, .gloss, #kwTip, [contenteditable], .nokw';
  function kwWrap(root) {
    if (!root || (root.nodeType === 1 && root.closest && root.closest(KW_NO))) return;
    const tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, { acceptNode: (n) => { if (!n.nodeValue || n.nodeValue.length < 3) return NodeFilter.FILTER_REJECT; const p = n.parentElement; if (!p || p.closest(KW_NO)) return NodeFilter.FILTER_REJECT; KW_RE.lastIndex = 0; return KW_RE.test(n.nodeValue) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT; } });
    const list = []; let n; while ((n = tw.nextNode())) list.push(n);
    for (const t of list) {
      const s = t.nodeValue, frag = document.createDocumentFragment(); let last = 0, m; KW_RE.lastIndex = 0;
      while ((m = KW_RE.exec(s))) { const at = m.index + m[1].length; if (at > last) frag.appendChild(document.createTextNode(s.slice(last, at))); const sp = document.createElement('span'); sp.className = 'kw'; sp.dataset.kw = m[2]; sp.textContent = m[2]; frag.appendChild(sp); last = at + m[2].length; KW_RE.lastIndex = last; }
      if (last < s.length) frag.appendChild(document.createTextNode(s.slice(last)));
      t.parentNode.replaceChild(frag, t);
    }
  }
  let kwPend = new Set(), kwRaf = 0;
  const kwFlush = () => { kwRaf = 0; const roots = [...kwPend]; kwPend = new Set(); for (const r of roots) if (r.isConnected) kwWrap(r); };
  new MutationObserver((muts) => {
    for (const m of muts) { if (m.type === 'characterData') { if (m.target.parentElement) kwPend.add(m.target.parentElement); continue; } for (const a of m.addedNodes) kwPend.add(a.nodeType === 3 ? a.parentElement : a); }
    kwPend.delete(null); if (kwPend.size && !kwRaf) kwRaf = requestAnimationFrame(kwFlush);
  }).observe(document.body, { childList: true, subtree: true, characterData: true });
  kwWrap(document.body);
  // the tooltip: hold Alt over an underlined word
  const kwTip = document.createElement('div'); kwTip.id = 'kwTip'; kwTip.hidden = true; document.body.appendChild(kwTip);
  let kwOver = null, kwAlt = false, kwX = 0, kwY = 0;
  function kwShow() {
    if (!kwOver || !kwAlt || !kwOver.isConnected) { kwTip.hidden = true; return; }
    const e = KW.get(kwOver.dataset.kw); if (!e) { kwTip.hidden = true; return; }
    kwTip.innerHTML = `<b>${esc(e.t.replace(/ \/ .*$/, '').replace(/\s*\(.*?\)/, ''))}</b><span>${esc(e.d)}</span>`; kwTip.hidden = false;
    const w = kwTip.offsetWidth, h = kwTip.offsetHeight; let x = kwX + 14, y = kwY + 16; if (x + w > innerWidth - 8) x = innerWidth - w - 8; if (y + h > innerHeight - 8) y = kwY - h - 12;
    kwTip.style.left = Math.max(8, x) + 'px'; kwTip.style.top = Math.max(8, y) + 'px';
  }
  document.addEventListener('mouseover', (ev) => { const k = ev.target.closest && ev.target.closest('.kw'); if (k !== kwOver) { kwOver = k; kwShow(); } }, true);
  document.addEventListener('mousemove', (ev) => { kwX = ev.clientX; kwY = ev.clientY; kwAlt = ev.altKey; if (kwOver && kwAlt) kwShow(); else if (!kwTip.hidden && !kwAlt) kwTip.hidden = true; }, true);
  document.addEventListener('keydown', (ev) => { if (ev.key === 'Alt') { kwAlt = true; if (kwOver) { ev.preventDefault(); kwShow(); } } }, true);
  document.addEventListener('keyup', (ev) => { if (ev.key === 'Alt') { kwAlt = false; kwTip.hidden = true; if (kwOver) ev.preventDefault(); } }, true); // also keeps the browser menu from grabbing focus
  window.addEventListener('blur', () => { kwAlt = false; kwTip.hidden = true; });
