import openpyxl, sys, re
p = sys.argv[1]
wb = openpyxl.load_workbook(p); ws = wb['Card Database']
row = {ws.cell(r,1).value: r for r in range(6,126)}
# cid: (text, [(token, scales, base)], note)
V = {
'WAR-0008': ("When you fully Parry an attack, apply [X] Vulnerable to the attacker.", [('[X]','Vulnerable applied',10)], "First pass: 10 Vulnerable (+10% damage taken)."),
'WAR-0010': ("If you have parried this turn, execute the target, dealing [X] damage.", [('[X]','Damage',45)], "First pass: 45 damage, 1.5x a normal 30-mana card because it needs a parry first."),
'WAR-0015': ("If an enemy has attacked you this turn, gain [X] Strength and [Y] Stamina for the rest of combat.", [('[X]','Strength gained',2),('[Y]','Stamina gained',2)], "First pass: +2 Strength (+2 damage per hit) and +2 Stamina."),
'WAR-0027': ("Aggravate the Bleed on the target, applying [X] Vulnerable per stack of Bleed.", [('[X]','Vulnerable per Bleed stack',1)], "First pass: 1 Vulnerable per Bleed stack."),
'ROG-0016': ("Throw all Shurikens in your exhaust pile at the target.", [], "Shuriken token proposed: 0 cost, 4 damage, Exhausts when played (Ninja codex adds +4)."),
'ROG-0025': ("Exhaust the target's hand. Add a Dazed to your draw pile for every card exhausted.", [], "Fatigue renamed Dazed (status card)."),
'MAG-0005': ("Pull a comet from the sky: consume all your mana and deal that much Frost damage.", [], "First pass: 1 mana = 1 Frost damage, like the other mana-dump cards."),
'MAG-0009': ("Every Skill you play adds a Dazed to your discard pile and to the target's.", [], "Fatigue renamed Dazed (status card). Card name may want a rename."),
'MAG-0010': ("If you are the first to attack this turn, draw [X] extra cards.", [('[X]','Extra cards drawn',2)], "First pass: 2 extra cards."),
'MAG-0019': ("Expend your Barrier and deal damage equal to the Barrier expended.", [], "First pass: 1:1, matching Crushing Bastion and Parry Reversal."),
'MAG-0025': ("Steal [X] Initiative from the target for the rest of combat.", [('[X]','Initiative stolen',5)], "First pass: steal 5 Initiative."),
'PAL-0002': ("Expend your Block, dealing Holy damage equal to [X]% of it to all enemies.", [('[X]','Block converted to damage (%)',20)], "First pass: 20%, matching Armor Nova (AoE Block payoff)."),
'PAL-0009': ("Cleansing a debuff heals you for [X] HP per stack removed.", [('[X]','HP per stack',2)], "First pass: 2 HP per stack."),
'PAL-0019': ("Gain 1 Initiative per [X] stacks of Burn on the target.", [('[X]','Burn stacks per Initiative',5)], "First pass: 1 Initiative per 5 Burn."),
'PAL-0020': ("Gain 1 Intelligence per [X] stacks of Burn on the target.", [('[X]','Burn stacks per Intelligence',3)], "First pass: 1 Intelligence per 3 Burn (+1 damage per Skill hit)."),
'PAL-0023': ("Take [X] mana from the target and add it to yours.", [('[X]','Mana taken',20)], "First pass: 20 mana (costs 15, so +5 for you and -20 for them)."),
'PAL-0024': ("Exhaust [X] cards from the target's hand.", [('[X]','Cards exhausted',2)], "First pass: 2 cards."),
'PAL-0025': ("Each turn you do not play an Attack card, add a Dazed to the target's discard pile.", [], "Fatigue renamed Dazed (status card)."),
}
SLOTS = [(18,19,20), (26,27,28)]
for cid,(txt,toks,note) in V.items():
    r = row[cid]
    ws.cell(r,3).value = txt
    for (tc,sc,bc),(tok,scl,base) in zip(SLOTS, toks):
        ws.cell(r,tc).value = tok; ws.cell(r,sc).value = scl; ws.cell(r,bc).value = base
    q = ws.cell(r,17).value or ''
    q = q.replace('X needs a value.', '').replace('Review:  ', 'Review: ')
    if q.startswith('Review: '):
        head, _, rest = q.partition(' | ')
        head = (head.rstrip() + ' ' + note).replace('Review: Review:', 'Review:')
        q = head + (' | ' + rest if rest else '')
    else:
        q = 'Review: ' + note + (' | ' + q if q else '')
    ws.cell(r,17).value = re.sub(r'\s+', ' ', q).strip()
wb.save(p)
