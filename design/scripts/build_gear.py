import openpyxl, sys, runpy, collections
from openpyxl.styles import Font, Alignment, PatternFill, Border, Side
from openpyxl.worksheet.datavalidation import DataValidation
from openpyxl.utils import get_column_letter as L
gp, out = sys.argv[1], sys.argv[2]
G = runpy.run_path(gp)
F='Arial'; hdr=Font(name=F,bold=True,color='FFFFFF',size=10); body=Font(name=F,size=10); bold=Font(name=F,bold=True,size=10)
inp=Font(name=F,size=10,color='0000FF'); yellow=PatternFill('solid',fgColor='FFFF00'); wrap=Alignment(wrap_text=True,vertical='top')
RF={'White':'F3F4F6','Green':'DCFCE7','Blue':'DBEAFE','Purple (Epic)':'EDE9FE'}
def head(sh,row,cols,c0=1,color='1F2937'):
    for j,h in enumerate(cols,start=c0):
        c=sh.cell(row,j,h); c.font=hdr; c.fill=PatternFill('solid',fgColor=color); c.alignment=Alignment(wrap_text=True,vertical='center')
wb=openpyxl.Workbook()
# ---------- Rules
ru=wb.active; ru.title='Rules'
T=[('Cardbound: Gear System (first pass)','t'),('Lots of gear drops; most of it is meant to be vendor fodder. The chase is the right base, at the right rarity, with the right rolls, at a high item level.','i'),('',None),
('Rarity','h'),('White: 1 affix. Green: 2 affixes. Blue: 3 affixes. Purple (Epic): 4 affixes. Higher rarities also roll higher (x1.1 / x1.2 / x1.3 on every range).',None),
('Every item also has its map implicit: on the Physical map that is Fire Resistance (1-5% on a White item at +0).',None),('',None),
('Item level (ilvl), 0 to 100','h'),('Item points = the total points rolled on the item. Each stat has a points-per-unit weight (Stamina 1, Strength 2, Resistance 1 per %, and so on) so every affix is worth up to 10 points on a White item at map +0. Item level = 5 x the map level it dropped on + up to 5 for how close its points come to a perfect Purple from that level. A perfect Purple from +19 is item level 100.',None),
('Example: a White Ember-Warded Ring from +0 with 3% Fire Resistance and 6 Stamina is 9 points, item level 1. The same ring from a +10 map is item level 51; a perfect Purple from +10 is 55.',None),('',None),
('Map level','h'),('Every map level multiplies every roll range by 1.2, floor and ceiling together (+5 is about 2.5x, +10 about 6x, +19 about 32x). Enemies grow faster: x1.5 HP and x1.3 damage per level. Gear from +1 is what makes +2 possible.',None),('',None),
('Drops','h'),('Each kill makes several independent gear rolls (2 for regulars), so multiple items can drop. Each roll picks a rarity using the Drop Rates tab and a base from that enemy\'s base pool. Each base drops from 3 or 4 different enemies on its map.',None),
('Purple items drop only from elites and bosses. Luck raises every chance.',None),('',None),
('Tabs','h'),('Settings: pick a map level; every range in the workbook updates. Affixes: every stat with its weight, allowed slots and its live range per rarity. Item Level Calculator: enter rolls and get the ilvl and a range check. Drop Rates: chances per enemy group and expected items per kill. Map 1 Bases: the 38 Map 1 bases, the archetype each one uses, and which enemies drop them.',None),
('Blue text is an input you can change; yellow cells are the key assumptions.',None),('',None),
('Questions for you','h'),('1. Purple (Epic) drops only from elites and bosses: OK?',None),
('2. Amulets: should the draw / regen point pool grow with rarity (e.g. White 3-4 points up to Purple 6-7)?',None),
('3. Selling: should every item sell to a vendor for gold (a gold source to balance the Auction House sinks)?',None)]
for i,(t,k) in enumerate(T,start=1):
    c=ru.cell(i,1,t); c.alignment=wrap; c.font={'t':Font(name=F,bold=True,size=16),'i':Font(name=F,italic=True,size=10,color='4B5563'),'h':Font(name=F,bold=True,size=12)}.get(k,body)
