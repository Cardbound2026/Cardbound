  // ---------- What's new: the changelog (button bottom-right) and the new-version warning
  // Add new entries at the TOP of CHANGELOG (newest day first). Each item: [area, text]. Written for players.
  const CHANGELOG = [
    { date: '2026-11-01', items: [
      ['Feature', 'Build guide: "What kind of Warrior do you want to play?" Pick a playstyle (tank, big hits, many small hits, Bleed...), then a codex, then one of its builds, and get a checklist: which of its 22 cards you have, which you\'re missing and exactly which monsters drop them, where the codex drops, the gear stats to look for, the cards to rank up first, and which maps to farm (easiest first). Track a build to see your progress on the character sheet. New heroes get it right after creation; it\'s also in the Menu and on the character sheet (C).'],
      ['Balance', 'Fear: monsters now resist it 25% of the time (bosses 50%), and damage that lands on a Feared monster can break the Fear: 75% for direct damage (even into its Block), 10% for each damage-over-time tick.'],
      ['Balance', 'Crit Chance on gear is cut by 75% and Crit Damage on gear by 50%, on new drops and on gear you already own (each stat line stays at least 1).'],
      ['Balance', 'Lingering Dread applies 8 Dread (was 6).'],
      ['Fix', 'Every Warlock card, and the newer Warrior Blood Debt cards, are now on enemy loot lists (the compendium shows where each one drops). Warlock cards drop from the same monsters, at the same odds, as Rogue cards.'],
      ['Feature', 'Group fights: tier 2 and 3 rows can now hold a group, three smaller bodies that share one monster\'s HP and damage (Pack of Wolves, Bandit Party, Ember Whelps, Magma Golems, Frostfang Pack, Barrow Wight Patrol, Spiderling Swarm, Raptor Pack, Ley Hound Pack, Animated Armor Squad, Ghoul Pack, Cultist Coven: two per map). A group counts as one monster: one loot roll, one kill, its own gear and card drops. Bring some area damage.'],
      ['Balance', 'Mana Regen now only appears on amulets. Gear that had a Mana Regen affix had it rerolled into a new stat, and the Frost Staff\'s built-in Mana Regen became Frost damage.'],
      ['Balance', 'Recovery (and Party Recovery) on gear is halved, on new drops and on gear you already own.'],
      ['Feature', 'C opens your character sheet during fights and on the map too. While you\'re out on a run it shows the gear you\'re actually wearing, and gear and deck changes wait until you\'re back in town.'],
      ['Fix', 'Salvaging or breaking an item in the stash keeps your place in the list instead of jumping back to the top.'],
      ['Feature', 'Keyword help everywhere: game terms on cards, gear, merchants, statuses and the combat log (Dread, Bleed, Absorb, Taunt, Crit Chance...) now have a faint dotted underline. Point at one and hold Alt to read its glossary entry.'],
      ['Balance', 'Soul Beacon now Exhausts.'],
      ['Fix', 'A card being dragged could get stuck in the middle of the screen if you right-clicked (or switched windows) mid-drag. Right-click, Esc or leaving the window now cancels the drag and puts the card back in your hand.'],
      ['Fix', 'Warlock demons now show up in fights: each one stands beside its Warlock with its own HP bar and turns left, and they appear in the turn order right after their Warlock (that is when they act).'],
      ['Fix', 'Enemy nameplates: the Deck counter sits beside the HP bar and statuses get their own row, so a status like Feared no longer covers the Deck button.'],
      ['Fix', 'Saves no longer get overwritten between browsers. Before, a browser with old progress could look "newest" just by being opened, overwrite your account, and then wipe the good progress in your other browser when it signed in. Now every save knows which account version it came from: a browser only uploads if the account hasn\'t moved on, picks up the account\'s progress when it has nothing new of its own, and if both have new progress it asks you which to keep.'],
      ['Feature', 'Save backups (Menu > Save backups): the version you don\'t pick in a save conflict is kept, plus one backup a day in your account (the newest 30) and the last few versions this browser replaced. Restore any of them with one click.'],
      ['Feature', 'Hardcore heroes: tick Hardcore when you create a hero. They get one life: the first time a hardcore hero falls in a fight (duels and the training dummy don\'t count) it becomes a normal hero. The Hall of Records has a Hardcore tab: a ladder of living hardcore heroes and a graveyard of the fallen.'],
      ['Feature', 'The Arena: the old south palisade has a gap now, leading to a sand ring with Arenamaster Kord and the Wager Board. Pin a wager (up to 3 stash items and/or gold), other players answer with offers of their own, and you accept, decline or counter. While a wager or offer is open that hero\'s gear and deck are locked and both sides can see each other\'s hero. Accept and you duel: the winner takes the other stake, a draw gives both back, leaving early forfeits.'],
      ['Art', 'A statue of Juss lies in the fire plaza: a fallen warrior slumped face down across a plinth, a sword through his back. Read the plaque.'],
      ['Feature', 'Creating a hero now happens around a campfire: every class sits at the fire (click one to see its starting decks, with a few Gold and Blue cards you can look forward to on the right). A Shaman sits there too: coming in a future expansion. Your heroes are listed below the fire.'],
      ['Feature', 'Rerolls: every item now has a reroll potential (White 0-1, Green 1-2, Blue 2-3, Purple 3-4; gear you already own got its potential too). At Jeweler Rook, a Reroll Token and one point of potential reroll one affix line of your choice. Get tokens by breaking down codexes you don\'t need (at Rook or in your stash): 3 tokens, plus 1 for every 2 map levels the codex dropped on.'],
      ['Balance', 'Blood Reckoning now heals you for 2x your stored Blood Debt (and spends it) instead of the damage it dealt.'],
      ['Feature', '8 new Warrior Blood Debt cards for the Bloodbound codex: Call the Debt (free: hit for 80% of your Debt, then clear it), Reclaim Blood (consume your Debt, heal 30% of it), Crimson Bulwark, Debt Spiral, Sanguine Cleave, Blood Oath, Vengeful Wound and Usury (Power: Strength from your Debt every turn). The Bloodbound test deck "Blood Debt" uses them.'],
      ['Feature', 'New class: the Warlock. A shadow caster whose defense is Absorb: it works like Block, and any healing past full HP becomes Absorb. 110 new cards (with upgrades), 4 starting decks (Balanced, Soulbinder, Demonologist, Shadow Knight), a skull-hooded hero in fights and in town, and its own purple card frame.'],
      ['Feature', 'Warlock mechanics: Dread (like Poison: ignores Block, ticks each turn, loses 1) and Rot (each application deals its amount over 4 turns, 12 Rot = 3 a turn), both scaling with Intelligence. Curses, Fear (the enemy skips its attacks next turn) and Stun (it loses its whole turn; bosses are only Feared), with 2 rounds of immunity after either lands.'],
      ['Feature', 'Warlock demons: Gloom Imp, Bulwark Fiend (taunts single-target attacks), Ruin Fiend, Shade Temptress (Fear and Weak) and Hollow Hound (drains mana). Up to 3 at once, each acts at the end of your turn for 2 turns. Single-target attacks can\'t hit them; area attacks can. Plus five Armors (Shadow, Blood, Soul, Nether, Demon), one at a time.'],
      ['Feature', 'Six Warlock codexes, each with a full talent tree and 3 capstone Powers: Soulbinder (Soul Beacon party healing), Blightcaller (Dread), Shadow Knight (two-handed Strength, Physical becomes Shadow), Demonologist (demons stay longer), Bloodmancer (pay HP for cards, 1 HP per 2 mana, up to 15 HP a turn) and Umbral Ruin (crits leave Rot behind). Every map boss now carries one Warlock codex.'],
      ['Test', 'Tinker Pip has 18 Warlock test decks (3 per codex). The Compendium, Hall of Records class filter, glossary and gear advice all know the Warlock.'],
      ['Feature', 'Auto-salvage: in the Loot sack during a run, each item has an Auto-salvage button (and one to mark all White gear). Marked items you bring home are salvaged straight away instead of filling the stash: gear for gold, cards for Ink. Town chat tells you what you got.'],
      ['Balance', 'Strength now increases the Bleed you apply, like Poison: with 50 Strength, a card that applies 10 Bleed applies 15. Bleed cards show the boosted number.'],
      ['Feature', 'Damage over time can crit: the Lv 16 Offense talent of Bloodletter (Hemorrhagic Crits) Hemorrhage (Arterial Crits) and Bloodbound (Sanguine Crits) lets your Bleed crit, Venomancer (Virulent Crits) your Poison, and Conflagration (Searing Crits) your Burn. Each tick rolls your crit chance and crit damage. Holy Burn (Sacred Flame) can\'t crit.'],
      ['Balance', 'Codex talents are half as strong: every number on rows Lv 2-8 and Lv 12-18 is halved (rounded, at least 1), including all % damage and flat damage. The Lv 10 mini capstones and the Lv 20 capstone Powers are unchanged.'],
      ['Balance', 'Cards that give you something for the rest of combat now Exhaust: Battle Fever, Ruthless Conversion, Time Theft and Offering Plate (Powers already stay in play once).'],
      ['Feature', 'New gear slot: Shoulders. Plate Pauldrons, Leather Spaulders and Cloth Mantles, one of each per map (18 new items), drop from every monster that drops gear and from merchants. Every hero starts with (or is given) a White pair. Gear score now averages 14 slots.'],
      ['Feature', 'Starting decks are rated 0 to 5 stars for Offense, Defense, Utility and Support, and list the end-game codex decks each one can grow into.'],
      ['Feature', 'Names over heads: in fights every hero and monster has a small name tag just above its head (heroes show their <Guild> under the name), with intents above that. In town, every townsperson and your own hero are always named, with the guild under player names.'],
      ['Feature', 'The campfire shows everything in your sack (each hero\'s sack in a party) before you rest, rummage or extract.'],
      ['Feature', 'Hall of Records: click a card or an item on a hero\'s record to see it full size.'],
      ['Fix', 'The card tray in a fight keeps one height whether your hand is full, empty or it is the enemy\'s turn, so the screen no longer jumps.'],
      ['Test', 'Tinker Pip: a Clear all gold button, in the row of buttons at the top (it shows your current bank).'],
      ['Fix', 'Other players\' guilds now show under their names in town and in co-op fights (they were sent but never read), and the guild line sits closer to the name.'],
      ['Feature', 'Hall of Records: read the notice board in town (or Menu > Hall of Records). Heroes ranks every hero by progress or power (click one to see their gear, deck, codex talents and map records); Map records shows who has reached the highest level and furthest row on each road; Raid records shows, for every raid boss, the first guild to kill it, the guild that killed it at the highest level, and the fastest kill in rounds. Heroes are posted when you sign in and whenever you come home.'],
      ['Fix', 'Shuriken Mastery, Sharpened Stars and the Ninja codex now show on the Shuriken card itself (the damage always applied, but the card still said 4).'],
      ['Art', 'Fights are now a battlefield scene: a painted road runs back to a ruined gate (tinted for each map), your heroes stand on the left diagonal and the enemies on the right, each with a clean nameplate on the outside and their intents over their heads. Everyone is drawn at one scale, the layout keeps plates, intents and fighters from covering each other, and big fights (5+ on a side) switch to small plates under the feet. Raids show the heroes as a block of small fighters in rows, and raid bosses now use their map boss\'s inked art. Fights also use more of a wide screen. Thanks to our design tester for the battlefield painting and layout. Menu > "Battlefield view" switches back to the old side-by-side stage.'],
      ['Fix', 'Interface tidy-up: the Quartermaster stash shows items in two columns, windows are a bit wider and stay centred (chat no longer pushes them sideways), the Scribe puts the Ink bar above deck and collection, the Barracks lists heroes beside the stats, Menu checkboxes line up with their labels, and the What\'s new button hides while a window is open.'],
      ['Feature', 'Ink: at the Scribe, break spare cards down for Ink (White 1, Green 4, Blue 10, Gold 25; ranked cards give more), then buy any card of your class with "Buy cards with Ink". Cards you have owned before cost 10 / 40 / 100 / 300; ones you have never found cost 3x. Ink is shared by all your heroes.'],
      ['Balance', 'Every boss kill now also drops a Green weapon and a Green chest piece for your class.'],
      ['Balance', 'A map\'s boss has 15% less HP until you beat it for the first time (in a party: until everyone has).'],
      ['Balance', 'New Rogue starting deck, Star Thrower, replacing Bladedancer: all-in on Shurikens. Shuriken Storm (Gold), Storm of Steel and Shuriken Mastery (Blue), Hidden Pockets and 2 Shuriken Volley (Green), then 8 Throwing Stars, 4 Evade and 2 Twin Daggers. Heroes already made with Bladedancer keep their deck.'],
      ['Fix', 'Fights hold still: heroes and monsters now share one figure size picked from the busier side (a duo no longer gets shrunk to raid size), each side keeps fixed columns so nobody jumps when a mob dies, and the battlefield keeps the same height whatever is in your hand. Big hands overlap more instead of stretching the screen, and long turn orders shrink instead of wrapping.'],
      ['Fix', 'The gold box around the hero whose turn it is is gone: the turn order already shows it, and the active figure gets a soft gold glow instead.'],
      ['Feature', 'The chat column in a fight resizes like the combat log: drag its right edge, bottom edge or corner (double-click a handle to reset).'],
      ['Feature', 'Upgrading a card shows an XP bar: gold is what the card has, green fills in as you tick cards to feed, rolls over with a flash on each rank-up and drains back when you untick.'],
      ['Fix', 'Clicking a dropped card to see it big now fits the rules text inside the card instead of showing it at full size.'],
      ['Fix', 'Hotkeys close what they open: C closes the character screen again, and M closes the map view in a fight (G and N already did).'],
      ['Fix', 'At the Wagon, the map you picked now stands out: it lights up in its element colour with a "Selected" tag.'],
      ['Art', 'The interface is in Gothic Ink too: windows and panels are framed in inked stone, buttons are wooden planks (the main action is banded oak), and tabs, chips, bars and inputs have heavy black outlines on dark slate. Cards are unchanged. To go back to the old look, open Menu and untick "Gothic Ink interface".'],
      ['Art', 'The whole town is redrawn in Gothic Ink: inked grass and cut-paper dirt paths, cobbles, the pond and the palisade, plus every tent, tree, rock, torch, the campfire, wagon, longhouse, stall, fountain, signs and the training dummy.'],
      ['Art', 'The town is in the same Gothic Ink style: your hero, other players and every townsperson now walk around as inked figures with real walk and idle animations. Your hero on the character screen uses it too.'],
      ['Art', 'New look for the fight screen: every hero class and every monster is now drawn in a dark "Gothic Ink" style (heavy black ink, deep shadows, muted colours). Humans, undead, giants and demons wear real gear; beasts, constructs, elementals, plants and fliers are new hand-drawn bodies tinted by their element. Elites and bosses are drawn bigger. The turn-order tiles use the same portraits.'],
      ['Codexes', 'Talent trees: the everyday Defense and Support rows are now mixed and matched across codexes, each effect in four strengths (levels 2-4 weakest, 6-8, 12-14, 16-18 strongest), so no two trees share the same set. New Support effects: Initiative, Luck, crit chance, a chance to shrug off debuffs, party Recovery (heal each turn), party Health Regen (heal after each fight), a chance to reflect an enemy attack back, Spirit, a chance on hit to Slow, a chance to toss a drawn status card and draw again, more of your sack surviving extraction, and, as party leader, better odds of an Enraged elite, an extra shrine or an extra merchant on the map. New Defense effects: resistance to one element (each codex has its own), a chance on hit to taunt, more healing received and Thorns.'],
      ['Codexes', 'Talent trees: the level-10 Support pick (mini capstone) is now a buff for you and every ally, different for each codex: +10% damage, crit chance, crit damage, Strength, Intelligence, Dexterity, Spirit, max HP, max mana, mana regeneration, Initiative, Multi-hit, Multicast, Multiplay, every resistance, healing, Luck (better loot for the whole party), 5% lifesteal, Bleed chance, Thorns or Recovery. The extra-card-draw pick that used to sit there moved to level 14.'],
      ['Codexes', 'Codex talent trees: every codex now levels up (max 20) while you wear it, from kills: normal 1 XP, elite 3, boss 10. A party splits the kills but gets +10% XP per extra hero, and every codex you have maxed gives +10% on the others. It takes about 70 full solo runs to max one, each level 15% slower than the last.'],
      ['Codexes', 'Every 2 levels opens a talent row (10 rows): pick an Offense, Defense or Support talent on each. Level 10 is a mini capstone; level 20 is the capstone, a Power that is already in play at the start of every fight. Mix freely; changing picks is free in town. Talents only work while that codex is worn, and you never lose points by swapping.'],
      ['Codexes', 'Press N (town, character screen, map or fight) for your talent trees, one tab per codex of your class. The town shows your worn codex level and XP at the top, and the Compendium Codexes tab opens any codex\'s tree when you click it. Tinker Pip can add codex levels for testing.'],
    ] },
    { date: '2026-10-31', items: [
      ['Cards', 'Card upgrades are reworked: every card now grows its own way as it ranks up, following the upgrade sheet (your Warrior list, the answered questions and the accepted suggestions). Most numbers add a small flat amount per level (+10 roughly doubles the main number); draws, hits, turns and card counts step up at +5 and +10; cards with nothing to grow get cheaper. Card text always shows the numbers at its rank. Every card is listed below, with its numbers at +0 → +5 → +10.', 'cardlist'],
      ['Combat', 'When you die you stay on the fight screen: read the combat log and damage meter, then press Results to move on.'],
      ['Cards', 'Battle Trance is retired. Every copy in your decks and collections has become Marching Orders (same rank and XP); it no longer drops, and the test decks use Marching Orders.'],
      ['Gear', 'Hold Shift while pointing at any item (rewards, stash, shops, the map merchant, the Bazaar, items linked in chat) to compare it with what you wear: both items side by side and every stat with its + / - difference. Rings and one-handers compare against both slots.'],
      ['Loot', 'Click a dropped card (fight rewards, the loot sack, raid loot, trades) to see it full size.'],
      ['Rest sites', 'Two more options at the fire: Rummage (roll the loot of one normal monster from this part of the map: gear, cards and gold) and Mend (everyone in the party heals 10%; in a party). In co-op each hero picks for themselves (one can rummage while another rests); Extract is still a party vote.'],
      ['Wagon', 'New "Map loot" button at the Wagon: every codex, every named card for your class, every gear base by slot, rarity odds and all the monsters of the chosen map.'],
      ['Combat', 'Paying HP can kill you now: the card still resolves, then you fall (Divine Intervention-style "cannot fall" effects still save you).'],
      ['Cards', 'Lay on Hands and Mend Wounds can heal any hero in your party: click the card, then the hero (or drag the card onto them).'],
      ['Cards', 'Bloodlust gains +5 Strength per upgrade rank (30 at +0, 80 at +10).'],
      ['Maps', 'The far left and far right columns of a map never have more than 11 nodes.'],
      ['Chat', 'The chat box floats beside open windows (character, Scribe, stash...) so you can link from them. Cards can be linked too: shift-click a card at the Scribe, in your deck or in the Compendium.'],
      ['Gear', 'Max Mana now only rolls on chest armor, and gear can add at most +60 max mana in total (base 20, so 80 is the most). Older items keep their Max Mana, but anything over the cap does nothing; the character sheet says "capped".'],
      ['Bazaar', 'The town grew: walk east down the main street, through the gate, into the round Bazaar. Inside the market square you get a "Set up shop" button: list stash items (up to 12) at your own prices, name your shop and open it.'],
      ['Bazaar', 'An open shop shows a striped sign over your head and keeps you in place (close it to walk again). Others click you and pick Browse shop to buy. Gold and the item change hands right away; the seller has to be online. Listings are kept between visits.'],
      ['Town', 'New names: Quartermaster Old Arthur, Guildmaster Strecks, Raid Warden Bagadee, Archivist Casey Jones and Wagoneer Arisha.'],
      ['Scribe', 'Click any card at the Scribe to open its Compendium page: rank slider and where it drops.'],
      ['Compendium', 'Click a codex in the Codexes tab: where it drops (boss and raid), your copies, and example rolls.'],
      ['Loot', 'Map bosses now drop the codex for your class on 50% of kills (more with Luck), down from every kill.'],
      ['Merchants', 'In online parties, every hero gets their own merchant stock on the March: no more racing each other for an item.'],
      ['Maps', 'Maps have 5 or 6 shrines (no more). Extra shrines become fights, merchants or rests. Paths may cross again.'],
      ['Maps', 'New map rules: every row has at least 3 nodes, at most 3 rows have only 3, at least 5 rows have 4. Every map has at least 5 shrines, and no path has more than 4 fights in a row.'],
      ['Maps', 'Enraged elites: 10% of maps hide one (red pulsing ring). +50% HP and damage, drops twice the loot plus a guaranteed Blue item (25% chance it is Epic, more with Luck).'],
      ['Maps', 'Route planner (under the map): the party leader clicks nodes to draw Route A and Route B, and sees a summary of each: fights, elites, shops, rests, shrines and every monster with its loot table. The party sees the leader\'s routes.'],
      ['Gear', 'Clicking a gear slot to compare items now has a Salvage button on every stash item, for instant gold.'],
      ['Combat', 'Party fights are laid out in a grid: 2x2 for 3-4 heroes, 3 across for 5-6, 4-5 across in big raids. Status tags are shortened (hover for the full name). Several monsters line up two by two.'],
      ['Raids', 'You can see who has ended their turn: a green check on the turn bar and "Done" under their name; everyone else shows "playing...".'],
      ['Raids', 'Raid bosses are tougher: Gorrath +30% HP, Vashkar +50% HP and +25% damage, all the others +40% HP. Raid bosses resist 25% of Bleed, Poison and Burn damage.'],
      ['Raids', 'Loot rolls are public: everyone who picks Need or Greed rolls 1-100, and the loot screen and chat show every pick and roll. Highest Need wins, otherwise highest Greed.'],
      ['Raids', 'Chronicler Osk keeps raid kills and wipes too, with the damage meter.'],
      ['Co-op', 'Ready check: when the leader starts a Wagon run or a raid, everyone gets a Ready / Not ready popup (25 seconds). If someone isn\'t ready, everyone is told who, and the start is called off.'],
      ['Chat', 'Item links: shift-click any item (stash, shop, loot, gear slots) to put [Item name] in the chat box. Anyone can click the link to see the item.'],
      ['Social', 'The guild roster has Invite to party and Message buttons for online members.'],
      ['Cards', 'Mana Gem costs 0.'],
      ['Online', 'Fixed big parties and raids silently failing: the game was sending too many messages for our server plan once 4+ players were around (it dropped everyone\'s messages for a moment). Town movement is now batched, status updates are throttled, and party invites retry until they get through.'],
      ['Loot', 'Map bosses always drop a codex now: every kill gives each hero the codex on that boss\'s table for their class (with fresh random stats).'],
      ['Testing', 'Tinker Pip: "Full Blue gear kit" equips a complete Blue set for your class, for testing raids. Your old gear goes to the stash; your codex stays on.'],
      ['Updates', 'This changelog: the "What\'s new" button in the bottom-right corner. A dot means there is something you haven\'t read.'],
      ['Updates', 'New-version warning: when a new build is out you get a banner. In town with nothing open, the game reloads itself after a short countdown (you can cancel).'],
      ['Raids', 'Raid loot is now 10 item levels above what the map\'s boss drops. Each piece rolls on its own: 10% chance to be Epic at +0, +1% per raid level (up to 30%), otherwise Blue. Plus one codex.'],
      ['Compendium', 'The in-town "Codex" is now the Compendium (Archivist Casey Jones), so it isn\'t mixed up with codex items. Enemies are under "Bestiary & loot".'],
      ['Compendium', 'New Codexes tab: every codex, its passive, which boss and raid drop it, and whether you own one.'],
      ['Social', 'Click a player in town to Message them (fills in /w Name) or Invite them to your guild. Friends list has Message and Invite to guild too.'],
      ['Social', 'Press G anywhere (town, map, mid-fight) to open the guild window.'],
      ['Social', 'Friends list and guild roster show where online players are: in town, which map/level/row, fighting, raiding, duelling or at the dummy.'],
      ['Gear', 'Physical weapons (swords, axes, daggers, maces, mauls, warhammers) add flat damage to every Attack hit: +1 for a one-hander, +2 for a two-hander at White on the first map, more with rarity and map level. Dual wielding counts both.'],
      ['Chronicler', 'Chronicler Osk can show the damage meter for each past run (runs finished from today on).'],
      ['Raids', 'Raids! Raid Warden Bagadee (west of the gate). One raid boss per map for 2 to 10 heroes, unlocked by beating that map\'s boss at the same level or higher. Everyone plays at once, every boss attack hits the whole raid, only one hero a round can debuff it, 7-day lockout on kills (wipes are free), Need/Greed/Pass loot with 1-100 rolls in chat.'],
      ['Social', 'Guilds: Guildmaster Strecks. Found one for 50 gold, invite by name or friend code, officers, message of the day, roster with power and last online.'],
      ['Chat', 'Chat channels: /g guild, /p party, /w Name whisper, /r reply, /world. Chat stays up on the left during fights.'],
      ['Heroes', '20 hero slots per account, and as many of one class as you like.'],
      ['Heroes', 'New heroes pick a starting deck (4 playstyles per class) and a starting amulet (from 1 draw / 50 regen to 5 draw / 10 regen). Jeweler Rook sells the pendants. Base mana regen with no amulet: 10 to 15.'],
      ['Combat', 'Rogue poison cards are Attacks now, and poison scales with Strength. The combat log can be resized (drag its edges; double-click to reset).'],
      ['Combat', 'Drag a card onto its target to play it. Card numbers update live from your buffs, and from the target\'s Vulnerable/weakness while you drag.'],
      ['Co-op', 'See your partner\'s hand and the card they just played. Connection details in the Esc menu, and the build number in the bottom-right corner, to sort out sync problems.'],
      ['Gear', 'One-handed weapons can go in either hand. The end-of-run screen shows what you kept and what was lost.'],
      ['Cards', 'Every card now drops somewhere. Seismic Slam costs 0; spend-all-mana cards work correctly when played twice. Blood Debt only shows for heroes who use it.'],
      ['Testing', '72 codex test decks (3 per codex) at Tinker Pip. Delete a hero or start fresh from the hero screen.'],
      ['Art', 'Painted frames and buttons, a battle backdrop for the Broken March, and new card frames for every enemy type, bosses and status cards.'],
    ] },
    { date: '2026-10-30', items: [
      ['Town', 'Training Dummy: 99,999 HP, never hits back, has mana and cards for testing burns and discards.'],
      ['Co-op', 'Online co-op: the party leader starts shared Wagon runs (vote on the route, turn timers, the game carries on if the leader drops). Duels between party members.'],
      ['Maps', 'Maps 2 to 6: Cinder Reach, Rimewatch, Tanglewild, Shattered Spire, Hollow Crypts, each with its own element and boss.'],
      ['Codexes', 'Codexes: a class-only gear slot with 24 passives that drop from bosses. Tinker Pip hands out test gear for free.'],
      ['Cards', 'All 578 designed cards are playable, including Powers.'],
      ['Heroes', 'Character screen (C) with your gear and deck, inspect other players, trade with them.'],
      ['Combat', 'Party fights: one monster per hero, enemy targets shown in advance, turn-order bar, damage meter.'],
      ['Town', 'The Codex (now the Compendium): every card, enemy, deck, loot table and gear base. Click a card to see its ranks and where it drops.'],
      ['Social', 'Other players in town, world chat, friends with online status, party invites. Sign in with email or Discord; progress saves to your account.'],
    ] },
  ];
  const UPD = { seenKey: 'cb-seen-changes', newBuild: null, countdown: null };
  const changeStamp = () => CHANGELOG[0].date + ':' + CHANGELOG[0].items.length;
  const seenChanges = () => { try { return localStorage.getItem(UPD.seenKey) === changeStamp(); } catch (e) { return true; } };
  // every card's upgrade, worked out from the live card data so it always matches the game: numbers at +0 -> +5 -> +10
  function cardUpgradeLine(key) {
    const d = CARDS[key], v5 = CB.rankedCard(key, 5), v10 = CB.rankedCard(key, 10), U = (typeof CB_UPGRADES !== 'undefined' && CB_UPGRADES[key]) || {};
    const sp = (t) => t.split(/(\d+)/), a = sp(d.text), b = sp(v5.text), c = sp(v10.text);
    let body;
    const same = (x, y) => x.replace(/s\b/g, '') === y.replace(/s\b/g, ''); // "1 card" vs "3 cards"
    if (a.length === c.length && a.length === b.length && a.every((x, i) => i % 2 || (same(x, b[i]) && same(x, c[i])))) {
      body = c.map((x, i) => i % 2 === 0 ? esc(x) : (x === a[i] ? esc(x) : `<b>${a[i]} → ${b[i]} → ${x}</b>`)).join('');
    } else if (v10.text.startsWith(d.text) && v5.text.startsWith(d.text)) body = `${esc(d.text)} <span class="muted">Adds</span>${v5.text !== d.text ? ` <span class="muted">+5:</span> ${esc(v5.text.slice(d.text.length).trim())}` : ''} <span class="muted">+10:</span> <b>${esc(v10.text.slice(d.text.length).trim())}</b>`;
    else body = `${esc(d.text)} <span class="muted">+5:</span> ${esc(v5.text)} <span class="muted">+10:</span> <b>${esc(v10.text)}</b>`;
    const cost = d.cost != null && (v5.cost !== d.cost || v10.cost !== d.cost) ? ` <span class="clcost">Cost <b>${d.cost} → ${v5.cost} → ${v10.cost}</b>.</span>` : '';
    return `<li><span><b style="color:${RC[d.rarity]}">${esc(d.name)}</b> <span class="muted">${esc(d.rarity)} ${esc(d.type)}</span>: ${body}${cost}${U.n ? ` <i class="muted">(${esc(U.n)})</i>` : ''}</span></li>`;
  }
  function cardUpgradeList() {
    const by = {}; for (const k of Object.keys(CARDS)) { const d = CARDS[k]; if (!d.cls || d.designOnly || !['White', 'Green', 'Blue', 'Gold'].includes(d.rarity)) continue; (by[d.cls] = by[d.cls] || []).push(k); }
    const RO = { White: 0, Green: 1, Blue: 2, Gold: 3 };
    return Object.keys(by).map(cls => `<details class="clcards"><summary>${esc(cls)} (${by[cls].length} cards)</summary><ul>${by[cls].sort((x, y) => RO[CARDS[x].rarity] - RO[CARDS[y].rarity] || CARDS[x].name.localeCompare(CARDS[y].name)).map(cardUpgradeLine).join('')}</ul></details>`).join('');
  }
  function openChangelog() {
    try { localStorage.setItem(UPD.seenKey, changeStamp()); } catch (e) {}
    updBtn();
    const day = (d) => new Date(d + 'T12:00:00').toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    modal(`<h2>What's new</h2><p class="muted" style="margin:0">Every update, newest first. You are on build ${esc(CB_BUILD)}.</p>
      <div class="changelog">${CHANGELOG.map(g => `<h3>${day(g.date)}</h3><ul>${g.items.map(([a, t, x]) => `<li><span class="clarea">${esc(a)}</span><span>${esc(t)}${x === 'cardlist' ? cardUpgradeList() : ''}</span></li>`).join('')}</ul>`).join('')}</div>
      <div class="row"><button class="btn primary" id="mClose">Close</button></div>`);
    $('modalBox').classList.add('wide'); $('mClose').onclick = closeModal;
  }
  function updBtn() { const b = $('btnUpdates'); if (b) b.classList.toggle('unread', !seenChanges()); }
  (function () {
    const b = document.createElement('button'); b.id = 'btnUpdates'; b.className = 'btn'; b.innerHTML = "What's new<i></i>"; b.title = 'Changelog: every update by day';
    b.onclick = openChangelog; document.body.appendChild(b); updBtn();
  })();

  // ---------- new version check: public/version.json holds the newest build id (written by build.js)
  async function checkVersion() {
    if (location.protocol === 'file:' || UPD.newBuild) return;
    try {
      const r = await fetch('version.json?t=' + Date.now(), { cache: 'no-store' }); if (!r.ok) return;
      const v = await r.json(); if (v && v.build && v.build !== CB_BUILD) { UPD.newBuild = v.build; showUpdateBanner(); }
    } catch (e) {}
  }
  // safe to reload: in town or on the hero screen, not in a co-op game, nothing open, not typing
  const idleInTown = () => !run && !cb && !(typeof NET !== 'undefined' && (NET.s || NET.pend)) && $('modal').hidden && $('sheet').hidden && ($('talk') ? $('talk').hidden : true) && document.activeElement !== $('chatIn') && (!$('scrStart').hidden || !$('scrTitle').hidden) && !(typeof TR !== 'undefined' && TR.s);
  function showUpdateBanner() {
    let el = $('updBanner'); if (!el) { el = document.createElement('div'); el.id = 'updBanner'; document.body.appendChild(el); }
    const draw = () => {
      const n = UPD.countdown;
      el.innerHTML = `<b>A new version of Cardbound is out.</b> <span>${n != null ? `Reloading in ${n}s...` : idleInTown() ? 'Reload to get it.' : 'Reload once you are back in town (co-op partners need the same version).'}</span> <button class="btn primary" id="updNow">Reload now</button>${n != null ? '<button class="btn" id="updWait">Not now</button>' : ''}`;
      $('updNow').onclick = () => location.reload();
      if ($('updWait')) $('updWait').onclick = () => { UPD.countdown = null; UPD.snooze = Date.now(); draw(); };
    };
    draw();
    clearInterval(UPD.timer);
    UPD.timer = setInterval(() => {
      if (UPD.countdown != null) { if (!idleInTown()) { UPD.countdown = null; draw(); return; } if (--UPD.countdown <= 0) { try { save(); } catch (e) {} location.reload(); return; } draw(); return; }
      if (idleInTown() && (!UPD.snooze || Date.now() - UPD.snooze > 10 * 60 * 1000)) { UPD.countdown = 20; draw(); }
      else draw();
    }, 1000);
  }
  setInterval(checkVersion, 3 * 60 * 1000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) checkVersion(); });
  setTimeout(checkVersion, 15000);
