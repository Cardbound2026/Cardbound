import openpyxl, sys, runpy, collections
from openpyxl.styles import Font, Alignment, PatternFill, Border, Side
from openpyxl.utils import get_column_letter
db, decks_py, out = sys.argv[1], sys.argv[2], sys.argv[3]
ws = openpyxl.load_workbook(db, data_only=True)['Card Database']
cards = {}
for r in range(6, ws.max_row+1):
    if ws.cell(r,1).value:
        pv = ws.cell(r,50).value or ''
        cards[(ws.cell(r,4).value, ws.cell(r,2).value)] = dict(id=ws.cell(r,1).value, rar=ws.cell(r,5).value, typ=ws.cell(r,6).value,
            mana=ws.cell(r,9).value, text=pv.split(' | ',1)[1] if ' | ' in pv else ws.cell(r,3).value, dt=ws.cell(r,8).value)
DECKS = runpy.run_path(decks_py)['DECKS']
RORD = {'Gold':0,'Blue':1,'Green':2,'White':3}
F = 'Arial'
hdr_fill = PatternFill('solid', fgColor='1F2937'); hdr_font = Font(name=F, bold=True, color='FFFFFF', size=10)
body = Font(name=F, size=10); wrap = Alignment(wrap_text=True, vertical='top')
thin = Side(style='thin', color='D1D5DB'); border = Border(bottom=thin)
CLS_FILL = {'Warrior':'FDECEA','Rogue':'EAF5EA','Mage':'E8F0FD','Paladin':'FDF6E3'}
wb = openpyxl.Workbook()
# ---- Read Me
rm = wb.active; rm.title = 'Read Me'
lines = [('Cardbound: Test Decks', Font(name=F, bold=True, size=16)),
 ('Two test decks per codex (48 total), built from Card Database Draft 6 to stress-test the card pools.', Font(name=F, italic=True, size=10, color='4B5563')),
 ('', None),
 ('How to read it', Font(name=F, bold=True, size=12)),
 ('Decks: one row per deck, named MAIN GOLD CARD - CODEX - CLASS, with the full list by rarity, game plan, matchups and gear.', body),
 ('Deck Lists: every card in every deck, one row each, with card ID, copies, type, cost and rules text. Filter by deck name.', body),
 ('Pool Findings: holes found while building, the cards added to fix them, and combos to watch in playtesting.', body),
 ('', None),
 ('Deck rules used', Font(name=F, bold=True, size=12)),
 ('20 cards per deck; at most 2 Gold, 4 Blue and 6 Green cards in total; White unlimited.', body),
 ('Matchups name other test decks: "Strong Against" means this deck is favored; "Countered By" means that deck is favored.', body),
 ('Card Count and Avg Mana on the Decks sheet are formulas over Deck Lists, so editing copies there updates them.', body)]
for i,(t,f) in enumerate(lines, start=1):
    c = rm.cell(i,1,t)
    if f: c.font = f
    c.alignment = Alignment(wrap_text=True, vertical='top')
rm.column_dimensions['A'].width = 110
# ---- Deck Lists
dl = wb.create_sheet('Deck Lists')
H2 = ['Deck Name','Class','Codex','Rarity','Card ID','Card','Copies','Card Type','Mana Cost','Damage Type','Rules Text (base rank)']
dl.append(H2)
names = []
for d in DECKS:
    main = next(n for n in d['cards'] if cards[(d['cls'],n)]['rar']=='Gold')
    nm = f"{main} - {d['codex']} {d['cls']}"; names.append(nm); d['name']=nm
    for n,k in sorted(d['cards'].items(), key=lambda x:(RORD[cards[(d['cls'],x[0])]['rar']], x[0])):
        c = cards[(d['cls'],n)]
        dl.append([nm, d['cls'], d['codex'], c['rar'], c['id'], n, k, c['typ'], c['mana'], c['dt'], c['text']])
nlist = dl.max_row
# ---- Decks overview
dk = wb.create_sheet('Decks', 1)
H = ['#','Deck Name','Class','Codex','Playstyle','Gold (max 2)','Blue (max 4)','Green (max 6)','White','Card Count','Avg Mana Cost','Game Plan','Strong Against','Countered By','Key Gear Stats','PvE Notes']
dk.append(H)
def fmt(d, rar):
    items = [(n,k) for n,k in d['cards'].items() if cards[(d['cls'],n)]['rar']==rar]
    return '\n'.join(f"{n} x{k}" if k>1 else n for n,k in sorted(items))
for i,d in enumerate(DECKS, start=1):
    r = i+1
    dk.append([i, d['name'], d['cls'], d['codex'], d['style'], fmt(d,'Gold'), fmt(d,'Blue'), fmt(d,'Green'), fmt(d,'White'),
        f"=SUMIFS('Deck Lists'!$G$2:$G${nlist},'Deck Lists'!$A$2:$A${nlist},B{r})",
        f"=IFERROR(SUMPRODUCT(('Deck Lists'!$A$2:$A${nlist}=B{r})*'Deck Lists'!$G$2:$G${nlist}*'Deck Lists'!$I$2:$I${nlist})/J{r},0)",
        d['plan'], d['strong'].replace('; ', ';\n'), d['counter'].replace('; ', ';\n'), d['gear'], d['pve']])