ru.column_dimensions['A'].width=120
# ---------- Settings
st=wb.create_sheet('Settings')
st['A1']='Settings'; st['A1'].font=Font(name=F,bold=True,size=14)
st['A3']='Map level (0 = base map)'; st['B3']=0; st['B3'].font=inp; st['B3'].fill=yellow
st['A4']='Range growth per map level (multiplier)'; st['B4']=G['LEVEL_STEP']; st['B4'].font=inp; st['B4'].fill=yellow; st['B4'].number_format='0.00'
st['A5']='Level multiplier'; st['B5']='=B4^B3'; st['B5'].number_format='0.00'
st['A6']='Max points per affix (White, +0)'; st['B6']=10; st['B6'].font=inp
st['A7']='Max implicit points (White, +0)'; st['B7']=5; st['B7'].font=inp
st['A8']='Highest map level (item level 100 lives here)'; st['B8']=G['MAX_MAP_LEVEL']; st['B8'].font=inp; st['B8'].fill=yellow
st['A16']='Max points of a perfect Purple at this map level'; st['B16']='=D13'; st['B16'].number_format='0.0'
head(st,9,['Rarity','Affixes','Roll multiplier','Max points at this map level','Max item level (0-100)'])
for i,(n,a,m) in enumerate(G['RARITY']):
    r=10+i; st.cell(r,1,n); st.cell(r,2,a).font=inp; st.cell(r,3,m).font=inp
    st.cell(r,4,f'=ROUND(($B$7+B{r}*$B$6)*C{r}*$B$5,0)')
    st.cell(r,5,f'=MIN(100,ROUND(5*$B$3+5*D{r}/$B$16,0))')
    for j in range(1,6): st.cell(r,j).fill=PatternFill('solid',fgColor=RF[n])
st.column_dimensions['A'].width=44
for c in 'BCDE': st.column_dimensions[c].width=16
st['A15']='Max points use the best roll on the implicit and every affix. A typical drop lands well below it.'; st['A15'].font=Font(name=F,italic=True,size=9,color='4B5563')
# ---------- Affixes
af=wb.create_sheet('Affixes')
cols=['Stat','Unit','Points per unit','Base min (White, +0)','Base max (White, +0)','Allowed slots']
for n,_,_ in G['RARITY']: cols+= [f'{n} min', f'{n} max']
head(af,1,cols)
for i,(s,u,p,mn,mx,slots) in enumerate(G['STATS']):
    r=2+i; af.cell(r,1,s); af.cell(r,2,u); af.cell(r,3,p).font=inp; af.cell(r,4,mn).font=inp; af.cell(r,5,mx).font=inp; af.cell(r,6,slots)
    for k,(n,_,_) in enumerate(G['RARITY']):
        rr=10+k
        af.cell(r,7+2*k,f'=ROUND($D{r}*Settings!$C${rr}*Settings!$B$5,0)')
        af.cell(r,8+2*k,f'=ROUND($E{r}*Settings!$C${rr}*Settings!$B$5,0)')
        for j in (7+2*k,8+2*k): af.cell(r,j).fill=PatternFill('solid',fgColor=RF[n])
    for j in (1,2,6): af.cell(r,j).font=body
nstat=1+len(G['STATS'])
for j,w in enumerate([30,6,8,10,10,34]+[8]*8,start=1): af.column_dimensions[L(j)].width=w
af.freeze_panes='B2'
# ---------- Calculator
ca=wb.create_sheet('Item Level Calculator')
ca['A1']='Item Level Calculator'; ca['A1'].font=Font(name=F,bold=True,size=14)
ca['A2']='Enter the rarity and rolled values (blue cells). Example filled in: a White ring with 3% Fire Resistance and 6 Stamina.'; ca['A2'].font=Font(name=F,italic=True,size=10,color='4B5563')
ca['A4']='Map level (from Settings)'; ca['B4']='=Settings!B3'
ca['A5']='Rarity'; ca['B5']='White'; ca['B5'].font=inp; ca['B5'].fill=yellow
dv=DataValidation(type='list', formula1=f"=Settings!$A$10:$A${9+len(G['RARITY'])}", allow_blank=False); ca.add_data_validation(dv); dv.add('B5')
ca['A6']='Affixes allowed at this rarity'; ca['B6']=f"=INDEX(Settings!$B$10:$B$13,MATCH(B5,Settings!$A$10:$A$13,0))"
head(ca,8,['Line','Stat','Rolled value','Points','Min allowed','Max allowed','Check'])
rows=[('Implicit','Map resistance (implicit)',3),('Affix 1','Stamina',6),('Affix 2','',None),('Affix 3','',None),('Affix 4','',None)]
dv2=DataValidation(type='list', formula1=f"=Affixes!$A$2:$A${nstat}", allow_blank=True); ca.add_data_validation(dv2)
for i,(ln,s,v) in enumerate(rows):
    r=9+i; ca.cell(r,1,ln); c=ca.cell(r,2,s); c.font=inp; c.fill=yellow; dv2.add(f'B{r}')
    c=ca.cell(r,3,v); c.font=inp; c.fill=yellow
    ca.cell(r,4,f'=IF(OR(B{r}="",C{r}=""),0,C{r}*VLOOKUP(B{r},Affixes!$A$2:$C${nstat},3,FALSE))')
    idx=f'MATCH($B$5,Settings!$A$10:$A$13,0)'
    ca.cell(r,5,f'=IF(B{r}="","",INDEX(Affixes!$G$2:$N${nstat},MATCH(B{r},Affixes!$A$2:$A${nstat},0),2*{idx}-1))')
    ca.cell(r,6,f'=IF(B{r}="","",INDEX(Affixes!$G$2:$N${nstat},MATCH(B{r},Affixes!$A$2:$A${nstat},0),2*{idx}))')
    ok=f'=IF(B{r}="","",IF(AND(C{r}>=E{r},C{r}<=F{r}),"OK","Out of range"))'
    if ln.startswith('Affix'): ok=f'=IF(B{r}="","",IF({i}>$B$6,"Too many affixes for this rarity",IF(AND(C{r}>=E{r},C{r}<=F{r}),"OK","Out of range")))'
    ca.cell(r,7,ok)
