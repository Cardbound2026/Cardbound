# Adds Slot Map and Power Level tabs, a slot check in the calculator, and syncs Affixes "Allowed slots".
import openpyxl, sys, runpy
from openpyxl.styles import Font, Alignment, PatternFill
from openpyxl.worksheet.datavalidation import DataValidation
from openpyxl.utils import get_column_letter as L
gp, p = sys.argv[1], sys.argv[2]
G = runpy.run_path(gp); wb = openpyxl.load_workbook(p)
F='Arial'; hdr=Font(name=F,bold=True,color='FFFFFF',size=10); body=Font(name=F,size=10); inp=Font(name=F,size=10,color='0000FF')
yellow=PatternFill('solid',fgColor='FFFF00'); wrap=Alignment(wrap_text=True,vertical='top'); ctr=Alignment(horizontal='center',vertical='center')
SIG=PatternFill('solid',fgColor='86EFAC'); YES=PatternFill('solid',fgColor='DCFCE7')
# ---- Slot Map replaced by the item layout tabs
if 'Slot Map' in wb.sheetnames: del wb['Slot Map']
IL=runpy.run_path(sys.argv[3]); IS=IL['STATS']; nS=len(IS); lastc=L(1+nS); lb=1+len(IL['BASES'])
af=wb['Affixes']
for r in range(2, af.max_row+1):
    st=af.cell(r,1).value
    if st=='Resistance': af.cell(r,6).value='Every item (12% per draw)'
    elif st in IS:
        where=[k for k,w in IL['SLOTW'].items() if w.get(st,0)>0]
        imp=[b[0] for b in IL['BASES'] if b[5]==st]
        txt=', '.join(where) if where else ''
        if imp: txt=(txt+'; ' if txt else '')+'implicit on '+', '.join(imp)
        af.cell(r,6).value=txt
    af.cell(r,6).alignment=Alignment(wrap_text=True,vertical='top')
af.column_dimensions['F'].width=60
nstat=af.max_row
ca=wb['Item Level Calculator']
ca['A7']='Item base'; ca['B7']='Ring'; ca['B7'].font=inp; ca['B7'].fill=yellow
dv=DataValidation(type='list', formula1=f"='Item Bases'!$A$2:$A${lb}", allow_blank=False); ca.add_data_validation(dv); dv.add('B7')
ca['H8']='Can roll on this base?'; ca['H8'].font=hdr; ca['H8'].fill=PatternFill('solid',fgColor='1F2937')
for r in range(10,14):
    base=f"MATCH($B$7,'Item Bases'!$A$2:$A${lb},0)"
    ca.cell(r,8,f"=IF(B{r}=\"\",\"\",IF(ISNA(MATCH(B{r},'Final Weights'!$B$1:${lastc}$1,0)),\"-\",IF(INDEX('Final Weights'!$B$2:${lastc}${lb},{base},MATCH(B{r},'Final Weights'!$B$1:${lastc}$1,0))>0,\"Yes\",\"Not on this base\")))")
ca['A17']='Second implicits (boot Initiative, weapon and off-hand signatures) and the amulet pool are not counted in item level.'; ca['A17'].font=Font(name=F,italic=True,size=9,color='4B5563')
ca.column_dimensions['H'].width=22
# ---- Power Level
if 'Power Level' in wb.sheetnames: del wb['Power Level']
pl=wb.create_sheet('Power Level')
pl['A1']='Power level = average of gear score and deck level (each 0 to 100)'; pl['A1'].font=Font(name=F,bold=True,size=14)
pl['A2']='These measure investment, not build quality: an optimized gear score 45 character should beat a gear score 60 one in the wrong stats. Blue cells = an example character.'; pl['A2'].font=Font(name=F,italic=True,size=10,color='4B5563')
pl['A4']='Gear score = average item level of the 14 slots'; pl['A4'].font=Font(name=F,bold=True,size=11)
for j,h in enumerate(['Slot','Item level'],start=1):
    c=pl.cell(5,j,h); c.font=hdr; c.fill=PatternFill('solid',fgColor='1F2937')
gslots=['Weapon','Off-hand','Helm','Amulet','Cloak','Chest','Bracers','Gloves','Belt','Pants','Boots','Ring 1','Ring 2','Codex']
ex=[58,50,48,61,45,55,47,52,44,49,57,53,50,60]
for i,(sl,v) in enumerate(zip(gslots,ex)):
    pl.cell(6+i,1,sl).font=body; c=pl.cell(6+i,2,v); c.font=inp
pl.cell(21,1,'Gear score').font=Font(name=F,bold=True,size=11); pl.cell(21,2,'=ROUND(AVERAGE(B6:B19),0)').font=Font(name=F,bold=True,size=11)
pl['D4']='Deck level = the 20 best cards as a share of a perfect legal deck at +10'; pl['D4'].font=Font(name=F,bold=True,size=11)
for j,h in enumerate(['Card rarity','Card points','Matching gear'],start=4):
    c=pl.cell(5,j,h); c.font=hdr; c.fill=PatternFill('solid',fgColor='1F2937')
gm=['White','Green','Blue','Purple']
for i,(k,v) in enumerate(G['DECK_SCORE'].items()):
    pl.cell(6+i,4,k).font=body; c=pl.cell(6+i,5,v); c.font=inp; pl.cell(6+i,6,gm[i]+' max points at +0').font=body
