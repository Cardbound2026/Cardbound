# Builds src/card_upgrades.js: how every card grows per upgrade level (+1..+10).
# Rules: design/Cardbound_Card_Upgrades.xlsx (the user's Warrior list, the "+" accepted suggestions and the written-in answers).
# Usage (repo root): python3 design/scripts/card_upgrades.py emit
import json, re, sys, collections, subprocess, os
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
A = json.loads(subprocess.check_output(['node', '-e', "const CB=require('./src/engine.js');const C=CB.CARDS;const o=[];for(const k in C){const d=C[k];if(!d.cls||d.designOnly||!['White','Green','Blue','Gold'].includes(d.rarity))continue;o.push({key:k,name:d.name,cls:d.cls,rarity:d.rarity,type:d.type,cost:d.cost,target:d.target,text:d.text})}console.log(JSON.stringify(o))"], cwd=ROOT))

DT = r'(?:(?:Physical|Holy|Arcane|Frost|Fire|Nature|Shadow) )?'
def per(n, div, mn=1): return max(mn, round(n / div))
STAT = {'Strength': 'str', 'Intelligence': 'int', 'Dexterity': 'dex', 'Spirit': 'spi', 'Stamina': 'sta'}

def classify(t, m):
    """kind, step, every for the number token m (a re match of \\d+%?)"""
    s, e = m.start(), m.end(); n = int(m.group(1)); pct = m.group(2) == '%'
    after = t[e:e + 40]; before = t[max(0, s - 24):s]
    if pct:
        if re.search(r'(below|above|under|over|least|than|up to|max)\s*$', before): return None
        if re.match(r' chance', after): return ('pct', max(2, round(n / 10)), 1)
        return ('pct', max(2, round(n / 10)), 1)
    if re.search(r'([Ll]ose|[Pp]ay|costs?|[Tt]ake|takes)\s*$', before) and re.match(r' (HP|health|more mana|mana)', after): return None
    if re.search(r'(below|above|under|over|least|than|first|every|per|each|up to|max|maximum of|than|to)\s*$', before) and not re.match(r' ' + DT + r'damage|( \w+)? (Block|Barrier|Dodge|Parry)', after): return None
    if re.match(r' ' + DT + r'damage back', after) or re.match(r' damage back', after): return ('back', per(n, 8), 1)
    if re.match(r' (more |extra |bonus )' + DT + r'damage', after) or re.search(r'(deal|deals) $', before) and re.match(r' more', after): return ('dmg', per(n, 7), 1)
    if re.search(r'([Dd]eals?|for) $', before) and re.match(r' instead', after): return ('dmg', per(n, 7), 1)
    if re.match(r' ' + DT + r'damage', after):
        return ('dmg', 1, 2) if n <= 2 else ('dmg', per(n, 7), 1)
    mm = re.match(r' (Block|Barrier|Dodge|Parry)\b', after)
    if mm:
        if re.search(r'[Rr]emoves?\s*$|[Rr]emoving\s*$|[Ss]trips?\s*$', before): return ('shred', per(n, 7), 1)
        return ('def', per(n, 7), 1)
    mm = re.match(r' (Bleed|Poison|Burn)\b', after)
    if mm: return (mm.group(1).lower(), 1, 2) if n <= 3 else (mm.group(1).lower(), per(n, 6), 1)
    mm = re.match(r' (Vulnerable|Weak|Slow|Chill|Unwarded|Condemnation|Exposure|Frostbite)\b', after)
    if mm: return (mm.group(1).lower(), 1, 2) if n <= 3 else (mm.group(1).lower(), per(n, 10), 1)
    mm = re.match(r' (Strength|Intelligence|Dexterity|Spirit|Stamina)\b', after)
    if mm: return (STAT[mm.group(1)], per(n, 10), 1)
    if re.match(r' maximum mana', after) or re.match(r' max mana', after): return ('maxMana', 2, 1)
    if re.match(r' mana regen', after): return ('regen', per(n, 10), 1)
    if re.match(r' (more |extra )?mana', after) and re.search(r'([Gg]ain|gains|[Rr]estore|restores|back|[Rr]efund|[Gg]ive|gives)\s*$', before): return ('mana', per(n, 10), 1)
    if re.match(r' (HP|health)', after) and re.search(r'([Hh]eal|heals|[Rr]estore|restores|[Gg]ain|gains|for|recover)\s*$', before): return ('heal', per(n, 6), 1)
    if re.match(r' Initiative', after): return ('init', 1, 1)
    if re.match(r' Thorns', after): return ('thorns', 1, 1)
    if re.match(r' Devotion', after) and re.search(r'([Gg]ain|gains|[Gg]ive)\s*$', before): return ('devotion', 1, 2)
    # milestones
    if re.match(r' (random )?cards? from (the|its|their|the target.s)', after) or re.match(r' (random )?cards?', after) and re.search(r'(discards?|[Ee]xhaust)\s*$', before): return ('ms_count', 0, 0)
    if re.match(r' (extra |more )?cards?\b', after) and re.search(r'([Dd]raws?|[Dd]raw|fewer|[Dd]raw an extra)\s*$', before): return ('ms_draw', 0, 0)
    if re.match(r' (extra |more )?cards? (next|from|at)', after) and not re.search(r'[Dd]iscard', before): return ('ms_draw', 0, 0)
    if re.match(r' times\b', after): return ('ms_hits', 0, 0)
    if re.match(r' (turns|rounds)\b', after) and re.search(r'(for|next|over|the next)\s*$', before): return ('ms_turns', 0, 0)
    if re.match(r' random cards?', after): return ('ms_count', 0, 0)
    if re.match(r' (Shurikens?|Dazed)', after): return ('ms_count', 0, 0)
    return None

