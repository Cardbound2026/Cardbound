import json, re
A = json.load(open('/tmp/claude-0/-home-claude/654d5b11-96c9-5be1-9b01-ca0776c2bbeb/scratchpad/allcards.json'))

# ---- the user's own calls (Warrior White/Green), keyed by card name
USER = {
 'Battle Shout': '+2 Strength per level', 'Bloodletting': '+1 mana per level', 'Brace for Impact': '+1 Block and +1 mana per level',
 'Catch Your Breath': '+2 mana per level', 'Charge': '+1 damage and +1 Initiative per level', 'Crack Armor': '+1 Vulnerable per level; +5: draw 2, +10: draw 3',
 'Desperate Strike': '+1 base damage and +1 conditional damage per level', 'Flurry of Blows': '+1 damage per level; +1 hit every other level',
 'Grit': '+1 Block per level', 'Guarded Stance': '+2 Parry per level; +5: draw 2, +10: draw 3', 'Hardened': '+1 Block per level',
 'Hold the Line': '+2 Block per level, +1 Block for allies', 'Hunker Down': '+1 mana every other level', 'Intimidating Shout': '+2 Weak per level',
 'Kick Aside': '+1 Block per level', 'Lacerate': '+1 damage and +1 Bleed per level', 'Pommel Strike': '+1 damage per level; +5: draw 2, +10: draw 3',
 'Rend': '+1 damage and +1 Bleed per level', 'Riposte': '+1 Parry and +1 damage back per level', 'Second Wind': '+1 HP healed per level',
 'Shake It Off': '+5: remove 2 debuffs and draw 2; +10: remove 3 and draw 3', 'Shatter Guard': '+1 Block removed and +1 damage per level',
 'Shield Bash': '+1 damage and +1 Block per level', 'Shield Strike': '+5% of Block per level', 'Sunder Armor': '+1 damage and +1 Vulnerable per level',
 'Taunt': '+1 Block per level', 'Underdog': '+3 conditional damage per level', 'Warcry': '+2 mana per level',
 'Adrenaline Surge': '+10 Strength per level, and 2 ... per level (unclear, see note)', 'Battle Plan': '+5: draw 4, +10: draw 5',
 'Battle Rhythm': '-1 mana cost per level', 'Bloodthirst': '+5% lifesteal per level', 'Cauterize': '+2 HP per level',
 'Clear Head': '+5: draw 3, +10: draw 4 (see note)', 'Collect the Debt': 'Deal damage equal to stored Blood Debt (+5% per level), then clear it',
 'Conditioning': '+2 max mana and +1 regen per level', 'Counter Stance': '+1 Parry and +1 damage back per level', 'Crimson Whirl': '+1 damage and +1 Bleed per level',
 'Crushing Blow': '+2 damage per level', 'Deep Cuts': '+1 damage per level, +1 Bleed every other level', 'Fall Back': 'Add "Heal 2 HP" per level, starting at +1',
 'Fireproof': '+2 Block per level', 'Flush Out': '+2 damage per level', 'Forge-Hardened': '+1 Block per level', 'Grudge': '-1 mana cost every other level (replaces the current cost cut)',
 'Hamstring': '+1 damage and +2% damage reduction per level', 'Hidden Reserves': '+2 mana per level; +5: draw 2, +10: draw 3',
 'Iron Constitution': '-1 mana cost every other level; +5: 3 turns, +10: 4 turns', 'Iron Will': '+2 Block and +1 mana per level',
 'Jarring Parry': '+2 Parry per level; +5: draw 2, +10: draw 3 (see note)', 'Marching Orders': '-1 mana cost per level, all the way to +10',
 'Mark for Death': '+2 Vulnerable per level; +5: draw 2, +10: draw 3', 'Momentum': '-1 mana cost per level; +5: draw 2, +10: draw 3',
 'Pinning Strike': '+1 damage per level, +1 Slow every other level', 'Rally': '+2 Strength and +1 Block per level',
 'Rattle': '+1 damage per level; +5: discard 2, +10: discard 3 (see note)', 'Rattling Roar': '+1 damage per level; +5: draws 2 fewer, +10: 3 fewer (see note)',
 'Read the Blade': '-1 mana cost every other level', 'Reclaim Ground': '+1 Block per level (see note)', 'Rimeguard': '+1 Block per level',
 'Sanguine Guard': 'Add "Heal 2 HP", +2 per level', 'Sever': '+1 damage per level', 'Sharpen': '+1 damage per level',
 'Shatter Morale': 'Block lost -5% per level (+1 keeps 5%, +10 keeps 50%)', 'Shield Slam': '+2% of Block per level', 'Shield Up': '+1 Block now and +1 Block next turn per level',
 'Steady Pace': '+1 mana regen per level', 'Sundering Blow': '+1 damage and +1 Block removed per hit per level; +5: 4 hits, +10: 5 hits',
 'Survey the Field': '-1 mana cost every other level; look at 1 more card every other level', 'Throw Weapon': '+1 damage per level; +5: 2 cards, +10: 3 cards (see note)',
 'Thunderclap': '+1 damage per level', 'Unflinching': '+1 Block per level', 'War Chest': '+1 mana per level', 'Wind Up': '+1 damage per 5 mana, improving every 3 levels (see note)',
}
USER_NOTES = {
 'Adrenaline Surge': '"10 strength per 2 degrade per": +10 Strength per level, but should the decay also grow by 2 per level (60/-10 becomes 160/-30 at +10), or shrink by 2? I read it as decay shrinking, which makes +10 very strong.',
 'Clear Head': 'Clear Head draws 1 per Dazed/Fatigue exhausted. Did you mean it also draws a flat 3 at +5 and 4 at +10, or 1 extra per exhausted card at +5 and 2 at +10?',
 'Jarring Parry': 'It does not draw today (it adds a Dazed to the attacker). Did you mean +5 adds 2 Dazed and +10 adds 3?',
 'Rattle': 'You wrote "draw 2/3 cards", but Rattle makes the target discard. I assumed the discard grows instead (2 at +5, 3 at +10).',
 'Rattling Roar': 'You wrote "draw 2/3 cards", but this makes the target draw fewer. I assumed 2 fewer at +5 and 3 fewer at +10.',
 'Throw Weapon': 'Both you and the target discard 2. Did you mean you discard fewer, the target discards more, or a draw on top?',
 'Reclaim Ground': 'Is it +1 flat Block per level, or +1 Block per Vulnerable consumed per level (that grows huge)?',
 'Wind Up': 'Today +1 damage per 5 mana. Does "1 damage every 3 levels" mean +1 per 5 mana becomes +2 at +3, +3 at +6, +4 at +9?',
 'Cauterize': 'Is that +2 HP flat per level, or 1 more HP per stack removed (2 per stack at +1)?',
}

