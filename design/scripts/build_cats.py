import openpyxl, sys, runpy, re, collections
from openpyxl.styles import Font, Alignment, PatternFill, Border, Side
db, sd, out = sys.argv[1], sys.argv[2], sys.argv[3]
ws = openpyxl.load_workbook(db, data_only=True)['Card Database']
CATS = runpy.run_path(f'{sd}/categories.py')['CATS']
cards=[]
for r in range(6, ws.max_row+1):
    if not ws.cell(r,1).value: continue
    pv = ws.cell(r,50).value or ''
    cards.append(dict(id=ws.cell(r,1).value, name=ws.cell(r,2).value, text=pv.split(' | ',1)[1] if ' | ' in pv else ws.cell(r,3).value,
        cls=ws.cell(r,4).value, rar=ws.cell(r,5).value, typ=ws.cell(r,6).value, mana=ws.cell(r,9).value, syn=ws.cell(r,14).value))
CLS=['Warrior','Rogue','Mage','Paladin']; RO={'White':0,'Green':1,'Blue':2,'Gold':3}
F='Arial'; hdr=Font(name=F,bold=True,color='FFFFFF',size=10); body=Font(name=F,size=10)
LIGHT={'Warrior':'FDECEA','Rogue':'EAF5EA','Mage':'E8F0FD','Paladin':'FDF6E3'}
GRP={'Debuff / disruption':'7F1D1D','Damage over time':'9A3412','Buff / resource':'1E3A8A','Buff / combat':'1E40AF','Defense / sustain':'065F46','Damage':'7C2D12','Class mechanic':'581C87','Cost / payoff':'374151'}
wb=openpyxl.Workbook(); sm=wb.active; sm.title='Summary'
fd=wb.create_sheet('Findings')
res={}
for name,grp,dfn,inc,exc in CATS:
    hits=[c for c in cards if re.search(inc,c['text'],re.I) and not (exc and re.search(exc,c['text'],re.I))]
    hits.sort(key=lambda c:(CLS.index(c['cls']),RO[c['rar']],c['name'])); res[name]=hits
    t=wb.create_sheet(name[:31]); t.sheet_properties.tabColor=GRP[grp]
    t['A1']=name; t['A1'].font=Font(name=F,bold=True,size=14)
    t['A2']=f'{grp}: {dfn}'; t['A2'].font=Font(name=F,italic=True,size=10,color='4B5563')
    t.append([]); t.append(['Class','Card ID','Card','Rarity','Type','Cost','Codex Synergy','Rules Text (base rank)'])
    for c in t[4]: c.font=hdr; c.fill=PatternFill('solid',fgColor=GRP[grp])
    for c in hits:
        t.append([c['cls'],c['id'],c['name'],c['rar'],c['typ'],c['mana'],c['syn'],c['text']])
        for cell in t[t.max_row]: cell.font=body; cell.alignment=Alignment(wrap_text=True,vertical='top'); cell.fill=PatternFill('solid',fgColor=LIGHT[c['cls']])
    for col,w in zip('ABCDEFGH',[10,10,24,8,8,6,28,80]): t.column_dimensions[col].width=w
    t.freeze_panes='A5'; t.auto_filter.ref=f'A4:H{max(5,t.max_row)}'
