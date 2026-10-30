# Applies the 4-class balance pass to Draft 11 (card values and the Paladin starter deck).
import openpyxl, sys, re
p = sys.argv[1]; wb = openpyxl.load_workbook(p); ws = wb['Card Database']
CH = {  # card: [(scales keyword, new base), ...]
 'Crusader Strike': [('Damage', 12)], 'Smite': [('Damage', 14)], 'Righteous Blow': [('Damage', 8), ('Block', 8)],
 'Divine Storm': [('Damage', 12)], 'Holy Nova': [('Damage', 10), ('Heal', 8)], 'Mend Wounds': [('Heal', 8)], 'Healing Light': [('Heal', 15)],
 'Shield Bash': [('Damage', 6), ('Block', 7)], 'Bloodthirst': [('Damage', 10)], 'Whirlwind': [('Damage', 14)],
}
log = []
rows = {ws.cell(r, 2).value: r for r in range(6, ws.max_row + 1) if ws.cell(r, 4).value in ('Warrior', 'Paladin')}
for nm, changes in CH.items():
    r = rows[nm]
    for kw, nb in changes:
        done = False
        for k in range(4):
            c = 18 + 8 * k; sc = ws.cell(r, c + 1).value or ''
            if kw.lower() in sc.lower() and isinstance(ws.cell(r, c + 2).value, (int, float)):
                old = ws.cell(r, c + 2).value; ws.cell(r, c + 2).value = nb; log.append((ws.cell(r, 1).value, nm, f'{sc}: {old} -> {nb} (4-class balance sim)')); done = True; break
        if not done:
            t = ws.cell(r, 3).value
            m = re.search(r'(\d+)( HP| Holy| damage| Block)', t) if kw != 'Block' else re.search(r'(\d+)( Block)', t)
            if kw == 'Heal': m = re.search(r'(\d+)( HP)', t)
            if m: ws.cell(r, 3).value = t[:m.start(1)] + str(nb) + t[m.end(1):]; log.append((ws.cell(r, 1).value, nm, f'Text {kw}: {m.group(1)} -> {nb} (4-class balance sim)'))
            else: log.append((ws.cell(r, 1).value, nm, f'NOT FOUND {kw}'))
sd = wb['Starter Decks']
for row in sd.iter_rows(min_row=1):
    if row[0].value == 'Paladin' and row[1].value == 'Crusader Strike': row[2].value = 5; log.append(('PAL', 'Starter deck', 'Crusader Strike 4 -> 5 copies'))
    if row[0].value == 'Paladin' and row[1].value == 'Raise Shield': row[2].value = 3; log.append(('PAL', 'Starter deck', 'Raise Shield 4 -> 3 copies (more offense; Paladin was last in every sim)'))
rn = wb['Review Notes']; r0 = rn.max_row + 1
for i, (a, b, c) in enumerate(log): rn.cell(r0 + i, 1, a); rn.cell(r0 + i, 2, b); rn.cell(r0 + i, 3, c)
wb.save(p)
for l in log: print(*l, sep=' | ')