pl['D10']='Rank step (1.9/3: rank 10 lines up with map +19)'; pl['D10'].font=body; pl['D10'].alignment=wrap
c=pl['E10']; c.value=round(G['DECK_RANK_STEP'],4); c.font=inp
pl['D11']='Perfect legal deck at +10 (2 Gold, 4 Blue, 6 Green, 8 White), average points'; pl['D11'].font=body; pl['D11'].alignment=wrap
pl['E11']='=(2*E9+4*E8+6*E7+8*E6)/20*(1+10*E10)'; pl['E11'].number_format='0.0'
pl['D13']='Example deck (20 cards, mostly rank 4-6, farming about map +9)'; pl['D13'].font=Font(name=F,bold=True,size=10)
for j,h in enumerate(['Rarity','Copies','Rank','Points per card','Total'],start=4):
    c=pl.cell(14,j,h); c.font=hdr; c.fill=PatternFill('solid',fgColor='1F2937')
exdeck=[('Gold',2,6),('Blue',4,5),('Green',6,5),('White',8,4)]
for i,(rar,k,rk) in enumerate(exdeck):
    r=15+i; pl.cell(r,4,rar).font=body; pl.cell(r,5,k).font=inp; pl.cell(r,6,rk).font=inp
    pl.cell(r,7,f'=ROUND(VLOOKUP(D{r},$D$6:$E$9,2,FALSE)*(1+F{r}*$E$10),1)'); pl.cell(r,8,f'=E{r}*G{r}')
pl.cell(19,4,'Deck level').font=Font(name=F,bold=True,size=11); pl.cell(19,8,'=ROUND(SUM(H15:H18)/SUM(E15:E18)/$E$11*100,0)').font=Font(name=F,bold=True,size=11)
pl.cell(23,1,'POWER LEVEL').font=Font(name=F,bold=True,size=14); c=pl.cell(23,2,'=ROUND((B21+H19)/2,0)'); c.font=Font(name=F,bold=True,size=14); c.fill=PatternFill('solid',fgColor='FDE68A')
pl.cell(24,1,'average of gear score and deck level').font=Font(name=F,italic=True,size=9,color='4B5563')
pl['D22']='Side by side: the best possible score at each stage'; pl['D22'].font=Font(name=F,bold=True,size=11)
for j,h in enumerate(['Card rank','Matching map level','Perfect Purple item (item level)','Perfect legal deck (deck level)','Starter deck at this rank'],start=4):
    c=pl.cell(23,j,h); c.font=hdr; c.fill=PatternFill('solid',fgColor='1F2937'); c.alignment=Alignment(wrap_text=True,vertical='center')
for i,rk in enumerate([0,1,2,3,5,7,10]):
    r=24+i; pl.cell(r,4,rk).font=body
    pl.cell(r,5,f'=ROUND(D{r}*$E$10*3,0)')
    pl.cell(r,6,f'=MIN(100,5*E{r}+5)')
    pl.cell(r,7,f'=ROUND((2*$E$9+4*$E$8+6*$E$7+8*$E$6)/20*(1+D{r}*$E$10)/$E$11*100,0)')
    pl.cell(r,8,f'=ROUND((14*$E$6+3*$E$7+2*$E$8+1*$E$9)/20*(1+D{r}*$E$10)/$E$11*100,0)')
pl['D32']='Both scales top out at 100, and a perfect deck at rank R matches a perfect Purple item from map +1.9R, so gear score and deck level move together. Real top-end characters will sit in the 80s and 90s, since 100 needs perfect rolls on every item and +10 on every card.'
pl['D32'].font=Font(name=F,italic=True,size=9,color='4B5563'); pl['D32'].alignment=wrap; pl.merge_cells('D32:H35')
pl.row_dimensions[23].height=42
for col,w in zip('ABCDEFGH',[16,11,3,30,12,14,14,14]): pl.column_dimensions[col].width=w
# Rules tab: add the new tabs to the list
ru=wb['Rules']
for r in range(1,ru.max_row+1):
    v=ru.cell(r,1).value or ''
    if v.startswith('Settings: pick a map level'):
        ru.cell(r,1).value=v+' Item Rules, Item Bases, Armor Types, Slot Weights, Final Weights, Chance per Roll, Roll Odds, New Stats: every item base and the odds of each stat. Power Level: gear score, deck level and power level.'
st=wb['Settings']; r0=st.max_row+2
st.cell(r0,1,'Amulet draw / regen pool by rarity').font=Font(name=F,bold=True,size=11)
for j,h in enumerate(['Amulet','Pool points','Note'],start=1):
    c=st.cell(r0+1,j,h); c.font=hdr; c.fill=PatternFill('solid',fgColor='1F2937')
for i,(a,pts,nt) in enumerate(G['AMULET_POOL']):
    st.cell(r0+2+i,1,a).font=body; st.cell(r0+2+i,2,pts).font=inp; st.cell(r0+2+i,3,nt).font=body
st.cell(r0+3+len(G['AMULET_POOL']),1,'1 point = 1 card drawn or 10 mana regen. The pool is not counted in item level. '+G['PURPLE_RULE']).font=Font(name=F,italic=True,size=9,color='4B5563')
wb.save(p); print('ok', nstat)
