# Builds the card art production catalog (for generating card illustrations in ChatGPT) from the card database.
import sys, re, openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.worksheet.datavalidation import DataValidation
from openpyxl.formatting.rule import FormulaRule
from openpyxl.utils import get_column_letter as L

src, out = sys.argv[1], sys.argv[2]
db = openpyxl.load_workbook(src, data_only=True)['Card Database']
rows = [r for r in db.iter_rows(min_row=6, values_only=True) if r[0]]

# cards that exist in the playable prototype right now (art for these shows up in the game first)
PROTO = ['Strike','Defend','Shield Bash','Pommel Strike','Battle Shout','Whirlwind','Shield Up','Bloodthirst','Shield Wall','Execute','Battle Fever',
 'Stab','Evade','Slip Away','Twin Daggers','Envenom','Throwing Stars','Garrote','Blur','Hide','Evasion','Coup de Grace','Assassinate',
 'Fireball','Frostbolt','Arcane Missiles','Ice Bolt','Mana Spring','Ward','Arcane Barrage','Blizzard','Ice Barrier','Pyroblast','Prismatic Barrier','Amplify',
 'Crusader Strike','Raise Shield','Righteous Blow','Smite','Mend Wounds','Sacred Ward','Divine Storm','Healing Light','Divine Shield','Ardent Defense','Holy Nova','Lay on Hands']