DT = r'(?:(?:Physical|Holy|Arcane|Frost|Fire|Nature|Shadow) )?'
def per(n, div, mn=1): return max(mn, round(n / div))

def analyse(c):
    t = c['text']; parts = []; tags = set(); thresholds = []
    def add(s, tag): parts.append(s); tags.add(tag)
    for m in re.finditer(r'(below|above|under|over|at least|less than|more than|or more|or less) (\d+)%', t): thresholds.append(m.group(0))
    # damage (main), conditional / extra damage
    for m in re.finditer(r'(?<![\d%])(\d+) ' + DT + r'damage(?! back)', t):
        pre = t[max(0, m.start() - 6):m.start()]
        if 'more' in t[m.end():m.end() + 1] or re.search(r'(more|extra|\+)\s*$', pre): continue
        n = int(m.group(1)); add('+1 damage every other level' if n <= 2 else f'+{per(n,7)} damage', 'dmg')
    for m in re.finditer(r'(\d+) more ' + DT + r'damage|deal (\d+) more|(\d+) more damage', t):
        n = int(next(g for g in m.groups() if g)); add(f'+{per(n,7)} bonus damage', 'cdmg')
    for m in re.finditer(r'takes? (\d+) damage back|deal (\d+) damage back|(\d+) damage back', t):
        n = int(next(g for g in m.groups() if g)); add(f'+{per(n,8)} damage back', 'back')
    for m in re.finditer(r'(\d+) (Block|Barrier|Dodge|Parry)\b', t):
        n = int(m.group(1)); pre = t[max(0, m.start() - 12):m.start()]
        if 'Remove' in pre or 'remove' in pre or 'removes' in pre: add(f'+{per(n,7)} {m.group(2)} removed', 'shred')
        else: add(f'+{per(n,7)} {m.group(2)}', 'def')
    for m in re.finditer(r'(\d+) (Bleed|Poison|Burn)\b', t):
        n = int(m.group(1)); add(f'+1 {m.group(2)} every other level' if n <= 3 else f'+{per(n,6)} {m.group(2)}', 'dot')
    for m in re.finditer(r'(\d+) (Vulnerable|Weak|Slow|Chill|Unwarded|Condemnation|Condemn|Exposure)\b', t):
        n = int(m.group(1)); add(f'+1 {m.group(2)} every other level' if n <= 3 else f'+{per(n,10)} {m.group(2)}', 'debuff')
    for m in re.finditer(r'(\d+) (Strength|Intelligence|Dexterity|Spirit|Stamina)\b', t): n = int(m.group(1)); add(f'+{per(n,10)} {m.group(2)}', 'stat')
    for m in re.finditer(r'(\d+) maximum mana', t): add('+2 max mana', 'maxmana')
    for m in re.finditer(r'(\d+) mana regeneration', t): add(f'+{per(int(m.group(1)),10)} mana regen', 'regen')
    for m in re.finditer(r'(?:[Gg]ain|gains|restore|Restore|gain back) (\d+) (?:more |extra )?mana', t): add(f'+{per(int(m.group(1)),10)} mana', 'mana')
    for m in re.finditer(r'(?:[Hh]eal|heals|restore|[Gg]ain)(?: [a-z (),]+?)?(?: for)? (\d+) (?:HP|health)', t): add(f'+{per(int(m.group(1)),6)} HP healed', 'heal')
    for m in re.finditer(r'(\d+) Initiative', t): add('+1 Initiative', 'init')
    for m in re.finditer(r'(\d+) Thorns', t): add('+1 Thorns', 'thorns')
    for m in re.finditer(r'(\d+) Devotion', t): add('+1 Devotion every other level', 'misc')
    for m in re.finditer(r'(\d+) (?:Shurikens?|Dazed|Stun)', t): add('+1 at +5, +2 at +10', 'count')
    # percentages (not thresholds)
    for m in re.finditer(r'(\d+)%', t):
        ctxs = t[max(0, m.start() - 14):m.end() + 3]
        if any(ctxs in th or th in ctxs for th in thresholds) or re.search(r'(below|above|under|over|least|than) \d+%', ctxs): continue
        n = int(m.group(1)); add(f'+{max(2, round(n/10))}% per level', 'pct')
    # milestones
    ms = []
    dm = re.search(r'[Dd]raws? (\d+) (?:extra )?cards?|[Dd]raw (\d+)|(\d+) (?:extra )?cards? (?:next|from)', t)
    if dm or re.search(r'[Dd]raw a card|draw 1 card', t):
        n = int(next((g for g in (dm.groups() if dm else []) if g), 1)); ms.append(f'draw {n+1} at +5, {n+2} at +10'); tags.add('draw')
    hm = None if re.search(r'ticks? twice|twice as|play(?:ed|s)? twice', t) else re.search(r'(\d+) times|\btwice\b', t)
    if hm: n = int(hm.group(1)) if hm.group(1) else 2; ms.append(f'{n+1} hits at +5, {n+2} at +10'); tags.add('hits')
    tm = re.search(r'(?:for|next|over) (?:the next )?(\d+) (turns|rounds)', t)
    if tm: n = int(tm.group(1)); ms.append(f'{n+1} {tm.group(2)} at +5, {n+2} at +10'); tags.add('turns')
    rm = re.search(r'(\d+) random cards?', t)
    if rm: n = int(rm.group(1)); ms.append(f'{n+1} at +5, {n+2} at +10'); tags.add('count')
    return parts, ms, tags, thresholds