def tokens(t):
    out = []
    for m in re.finditer(r'(?<![\w.])(\d+)(%?)(?![\w])', t):
        k = classify(t, m)
        if int(m.group(1)) == 0: k = None
        out.append([int(m.group(1)), m.start(), m.start() + len(m.group(1)), k])
    return out

def generic(c):
    """structured default spec, mirroring the rules the workbook suggested"""
    t = c['text']; toks = tokens(t)
    scal = [x for x in toks if x[3] and not x[3][0].startswith('ms_')]
    ms = [x for x in toks if x[3] and x[3][0].startswith('ms_')]
    spec = {'toks': [], 'cost': 0, 'ratio': 0}
    # "draw a card" with no digit
    if not any(x[3][0] == 'ms_draw' for x in ms) and re.search(r'[Dd]raw a card', t): spec['drawWord'] = 1
    if re.search(r'ticks? twice|twice as|play(?:ed|s)? twice', t) is None and re.search(r'\btwice\b', t): spec['twice'] = 1
    allof = re.search(r'equal to|all of your|all your|that much|for every|for each', t)
    for x in toks:
        if x[3]: spec['toks'].append({'i': x[1], 'j': x[2], 'n': x[0], 'k': x[3][0], 's': x[3][1], 'e': x[3][2]})
    if not scal:
        if allof and c['cost'] is not None: spec['ratio'] = 5
        elif c['cost'] is None: pass
        elif c['cost'] >= 20: spec['cost'] = 1
        elif c['cost'] >= 10: spec['cost'] = 2
        elif not ms and not spec.get('drawWord'): spec['free'] = 1   # free card with nothing to grow: draw 1 at +5, 2 at +10
    return spec

out = {}
for c in A:
    out[c['key']] = generic(c)
cnt = collections.Counter()
for k, s in out.items():
    for x in s['toks']: cnt[x['k']] += 1
    if s['cost']: cnt['cost' + str(s['cost'])] += 1
    if s['ratio']: cnt['ratio'] += 1
    if s.get('free'): cnt['free'] += 1
    if not s['toks'] and not s['cost'] and not s['ratio'] and not s.get('free') and not s.get('drawWord') and not s.get('twice'): cnt['NOTHING'] += 1
print(cnt)

