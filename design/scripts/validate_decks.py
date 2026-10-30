import openpyxl, sys, runpy, re, collections
db, decks_py = sys.argv[1], sys.argv[2]
ws = openpyxl.load_workbook(db, data_only=True)['Card Database']
cards = {}
for r in range(6, ws.max_row+1):
    if ws.cell(r,1).value:
        cards[(ws.cell(r,4).value, ws.cell(r,2).value)] = dict(id=ws.cell(r,1).value, rar=ws.cell(r,5).value, typ=ws.cell(r,6).value, mana=ws.cell(r,9).value)
DECKS = runpy.run_path(decks_py)['DECKS']
names = []
errs = []
for d in DECKS:
    tot = collections.Counter(); main = None
    for n, k in d['cards'].items():
        c = cards.get((d['cls'], n))
        if not c: errs.append(f"{d['cls']} {d['codex']}: missing card '{n}'"); continue
        tot[c['rar']] += k
        if c['rar']=='Gold' and main is None: main = n
    size = sum(d['cards'].values())
    nm = f"{main} - {d['codex']} {d['cls']}"; names.append(nm)
    if tot['Gold']>2 or tot['Blue']>4 or tot['Green']>6 or size<15: errs.append(f"{nm}: limits {dict(tot)} size {size}")
    if size != 20: errs.append(f"{nm}: size {size}")
dupn = [n for n,c in collections.Counter(names).items() if c>1]
refs = set()
for d in DECKS:
    for f in ('strong','counter'):
        for m in re.findall(r"([A-Z][A-Za-z' ]+? - [A-Z][A-Za-z ]+? (?:Warrior|Rogue|Mage|Paladin))", d[f]): refs.add(m.strip())
bad_refs = sorted(r for r in refs if r not in names)
print('decks', len(DECKS), 'errors', len(errs)); print('\n'.join(errs))
print('dup names', dupn); print('bad refs', bad_refs)
print('refs found', len(refs))
