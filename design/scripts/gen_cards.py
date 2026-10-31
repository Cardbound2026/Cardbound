"""Build src/cards_gen.js from the Card Database: every designed card, with engine ops for the ones whose
rules text is made only of effects the engine already supports. The rest are listed as design-only."""
import openpyxl, json, re, sys, os
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
wb = openpyxl.load_workbook(os.path.join(ROOT, 'design/Cardbound_Card_Database_Draft_11.xlsx'), read_only=True, data_only=True)
rows = list(wb['Card Database'].iter_rows(values_only=True)); H = rows[4]
DEF = r'(?:Block|Barrier|Parry|Dodge|Armor)'
EL = r'(Physical|Fire|Frost|Arcane|Shadow|Holy|Nature)'
DOT = {'bleed': 'bleed', 'burn': 'burn', 'poison': 'poison'}
DEB = {'weak': 'weak', 'vulnerable': 'vulnerable', 'slow': 'slow'}
TOKENS = {'shuriken': 'shuriken', 'shurikens': 'shuriken'}
def status(word, n, all_):
    w = word.lower()
    if w in DOT: return {'op': 'dot', 'key': DOT[w], 'n': n, 'all': all_}
    if w in DEB: return {'op': 'debuff', 'key': DEB[w], 'n': n, 'all': all_}
    if w == 'chill': return {'op': 'chill', 'n': n, 'all': all_}
    return None
