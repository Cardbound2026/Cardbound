// The Shaman's 18 test decks (3 per codex): node tools/shaman/testdecks.js  -> rewrites the Shaman part of src/testdecks.js
// Every deck is 22 cards: 2 Gold, 4 Blue, 6 Green, 10 White.
const fs = require('fs'), path = require('path'); const { CB } = require('./h.js'); const C = CB.CARDS;
const L = (s) => s.trim().split(/\s*,\s*/).map(x => { const [k, n] = x.split(' x'); return ['sh_' + k.trim(), +(n || 1)]; });
const DECKS = [
  ['twinstorm', 'Back and Forth', 'Alternate Attacks and spells', 'Every Attack charges your next spell and every spell your next Attack. Swap between the two each card: Stormcaller\'s Rhythm and Ride the Storm both pay you for it.',
    ['Never play two cards of the same kind in a row if you can help it.', 'Surge after two Attacks makes the next spell free.', 'Overload on Chain Lightning with stored Multicast is the big turn.'],
    { twin_soul: 'Half of each chance counts as the other.', ride_the_storm: 'A card and 10 mana every turn you mix.', stormcallers_rhythm: '+15% for alternating.', spellstrike: 'An Attack that repeats your last spell.' },
    'twin_soul, ride_the_storm, charged_maces, spellstrike, echoing_blow, overload, stormcallers_rhythm, charged_blow, chain_lightning, war_chant, surge, storm_dance, mace_strike x3, lightning_bolt x3, twin_strike x2, wind_step x2'],
  ['twinstorm', 'Storm Vessel', 'Bank the chance, keep half', 'Twinstorm stores 10% for every card and empties when it triggers. Storm Vessel only halves it, so the stored chance climbs all fight.',
    ['Get Storm Vessel down first.', 'Cheap cards build the stored chance fastest.', 'Relentless comes back to your hand when it Multi-hits.'],
    { storm_vessel: 'Stored chance is halved, not emptied.', tempest: 'Always Multi-hits.', relentless: 'Returns on a Multi-hit.', gale_fury: '+20% Multi-hit.' },
    'storm_vessel, tempest, gale_fury, echo_chamber, relentless, lightning_burst, rolling_thunder, ball_lightning, hammer_and_anvil, thunders_echo, storm_dance, rainwell, mace_strike x2, twin_strike x2, lightning_bolt x2, jolt x2, wind_step x2'],
  ['twinstorm', 'Twin Thunder', 'Static from both hands', 'Maces and spells both pile Static on one target, then Electrocute or Stormbreaker spends it.',
    ['Charged Maces and Charged Air make every card add Static.', 'Electrocute at 10 Static, Stormbreaker at 5.', 'Twin Thunder makes one turn count double for Twinstorm.'],
    { twin_thunder: 'Every card counts as both kinds for a turn.', thunder_gods_hammer: 'Stuns when it Multi-hits.', electrocute: '10 Static: a 1-turn Stun for 0 mana.', stormbreaker: 'Spends 5 Static for 15 more.' },
    'twin_thunder, thunder_gods_hammer, charged_maces, electrocute, stormbreaker, charged_air, crackling_swing, charged_blow, discharge, chain_lightning, arc, read_the_sky, lightning_weapon x2, mace_strike x2, jolt x2, backswing, static_charge, wind_step x2'],
  ['rainbringer', 'Rain and Thunder', 'Heal, then hit three times', 'A heal that Multicasts makes your next Attack a sure Multi-hit, and your own Multi-hit chance then rolls for a third hit. Heal, then swing your biggest mace.',
    ['Heal first, hit second.', 'Thunder Mend is a heal that also loads the next Attack.', 'Save Tempest and Echoing Blow for a sure Multi-hit.'],
    { rainmaker: 'A free heal every turn that can Multicast.', tempest: 'The Attack to spend a sure Multi-hit on.', thunder_mend: 'Heal and +8 on the next Attack.', wellspring: 'Stronger heals that also give defence.' },
    'rainmaker, tempest, thunder_mend, lifeline, echoing_blow, wellspring, living_lightning, rain_mend, leaping_mend, charged_blow, hammer_and_anvil, chain_lightning, mending_rain x3, mace_strike x3, cleansing_rain, twin_strike, wind_step x2'],
  ['rainbringer', 'Monsoon', 'Party healer', 'Keep a group standing. Monsoon rolls a Multicast for every ally, and Ancestral Echo makes the next heal free whenever one lands.',
    ['Storm Ward the hero the boss is looking at.', 'After any heal Multicasts, the next heal costs 0: make it Tidal Surge.', 'Rallying Thunder before the party\'s big turn.'],
    { monsoon: 'Party heal with a Multicast roll for each ally.', ancestral_echo: 'A Multicast heal makes the next heal free.', tidal_surge: 'Party heal for 12.', stormfathers_ward: '8 defence for everyone.' },
    'monsoon, ancestral_echo, tidal_surge, lifeline, wellspring, stormfathers_ward, living_lightning, rain_mend, leaping_mend, storm_ward, rallying_thunder, rainwell, mending_rain x3, soothing_mist x2, cleansing_rain, lightning_bolt x2, wind_step x2'],
  ['rainbringer', 'Living Lightning', 'Heals that strike back', 'Stack Multicast so Living Lightning keeps throwing Chain Lightning, and Perfect Storm spreads every bolt.',
    ['Echo Chamber and Aftershock first: everything here wants Multicast.', 'Focus the Storm before Living Lightning.', 'Discharge when the Static is high.'],
    { perfect_storm: 'Single-target lightning splashes for half.', living_lightning: 'A heal that casts Chain Lightning on a Multicast.', aftershock: 'A second roll when a Multicast misses.', last_light: 'An ally cannot die this turn.' },
    'last_light, perfect_storm, echo_chamber, aftershock, thunder_mend, tidal_surge, living_lightning, chain_lightning, rain_mend, leaping_mend, resonance, discharge, mending_rain x3, lightning_bolt x3, focus_the_storm, jolt, wind_step x2'],
  ['stormcaller', 'Chain Stun', 'Stun, and stun again', 'Build Static fast. At 15 Arc Flash hands you Electrocute, and Unbroken Circuit leaves half the Static behind so the next one comes sooner.',
    ['Lightning Rod on the boss: Static you put on anything else lands on it too.', 'Thunderhead before Chain Lightning doubles the Static on everyone.', 'Mass Electrocute when several enemies are at 10 or more.'],
    { unbroken_circuit: 'Half of consumed Static stays.', lightning_rod: 'All Static is copied onto one enemy.', arc_flash: 'Electrocute comes to your hand at 15 Static.', electrocute: '10 Static: Stun for 0 mana.' },
    'unbroken_circuit, lightning_rod, electrocute, arc_flash, charged_air, mass_electrocute, chain_lightning, thunderhead, resonance, ball_lightning, lightning_cloud, read_the_sky, jolt x3, static_charge x2, lightning_bolt x2, focus_the_storm, wind_step x2'],
  ['stormcaller', "Heaven's Fall", 'Build, then one huge burst', "Pile Static on every enemy, Supercharge the biggest pile, then Heaven's Fall turns all of it into damage on everyone.",
    ['Sky\'s Wrath and Chain Lightning build on every enemy at once.', 'Supercharge doubles one pile (up to +10).', 'Tempest Lance deals more for Static without spending it: cast it before Heaven\'s Fall.'],
    { heavens_fall: '4 damage to all for every Static on anyone.', tempest_lance: '40, plus 2 for each Static.', supercharge: 'Doubles a pile.', skys_wrath: '4 Static on every enemy.' },
    'heavens_fall, tempest_lance, skys_wrath, supercharge, charged_air, lightning_burst, chain_lightning, lightning_cloud, discharge, thunderhead, arc, rainwell, jolt x3, lightning_bolt x3, static_charge x2, wind_step x2'],
  ['stormcaller', 'Echo Chamber', 'Multicast everything', 'Stormcaller casts a third copy whenever a spell Multicasts. Stack the chance, add a second roll, and let every bolt echo.',
    ['Echo Chamber and Aftershock before anything else.', 'Overload plus a Multicast is four or five casts of one spell.', 'Ball Lightning comes back to your hand when it Multicasts.'],
    { rolling_echo: 'A Multicast can cast once more.', perfect_storm: 'Every bolt splashes.', aftershock: 'A second roll at half chance.', overload: 'Next spell twice.' },
    'rolling_echo, perfect_storm, echo_chamber, aftershock, overload, thunderfall, ball_lightning, thunders_echo, resonance, chain_lightning, storm_dance, thunderstruck, lightning_bolt x3, focus_the_storm x2, jolt x2, drench, wind_step x2'],
  ['skybreaker', 'Thunder King', 'One big spell, repeated by maces', 'Cast Thunderfall once. After that every Multi-hit casts it again at half strength, so stack Multi-hit and keep swinging.',
    ['The repeat is always the last Skill you played: play Thunderfall after Wind Step, not before.', 'Rolling Thunder first each turn (+20% Multi-hit).', 'Tempest always Multi-hits, so it always repeats the spell.'],
    { tempest: 'A sure Multi-hit: a sure repeat.', thunder_king: '12 to all, three times.', thunderfall: 'The spell to repeat.', gale_fury: '+20% Multi-hit.' },
    'tempest, thunder_king, gale_fury, echoing_blow, thunderfall, relentless, rolling_thunder, hammer_and_anvil, charged_blow, windmill, war_chant, skull_ringer, mace_strike x3, twin_strike x3, backswing x2, wind_step x2'],
  ['skybreaker', 'Hundred Blows', 'Many small hits', 'Hundred Blows rolls Multi-hit eight times. With Charged Maces and Rain of Maces every roll that lands spreads Static and damage.',
    ['Gale Fury and Rolling Thunder before Hundred Blows.', 'Double Time makes the next Attack hit twice.', 'Skybreaker repeats your last Skill: make it Chain Lightning, or Surge for free spells.'],
    { hundred_blows: 'Spends all your mana: one hit per 3 mana, each with its own Multi-hit roll.', rain_of_maces: 'Multi-hits also strike a second enemy.', charged_maces: 'Attacks apply Static.', double_time: 'Next Attack hits twice.' },
    'hundred_blows, rain_of_maces, gale_fury, charged_maces, double_time, stormbreaker, rolling_thunder, crackling_swing, charged_blow, chain_lightning, knee_breaker, surge, twin_strike x3, mace_strike x2, backswing x2, lightning_weapon, wind_step x2'],
  ['skybreaker', 'Hammer of the Storm', 'Melee with a Stun', "Thunder God's Hammer Stuns when it Multi-hits. Twin Soul turns Multicast gear into Multi-hit, and Spellstrike repeats your bolt on its own.",
    ['Save Rolling Thunder for the Hammer turn.', 'Skybreaker repeats your last Skill: Lightning Burst is a good one to leave last.', 'Discharge the Static your repeated spells leave behind.'],
    { thunder_gods_hammer: '30 damage and a Stun on a Multi-hit.', twin_soul: 'Half of Multicast counts as Multi-hit.', spellstrike: 'Repeats your last spell.', echo_chamber: '+15% Multicast (half of it is Multi-hit with Twin Soul).' },
    'thunder_gods_hammer, twin_soul, gale_fury, echo_chamber, spellstrike, lightning_burst, charged_blow, hammer_and_anvil, rolling_thunder, discharge, ball_lightning, storm_dance, mace_strike x3, twin_strike x2, lightning_bolt x2, backswing, wind_step x2'],
  ['stormwarden', 'Five Storms', 'A wall of debuffs', 'Stormwarden cuts 5% damage for each Shaman debuff on an enemy, and its debuffs never wear off. Deluge puts all of them on everything at once.',
    ['Deluge first: 25% less damage from every enemy for the whole fight.', 'Guard only fades by 20% a turn, so keep adding to it.', 'Overcast keeps new enemies debuffed.'],
    { deluge: 'Every Shaman debuff on every enemy.', overcast: 'Puts missing debuffs back each turn.', unbowed: 'A fully stopped hit gives the attacker Static.', thunder_wall: 'Guard, and attackers are Deafened.' },
    'deluge, overcast, unbowed, stand_fast, slip_the_bolt, stormbreaker, thunderous_challenge, thunder_wall, skull_ringer, knee_breaker, charged_blow, rallying_thunder, stone_guard x3, dig_in x2, drench, weather_away, shield_rap x2, thunder_roar'],
  ['stormwarden', 'Lightning Shield', 'Let them charge themselves', 'Every hit on you puts Static on the attacker. Taunt, soak, then Electrocute whoever has hit you the most.',
    ['Lightning Shield first, then Thunderous Challenge.', 'Dig In adds 2 more Static per hit for a turn.', 'Mass Electrocute once several enemies have 10.'],
    { lightning_shield: '1 Static on every attacker, every hit.', storms_aegis: 'You take a tenth of your allies\' damage.', mass_electrocute: 'Stuns everything with 10 or more Static.', unbowed: 'Fully stopped hits give 2 Static.' },
    'lightning_shield, storms_aegis, unbowed, electrocute, mass_electrocute, stand_fast, thunderous_challenge, thunder_wall, discharge, chain_lightning, crackling_swing, rallying_thunder, stone_guard x3, dig_in x3, shield_rap x2, grounded, mace_strike'],
  ['stormwarden', 'Spirit Link', 'Party support', 'For groups. Spirit Link spreads every hit across the party, your buffs never run out, and Last Light saves whoever is about to fall.',
    ['Rallying Thunder never ends under Stormwarden: play it early.', 'Spirit Link before the boss\'s big single hit.', 'War Drum before an ally\'s biggest card.'],
    { spirit_link: 'Damage is split across the party.', last_light: 'An ally cannot die this turn.', rallying_thunder: '+10 Strength and Intelligence for the party, for the whole fight.', stormfathers_ward: '8 defence for everyone.' },
    'spirit_link, last_light, stormfathers_ward, stand_fast, unbowed, tidal_surge, rallying_thunder, thunderous_challenge, thunder_wall, storm_ward, leaping_mend, skull_ringer, stone_guard x3, war_drum x2, thunder_roar, weather_away, shield_rap x2, mending_rain'],
  ['calm_eye', 'The Long Wait', 'Skip two turns, hit three times', 'End turns without acting to charge up: Guard, mana, cards, Static and damage all grow while you wait, then one card is played three times.',
    ['Play your Powers in the first turns, then start waiting.', 'Held Breath gives Guard on a skipped turn and still counts as not acting.', 'Tempest Lance played three times after two quiet turns ends most fights.'],
    { the_long_wait: 'Two quiet turns: the next card three times.', stillness: 'Quiet turns do not feed Pressure, and you take 25% less.', gathering_storm: 'Each quiet turn: 3 Static to all and +5% damage for good.', held_breath: 'Guard, and it does not count as acting.' },
    'stillness, tempest_lance, the_long_wait, gathering_storm, thunderfall, loaded_sky, calm_before_the_storm, coiled_storm, patience, deep_listening, chain_lightning, discharge, held_breath x3, quiet_sky, lightning_bolt x2, jolt, wind_step x2, gathering_clouds'],
  ['calm_eye', 'Borrowed Time', 'Take their turns away', 'Toads, stolen turns, burned cards and locked mana. The enemy spends the fight not playing while your doubled cards land.',
    ['Toad Curse and Stolen Hour on whatever hits hardest.', 'Thunder Debt gives you a second turn now; the turn it costs you is a quiet turn, which Calm Eye rewards.', 'Raid bosses ignore the turn theft: use the doubled cards there.'],
    { borrowed_thunder: 'Every enemy loses a turn; you sit out two, then play a card three times.', stolen_hour: 'One enemy loses a turn.', toad_curse: 'A toad for a turn.', thunder_debt: 'An extra turn now.' },
    'borrowed_thunder, stolen_hour, toad_curse, thunder_debt, mana_lock, fray, heavy_air, scatter, brain_fog, calm_before_the_storm, coiled_storm, thunderstruck, held_breath x2, siphon_charge x2, shifting_ground, lightning_bolt x2, thunder_roar, wind_step x2'],
  ['calm_eye', 'Eye of the Hurricane', 'Stuns that pay for themselves', 'While anything is Stunned your cards cost 10 less. Build Static on quiet turns with Loaded Sky, Stun the room, then spend the cheap turn.',
    ['Loaded Sky adds Static to everything every quiet turn.', 'Mass Electrocute, then play your hand at a discount.', "Heaven's Fall played twice after a quiet turn clears the room."],
    { eye_of_the_hurricane: 'Cards cost 10 less while an enemy is Stunned.', heavens_fall: 'All Static becomes damage to all.', loaded_sky: 'Quiet turns add Static and burn mana.', mass_electrocute: 'Stuns everything at 10 or more.' },
    'eye_of_the_hurricane, heavens_fall, electrocute, mass_electrocute, loaded_sky, toad_curse, calm_before_the_storm, patience, chain_lightning, lightning_cloud, thunderhead, deep_listening, held_breath x2, jolt x3, static_charge x2, quiet_sky, wind_step x2'],
];
const out = [], n = {};
for (const [codex, name, style, plan, tips, why, list] of DECKS) {
  const cards = L(list), cnt = { Gold: 0, Blue: 0, Green: 0, White: 0 }; let tot = 0;
  for (const [k, q] of cards) { if (!C[k]) throw new Error(name + ': no card ' + k); cnt[C[k].rarity] += q; tot += q; }
  if (tot !== 22 || cnt.Gold !== 2 || cnt.Blue !== 4 || cnt.Green !== 6 || cnt.White !== 10) throw new Error(name + ': ' + tot + ' cards ' + JSON.stringify(cnt));
  const chk = CB.DECK_CAPS; for (const k of Object.keys(why)) if (!cards.some(c => c[0] === 'sh_' + k)) throw new Error(name + ': why names a card not in the deck: ' + k);
  n[codex] = (n[codex] || 0) + 1;
  out.push({ id: codex + '_' + n[codex], codex, n: n[codex], cls: 'Shaman', name, style, plan, tips, why: Object.fromEntries(Object.entries(why).map(([k, v]) => ['sh_' + k, v])), cards });
}
const p = path.join(__dirname, '../../src/testdecks.js'); let s = fs.readFileSync(p, 'utf8');
const MARK = '\n// Shaman (tools/shaman/testdecks.js)\n';
if (s.includes(MARK)) s = s.slice(0, s.indexOf(MARK));
s = s.replace(/\s*$/, '') + MARK + 'window.CB_TESTDECKS.push(...' + JSON.stringify(out) + ');\n';
fs.writeFileSync(p, s); console.log(out.length, 'Shaman test decks written');
