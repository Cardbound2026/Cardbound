# Builds design/Cardbound_Codex_Test_Decks.xlsx (one sheet per deck + index + how-to) and src/testdecks.js (for Tinker Pip).
# Needs a card dump: node -e "..." > cards.json and codexes.json (see the README line at the bottom). Usage: python3 export_test_decks.py <cards.json> <codexes.json>
import json, sys, os, re
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter
sys.path.insert(0, os.path.dirname(__file__))
from test_decks import DECKS

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
C = json.load(open(sys.argv[1])); X = json.load(open(sys.argv[2]))
CLS_ABBR = {'Warrior': 'WAR', 'Rogue': 'ROG', 'Mage': 'MAG', 'Paladin': 'PAL', 'Warlock': 'WLK'}
CLS_ORDER = ['Warrior', 'Rogue', 'Mage', 'Paladin', 'Warlock']
RAR_ORDER = ['Gold', 'Blue', 'Green', 'White']
RFILL = {'Gold': 'FFF1D6', 'Blue': 'DCEAFB', 'Green': 'DFF2DC', 'White': 'FFFFFF'}
RFONT = {'Gold': 'A86A00', 'Blue': '1F5FAF', 'Green': '2E7D32', 'White': '444444'}
CLSC = {'Warrior': 'B5462F', 'Rogue': '2E7D32', 'Mage': '1F5FAF', 'Paladin': 'A86A00', 'Warlock': '7B4FB8'}
F = 'Arial'
thin = Side(style='thin', color='D0D0D0'); box = Border(left=thin, right=thin, top=thin, bottom=thin)
INPUT = PatternFill('solid', fgColor='FFF59D')

def role(text, typ):
    t = text.lower()
    if typ == 'Power': return 'Engine (Power)'
    if re.search(r'\bdeal|damage equal|as damage', t): return 'Damage'
    if t.startswith('heal'): return 'Healing'
    if re.search(r'poison|bleed|burn|chill|vulnerable|weak|condemn|unwarded|exposure|slow|stun|dazed|dread|rot|fear', t) and not t.startswith('gain'): return 'Debuff / setup'
    if re.search(r'block|barrier|dodge|parry|absorb', t): return 'Defense'
    if re.search(r'mana|regenerat', t): return 'Mana'
    if re.search(r'draw', t): return 'Card draw'
    return 'Utility'

def parse(d):
    out = []
    for part in d['cards'].split(','):
        k, n = part.strip().split('*'); out.append((k, int(n)))
    return out

DK = sorted(DECKS, key=lambda d: (CLS_ORDER.index(X[d['codex']]['cls']), list(X).index(d['codex']), d['n']))
def tab(d): return f"{CLS_ABBR[X[d['codex']]['cls']]} {X[d['codex']]['name']} {d['n']}"
def title(d): x = X[d['codex']]; return f"{x['name']} {x['cls']} {d['n']}"

wb = Workbook()
# ---------------- How to test
hw = wb.active; hw.title = 'How to test'
hw.sheet_view.showGridLines = False
hw.column_dimensions['A'].width = 3; hw.column_dimensions['B'].width = 26; hw.column_dimensions['C'].width = 95
r = 2
hw.cell(r, 2, 'Cardbound: codex test decks').font = Font(name=F, size=18, bold=True); r += 1
hw.cell(r, 2, f'{len(DK)} premade decks: 3 playstyles for each of the 24 codexes. Each deck has its own tab.').font = Font(name=F, size=11, color='555555'); r += 2
steps = [
    ('1. Pick your codexes', 'Your organizer gives you a few codexes (for example 4). Test all 3 decks of each one. The Index tab lists every deck.'),
    ('2. Load the deck', 'In town, walk to Tinker Pip (the test vendor, top right of the square) and open the "Test decks" tab. Switch to the right hero class first, then click "Load deck". It equips the codex and replaces your deck; your old deck goes to your collection.'),
    ('3. Play it', 'Play at least 2 runs with each deck (any map), plus a few rounds on the Training Dummy (bottom right of town) to try the combos.'),
    ('4. Fill in the yellow cells', 'On each deck tab, fill in the yellow Feedback cells under the card list. Ratings are 1 (bad) to 5 (great). The Index tab collects the ratings automatically.'),
    ('5. Send the file back', 'Save the workbook and send it to your organizer.'),
]
for a, b in steps:
    hw.cell(r, 2, a).font = Font(name=F, size=11, bold=True); c = hw.cell(r, 3, b); c.font = Font(name=F, size=11); c.alignment = Alignment(wrap_text=True, vertical='top'); hw.cell(r, 2).alignment = Alignment(vertical='top'); hw.row_dimensions[r].height = 48 if len(b) > 110 else 32; r += 1