def sentence(s, card):
    """one sentence -> list of ops, or None if not supported"""
    s = s.strip().rstrip('.').strip()
    if not s: return []
    low = s.lower()
    if low in ('exhaust', 'breaks stealth') or low.startswith('(holy ignores'): return []
    if low == 'retain': return [{'op': 'retain'}]
    if low == 'unplayable': return [{'op': 'unplayable'}]
    m = re.fullmatch(r'when you draw this card, (.*)', s, re.I)
    if m:
        inner = []
        for part in re.split(r',? and |, ', m.group(1)):
            o = sentence(part[0].upper() + part[1:], card)
            if o is None: return None
            inner += o
        return [{'op': 'onDraw', 'ops': inner}]
    allE = bool(re.search(r'to all enemies|all enemies', low))
    m = re.fullmatch(r'deal (\d+)(?: ' + EL + r')? damage(?: to all enemies)?(?: (\d+) times)?', s, re.I)
    if m: return [{'op': 'dmg', 'n': int(m.group(1)), 'times': int(m.group(3) or 1), 'all': allE}]
    m = re.fullmatch(r'deal (\d+)(?: ' + EL + r')? damage and apply (\d+) (\w+)(?: to all enemies)?', s, re.I)
    if m:
        st = status(m.group(4), int(m.group(3)), allE)
        return [{'op': 'dmg', 'n': int(m.group(1)), 'times': 1, 'all': allE}, st] if st else None
    m = re.fullmatch(r'deal (\d+)(?: ' + EL + r')? damage and gain (\d+) ' + DEF, s, re.I)
    if m: return [{'op': 'dmg', 'n': int(m.group(1)), 'times': 1, 'all': allE}, {'op': 'def', 'n': int(m.group(3))}]
    m = re.fullmatch(r'deal (\d+)(?: ' + EL + r')? damage(?: to all enemies)? and apply (\d+) (\w+) to all enemies', s, re.I)
    if m:
        st = status(m.group(4), int(m.group(3)), True)
        return [{'op': 'dmg', 'n': int(m.group(1)), 'times': 1, 'all': True}, st] if st else None
    m = re.fullmatch(r'apply (\d+) (\w+)(?: to (all enemies|the target))?', s, re.I)
    if m:
        st = status(m.group(2), int(m.group(1)), bool(m.group(3) and 'all' in m.group(3).lower()))
        return [st] if st else None
    m = re.fullmatch(r'gain (\d+) ' + DEF + r'(?: and (\d+) ' + DEF + r')?', s, re.I)
    if m: return [{'op': 'def', 'n': int(m.group(1)) + int(m.group(2) or 0)}]
    m = re.fullmatch(r'heal (?:yourself )?(?:for )?(\d+) hp', s, re.I)
    if m: return [{'op': 'heal', 'n': int(m.group(1)), 'party': False}]
    m = re.fullmatch(r'heal you and (?:all )?(?:your )?allies (?:for )?(\d+) hp', s, re.I)
    if m: return [{'op': 'heal', 'n': int(m.group(1)), 'party': True}]
    m = re.fullmatch(r'deal (\d+)(?: ' + EL + r')? damage twice', s, re.I)
    if m: return [{'op': 'dmg', 'n': int(m.group(1)), 'times': 2, 'all': False}]
    m = re.fullmatch(r'each hit applies (\d+) (bleed|burn|poison)', s, re.I)
    if m: return [{'op': 'perHit', 'key': m.group(2).lower(), 'n': int(m.group(1))}]
    m = re.fullmatch(r'(?:at the start of your next turn|next turn), gain (\d+) mana', s, re.I)
    if m: return [{'op': 'manaNext', 'n': int(m.group(1))}]
    m = re.fullmatch(r'next turn, draw (\d+) (?:extra|more) cards?', s, re.I)
    if m: return [{'op': 'drawNext', 'n': int(m.group(1))}]
    m = re.fullmatch(r'add (?:a|(\d+)) (dazed|stun)s? to your (discard|draw) pile', s, re.I)
    if m: return [{'op': 'selfStatus', 'key': m.group(2).lower(), 'n': int(m.group(1) or 1), 'pile': m.group(3).lower()}]
    m = re.fullmatch(r'negate the next debuff applied to you before your next turn', s, re.I)
    if m: return [{'op': 'negate'}]
    m = re.fullmatch(r'heal yourself or an ally for (\d+) hp', s, re.I)
    if m: return [{'op': 'healAlly', 'n': int(m.group(1))}]
    m = re.fullmatch(r'remove (?:all )?(\d+ )?debuffs? from yourself', s, re.I)
    if m: return [{'op': 'cleanse', 'n': int(m.group(1)) if m.group(1) else 99}]
    m = re.fullmatch(r'remove all (bleed|poison|burn)(?:,? (?:and )?(bleed|poison|burn))*(?: and (bleed|poison|burn))? from yourself', s, re.I)
    if m: return [{'op': 'cleanseDot', 'keys': [k.lower() for k in re.findall(r'bleed|poison|burn', s, re.I)]}]
    m = re.fullmatch(r"reduce the target'?s mana regeneration by (\d+) for (\d+) turns?", s, re.I)
    if m: return [{'op': 'regenDown', 'n': int(m.group(1)), 'turns': int(m.group(2))}]
    m = re.fullmatch(r'discard your hand, then draw that many cards plus (\d+)', s, re.I)
    if m: return [{'op': 'cycle', 'plus': int(m.group(1))}]
    m = re.fullmatch(r'(?:all|each) all(?:y|ies) gains? (\d+) ' + DEF, s, re.I)
    if m: return [{'op': 'allyDef', 'n': int(m.group(1))}]
    m = re.fullmatch(r'you and all allies gain (\d+) ' + DEF, s, re.I)
    if m: return [{'op': 'def', 'n': int(m.group(1))}, {'op': 'allyDef', 'n': int(m.group(1))}]
    m = re.fullmatch(r'draw (\d+) cards?', s, re.I)
    if m: return [{'op': 'draw', 'n': int(m.group(1))}]
    m = re.fullmatch(r'gain (\d+) mana', s, re.I)
    if m: return [{'op': 'mana', 'n': int(m.group(1))}]
    m = re.fullmatch(r'gain (\d+) mana next turn', s, re.I)
    if m: return [{'op': 'manaNext', 'n': int(m.group(1))}]
    m = re.fullmatch(r'gain (\d+) strength (this turn|for the rest of combat|for the fight)', s, re.I)
    if m: return [{'op': 'str', 'n': int(m.group(1)), 'combat': 'turn' not in m.group(2).lower()}]
    m = re.fullmatch(r'gain (\d+) (?:mana regeneration|mana regen) for the rest of combat', s, re.I)
    if m: return [{'op': 'regen', 'n': int(m.group(1))}]
    m = re.fullmatch(r'gain (\d+) maximum mana for the rest of combat', s, re.I)
    if m: return [{'op': 'maxMana', 'n': int(m.group(1))}]
    m = re.fullmatch(r'lose (\d+) hp', s, re.I)
    if m: return [{'op': 'loseHp', 'n': int(m.group(1))}]
    m = re.fullmatch(r'(?:enter|gain) stealth', s, re.I)
    if m: return [{'op': 'stealth'}]
    m = re.fullmatch(r'add (\d+) (shurikens?) to your hand', s, re.I)
    if m: return [{'op': 'addCard', 'key': 'shuriken', 'n': int(m.group(1))}]
    m = re.fullmatch(r"burn (\d+) of the target'?s mana", s, re.I)
    if m: return [{'op': 'burnMana', 'n': int(m.group(1))}]
    m = re.fullmatch(r"steal (\d+) (?:of the target'?s )?mana", s, re.I)
    if m: return [{'op': 'stealMana', 'n': int(m.group(1))}]
    m = re.fullmatch(r'your next attack (?:this turn )?deals double damage', s, re.I)
    if m: return [{'op': 'nextAttack', 'mult': 2}]
    m = re.fullmatch(r'your next (?:damaging )?(?:skill|spell) (?:this turn )?deals (\d+)% more damage', s, re.I)
    if m: return [{'op': 'nextSkill', 'mult': 1 + int(m.group(1)) / 100}]
    m = re.fullmatch(r'gain (\d+) initiative (?:next turn|for your next turn)', s, re.I)
    if m: return [{'op': 'init', 'n': int(m.group(1))}]
    return None
