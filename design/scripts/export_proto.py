# Exports Map 1 enemies, gear tables and item layout weights to JSON for the browser prototype.
import runpy, json, sys, ast, re, os
S = os.path.dirname(os.path.abspath(__file__)); out = sys.argv[1]
M = runpy.run_path(S + '/map_physical.py'); G = runpy.run_path(S + '/gear_system.py'); IL = runpy.run_path(S + '/item_layout.py')
src = open(S + '/build_map.py').read()
def grab(name):
    i = src.index(name + '={'); j = i + len(name) + 1; depth = 0
    for k in range(j, len(src)):
        if src[k] == '{': depth += 1
        elif src[k] == '}':
            depth -= 1
            if depth == 0: return ast.literal_eval(src[j:k+1])
TYPE, DMG = grab('TYPE'), grab('DMG')
GOLD = {'1': [5, 10], '2': [10, 20], '3': [20, 35], 'Elite': [60, 100], 'Boss': [250, 400]}
enemies = {}
for e in M['ENEMIES']:
    key = re.sub(r'[^a-z]+', '_', e['name'].lower()).strip('_')
    mx, rg = re.findall(r'\d+', e['mana'])[:2]
    p2 = re.findall(r'\((\d+) in phase 2\)', e['mana']) ; d2 = re.findall(r'\((\d+) in phase 2\)', str(e['draw']))
    deck = []
    for nm, n, cost, kind, text in e['deck']:
        phase2 = nm.startswith('PHASE 2 - ')
        deck.append({'name': nm.replace('PHASE 2 - ', ''), 'n': n, 'cost': cost, 'kind': kind, 'text': text, 'phase2': phase2,
                     'dtype': DMG.get((e['name'], nm), 'Physical')})
    cr, ty, wk = TYPE[e['name']]
    enemies[key] = {'name': e['name'], 'tier': str(e['tier']), 'hp': e['hp'], 'draw': int(re.findall(r'\d+', str(e['draw']))[0]), 'draw2': int(d2[0]) if d2 else None,
                    'maxMana': int(mx), 'regen': int(rg), 'regen2': int(p2[0]) if p2 else None, 'creature': cr, 'type': ty, 'weak': wk,
                    'arch': e.get('arch'), 'desc': e.get('desc'), 'deck': deck, 'gold': GOLD[str(e['tier'])], 'pool': G['POOLS'].get(e['name'], [])}
# gear
stats = {s[0]: {'unit': s[1], 'pts': s[2], 'min': s[3], 'max': s[4]} for s in G['STATS']}
rarity = [{'name': n, 'affixes': a, 'mult': m} for n, a, m in G['RARITY']]
drops = {d[0].split(' ')[0] if d[0].startswith('Tier') else d[0]: d for d in G['DROPS']}
drops = {('1' if k == 'Tier' else k): v for k, v in drops.items()}
DR = {}
for d in G['DROPS']:
    k = {'Tier 1 regular': '1', 'Tier 2 regular': '2', 'Tier 3 regular': '3'}.get(d[0], d[0])
    DR[k] = {'rolls': d[1], 'chance': {'White': d[2], 'Green': d[3], 'Blue': d[4], 'Purple (Epic)': d[5]}}
bases = [{'name': b[0], 'arch': b[1], 'label': b[2]} for b in G['BASES']]
arche = {}
for b in IL['BASES']:
    sw = IL['SLOTW'][b[1]]; tm = IL['TYPES'][b[2]]
    w = {s: round(sw.get(s, 0) * tm.get(s, 1), 3) for s in IL['STATS'] if s != 'Resistance' and sw.get(s, 0) * tm.get(s, 1) > 0}
    arche[b[0]] = {'slot': b[1], 'type': b[2], 'hands': b[3], 'imp2': b[5] or None, 'weights': w}
import openpyxl
loot_path = os.path.join(os.path.dirname(S), 'Cardbound_Map_01_Physical.xlsx')
if os.path.exists(loot_path):
    lw = openpyxl.load_workbook(loot_path, data_only=True)['Loot Tables']
    names = {e['name']: k for k, e in enemies.items()}
    for row in list(lw.iter_rows(values_only=True))[1:]:
        en, item, typ, cls, rar, pct, note = row[:7]
        if en in names and typ != 'Currency':
            enemies[names[en]].setdefault('loot', []).append({'item': item, 'type': typ, 'cls': cls, 'rarity': rar, 'pct': pct, 'note': note})
data = {'enemies': enemies, 'gear': {'stats': stats, 'rarity': rarity, 'drops': DR, 'bases': bases, 'arche': arche, 'resChance': IL['RES_CHANCE'],
        'levelGrowth': G['LEVEL_STEP'], 'implicitMax': 5, 'affixMax': 10, 'twoHand': IL['TWO_HAND_STATS']}}
open(out, 'w').write('window.CB_DATA = ' + json.dumps(data) + ';')
print('enemies', len(enemies), 'bases', len(bases), 'archetypes', len(arche), 'bytes', os.path.getsize(out))