# Summary
sm['A1']='Cardbound: card effects by category'; sm['A1'].font=Font(name=F,bold=True,size=16)
sm['A2']=f'All {len(cards)} cards in Card Database Draft 9, tagged by what they do. A card can appear in several categories. Counts are formulas over each tab; click a category to open it.'
sm['A2'].font=Font(name=F,italic=True,size=10,color='4B5563'); sm.merge_cells('A2:I2'); sm['A2'].alignment=Alignment(wrap_text=True); sm.row_dimensions[2].height=28
sm.append([]); sm.append(['Category','Group','What it covers','Warrior','Rogue','Mage','Paladin','Total','Classes with none'])
for c in sm[4]: c.font=hdr; c.fill=PatternFill('solid',fgColor='1F2937'); c.alignment=Alignment(wrap_text=True,vertical='center')
for name,grp,dfn,_,_ in CATS:
    r=sm.max_row+1; tab=name[:31]; last=max(5, 4+len(res[name]))
    rng=f"'{tab}'!$A$5:$A${last}"
    cc=collections.Counter(c['cls'] for c in res[name]); none=', '.join(k for k in CLS if cc[k]==0)
    sm.append([name,grp,dfn]+[f'=COUNTIF({rng},"{k}")' for k in CLS]+[f'=SUM(D{r}:G{r})', none or '-'])
    sm.cell(r,1).hyperlink=f"#'{tab}'!A1"; sm.cell(r,1).font=Font(name=F,size=10,color='1D4ED8',underline='single')
    for j in range(2,10): sm.cell(r,j).font=body; sm.cell(r,j).alignment=Alignment(wrap_text=True,vertical='top')
    sm.cell(r,2).font=Font(name=F,size=10,bold=True,color=GRP[grp])
    if none: sm.cell(r,9).font=Font(name=F,size=10,color='B91C1C',bold=True)
    for j in range(4,8): sm.cell(r,j).alignment=Alignment(horizontal='center',vertical='top')
for col,w in zip('ABCDEFGHI',[30,18,52,9,9,9,9,8,26]): sm.column_dimensions[col].width=w
sm.freeze_panes='B5'; sm.auto_filter.ref=f'A4:I{sm.max_row}'
# Findings
cnt=lambda n,k: sum(1 for c in res[n] if c['cls']==k)
FIND=[
('Draft 9 gap check',None),
('How to read this','Every gap from the previous review was filled in Draft 9. The Summary "Classes with none" column now only lists class-identity mechanics.'),
('Draw Block',f"Now in every class (W {cnt('Draw Block','Warrior')}, R {cnt('Draw Block','Rogue')}, M {cnt('Draw Block','Mage')}, P {cnt('Draw Block','Paladin')}): a Green and a Gold each, with self-harm, mana or card tradeoffs."),
('Block Shred and Steal',f"Now in every class (W {cnt('Block Shred and Steal','Warrior')}, R {cnt('Block Shred and Steal','Rogue')}, M {cnt('Block Shred and Steal','Mage')}, P {cnt('Block Shred and Steal','Paladin')}). Steals: Plunder Armor, Purloined Guard (as Dodge), Confiscate (as Barrier)."),
('Block Bypass','Mage (Piercing Arcana) and Paladin (Pierce the Veil): 1 turn of Skills ignoring all Defense.'),
('Unwarded','New magic-damage Vulnerable for Mage and Paladin. Vulnerable stays the physical version.'),
('Buff Removal and Steal',f"Now in every class (W {cnt('Buff Removal and Steal','Warrior')}, R {cnt('Buff Removal and Steal','Rogue')}, M {cnt('Buff Removal and Steal','Mage')}, P {cnt('Buff Removal and Steal','Paladin')}), each with its own twist (lose your Block, lose HP, discard, gain a Dazed, or deal damage per buff)."),
('Remaining one-class effects',None),
('By design','Poison (Rogue), Chill (Mage), Condemnation, Devotion, Shurikens, Blood Debt, Parry triggers, Taunt (Warrior and Paladin).'),
('Questions for you',None),
('1',"Unwarded halves at the end of the target's turn, like Vulnerable. OK, or should magic debuffs last longer?"),
('2','Does Unwarded boost Holy damage? (Assumed yes: it is "all non-Physical".)'),
('3',"Block steal converts into the stealer's own defense (Dodge for Rogue, Barrier for Paladin). Keep it that way?"),
]
fd['A1']='Findings'; fd['A1'].font=Font(name=F,bold=True,size=16); r=3
for a,b in FIND:
    if b is None:
        r+=1; fd.cell(r,1,a).font=Font(name=F,bold=True,size=12); r+=1; continue
    fd.cell(r,1,a).font=Font(name=F,bold=True,size=10); c=fd.cell(r,2,b); c.font=body; c.alignment=Alignment(wrap_text=True,vertical='top')
    fd.cell(r,1).alignment=Alignment(wrap_text=True,vertical='top'); r+=1
fd.column_dimensions['A'].width=34; fd.column_dimensions['B'].width=110
wb.save(out); print('tabs', len(wb.sheetnames))
