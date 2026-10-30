import openpyxl, sys, re, math, collections
src, out = sys.argv[1], sys.argv[2]
wb = openpyxl.load_workbook(src); ws = wb['Card Database']
SLOTS = [18, 26, 34, 42]  # token col for each slot; +1 scales, +2 base, +3 change, +4 method, +5 min, +6 max, +7 unit
RATIO = {'Mana per hit','Vulnerable per Strength','Burn stacks per Initiative','Burn stacks per Intelligence','Missing mana per bonus',
         'Missing HP per bonus (%)','Dodge per 1% crit','Mana per bonus damage','Mana per card','Block per Burn','Missing HP per bonus'}
DOWNSIDE = re.compile(r'HP lost|Mana lost|Extra mana cost|Extra cost|Turns', re.I)
DUR = re.compile(r"for (the next )?\d+ turns|next \d+ turns|for 2 turns|until the end of (its|your) next turn", re.I)
stats = collections.Counter(); nogrow = []
for r in range(6, ws.max_row+1):
    if not ws.cell(r,1).value: continue
    rar = ws.cell(r,5).value; mana = ws.cell(r,9).value or 0; text = ws.cell(r,3).value or ''
    rate = 0.10 if rar in ('White','Green') else 0.08
    grows = False; used = []; notes = []
    for t in SLOTS:
        lab, base, chg = ws.cell(r,t+1).value, ws.cell(r,t+2).value, ws.cell(r,t+3).value
        if lab is None and base is None: continue
        used.append(t)
        if chg not in (None, ''):          # keep values the designer already set (e.g. Armor Nova)
            if (chg or 0) > 0: grows = True
            continue
        if not isinstance(base,(int,float)) or lab == 'Mana Cost': continue
        if lab in RATIO or DOWNSIDE.search(lab or ''):
            ws.cell(r,t+3).value = 0; continue
        if '%' in (lab or ''):
            c = max(1, round(base*0.05)); ws.cell(r,t+3).value = c; ws.cell(r,t+6).value = 100; grows = True
            notes.append(f"{lab} +{c} per rank"); continue
        if base < 8:
            ws.cell(r,t+3).value = 0; continue
        c = max(1, round(base*rate)); ws.cell(r,t+3).value = c; grows = True
        notes.append(f"{lab} +{c} per rank")
    add_cost = (not grows and mana > 0) or (mana >= 30)
    if add_cost:
        free = next((t for t in SLOTS if t not in used), None)
        if free:
            ws.cell(r,free+1).value = 'Mana Cost'; ws.cell(r,free+2).value = mana; ws.cell(r,free+3).value = -1
            ws.cell(r,free+5).value = math.ceil(mana*0.6); grows = True
            notes.append(f"mana cost -1 per rank (floor {math.ceil(mana*0.6)})"); stats['cost'] += 1
    if DUR.search(text): notes.append('+1 turn of duration at +5 and +10'); stats['duration'] += 1; grows = True
    if not grows: nogrow.append(ws.cell(r,2).value); notes.append('No numeric scaling yet: needs a design decision')
    else: stats['grows'] += 1
    q = ws.cell(r,17).value or ''
    ws.cell(r,17).value = (q + ' | ' if q else '') + 'Upgrades: ' + '; '.join(notes) + '.'
wb.save(out)
print(dict(stats), 'no growth:', len(nogrow), nogrow)