def finalize(c, s):
    """pct tokens on non-Power cards ride on the effect they size (damage / Block / healing / mana); others stay fixed"""
    t = c['text']; toks = []
    kinds = {x['k'] for x in s['toks']}
    for x in s['toks']:
        if x['k'] == 'pct' and c['type'] != 'Power' and c['key'] in KEEP_PCT: toks.append(x); continue
        if x['k'] == 'pct' and c['type'] != 'Power':
            tail = t[x['j']:x['j'] + 60]
            to = None
            if re.match(r'%? (less|reduced|chance|Critical|crit)', tail) or 'reduced by' in t[max(0, x['i'] - 30):x['i']]: to = None
            elif re.search(r'damage', t) and 'dmg' not in kinds and re.match(r'%? (more )?(damage|of (your|all damage|the damage))', tail) and re.search(r'[Dd]eal|damage equal|dealing', t): to = 'dmg'
            elif re.search(r'(Block|Barrier|Dodge|Parry) equal', t) and 'def' not in kinds and re.match(r'%? of your', tail): to = 'def'
            elif re.search(r'[Hh]eal (you|yourself|for|all)', t) and 'heal' not in kinds and re.match(r'%? of', tail): to = 'heal'
            if not to: continue
            x = dict(x, k=to); kinds.add(to)
        toks.append(x)
    s['toks'] = toks
    scal = [x for x in toks if not x['k'].startswith('ms_')]
    if not scal and not s['ratio'] and not s['cost'] and not s.get('free') and c['cost'] is not None:
        if c['cost'] >= 20: s['cost'] = 1
        elif c['cost'] >= 10: s['cost'] = 2
        elif not any(x['k'] == 'ms_draw' for x in toks) and not s.get('drawWord'): s['free'] = 1
    return s

def emit(specs, path):
    D = {}
    for k, s in specs.items():
        o = {}
        if s['toks']: o['t'] = [[x['i'], x['j'], x['n'], x['k'], x['s'], x['e']] for x in s['toks']]
        if s['cost']: o['c'] = s['cost']
        if s['ratio']: o['r'] = s['ratio']
        if s.get('drawWord'): o['dw'] = 1
        if s.get('twice'): o['tw'] = 1
        if s.get('free'): o['fr'] = 1
        if s.get('x'): o['x'] = s['x']
        if s.get('note'): o['n'] = s['note']
        D[k] = o
    js = ('// GENERATED by design/scripts/card_upgrades.py from design/Cardbound_Card_Upgrades.xlsx. Do not edit by hand.\n'
          '// Per-level card upgrades: t = number tokens [start, end, base, kind, step, every]; c = -1 cost per c levels; r = +r% per level;\n'
          '// dw = "draw a card" grows at +5/+10; tw = "twice" grows at +5/+10; fr = free card draws 1 at +5, 2 at +10.\n'
          '(function (r) { const D = ' + json.dumps(D, separators=(',', ':')) + ';\n'
          "if (typeof module !== 'undefined' && module.exports) module.exports = D; else r.CB_UPGRADES = D; })(typeof window !== 'undefined' ? window : globalThis);\n")
    open(path, 'w').write(js)


# ---------------- overrides ----------------
# Per-card overrides: the user's Warrior calls, the 12 written-in answers, the 6 question answers, and cards the
# engine can only grow through a hand-made upgrade (x = 1: src/engine.js UPG_SPECIAL builds the play from the token values).
KEEP_PCT = {'defiant_roar', 'seal_of_light', 'bloodthirst', 'hamstring', 'evasive_precision'}

def T(s, i): return sorted(s['toks'], key=lambda x: x['i'])[i]
def setk(s, i, k=None, st=None, e=None):
    x = T(s, i)
    if k: x['k'] = k
    if st is not None: x['s'] = st
    if e is not None: x['e'] = e
def keep(s, *idx):
    tt = sorted(s['toks'], key=lambda x: x['i']); s['toks'] = [tt[i] for i in idx]
def addtok(c, s, n, k, st=0, e=0, nth=0):
    """grow a number the analyser skipped: the nth occurrence of the digits n"""
    t = c['text']; pos = [m.start() for m in re.finditer(r'(?<![\w.])' + str(n) + r'(?!\d)', t)][nth]
    s['toks'] = [x for x in s['toks'] if x['i'] != pos] + [{'i': pos, 'j': pos + len(str(n)), 'n': n, 'k': k, 's': st, 'e': e}]
