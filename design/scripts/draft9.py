import openpyxl, sys, copy, runpy, collections
from openpyxl.formula.translate import Translator
from openpyxl.styles import Alignment, Font
src, out, cf = sys.argv[1], sys.argv[2], sys.argv[3]
NEW = runpy.run_path(cf)['NEW']
wb = openpyxl.load_workbook(src); ws = wb['Card Database']
last = int(ws.tables['CardScalingDatabase'].ref.split(':')[1][2:])
NIN, PREV = 49, range(50,56)
base = {c: ws.cell(6,c).value for c in PREV}; sty = {c: ws.cell(6,c)._style for c in range(1,56)}
rows = [[ws.cell(r,c).value for c in range(1,NIN+1)] for r in range(6,last+1)]
POOL = {'White':'No limit','Green':'Green pool: 6 per deck','Blue':'Blue pool: 4 per deck','Gold':'Gold pool: 2 per deck'}
PFX={'Warrior':'WAR','Rogue':'ROG','Mage':'MAG','Paladin':'PAL'}
for cls, lst in NEW.items():
    new=[]
    for name,rar,typ,tgt,dt,mana,exh,syn,tags,text,toks,note in lst:
        r=[None]*NIN; r[1]=name; r[2]=text; r[3]=cls; r[4]=rar; r[5]=typ; r[6]=tgt; r[7]=dt; r[8]=mana
        r[9]='No'; r[10]=exh; r[11]='No'; r[12]=POOL[rar]; r[13]=syn; r[14]=tags; r[15]='Draft'
        r[16]='New in Draft 9 (gap from the effect-category review): '+note+' Codex Synergy is affinity, not ownership.'
        for (tc,sc,bc),(tok,lab,b) in zip([(18,19,20),(26,27,28)], toks): r[tc-1]=tok; r[sc-1]=lab; r[bc-1]=b
        new.append(r)
    ids=[r[0] for r in rows]; p=PFX[cls]
    nxt=max(int(x[4:]) for x in ids if x.startswith(p))+1
    for k,r in enumerate(new): r[0]=f'{p}-{nxt+k:04d}'
    pos=max(i for i,x in enumerate(ids) if x.startswith(p))+1
    rows=rows[:pos]+new+rows[pos:]
dups=[n for n,c in collections.Counter(r[1] for r in rows).items() if c>1]
nlast=5+len(rows)
for k,vals in enumerate(rows):
    r=6+k
    for c in range(1,NIN+1): ws.cell(r,c).value=vals[c-1]
    for c in PREV: ws.cell(r,c).value=Translator(base[c],origin=ws.cell(6,c).coordinate).translate_formula(ws.cell(r,c).coordinate)
    for c in range(1,56): ws.cell(r,c)._style=copy.copy(sty[c])
    ws.cell(r,17).alignment=Alignment(wrap_text=True,vertical='top'); ws.row_dimensions[r].height=42
ws.tables['CardScalingDatabase'].ref=f'A5:BC{nlast}'
s=wb['Review Notes']; st=s.max_row+2
for i,(t,h) in enumerate([('Draft 9: gaps from the effect-category review',1),
 (f"Added {sum(len(v) for v in NEW.values())} cards: Green and Gold draw block per class, block shred or steal per class, 1-turn block bypass for Mage and Paladin Skills, Rogue max mana / Strength / regen / Vulnerable / Initiative / AoE / defense payoff, Mage discard, Weak and anti-heal, Paladin mana, cost reduction, buff steal, Initiative theft and regen reduction, buff removal per class, and the new Unwarded debuff (+1% magic damage taken per stack) for Mage and Paladin.",0)]):
    c=s.cell(st+i,1,t); c.font=Font(name='Aptos',bold=bool(h),size=12 if h else 11); c.alignment=Alignment(wrap_text=True,vertical='top')
wb.save(out); print('rows',len(rows),'dups',dups)
