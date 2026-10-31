# Adds Maps 2-6 (maps_2to6.py) to the game data (src/data.js) next to Map 1, and writes a design workbook per map.
# Usage: python3 export_maps.py   (re-runnable: it strips previously added maps first)
# What it builds per map: enemies (decks, types, gold), named gear bases (every archetype gets a map name), gear pools,
# and loot tables picked the same way as Map 1 (build_map.py): per class 9 White / 7 Green / 5 Blue cards for regulars
# and elite extras, 6 Gold cards per class for the elites, and the boss's 4 codexes. Cards favor the map's codex playstyles
# and cards no earlier map uses yet.
import json, re, os, runpy, random, openpyxl
from openpyxl.styles import Font, Alignment, PatternFill
S = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(S))
M = runpy.run_path(os.path.join(S, 'maps_2to6.py'))
DATA_JS = os.path.join(ROOT, 'src', 'data.js')
t = open(DATA_JS).read(); D = json.loads(t[t.index('{'):t.rindex('}') + 1])
slug = lambda n: re.sub(r'[^a-z]+', '_', n.lower()).strip('_')

# ---- Map 1 stays as designed; tag it
for k, e in list(D['enemies'].items()):
    if e.get('map', 'physical') != 'physical': del D['enemies'][k]
    else: e['map'] = 'physical'
D['gear']['bases'] = [b for b in D['gear']['bases'] if b.get('map', 'physical') == 'physical']
for b in D['gear']['bases']: b['map'] = 'physical'
D['maps'] = {'physical': {'key': 'physical', 'num': 1, 'name': 'The Broken March', 'element': 'Physical', 'dropResist': 'Fire', 'boss': 'warlord_gorrath_the_iron_tide',
  'theme': 'A war-torn borderland of deserters, bandit camps, mercenary forts and old siege engines. Enemies mostly deal Physical damage; gear drops lean toward Fire Resistance (for the Fire map next).',
  'codexes': {'Warrior': 'Colossus', 'Rogue': 'Ninja', 'Mage': 'Barrier Savant', 'Paladin': 'Righteous Crusader'}}}

# ---- cards (from the generated card list) and what Map 1 already uses
cards = json.load(open(os.path.join(S, 'cards_gen.json')))
used = set()
for e in D['enemies'].values():
    for x in e.get('loot', []):
        if x['type'] == 'Card': used.add((x['cls'], x['item']))
GOLD = {'1': [5, 10], '2': [10, 20], '3': [20, 35], 'Elite': [60, 100], 'Boss': [250, 400]}
WEAK_OF = {'Physical': 'Arcane', 'Fire': 'Frost', 'Frost': 'Fire', 'Nature': 'Fire', 'Arcane': 'Shadow', 'Shadow': 'Fire'}
NOUN = {'Greathelm': 'Greathelm', 'Cuirass': 'Cuirass', 'Vambraces': 'Vambraces', 'Gauntlets': 'Gauntlets', 'Girdle': 'Girdle', 'Greaves': 'Greaves', 'Sabatons': 'Sabatons',
        'Leather Cap': 'Cap', 'Jerkin': 'Jerkin', 'Leather Bracers': 'Bracers', 'Leather Gloves': 'Gloves', 'Leather Belt': 'Belt', 'Breeches': 'Breeches', 'Leather Boots': 'Boots',
        'Cloth Hood': 'Hood', 'Robe': 'Robe', 'Wraps': 'Wraps', 'Handwraps': 'Handwraps', 'Sash': 'Sash', 'Leggings': 'Leggings', 'Slippers': 'Slippers', 'Cloak': 'Cloak',
        'Amulet': 'Pendant', 'Kite Shield': 'Kite Shield', 'Tower Shield': 'Tower Shield', 'Focus': 'Focus', '1H Axe': 'Hatchet', '1H Sword': 'Blade', 'Dagger': 'Dagger', '1H Mace': 'Mace',
        'Wand': 'Wand', '2H Axe': 'Greataxe', '2H Sword': 'Greatsword', '2H Maul': 'Maul', '2H Warhammer': 'Warhammer', 'Fire Staff': 'Fire Staff', 'Frost Staff': 'Frost Staff',
        'Nature Staff': 'Nature Staff', 'Arcane Staff': 'Arcane Staff', 'Shadow Staff': 'Shadow Staff'}