BRIEF = {
 'Strike': 'The warrior mid-swing, longsword crashing down onto a bandit\'s raised shield, sparks and splinters flying',
 'Defend': 'The warrior crouched behind a dented round shield as arrows thud into it',
 'Shield Bash': 'The warrior slamming the rim of his shield into an enemy\'s face, the foe\'s head snapping back',
 'Pommel Strike': 'Close quarters: the warrior cracks his sword pommel into a helmeted soldier\'s visor',
 'Battle Shout': 'The warrior bellowing a war cry, veins standing out, embers and dust swirling around him',
 'Whirlwind': 'The warrior spinning with his sword fully extended, carving through a ring of enemies, motion trails',
 'Shield Up': 'The warrior snapping his shield up overhead just as a heavy axe comes down on it',
 'Bloodthirst': 'The warrior driving his sword into an enemy, blood spraying, a crazed grin on his scarred face',
 'Shield Wall': 'The warrior planted behind his shield as a storm of blades and arrows breaks against it',
 'Execute': 'The warrior raising his sword two-handed above a broken, kneeling enemy for the final blow',
 'Battle Fever': 'A bloodied warrior laughing through his wounds, eyes burning red, steam rising off his armor',
 'Stab': 'The rogue stepping out of shadow to thrust a dagger into a guard\'s side',
 'Evade': 'The rogue twisting sideways as a sword passes inches from her face, cloak flaring',
 'Slip Away': 'The rogue fading backwards into black smoke down a narrow alley',
 'Twin Daggers': 'The rogue lunging with both daggers crossed, two fast cuts across an enemy\'s chest',
 'Envenom': 'Close-up of the rogue\'s gloved hands tipping green poison from a vial onto a dagger blade',
 'Throwing Stars': 'The rogue mid-throw, three spinning steel stars streaking toward the viewer',
 'Garrote': 'The rogue choking a guard from behind with a wire, the guard clawing at his throat',
 'Blur': 'The rogue moving so fast she leaves smeared afterimages across the frame',
 'Hide': 'The rogue crouched in deep shadow on a rooftop ledge, only her eyes catching the light',
 'Evasion': 'The rogue flipping over a volley of arrows, perfectly calm',
 'Coup de Grace': 'The rogue standing over a fallen knight, dagger poised at the gap in his armor',
 'Assassinate': 'The rogue dropping from above onto an unaware commander, dagger plunging, purple shadow trailing',
 'Fireball': 'The mage hurling a roaring fireball from an outstretched palm toward an enemy',
 'Frostbolt': 'The mage firing a jagged shard of ice that freezes the air along its path',
 'Arcane Missiles': 'A stream of violet arcane bolts loosed from the mage\'s fingertips',
 'Ice Bolt': 'A spear of ice punching into an enemy\'s shoulder, frost spreading across his armor',
 'Mana Spring': 'The mage kneeling at a glowing blue pool as mana rises like mist into her hands',
 'Ward': 'The mage holding up a translucent circle of runes as a blade bounces off it',
 'Arcane Barrage': 'Dozens of violet arcane bolts raining down on a group of enemies from a stormy sky',
 'Blizzard': 'The mage raising her staff as a howling ice storm engulfs a group of enemies',
 'Ice Barrier': 'The mage inside a jagged dome of ice, cracks spreading where weapons strike it',
 'Pyroblast': 'The mage channeling a huge swelling sphere of fire overhead, robes whipping in the heat',
 'Prismatic Barrier': 'A shimmering shield of interlocking multicolored runes surrounding the mage',
 'Amplify': 'The mage\'s hand wrapped in spiraling runes, power building, her eyes glowing',
 'Crusader Strike': 'The paladin smashing his mace into an enemy, golden light bursting on impact',
 'Raise Shield': 'The paladin lifting a kite shield bearing a sun emblem, light glinting off its edge',
 'Righteous Blow': 'The paladin driving shield and mace forward together into a staggering foe',
 'Smite': 'A beam of holy light striking an enemy from above as the paladin points his mace',
 'Mend Wounds': 'The paladin pressing a glowing hand to a bleeding wound, light knitting the flesh',
 'Sacred Ward': 'The paladin kneeling as a golden circle of runes rises around him into a dome',
 'Divine Storm': 'The paladin spinning his mace as a ring of golden light radiates outward through enemies',
 'Healing Light': 'The paladin bathed in a warm shaft of light breaking through storm clouds, wounds closing',
 'Divine Shield': 'The paladin inside a radiant golden bubble, arrows shattering against it',
 'Ardent Defense': 'A battered paladin refusing to fall, golden aura flaring as a blade strikes his shield',
 'Holy Nova': 'An explosion of holy light radiating from the paladin, enemies thrown back',
 'Lay on Hands': 'The paladin cradling a dying ally, intense light pouring from his palms',
}
CLASSES = [
 ('Warrior', 'Rusted iron with torn red cloth', 'A scarred human mercenary in battered, rusted plate and torn red tabard, round wooden shield, notched longsword', 'Rust, steel grey, dried-blood red, leather brown'),
 ('Rogue', 'Purple and black with a hidden dagger', 'A lean hooded assassin in dark purple and black leathers, face half-masked, twin curved daggers', 'Black, deep purple, oxblood red, cold steel'),
 ('Mage', 'Blue arcane with glowing runes', 'A battle-mage in deep blue robes with tarnished gold trim, glowing rune tattoos, gnarled staff', 'Deep blue, gold, glowing cyan, parchment'),
 ('Paladin', 'Silver and gold with crosses', 'A holy knight in polished silver and gold plate, flanged mace and kite shield with a sun emblem, faint golden aura', 'Silver, gold, white, warm stone'),
]
ELEMENTS = [
 ('None', 'No elemental effect; let the action and the class palette carry the image'),
 ('Physical', 'Steel sparks, splinters, blood and dust; no magic glow'),
 ('Fire', 'Orange-red flame, embers and heat haze'),
 ('Frost', 'Pale blue ice, frost crystals and cold mist'),
 ('Arcane', 'Violet-blue glowing runes and crackling arcane energy'),
 ('Shadow', 'Inky purple-black smoke and darkness'),
 ('Holy', 'Radiant golden light and glowing sigils'),
 ('Nature', 'Green vines, thorns and toxic green spores'),
 ('Fire or Frost', 'Fire and ice colliding, orange against pale blue'),
 ('Physical + Nature', 'Steel and blood with green venom and thorns'),
 ('Physical + Holy', 'Steel impact with a burst of golden light'),
]
RAR_ORDER = {'White': 0, 'Green': 1, 'Blue': 2, 'Gold': 3}
CLS_ORDER = {c[0]: i for i, c in enumerate(CLASSES)}

def clean(name): return re.sub(r'[^A-Za-z0-9]+', '_', name).strip('_')
cards = []
for r in rows:
    prev = r[49] or ''
    m = re.match(r'^\s*(\d+)\s*Mana\s*\|\s*(.*)$', prev, re.S)
    mana, text = (int(m.group(1)), m.group(2).strip()) if m else (r[8], r[2])
    cards.append(dict(id=r[0], name=r[1], cls=r[3], rar=r[4], type=r[5], target=r[6], dtype=r[7] or 'None', mana=mana, text=text,
                      arch=r[13], tags=r[14], proto=r[1] in PROTO, brief=BRIEF.get(r[1], ''), exhaust=r[10]))
