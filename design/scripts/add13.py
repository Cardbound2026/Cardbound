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
rc = W['Ruthless Conversion']
rc[2] = "Consume all Vulnerable on the target. Gain 1 Strength for every [X] Vulnerable consumed, for the rest of combat."
rc[17]='[X]'; rc[18]='Vulnerable per Strength'; rc[19]=5
rc[16] = (rc[16] or '') + ' Ratio set to 1 Strength per 5 Vulnerable (designer decision).'
N='New (designer request). Codex Synergy is affinity, not ownership.'
def card(name,rar,typ,tgt,dt,mana,syn,tags,text,toks,note=N):
    r=[None]*NIN
    r[1]=name; r[2]=text; r[3]='Warrior'; r[4]=rar; r[5]=typ; r[6]=tgt; r[7]=dt; r[8]=mana
    r[9]='No'; r[10]='No'; r[11]='No'; r[12]=POOL[rar]; r[13]=syn; r[14]=tags; r[15]='Draft'; r[16]=note
    for (tc,sc,bc),(tok,lab,b) in zip([(18,19,20),(26,27,28)],toks): r[tc-1]=tok; r[sc-1]=lab; r[bc-1]=b
    return r
new=[
 card('Crack Armor','White','Skill','Single Enemy','None',10,'Sunderer','Vulnerability; Card Draw',"Apply [X] Vulnerable. Draw 1 card.",[('[X]','Vulnerable',15)]),
 card('Sundering Blow','Green','Attack','Single Enemy','Physical',20,'Sunderer','Damage; Multi-hit; Block removal',"Deal [X] damage 3 times. Each hit removes [Y] of the target's Block first.",[('[X]','Damage per hit',4),('[Y]','Block removed per hit',3)]),
 card('Mark for Death','Green','Skill','Single Enemy','None',10,'Sunderer; Any','Vulnerability; Co-op; Card Draw',"Apply [X] Vulnerable. This round, each ally's first Attack on the target draws them 1 card.",[('[X]','Vulnerable',20)]),
 card('Relentless Assault','Blue','Skill','Self','None',10,'Sunderer','Vulnerability; Multi-hit',"For the next 2 turns, each unblocked hit you deal applies [X] Vulnerable.",[('[X]','Vulnerable per hit',1)],N+' Changed from a Power to a 2-turn Skill (designer request).'),
 card('Reclaim Ground','Green','Skill','Single Enemy','None',10,'Sunderer','Vulnerability; Block',"Consume all Vulnerable on the target. Gain [X] Block for each Vulnerable consumed.",[('[X]','Block per Vulnerable',1)],N+' Escape hatch: bail on the Vulnerable build-up for defense when a counter is coming.'),
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