r += 1
hw.cell(r, 2, 'Legend').font = Font(name=F, size=12, bold=True); r += 1
c = hw.cell(r, 2, 'Yellow cell'); c.fill = INPUT; c.font = Font(name=F, size=11); c.border = box
hw.cell(r, 3, 'You fill this in. Everything else is the deck and is there to read.').font = Font(name=F, size=11); r += 1
for rar in RAR_ORDER:
    c = hw.cell(r, 2, rar); c.fill = PatternFill('solid', fgColor=RFILL[rar]); c.font = Font(name=F, size=11, bold=True, color=RFONT[rar]); c.border = box
    hw.cell(r, 3, {'Gold': 'Gold cards (max 2 per deck)', 'Blue': 'Blue cards (max 4)', 'Green': 'Green cards (max 6)', 'White': 'White cards (any number)'}[rar]).font = Font(name=F, size=11); r += 1
r += 1
hw.cell(r, 2, 'Example of filled-in feedback').font = Font(name=F, size=12, bold=True); r += 1
for a, b in [('Tester', 'Sam'), ('Runs played', '3 (2 on the Broken March, 1 on the Cinder Reach)'), ('Best result', 'Killed the Warlord once, died on row 11 twice'), ('Fun (1-5)', '4'), ('Power (1-5)', '5'),
             ('Clarity (1-5)', '3'), ('Best card', 'Fan the Flames'), ('Weakest card', 'Ward (never had time to play it)'), ('Anything broken?', 'Combust + Flashpoint ticked 4 times in one turn, felt way too strong.'),
             ('Notes', 'Fun but the first two turns feel slow while Burn builds up.')]:
    hw.cell(r, 2, a).font = Font(name=F, size=10, color='555555'); c = hw.cell(r, 3, b); c.font = Font(name=F, size=10, italic=True, color='555555'); r += 1
r += 1
hw.cell(r, 2, 'Deck rules').font = Font(name=F, size=12, bold=True); r += 1
hw.cell(r, 3, 'Every deck has 22 cards: 2 Gold, 4 Blue, 6 Green and 10 White (the game allows 20 to 30 cards, at most 2 Gold, 4 Blue and 6 Green). Cards are at +0; upgrade them at the Scribe if you want to test higher ranks.').font = Font(name=F, size=11)
hw.cell(r, 3).alignment = Alignment(wrap_text=True); hw.row_dimensions[r].height = 30

# ---------------- Index
ix = wb.create_sheet('Index'); ix.freeze_panes = 'A4'
ix.cell(1, 1, 'Index: every test deck').font = Font(name=F, size=16, bold=True)
ix.cell(2, 1, 'Click a tab name to jump to that deck. Ratings fill in from each deck\'s Feedback cells. Use the Tester column to hand out codexes.').font = Font(name=F, size=10, color='555555')
heads = ['Class', 'Codex', '#', 'Deck', 'Playstyle', 'Codex passive', 'Tab', 'Tester', 'Fun', 'Power', 'Clarity']
widths = [10, 20, 4, 26, 26, 60, 26, 16, 7, 7, 8]
for i, (h, w) in enumerate(zip(heads, widths), 1):
    c = ix.cell(3, i, h); c.font = Font(name=F, size=10, bold=True, color='FFFFFF'); c.fill = PatternFill('solid', fgColor='3A3A3A'); c.alignment = Alignment(horizontal='center', vertical='center'); c.border = box
    ix.column_dimensions[get_column_letter(i)].width = w

