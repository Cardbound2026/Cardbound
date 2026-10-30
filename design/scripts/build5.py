import openpyxl, sys, copy, runpy
from openpyxl.formula.translate import Translator
from openpyxl.styles import Font, Alignment
src, out, cards_py = sys.argv[1], sys.argv[2], sys.argv[3]
CARDS = runpy.run_path(cards_py)['CARDS']
wb = openpyxl.load_workbook(src); ws = wb['Card Database']
NCOL_IN = 49  # A..AW inputs
PREV = range(50, 56)  # AX..BC formulas
base_formulas = {c: ws.cell(6, c).value for c in PREV}
styles = {c: (copy.copy(ws.cell(6,c).font), copy.copy(ws.cell(6,c).fill), copy.copy(ws.cell(6,c).border),
              copy.copy(ws.cell(6,c).alignment), ws.cell(6,c).number_format) for c in range(1,56)}
old = [[ws.cell(r,c).value for c in range(1, NCOL_IN+1)] for r in range(6, 126)]
POOL = {'White':'No limit','Green':'Green pool: 6 per deck','Blue':'Blue pool: 4 per deck','Gold':'Gold pool: 2 per deck'}
new = []
for i, (name, rar, typ, tgt, dt, mana, exh, ret, syn, tags, text, toks) in enumerate(CARDS, start=31):
    row = [None]*NCOL_IN
    row[0]=f'WAR-{i:04d}'; row[1]=name; row[2]=text; row[3]='Warrior'; row[4]=rar; row[5]=typ; row[6]=tgt; row[7]=dt
    row[8]=mana; row[9]='No'; row[10]=exh; row[11]=ret; row[12]=POOL[rar]; row[13]=syn; row[14]=tags; row[15]='Draft'
    row[16]='New in Draft 5 (first-pass values). Codex Synergy is affinity, not ownership.'
    for (tc, sc, bc), (tok, lab, b) in zip([(18,19,20),(26,27,28),(34,35,36),(42,43,44)], toks):
        row[tc-1]=tok; row[sc-1]=lab; row[bc-1]=b
    new.append(row)
for row in old: row[12] = POOL.get(row[4], row[12])
rows = old[:30] + new + old[30:]
last = 5 + len(rows)
for idx, vals in enumerate(rows):
    r = 6 + idx
    for c in range(1, NCOL_IN+1):
        ws.cell(r, c).value = vals[c-1]
    for c in PREV:
        ws.cell(r, c).value = Translator(base_formulas[c], origin=ws.cell(6,c).coordinate).translate_formula(ws.cell(r,c).coordinate)
    for c in range(1, 56):
        f, fi, b, a, nf = styles[c]
        cell = ws.cell(r, c); cell.font = copy.copy(f); cell.fill = copy.copy(fi); cell.border = copy.copy(b); cell.alignment = copy.copy(a); cell.number_format = nf
    ws.cell(r,17).alignment = Alignment(wrap_text=True, vertical='top')
    ws.row_dimensions[r].height = 42
ws.tables['CardScalingDatabase'].ref = f'A5:BC{last}'
# Review Notes
s = wb['Review Notes']
start = s.max_row + 2
add = [
 ('Draft 5: Warrior card pool', 'h'),
 (f'{len(new)} new Warrior cards (WAR-0031 to WAR-{30+len(new):04d}): 26 White, 20 Green, 16 Blue, 2 generic Gold. Warrior now has {30+len(new)} cards.', None),
 ('Deck Limit now shows rarity pools: at most 2 Gold, 4 Blue and 6 Green cards per deck in total; White unlimited. Decks are 15 to 99 cards.', None),
 ('Power budget used: White about 10 value per 10 mana; Green about 1.25-1.5x; Blue about 1.5-2x. Hybrid cards get a small premium (Shield Bash: 5 damage + 6 Block for 10 mana).', None),
 ("Codex Synergy lists which playstyles a card suits best. It is affinity, not ownership: any Warrior card works in any deck.", None),
]
for i,(t,k) in enumerate(add):
    c = s.cell(start+i, 1, t); c.font = Font(name='Aptos', bold=(k=='h'), size=12 if k=='h' else 11); c.alignment = Alignment(wrap_text=True, vertical='top')
wb.save(out)
print('rows', len(rows), 'last', last)
