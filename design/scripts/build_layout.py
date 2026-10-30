import openpyxl, sys, runpy
from openpyxl.styles import Font, Alignment, PatternFill
from openpyxl.worksheet.datavalidation import DataValidation
from openpyxl.utils import get_column_letter as L
from openpyxl.formatting.rule import ColorScaleRule
G=runpy.run_path(sys.argv[1]); out=sys.argv[2]
F='Arial'; hdr=Font(name=F,bold=True,color='FFFFFF',size=10); body=Font(name=F,size=10); inp=Font(name=F,size=10,color='0000FF')
dark=PatternFill('solid',fgColor='1F2937'); yellow=PatternFill('solid',fgColor='FFFF00'); wrap=Alignment(wrap_text=True,vertical='top')
ctr=Alignment(horizontal='center'); hwrap=Alignment(wrap_text=True,horizontal='center',vertical='center')
S=G['STATS']; nS=len(S); lastc=L(1+nS)
def header(ws,r,first):
    c=ws.cell(r,1,first); c.font=hdr; c.fill=dark
    for j,s in enumerate(S,start=2):
        c=ws.cell(r,j,s); c.font=hdr; c.fill=dark; c.alignment=hwrap
    ws.row_dimensions[r].height=54
def widths(ws,first=24):
    ws.column_dimensions['A'].width=first
    for j in range(2,nS+3): ws.column_dimensions[L(j)].width=8.5
APPEND=len(sys.argv)>3 and sys.argv[3]=='append'
if APPEND:
    wb=openpyxl.load_workbook(out)
    for nm in ['Item Rules','Item Bases','Armor Types','Slot Weights','Final Weights','Chance per Roll','Roll Odds','New Stats']:
        if nm in wb.sheetnames: del wb[nm]
    ru=wb.create_sheet('Item Rules')
else:
    wb=openpyxl.Workbook(); ru=wb.active; ru.title='Rules'
T=[('Cardbound: Item Layout','t'),('First pass at every item base and how its stats roll. Blue numbers are inputs: change any weight and every chance updates.','i'),('',None),
('How an item rolls','h'),
('Every item has its implicit(s), then one affix per rarity (White 1, Green 2, Blue 3, Purple 4). Each affix is a separate draw, and the same stat can be drawn more than once: a Purple ring can roll Strength four times.',None),
('Chance of a stat on one draw = its final weight / the total of all final weights for that base. Final weight = slot weight x armor type modifier. 0 means it can never roll there.',None),
('Weights only change how often a stat rolls, never its value: a Strength roll on a cloth robe has the same full range as one on leather.',None),
('Repeated stats merge into one line ("+11% Crit Chance"). Holding Ctrl shows each allocation and its roll inside its range, e.g. 3 allocations of 3-6%: 5%, 3%, 3%.',None),
('No caps on stacking: a glass cannon can push to 100% Crit Chance if the drops allow it.',None),
('Efficiency rolls only on Purple items, so it is left out of the draw on White, Green and Blue.',None),('',None),
('Armor types (armor slots only)','h'),
('Plate leans defensive: Dexterity (which drives Defense gain), Stamina, Thorns. Leather leans offensive: Strength, Crit Chance, Crit Damage, a little Initiative. Cloth leans caster: Intelligence, Spirit, Max Mana, Mana Regen. Nothing is locked; the odds just shift.',None),('',None),
('Slot rules from you','h'),
('Initiative rolls only on Boots, Rings and Cloaks; every pair of boots also has Initiative as a second implicit.',None),
('Bracers and Gloves: heavy Crit Chance and Crit Damage, a little Strength and Intelligence, no mana stats.',None),
('Weapons carry their type\'s signature stat as a second implicit (like boots) and can roll it again as an affix. Multi-hit, Multiplay, Multicast, Bleed Chance, Party Recovery and Lifesteal roll only on weapons. Second implicits (Initiative on boots, weapon and off-hand signatures) roll in their normal range but do not count toward item level, like the amulet pool, so every slot shares the same 100 ceiling.',None),
('Resistance rolls on every item, weapons included, with the same chance per draw everywhere (12%, set on the Armor Types tab). Every class needs it, so no armor type favors it.',None),
('Off-hand: any 1H weapon (dual wield: two wands, wand and dagger, sword and axe), a Kite Shield (aggressive, Thorns implicit), a Tower Shield (Defense Gain implicit) or a Focus (implicit: damage of one random element). Wands lean Intelligence, daggers lean Strength.',None),
('2H weapons roll 1.8x the stat values and count as both the weapon and off-hand slot in gear score, since two great 1H weapons are much harder to find.',None),('',None),
('Tabs','h'),
('Item Bases: every base with its implicits. Armor Types: the modifiers. Slot Weights: base weights per slot or weapon. Final Weights and Chance per Roll: the result for every base. Roll Odds: pick a base, a stat and how many copies you want, and get the odds per rarity. New Stats: proposed definitions for the new weapon stats.',None)]
for i,(t,k) in enumerate(T,start=1):
    c=ru.cell(i,1,t); c.alignment=wrap; c.font={'t':Font(name=F,bold=True,size=16),'i':Font(name=F,italic=True,size=10,color='4B5563'),'h':Font(name=F,bold=True,size=12)}.get(k,body)
