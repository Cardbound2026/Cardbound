# Draft 11: primary stats are percentages now, so stat-granting cards scale x10; mana values snap to the 10-mana scale.
import openpyxl, sys, re
src, out = sys.argv[1], sys.argv[2]
wb = openpyxl.load_workbook(src); ws = wb['Card Database']
STAT = re.compile(r'(Strength|Intelligence|Dexterity|Stamina|Stat gain)', re.I)
log = []
def pct(r): return 0.08 if ws.cell(r,5).value in ('Blue','Gold') else 0.10
for r in range(6, ws.max_row+1):
    if not ws.cell(r,1).value: continue
    for k in range(4):
        c = 18 + 8*k
        sc, base = ws.cell(r,c+1).value, ws.cell(r,c+2).value
        if sc and STAT.search(sc) and 'per' not in sc.lower() and isinstance(base,(int,float)):
            nb = base*10; ws.cell(r,c+2).value = nb; ws.cell(r,c+3).value = max(1, round(nb*pct(r)))
            log.append((ws.cell(r,1).value, ws.cell(r,2).value, f'{sc}: {base} -> {nb} (+{ws.cell(r,c+3).value} per rank)'))
TEXT = {
 'Battle Fever': [('has attacked you this turn','has attacked you this round')],
 'Ruthless Conversion': [('Gain 1 Strength for every','Gain 10 Strength for every')],
 'Burning Wisdom': [('Gain 1 Intelligence per','Gain 10 Intelligence per')],
 'Adrenaline Surge': [('It decreases by 1 at the start','It decreases by 10 at the start')],
}
MANA = {'Quartermaster': ('gain [X] mana', 5), 'Draining Venom': ('regeneration by [Y]', 5), 'Arcane Bolt': ('Burn [Y]', 10),
        'Frostbolt': ('regeneration by [Y]', 5), 'Arcane Missiles': ('Steal [Y]', 5), 'Sapping Light': ('regeneration by [Y]', 5)}
for r in range(6, ws.max_row+1):
    nm = ws.cell(r,2).value
    for a,b in TEXT.get(nm, []):
        if a in (ws.cell(r,3).value or ''):
            ws.cell(r,3).value = ws.cell(r,3).value.replace(a,b); log.append((ws.cell(r,1).value, nm, f'Text: "{a}" -> "{b}"'))
    if nm in MANA:
        new = MANA[nm][1]
        for k in range(4):
            c = 18 + 8*k; sc = (ws.cell(r,c+1).value or '').lower()
            if any(w in sc for w in ('mana','regen')) and 'cost' not in sc and isinstance(ws.cell(r,c+2).value,(int,float)):
                old = ws.cell(r,c+2).value; ws.cell(r,c+2).value = new
                log.append((ws.cell(r,1).value, nm, f'{ws.cell(r,c+1).value}: {old} -> {new} (mana works in steps of 10; values under 5 barely register)'))
# review notes
rn = wb['Review Notes']; r0 = rn.max_row + 2
rn.cell(r0,1,'Draft 11 changes (percentage stats and prototype findings)').font = openpyxl.styles.Font(name='Arial', bold=True, size=12)
for i,(cid,nm,txt) in enumerate(log):
    rn.cell(r0+1+i,1,cid); rn.cell(r0+1+i,2,nm); rn.cell(r0+1+i,3,txt)
wb.save(out)
for l in log: print(*l, sep=' | ')
print(len(log),'changes')
