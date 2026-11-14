# Nov 14: more monsters carry an area-damage card, so Stealth (which only dodges single-target cards) is a little less safe.
# Elites 12 -> 18 of 36 (50%), tier 3: 7 -> 12 of 30 (40%), tier 2: 6 -> 9 of 30 (30%), tier 1: 0 -> 6 of 30 (20%).
# Each monster below swaps 2 copies of its most common Attack for 2 copies of the new card (deck size stays the same);
# the Mammoth and Spore Shambler, with no copies to spare, lose their plain 2-copy hit instead.
# Sizes follow the area cards already in the game: about 60% of that tier's single-target hit for the same mana.
# Run once: python3 tools/add_aoe_cards.py   (it refuses to add a card twice)
import json, os
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); P = R + '/src/data.js'
raw = open(P).read(); a, b = raw.index('{'), raw.rindex('}') + 1; D = json.loads(raw[a:b]); E = D['enemies']
NEW = [  # monster, card, cost, text
  ('bristleback_boar', 'Tusk Rush', 10, 'Deal 6 damage to every player.'),
  ('firebrand_zealot', 'Scatter Embers', 10, 'Deal 5 damage to every player and apply 1 Burn.'),
  ('snow_sprite', 'Flurry', 10, 'Deal 5 damage to every player and apply 1 Chill.'),
  ('spitting_toad', 'Bile Spray', 10, 'Deal 4 damage to every player and apply 1 Poison.'),
  ('failed_apprentice', 'Wild Surge', 10, 'Deal 6 damage to every player.'),
  ('gloom_bat', 'Piercing Shriek', 10, 'Deal 6 damage to every player.'),
  ('blaze_drake', 'Flame Wash', 20, 'Deal 7 damage to every player and apply 2 Burn.'),
  ('mammoth', 'Thunderous Charge', 20, 'Deal 8 damage to every player.'),
  ('spore_shambler', 'Spore Burst', 20, 'Deal 6 damage to every player and apply 2 Poison.'),
  ('werewolf_marauder', 'Howling Rampage', 20, 'Deal 9 damage to every player and apply 2 Bleed.'),
  ('wendigo', "Winter's Howl", 20, 'Deal 9 damage to every player and apply 2 Chill.'),
  ('broodmother_spider', 'Spray Venom', 20, 'Deal 8 damage to every player and apply 3 Poison.'),
  ('mana_wraith', 'Mana Storm', 20, 'Deal 10 damage to every player.'),
  ('vampire_spawn', 'Blood Mist', 20, 'Deal 9 damage to every player and apply 2 Bleed.'),
  ('pit_champion', 'Arena Sweep', 30, 'Deal 12 damage to every player.'),
  ('lord_of_embers', 'Royal Inferno', 30, 'Deal 11 damage to every player and apply 2 Burn.'),
  ('the_pale_champion', 'Glacial Sweep', 30, 'Deal 11 damage to every player and apply 2 Chill.'),
  ('the_thornblade', 'Bladed Bloom', 30, 'Deal 12 damage to every player.'),
  ('the_duelist_magus', 'Arcane Flourish', 30, 'Deal 12 damage to every player.'),
  ('the_crimson_count', 'Crimson Tide', 30, 'Deal 11 damage to every player and apply 2 Bleed.'),
]
for k, name, cost, text in NEW:
    d = E[k]['deck']
    if any(c['name'] == name for c in d): print('already there:', name); continue
    main = max((c for c in d if c['kind'] == 'Attack' and not c.get('phase2')), key=lambda c: c['n'])
    if main['n'] >= 4: main['n'] -= 2; at = d.index(main) + 1
    else:   # a deck with no card to spare (Mammoth, Spore Shambler): the new card takes the place of its plain 2-copy hit (Stomp, Slap)
        main = next(c for c in d if c['kind'] == 'Attack' and c['n'] == 2 and ' and ' not in c['text']); at = d.index(main); d.remove(main); main = dict(main, n=0)
    d.insert(at, {'name': name, 'n': 2, 'cost': cost, 'kind': 'Attack', 'text': text, 'phase2': False, 'dtype': main['dtype']})
    print(f"{k}: {main['name']} x{main['n']} + {name} x2 ({main['dtype']})")
open(P, 'w').write(raw[:a] + json.dumps(D) + raw[b:])
