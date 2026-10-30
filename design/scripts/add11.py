import openpyxl, sys, copy
from openpyxl.formula.translate import Translator
from openpyxl.styles import Alignment
p = sys.argv[1]
wb = openpyxl.load_workbook(p); ws = wb['Card Database']
last = int(ws.tables['CardScalingDatabase'].ref.split(':')[1][2:])
NIN, PREV = 49, range(50,56)
base = {c: ws.cell(6,c).value for c in PREV}
sty = {c: ws.cell(6,c)._style for c in range(1,56)}
rows = [[ws.cell(r,c).value for c in range(1,NIN+1)] for r in range(6,last+1)]
POOL = {'White':'No limit','Green':'Green pool: 6 per deck','Blue':'Blue pool: 4 per deck','Gold':'Gold pool: 2 per deck'}
W = {r[1]: r for r in rows if r[3]=='Warrior'}
br = W['Blood Reckoning']
br[2] = "Spread all Bleed on you to all enemies and double it. Then deal damage equal to all Bleed on enemies and heal for the damage dealt."
br[16] = (br[16] or '') + " Reworded as the build's finisher: damage and healing happen immediately so it can heal you to full at the end of a fight. Check this matches your intent."
N='New (designer request). Codex Synergy is affinity, not ownership.'
def card(name,rar,typ,tgt,dt,mana,syn,tags,text,toks,note=N):
    r=[None]*NIN
    r[1]=name; r[2]=text; r[3]='Warrior'; r[4]=rar; r[5]=typ; r[6]=tgt; r[7]=dt; r[8]=mana
    r[9]='No'; r[10]='No'; r[11]='No'; r[12]=POOL[rar]; r[13]=syn; r[14]=tags; r[15]='Draft'; r[16]=note
    for (tc,sc,bc),(tok,lab,b) in zip([(18,19,20),(26,27,28)],toks): r[tc-1]=tok; r[sc-1]=lab; r[bc-1]=b
    return r
new=[
 card('Underdog','White','Attack','Single Enemy','Physical',10,'Bloodbound','Damage; HP check',
      "Deal [X] damage. If your current HP is lower than the target's, deal [Y] more.",[('[X]','Damage',6),('[Y]','Bonus damage',6)],N+' Opposite of Bully.'),
 card('Desperate Strike','White','Attack','Single Enemy','Physical',10,'Bloodbound','Damage; Low HP',
      "Deal [X] damage, plus 1 more for every [Y]% of your max HP you are missing.",[('[X]','Damage',5),('[Y]','Missing HP per bonus (%)',5)],
      N+' At 50% HP deals 15; at 10% HP deals 23.'),
 card('Collect the Debt','Green','Attack','Single Enemy','Physical',10,'Bloodbound','Damage; Blood Debt',
      "Deal damage equal to your stored Blood Debt, then clear it.",[]),
 card('Sanguine Guard','Green','Skill','Self','None',10,'Bloodbound','Block; Blood Debt',
      "Gain Block equal to your stored Blood Debt.",[]),
 card('Transfusion','Blue','Skill','Single Enemy','Physical',10,'Bloodbound; Hemorrhage','Bleed',
      "Move all Bleed on you onto the target.",[]),
 card('Pay in Blood','Blue','Power','Self','None',20,'Bloodbound','Blood Debt; Self-harm',
      "HP you lose stores [X]% more Blood Debt.",[('[X]','Extra Blood Debt (%)',50)]),
]
ids=[r[0] for r in rows]
nxt=max(int(x[4:]) for x in ids if x.startswith('WAR'))+1
for k,r in enumerate(new): r[0]=f'WAR-{nxt+k:04d}'
pos=max(i for i,x in enumerate(ids) if x.startswith('WAR'))+1
rows=rows[:pos]+new+rows[pos:]
nlast=5+len(rows)
for k,vals in enumerate(rows):
    r=6+k
    for c in range(1,NIN+1): ws.cell(r,c).value=vals[c-1]
    for c in PREV: ws.cell(r,c).value=Translator(base[c],origin=ws.cell(6,c).coordinate).translate_formula(ws.cell(r,c).coordinate)
    for c in range(1,56): ws.cell(r,c)._style=copy.copy(sty[c])
    ws.cell(r,17).alignment=Alignment(wrap_text=True,vertical='top'); ws.row_dimensions[r].height=42
ws.tables['CardScalingDatabase'].ref=f'A5:BC{nlast}'
wb.save(p); print(nxt, nlast)