def split(text):
    t = re.sub(r'\s+', ' ', text.strip())
    parts = re.split(r'(?<=[.])\s+(?=[A-Z(])', t)
    return parts
TGT = {'Single Enemy': 'enemy', 'All Enemies': 'all', 'Self': 'self', 'Single Ally': 'self', 'Self + All Allies': 'self', 'Self + Single Enemy': 'enemy', 'All Allies': 'self'}
out, ok = [], 0
for r in rows[5:]:
    if not r[0]: continue
    d = dict(zip(H, r))
    pv = d['Rank 0 Preview'] or ''
    m = re.match(r'^(\d+) Mana \| (.*)$', pv, re.S)
    text = (m.group(2) if m else (d['Rules Text'] or '')).strip()
    cost = int(m.group(1)) if m else (d['Base Mana'] if isinstance(d['Base Mana'], (int, float)) else None)
    ops = []
    for s in split(text):
        o = sentence(s, d)
        if o is None: ops = None; break
        ops += o
    if ops is not None and any(o['op'] == 'unplayable' for o in ops) and not any(o['op'] == 'onDraw' for o in ops): ops = None
    if ops is not None and not any(o['op'] in ('dmg', 'def', 'heal', 'draw', 'mana', 'manaNext', 'str', 'regen', 'maxMana', 'dot', 'debuff', 'chill', 'stealth', 'addCard', 'burnMana', 'stealMana', 'nextAttack', 'nextSkill', 'init', 'onDraw', 'manaNext', 'drawNext', 'negate', 'healAlly', 'cleanse', 'cleanseDot', 'regenDown', 'cycle', 'selfStatus', 'allyDef') for o in ops): ops = None
    # Powers: simple ones keep their ops (applied once, then shown as an active Power); the engine's POWERS table handles the rest
    if ops is not None:  # 'each hit applies' belongs to the damage before it
        merged = []
        for o in ops:
            if o['op'] == 'perHit' and merged and merged[-1]['op'] == 'dmg': merged[-1]['perHit'] = {'key': o['key'], 'n': o['n']}
            elif o['op'] == 'perHit': merged = None; break
            else: merged.append(o)
        ops = merged
    if ops is not None: ok += 1
    tgt = TGT.get(d['Target'], 'self')
    if ops is not None and tgt == 'enemy' and not any(o['op'] in ('dmg', 'dot', 'debuff', 'chill', 'burnMana', 'stealMana', 'regenDown') and not o.get('all') for o in ops): tgt = 'self'
    if ops is not None and any(o.get('all') for o in ops) and tgt != 'enemy': tgt = 'all'
    out.append({'id': d['Card ID'], 'name': d['Card Name'], 'cls': d['Class'], 'rarity': d['Rarity'], 'type': d['Card Type'], 'target': tgt, 'targetText': d['Target'],
                'dtype': d['Damage Type'] if d['Damage Type'] and d['Damage Type'] not in ('N/A', 'None') else None, 'cost': cost, 'exhaust': str(d['Exhaust']).lower().startswith('y') or bool(re.search(r'\bExhaust\.', text)),
                'text': text, 'tags': d['Mechanic Tags'], 'codex': d['Codex Synergy'], 'ops': ops})
print(f'{ok} of {len(out)} cards playable', file=sys.stderr)
from collections import Counter
print(Counter((c['cls'], c['ops'] is not None) for c in out), file=sys.stderr)
print(Counter((c['rarity'], c['ops'] is not None) for c in out), file=sys.stderr)
if '--fails' in sys.argv:
    fails = Counter()
    for c in out:
        if c['ops'] is None and c['type'] != 'Power':
            for s in split(c['text']):
                if sentence(s, c) is None: fails[re.sub(r'\d+', 'N', s)] += 1
    for k, v in fails.most_common(60): print(v, k, file=sys.stderr)
json.dump(out, open(os.path.join(ROOT, 'design/scripts/cards_gen.json'), 'w'))
js = '// GENERATED by design/scripts/gen_cards.py from Cardbound_Card_Database_Draft_11.xlsx. Do not edit by hand.\n// Every designed card; ops = engine effects for cards the engine can play, null for design-only cards.\n'
js += '(function (r) { const D = ' + json.dumps(out, separators=(',', ':')) + ';\nif (typeof module !== \'undefined\' && module.exports) module.exports = D; else r.CB_CARDS_GEN = D; })(typeof window !== \'undefined\' ? window : globalThis);\n'
open(os.path.join(ROOT, 'src/cards_gen.js'), 'w').write(js)