def decide(c):
    name = c['name']
    if name in USER:
        return USER[name], '', 'Your call', USER_NOTES.get(name, '')
    parts, ms, tags, th = analyse(c)
    t = c['text']; cost = c['cost']; notes = []
    ratio = re.search(r'equal to|for each|for every|per (?:stack|card|enemy|debuff|buff|Devotion|Dodge|mana)|\bper\b \d+|double|twice the|all your mana|spend all', t)
    scal = [p for p in parts]
    conf = 'Clear'
    allof = re.search(r'equal to|all of your|all your|that much|for every|for each', t)
    if not scal and allof and cost is not None:
        sug = '+5% to the amount per level (105% at +1, 150% at +10)'; conf = 'Unsure'; notes.append('Scales off another number (Block, mana, stacks...). Growing that conversion by 5% a level matches your Shield Strike / Collect the Debt rule; the alternative is -1 cost every other level.')
        if ms: sug += '; ' + '; '.join(ms)
    elif not scal:
        if cost is None:
            sug = 'Unplayable on-draw card: scale what it gives when drawn (milestones below), or +1 of its bonus every other level'
            conf = 'Unsure'
        elif cost >= 20: sug = '-1 mana cost per level'; conf = 'Unsure'; notes.append('No number to grow, so I followed your utility rule: cheaper each level (cost 20+ gets -1 per level).')
        elif cost >= 10: sug = '-1 mana cost every other level'; conf = 'Unsure'; notes.append('No number to grow; cost 10 cards get -1 every other level like Read the Blade and Grudge.')
        else: sug = 'Free already: add a small effect, e.g. +1 Block per level, or draw 1 at +5 / 2 at +10'; conf = 'Unsure'; notes.append('Costs 0 and has no number, so neither of your two utility rules applies.')
        if ms: sug += '; ' + '; '.join(ms)
    else:
        # collapse duplicates like two "+1 damage"
        seen = []; [seen.append(p) for p in scal if p not in seen]
        sug = ', '.join(seen) + ' per level'
        sug = sug.replace(' per level per level', ' per level').replace('% per level, ', '%, ').replace('every other level per level', 'every other level')
        if ms: sug += '; ' + '; '.join(ms)
    if ratio: conf = 'Unsure' if conf != 'Unsure' else conf; notes.append('Uses a ratio ("equal to" / "for each"): grow the ratio a little (+5% per level) or add a flat bonus? Flat numbers on ratio cards can snowball.')
    if c['type'] == 'Power' and conf == 'Clear': conf = 'Check'; notes.append('Power: lasts the whole fight, so per-level gains compound. Maybe half rate (every other level).')
    if th: notes.append('Thresholds kept as they are: ' + ', '.join(th) + '.')
    if re.search(r'[Ll]ose (\d+) HP', t) and conf == 'Clear': conf = 'Check'; notes.append('Self-damage is the price: I left the HP cost alone (your Bloodletting rule).')
    if c['rarity'] in ('Blue', 'Gold') and conf == 'Clear' and len(scal) >= 3: conf = 'Check'; notes.append('Several numbers on a strong card: growing all of them may be too much.')
    if 'pct' in tags and conf == 'Clear' and len(tags) == 1: conf = 'Check'; notes.append('Percent-only card: your list used 2% to 5% per level; I used about a tenth of the base.')
    if ('draw' in tags or 'hits' in tags or 'turns' in tags or 'count' in tags) and not scal and conf != 'Unsure': conf = 'Check'
    return sug, '', conf, ' '.join(notes)

rows = []
for c in A:
    sug, _, conf, note = decide(c)
    rows.append({**c, 'sug': sug, 'conf': conf, 'note': note})
json.dump(rows, open('/tmp/claude-0/-home-claude/654d5b11-96c9-5be1-9b01-ca0776c2bbeb/scratchpad/upg/rows.json', 'w'))
import collections
print(collections.Counter(r['conf'] for r in rows))
print(collections.Counter((r['cls'], r['conf']) for r in rows))
print(sum(1 for r in rows if r['name'] in USER), 'user rows of', len(USER))
for r in rows[:0]: pass
for r in [r for r in rows if r['conf']=='Unsure'][:25]: print(r['cls'][:3], r['rarity'][0], r['cost'], r['name'], '|', r['text'][:90], '=>', r['sug'][:90])
