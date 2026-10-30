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
# retags
W['Disarm'][13]='Any'; W['Disarm'][16]=(W['Disarm'][16] or '')+' Retagged: Disarm stops enemy Attacks, which works against Riposte.'
W['Pummel'][16]=(W['Pummel'][16] or '')+' Note: discarding enemy Attacks works against Riposte.'
# round wording
dr=W['Decisive Reprisal']; dr[2]="If you have parried this round, execute the target, dealing [X] damage."
dr[16]=(dr[16] or '')+" Wording: 'this turn' changed to 'this round' (Riposte acts after enemies)."
N='New (designer request). Codex Synergy is affinity, not ownership.'
def card(name,rar,typ,tgt,dt,mana,syn,tags,text,toks,note=N):
    r=[None]*NIN
    r[1]=name; r[2]=text; r[3]='Warrior'; r[4]=rar; r[5]=typ; r[6]=tgt; r[7]=dt; r[8]=mana
    r[9]='No'; r[10]='No'; r[11]='No'; r[12]=POOL[rar]; r[13]=syn; r[14]=tags; r[15]='Draft'; r[16]=note
    for (tc,sc,bc),(tok,lab,b) in zip([(18,19,20),(26,27,28)],toks): r[tc-1]=tok; r[sc-1]=lab; r[bc-1]=b
    return r
new=[
 card('Riposte','White','Skill','Self','Physical',10,'Riposte','Parry; Retaliate',"Gain [X] Parry. The next attack you fully parry before your next turn takes [Y] damage back.",[('[X]','Parry',6),('[Y]','Retaliate damage',8)]),
 card('Challenging Roar','Green','Skill','Self','None',10,'Riposte; Bulwark','Parry; Taunt',"Gain [X] Parry. Enemies must target you until the end of your next turn.",[('[X]','Parry',8)]),
 card('Read the Blade','Green','Skill','Single Enemy','None',10,'Riposte','Parry',"Gain Parry equal to the damage of the target's next Attack.",[]),
 card('Jarring Parry','Green','Skill','Self','None',20,'Riposte','Parry; Status Cards',"Gain [X] Parry. If you fully parry an attack before your next turn, add 1 Dazed to the attacker's draw pile.",[('[X]','Parry',20)]),
 card('Bait','Blue','Skill','Self','None',10,'Riposte','Parry; Vulnerability; Discard',"Gain [X] Parry. The next enemy that attacks you before your next turn gains [Y] Vulnerable and discards 1 card.",[('[X]','Parry',12),('[Y]','Vulnerable',20)]),
 card('Partial Guard','Blue','Power','Self','None',20,'Riposte','Parry',"Parrying part of an attack counts as a full parry for your cards.",[]),
 card('Defiant Roar','Blue','Skill','Self','None',20,'Riposte; Bulwark','Taunt; AoE; Damage reduction',"Until the end of your next turn, all enemies must target you, and you take [X]% less damage.",[('[X]','Damage reduction (%)',10)]),
 card('Unnerving Guard','Blue','Skill','Self','None',20,'Riposte','Parry; Status Cards',"Gain [X] Parry. Each attack you fully parry before your next turn adds a Hex to the attacker's draw pile.",[('[X]','Parry',15)],N+' Hex: while in hand, the holder\'s other cards cost +10 mana.'),
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
