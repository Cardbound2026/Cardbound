import openpyxl, sys, re, copy
from openpyxl.styles import Font, Alignment, PatternFill
src, out = sys.argv[1], sys.argv[2]
wb = openpyxl.load_workbook(src); ws = wb['Card Database']

def L(s): return [x.strip() for x in s.split(',')]
DT = {
'WAR': L("Physical,Physical,Physical,None,None,None,Physical,None,None,Physical,Physical,Physical,None,Physical,None,None,None,None,Physical,Physical,Physical,Physical,None,None,None,None,None,Physical,None,None"),
'ROG': L("None,None,None,Physical + Nature,Shadow,Nature,Nature,Nature,Nature,Nature,Physical,Physical,Physical,Physical,Physical,Physical,Physical,Physical,Physical,Physical,None,None,None,None,None,None,None,Shadow,None,None"),
'MAG': L("None,None,None,None,Frost,None,None,Arcane,None,None,Fire,Fire,Fire,None,None,None,None,None,Arcane,None,None,None,None,None,None,None,None,None,None,None"),
'PAL': L("Holy,Holy,Holy,Holy,Holy,None,None,None,None,Holy,None,None,None,None,Physical + Holy,None,None,None,None,None,None,None,None,None,None,None,None,None,None,None"),
}
TG = {
'WAR': L("All Enemies,Single Enemy,Self,Self + All Allies,Self,Self,Single Enemy,Self,Self,Single Enemy,Self,Self,Self,All Enemies,Self,Self,Self,Self,All Enemies,Single Enemy,Single Enemy,Single Enemy,Self,Single Enemy,All Enemies,Self,Single Enemy,Single Enemy,Self,Self"),
'ROG': L("Self,Self,Self,Self,Single Enemy,Self,Self,Single Enemy,Single Enemy,Single Enemy,Self,Single Enemy,Single Enemy,Single Enemy,Self,Single Enemy,Self,Self,Self,Self,Self,Self + Single Enemy,Self + Single Enemy,Self,Single Enemy,Self,Self,Single Enemy,Self,Self"),
'MAG': L("Self,Self,Self,Self,Single Enemy,Self,Self,Single Enemy,Self,Self,Self,Self,Single Enemy,Self,Single Enemy,Self,Self,Self,Single Enemy,Self + All Allies,Self + All Enemies,Single Enemy,Self + Single Enemy,Self,Single Enemy,Self,Self,Self,Self,Self"),
'PAL': L("Self,All Enemies,Self,All Enemies,Self,All Enemies,Single Ally,Self,Self,Self,Self,Self,Self,Self,Self,Self,Self,Self,Self,Self,Self,Self,Single Enemy,Single Enemy,Self,Self,Single Ally,Self,Single Enemy,All Allies"),
}
for k in DT: assert len(DT[k])==30 and len(TG[k])==30, k
EXHAUST_SELF = {'WAR-0005','ROG-0003','ROG-0029','MAG-0007','PAL-0027','PAL-0030'}

TYPOS = [
 (r'vulerable','Vulnerable'),(r'enemeies','enemies'),(r'enemeis','enemies'),(r'amoutn fo','amount of'),
 (r'Tripples','Triples'),(r'more then','more than'),(r'striek','strike'),(r'tot the','to the'),
 (r'next spill','next spell'),(r'acordingly','accordingly'),(r'exeed','exceed'),(r'form the target','from the target'),
 (r'form now','from now'),(r'reapeat','repeat'),(r'inteligence','Intelligence'),(r'hoyl','Holy'),
 (r'barrie generation','Barrier generation'),(r'exhuast','exhaust'),(r'vulernability','Vulnerable'),
 (r'aggrevates','aggravates'),(r'to your yourself','to yourself'),(r'unlocked attacks','unblocked attacks'),
 (r'use and attack card','use an Attack card'),(r'ice damage','Frost damage'),
 (r'burn X mana','apply X Mana Burn'),
]
def clean(cid, t):
    o = t.strip()
    t = re.sub(r'^Epic\s+(card|Card|skill card|Skill card|Skill|skill)\s*[-:]\s*', '', o)
    t = re.sub(r'^(Attack|Skill|Power|attack|skill|power)\s*[-:]\s*', '', t)
    t = re.sub(r'^Retribution aura - ', '', t)
    for a,b in TYPOS: t = re.sub(a, b, t)
    t = re.sub(r'\barmor values?\b', 'Block', t, flags=re.I)
    t = re.sub(r'\barmor\b', 'Block', t, flags=re.I)
    t = re.sub(r'\bvulnerability\b', 'Vulnerable', t, flags=re.I)
    t = re.sub(r'stacks of weakness', 'stacks of Weak', t)
    if cid.startswith('PAL'): t = re.sub(r'\bbarrier\b', 'Block', t, flags=re.I)
    t = re.sub(r'\s+', ' ', t).strip()
    t = t[0].upper() + t[1:]
    if not t.endswith(('.', ')')): t += '.'
    return t