FBL = ['Tester', 'Runs played', 'Best result', 'Fun (1-5)', 'Power (1-5)', 'Clarity (1-5)', 'Best card', 'Weakest card', 'Anything broken?', 'Answers to "Test this"', 'Other notes']
FBREF = {}
_unused = [('Tester', 'J5'), ('Runs played', 'J6'), ('Best result', 'J7'), ('Fun (1-5)', 'J8'), ('Power (1-5)', 'J9'), ('Clarity (1-5)', 'J10'), ('Best card', 'J11'), ('Weakest card', 'J12'), ('Anything broken?', 'J13'), ('Answers to "Test this"', 'J14'), ('Other notes', 'J15')]
# ---------------- deck sheets
for d in DK:
    x = X[d['codex']]; cls = x['cls']; t = tab(d)
    ws = wb.create_sheet(t); ws.sheet_view.showGridLines = False
    for col, w in zip('ABCDEFG', [13, 24, 8, 7, 9, 58, 42]): ws.column_dimensions[col].width = w
    ws.cell(1, 1, f"{title(d)}  ·  {d['name']}").font = Font(name=F, size=16, bold=True, color=CLSC[cls])
    ws.cell(2, 1, f"{cls}  ·  {x['name']} codex  ·  Playstyle: {d['style']}").font = Font(name=F, size=11, color='555555')
    c = ws.cell(3, 1, '← back to Index'); c.hyperlink = "#'Index'!A1"; c.font = Font(name=F, size=9, color='1F5FAF', underline='single')
    r = 4
    def block(label, text, h=30):
        global r
        ws.cell(r, 1, label).font = Font(name=F, size=11, bold=True)
        ws.merge_cells(start_row=r, start_column=2, end_row=r, end_column=7)
        c = ws.cell(r, 2, text); c.font = Font(name=F, size=11); c.alignment = Alignment(wrap_text=True, vertical='top'); ws.row_dimensions[r].height = h
        ws.cell(r, 1).alignment = Alignment(vertical='top'); r += 1
    block('Codex', f"{x['name']}: {x['text']}", 30)
    block('Game plan', d['plan'], 44)
    block('How to play', '\n'.join('• ' + s for s in d['tips']), 54)
    block('Test this', '\n'.join('• ' + s for s in d['test']), 40)
    r += 1
    hdr = ['Rarity', 'Card', 'Copies', 'Mana', 'Type', 'What it does', 'Why it is in the deck']
    for i, h in enumerate(hdr, 1):
        c = ws.cell(r, i, h); c.font = Font(name=F, size=10, bold=True, color='FFFFFF'); c.fill = PatternFill('solid', fgColor='3A3A3A'); c.border = box; c.alignment = Alignment(horizontal='center')
    r += 1; first = r
    cards = sorted(parse(d), key=lambda kn: (RAR_ORDER.index(C[kn[0]]['r']), C[kn[0]]['n']))
    for k, n in cards:
        cc = C[k]; rar = cc['r']
        vals = [rar, cc['n'], n, '' if cc['c'] is None else cc['c'], cc['t'], cc['x'], d['why'].get(k, role(cc['x'], cc['t']))]
        for i, v in enumerate(vals, 1):
            c = ws.cell(r, i, v); c.fill = PatternFill('solid', fgColor=RFILL[rar]); c.border = box
            c.font = Font(name=F, size=10, bold=(i in (1, 2)), color=RFONT[rar] if i == 1 else ('555555' if i == 7 and k not in d['why'] else '000000'))
            c.alignment = Alignment(wrap_text=i in (6, 7), vertical='top', horizontal='center' if i in (3, 4) else None)
        ws.row_dimensions[r].height = 28 if len(cc['x']) > 60 or len(vals[6]) > 45 else 15
        r += 1
    ws.cell(r, 2, 'Total cards').font = Font(name=F, size=10, bold=True)
    c = ws.cell(r, 3, f'=SUM(C{first}:C{r - 1})'); c.font = Font(name=F, size=10, bold=True); c.alignment = Alignment(horizontal='center')
    c = ws.cell(r, 4, f'=ROUND(SUMPRODUCT(C{first}:C{r - 1},D{first}:D{r - 1})/C{r},1)'); c.font = Font(name=F, size=10, italic=True); c.alignment = Alignment(horizontal='center')
    ws.cell(r, 5, '← average mana').font = Font(name=F, size=9, color='777777')
    # feedback block under the card list: label in A:B, yellow input merged C:G
    r += 2
    ws.cell(r, 1, 'Feedback').font = Font(name=F, size=13, bold=True); ws.cell(r, 3, 'Fill in the yellow cells. Ratings: 1 = bad, 5 = great.').font = Font(name=F, size=9, color='777777'); r += 1
    FBREF[t] = {}
    for lab in FBL:
        ws.merge_cells(start_row=r, start_column=1, end_row=r, end_column=2)
        c = ws.cell(r, 1, lab); c.font = Font(name=F, size=10, bold=True); c.alignment = Alignment(vertical='top')
        ws.merge_cells(start_row=r, start_column=3, end_row=r, end_column=7)
        c = ws.cell(r, 3); c.fill = INPUT; c.font = Font(name=F, size=10); c.alignment = Alignment(wrap_text=True, vertical='top')
        for col in range(3, 8): ws.cell(r, col).border = box; ws.cell(r, col).fill = INPUT
        ws.row_dimensions[r].height = 42 if lab in ('Anything broken?', 'Answers to "Test this"', 'Other notes') else 16
        FBREF[t][lab] = f'C{r}'; r += 1
    ws.freeze_panes = None

