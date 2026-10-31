  // ---------- Glossary (Esc menu): every stat and effect, in plain words
  const GLOSSARY = [
    ['Stats', [
      ['Max HP', 'How much damage you can take. HP carries from fight to fight on a run; campfires heal 30%.'],
      ['Stamina', 'Gear stat: +1 Max HP per point.'],
      ['Mana', 'Spent to play cards. You start each turn with your regeneration added (double on your first turn of a fight), up to your max. Unspent mana carries over to the next turn.'],
      ['Mana Regen', 'Mana gained at the start of each of your turns.'],
      ['Max Mana', 'The most mana you can hold.'],
      ['Draw', 'Cards drawn at the start of each round. A full hand is 10 cards; extra draws go to the discard pile.'],
      ['Strength', '+1% damage from Attack cards per point.'],
      ['Intelligence', '+1% damage from Skill (spell) cards per point.'],
      ['Dexterity', '+1% to the Block, Barrier or Dodge your cards give per point.'],
      ['Spirit', '+1% to your healing and to the damage-over-time stacks you apply, per point.'],
      ['Crit Chance', 'Chance for a hit to critically strike.'],
      ['Crit Damage', 'How hard a critical strike hits: shown as a multiplier, x1.5 by default.'],
      ['Initiative', 'Turn order: highest acts first each round (ties are random). Slow and Chill lower it.'],
      ['Resistance', 'Less damage taken of that element, up to 75%. Every Map 1 item has some Fire resistance.'],
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
      ['Codex', 'A class-only gear slot (bottom right of the character sheet). Random stats like gear (the only source of All Resistances) plus one fixed passive that boosts a playstyle. Codexes drop only from bosses, one per class per boss.'],
      ['Gear Score / Deck Level / Power', 'Gear score is the average item level of your 13 slots; deck level rates your best 20 cards; Power is the average of the two.'],
      ['Item power', 'Shown on upgrade badges: an item\'s stats added up by their value. Stats your class barely uses count for a quarter.'],
    ]],
    ['Defense', [
      ['Block / Barrier / Dodge / Parry', 'Your class\'s defense (Warrior and Paladin: Block, Mage: Barrier, Rogue: Dodge; Parry is Warrior Block). It absorbs damage before HP. Half of it fades at the start of your turn. Poison goes straight past it.'],
      ['Full parry', 'An enemy hit fully absorbed by your defense. Some cards and Powers trigger on it.'],
      ['Stealth', 'Single-target enemy cards can\'t pick you. It ends at the start of your next turn, or when you play a card that hits all enemies.'],
      ['Taunt', 'Enemies must attack this hero until their next turn.'],
      ['Untouchable / Immune', 'No damage (or no damage of a named type) until your next turn.'],
      ['Reflect', 'The next debuff on you goes back to the enemy that applied it.'],
    ]],
    ['Debuffs', [
      ['Weak', 'Deals that % less damage. Halves at the end of each turn.'],
      ['Vulnerable', 'Takes that % more damage. Halves at the end of each turn.'],
      ['Bleed', 'Takes damage equal to its stacks at the start of its turn (Block absorbs it), then loses 1 stack.'],
      ['Poison', 'Like Bleed, but ignores Block.'],
      ['Burn', 'Like Bleed: damage each turn equal to its stacks, then -1.'],
      ['Chill', 'Lowers Initiative by its stacks. At 10 Chill it Freezes: loses its next turn. Drops by 1 each turn.'],
      ['Slow', 'Lowers Initiative by its stacks.'],
      ['Disarm', 'Can\'t play Attacks next turn.'],
      ['Silence', 'An enemy that is Silenced only plays Attacks on its next turn.'],
      ['Counterspell', 'The enemy\'s next card does nothing.'],
      ['Condemnation', 'Takes +1% Holy damage per stack. Halves after each enemy turn.'],
      ['Unwarded', 'Takes +1% Skill (spell) damage per stack. Halves after each enemy turn.'],
      ['Exposure', 'Its cards cost 5% more mana per stack.'],
      ['Cannot heal / Grievous', 'Cannot heal until your next turn / healing received is halved for 2 turns.'],
      ['Draws fewer', 'The enemy draws that many fewer cards for its next turn.'],
      ['Mana drain', 'Stealing or burning an enemy\'s mana takes what it has, then what it would regenerate next turn, so it plans fewer cards.'],
    ]],
    ['Cards', [
      ['Attack / Skill / Power', 'Attacks scale with Strength, Skills with Intelligence. A Power is played once and stays active for the whole fight (shown with a ◆ on your hero).'],
      ['Exhaust', 'Removed for the rest of the fight after it is played.'],
      ['Retain', 'Stays in your hand at the end of your turn instead of being discarded.'],
      ['Fatigue', 'Every time your deck reshuffles, a Fatigue (unplayable) is shuffled in. Long fights clog your deck.'],
      ['Dazed', 'A junk card. Costs 0 and does nothing; playing it exhausts it.'],
      ['Stun', 'Unplayable junk that stays in the deck.'],
      ['Cards in enemy decks', 'Some of your cards add cards to an enemy\'s deck: Dazed, Stun and Fatigue are wasted draws; Venom gives 3 Poison, Frostbite 3 Chill, Hex 10 Vulnerable and Living Bomb explodes for 15 Fire damage when drawn.'],
      ['Ranks (+1 to +10)', 'Feed spare cards to a card at the Scribe to rank it up: bigger numbers, or cheaper to play.'],
      ['Devotion', 'Paladin. Each stack adds +2 to your next Holy damage, then it is spent.'],
      ['Blood Debt', 'Warrior. Stores the HP you lose; some cards turn it into damage or Block.'],
      ['Card rarity', 'White, Green, Blue, Gold. A deck holds 20 to 30 cards: at most 2 Gold, 4 Blue and 6 Green.'],
    ]],
    ['Combat', [
      ['Turn order', 'Everyone acts in Initiative order each round. The bar at the top shows it; the glowing tile is acting now.'],
      ['Enemy intents', 'The chips above an enemy are the cards it will play next turn, in order, with their damage and who they are aimed at. Crossed-out ones it can\'t afford.'],
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
