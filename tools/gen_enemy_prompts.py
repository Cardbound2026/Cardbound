# gen_enemy_prompts.py: one painting prompt per unique enemy card name (+ the status cards), for PixelLab.
# Writes <scratch>/ecards/prompts.json: [{key, name, p}]. Art key: 'e_<slug>' for enemy cards, 'status_<key>' for status cards.
import json, re, random, hashlib, subprocess, os
D = '/tmp/claude-0/-home-claude/654d5b11-96c9-5be1-9b01-ca0776c2bbeb/scratchpad/ecards/'
os.makedirs(D, exist_ok=True)
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
data = json.loads(subprocess.check_output(['node', '-e', "global.window={};eval(require('fs').readFileSync('%s/src/data.js','utf8'));process.stdout.write(JSON.stringify(window.CB_DATA.enemies))" % R]))
def slug(s): return re.sub(r'[^a-z0-9]+', '_', s.lower()).strip('_')
SET = {
 'physical': ['on a muddy war-torn battlefield littered with broken spears', 'in a bandit camp of ragged tents', 'on the wall of a ruined mercenary fort', 'beside an old wooden siege engine', 'on a rutted road through burned farmland'],
 'fire': ['in volcanic badlands with rivers of lava', 'on a cracked basalt causeway over a lava lake', 'among burning shrines and falling ash', 'in a smoking obsidian fortress'],
 'frost': ['in a frozen tundra blizzard', 'on a frozen lake of cracked blue ice', 'in a snowy mountain pass with ice spires', 'inside a glacier fortress of blue ice'],
 'nature': ['in a dark overgrown jungle', 'in a poisonous swamp with glowing mushrooms', 'among giant thorned roots', 'on a vine-choked ruined road'],
 'arcane': ['in a ruined wizard city with floating rubble', 'in a shattered arcane library', 'on a floating stone platform crackling with violet runes', 'beneath a broken upside-down tower'],
 'shadow': ['in a dead gothic town at night', 'in catacombs lined with skulls', 'in a vast ossuary hall', 'before a colossal crypt gate'],
}
MOOD = ['very dark, lit only by firelight', 'stormy grey light', 'blood-red light', 'cold blue moonlight', 'thick fog', 'pitch-black night with one torch', 'eerie green glow', 'harsh dramatic rim light']
DT = {'Fire': 'with roaring flames', 'Frost': 'with ice and frost', 'Shadow': 'with dark shadow magic', 'Holy': 'with radiant holy light', 'Arcane': 'with violet arcane energy', 'Nature': 'with thorns, vines and green poison'}
KW = [(r'block|shield|guard|parry|wall|brace|armor|armour|harden|shell|carapace', 'standing its ground in a defensive stance'), (r'heal|regenerat|mend|recover|feed|drain|leech', 'feeding to heal its wounds'),
      (r'poison|venom|toxin|plague|rot|blight', 'spitting venom'), (r'bleed|rend|gore|lacerat|claw|bite|maul', 'tearing into its prey with claws and teeth'),
      (r'stun|daze|slam|smash|crush|bash|stomp|quake', 'smashing the ground with a crushing blow'), (r'weak|vulnerab|curse|hex|expose|mark', 'cursing its victim with a sinister gesture'),
      (r'summon|call|raise|minion|spawn', 'summoning minions'), (r'strength|power|rage|frenzy|enrage|roar|bellow|howl|war cry', 'roaring in fury'),
      (r'steal|pickpocket|gold|loot|rob', 'snatching a coin purse'), (r'dodge|duck|evade|stealth|vanish|shadow', 'leaping aside into the shadows'),
      (r'fire|burn|flame|ember|ignite', 'unleashing a blast of fire'), (r'frost|chill|freeze|ice', 'breathing freezing frost'), (r'arcane|spell|bolt|missile|rune', 'hurling a crackling spell')]
seen = {}
for ek, e in data.items():
    for c in e.get('deck') or []:
        k = 'e_' + slug(c['name'])
        if k in seen: continue
        seen[k] = (ek, e, c)
out = []
for k, (ek, e, c) in seen.items():
    r = random.Random(int(hashlib.md5(k.encode()).hexdigest(), 16))
    txt = (c['name'] + ' ' + (c.get('text') or '')).lower()
    act = next((v for p, v in KW if re.search(p, txt)), None) or ('lunging to attack' if c.get('kind') == 'Attack' else 'preparing its next move')
    el = DT.get(c.get('dtype') or '', '')
    who = f"{e['name']} ({e.get('creature') or 'monster'}{', a boss' if e.get('tier') == 'Boss' else ''})"
    desc = (e.get('desc') or '').split('.')[0]
    p = f"Dark fantasy card illustration for the enemy card '{c['name']}': {who} {act}{', ' + el if el else ''}, {r.choice(SET.get(e.get('map'), SET['physical']))}, {r.choice(MOOD)}. {desc}. Painterly detailed pixel art, dramatic composition, menacing, no text"
    out.append({'key': k, 'name': c['name'], 'enemy': ek, 'p': p})
ST = {'dazed': 'a dizzy blurred view of a battlefield spinning, stars and a ringing head', 'stun': 'a knight staggering, helmet dented, stars around his head after a crushing blow',
      'fatigue': 'an exhausted warrior slumped against a wall, sword dragging, heavy breathing in cold air', 'venom': 'a snake fang dripping green venom into a wound',
      'frostbite': 'a hand turning blue with frost creeping over the skin and armour', 'hex': 'a glowing purple curse sigil burning on a victim\'s chest',
      'bomb': 'a lit black powder bomb with a sparking fuse rolling across stone'}
for k, v in ST.items():
    out.append({'key': 'status_' + k, 'name': k, 'enemy': None, 'p': f"Dark fantasy card illustration for the status card '{k.title()}': {v}. Painterly detailed pixel art, dramatic composition, no text"})
json.dump(out, open(D + 'prompts.json', 'w'), indent=0)
print(len(out)); [print(o['key'], '|', o['p'][:220]) for o in out[:4]]