found = {c['name'] for c in cards if c['proto']}
missing = [n for n in PROTO if n not in found]
assert not missing, missing
cards.sort(key=lambda c: (0 if c['proto'] else 1, CLS_ORDER[c['cls']], RAR_ORDER[c['rar']], c['name']))

F = 'Arial'
hdr_font = Font(name=F, bold=True, color='FFFFFF', size=10); hdr_fill = PatternFill('solid', fgColor='1F2937')
body = Font(name=F, size=10); bold = Font(name=F, size=10, bold=True); inp = Font(name=F, size=10, color='0000FF')
wrap = Alignment(wrap_text=True, vertical='top'); top = Alignment(vertical='top')
edit_fill = PatternFill('solid', fgColor='FFF2CC')
thin = Side(style='thin', color='D1D5DB')

wb = openpyxl.Workbook()
# ---------- Read Me
rd = wb.active; rd.title = 'Read Me'
lines = [
 ('Cardbound card art catalog', 'title'),
 ('Every card in the card database (Draft 11), ready to drive card-illustration generation in ChatGPT. One row per card, one illustration per card.', None),
 ('', None),
 ('How to use it with ChatGPT', 'h'),
 ('1. Give ChatGPT the Style Guide tab and your approved reference image once, at the start of each chat.', None),
 ('2. Work in batches of about 10 rows. Start with Priority 1: the 47 cards already playable in the prototype, so new art shows up in the game straight away.', None),
 ('3. For each card, paste the Prompt column (it is built for you from the other columns). Save the image under the exact Art File Name.', None),
 ('4. Track progress in Status and Revision. The Summary tab counts what is done.', None),
 ('', None),
 ('Which cells to edit', 'h'),
 ('Yellow cells are yours to fill in: Art Brief, Environment, Status, Revision and Notes on the Card Catalog tab, and the text on the Style Guide, Classes and Elements tabs. Everything else is pulled from the card database or built by formula.', None),
 ('Art Brief is written for the 47 Priority 1 cards. For the rest it is blank: the prompt then asks ChatGPT to imagine a scene from the card name and rules text. Fill a brief in whenever you want more control.', None),
 ('', None),
 ('Key facts', 'h'),
 ('Card art is square (1:1, 1024 x 1024). The card frames come from the four class frames you made; the frame, name, mana gem and rules text are drawn by the game, so the art must contain no text or border.', None),
 ('File names use the card database ID (for example WAR-0001_Armor_Nova.png), so the game can match each image to its card automatically.', None),
 ('Rules text is the rank 0 text from the card database (Rank 0 Preview column). Card names and text may still change in balance passes; the art does not need to.', None),
 ('Damage type None means the card has no element (blocks, buffs, draws and similar). Those rows use the class palette only.', None),
]
for i, (t, kind) in enumerate(lines, start=1):
    c = rd.cell(i, 1, t); c.alignment = Alignment(wrap_text=True, vertical='top')
    c.font = Font(name=F, size=16, bold=True) if kind == 'title' else Font(name=F, size=11, bold=True) if kind == 'h' else body
rd.column_dimensions['A'].width = 130

# ---------- Style Guide (prompt pieces referenced by every prompt)
sg = wb.create_sheet('Style Guide')
sg['A1'] = 'Style guide: the fixed parts of every prompt'; sg['A1'].font = Font(name=F, size=14, bold=True)
sg['A2'] = 'Change these once and every prompt on the Card Catalog tab updates. Keep them the same across batches so the whole set matches.'; sg['A2'].font = body
style_rows = [
 ('Opening', 'Create a 1024x1024 square dark fantasy card illustration in the approved gritty graphic-novel style.'),
 ('Rendering', 'Heavy irregular black ink outlines, angular cel shading, weathered textures, painterly grit, realistic but stylized anatomy, muted earth-tone palette, dramatic directional lighting, cinematic action, strong readable silhouette.'),
 ('Consistency', 'Maintain a consistent visual identity with the approved reference image.'),
 ('Restrictions', 'Artwork only. No card frame, no text, no letters, no UI, no watermark. Keep the main subject centered inside the middle 80% of the image; the card window has rounded corners.'),
 ('Default environment', 'The Broken March: a war-torn borderland of muddy roads, broken palisades and smoke under a dusk sky'),
]
for i, (k, v) in enumerate(style_rows, start=4):
    sg.cell(i, 1, k).font = bold
    c = sg.cell(i, 2, v); c.font = inp; c.fill = edit_fill; c.alignment = wrap
