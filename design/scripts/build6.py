import openpyxl, sys, copy, runpy, collections
from openpyxl.formula.translate import Translator
from openpyxl.styles import Alignment, Font
src, out, sd = sys.argv[1], sys.argv[2], sys.argv[3]
wb = openpyxl.load_workbook(src); ws = wb['Card Database']
last = int(ws.tables['CardScalingDatabase'].ref.split(':')[1][2:])
NIN, PREV = 49, range(50,56)
base = {c: ws.cell(6,c).value for c in PREV}
sty = {c: ws.cell(6,c)._style for c in range(1,56)}
rows = [[ws.cell(r,c).value for c in range(1,NIN+1)] for r in range(6,last+1)]
POOL = {'White':'No limit','Green':'Green pool: 6 per deck','Blue':'Blue pool: 4 per deck','Gold':'Gold pool: 2 per deck'}
PFX = {'Rogue':'ROG','Mage':'MAG','Paladin':'PAL'}
pat = runpy.run_path(f'{sd}/pool_patches.py')
def mk(cls, t, note_default):
    name, rar, typ, tgt, dt, mana, exh, ret, syn, tags, text, toks = t[:12]
    note = t[12] if len(t) > 12 else None
    name = pat['RENAMES'].get((cls, name), name)
    r=[None]*NIN
    r[1]=name; r[2]=text; r[3]=cls; r[4]=rar; r[5]=typ; r[6]=tgt; r[7]=dt; r[8]=mana
    r[9]='No'; r[10]=exh; r[11]=ret; r[12]=POOL[rar]; r[13]=syn; r[14]=tags; r[15]='Draft'
    r[16]=note_default + (' ' + note if note else '')
    for (tc,sc,bc),(tok,lab,b) in zip([(18,19,20),(26,27,28),(34,35,36),(42,43,44)], toks):
        r[tc-1]=tok; r[sc-1]=lab; r[bc-1]=b
    return r
added = collections.Counter()
for cls, fname in (('Rogue','rogue_cards.py'),('Mage','mage_cards.py'),('Paladin','paladin_cards.py')):
    cards = runpy.run_path(f'{sd}/{fname}')['CARDS']
    new = [mk(cls, t, 'New in Draft 6 (first pass). Codex Synergy is affinity, not ownership.') for t in cards]
    new += [mk(cls, t, 'New in Draft 6.') for t in pat['PATCHES'][cls]]
    ids = [r[0] for r in rows]
    p = PFX[cls]
    nxt = max(int(x[4:]) for x in ids if x.startswith(p)) + 1
    for k, r in enumerate(new): r[0] = f'{p}-{nxt+k:04d}'
    pos = max(i for i,x in enumerate(ids) if x.startswith(p)) + 1
    rows = rows[:pos] + new + rows[pos:]
    added[cls] = len(new)
# duplicate-name check across the whole database
names = collections.Counter(r[1] for r in rows)
dups = [n for n,c in names.items() if c>1]
nlast = 5 + len(rows)
for k, vals in enumerate(rows):
    r = 6 + k
    for c in range(1, NIN+1): ws.cell(r,c).value = vals[c-1]
    for c in PREV: ws.cell(r,c).value = Translator(base[c], origin=ws.cell(6,c).coordinate).translate_formula(ws.cell(r,c).coordinate)
    for c in range(1,56): ws.cell(r,c)._style = copy.copy(sty[c])
    ws.cell(r,17).alignment = Alignment(wrap_text=True, vertical='top'); ws.row_dimensions[r].height = 42
ws.tables['CardScalingDatabase'].ref = f'A5:BC{nlast}'
s = wb['Review Notes']; start = s.max_row + 2
lines = [('Draft 6: Rogue, Mage and Paladin card pools','h'),
 (f"Added {added['Rogue']} Rogue, {added['Mage']} Mage and {added['Paladin']} Paladin cards, following the Warrior rules (power budget per rarity, hybrid premium, full utility toolkit per class, codex affinity not ownership).",None),
 ("Mage basic spells (Fireball, Frostbolt, Arcane Missiles, Arcane Bolt) are placeholders until the designer supplies final versions.",None),
 ("Cards whose Design Notes start with 'Added after deck testing' fill holes found while building the 48 test decks (see the Test Decks workbook).",None),
 ("Renamed to avoid clashing with keywords: Living Bomb card -> Arm Living Bomb; Hex card -> Hexing Word; Slow card -> Temporal Drag; Exposure card -> Lay Bare.",None)]
for i,(t,k) in enumerate(lines):
    c = s.cell(start+i,1,t); c.font = Font(name='Aptos', bold=(k=='h'), size=12 if k=='h' else 11); c.alignment = Alignment(wrap_text=True, vertical='top')
wb.save(out)
print(dict(added), 'rows', len(rows), 'dups', dups)