EXTRA = {
'WAR-0004':'Main co-op tank card.',
'WAR-0006':'Ambiguous: is it damage YOUR Attacks deal, or damage enemy Attacks deal to you, that converts to Parry?',
'WAR-0010':"'Execute' needs a rule (HP threshold, or a damage number).",
'WAR-0011':'Same effect as ROG-0011 Open Veins (intended: class-specific versions).',
'ROG-0011':'Same effect as WAR-0011 Blood Clock (intended: class-specific versions).',
'WAR-0020':"Same effect as ROG-0005 Shadow's Price (intended: class-specific versions).",
'ROG-0005':'Same effect as WAR-0020 Limit Break (intended: class-specific versions).',
'WAR-0022':'Many 1-damage hits: any Defense cancels them, and 100 hits is slow to animate.',
'WAR-0025':'Applies Weak rather than dealing damage, but is typed Attack.',
'WAR-0015':'Target was Single Enemy; it buffs you, so changed to Self.',
'ROG-0003':'Immunity: check the combo with Guardian\'s Oath in co-op.',
'ROG-0029':'Immunity: check the combo with Guardian\'s Oath in co-op. Near-duplicate of ROG-0003.',
'ROG-0016':'Shurikens Exhaust when thrown, so this replays them.',
'ROG-0027':"Read 'unlocked attacks' as 'unblocked attacks'.",
'ROG-0030':'Always acts first, overriding initiative. Kept by design; enemies can have it too.',
'MAG-0005':"'Ice' changed to Frost to match the element list.",
'MAG-0008':'X needs a value.',
'MAG-0014':'Ambiguous: Burn on you, or on enemies?',
'MAG-0015':"'Add 1 exhaust to their discard pile' is unclear: a Fatigue card?",
'MAG-0018':'No mana cap: needs a ceiling or it scales forever.',
'MAG-0021':"In PvE, does 'opponent' mean all enemies?",
'MAG-0022':"Renamed 'burn X mana' to Mana Burn so it isn't confused with the fire Burn effect.",
'MAG-0029':"Needs a list of each spell's secondary effect.",
'PAL-0007':'Target was Single Enemy; it spreads buffs to allies, so changed to Single Ally.',
'PAL-0009':'X needs a value.',
'PAL-0013':'Block and Barrier are now one resource, so this card needs a new effect.',
'PAL-0014':'Now the same as PAL-0011 Shield of the Crusade except Holy instead of Physical. Fine, or differentiate.',
'PAL-0018':"'Barrier' changed to Block (Paladin's defense name).",
'PAL-0023':'X needs a value.',
'PAL-0024':'X needs a value.',
'MAG-0020':'Target was Single Enemy; it shields allies, so changed to Self + All Allies.',
}
MANADUMP = re.compile(r'(all (of )?your mana|uses all your mana|consume 50% of your mana|exhaust all your mana)', re.I)
DOUBLER = re.compile(r'\b(double|doubles|twice|tripples|triples)\b', re.I)