ru.column_dimensions['A'].width=120
# ---- Item Bases
ib=wb.create_sheet('Item Bases')
for j,h in enumerate(['Base','Slot','Armor type','Hands','Implicit 1','Implicit 2','Notes / status'],start=1):
    c=ib.cell(1,j,h); c.font=hdr; c.fill=dark
TF={'Plate':'E5E7EB','Leather':'FDE7C8','Cloth':'E0E7FF','None':'FFFFFF'}
for i,b in enumerate(G['BASES']):
    r=2+i
    for j,v in enumerate(b,start=1):
        c=ib.cell(r,j,v); c.font=body; c.fill=PatternFill('solid',fgColor=TF[b[2]])
nb=len(G['BASES']); lb=1+nb
for col,w in zip('ABCDEFG',[18,14,12,9,16,20,40]): ib.column_dimensions[col].width=w
ib.freeze_panes='A2'
# ---- Armor Types
at=wb.create_sheet('Armor Types'); header(at,1,'Armor type')
for i,(t,m) in enumerate(G['TYPES'].items()):
    r=2+i; at.cell(r,1,t).font=Font(name=F,bold=True,size=10)
    for j,s in enumerate(S,start=2):
        c=at.cell(r,j,m.get(s,1)); c.font=inp; c.alignment=ctr
        if m.get(s,1)>1: c.fill=PatternFill('solid',fgColor='BBF7D0')
        elif m.get(s,1)<1: c.fill=PatternFill('solid',fgColor='FECACA')
widths(at,14); at.freeze_panes='B2'
nt=len(G['TYPES']); lt=1+nt
at.cell(lt+2,1,'Resistance chance per draw (every item)').font=Font(name=F,bold=True,size=10); c=at.cell(lt+2,2,G['RES_CHANCE']); c.font=inp; c.fill=yellow; c.number_format='0%'
at.cell(lt+3,1,'2H weapon stat multiplier').font=Font(name=F,bold=True,size=10); c=at.cell(lt+3,2,G['TWO_HAND_STATS']); c.font=inp
at.column_dimensions['A'].width=36
# ---- Slot Weights
sw=wb.create_sheet('Slot Weights'); header(sw,1,'Slot or weapon')
for i,(sl,w) in enumerate(G['SLOTW'].items()):
    r=2+i; sw.cell(r,1,sl).font=Font(name=F,bold=True,size=10)
    for j,s in enumerate(S,start=2):
        v=w.get(s,0); c=sw.cell(r,j,v); c.font=inp; c.alignment=ctr
        if v==0: c.font=Font(name=F,size=10,color='D1D5DB')
