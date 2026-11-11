import json, random, hashlib, re
L = json.load(open('/tmp/claude-0/-home-claude/654d5b11-96c9-5be1-9b01-ca0776c2bbeb/scratchpad/cards/list.json'))
H = {
 'Warrior': ["a grizzled warrior in scarred iron plate and a torn red cloak", "a shirtless berserker in war paint holding two notched swords", "a knight in heavy plate swinging a huge two-handed axe", "a warrior in chainmail with twin hand axes", "a scarred sellsword with a longsword and a dented round shield", "a towering warrior in a horned helm with a great maul", "a bearded warrior in fur and red cloth with a battle axe"],
 'Rogue': ["a hooded rogue in dark leather with twin daggers", "a masked assassin in black with a curved blade", "a lean cutthroat with throwing knives on a bandolier", "a cloaked thief crouched on a rooftop", "a poisoner in a green-lined hood with a dripping dagger", "a duelist in a dark coat with a rapier"],
 'Mage': ["a robed mage in purple cloth with a glowing staff", "an old bearded wizard with a rune-carved staff", "a young sorceress casting from an open spellbook", "a battle mage in robes over light armour", "a hooded arcanist with floating runes around her hands"],
 'Paladin': ["a paladin in gold-trimmed plate and a white tabard with a cross", "a holy knight raising a glowing warhammer", "a crusader with a tower shield and a mace", "a templar kneeling in prayer with a longsword", "a radiant paladin on foot with a flanged mace and holy light"],
 'Warlock': ["a warlock in tattered black robes with green fel fire in his hands", "a pale sorceress with a demon's shadow behind her", "a hooded warlock bargaining with a horned demon", "a blood mage with runes carved into his arms", "a warlock with a skull-topped staff and swirling shadow"],
}
OBJ = {
 'Warrior': ["an extreme close-up of the warrior's face mid war-cry, teeth bared, blood on his cheek", "a close-up of a scarred, flexing bicep gripping an axe haft", "a battered steel shield leaning on a rock with arrows stuck in it", "a horned iron helmet resting on a tree stump", "a longsword driven into the ground", "the warrior hammering a glowing blade on an anvil, sparks flying", "a gauntleted fist clenched, knuckles bloody", "the warrior sharpening his axe by a campfire", "a torn war banner whipping in the wind", "two bloodied axes crossed on a wooden table", "the warrior blowing a war horn on a cliff", "a broken chain and manacle on wet stone"],
 'Rogue': ["a close-up of a dagger dripping green poison", "a hooded face half in shadow, eyes glinting", "a coin purse being cut from a belt", "a lockpick in a keyhole by candlelight", "throwing knives fanned out on a table", "a vial of poison over a goblet of wine", "a smoke bomb bursting in an alley", "a wanted poster nailed to a door with a knife"],
 'Mage': ["an open spellbook with glowing runes", "a crystal orb crackling with lightning", "a mage's hand with frost curling from the fingers", "a candle-lit tower study full of scrolls", "a staff tip blazing with fire", "a rune circle glowing on a stone floor", "an hourglass with sand frozen in mid air", "an alchemy table with bubbling potions"],
 'Paladin': ["a close-up of a paladin's gauntlets clasped in prayer", "a gleaming warhammer on a church altar", "a white tabard with a gold cross torn by battle", "a stained glass window shining onto a sword", "a holy relic glowing on a velvet cushion", "a shield with a golden sun emblem", "candles in a ruined chapel", "a knight's helm with a white plume under a sunbeam"],
 'Warlock': ["a grimoire bound in skin, its pages burning green", "a demon's clawed hand reaching from a portal", "a ritual circle drawn in blood with candles", "a skull wreathed in green fire", "a soul stone glowing in a palm", "chains of shadow wrapped around a victim's wrist", "a goblet of blood on a black altar", "an imp grinning on a pile of bones"],
}
SET = ["on a muddy battlefield littered with broken spears", "in a sand duelling arena ringed by a crowd", "on a rain-soaked castle rampart", "in a burning village at night", "in a misty pine forest", "on a snowy mountain pass", "inside a torch-lit stone hall", "on a sunlit grassy hill", "on a corpse-strewn field with crows", "in a ruined temple", "on a stormy cliff edge", "in a dark crypt", "on a bridge over a gorge", "in a war camp of tents and fires"]
MOOD = ["very dark, lit only by firelight", "bright daylight, blue sky", "stormy grey light", "blood-red sunset", "cold blue moonlight", "golden morning light", "thick fog", "heavy rain", "pitch-black night with one torch", "hazy afternoon dust"]
DT = {'Fire': 'with roaring flames', 'Frost': 'with ice and frost', 'Shadow': 'with dark shadow magic', 'Holy': 'with radiant golden holy light', 'Arcane': 'with violet arcane energy', 'Nature': 'with thorns, vines and green poison'}
KW = [(r'shield|block|bulwark|wall|guard|parry|bastion|fortif|brace', ['raising a shield to block a heavy blow', 'behind a wall of locked shields with his comrades', 'bracing behind a tower shield as arrows rain down', 'catching a monster\'s claws on his shield', 'standing guard in a narrow doorway, shield up', 'planting a spiked shield into the ground']), (r'blood|bleed|rend|lacerat|gore|wound', ['with blood spraying', 'covered in the blood of his enemies', 'licking blood from his blade', 'leaving a trail of blood through the snow']),
      (r'rage|fury|roar|shout|cry|bellow|berserk|frenzy', ['roaring in fury', 'screaming a war cry with veins bulging', 'beating his chest before a horde']), (r'whirl|cleave|sweep|spin|nova|cyclone', 'spinning to cut through several enemies at once'),
      (r'execut|finish|decapit|behead|slay|kill', 'delivering a brutal finishing blow to a kneeling foe'), (r'charge|rush|leap|lunge|dash|tackle', 'charging forward'),
      (r'taunt|challeng|provok|duel', 'taunting an enemy, arms wide'), (r'heal|mend|recover|second wind|bandage|regenerat|restor', 'tending wounds'),
      (r'poison|venom|toxin', 'coating a blade in poison'), (r'stealth|vanish|shadow|hide|sneak|ambush', 'striking from the shadows'), (r'stun|bash|smash|crush|slam|shatter|break', 'smashing an enemy off its feet'),
      (r'mark|expose|weak|sunder|armor break|pierce', 'aiming at a gap in an enemy\'s armour'), (r'demon|imp|summon|pact|soul', 'summoning a demon'), (r'prayer|bless|sanct|smite|judg|divine|holy|light', 'calling down holy light')]