# index rows (after the deck sheets, so the feedback cell addresses are known)
row = 4
for d in DK:
    x = X[d['codex']]; t = tab(d)
    vals = [x['cls'], x['name'], d['n'], d['name'], d['style'], x['text'], t]
    for i, v in enumerate(vals, 1):
        c = ix.cell(row, i, v); c.font = Font(name=F, size=10, bold=(i == 4), color=CLSC[x['cls']] if i == 1 else '000000'); c.border = box
        c.alignment = Alignment(vertical='top', wrap_text=(i == 6), horizontal='center' if i == 3 else None)
    c = ix.cell(row, 7); c.hyperlink = f"#'{t}'!A1"; c.font = Font(name=F, size=10, color='1F5FAF', underline='single')
    for j, lab in ((8, 'Tester'), (9, 'Fun (1-5)'), (10, 'Power (1-5)'), (11, 'Clarity (1-5)')): ref = FBREF[t][lab]; ix.cell(row, j, f"=IF('{t}'!{ref}=\"\",\"\",'{t}'!{ref})")
    for j in range(8, 12): c = ix.cell(row, j); c.font = Font(name=F, size=10); c.border = box; c.alignment = Alignment(horizontal='center', vertical='top')
    ix.row_dimensions[row].height = 28
    row += 1


out = os.path.join(ROOT, 'design', 'Cardbound_Codex_Test_Decks.xlsx'); wb.save(out); print('wrote', out)

# ---------------- for the game (Tinker Pip)
js = [{'id': f"{d['codex']}_{d['n']}", 'codex': d['codex'], 'n': d['n'], 'cls': X[d['codex']]['cls'], 'name': d['name'], 'style': d['style'], 'plan': d['plan'], 'tips': d.get('tips', []), 'why': d.get('why', {}), 'cards': parse(d)} for d in DK]
open(os.path.join(ROOT, 'src', 'testdecks.js'), 'w').write('// premade codex test decks (generated by design/scripts/export_test_decks.py from test_decks.py)\nwindow.CB_TESTDECKS = ' + json.dumps(js) + ';\n')
print('wrote src/testdecks.js', len(js))
