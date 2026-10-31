# Coverage pass: every playable card should be a named drop somewhere. Cards missing from all loot tables get a slot on
# one enemy: themed map by the card's element/keywords, tier by rarity, the least-loaded enemy there.
# Re-run after export_maps.py (which rebuilds maps 2-6). Usage: python3 fill_loot.py <cards.json from the engine>
import json, sys, os, re
import openpyxl
from copy import copy
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
DJ = os.path.join(ROOT, 'src', 'data.js')
src = open(DJ).read(); D = json.loads(src[src.index('{'):src.rindex('}') + 1])
C = json.load(open(sys.argv[1]))
have = {(x['cls'], x['item']) for e in D['enemies'].values() for x in e.get('loot', []) if x.get('type') == 'Card'}
missing = [c for c in C.values() if (c['cls'], c['n']) not in have]
# conventions already used in the tables: tier -> drop % by rarity
SLOT = {'White': [('1', 5), ('2', 5)], 'Green': [('2', 2), ('3', 2)], 'Blue': [('3', 1), ('Elite', 2)], 'Gold': [('Elite', 1.5), ('Boss', 3)]}
def theme(c):
    t = (c['dt'] + ' ' + c['x']).lower()
    for mk, pat in [('fire', r'fire|burn'), ('frost', r'frost|chill|freeze'), ('nature', r'poison|nature|venom'), ('arcane', r'arcane|mana'), ('shadow', r'shadow|stealth|bleed|blood')]:
        if re.search(pat, t): return mk
    return None
load = {}
for k, e in D['enemies'].items(): load[k] = sum(1 for x in e.get('loot', []) if x.get('type') == 'Card')
added = []
for c in sorted(missing, key=lambda c: (c['cls'], c['r'], c['n'])):
    mk = theme(c); best = None
    for tier, pct in SLOT[c['r']]:
        for k, e in D['enemies'].items():
            if e.get('map') in (None, 'town') or e['tier'] != tier: continue
            same_cls = sum(1 for x in e.get('loot', []) if x.get('type') == 'Card' and x['cls'] == c['cls'])
            score = (0 if (mk is None or e['map'] == mk) else 10) + same_cls * 3 + load[k] * 4
            if best is None or score < best[0]: best = (score, k, pct)
    _, k, pct = best; e = D['enemies'][k]
    e.setdefault('loot', []).append({'item': c['n'], 'type': 'Card', 'cls': c['cls'], 'rarity': c['r'], 'pct': pct, 'note': c['x']})
    load[k] += 1; added.append((e['map'], e['name'], e['tier'], c['cls'], c['r'], c['n'], pct, c['x']))
open(DJ, 'w').write('window.CB_DATA = ' + json.dumps(D) + ';\n')
# mirror into the map workbooks (Loot Tables sheet), right after that enemy's rows
WB = {m['key']: os.path.join(ROOT, 'design', f"Cardbound_Map_0{m['num']}_{m['element']}.xlsx") for m in D['maps'].values()}
by_map = {}
for a in added: by_map.setdefault(a[0], []).append(a)
for mk, rows in by_map.items():
    f = WB.get(mk)
    if not f or not os.path.exists(f): continue
    wb = openpyxl.load_workbook(f); ws = wb['Loot Tables']
    for (_, ename, tier, cls, rar, name, pct, text) in rows:
        last = max((r for r in range(2, ws.max_row + 1) if ws.cell(r, 1).value == ename), default=ws.max_row)
        # keep cards before the enemy's gold/currency row
        while last > 1 and ws.cell(last, 3).value != 'Card' and ws.cell(last - 1, 1).value == ename: last -= 1
        ws.insert_rows(last + 1)
        for col, v in enumerate([ename, name, 'Card', cls, rar, pct, text + '  (added: coverage pass)'], 1):
            cell = ws.cell(last + 1, col, v); src_c = ws.cell(last, col)
            if src_c.has_style: cell.font = copy(src_c.font); cell.fill = copy(src_c.fill); cell.border = copy(src_c.border); cell.alignment = copy(src_c.alignment); cell.number_format = src_c.number_format
    wb.save(f)
print(f'{len(missing)} cards had no named drop; added {len(added)} loot entries')
for a in added: print('  ', a[0].ljust(8), a[2].ljust(5), a[1][:28].ljust(28), a[3].ljust(8), a[4].ljust(6), a[5], f'{a[6]}%')