out = []
for c in L:
    r = random.Random(int(hashlib.md5(c['key'].encode()).hexdigest(), 16))
    nm, tx = c['name'], c['text'] or ''
    hint = next((v for k, v in KW if re.search(k, (nm + ' ' + tx).lower())), None)
    if isinstance(hint, list): hint = r.choice(hint)
    el = DT.get(c.get('dtype') or '', '')
    if (not hint and (c['type'] == 'Power' or r.random() < 0.4)) or (hint and r.random() < 0.12):
        subj = r.choice(OBJ[c['cls']])
        p = f"{subj}, {el + ', ' if el else ''}{r.choice(MOOD)}"
    else:
        act = hint or ('attacking a monster' if c['type'] == 'Attack' else 'readying for battle')
        p = f"{r.choice(H[c['cls']])} {act}{', ' + el if el else ''}, {r.choice(SET)}, {r.choice(MOOD)}"
    out.append({'key': c['key'], 'cls': c['cls'], 'name': nm, 'p': f"Dark fantasy card illustration for '{nm}': {p}. Painterly detailed pixel art, dramatic composition, no text"})
json.dump(out, open('/tmp/claude-0/-home-claude/654d5b11-96c9-5be1-9b01-ca0776c2bbeb/scratchpad/cards/prompts.json', 'w'), indent=0)
for o in out[:6]: print(o['key'], '|', o['p'])
