import openpyxl, sys, re
p = sys.argv[1]
wb = openpyxl.load_workbook(p); ws = wb['Card Database']
row = {ws.cell(r,1).value: r for r in range(6,126)}
TEXT = {
 'WAR-0006': "Damage your Attacks deal this turn is also added to your Parry.",
 'MAG-0008': "Exhaust all status cards in your hand and deal 10 damage per card exhausted.",
 'MAG-0014': "Convert all Burn on the target into Barrier for you.",
 'MAG-0015': "Exhaust the Burn on the target, destroy that much of its mana, and add 1 Fatigue to its discard pile per 10 Burn.",
 'MAG-0021': "Mana costs for you and the target are increased by 50%.",
 'PAL-0011': "Physical damage generates Block.",
 'PAL-0013': "Generating Block increases your next Barrier generation by 50%.",
 'PAL-0014': "Holy damage generates Barrier.",
 'PAL-0018': "Converts all sources of Burn into Barrier.",
}
TARGET = {'MAG-0014': 'Single Enemy', 'MAG-0021': 'Self + Single Enemy'}
# notes: (remove substrings, add text)
RESOLVED = {
 'WAR-0006': "Resolved: damage you deal with Attacks is added to Parry.",
 'WAR-0010': "Resolved: 'execute' is flavor for a big hit; damage value still to set.",
 'ROG-0003': "Resolved: immunity combo question dropped.",
 'ROG-0029': "Resolved: immunity combo question dropped. Near-duplicate of ROG-0003.",
 'MAG-0008': "Resolved: 10 damage per card.",
 'MAG-0014': "Resolved: converts Burn on an enemy target.",
 'MAG-0015': "Resolved: adds Fatigue. Open: Fatigue definition (1 damage while in hand vs. 0-cost dead card).",
 'MAG-0021': "Resolved: single target.",
 'MAG-0029': "REMINDER: needs the basic White spells (Frostbolt, Fireball, etc.) and their secondary effects, which are not written yet.",
 'PAL-0011': "Wording fixed.",
 'PAL-0013': "Resolved: Paladin generates both Block and Barrier from different cards; they behave the same.",
 'PAL-0014': "Resolved: Holy damage creates Barrier (PAL-0011 is the Physical/Block version).",
 'PAL-0018': "Resolved: stays Barrier.",
}
CONV = "Mana-dump card: conversion rate from mana to effect still to be balanced."
CONV_NEW = "Conversion: 1 mana = 1 damage (or 1 stack / 1 HP), same scale as cards (10 mana is about 10 damage)."
def split(note):
    rv, orig = '', ''
    for part in (note or '').split(' | '):
        if part.startswith('Review: '): rv = part[8:]
        elif part.startswith('Original text: '): orig = part
    return rv, orig
DROP = ["Ambiguous: is it damage YOUR Attacks deal, or damage enemy Attacks deal to you, that converts to Parry?",
 "'Execute' needs a rule (HP threshold, or a damage number).",
 "Immunity: check the combo with Guardian's Oath in co-op. Near-duplicate of ROG-0003.",
 "Immunity: check the combo with Guardian's Oath in co-op.",
 "X needs a value.", "Ambiguous: Burn on you, or on enemies?",
 "'Add 1 exhaust to their discard pile' is unclear: a Fatigue card?",
 "In PvE, does 'opponent' mean all enemies?", "Needs a list of each spell's secondary effect.",
 "Block and Barrier are now one resource, so this card needs a new effect.",
 "Now the same as PAL-0011 Shield of the Crusade except Holy instead of Physical. Fine, or differentiate.",
 "'Barrier' changed to Block (Paladin's defense name)."]
for cid, r in row.items():
    q = ws.cell(r,17).value
    rv, orig = split(q)
    if cid in TEXT: ws.cell(r,3).value = TEXT[cid]
    if cid in TARGET: ws.cell(r,7).value = TARGET[cid]
    if cid == 'PAL-0009' or cid in ('PAL-0023','PAL-0024'): pass  # X still open
    else:
        for d in DROP: rv = rv.replace(d, '')
    rv = rv.replace(CONV, CONV_NEW)
    if cid in RESOLVED: rv = (rv + ' ' + RESOLVED[cid])
    rv = re.sub(r'\s+', ' ', rv).strip()
    parts = (['Review: ' + rv] if rv else []) + ([orig] if orig else [])
    ws.cell(r,17).value = ' | '.join(parts) if parts else None
# Review Notes sheet update
s = wb['Review Notes']
for r in range(1, s.max_row+1):
    v = s.cell(r,1).value or ''
    if v.startswith('Defense is one resource'):
        s.cell(r,1).value = 'Defense is one resource with class names: Warrior Block/Parry, Rogue Dodge, Mage Barrier, Paladin Block and Barrier (from different cards). All behave the same.'
    if v.startswith('Mana-dump cards'):
        s.cell(r,1).value = 'Mana-dump cards convert 1 mana = 1 damage (or 1 stack / 1 HP). Strength adds +1 damage per point to Attacks, so a 10-mana card is about 10 damage.'
wb.save(p)
for cid in ['WAR-0006','WAR-0019','MAG-0015','PAL-0013','PAL-0009']:
    print(cid, ws.cell(row[cid],3).value, '||', ws.cell(row[cid],17).value)