nw=len(G['SLOTW']); lw=1+nw
widths(sw,16); sw.freeze_panes='B2'
# ---- Final Weights
fw=wb.create_sheet('Final Weights'); header(fw,1,'Base')
c=fw.cell(1,nS+2,'Total'); c.font=hdr; c.fill=dark
for i in range(nb):
    r=2+i; fw.cell(r,1,f"='Item Bases'!A{r}").font=Font(name=F,bold=True,size=10)
    for j in range(2,nS+2):
        fw.cell(r,j,f"=INDEX('Slot Weights'!$B$2:${lastc}${lw},MATCH('Item Bases'!$B{r},'Slot Weights'!$A$2:$A${lw},0),{j-1})*INDEX('Armor Types'!$B$2:${lastc}${lt},MATCH('Item Bases'!$C{r},'Armor Types'!$A$2:$A${lt},0),{j-1})").alignment=ctr
    rj=S.index('Resistance')+2
    others=f'(SUM(B{r}:{L(rj-1)}{r})+SUM({L(rj+1)}{r}:{lastc}{r}))'
    fw.cell(r,rj,f"={others}*'Armor Types'!$B${lt+2}/(1-'Armor Types'!$B${lt+2})").alignment=ctr
    fw.cell(r,nS+2,f'=SUM(B{r}:{lastc}{r})')
widths(fw,18); fw.freeze_panes='B2'
# ---- Chance per Roll (Purple draw; includes Efficiency)
cp=wb.create_sheet('Chance per Roll'); header(cp,1,'Base')
cp['A1'].value='Base (chance per draw, Purple)'
for i in range(nb):
    r=2+i; cp.cell(r,1,f"='Item Bases'!A{r}").font=Font(name=F,bold=True,size=10)
    for j in range(2,nS+2):
        c=cp.cell(r,j,f"=IF('Final Weights'!{L(j)}{r}=0,\"\",'Final Weights'!{L(j)}{r}/'Final Weights'!${L(nS+2)}{r})"); c.number_format='0%'; c.alignment=ctr
cp.conditional_formatting.add(f'B2:{lastc}{lb}',ColorScaleRule(start_type='num',start_value=0,start_color='FFFFFF',end_type='num',end_value=0.3,end_color='22C55E'))
widths(cp,26); cp.freeze_panes='B2'
# ---- Roll Odds
ro=wb.create_sheet('Roll Odds')
ro['A1']='Roll Odds'; ro['A1'].font=Font(name=F,bold=True,size=14)
ro['A2']='Pick a base and a stat (yellow). The grid shows the chance of rolling that stat at least N times on one item, per rarity.'; ro['A2'].font=Font(name=F,italic=True,size=10,color='4B5563')
ro['A4']='Base'; ro['B4']='Jerkin'; ro['A5']='Stat'; ro['B5']='Crit Chance'
for c in ('B4','B5'): ro[c].font=inp; ro[c].fill=yellow
dv1=DataValidation(type='list',formula1=f"='Item Bases'!$A$2:$A${lb}"); dv2=DataValidation(type='list',formula1=f"='Armor Types'!$B$1:${lastc}$1")
ro.add_data_validation(dv1); ro.add_data_validation(dv2); dv1.add('B4'); dv2.add('B5')
ro['A6']='Row'; ro['B6']=f"=MATCH(B4,'Item Bases'!$A$2:$A${lb},0)"
ro['A7']='Stat weight'; ro['B7']=f"=INDEX('Final Weights'!$B$2:${lastc}${lb},B6,MATCH(B5,'Armor Types'!$B$1:${lastc}$1,0))"
ro['A8']='Total weight (Purple)'; ro['B8']=f"=INDEX('Final Weights'!${L(nS+2)}$2:${L(nS+2)}${lb},B6)"
ro['A9']='Efficiency weight (Purple only)'; ro['B9']=f"=INDEX('Final Weights'!${L(nS+1)}$2:${L(nS+1)}${lb},B6)"
for j,h in enumerate(['At least','White (1 roll)','Green (2)','Blue (3)','Purple (4)'],start=1):
    c=ro.cell(11,j,h); c.font=hdr; c.fill=dark