sg.column_dimensions['A'].width = 22; sg.column_dimensions['B'].width = 120
for i in range(4, 9): sg.row_dimensions[i].height = 32

# ---------- Classes / Elements
cl = wb.create_sheet('Classes')
for j, h in enumerate(['Class', 'Card frame', 'Hero look (used in prompts)', 'Palette'], start=1):
    c = cl.cell(1, j, h); c.font = hdr_font; c.fill = hdr_fill
for i, row in enumerate(CLASSES, start=2):
    for j, v in enumerate(row, start=1):
        c = cl.cell(i, j, v); c.font = body if j == 1 else inp; c.alignment = wrap
        if j > 1: c.fill = edit_fill
for col, w in zip('ABCD', [12, 34, 80, 40]): cl.column_dimensions[col].width = w
el = wb.create_sheet('Elements')
for j, h in enumerate(['Damage type', 'Visual treatment (used in prompts)'], start=1):
    c = el.cell(1, j, h); c.font = hdr_font; c.fill = hdr_fill
for i, row in enumerate(ELEMENTS, start=2):
    el.cell(i, 1, row[0]).font = body
    c = el.cell(i, 2, row[1]); c.font = inp; c.fill = edit_fill; c.alignment = wrap
el.column_dimensions['A'].width = 20; el.column_dimensions['B'].width = 80
NC, NE = len(CLASSES) + 1, len(ELEMENTS) + 1

# ---------- Card Catalog
ws = wb.create_sheet('Card Catalog', 1)
cols = ['Priority', 'Card ID', 'Art File Name', 'Card Name', 'Class', 'Rarity', 'Card Type', 'Damage Type', 'Target', 'Mana', 'Rules Text (rank 0)',
        'Archetype (codex)', 'Mechanics', 'In Prototype', 'Art Brief (subject and action)', 'Environment', 'Hero Look', 'Element Treatment', 'Prompt (paste into ChatGPT)',
        'Status', 'Revision', 'Notes']
widths = [8, 11, 30, 22, 9, 8, 9, 12, 13, 6, 46, 18, 18, 9, 52, 30, 30, 30, 70, 12, 9, 24]
for j, (h, w) in enumerate(zip(cols, widths), start=1):
    c = ws.cell(1, j, h); c.font = hdr_font; c.fill = hdr_fill; c.alignment = Alignment(wrap_text=True, vertical='center')
    ws.column_dimensions[L(j)].width = w
ws.row_dimensions[1].height = 32
for i, cd in enumerate(cards, start=2):
    vals = [1 if cd['proto'] else 2, cd['id'], f'=B{i}&"_"&"{clean(cd["name"])}"&".png"', cd['name'], cd['cls'], cd['rar'], cd['type'], cd['dtype'], cd['target'], cd['mana'], cd['text'],
            cd['arch'], cd['tags'], 'Yes' if cd['proto'] else 'No', cd['brief'], None,
            f'=IFERROR(INDEX(Classes!$C$2:$C${NC},MATCH(E{i},Classes!$A$2:$A${NC},0)),"")',
            f'=IFERROR(INDEX(Elements!$B$2:$B${NE},MATCH(H{i},Elements!$A$2:$A${NE},0)),"")',
            ('=\'Style Guide\'!$B$4&CHAR(10)&CHAR(10)'
             f'&"SUBJECT: "&Q{i}&CHAR(10)'
             f'&"ACTION: "&IF(O{i}<>"",O{i},"Imagine one dramatic moment that shows the card "&CHAR(34)&D{i}&CHAR(34)&" ("&E{i}&" "&G{i}&"). What it does in the game: "&K{i})&CHAR(10)'
             f'&"ELEMENT: "&R{i}&CHAR(10)'
             f'&"ENVIRONMENT: "&IF(P{i}<>"",P{i},\'Style Guide\'!$B$8)&CHAR(10)'
             '&"COMPOSITION: Square 1:1, dramatic three-quarter angle, the focal action in the center of the frame."&CHAR(10)&CHAR(10)'
             '&\'Style Guide\'!$B$5&CHAR(10)&CHAR(10)&\'Style Guide\'!$B$6&CHAR(10)&CHAR(10)&\'Style Guide\'!$B$7'),
            'Not started', 0, None]
    for j, v in enumerate(vals, start=1):
        c = ws.cell(i, j, v); c.font = body; c.alignment = wrap if j in (11, 15, 16, 17, 18, 19, 22) else top
        if j in (15, 16, 20, 21, 22): c.fill = edit_fill; c.font = inp
    ws.row_dimensions[i].height = 60
