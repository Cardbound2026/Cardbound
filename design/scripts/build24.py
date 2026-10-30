import openpyxl, sys, runpy, re, collections
from openpyxl.styles import Font, Alignment, PatternFill, Border, Side
from openpyxl.utils import get_column_letter
db, sd, out = sys.argv[1], sys.argv[2], sys.argv[3]
ws = openpyxl.load_workbook(db, data_only=True)['Card Database']
cards = {}
for r in range(6, ws.max_row+1):
    if ws.cell(r,1).value:
        pv = ws.cell(r,50).value or ''
        cards[(ws.cell(r,4).value, ws.cell(r,2).value)] = dict(id=ws.cell(r,1).value, rar=ws.cell(r,5).value,
            mana=ws.cell(r,9).value, text=pv.split(' | ',1)[1] if ' | ' in pv else ws.cell(r,3).value)
DECKS = runpy.run_path(f'{sd}/decks.py')['DECKS']
E = runpy.run_path(f'{sd}/decks24.py')['E']
errs = []
F='Arial'; CLS_FILL = {'Warrior':'C0392B','Rogue':'2E7D32','Mage':'1E5AA8','Paladin':'B7860B'}
LIGHT = {'Warrior':'FDECEA','Rogue':'EAF5EA','Mage':'E8F0FD','Paladin':'FDF6E3'}
hdr = Font(name=F, bold=True, color='FFFFFF', size=10); body = Font(name=F, size=10)
wrap = Alignment(wrap_text=True, vertical='top'); thin = Side(style='thin', color='D1D5DB')
deckref = re.compile(r"[A-Z][A-Za-z' ]+? - ([A-Z][A-Za-z ]+? (?:Warrior|Rogue|Mage|Paladin))")
wb = openpyxl.Workbook(); idx = wb.active; idx.title = 'Index'
idx.append(['Cardbound: one showcase deck per codex']); idx['A1'].font = Font(name=F, bold=True, size=16)
idx.append(['Each tab is one deck: cards by rarity with why each is there, game plan, matchups, holes and questions for you. Card text reflects Card Database Draft 8.'])
idx['A2'].font = Font(name=F, italic=True, size=10, color='4B5563'); idx.merge_cells('A2:F2'); idx['A2'].alignment = wrap; idx.row_dimensions[2].height = 30
idx.append([]); idx.append(['Tab','Deck','Class','Codex','Gold cards','Open questions'])
for c in idx[4]: c.font = hdr; c.fill = PatternFill('solid', fgColor='1F2937')
order = {'Gold':0,'Blue':1,'Green':2,'White':3}; caps = {'Gold':2,'Blue':4,'Green':6,'White':None}
for e in E:
    b = DECKS[e['base']]; cls = b['cls']; codex = b['codex']
    deck = e['cards'] or b['cards']
    tot = collections.Counter()
    for n,k in deck.items():
        if (cls,n) not in cards: errs.append(f'{codex}: missing {n}'); continue
        tot[cards[(cls,n)]['rar']] += k
        if n not in e['whys']: errs.append(f'{codex}: no why for {n}')
    if sum(deck.values()) != 20 or tot['Gold']>2 or tot['Blue']>4 or tot['Green']>6: errs.append(f'{codex}: limits {dict(tot)}')
    main = next(n for n in deck if cards[(cls,n)]['rar']=='Gold')
    name = f'{main} - {codex} {cls}'
    tab = f'{cls[:3].upper()} {codex}'[:31]
    sh = wb.create_sheet(tab)
    sh.sheet_properties.tabColor = CLS_FILL[cls]
    for col,w in zip('ABCDE',[26,8,9,60,58]): sh.column_dimensions[col].width = w
    r = 1
    sh.cell(r,1,name).font = Font(name=F, bold=True, size=16); r += 1
    sh.cell(r,1,f'{cls}  ·  {codex} codex  ·  {b["style"]}').font = Font(name=F, italic=True, size=10, color='4B5563'); r += 2
    def label(t):
        global r
        c = sh.cell(r,1,t); c.font = Font(name=F, bold=True, size=12, color=CLS_FILL[cls]); r += 1
    def para(t, h=None):
        global r
        sh.merge_cells(start_row=r, start_column=1, end_row=r, end_column=5)
        c = sh.cell(r,1,t); c.font = body; c.alignment = wrap
        sh.row_dimensions[r].height = h or max(15, 15*(len(t)//150+1)); r += 1
    label('Game plan'); para(e['plan'] or b['plan']); r += 1
    first_card_row = None; copy_rows = []
    for rar in ('Gold','Blue','Green','White'):
        items = sorted([(n,k) for n,k in deck.items() if cards[(cls,n)]['rar']==rar])
        cap = caps[rar]
        label(f'{rar} ({tot[rar]} of {cap})' if cap else f'{rar} ({tot[rar]})')
        for j,h in enumerate(['Card','Copies','Cost','Effect','Why it is in the deck'], start=1):
            c = sh.cell(r,j,h); c.font = hdr; c.fill = PatternFill('solid', fgColor=CLS_FILL[cls])
        r += 1
        for n,k in items:
            c = cards[(cls,n)]
            for j,v in enumerate([n,k,c['mana'],c['text'],e['whys'].get(n,'')], start=1):
                cell = sh.cell(r,j,v); cell.font = body; cell.alignment = wrap; cell.border = Border(bottom=thin)
                cell.fill = PatternFill('solid', fgColor=LIGHT[cls])
            sh.cell(r,1).font = Font(name=F, size=10, bold=True)
            sh.row_dimensions[r].height = 15*max(1, (len(c['text'])//62)+1, (len(e['whys'].get(n,''))//60)+1)
            copy_rows.append(r); r += 1
        r += 1
    sh.cell(r,1,'Total cards').font = Font(name=F, bold=True, size=10)
    sh.cell(r,2,'='+'+'.join(f'B{x}' for x in copy_rows)).font = Font(name=F, bold=True, size=10)
    sh.cell(r,3,'Avg cost').font = Font(name=F, bold=True, size=10)
    sh.cell(r,4,'=ROUND(('+'+'.join(f'B{x}*C{x}' for x in copy_rows)+f')/B{r},1)').font = Font(name=F, bold=True, size=10)
    sh.cell(r,4).alignment = Alignment(horizontal='left'); r += 2
    strip = lambda s: deckref.sub(lambda m: m.group(1), s)
    label('Strong against'); [para('• '+x.strip()) for x in strip(e['strong'] or b['strong']).split(';') if x.strip()]; r += 1
    label('Countered by'); [para('• '+x.strip()) for x in strip(e['counter'] or b['counter']).split(';') if x.strip()]; r += 1
    label('Holes')
    for j,h in enumerate(['#','Type','Hole'], start=1):
        c = sh.cell(r,j,h); c.font = hdr; c.fill = PatternFill('solid', fgColor='1F2937')
    sh.merge_cells(start_row=r, start_column=3, end_row=r, end_column=5); r += 1
    for i,(t,txt) in enumerate(e['holes'], start=1):
        t = 'Fixed' if txt.startswith('Fixed:') else t
        sh.cell(r,1,i).font = body; sh.cell(r,2,t).font = Font(name=F, size=10, bold=True,
            color={'By design':'4B5563','Open':'B45309','Watch':'B91C1C','Fixed':'15803D'}[t])
        sh.merge_cells(start_row=r, start_column=3, end_row=r, end_column=5)
        c = sh.cell(r,3,txt); c.font = body; c.alignment = wrap; sh.row_dimensions[r].height = 15*(len(txt)//120+1); r += 1
    r += 1
    label('Questions for you')
    [para(f'{i}. {q}') for i,q in enumerate(e['questions'], start=1)] if e['questions'] else para('None open for this deck.')
    r += 1
    label('Key gear stats'); para(b['gear'])
    label('PvE notes'); para(b['pve'])
    sh.freeze_panes = 'A4'
    for row in sh.iter_rows():
        for c in row:
            if c.font and c.font.name != F: c.font = Font(name=F, size=c.font.size or 10, bold=c.font.bold, italic=c.font.italic, color=c.font.color)
    nr = idx.max_row + 1
    idx.cell(nr,1,tab).hyperlink = f"#'{tab}'!A1"; idx.cell(nr,1).font = Font(name=F, size=10, color='1D4ED8', underline='single')
    golds = ', '.join(n for n,k in deck.items() if cards[(cls,n)]['rar']=='Gold')
    for j,v in enumerate([name, cls, codex, golds, len(e['questions'])], start=2):
        c = idx.cell(nr,j,v); c.font = body; c.fill = PatternFill('solid', fgColor=LIGHT[cls])
for col,w in zip('ABCDEF',[24,46,10,18,44,14]): idx.column_dimensions[col].width = w
idx.freeze_panes = 'A5'
print('errors:', errs or 'none'); wb.save(out)