ca['A14']='Item points'; ca['D14']='=ROUND(SUM(D9:D13),0)'
ca['A15']='Item level (0-100)'; ca['A15'].font=Font(name=F,bold=True,size=12); ca['D15']='=MIN(100,ROUND(5*Settings!$B$3+5*MIN(1,D14/Settings!$B$16),0))'; ca['D15'].font=Font(name=F,bold=True,size=12)
for j,w in enumerate([28,30,12,9,11,11,30],start=1): ca.column_dimensions[L(j)].width=w
# ---------- Drop rates
dr=wb.create_sheet('Drop Rates')
head(dr,1,['Enemy group','Gear rolls per kill','White % per roll','Green % per roll','Blue % per roll','Purple % per roll','Expected White per kill','Expected Green per kill','Expected Blue per kill','Expected Purple per kill','Kills per Blue (average)'])
for i,(g,n,w,gr,b,p) in enumerate(G['DROPS']):
    r=2+i; dr.cell(r,1,g); 
    for j,v in enumerate([n,w,gr,b,p],start=2): c=dr.cell(r,j,v); c.font=inp
    for k,col in enumerate('CDEF'): dr.cell(r,7+k,f'=$B{r}*{col}{r}/100').number_format='0.000'
    dr.cell(r,11,f'=IF(I{r}=0,"never",ROUND(1/I{r},0))')
dr.cell(8,1,'Luck raises every chance (proposed: +1% of base chance per Luck point). Blue text = inputs.').font=Font(name=F,italic=True,size=9,color='4B5563')
for j,w in enumerate([20,10,10,10,10,10,12,12,12,12,12],start=1): dr.column_dimensions[L(j)].width=w
# ---------- Map 1 bases
mb=wb.create_sheet('Map 1 Bases')
head(mb,1,['Base','Archetype','Type','Implicits','Dropped by','Enemies','Elites / boss','Notes'])
drops=collections.defaultdict(list)
for en,pool in G['POOLS'].items():
    for b in pool: drops[b].append(en)
import os
IL=runpy.run_path(os.path.join(os.path.dirname(sys.argv[1]),'item_layout.py')); IMP={b[0]:b[5] for b in IL['BASES']}
BIG=['Gravel King','Sergeant Ironjaw','Clockwork Juggernaut','The Twin Blades','Pit Champion','The Quartermaster','Warlord Gorrath, the Iron Tide']
for i,(b,arch,lab,note) in enumerate(G['BASES']):
    imp='Fire Resistance'+(' + '+IMP[arch] if IMP.get(arch) else '')
    mb.append([b,arch,lab,imp,', '.join(drops[b]),len(drops[b]),sum(1 for e in drops[b] if e in BIG),note])
for j,w in enumerate([20,14,20,30,80,9,10,26],start=1): mb.column_dimensions[L(j)].width=w
for sh in (af,dr,mb,ca,st):
    for row in sh.iter_rows(min_row=2):
        for c in row:
            c.alignment=wrap
            if c.value is not None and c.font.color is None and not c.font.bold: c.font=body
for c in ('B5','C9','C10','B9','B10','B11','B12','B13','C11','C12','C13'): ca[c].font=inp
ca['A15'].font=Font(name=F,bold=True,size=12); ca['D15'].font=Font(name=F,bold=True,size=12); st['B3'].font=inp; st['B4'].font=inp
for r in range(10,14): 
    for j in (2,3): st.cell(r,j).font=inp
mb.auto_filter.ref=mb.dimensions
unused=[b[0] for b in G['BASES'] if b[0] not in drops]
wb.save(out); print('bases unused', unused, '| enemies per base', {b:len(v) for b,v in drops.items()})
