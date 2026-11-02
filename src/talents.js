// Codex talent trees (Nov 1). Every codex has 10 rows; a new row opens every 2 codex levels (max level 20).
// Each row has an Offense, a Defense and a Support talent: pick one per row (free respec in town).
// Row 10 is the capstone: a Power that is already in play at the start of every fight.
// fx are read by the engine (talentDef in engine.js). {D} in text becomes the class's defense (Block, Dodge, Barrier).
(function (r) {
  const T = (n, t, ...fx) => ({ n, t, fx });
  const X = (t) => Object.assign(t, { halved: true }); // Nov 2: numbers set exactly (skip the halving pass at the bottom)
  const NAME = { dread: 'Dreading', rot: 'Rotting', beacon: 'Beaconed', burn: 'Burning', bleed: 'Bleeding', poison: 'Poisoned', vulnerable: 'Vulnerable', weak: 'Weak', chill: 'Chilled', exposure: 'Exposed', block: 'with Block' };
  const ADJ = { dread: 'Dread', rot: 'Rot', burn: 'Burn', bleed: 'Bleed', poison: 'Poison', vulnerable: 'Vulnerable', weak: 'Weak', chill: 'Chill', exposure: 'Exposure' };
  // ---- text helpers (keep the words and the numbers together)
  const kindTxt = (f) => (f && f.dtype ? f.dtype + ' ' : '') + (f && f.key === 'shuriken' ? 'Shuriken ' : f && f.type ? f.type + ' ' : '') + 'damage';
  const vsTxt = (f) => !f || !f.vs ? '' : f.vs.includes(':') ? ` to targets with ${f.vs.split(':')[1]}+ ${ADJ[f.vs.split(':')[0]]}` : f.vs === 'block' ? ' to targets that have Block' : ` to ${NAME[f.vs]} targets`;
  const selfTxt = (c) => { if (!c) return ''; const [k, v] = c.split(':');
    return { block: v ? ` while you have ${v}+ {D}` : ' while you have {D}', stealth: ' while in Stealth', devotion: v ? ` while you have ${v}+ Devotion` : ' while you have Devotion',
      any: ` while any enemy is ${NAME[v]}`, prevSkill: ' right after a Skill', prevAttack: ' right after an Attack', elems: ` once you have played ${v}+ elements this turn`, lowhp: ' while below 50% HP' }[k] || ''; };
  const costTxt = (f) => f && f.minCost ? ` costing ${f.minCost}+` : '';
  const dmg = (n, pct, f) => T(n, `+${pct}% ${kindTxt(f)}${costTxt(f)}${vsTxt(f)}${selfTxt(f && f.self)}.`, ['dmg', pct, f || {}]);
  const crit = (n, pct, f) => T(n, `+${pct}% crit chance${f && (f.type || f.key) ? ' with ' + (f.key === 'shuriken' ? 'Shurikens' : f.type + 's') : ''}${selfTxt(f && f.self)}.`, ['crit', pct, f || {}]);
  const critX = (n, pct) => T(n, `Crits deal +${pct}% damage.`, ['critX', pct]);
  const flat = (n, pct, f) => T(n, `${f && f.type ? f.type + 's' : 'Your hits'} deal bonus damage equal to ${pct}% of your {D}.`, ['flat', 'block', pct, f || {}]);
  const per = (n, st, step, pct, max, f) => T(n, `+${pct}% ${kindTxt(f)} for every ${step} ${ADJ[st]} on the target (max +${max}%).`, ['dmgPer', st, step, pct, max, f || {}]);
  const dotPlus = (n, st, k) => T(n, `${ADJ[st]} you apply is increased by ${k}.`, ['dotPlus', st, k]);
  const dotX = (n, st, pct) => T(n, `${ADJ[st]} you apply is increased by ${pct}%.`, ['dotX', st, pct]);
  const startDot = (n, st, k) => T(n, `At the start of each fight, apply ${k} ${ADJ[st]} to all enemies.`, ['start', st === 'chill' || !['burn', 'bleed', 'poison', 'dread', 'rot'].includes(st) ? 'debuff' : 'dot', k, st]);
  const turnDot = (n, st, k) => T(n, `At the start of each of your turns, apply ${k} ${ADJ[st]} to all enemies.`, ['turn', st === 'chill' || !['burn', 'bleed', 'poison', 'dread', 'rot'].includes(st) ? 'debuff' : 'dot', k, st]);
  const every = (n, N, f, st, k) => T(n, `Every ${N === 3 ? '3rd' : N + 'th'} ${f.dtype ? f.dtype + ' ' : ''}${f.type || 'card'} you play in a turn applies ${k} ${ADJ[st]} to all enemies.`, ['every', N, f, ['burn', 'bleed', 'poison', 'dread', 'rot'].includes(st) ? 'dot' : 'debuff', k, st]);
  const spread = (n, st) => T(n, `When an enemy dies, its ${ADJ[st]} spreads to every other enemy.`, ['kill', 'spread', 0, st]);
  const def = (n, pct, c) => T(n, `{D} you gain is increased by ${pct}%${selfTxt(c)}.`, ['def', pct, c]);
  const inc = (n, pct, c) => T(n, `Take ${pct}% less damage${selfTxt(c)}.`, ['incoming', pct, c]);
  const startDef = (n, k) => T(n, `Start each fight with ${k} {D}.`, ['start', 'block', k]);
  const turnDef = (n, k) => T(n, `Gain ${k} {D} at the start of each of your turns.`, ['turn', 'block', k]);
  const lowhp = (n, pct, mode) => T(n, mode === 'heal' ? `Once per fight, when you drop below 30% HP, heal ${pct}% of your max HP.` : `Once per fight, when you drop below 30% HP, gain {D} equal to ${pct}% of your max HP${mode === 'stealth' ? ' and enter Stealth' : ''}.`, ['lowhp', pct, mode]);
  const cheat = (n, k, mode) => T(n, mode === 'heal' ? `Once per fight, a killing blow leaves you at 1 HP instead, then you heal ${k}% of your max HP.` : `Once per fight, a killing blow leaves you at 1 HP instead, with ${k} {D}.`, ['cheat', k, mode]);
  const hitDot = (n, st, k) => T(n, `Enemies that hit you gain ${k} ${ADJ[st]}.`, ['hitBy', ['burn', 'bleed', 'poison', 'dread', 'rot'].includes(st) ? 'dot' : 'debuff', k, st]);
  const back = (n, k) => T(n, `When an enemy attack hits your {D}, it takes ${k} damage back.`, ['hitBy', 'back', k]);
  const healTurn = (n, pct, c) => T(n, `Heal ${pct}% of your max HP at the start of each of your turns${selfTxt(c)}.`, ['turn', 'heal', pct, null, c]);
  const startMana = (n, k) => T(n, `Start each fight with +${k} mana.`, ['start', 'mana', k]);
  const regen = (n, k) => T(n, `+${k} mana regeneration.`, ['stat', 'regen', k]);
  const killDraw = (n, k) => T(n, `Draw ${k} card${k > 1 ? 's' : ''} when you kill an enemy.`, ['kill', 'draw', k]);
  const maxMana = (n, k) => T(n, `+${k} maximum mana.`, ['stat', 'maxMana', k]);
  const draw1 = (n) => T(n, 'Draw 1 extra card each turn.', ['stat', 'draw', 1]);
  const turnMana = (n, k, c) => T(n, `Gain ${k} mana at the start of each of your turns${selfTxt(c)}.`, ['turn', 'mana', k, null, c]);
  const turnDraw = (n, k, c) => T(n, `Draw ${k} extra card${k > 1 ? 's' : ''} at the start of each of your turns${selfTxt(c)}.`, ['turn', 'draw', k, null, c]);
  const rally = (n, pct, vs) => T(n, `You and your allies deal +${pct}% damage${vs ? ` to ${NAME[vs]} targets` : ''}.`, ['dmg', pct, vs ? { vs } : {}], ['aura', [['dmg', pct, vs ? { vs } : {}]]]);
  const shelter = (n, pct) => T(n, `You and your allies take ${pct}% less damage.`, ['incoming', pct], ['aura', [['incoming', pct]]]);
  const firstCost = (n, k, f) => T(n, `The first ${f.dtype ? f.dtype + ' ' : ''}${f.type || 'card'} you play each turn costs ${k} less.`, ['firstCost', k, f]);
  const cost = (n, k, f) => T(n, `${f.dtype ? f.dtype + ' ' : ''}${f.type || 'Card'}s${costTxt(f)} cost ${k} less.`, ['cost', k, f]);

  // mini capstone (row 5) Support: a buff for you and every ally, a different one per codex
  const PS = { dmg: ['+10% damage'], crit: ['+10% crit chance'], critMult: ['+10% crit damage'], dexterity: ['+10 Dexterity (+10% Block, Dodge and Barrier gained)'], strength: ['+10 Strength (+10% Attack damage)'],
    intelligence: ['+10 Intelligence (+10% Skill damage)'], spirit: ['+10 Spirit (+10% healing and damage over time)'], lifesteal: ['5% lifesteal'], maxHpPct: ['+10% max HP'], maxManaPct: ['+10% max mana'],
    regenPct: ['+10% mana regeneration'], luck: ['+10 Luck (better loot)'], resistAll: ['+10% resistance to every element'], multiHit: ['+10% Multi-hit chance'], multicast: ['+10% Multicast chance'],
    multiplay: ['+10% Multiplay chance'], initPct: ['+10% Initiative'], heal: ['+10% healing'], bleedChance: ['+10% chance for Attacks to apply 3 Bleed'], thorns: ['+5 Thorns (attackers take 5 damage)'], recovery: ['+5 Recovery (heal 5 HP at the start of each turn)'] };
  const PV = { lifesteal: 5, thorns: 5, recovery: 5 };
  const party = (n, stat) => stat === 'heal' ? T(n, 'You and your allies heal +10% more.', ['heal', 10], ['aura', [['heal', 10]]]) : stat === 'dmg' ? T(n, 'You and your allies deal +10% damage.', ['dmg', 10, {}], ['aura', [['dmg', 10, {}]]])
    : stat === 'luck' ? T(n, `You and your allies gain ${PS[stat][0]}.`, ['run', 'partyLuck', 10]) : T(n, `You and your allies gain ${PS[stat][0]}.`, ['party', stat, PV[stat] || 10]);
  // ---- class templates for the Defense and Support columns (a codex can replace any row)
  const DEF = {
    Warrior: [startDef('Braced', 8), def('Reinforced', 8), inc('Thick Skin', 5), turnDef('Hold Fast', 4), lowhp('Last Wall', 25), def('Bulwark Training', 15), inc('Iron Hide', 10), turnDef('Fortress', 8), cheat('Unbroken', 40)],
    Rogue: [startDef('Light Feet', 8), def('Evasion Drills', 8), inc('Slippery', 5), turnDef('Shadowstep', 4), lowhp('Vanish', 25, 'stealth'), def('Untouchable', 15), inc('Smoke and Shade', 10), turnDef('Phantom Step', 8), cheat('Cheat Death', 40)],
    Mage: [startDef('Warded', 8), def('Ward Weaving', 8), inc('Mana Skin', 5), turnDef('Glyph', 4), lowhp('Emergency Ward', 25), def('Ward Mastery', 15), inc('Arcane Skin', 10), turnDef('Living Glyph', 8), cheat('Phoenix', 40)],
    Warlock: [startDef('Dark Shroud', 8), def('Shadow Weave', 8), inc('Fel Skin', 5), turnDef('Nether Glyph', 4), lowhp('Soulstone', 25), def('Void Mastery', 15), inc('Demon Hide', 10), turnDef('Living Shadow', 8), cheat('Soul Bargain', 40)],
    Paladin: [startDef('Shield of Faith', 8), def('Devout Guard', 8), inc('Blessed', 5), turnDef('Vigilance', 4), lowhp('Divine Shield', 25), def('Holy Bulwark', 15), inc('Armor of Light', 10), turnDef('Sanctuary Wall', 8), cheat('Divine Intervention', 40)],
  };
  const SUP = {
    Warrior: [startMana('Second Breath', 10), regen('Steady Breathing', 5), killDraw('Spoils of Battle', 1), maxMana('Deep Lungs', 15), draw1('War Drums'), turnMana('Field Rations', 5), rally('Rally Cry', 10), regen('Endless Reserve', 10), shelter('War Banner', 10)],
    Rogue: [startMana('Quick Start', 10), regen('Even Breath', 5), killDraw('Loot the Body', 1), maxMana('Deep Pockets', 15), draw1('Sleight of Hand'), turnMana('Hidden Stash', 5), rally('Mark the Target', 10), regen('Second Wind', 10), shelter('Shadow Pact', 10)],
    Mage: [startMana('Spark', 10), regen('Ley Flow', 5), killDraw('Soul Harvest', 1), maxMana('Mana Well', 15), draw1('Foresight'), turnMana('Channel', 5), rally('Empower', 10), regen('Wellspring', 10), shelter('Arcane Shelter', 10)],
    Warlock: [startMana('Dark Spark', 10), regen('Fel Flow', 5), killDraw('Soul Shard', 1), maxMana('Void Well', 15), draw1('Dark Foresight'), turnMana('Siphon', 5), rally('Dark Empowerment', 10), regen('Abyssal Spring', 10), shelter('Shadow Shelter', 10)],
    Paladin: [startMana('Morning Prayer', 10), regen('Blessed Breath', 5), killDraw('Last Rites', 1), maxMana('Deep Faith', 15), draw1('Revelation'), turnMana('Tithe', 5), rally('Inspire', 10), regen('Grace', 10), shelter('Aura of Protection', 10)],
  };
  // ---- the 24 codexes: off = 9 offense talents; d / s = rows (1-9) replaced in the Defense / Support templates; cap = [offense, defense, support] capstone Powers
  const CX = {
    // Warrior
    bulwark: { party: party('Shield Wall', 'dexterity'), cls: 'Warrior', cap: ['thorned_bulwark', 'guardian_s_oath', 'deep_reserves'],
      off: [dmg('Shield Edge', 5, { type: 'Attack', self: 'block' }), dmg('Shield Breaker', 8, { type: 'Attack', vs: 'block' }), flat('Shield Drill', 5, { type: 'Attack' }), dmg('Weight of Steel', 12, { type: 'Attack', self: 'block:20' }),
        flat('Rampart Slam', 15, { type: 'Attack' }), dmg('Crushing Weight', 15, { type: 'Attack', self: 'block' }), flat('Steel Tide', 10, { type: 'Attack' }), dmg('Juggernaut', 25, { type: 'Attack', self: 'block:40' }), flat('Tower of Steel', 30, { type: 'Attack' })],
      d: { 3: back('Spiked Plate', 4) }, s: {} },
    riposte: { party: party('Killer Instinct', 'critMult'), cls: 'Warrior', cap: ['expose_opening', 'partial_guard', 'second_lung'],
      off: [X(T('Duelist\'s Poise', '100% of your Strength is converted to Dexterity (more Parry).', ['convert', 'strength', 'dexterity', 100])), back('Counter Edge', 3), dmg('Read the Opening', 10, { type: 'Attack', vs: 'vulnerable' }), back('Barbed Guard', 6),
        T('Punishing Parry', 'When you fully Parry an attack, the attacker takes 15 damage.', ['full', 'back', 15]), dmg('Riposte Mastery', 15, { type: 'Attack', vs: 'vulnerable' }), back('Sharpened Guard', 10),
        dmg('Exploit', 25, { type: 'Attack', vs: 'vulnerable:20' }), T('Blade Dancer', 'When you fully Parry an attack, draw 1 card and gain 10 mana.', ['full', 'draw', 1], ['full', 'mana', 10])],
      d: { 7: T('Counterweight', 'When you fully Parry an attack, the attacker gains 10 Vulnerable.', ['full', 'debuff', 10, 'vulnerable']) }, s: {} },
    bloodbound: { party: party('Blood Bond', 'lifesteal'), cls: 'Warrior', cap: ['blood_clock', 'pay_in_blood', 'blood_ritual'],
      off: [dotPlus('Open Veins', 'bleed', 1), dmg('Blood Scent', 8, { type: 'Attack', vs: 'bleed' }), startDot('Sanguine Start', 'bleed', 5), dotX('Deep Cuts', 'bleed', 20),
        spread('Exsanguinator', 'bleed'), dmg('Red Frenzy', 15, { type: 'Attack', vs: 'bleed' }), every('Crimson Tide', 3, { type: 'Attack' }, 'bleed', 6), per('Bloodletting Edge', 'bleed', 10, 5, 25, { type: 'Attack' }), dotX('Blood Moon', 'bleed', 50)],
      d: { 8: healTurn('Transfusion', 3, 'any:bleed') }, s: { 9: rally('Blood Brothers', 15, 'bleed') } },
    colossus: { party: party('War Cry', 'strength'), cls: 'Warrior', cap: ['unstoppable_force', 'iron_will', 'deep_reserves'],
      off: [X(T('Rattled Giant', '+50% damage to enemies that have a Stun in their hand.', ['dmg', 50, { vs: 'stunHand' }])), T('Brute Force', 'Start each fight with +10 Strength.', ['start', 'str', 10]), dmg('Titan Grip', 12, { type: 'Attack', minCost: 30 }), firstCost('Thunderous', 5, { type: 'Attack' }),
        dmg('Colossal Blow', 25, { type: 'Attack', minCost: 30 }), dmg('Unstoppable', 15, { type: 'Attack' }), cost('Titan\'s Hunger', 5, { type: 'Attack', minCost: 20 }), T('Avalanche', 'Start each fight with +30 Strength.', ['start', 'str', 30]), dmg('World Breaker', 40, { type: 'Attack', minCost: 30 })],
      d: {}, s: { 6: turnMana('Bottomless', 10) } },
    sunderer: { party: party('Rally Cry', 'dmg'), cls: 'Warrior', cap: ['open_wounds', 'thorned_bulwark', 'momentum'],
      off: [dmg('Weak Points', 5, { vs: 'vulnerable' }), startDot('Expose', 'vulnerable', 10), dmg('Armor Splitter', 10, { type: 'Attack', vs: 'vulnerable' }), dmg('Shatterpoint', 12, { type: 'Attack', vs: 'vulnerable:20' }),
        every('Sundering Wave', 3, { type: 'Attack' }, 'vulnerable', 10), dmg('Executioner', 15, { type: 'Attack', vs: 'vulnerable' }), dmg('Rend Armor', 20, { type: 'Attack', vs: 'vulnerable:40' }), turnDot('Open Season', 'vulnerable', 5), per('Total Collapse', 'vulnerable', 10, 5, 40)],
      d: { 3: hitDot('Jagged Plate', 'vulnerable', 5) }, s: { 9: rally('Pile On', 15, 'vulnerable') } },
    hemorrhage: { party: party('Keen Eyes', 'crit'), cls: 'Warrior', cap: ['mortal_precision', 'thorned_bulwark', 'momentum'],
      off: [crit('Keen Edge', 3), dotPlus('Bleeding Strikes', 'bleed', 1), crit('Precision', 5, { type: 'Attack' }), critX('Vicious', 20),
        crit('Arterial', 10), dmg('Blood in the Water', 15, { type: 'Attack', vs: 'bleed' }), critX('Lethal Focus', 40), dotX('Torn Flesh', 'bleed', 30), T('Death by a Thousand Cuts', '+15% crit chance and crits deal +25% damage.', ['crit', 15, {}], ['critX', 25])],
      d: {}, s: { 3: T('Bloodrush', 'Gain 10 mana when you kill an enemy.', ['kill', 'mana', 10]) } },
    // Rogue
    nightstalker: { party: party('Haste', 'initPct'), cls: 'Rogue', cap: ['first_blood', 'nimble', 'smuggler_s_hoard'],
      off: [dmg('Lurker', 5, { type: 'Attack', self: 'stealth' }), T('Shadow Start', 'Start each fight in Stealth.', ['start', 'stealth', 1]), crit('Ambusher', 10, { type: 'Attack', self: 'stealth' }), dmg('Backstab', 12, { type: 'Attack', self: 'stealth' }),
        T('Shadow Dance', 'Enter Stealth whenever you kill an enemy.', ['kill', 'stealth', 1]), dmg('Assassin\'s Mark', 15, { type: 'Attack', vs: 'vulnerable' }), dmg('Deadly Shade', 25, { type: 'Attack', self: 'stealth' }),
        T('Silent Death', '+10% crit chance and crits deal +30% damage.', ['crit', 10, {}], ['critX', 30]), dmg('Nightfall', 40, { type: 'Attack', self: 'stealth' })],
      d: {}, s: {} },
    venomancer: { party: party('Blessing of Spirit', 'spirit'), cls: 'Rogue', cap: ['accelerant_venom', 'nimble', 'the_long_game'],
      off: [dotPlus('Toxic', 'poison', 1), dmg('Venom Sense', 8, { vs: 'poison' }), startDot('Miasma', 'poison', 6), dotX('Potent', 'poison', 20),
        spread('Plague Carrier', 'poison'), dmg('Corrosion', 15, { vs: 'poison' }), every('Toxic Cloud', 3, { type: 'Attack' }, 'poison', 5), per('Necrosis', 'poison', 10, 5, 25), dotX('Lethal Dose', 'poison', 50)],
      d: { 3: hitDot('Venomous Hide', 'poison', 3) }, s: { 9: rally('Plague Doctor', 15, 'poison') } },
    bloodletter: { party: party('Opened Arteries', 'bleedChance'), cls: 'Rogue', cap: ['open_veins', 'fleetfooted', 'quickened_pulse'],
      off: [dotPlus('Nicks', 'bleed', 1), dmg('Scent of Blood', 8, { vs: 'bleed' }), startDot('Serrated Start', 'bleed', 5), dotX('Jagged', 'bleed', 25),
        spread('Bloodbath', 'bleed'), dmg('Frenzy', 15, { vs: 'bleed' }), every('Ribbons', 3, { type: 'Attack' }, 'bleed', 5), per('Exsanguinate', 'bleed', 10, 5, 25), T('Crimson Rain', 'Bleed you apply is increased by 2 and by 30%.', ['dotPlus', 'bleed', 2], ['dotX', 'bleed', 30])],
      d: {}, s: { 9: rally('Feeding Frenzy', 15, 'bleed') } },
    ninja: { party: party('Quick Hands', 'multiplay'), cls: 'Rogue', cap: ['sharpened_stars', 'reflexive_volley', 'hidden_pockets'],
      off: [T('Sharp Stars', 'Shurikens deal 1 more damage.', ['shurPlus', 1]), T('Pocketful', 'Start each fight with a Shuriken in hand.', ['start', 'shuriken', 1]), T('Star Training', 'Shurikens deal 2 more damage.', ['shurPlus', 2]), T('Spare Stars', 'Start each fight with 2 more Shurikens in hand.', ['start', 'shuriken', 2]),
        T('Storm of Blades', 'Shurikens deal 5 more damage.', ['shurPlus', 5]), crit('Deadly Aim', 10, { key: 'shuriken' }), T('Endless Supply', 'Add a Shuriken to your hand at the start of each of your turns.', ['turn', 'shuriken', 1]), dmg('Steel Rain', 25, { key: 'shuriken' }), T('Thousand Stars', 'Shurikens deal 8 more damage.', ['shurPlus', 8])],
      d: {}, s: {} },
    saboteur: { party: party('Fortune', 'luck'), cls: 'Rogue', cap: ['cut_the_thread', 'smoke_and_mirrors', 'quartermaster'],
      off: [dmg('Dirty Fighting', 5, { vs: 'weak' }), startDot('Rattled', 'weak', 10), dmg('Low Blow', 10, { vs: 'weak' }), T('Disrupt', 'At the start of each fight, every enemy discards 1 card.', ['start', 'discard', 1]),
        turnDot('Sabotage Kit', 'weak', 5), dmg('Exploit Weakness', 15, { vs: 'weak' }), T('Jam the Works', 'At the start of each fight, add 2 Dazed to every enemy\'s draw pile.', ['start', 'dazed', 2]), dmg('Crippling', 25, { vs: 'weak:20' }),
        T('Total Sabotage', 'At the start of each of your turns, every enemy discards 1 card.', ['turn', 'discard', 1])],
      d: { 3: hitDot('Tripwire', 'weak', 5) }, s: { 9: rally('Easy Pickings', 15, 'weak') } },
    phantom: { party: party('Flurry', 'multiHit'), cls: 'Rogue', cap: ['shadow_reflexes', 'fleetfooted', 'afterimage'],
      off: [dmg('Phase', 5, { type: 'Attack', self: 'block' }), flat('Afterimage Strike', 5, { type: 'Attack' }), dmg('Blur', 10, { type: 'Attack', self: 'block' }), flat('Phantom Edge', 10, { type: 'Attack' }),
        flat('Spectral Blade', 20, { type: 'Attack' }), dmg('Wraith', 15, { type: 'Attack', self: 'block' }), T('Fade', 'When an attack is fully absorbed by your Dodge, the attacker takes 10 damage.', ['full', 'back', 10]), dmg('Haunt', 25, { type: 'Attack', self: 'block:30' }), flat('Specter Lord', 35, { type: 'Attack' })],
      d: {}, s: { 3: T('Slip Away', 'When an attack is fully absorbed by your Dodge, draw 1 card.', ['full', 'draw', 1]) } },
    // Mage
    heart_of_winter: { party: party('Elemental Ward', 'resistAll'), cls: 'Mage', cap: ['elemental_memory', 'glyph_of_warding', 'quick_study'],
      off: [dmg('Frostbite', 5, { dtype: 'Frost' }), startDot('Cold Snap', 'chill', 3), dmg('Shatter', 10, { dtype: 'Frost', vs: 'chill' }), dmg('Deep Freeze', 12, { dtype: 'Frost', minCost: 20 }),
        every('Winter\'s Grip', 3, { type: 'Skill', dtype: 'Frost' }, 'chill', 4), dmg('Glacial', 15, { dtype: 'Frost' }), dmg('Brittle', 20, { vs: 'chill:5' }), turnDot('Permafrost', 'chill', 2), dmg('Absolute Zero', 35, { dtype: 'Frost' })],
      d: { 3: hitDot('Frost Armor', 'chill', 2) }, s: { 9: rally('Frozen Field', 15, 'chill') } },
    spellstorm: { party: party('Wellspring Aura', 'regenPct'), cls: 'Mage', cap: ['spellweaving', 'malediction_mirror', 'torrent'],
      off: [dmg('Arcane Focus', 5, { dtype: 'Arcane' }), firstCost('Flow', 5, { type: 'Skill', dtype: 'Arcane' }), dmg('Overcharge', 10, { dtype: 'Arcane' }), T('Arcane Surge', 'Every 3rd Arcane Skill you play in a turn draws a card.', ['every', 3, { type: 'Skill', dtype: 'Arcane' }, 'draw', 1]),
        cost('Storm Caller', 5, { type: 'Skill', dtype: 'Arcane' }), dmg('Unstable', 15, { dtype: 'Arcane' }), T('Mana Torrent', 'Every 3rd Skill you play in a turn gives you 10 mana.', ['every', 3, { type: 'Skill' }, 'mana', 10]), crit('Amplified', 10, { type: 'Skill' }), dmg('Eye of the Storm', 30, { dtype: 'Arcane' })],
      d: {}, s: {} },
    conflagration: { party: party('Arcane Brilliance', 'intelligence'), cls: 'Mage', cap: ['flashpoint', 'malediction_mirror', 'evocation'],
      off: [dotPlus('Kindling', 'burn', 1), dotX('Hotter Coals', 'burn', 10), dmg('Searing', 10, { dtype: 'Fire', vs: 'burn' }), startDot('Stoke the Pyre', 'burn', 6),
        spread('Wildfire', 'burn'), per('Melting Point', 'burn', 10, 5, 25, { dtype: 'Fire' }), every('Pyromania', 3, { type: 'Skill', dtype: 'Fire' }, 'burn', 6), dmg('Firestorm', 20, { dtype: 'Fire', vs: 'burn' }), dotX('Inferno Heart', 'burn', 50)],
      d: { 1: startDef('Warm Hands', 8), 2: def('Cinder Mantle', 10, 'any:burn'), 3: hitDot('Ember Skin', 'burn', 3), 5: lowhp('Phoenix Ward', 25), 6: inc('Scorched Earth', 10, 'any:burn'), 7: healTurn('Cauterizing Heat', 3, 'any:burn'), 8: turnDef('Heat Shield', 8), 9: cheat('Rekindle', 30) },
      s: { 2: firstCost('Tinder Box', 5, { type: 'Skill', dtype: 'Fire' }), 3: killDraw('Stoke', 1), 4: T('Combustion Engine', 'Gain 2 mana per Burning enemy at the start of each of your turns.', ['turn', 'manaPer', 2, 'burn']), 5: turnDraw('Kindled Mind', 1, 'any:burn'), 9: rally('Signal Fire', 15, 'burn') } },
    barrier_savant: { party: party('Fortitude', 'maxHpPct'), cls: 'Mage', cap: ['potency', 'glyph_of_warding', 'barrier_battery'],
      off: [dmg('Charged Ward', 5, { type: 'Skill', self: 'block' }), flat('Ward Shards', 5, { type: 'Skill' }), dmg('Kinetic Ward', 10, { type: 'Skill', self: 'block' }), flat('Ward Lance', 10, { type: 'Skill' }),
        flat('Overload', 20, { type: 'Skill' }), dmg('Arcane Bulwark', 15, { type: 'Skill', self: 'block:20' }), back('Reflective Ward', 8), dmg('Ward Mastery', 25, { type: 'Skill', self: 'block:40' }), flat('Aegis Cannon', 35, { type: 'Skill' })],
      d: { 1: X(T('Staff and Shield', 'You can carry a shield in your off-hand while wielding a staff.', ['gear', 'staffShield'])), 6: def('Layered Wards', 20) }, s: {} },
    entropy: { party: party('Deep Well', 'maxManaPct'), cls: 'Mage', cap: ['temporal_siphon', 'malediction_mirror', 'evocation'],
      off: [dmg('Siphon', 5, { vs: 'exposure' }), startDot('Entropic Start', 'exposure', 3), dmg('Decay', 10, { vs: 'exposure' }), T('Leech', 'Gain 15 mana when you kill an enemy.', ['kill', 'mana', 15]),
        turnDot('Void Pull', 'exposure', 2), dmg('Unravel', 15, { vs: 'exposure' }), per('Collapse', 'exposure', 2, 5, 30), T('Mana Burn', 'At the start of each of your turns, drain 10 mana from every enemy.', ['turn', 'drain', 10]), dmg('Heat Death', 30, { vs: 'exposure' })],
      d: {}, s: { 9: rally('Shared Ruin', 15, 'exposure') } },
    archmage: { party: party('Arcane Echo', 'multicast'), cls: 'Mage', cap: ['rule_of_three', 'glyph_of_warding', 'arcane_ascension'],
      off: [dmg('Studied', 5, { type: 'Skill' }), T('Prism', '+10 Intelligence.', ['stat', 'intelligence', 10]), dmg('Versatile', 10, { type: 'Skill', self: 'elems:2' }), crit('Elemental Focus', 10, { type: 'Skill' }),
        dmg('Convergence', 20, { type: 'Skill', self: 'elems:3' }), dmg('Erudite', 15, { type: 'Skill' }), T('Arcane Mind', 'Every 3rd Skill you play in a turn draws a card.', ['every', 3, { type: 'Skill' }, 'draw', 1]), critX('Overmind', 40), dmg('Archmagus', 30, { type: 'Skill', self: 'elems:2' })],
      d: {}, s: {} },
    // Paladin
    bastion_of_faith: { party: party('Retribution', 'thorns'), cls: 'Paladin', cap: ['crusader_s_zeal', 'retribution_aura', 'divine_plea'],
      off: [dmg('Holy Edge', 5, { dtype: 'Holy' }), flat('Faithful Guard', 5, { type: 'Attack' }), dmg('Smiting', 10, { dtype: 'Holy' }), flat('Bulwark of Light', 10, { type: 'Attack' }),
        dmg('Hammer of Faith', 20, { dtype: 'Holy', self: 'block' }), dmg('Crusade', 15, { dtype: 'Holy' }), back('Radiant Shield', 6), flat('Judgement', 20, { type: 'Attack' }), dmg('Bastion Eternal', 30, { dtype: 'Holy', self: 'block' })],
      d: {}, s: {} },
    purifier: { party: party('Renewing Light', 'recovery'), cls: 'Paladin', cap: ['delayed_judgment', 'cleansing_light', 'purifying_grace'],
      off: [dmg('Purge', 5, { dtype: 'Holy' }), T('Morning Rite', 'Remove 1 debuff from yourself at the start of each of your turns.', ['turn', 'cleanse', 1]), dmg('Righteous Fire', 10, { dtype: 'Holy' }), startDot('Weaken Evil', 'weak', 10),
        dmg('Exorcism', 20, { dtype: 'Holy', vs: 'weak' }), dmg('Zealot', 15, { dtype: 'Holy' }), T('Absolution', 'Heal 5% of your max HP when you kill an enemy.', ['kill', 'heal', 5]), dmg('Holy Fire', 25, { dtype: 'Holy', vs: 'weak:10' }),
        T('Divine Purge', 'At the start of each of your turns, all enemies gain 10 Weak and you remove 1 debuff from yourself.', ['turn', 'debuff', 10, 'weak'], ['turn', 'cleanse', 1])],
      d: {}, s: {} },
    righteous_crusader: { party: party('Rally Cry', 'dmg'), cls: 'Paladin', cap: ['sacred_momentum', 'shield_of_the_crusade', 'crusader_aura'],
      off: [dmg('Rhythm', 5), dmg('Crusader Training', 10, { type: 'Attack', self: 'prevSkill' }), dmg('Tempo', 10, { type: 'Attack' }), def('Balanced Blade', 15, 'prevAttack'),
        dmg('Crusade March', 25, { type: 'Attack', self: 'prevSkill' }), dmg('Steady Hand', 15, { type: 'Attack' }), T('Iron Rhythm', 'Every 3rd Attack you play in a turn gives 10 Block.', ['every', 3, { type: 'Attack' }, 'block', 10]),
        dmg('Holy Tempo', 30, { type: 'Attack', self: 'prevSkill' }), T('Champion', '+25% Attack damage and +15% crit chance right after a Skill.', ['dmg', 25, { type: 'Attack', self: 'prevSkill' }], ['crit', 15, { type: 'Attack', self: 'prevSkill' }])],
      d: {}, s: { 1: X(T('Swift Justice', '50% of your Strength is converted to Initiative.', ['convert', 'strength', 'baseInit', 50])) } },
    sacred_flame: { party: party('Blessing of Spirit', 'spirit'), cls: 'Paladin', cap: ['brand_the_wicked', 'aegis_of_light', 'burning_wisdom'],
      off: [dotPlus('Kindled Faith', 'burn', 1), dmg('Holy Embers', 8, { dtype: 'Holy', vs: 'burn' }), startDot('Sacred Pyre', 'burn', 5), dotX('Purifying Flames', 'burn', 20),
        spread('Wildfire of Faith', 'burn'), dmg('Zeal', 15, { dtype: 'Holy', vs: 'burn' }), every('Flame Rhythm', 3, { type: 'Attack' }, 'burn', 6), per('Inquisitor', 'burn', 10, 5, 25, { dtype: 'Holy' }), dotX('Purgatory', 'burn', 50)],
      d: { 3: hitDot('Burning Aura', 'burn', 3) }, s: { 9: rally('Beacon', 15, 'burn') } },
    divine_wrath: { party: party('Keen Eyes', 'crit'), cls: 'Paladin', cap: ['divine_echo', 'steadfast', 'vigil'],
      off: [T('Prayerful', 'Whenever you gain Devotion, gain 1 more.', ['devPlus', 1]), T('Hymn', 'Start each fight with 3 Devotion.', ['start', 'devotion', 3]), dmg('Wrathful', 10, { type: 'Attack', self: 'devotion' }), T('Faith Builds', 'Gain 1 Devotion at the start of each of your turns.', ['turn', 'devotion', 1]),
        T('Avatar of Wrath', 'Whenever you gain Devotion, gain 2 more.', ['devPlus', 2]), dmg('Zeal', 15, { type: 'Attack', self: 'devotion' }), T('Litany', 'Every 3rd Skill you play in a turn gives 2 Devotion.', ['every', 3, { type: 'Skill' }, 'devotion', 2]),
        crit('Holy Vengeance', 10, { type: 'Attack' }), dmg('Day of Wrath', 30, { type: 'Attack', self: 'devotion:5' })],
      d: {}, s: {} },
    equilibrium: { party: party('Blessed Hands', 'heal'), cls: 'Paladin', cap: ['consecrated_ground', 'sanctuary', 'grace_eternal'],
      off: [T('Mercy\'s Edge', 'Your healing is 5% stronger.', ['heal', 5]), dmg('Balance', 8, { dtype: 'Holy' }), healTurn('Lifebloom', 2), T('Radiance', 'Your healing is 12% stronger.', ['heal', 12]),
        healTurn('Equal Measure', 5), T('Righteous Mend', 'Your healing is 20% stronger.', ['heal', 20]), dmg('Judgement', 20, { dtype: 'Holy' }), T('Overflowing', 'Your healing is 30% stronger.', ['heal', 30]),
        T('Perfect Balance', 'Heal 8% of your max HP at the start of each of your turns, and your healing is 20% stronger.', ['turn', 'heal', 8], ['heal', 20])],
      // Equilibrium cannot gain Block: its Defense column is damage reduction and healing instead
      d: { 5: lowhp('Second Chance', 20, 'heal'), 9: cheat('Rebirth', 30, 'heal') }, s: {}, noBlock: true },
    // Warlock (Nov 1)
    soulbinder: { party: party('Soul Bond', 'heal'), cls: 'Warlock', cap: ['soul_siphon', 'spirit_ward', 'circle_of_souls'],
      off: [dmg('Soul Sight', 5, { vs: 'beacon' }), healTurn('Shared Pain', 2), dmg('Shadow Focus', 10, { dtype: 'Shadow' }), T('Bound Spirits', 'Your healing is 10% stronger.', ['heal', 10]),
        dmg('Soul Rend', 20, { vs: 'beacon' }), dmg('Umbral Focus', 15, { dtype: 'Shadow' }), T('Spirit Link', 'Your healing is 20% stronger.', ['heal', 20]), dmg('Beacon Burn', 30, { vs: 'beacon' }),
        T('Soul Shepherd', 'Your healing is 20% stronger and you deal +15% Shadow damage.', ['heal', 20], ['dmg', 15, { dtype: 'Shadow' }])],
      d: {}, s: { 9: shelter('Spirit Shelter', 15) } },
    blightcaller: { party: party('Blessing of Spirit', 'spirit'), cls: 'Warlock', cap: ['creeping_doom', 'blighted_skin', 'plague_of_dread'],
      off: [X(dmg('Dark Whispers', 2, { dtype: 'Shadow' })), dmg('Dread Sense', 8, { vs: 'dread' }), startDot('Haunting', 'dread', 6), X(dotX('Deeper Dread', 'dread', 5)),
        spread('Contagion', 'dread'), dmg('Terror', 15, { vs: 'dread' }), every('Nightmare', 3, { type: 'Skill' }, 'dread', 5), per('Paralysing Fear', 'dread', 10, 5, 25), X(dotX('Abyssal Dread', 'dread', 10))],
      d: { 3: hitDot('Haunted Skin', 'dread', 3) }, s: { 9: rally('Dread Choir', 15, 'dread') } },
    shadow_knight: { party: party('War Cry', 'strength'), cls: 'Warlock', cap: ['unholy_might', 'bone_armor', 'death_pact'],
      off: [dmg('Dark Edge', 5, { type: 'Attack' }), X(T('Grave Strength', 'Gain bonus Strength equal to 10% of your Stamina.', ['statFrom', 'strength', 'stamina', 10])), dmg('Umbral Blade', 10, { type: 'Attack', dtype: 'Shadow' }), crit('Reaper', 5, { type: 'Attack' }),
        dmg('Executioner\'s Shadow', 25, { type: 'Attack', minCost: 20 }), dmg('Death Knight', 15, { type: 'Attack' }), dmg('Dread Edge', 20, { type: 'Attack', vs: 'dread' }), T('Lord of Ruin', 'Start each fight with +30 Strength.', ['start', 'str', 30]), dmg('Ebon Blade', 35, { type: 'Attack', dtype: 'Shadow' })],
      d: {}, s: {} },
    demonologist: { party: party('Fel Haste', 'initPct'), cls: 'Warlock', cap: ['demonic_pact', 'grim_bulwark', 'infernal_bond'],
      off: [T('Fel Training', 'Your demons deal 10% more damage.', ['stat', 'demonDmg', 10]), T('Summoner\'s Start', 'Summon a Gloom Imp at the start of each fight.', ['start', 'summon', 1, 'imp']), T('Fel Fury', 'Your demons deal 20% more damage.', ['stat', 'demonDmg', 20]), firstCost('Quick Summons', 5, { type: 'Skill' }),
        T('Bound Legion', 'Your demons stay 1 turn longer.', ['stat', 'demonTurns', 1]), T('Fel Mastery', 'Your demons deal 30% more damage.', ['stat', 'demonDmg', 30]), T('Hound Master', 'Summon a Hollow Hound at the start of each fight.', ['start', 'summon', 1, 'hound']),
        dmg('Master\'s Lash', 20, { dtype: 'Shadow' }), T('Lord of the Pit', 'Your demons deal 60% more damage.', ['stat', 'demonDmg', 60])],
      d: { 3: T('Fel Guardian', 'Summon a Bulwark Fiend at the start of each fight.', ['start', 'summon', 1, 'bulwark']) }, s: {} },
    bloodmancer: { party: party('Blood Bond', 'lifesteal'), cls: 'Warlock', cap: ['sanguine_frenzy', 'crimson_aegis', 'blood_bank'],
      off: [dmg('Thin Blood', 5, { dtype: 'Physical', type: 'Skill' }), T('Blood Reserves', 'You can pay 4 more HP for cards each turn.', ['stat', 'bloodCapPlus', 4]), dmg('Hemomancy', 10, { dtype: 'Physical', type: 'Skill' }), dmg('Desperation', 12, { self: 'lowhp' }),
        dmg('Crimson Tide', 20, { dtype: 'Physical', type: 'Skill' }), X(T('Hemorrhagic Spells', 'Your Physical Skills make the target Bleed for 20% of the damage they deal.', ['dealtBleed', 20, { type: 'Skill', dtype: 'Physical' }])), dmg('Bloodlust', 25, { self: 'lowhp' }), crit('Red Mist', 10, { type: 'Skill' }), dmg('Blood God', 35, { dtype: 'Physical', type: 'Skill' })],
      d: { 7: healTurn('Transfusion', 3) }, s: {} },
    umbral_ruin: { party: party('Keen Eyes', 'crit'), cls: 'Warlock', cap: ['shadow_mastery', 'void_shell', 'dark_insight'],
      off: [crit('Dark Focus', 3), dmg('Void Touched', 8, { dtype: 'Shadow', minCost: 20 }), crit('Umbral Precision', 5, { type: 'Skill' }), critX('Ruinous', 20),
        dmg('Cataclysm', 20, { dtype: 'Shadow', minCost: 30 }), dmg('Rotten Core', 15, { vs: 'rot' }), critX('Annihilation', 40), dotX('Gnawing Ruin', 'rot', 30), T('Herald of Ruin', '+15% crit chance and crits deal +25% damage.', ['crit', 15, {}], ['critX', 25])],
      d: {}, s: { 3: T('Soul Shards', 'Gain 10 mana when you kill an enemy.', ['kill', 'mana', 10]) } },
  };

  // ---- Nov 1: the plain Defense and Support rows are drawn from a shared pool, each effect in 4 strengths
  // (rows 1-2 weakest, rows 3-4, rows 6-7, rows 8-9 strongest) and spread so every codex gets a different mix.
  const TIER = [0, 0, 1, 1, null, 2, 2, 3, 3];
  const EL = { conflagration: 'Fire', sacred_flame: 'Fire', heart_of_winter: 'Frost', venomancer: 'Nature', entropy: 'Shadow', spellstorm: 'Arcane', archmage: 'Arcane', barrier_savant: 'Arcane', nightstalker: 'Shadow',
    phantom: 'Shadow', saboteur: 'Nature', ninja: 'Physical', bloodletter: 'Physical', bulwark: 'Physical', riposte: 'Physical', bloodbound: 'Shadow', colossus: 'Physical', sunderer: 'Physical', hemorrhage: 'Physical',
    bastion_of_faith: 'Shadow', purifier: 'Nature', righteous_crusader: 'Physical', divine_wrath: 'Shadow', equilibrium: 'Arcane',
    soulbinder: 'Frost', blightcaller: 'Nature', shadow_knight: 'Physical', demonologist: 'Fire', bloodmancer: 'Arcane', umbral_ruin: 'Shadow' };
  const F = (names, v, mk, opt) => Object.assign({ names, v, mk }, opt || {});
  const SPOOL = {
    startMana: F(['Quick Start', 'Ready Mind', 'Charged Start', 'Overflowing Start'], [8, 12, 18, 25], (n, v) => startMana(n, v), { mana: 1 }),
    regen: F(['Steady Breath', 'Even Flow', 'Deep Breathing', 'Endless Reserve'], [3, 5, 8, 10], (n, v) => regen(n, v), { mana: 1 }),
    killMana: F(['Scavenger', 'Plunder', 'Battle Hunger', 'Feast'], [5, 8, 12, 15], (n, v) => T(n, `Gain ${v} mana when you kill an enemy.`, ['kill', 'mana', v]), { mana: 1 }),
    maxMana: F(['Deep Pockets', 'Mana Well', 'Wide Reserve', 'Bottomless Well'], [8, 12, 18, 25], (n, v) => maxMana(n, v), { mana: 1 }),
    turnMana: F(['Trickle', 'Tithe', 'Channel', 'Wellspring'], [3, 4, 6, 8], (n, v) => turnMana(n, v), { mana: 1 }),
    killDraw: F(['Loot the Body', 'Spoils of Battle', 'Soul Harvest', 'Last Rites'], [1, 1, 1, 2], (n, v) => killDraw(n, v)),
    draw: F(['Opening Hand', 'Prepared', 'Foresight', 'Revelation'], [1, 2, 1, 1], (n, v, t) => t < 2 ? T(n, `Draw ${v} extra card${v > 1 ? 's' : ''} on your first turn of each fight.`, ['start', 'draw', v]) : draw1(n)),
    init: F(['Light Feet', 'Quick Reflexes', 'Lightning Reflexes', 'First to Act'], [2, 3, 5, 7], (n, v) => T(n, `+${v} Initiative.`, ['stat', 'baseInit', v])),
    luck: F(['Lucky Charm', 'Four-Leaf', 'Fortune\'s Favor', 'Golden Touch'], [3, 5, 8, 12], (n, v) => T(n, `+${v} Luck (better loot).`, ['run', 'luck', v])),
    crit: F(['Sharp Eyes', 'Keen Mind', 'Precision', 'Deadeye'], [2, 3, 5, 8], (n, v) => T(n, `+${v}% crit chance.`, ['crit', v, {}])),
    debuffRes: F(['Stubborn', 'Iron Will', 'Unshakable', 'Indomitable'], [5, 8, 12, 15], (n, v) => T(n, `${v}% chance to shrug off any debuff an enemy puts on you.`, ['stat', 'debuffRes', v])),
    partyRecovery: F(['Mending Song', 'Field Medic', 'Restoring Aura', 'Font of Life'], [1, 2, 3, 4], (n, v) => T(n, `You and your allies heal ${v} HP at the start of each turn.`, ['party', 'recovery', v])),
    partyHealthRegen: F(['Bandages', 'Camp Cook', 'Herbalist', 'Field Surgeon'], [2, 4, 6, 8], (n, v) => T(n, `After each fight, you and your allies heal ${v} HP.`, ['run', 'partyHealthRegen', v])),
    reflect: F(['Mirror Glint', 'Deflection', 'Reflective Guard', 'Perfect Mirror'], [3, 5, 7, 10], (n, v) => T(n, `${v}% chance to reflect an enemy attack: it hits the attacker instead of you.`, ['stat', 'reflect', v])),
    spirit: F(['Calm Spirit', 'Inner Light', 'Kindred Spirit', 'Radiant Soul'], [3, 5, 8, 12], (n, v) => T(n, `+${v} Spirit (stronger healing and damage over time).`, ['stat', 'spirit', v])),
    slow: F(['Tripping Strikes', 'Hamper', 'Crippling Blows', 'Leaden Limbs'], [5, 8, 12, 15], (n, v) => T(n, `${v}% chance when you hit an enemy to apply 2 Slow.`, ['stat', 'slowChance', v])),
    statusSkip: F(['Clear Thoughts', 'Shake It Off', 'Focused Mind', 'Unclouded'], [15, 25, 35, 50], (n, v) => T(n, `${v}% chance, when you draw a status card, to discard it and draw again.`, ['stat', 'statusSkip', v])),
    extract: F(['Light Pack', 'Well Packed', 'Escape Artist', 'Smuggler'], [5, 8, 12, 15], (n, v) => T(n, `When you extract, ${v}% more of your sack survives.`, ['run', 'extract', v])),
    enraged: F(['Hunter\'s Call', 'Blood in the Air', 'Challenge Seeker', 'Apex Hunter'], [5, 8, 12, 15], (n, v) => T(n, `As party leader: +${v}% chance that the map has an Enraged elite (double loot).`, ['run', 'enraged', v]), { leader: 1 }),
    shrine: F(['Pilgrim', 'Devout Path', 'Holy Ground', 'Sacred Roads'], [10, 20, 30, 40], (n, v) => T(n, `As party leader: ${v}% chance the map has an extra shrine.`, ['run', 'shrine', v]), { leader: 1 }),
    merchant: F(['Haggler', 'Trade Routes', 'Caravan Friend', 'Merchant Prince'], [10, 20, 30, 40], (n, v) => T(n, `As party leader: ${v}% chance the map has an extra merchant.`, ['run', 'merchant', v]), { leader: 1 }),
  };
  const DPOOL = {
    startDef: F(['Braced', 'Ready Guard', 'Armored Start', 'Fortified'], [6, 10, 15, 20], (n, v) => startDef(n, v), { block: 1 }),
    defPct: F(['Reinforced', 'Hardened', 'Bulwark Training', 'Impenetrable'], [5, 8, 12, 15], (n, v) => def(n, v), { block: 1 }),
    inc: F(['Thick Skin', 'Toughened', 'Iron Hide', 'Unyielding'], [3, 5, 8, 10], (n, v) => inc(n, v)),
    turnDef: F(['Hold Fast', 'Steady Guard', 'Living Wall', 'Fortress'], [3, 4, 6, 8], (n, v) => turnDef(n, v), { block: 1 }),
    healTurn: F(['Second Wind', 'Renewal', 'Regrowth', 'Undying'], [1, 1, 2, 3], (n, v) => healTurn(n, v)),
    resist: F(['Warded', 'Resilient', 'Hardy', 'Immune'], [5, 8, 12, 15], (n, v, t, el) => T(n, `+${v}% ${el} resistance.`, ['stat', 'resist:' + el, v])),
    taunt: F(['Provoke', 'Challenge', 'Goading Strikes', 'Center of Attention'], [10, 15, 20, 25], (n, v) => T(n, `${v}% chance when you hit an enemy to taunt it (it must attack you).`, ['stat', 'tauntChance', v])),
    healIn: F(['Blessed', 'Receptive', 'Vital', 'Life Bloom'], [5, 10, 15, 20], (n, v) => T(n, `Healing you receive is increased by ${v}%.`, ['stat', 'healIn', v])),
    thorns: F(['Spiked', 'Barbed', 'Thorned Hide', 'Bramble Armor'], [3, 5, 8, 10], (n, v) => T(n, `+${v} Thorns (enemies that hit you take ${v} damage).`, ['stat', 'thorns', v])),
    killHeal: F(['Absolve', 'Reaping', 'Life Tap', 'Soul Feast'], [2, 3, 4, 5], (n, v) => T(n, `Heal ${v}% of your max HP when you kill an enemy.`, ['kill', 'heal', v]), { noBlockOnly: 1 }),
  };
  const used = { s: {}, d: {} };
  function pick(pool, kind, avoid, ok) { // the least-used family that fits
    const keys = Object.keys(pool).filter(k => !avoid.has(k) && ok(k));
    keys.sort((a, b) => (used[kind][a] || 0) - (used[kind][b] || 0) || a.localeCompare(b));
    const k = keys[0]; used[kind][k] = (used[kind][k] || 0) + 1; avoid.add(k); return k;
  }
  const make = (pool, k, i, el) => { const f = pool[k], t = TIER[i]; return f.mk(f.names[t], f.v[t], t, el); };
  const D = {};
  let ci = 0;
  for (const [key, c] of Object.entries(CX)) {
    const rows = [], sAvoid = new Set(), dAvoid = new Set(); let mana = 0, leader = 0;
    const sOver = Object.assign({}, c.s || {}); if (sOver[5]) { sOver[7] = sOver[5]; delete sOver[5]; } // a codex's own row-5 Support moved to row 7
    const SROWS = [0, 1, 2, 3, 5, 6, 7];
    // rotate where each codex starts so the strong and weak versions land on different families
    const order = SROWS.map((x, j) => SROWS[(j + ci) % SROWS.length]); ci++;
    const sup = {}, dfn = {};
    for (const i of order) {
      if (sOver[i + 1]) { sup[i] = sOver[i + 1]; continue; }
      const k = pick(SPOOL, 's', sAvoid, (k) => (mana < 2 ? !!SPOOL[k].mana : true) && !(SPOOL[k].leader && leader));
      if (SPOOL[k].mana) mana++; if (SPOOL[k].leader) leader++;
      sup[i] = make(SPOOL, k, i);
    }
    for (const i of [0, 1, 2, 3, 5, 6, 7]) {
      if (c.d && c.d[i + 1]) { dfn[i] = c.d[i + 1]; continue; }
      const k = pick(DPOOL, 'd', dAvoid, (k) => c.noBlock ? !DPOOL[k].block : !DPOOL[k].noBlockOnly);
      dfn[i] = make(DPOOL, k, i, EL[key] || 'Physical');
    }
    for (let i = 0; i < 9; i++) rows.push([c.off[i],
      i === 4 ? (c.d && c.d[5]) || DEF[c.cls][4] : i === 8 ? (c.d && c.d[9]) || DEF[c.cls][8] : dfn[i],
      i === 4 ? c.party : i === 8 ? (c.s && c.s[9]) || SUP[c.cls][8] : sup[i]]);
    D[key] = { cls: c.cls, rows, cap: c.cap };
  }
  // Nov 1: damage over time that can crit, on the Lv 16 offense talent of the bleed, poison and fire codexes
  const DOTCRIT = { blightcaller: ['Dread Crits', 'dread', 'Dread'], umbral_ruin: ['Rot Crits', 'rot', 'Rot'], bloodletter: ['Hemorrhagic Crits', 'bleed', 'Bleed'], hemorrhage: ['Arterial Crits', 'bleed', 'Bleed'], bloodbound: ['Sanguine Crits', 'bleed', 'Bleed'], venomancer: ['Virulent Crits', 'poison', 'Poison'], conflagration: ['Searing Crits', 'burn', 'Burn'] };
  for (const [k, [n, st, nm]] of Object.entries(DOTCRIT)) if (D[k]) D[k].rows[7][0] = T(n, `Your ${nm} can critically strike: every time it deals damage, it rolls your crit chance and crit damage.`, ['dotCrit', st]);
  // Nov 1 balance: every talent's numbers are halved (rounded, at least 1), except the Lv 10 row (mini capstone) and the capstone Powers.
  // Counts stay put where halving makes no sense: the "every Nth card" and "for every N stacks" steps.
  const HALF = (v) => Math.max(1, Math.round(v / 2));
  const halveFx = (f, map) => f.map((v, i) => { if (i === 0 || typeof v !== 'number') return f[0] === 'aura' && Array.isArray(v) ? v.map(x => halveFx(x, map)) : v;
    if ((f[0] === 'every' && i === 1) || (f[0] === 'dmgPer' && i === 2) || (f[0] === 'kill' && f[1] === 'spread')) return v;
    const h = HALF(v); map.push([v, h]); return h; });
  const halve = (t) => { if (!t || t.halved) return t; const map = [], fx = t.fx.map(f => halveFx(f, map));
    let txt = t.t.replace(/below 30% HP/g, '\u0001').replace(/at 1 HP/g, '\u0002'), pos = 0;
    for (const [a, b] of map) { const re = new RegExp('(^|[^0-9])' + a + '(?![0-9a-z])', 'g'); re.lastIndex = pos; const m = re.exec(txt); if (!m) continue; const at = m.index + m[1].length; txt = txt.slice(0, at) + b + txt.slice(at + String(a).length); pos = at + String(b).length; }
    txt = txt.replace(/Thorns \(enemies that hit you take (\d+) damage\)/, (m, k) => { const f = fx.find(x => x[1] === 'thorns'); return f ? `Thorns (enemies that hit you take ${f[2]} damage)` : m; });
    return { n: t.n, t: txt.replace(/\u0001/g, 'below 30% HP').replace(/\u0002/g, 'at 1 HP'), fx, halved: true }; };
  for (const c of Object.values(D)) c.rows = c.rows.map((row, i) => i === 4 ? row : row.map(halve));
  if (typeof module !== 'undefined' && module.exports) module.exports = D; else r.CB_TALENTS = D;
})(typeof window !== 'undefined' ? window : globalThis);