rar=[(1,'B'),(2,'C'),(3,'D'),(4,'E')]
for k in range(1,5):
    r=11+k; ro.cell(r,1,f'{k}x').font=Font(name=F,bold=True,size=10)
    for n,col in rar:
        pur = (n==4)
        p = "$B$7/$B$8" if pur else "IF($B$5=\"Efficiency\",0,$B$7/($B$8-$B$9))"
        f=f'=IF({k}>{n},"",1-BINOMDIST({k-1},{n},{p},1))'
        c=ro.cell(r,ord(col)-64,f); c.number_format='0.00%'; c.alignment=ctr
ro['A17']='Chance per draw'; ro['B17']="=IF($B$5=\"Efficiency\",0,$B$7/($B$8-$B$9))"; ro['E17']='=$B$7/$B$8'
for c in ('B17','E17'): ro[c].number_format='0.0%'
# headline chases
ro['A20']='Headline chases (live)'; ro['A20'].font=Font(name=F,bold=True,size=12)
for j,h in enumerate(['Chase','Base','Stat','Copies','Rarity rolls','Chance','About 1 in'],start=1):
    c=ro.cell(21,j,h); c.font=hdr; c.fill=dark
chases=[('Triple-crit leather chest','Jerkin','Crit Chance',3,4),('Triple-crit leather chest (Blue)','Jerkin','Crit Chance',3,3),
 ('Triple-crit cloth robe','Robe','Crit Chance',3,4),('Mega Strength ring (4x)','Ring','Strength',4,4),('Strength on a cloth robe (any)','Robe','Strength',1,4),
 ('Double Initiative boots (+ implicit)','Leather Boots','Initiative',2,4),('Triple Multicast Arcane Staff (+ implicit)','Arcane Staff','Multicast Chance',3,4),
 ('Double Intelligence plate helm','Greathelm','Intelligence',2,4),('Resistance on any item (1+, Purple)','Robe','Resistance',1,4),('Double Dexterity Tower Shield','Tower Shield','Dexterity',2,4)]
for i,(nm,b,s,k,n) in enumerate(chases):
    r=22+i; ro.cell(r,1,nm); ro.cell(r,2,b).font=inp; ro.cell(r,3,s).font=inp; ro.cell(r,4,k).font=inp; ro.cell(r,5,n).font=inp
    row=f"MATCH(B{r},'Item Bases'!$A$2:$A${lb},0)"
    w=f"INDEX('Final Weights'!$B$2:${lastc}${lb},{row},MATCH(C{r},'Armor Types'!$B$1:${lastc}$1,0))"
    tot=f"INDEX('Final Weights'!${L(nS+2)}$2:${L(nS+2)}${lb},{row})"
    eff=f"INDEX('Final Weights'!${L(nS+1)}$2:${L(nS+1)}${lb},{row})"
    p=f"IF(E{r}=4,{w}/{tot},{w}/({tot}-{eff}))"
    c=ro.cell(r,6,f'=1-BINOMDIST(D{r}-1,E{r},{p},1)'); c.number_format='0.00%'
    ro.cell(r,7,f'=IF(F{r}=0,"never",ROUND(1/F{r},0))')
for col,w in zip('ABCDEFG',[40,18,18,12,12,12,12]): ro.column_dimensions[col].width=w
# ---- New Stats
ns=wb.create_sheet('New Stats')
for j,h in enumerate(['Stat','Unit','Proposed definition'],start=1):
    c=ns.cell(1,j,h); c.font=hdr; c.fill=dark
for i,row in enumerate(G['NEW_STATS']):
    for j,v in enumerate(row,start=1): c=ns.cell(2+i,j,v); c.font=body; c.alignment=wrap
for col,w in zip('ABC',[20,8,80]): ns.column_dimensions[col].width=w
for ws in wb.worksheets:
    for row in ws.iter_rows():
        for c in row:
            if c.font and c.font.name!=F: c.font=Font(name=F,size=10)
wb.save(out); print('bases',nb,'weights',nw)
