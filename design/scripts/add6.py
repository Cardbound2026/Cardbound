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
ids = [r[0] for r in rows]
# Pummel -> Blue, stronger
pm = rows[ids.index('WAR-0060')]
pm[4]='Blue'; pm[12]='Blue pool: 4 per deck'; pm[19]=10
pm[16]='Moved Green to Blue and raised damage 6 to 10 (designer feedback). Codex Synergy is affinity, not ownership.'
NOTE='New (designer request). Codex Synergy is affinity, not ownership.'
def card(i,name,rar,typ,tgt,dt,mana,syn,tags,text,toks,note=NOTE):
    r=[None]*NIN
    r[0]=f'WAR-{i:04d}'; r[1]=name; r[2]=text; r[3]='Warrior'; r[4]=rar; r[5]=typ; r[6]=tgt; r[7]=dt; r[8]=mana
    r[9]='No'; r[10]='No'; r[11]='No'; r[12]={'Green':'Green pool: 6 per deck','Blue':'Blue pool: 4 per deck'}[rar]
    r[13]=syn; r[14]=tags; r[15]='Draft'; r[16]=note
    for (tc,sc,bc),(tok,lab,b) in zip([(18,19,20),(26,27,28)],toks): r[tc-1]=tok; r[sc-1]=lab; r[bc-1]=b
    return r
new=[
 card(95,'Rattle','Green','Attack','Single Enemy','Physical',10,'Any','Damage; Discard',"Deal [X] damage. The target discards 1 random card.",[('[X]','Damage',4)]),
 card(96,'Crushing Blow','Green','Attack','Single Enemy','Physical',20,'Colossus; Any','Damage; Discard',"Deal [X] damage. If this damages the target's HP, it discards its highest-cost card.",[('[X]','Damage',14)]),
 card(97,'Throw Weapon','Green','Attack','Self + Single Enemy','Physical',10,'Any','Damage; Discard',"Deal [X] damage. You and the target each discard [Y] cards from your hands.",[('[X]','Damage',6),('[Y]','Cards discarded',2)],
      NOTE+' Proposed: each side picks its own discards; damage added for flavor.'),
 card(98,'War Stomp','Blue','Skill','All Enemies','None',20,'Bulwark; Any','Discard; AoE',"All enemies discard 1 random card. Breaks Stealth.",[]),
 card(99,'Shatter Will','Blue','Skill','Single Enemy','None',10,'Bloodbound; Any','Exhaust; Self-harm',"Lose [X] HP. Exhaust 1 random card from the target's hand.",[('[X]','HP lost',8)],
      NOTE+' The HP cost also triggers self-harm payoffs like Blood Pact.'),
]
# rename ids: WAR-0095.. ; insert after last WAR row
pos = max(i for i,x in enumerate(ids) if x.startswith('WAR'))+1
rows = rows[:pos]+new+rows[pos:]
nlast = 5+len(rows)
for k,vals in enumerate(rows):
    r=6+k
    for c in range(1,NIN+1): ws.cell(r,c).value=vals[c-1]
    for c in PREV: ws.cell(r,c).value=Translator(base[c],origin=ws.cell(6,c).coordinate).translate_formula(ws.cell(r,c).coordinate)
    for c in range(1,56): ws.cell(r,c)._style=copy.copy(sty[c])
    ws.cell(r,17).alignment=Alignment(wrap_text=True,vertical='top'); ws.row_dimensions[r].height=42
ws.tables['CardScalingDatabase'].ref=f'A5:BC{nlast}'
wb.save(p); print(nlast)
