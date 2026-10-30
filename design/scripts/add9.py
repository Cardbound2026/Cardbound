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
N='New (designer request). Codex Synergy is affinity, not ownership.'
def card(name,rar,typ,tgt,dt,mana,syn,tags,text,toks,note=N):
    r=[None]*NIN
    r[1]=name; r[2]=text; r[3]='Warrior'; r[4]=rar; r[5]=typ; r[6]=tgt; r[7]=dt; r[8]=mana
    r[9]='No'; r[10]='No'; r[11]='No'; r[12]=POOL[rar]; r[13]=syn; r[14]=tags; r[15]='Draft'; r[16]=note
    for (tc,sc,bc),(tok,lab,b) in zip([(18,19,20),(26,27,28)],toks): r[tc-1]=tok; r[sc-1]=lab; r[bc-1]=b
    return r
new=[
 card('Shield Strike','White','Attack','Single Enemy','Physical',10,'Bulwark','Damage; Block',
      "Deal damage equal to [X]% of your Block. Your Block is not spent.",[('[X]','Block as damage (%)',25)],
      N+' White version of Shield Slam (50% at Green).'),
 card('Thunderclap','Green','Attack','All Enemies','Physical',20,'Bulwark; Any','Damage; AoE; HP check',
      "Deal up to [X] damage to all enemies, scaled by your current HP % (at full HP, full damage; at half HP, half).",[('[X]','Max damage',14)],
      N+' AoE kept modest so Bulwark stays slow; Armor Nova remains the big AoE option.'),
 card('Indomitable','Gold','Skill','Self','None',20,'Bulwark','Block; Block protection',
      "For the next [X] turns, enemy effects cannot reduce or remove your Block. It still absorbs damage normally.",[('[X]','Turns',3)],
      N+' Multi-turn version of Unyielding Bastion (1 turn, Exhaust). Counter to block shredders.'),
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