stats = {'text':0,'target':0,'dtype':0,'flags':0}
for r in range(6, 126):
    cid = ws.cell(r,1).value; cls = cid[:3]; i = int(cid[4:]) - 1
    orig = ws.cell(r,3).value
    new = clean(cid, orig)
    flags = []
    if re.search(r'\barmor\b', orig, re.I): flags.append('Armor renamed to Block (Armor stat was removed).')
    if re.match(r'^Epic', orig.strip()): flags.append("Text said 'Epic'; card rarity tops out at Gold, so the label was removed.")
    if MANADUMP.search(orig): flags.append('Mana-dump card: conversion rate from mana to effect still to be balanced.')
    if DOUBLER.search(orig) and not re.search(r'deals double damage|double damage', orig, re.I):
        flags.append('Doubling effect: doublers add together (two of them = 3x).')
    if cid in EXTRA: flags.append(EXTRA[cid])
    # writes
    if new != orig: ws.cell(r,3).value = new; stats['text'] += 1
    tg = TG[cls][i]
    if ws.cell(r,7).value != tg: ws.cell(r,7).value = tg; stats['target'] += 1
    ws.cell(r,8).value = DT[cls][i]; stats['dtype'] += 1
    ws.cell(r,11).value = 'Yes' if cid in EXHAUST_SELF else 'No'
    ws.cell(r,13).value = 2  # Gold cards: 2 per deck
    note = []
    if flags: note.append('Review: ' + ' '.join(flags)); stats['flags'] += 1
    if new != orig: note.append('Original text: ' + orig)
    if note: ws.cell(r,17).value = ' | '.join(note)

# rename Source header -> Rules Text (header cell + table column)
ws['C5'].value = 'Rules Text'
tbl = ws.tables['CardScalingDatabase']
tbl.tableColumns[2].name = 'Rules Text'
ws.column_dimensions['Q'].width = 70
for r in range(6,126):
    ws.cell(r,17).alignment = Alignment(wrap_text=True, vertical='top')

# summary sheet
s = wb.create_sheet('Review Notes', 0)
F = lambda **k: Font(name='Aptos', **k)
rows = [
 ('Cardbound Card Database: review notes', 'title'),
 ('Changes made by Claude on 2026-10-29. Every change is a proposal; the original text of any edited card is kept in its Design Notes column.', 'sub'),
 ('', None),
 ('What changed', 'h'),
 (f"Rules Text (column C, renamed from 'Source'): {stats['text']} cards cleaned up. Typos fixed, Attack:/Skill:/Power: prefixes removed (Card Type already says it), Armor renamed to Block, 'vulnerability' standardized to Vulnerable.", None),
 (f"Target: {stats['target']} cards filled in or corrected. All Powers target Self. 'Single Ally' can include yourself.", None),
 ('Damage Type: proposed for all 120 cards. None = the card deals no damage itself (buffs, modifiers, defense, control).', None),
 ('Exhaust: Yes on the 6 cards that exhaust themselves; No on cards that exhaust OTHER cards.', None),
 ('Deck Limit: 2 on every card (all are Gold; Gold = 2 per deck).', None),
 (f"Design Notes: review flags on {stats['flags']} cards, starting with 'Review:'. Filter column Q for 'Review' to see them all.", None),
 ('', None),
 ('Rules applied (from the design document)', 'h'),
 ('Defense is one resource with class names: Warrior Block/Parry, Rogue Dodge, Mage Barrier, Paladin Block.', None),
 ('Doubling effects add together: two "double bleed" effects make bleed 3x, not 4x.', None),
 ('Mana-dump cards (spend all mana for damage or stacks) still need a conversion rate.', None),
 ('Damage types: Bleed = Physical, Poison = Nature, Burn = Fire. Holy ignores enemy weakness and resistance.', None),
 ('', None),
 ('Not changed', 'h'),
 ('Scaling slots (what improves per rank) are still empty except Armor Nova. Previews stop at +5; upgrades go to +10.', None),
 ('Unique and Retain columns are still TBD.', None),
]
for i,(txt,kind) in enumerate(rows, start=1):
    c = s.cell(i,1,txt)
    c.font = F(bold=True, size=16) if kind=='title' else F(italic=True, color='595959') if kind=='sub' else F(bold=True, size=12) if kind=='h' else F(size=11)
    c.alignment = Alignment(wrap_text=True, vertical='top')
s.column_dimensions['A'].width = 120
wb.active = 1
wb.save(out)
print(stats)