last = len(cards) + 1
ws.freeze_panes = 'E2'
ws.auto_filter.ref = f'A1:{L(len(cols))}{last}'
dv = DataValidation(type='list', formula1='"Not started,In progress,Generated,Needs revision,Approved,In game"', allow_blank=True)
ws.add_data_validation(dv); dv.add(f'T2:T{last}')
for status, color in [('Approved', 'C6EFCE'), ('In game', 'A9D08E'), ('Needs revision', 'F8CBAD'), ('Generated', 'DDEBF7')]:
    ws.conditional_formatting.add(f'T2:T{last}', FormulaRule(formula=[f'$T2="{status}"'], fill=PatternFill('solid', fgColor=color)))
rarfill = {'White': 'EDEDED', 'Green': 'D9EAD3', 'Blue': 'CFE2F3', 'Gold': 'FCE5CD'}
for r, col in rarfill.items():
    ws.conditional_formatting.add(f'F2:F{last}', FormulaRule(formula=[f'$F2="{r}"'], fill=PatternFill('solid', fgColor=col)))

# ---------- Summary
sm = wb.create_sheet('Summary', 1)
sm['A1'] = 'Art progress'; sm['A1'].font = Font(name=F, size=14, bold=True)
heads = ['Class', 'White', 'Green', 'Blue', 'Gold', 'Total cards', 'Priority 1 (in prototype)', 'Approved or in game', '% done']
for j, h in enumerate(heads, start=1):
    c = sm.cell(3, j, h); c.font = hdr_font; c.fill = hdr_fill; c.alignment = Alignment(wrap_text=True, vertical='center')
CC = "'Card Catalog'"
for i, (cls, *_) in enumerate(CLASSES, start=4):
    sm.cell(i, 1, cls).font = bold
    for j, r in enumerate(['White', 'Green', 'Blue', 'Gold'], start=2):
        sm.cell(i, j, f'=COUNTIFS({CC}!$E$2:$E${last},$A{i},{CC}!$F$2:$F${last},"{r}")').font = body
    sm.cell(i, 6, f'=SUM(B{i}:E{i})').font = bold
    sm.cell(i, 7, f'=COUNTIFS({CC}!$E$2:$E${last},$A{i},{CC}!$A$2:$A${last},1)').font = body
    sm.cell(i, 8, f'=COUNTIFS({CC}!$E$2:$E${last},$A{i},{CC}!$T$2:$T${last},"Approved")+COUNTIFS({CC}!$E$2:$E${last},$A{i},{CC}!$T$2:$T${last},"In game")').font = body
    c = sm.cell(i, 9, f'=IF(F{i}=0,0,H{i}/F{i})'); c.font = body; c.number_format = '0.0%'
t = 4 + len(CLASSES)
sm.cell(t, 1, 'Total').font = bold
for j in range(2, 9): sm.cell(t, j, f'=SUM({L(j)}4:{L(j)}{t-1})').font = bold
c = sm.cell(t, 9, f'=IF(F{t}=0,0,H{t}/F{t})'); c.font = bold; c.number_format = '0.0%'
sm.cell(t + 2, 1, 'By status').font = Font(name=F, size=11, bold=True)
for k, st in enumerate(['Not started', 'In progress', 'Generated', 'Needs revision', 'Approved', 'In game'], start=t + 3):
    sm.cell(k, 1, st).font = body; sm.cell(k, 2, f'=COUNTIF({CC}!$T$2:$T${last},A{k})').font = body
sm.column_dimensions['A'].width = 16
for col in 'BCDEFGHI': sm.column_dimensions[col].width = 13
sm.row_dimensions[3].height = 30
wb.save(out)
print('cards', len(cards), 'priority 1', sum(c['proto'] for c in cards))