def clear(s): s['toks'] = []; s['cost'] = 0; s['ratio'] = 0; s.pop('free', None); s.pop('drawWord', None); s.pop('twice', None)

def override(c, s):
    if s.get('ratio') and any(x['k'].startswith('ms_') for x in s['toks']): s['ratio'] = 0   # the milestone is the upgrade; a % on a card count would do nothing
    k = c['key']; f = OV.get(k)
    if f: f(c, s)
    return s

def ov_list():
    O = {}
    def o(key):
        def w(fn): O[key] = fn; return fn
        return w
    # ---- the user's Warrior calls
    @o('battle_shout')
    def _(c, s): s['toks'] = [x for x in s['toks'] if x['k'] != 'ms_draw']
    @o('catch_your_breath')
    def _(c, s): setk(s, 0, st=2)
    @o('crack_armor')
    def _(c, s): [x.update(s=1) for x in s['toks'] if x['k'] == 'vulnerable']
    @o('flurry_of_blows')
    def _(c, s): [x.update(s=1, e=2) for x in s['toks'] if x['k'] == 'ms_hits']
    @o('hunker_down')
    def _(c, s): s['toks'] = [dict(x, e=2) for x in s['toks'] if x['k'] == 'mana']
    @o('shake_it_off')
    def _(c, s): clear(s); addtok(c, s, 1, 'ms_cleanse'); addtok(c, s, 1, 'ms_draw', nth=1); s['x'] = 1
    @o('battle_plan')
    def _(c, s): s['cost'] = 0
    @o('battle_rhythm')
    def _(c, s): s['cost'] = 1
    @o('grudge')
    def _(c, s): clear(s); s['cost'] = 2
    @o('read_the_blade')
    def _(c, s): clear(s); s['cost'] = 2
    @o('marching_orders')
    def _(c, s): clear(s); s['cost'] = 1
    @o('counter_stance')
    def _(c, s): setk(s, 0, st=1)
    @o('deep_cuts')
    def _(c, s): s['toks'] = [x for x in s['toks'] if x['k'] != 'ms_hits']; s.pop('twice', None)
    @o('fireproof')
    def _(c, s): [x.update(s=2) for x in s['toks'] if x['k'] == 'def']
    @o('flush_out')
    def _(c, s): [x.update(s=2) for x in s['toks'] if x['k'] == 'dmg']
    @o('thunderclap')
    def _(c, s): [x.update(s=1) for x in s['toks'] if x['k'] == 'dmg']
    @o('guarded_stance')
    def _(c, s): setk(s, 0, st=2); s['x'] = 1
    @o('jarring_parry')
    def _(c, s): setk(s, 0, st=2); s['x'] = 1
    @o('iron_will')
    def _(c, s): setk(s, 0, st=2); addtok(c, s, 5, 'mana', 1, 1); s['x'] = 1
    @o('riposte')
    def _(c, s): s['x'] = 1
    @o('shield_up')
    def _(c, s): setk(s, 1, st=1); s['x'] = 1
    @o('mark_for_death')
    def _(c, s): addtok(c, s, 1, 'ms_draw'); s['x'] = 1
    @o('sundering_blow')
    def _(c, s): addtok(c, s, 3, 'shred', 1, 1, nth=1); s['x'] = 1
    @o('survey_the_field')
    def _(c, s): addtok(c, s, 3, 'ms_look', 1, 2); s['x'] = 1
    @o('underdog')
    def _(c, s): setk(s, 0, st=0); setk(s, 1, st=3); s['x'] = 1
    @o('desperate_strike')
    def _(c, s): addtok(c, s, 1, 'dmg', 1, 1); s['x'] = 1
    @o('hamstring')
    def _(c, s): setk(s, 1, st=2); s['x'] = 1
    @o('bloodthirst')
    def _(c, s): keep(s, 1); setk(s, 0, st=5); s['x'] = 1
    @o('shield_strike')
    def _(c, s): setk(s, 0, 'dmg', 5, 1)
    @o('shield_slam')
    def _(c, s): setk(s, 0, 'dmg', 2, 1)
    @o('collect_the_debt')
    def _(c, s): clear(s); s['ratio'] = 5
    @o('bloodlust')
    def _(c, s): [x.update(s=5) for x in s['toks'] if x['k'] == 'str']
    @o('adrenaline_surge')
    def _(c, s): setk(s, 0, st=10); addtok(c, s, 10, 'decay', 1, 1); s['x'] = 1; s['note'] = 'fades 1 more per level, so it lasts about as long'
    @o('cauterize')
    def _(c, s): clear(s); s['x'] = 1; s['note'] = '+2 HP healed per level (flat, on top of the per-stack heal)'
    @o('reclaim_ground')
    def _(c, s): clear(s); s['x'] = 1; s['note'] = '+1 Block per level (flat, on top of the per-Vulnerable Block)'
    @o('clear_head')
    def _(c, s): clear(s); addtok(c, s, 1, 'ms_draw'); s['x'] = 1
    @o('fall_back')
    def _(c, s): clear(s); s['x'] = 1; s['note'] = 'adds Heal 2 HP per level'
    @o('sanguine_guard')
    def _(c, s): clear(s); s['x'] = 1; s['note'] = 'adds Heal 2 HP per level'
    @o('shatter_morale')
    def _(c, s): clear(s); s['x'] = 1; s['note'] = 'you keep 5% of your Block per level (50% at +10)'
    @o('wind_up')
    def _(c, s): setk(s, 0, 'dmg', 1, 3); s['x'] = 1
    @o('rattling_roar')
    def _(c, s): addtok(c, s, 1, 'ms_less'); s['x'] = 1
    @o('throw_weapon')
    def _(c, s): s['toks'] = [x for x in s['toks'] if not x['k'].startswith('ms_')]; s['x'] = 1; s['note'] = 'the target discards 3 at +5, 4 at +10 (was 2)'
    # ---- the 12 written-in answers
    @o('double_strike')
    def _(c, s): clear(s); s['x'] = 1; s['note'] = 'the doubled Attack deals +2% damage per level'
    @o('shadow_echo')
    def _(c, s): clear(s); s['x'] = 1; s['note'] = 'the doubled Attack deals +5% damage per level'
    @o('elemental_ward')
    def _(c, s): clear(s); s['x'] = 1; s['note'] = '+5% resistance to that element per level'
    @o('reckless_abandon')
    def _(c, s): clear(s); s['x'] = 1; s['note'] = 'gain 2 Strength this turn per card drawn, +1 per level after +1'
    @o('sweeping_strikes')
    def _(c, s): clear(s); s['x'] = 1; s['note'] = 'also hits a third enemy at +3 and a fourth at +4'
    @o('killing_blow')
    def _(c, s): clear(s); s['x'] = 1; s['note'] = 'the crit bonus grows by 10% per level (+110% at +1)'
    @o('manaquake')
    def _(c, s): clear(s); s['x'] = 1; s['note'] = '+5% damage per level'
    @o('thousand_cuts')
    def _(c, s): clear(s); s['x'] = 1; s['note'] = 'hits twice per 5 mana at +3, three times at +4'
    @o('all_in')
    def _(c, s): clear(s); s['x'] = 1; s['note'] = 'adds Gain 2 Dodge per level'
    @o('assassinate')
    def _(c, s): clear(s); s['x'] = 1; s['note'] = 'the bonus grows by 10% per level (+110% at +1)'
    @o('mind_fog')
    def _(c, s): clear(s); s['cost'] = 1; addtok(c, s, 1, 'ms_less'); s['x'] = 1
    @o('ashen_drain')
    def _(c, s): clear(s); s['x'] = 1; s['note'] = 'you gain mana equal to 5% of the Burn per level'
    # ---- cards whose numbers live in a later trigger: hand-made so the text and the effect match
    for key in ['blood_pact', 'momentum', 'blood_ritual', 'bait', 'defiant_roar', 'relentless_assault', 'plunder_armor', 'coated_blade', 'cut_the_thread', 'lurk',
                'hidden_pockets', 'afterimage', 'torrent', 'quick_study', 'grievous_shiv', 'withering_flame', 'blinding_speed', 'time_theft', 'frost_armor',
                'frostbite_curse', 'seal_of_light', 'siphoning_strikes', 'thorned_bulwark', 'guardian_s_oath', 'unstoppable_force', 'pay_in_blood',
                'shadow_reflexes', 'temporal_siphon', 'arcane_ascension', 'barrier_battery', 'delayed_judgment', 'sacred_momentum',
                'balanced_guard', 'patient_wrath', 'divine_echo', 'grace_eternal']:
        O.setdefault(key, lambda c, s: s.update(x=1))
    @o('siphoning_strikes')
    def _(c, s): clear(s); s['ratio'] = 5; s['x'] = 1
    @o('evasive_precision')
    def _(c, s): clear(s); s['cost'] = 2
    # the engine has no number to grow for these: same rule as cards with no number (cheaper each level)
    def fallback(c, s):
        clear(s)
        if c['cost'] >= 20: s['cost'] = 1
        elif c['cost'] >= 10: s['cost'] = 2
        else: s['free'] = 1
        s['fallback'] = 1
    for key in ['entropic_field', 'scorched_plans', 'total_sabotage', 'cut_the_strings', 'melt_armor', 'kindled_faith', 'twin_verdict']: O[key] = fallback
    @o('scent_of_blood')
    def _(c, s): s['x'] = 1
    @o('exsanguinate')
    def _(c, s): setk(s, 0, 'dmg', 1, 5); s['note'] = '6 times at +5, 7 times at +10 (was 5)'
    return O