arche = D['gear']['arche']
def labelOf(arch):
    a = arche[arch]; sl = a['slot']
    if arch in ('Kite Shield', 'Tower Shield', 'Focus'): return arch + ', off-hand'
    if a.get('type') in ('Plate', 'Leather', 'Cloth'): return f"{a['type']} {sl}"
    return arch
reports = []
for m in M['MAPS']:
    mk = m['key']; rnd = random.Random(m['num'] * 7919)
    # named bases: every armor archetype, cloak, 2 rings, amulet, off-hands, weapons and every staff
    archs = [b['arch'] for b in D['gear']['bases'] if b['map'] == 'physical']
    archs = [a for a in dict.fromkeys(archs)] + ['Ring'] + [s for s in ('Frost Staff', 'Nature Staff', 'Arcane Staff', 'Shadow Staff') if s in arche]
    names, bases = set(), []
    for i, a in enumerate(archs):
        adj = m['adjectives'][i % len(m['adjectives'])]
        noun = NOUN.get(a, a) if not (a == 'Ring' and any(b['arch'] == 'Ring' for b in bases)) else 'Signet'
        if a == 'Ring' and noun != 'Signet': noun = 'Band'
        nm = f'{adj} {noun}'
        while nm in names: adj = m['adjectives'][(m['adjectives'].index(adj) + 1) % len(m['adjectives'])]; nm = f'{adj} {noun}'
        names.add(nm); bases.append({'name': nm, 'arch': a, 'label': labelOf(a), 'map': mk})
    D['gear']['bases'] += bases
    # card picks per class (like build_map.py): codex playstyle first, then cards not yet used on any map
    pick, golds = {}, {}
    for cls, cx in m['boss_codexes'].items():
        def score(c): return (3 if cx in str(c['codex']) else 0) + (2 if (cls, c['name']) not in used else 0) + (0.5 if 'Any' in str(c['codex']) else 0)
        pool = lambda rar: sorted([c for c in cards if c['cls'] == cls and c['rarity'] == rar], key=lambda c: (-score(c), c['id']))
        pick[cls] = dict(White=pool('White')[:9], Green=pool('Green')[:7], Blue=pool('Blue')[:5]); golds[cls] = pool('Gold')[:6]
        for lst in list(pick[cls].values()) + [golds[cls]]:
            for c in lst: used.add((cls, c['name']))
    reg_slots = lambda cls: (pick[cls]['White'][0:7] + pick[cls]['Green'][0:5] + pick[cls]['Blue'][0:3])
    elite_slots = lambda cls: [pick[cls]['White'][7], pick[cls]['White'][8], pick[cls]['Green'][5], pick[cls]['Green'][6], pick[cls]['Blue'][3], pick[cls]['Blue'][4]]
    PCT = {'White': 5, 'Green': 2, 'Blue': 1}; EPCT = [6, 6, 3, 3, 2, 2]
    ri = ei = 0; boss_key = None
    for e in m['enemies']:
        key = slug(e['name'])
        if key in D['enemies']: key = mk + '_' + key
        typ = M['OFF_TYPE'].get(e['name'], m['element'])
        mx, rg = re.findall(r'\d+', e['mana'])[:2]
        p2 = re.findall(r'\((\d+) in phase 2\)', e['mana']); d2 = re.findall(r'\((\d+) in phase 2\)', str(e['draw']))
        deck = [{'name': nm.replace('PHASE 2 - ', ''), 'n': n, 'cost': cost, 'kind': kind, 'text': text, 'phase2': nm.startswith('PHASE 2 - '), 'dtype': dt if dt != '-' else 'Physical'}
                for nm, n, cost, kind, text, dt in e['deck']]
        loot = []
        if e['role'] == 'Regular':
            for cls in ('Warrior', 'Rogue', 'Mage', 'Paladin'):
                c = reg_slots(cls)[ri]; loot.append({'item': c['name'], 'type': 'Card', 'cls': cls, 'rarity': c['rarity'], 'pct': PCT[c['rarity']], 'note': c['text']})
            ri += 1
        elif e['role'] == 'Elite':
            for cls in ('Warrior', 'Rogue', 'Mage', 'Paladin'):
                g = golds[cls][ei] if ei < len(golds[cls]) else None
                if g: loot.append({'item': g['name'], 'type': 'Card', 'cls': cls, 'rarity': 'Gold', 'pct': 1.5, 'note': g['text']})
            for cls in ('Warrior', 'Rogue', 'Mage', 'Paladin'):
                c = elite_slots(cls)[ei]; loot.append({'item': c['name'], 'type': 'Card', 'cls': cls, 'rarity': c['rarity'], 'pct': EPCT[ei], 'note': c['text']})
            ei += 1
        else:
            boss_key = key
            for cls in ('Warrior', 'Rogue', 'Mage', 'Paladin'):
                loot.append({'item': m['boss_codexes'][cls] + ' Codex', 'type': 'Codex', 'cls': cls, 'rarity': 'Codex', 'pct': 3, 'note': 'Fixed codex passive plus random affixes; cannot be upgraded.'})
        pool = [b['name'] for b in rnd.sample(bases, 6)]
        en = {'name': e['name'], 'tier': str(e['tier']), 'hp': e['hp'], 'draw': int(re.findall(r'\d+', str(e['draw']))[0]), 'draw2': int(d2[0]) if d2 else None,
              'maxMana': int(mx), 'regen': int(rg), 'regen2': int(p2[0]) if p2 else None, 'creature': e['creature'], 'type': typ, 'weak': WEAK_OF[typ],
              'arch': e['arch'], 'desc': e['desc'], 'deck': deck, 'gold': GOLD[str(e['tier'])], 'pool': pool, 'loot': loot, 'map': mk}
        if e.get('dmg'): en['dmgScale'] = e['dmg']
        D['enemies'][key] = en
    # Map damage x1.6 (sims, Oct 30): a hero carrying ~40% of this map's resistance (from farming the previous map) faces about Map 1 difficulty;
    # a fully resisted hero has it easier, an unprepared one takes 60% more damage. That is the resistance chain doing its job.
    D['maps'][mk] = {'key': mk, 'num': m['num'], 'name': m['name'], 'element': m['element'], 'dropResist': m['dropResist'], 'boss': boss_key, 'theme': m['theme'], 'codexes': m['boss_codexes'], 'dmgScale': 1.6}
    # ---- design workbook (same sheets as Map 1)
    wb = openpyxl.Workbook(); H = Font(bold=True, color='FFFFFF'); FILL = PatternFill('solid', fgColor='5A2620')
    def sheet(title, header, rows, widths):
        ws = wb.create_sheet(title); ws.append(header)
        for c in ws[1]: c.font = H; c.fill = FILL; c.alignment = Alignment(wrap_text=True, vertical='top')
        for r in rows: ws.append(r)
        for i, w in enumerate(widths): ws.column_dimensions[chr(65 + i)].width = w
        for row in ws.iter_rows(min_row=2):
            for c in row: c.alignment = Alignment(wrap_text=True, vertical='top')
        ws.freeze_panes = 'A2'
    ov = wb.active; ov.title = 'Overview'
    for line in [f"Map {m['num']}: {m['name']} ({m['element']})", m['theme'], '', 'Structure: 22 enemies. 15 regulars in 3 tiers of 5, 6 elites (each drops one Gold card per class), 1 two-phase boss that drops this map\'s 4 codexes.',
                 'Numbers mirror Map 1 tier by tier (after its balance pass). About 90% of enemy attack cards deal ' + m['element'] + ' damage; one tier-3 enemy carries a big off-element card to route around.',
                 f"Gear from this map rolls {m['dropResist']} Resistance as its implicit (for the next map). Enemy type: {m['element']} (resists its own element), weak to {m['weak']} (takes 125%).",
                 f"Map damage x1.6: tuned so a hero with ~40% {m['element']} Resistance (farmed on the previous map) faces about Map 1 difficulty. Without it, enemies hit 60% harder.",
                 'Boss codexes: ' + ', '.join(f'{k}: {v}' for k, v in m['boss_codexes'].items()), '', 'Generated by design/scripts/export_maps.py from maps_2to6.py. Edit the .py and re-run; the game data (src/data.js) is rebuilt at the same time.']:
        ov.append([line])
    ov.column_dimensions['A'].width = 140
    roster = [[e['name'], str(e['tier']), e['rows'], e['role'], e['arch'], e['creature'], M['OFF_TYPE'].get(e['name'], m['element']), WEAK_OF[M['OFF_TYPE'].get(e['name'], m['element'])], e['hp'], str(e['draw']), e['mana'], sum(c[1] for c in e['deck'] if not c[0].startswith('PHASE 2')), e['desc']] for e in m['enemies']]
    sheet('Roster', ['Enemy', 'Tier', 'Map rows', 'Role', 'Style', 'Creature', 'Type (resists)', 'Weak to (takes 125%)', 'HP (solo)', 'Draw', 'Mana (max / regen)', 'Deck size', 'Description'], roster, [26, 6, 9, 9, 22, 11, 12, 12, 8, 14, 18, 8, 70])
    decks = []
    for e in m['enemies']:
        for nm, n, cost, kind, text, dt in e['deck']: decks.append([e['name'], nm, n, cost, kind, dt, text])
    sheet('Enemy Decks', ['Enemy', 'Card', 'Copies', 'Cost', 'Kind', 'Damage type', 'Effect'], decks, [26, 28, 7, 6, 9, 11, 80])
    lt = []
    for e in m['enemies']:
        en = D['enemies'][slug(e['name'])] if slug(e['name']) in D['enemies'] and D['enemies'][slug(e['name'])]['map'] == mk else D['enemies'][mk + '_' + slug(e['name'])]
        for x in en['loot']: lt.append([e['name'], x['item'], x['type'], x['cls'], x['rarity'], x['pct'], x['note']])
        lt.append([e['name'], 'Gold coins', 'Currency', 'Any', '-', 100, f"{GOLD[str(e['tier'])][0]}-{GOLD[str(e['tier'])][1]} gold"])
    sheet('Loot Tables', ['Enemy', 'Item', 'Item type', 'Class', 'Rarity', 'Base drop %', 'Notes'], lt, [26, 26, 9, 9, 8, 10, 80])
    gd = [[e['name'], str(e['tier']), ', '.join(f"{b} ({next(x['label'] for x in bases if x['name'] == b)})" for b in (D['enemies'][slug(e['name'])] if slug(e['name']) in D['enemies'] and D['enemies'][slug(e['name'])]['map'] == mk else D['enemies'][mk + '_' + slug(e['name'])])['pool'])] for e in m['enemies']]
    sheet('Gear Drops', ['Enemy', 'Tier', 'Base pool (one picked per roll; rolls and rarity chances by tier, as on Map 1)'], gd, [26, 6, 140])
    sheet('Item Bases', ['Name', 'Archetype', 'Slot / type'], [[b['name'], b['arch'], b['label']] for b in bases], [26, 16, 26])
    path = os.path.join(ROOT, 'design', f"Cardbound_Map_0{m['num']}_{m['element']}.xlsx"); wb.save(path)
    reports.append(f"Map {m['num']} {m['name']}: {len(m['enemies'])} enemies, {len(bases)} bases, workbook {os.path.basename(path)}")
open(DATA_JS, 'w').write('window.CB_DATA = ' + json.dumps(D) + ';')
print('\n'.join(reports)); print('enemies total', len(D['enemies']), 'bases', len(D['gear']['bases']), 'card picks reused across maps:', sum(1 for c in cards if c['rarity'] != 'Gold') - len([1 for c in cards if (c['cls'], c['name']) in used and c['rarity'] != 'Gold']))
