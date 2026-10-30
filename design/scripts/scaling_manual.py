import openpyxl, sys
p = sys.argv[1]
wb = openpyxl.load_workbook(p); ws = wb['Card Database']
DUMP = '+5% conversion per rank (mana to damage, stacks or healing): 150% at +10'
STEP = '+1 at +3, +6 and +9'
M = {
 'Limit Break':DUMP, "Shadow's Price":DUMP, 'Falling Star':DUMP, 'Venom Flood':DUMP, 'Crimson Deluge':DUMP,
 'Phantom Strike':DUMP, 'Mana Scorch':DUMP, 'Divine Communion':DUMP,
 'Thousand Cuts':'+1 damage per hit at +5 and +10', 'Scorched Plans':'cards exhausted from the enemy +1 at +5 and +10',
 'Cut the Strings':'mana per card drops by 2 per rank (floor 10)',
 'Reckless Abandon':'bonus cards +1 at +5 and +10', 'All In':'bonus cards +1 at +5 and +10', 'Fall Back':'+1 extra card at +5 and +10',
 'Kick Aside':'Block '+STEP, 'Toss Aside':'Dodge '+STEP, 'Disenchant':'Barrier '+STEP, 'Cleansing Breath':'Barrier '+STEP,
 'Bloodlust':'Strength '+STEP, 'Cold Blooded':'Strength '+STEP, 'Dispelling Strike':'damage '+STEP, 'Spark':'damage '+STEP,
 'Brace for Impact':'Block and mana '+STEP, 'Tumble':'Dodge and mana '+STEP, 'Shield of Faith':'Block and mana '+STEP,
 'Quickstep':'Initiative '+STEP, 'Morning Prayer':'Devotion '+STEP, 'Penance':'Block and Barrier '+STEP,
}
REPLAY = {'Double Strike','Shadow Echo','Presence of Mind','Divine Favor'}
done = 0
for r in range(6, ws.max_row+1):
    n = ws.cell(r,2).value
    if n in REPLAY:
        for t in (18,26,34,42):
            if ws.cell(r,t+1).value == 'Extra mana cost':
                ws.cell(r,t+3).value = -1; ws.cell(r,t+5).value = 0
        rule = 'extra mana cost -1 per rank (free at +10)'
    elif n == 'Cut the Strings':
        for t in (18,26,34,42):
            if ws.cell(r,t+1).value == 'Mana per card': ws.cell(r,t+3).value = -2; ws.cell(r,t+5).value = 10
        rule = M[n]
    elif n in M: rule = M[n]
    else: continue
    q = ws.cell(r,17).value
    ws.cell(r,17).value = q.replace('No numeric scaling yet: needs a design decision', rule); done += 1
s = wb['Review Notes']; st = s.max_row + 2
from openpyxl.styles import Font, Alignment
lines = [('Draft 10: upgrade scaling (+1 to +10)',1),
 ('Big numbers grow: tokens of 8 or more gain 10% of base per rank (White, Green) or 8% (Blue, Gold), so +10 is roughly double.',0),
 ('Percentages grow by 5% of base per rank, capped at 100.',0),
 ('Small-number cards get cheaper: if nothing on the card grows (or it costs 30+), mana cost drops by 1 per rank, down to 60% of base.',0),
 ('Durations: effects that last a number of turns gain +1 turn at +5 and +10. Small fixed values on 0-cost cards gain +1 at +3, +6 and +9.',0),
 ('Mana-dump cards convert 5% better per rank; replay cards lose 1 extra mana cost per rank. Downsides (HP lost, extra cost) never grow.',0),
 ('Rank previews in columns AX to BC show base to +5; the same rates continue to +10. Each card\'s Design Notes list its exact upgrade path.',0)]
for i,(t,h) in enumerate(lines):
    c=s.cell(st+i,1,t); c.font=Font(name='Aptos',bold=bool(h),size=12 if h else 11); c.alignment=Alignment(wrap_text=True,vertical='top')
wb.save(p); print('manual rules', done)
