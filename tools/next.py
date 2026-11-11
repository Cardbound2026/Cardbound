# next.py CLS N -> next N prompts of a class not yet done or queued (prints key|prompt), marks them queued
import json, sys, os
D = '/tmp/claude-0/-home-claude/654d5b11-96c9-5be1-9b01-ca0776c2bbeb/scratchpad/cards/'
P = json.load(open(D + 'prompts.json'))
done = set(l.split()[0] for l in open(D + 'done.tsv')) if os.path.exists(D + 'done.tsv') else set()
q = set(l.strip() for l in open(D + 'queued.txt')) if os.path.exists(D + 'queued.txt') else set()
skip = {'heavy_swing', 'whirlwind'}
out = [o for o in P if o['cls'] == sys.argv[1] and o['key'] not in done and o['key'] not in q and o['key'] not in skip][:int(sys.argv[2])]
with open(D + 'queued.txt', 'a') as f:
    for o in out: f.write(o['key'] + '\n')
T = {c['key']: (c['text'] or '')[:100] for c in json.load(open(D + 'list.json'))}
for o in out: print(o['key'] + '|' + o['p'][len("Dark fantasy card illustration for "):-len(". Painterly detailed pixel art, dramatic composition, no text")] + '  ::' + T.get(o['key'], ''))