OV = ov_list()

def main():
    byk = {c['key']: c for c in A}
    specs = {k: override(byk[k], finalize(byk[k], s)) for k, s in out.items()}
    emit(specs, os.path.join(ROOT, 'src', 'card_upgrades.js'))
    print('emitted', len(specs))

NOUN = {'dmg': 'damage', 'heal': 'HP healed', 'str': 'Strength', 'int': 'Intelligence', 'dex': 'Dexterity', 'spi': 'Spirit', 'sta': 'Stamina', 'mana': 'mana', 'regen': 'mana regen',
        'maxMana': 'max mana', 'init': 'Initiative', 'thorns': 'Thorns', 'devotion': 'Devotion', 'back': 'damage back', 'shred': 'Block removed', 'pct': '%'}
def describe(c, s):
    t = c['text']; parts = []; seen = set(); msp = []
    for x in s['toks']:
        k = x['k']
        if k.startswith('ms_'):
            n = x['n']; msp.append(f"{n + 1} at +5, {n + 2} at +10 (was {n})"); continue
        word = NOUN.get(k) or k.capitalize()
        if k == 'def': word = re.match(r'%?\s*(\w+)', t[x['j']:]).group(1)
        if k == 'pct' or t[x['j']:x['j'] + 1] == '%': word = '%' + (' ' + NOUN[k] if k in ('dmg', 'heal') else '')
        key = (k, word)
        if key in seen: continue
        seen.add(key)
        step = f"+{x['s']}{'' if word.startswith('%') else ' '}{word}"
        parts.append(step + (' every other level' if x['e'] == 2 else ' every 3 levels' if x['e'] == 3 else ''))
    out = []
    if parts: out.append(', '.join(parts) + (' per level' if not all(p.endswith('levels') or p.endswith('level') for p in parts) else ''))
    if msp: out.append('; '.join(msp))
    if s.get('drawWord'): out.append('draws 2 at +5, 3 at +10')
    if s.get('twice'): out.append('3 times at +5, 4 at +10')
    if s.get('free'): out.append('also draws 1 card at +5, 2 at +10')
    if s.get('ratio'): out.append(f"+{s['ratio']}% to its amount per level")
    if s.get('cost'): out.append('-1 mana cost ' + ('per level' if s['cost'] == 1 else 'every other level'))
    if s.get('note'): out.append(s['note'])
    return '; '.join(out)

if 'emit' in sys.argv: main()
