  // ---------- What's new: the changelog (button bottom-right) and the new-version warning
  // Add new entries at the TOP of CHANGELOG (newest day first). Each item: [area, text]. Written for players.
  const CHANGELOG = [
    { date: '2026-10-31', items: [
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
  function openChangelog() {
    try { localStorage.setItem(UPD.seenKey, changeStamp()); } catch (e) {}
    updBtn();
    const day = (d) => new Date(d + 'T12:00:00').toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    modal(`<h2>What's new</h2><p class="muted" style="margin:0">Every update, newest first. You are on build ${esc(CB_BUILD)}.</p>
      <div class="changelog">${CHANGELOG.map(g => `<h3>${day(g.date)}</h3><ul>${g.items.map(([a, t]) => `<li><span class="clarea">${esc(a)}</span><span>${esc(t)}</span></li>`).join('')}</ul>`).join('')}</div>
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
