import openpyxl, sys, runpy, re, collections, json
db, sd = sys.argv[1], sys.argv[2]
ws = openpyxl.load_workbook(db, data_only=True)['Card Database']
CATS = runpy.run_path(f'{sd}/categories.py')['CATS']
cards = []
for r in range(6, ws.max_row+1):
    if not ws.cell(r,1).value: continue
    pv = ws.cell(r,50).value or ''
    text = pv.split(' | ',1)[1] if ' | ' in pv else ws.cell(r,3).value
    cards.append(dict(id=ws.cell(r,1).value, name=ws.cell(r,2).value, text=text, cls=ws.cell(r,4).value, rar=ws.cell(r,5).value,
        typ=ws.cell(r,6).value, mana=ws.cell(r,9).value, syn=ws.cell(r,14).value, tgt=ws.cell(r,7).value))
res = {}
for name, grp, dfn, inc, exc in CATS:
    hits = [c for c in cards if re.search(inc, c['text'], re.I) and not (exc and re.search(exc, c['text'], re.I))]
    res[name] = hits
uncat = [c for c in cards if not any(c in v for v in res.values())]
if len(sys.argv) > 3 and sys.argv[3] == 'show':
    for name in sys.argv[4:]:
        print(f'== {name}'); [print('  ', c['cls'][:3], c['name'], '|', c['text'][:110]) for c in res[name]]
else:
    for name,_,_,_,_ in CATS:
        cc = collections.Counter(c['cls'] for c in res[name])
        print(f"{name:32} W{cc['Warrior']:3} R{cc['Rogue']:3} M{cc['Mage']:3} P{cc['Paladin']:3}")
    print('uncategorized', len(uncat)); [print('  ', c['cls'][:3], c['name'], '|', c['text'][:100]) for c in uncat]
json.dump({k:[c['id'] for c in v] for k,v in res.items()}, open(f'{sd}/cat_result.json','w'))