# ---- Pool Findings
pf = wb.create_sheet('Pool Findings')
pf.append(['Type','Class','Codex','Finding','Action / Card Added','Card ID'])
idof = lambda cls,n: cards[(cls,n)]['id']
rows = [
 ('Hole patched','Rogue','Saboteur','Disruption decks had no damage payoff, so they could not close fights.','Added Kick While Down (Green): damage per card the target discarded or exhausted this round.', idof('Rogue','Kick While Down')),
 ('Hole patched','Mage','Entropy','Mana-burn decks drained mana but had no win condition.','Added Void Lance (Green): damage scales with mana the target is missing.', idof('Mage','Void Lance')),
 ('Hole patched','Mage','Barrier Savant','Mana Shell and mana-banking decks had no mana payoff below Gold.','Added Arcane Overflow (Blue): spend all mana as AoE damage at 50%.', idof('Mage','Arcane Overflow')),
 ('Hole patched','Paladin','Purifier','Purifier wants many debuff types, but Paladin had no Vulnerable source.','Added Mark of Guilt (White): Holy damage plus 10 Vulnerable.', idof('Paladin','Mark of Guilt')),
 ('Hole patched','Paladin','Equilibrium','Solo Equilibrium could not deal damage at full HP (heals must be effective).','Added Sacrificial Light (Green): lose 10 HP, next heal doubled.', idof('Paladin','Sacrificial Light')),
 ('Renamed','Mage','Various','Four Mage card names clashed with keyword or status-card names.','Living Bomb -> Arm Living Bomb; Hex -> Hexing Word; Slow -> Temporal Drag; Exposure -> Lay Bare.',''),
 ('By design','Warrior','Bulwark / Bastion of Faith / Barrier Savant','Tanks lose to Poison, debuffs and block shred.','Kept: these are the intended counters.',''),
 ('By design','Warrior / Rogue','Riposte / Phantom','Counter decks do nothing against enemies that never attack.','Kept: casters and damage-over-time decks are the counter.',''),
 ('By design','All','Colossus / Heart of Winter / Mana Shell','Mana-banking decks collapse against mana burn.','Kept: Entropy and Saboteur are the counter.',''),
 ('By design','All','Bloodbound / Equilibrium','Healing builds fold to anti-heal (Mortal Strike, Wound Poison, Brand of Sin).','Kept: every class now has at least one anti-heal card.',''),
 ('Balance watch','Warrior','Colossus','Double Strike repeats the first result, so Double Strike + Limit Break doubles a full mana dump.','Playtest first; consider excluding mana-dump cards from replay.',''),
 ('Balance watch','Warrior','Sunderer','Thousand Cuts at 1 hit per 5 mana with flat Strength (e.g. 10 hits x 16 = 160).','Can move to 1 hit per 7 or 10 mana if too strong.',''),
 ('Balance watch','Mage','Barrier Savant','Mana Shell has no mana cap; with Arcane Reservoir and Arcane Overflow it can scale without limit.','Consider a cap (e.g. 3x max mana) after playtesting.',''),
 ('Balance watch','Rogue','Venomancer','Plague Bloom adds 5 Poison per 10 already on the target; with Accelerant Venom and Virulence this grows very fast.','Check boss fights at 20+ turns.',''),
 ('Balance watch','Rogue','Bloodletter','Exsanguinate deals 5x Bleed stacks and Shadow Echo can replay it.','Check the replay interaction.',''),
 ('Balance watch','Mage','Spellstorm','Open the Floodgates makes a full hand free; with Foresight that can be 10+ spells.','It Exhausts; check total damage per fight.',''),
 ('Open','Mage','Archmage','Basic spells (Fireball, Frostbolt, Arcane Missiles, Arcane Bolt) are placeholders.','Replace with the designer\'s versions; Elemental Memory depends on their secondary effects.',''),
 ('Open','All','All','Card values for upgrade ranks (+1 to +10) are not set.','Propose a growth rate per rarity.',''),
]
for r in rows: pf.append(list(r))
# ---- styling
def style(sheet, widths, wrap_cols, cls_col=None, freeze='C2'):
    for j,h in enumerate(sheet[1], start=1):
        h.font = hdr_font; h.fill = hdr_fill; h.alignment = Alignment(wrap_text=True, vertical='center')
    for row in sheet.iter_rows(min_row=2):
        for c in row:
            c.font = body; c.alignment = wrap if c.column in wrap_cols else Alignment(vertical='top'); c.border = border
        if cls_col:
            cl = row[cls_col-1].value
            for c in row: c.fill = PatternFill('solid', fgColor=CLS_FILL.get(cl,'FFFFFF'))
    for j,w in enumerate(widths, start=1): sheet.column_dimensions[get_column_letter(j)].width = w
    sheet.freeze_panes = freeze; sheet.auto_filter.ref = sheet.dimensions
    sheet.row_dimensions[1].height = 30
style(dk, [4,44,9,17,30,24,24,24,24,8,9,48,48,48,30,40], set(range(5,17)), cls_col=3)
for r in range(2, dk.max_row+1): dk.cell(r,11).number_format = '0.0'
style(dl, [44,9,17,8,10,26,7,9,8,12,70], {11}, cls_col=2)
style(pf, [14,12,24,60,60,10], {3,4,5}, freeze='A2')
wb.move_sheet('Decks', offset=-0)
wb.save(out); print('decks', len(DECKS), 'list rows', nlist-1)
