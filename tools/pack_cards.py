# pack_cards.py <done.tsv> : card art PNGs -> public/img/cards/<key>.webp + src/cardart.js (the keys that have pixel art)
import sys, os, json
from PIL import Image
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.makedirs(R + '/public/img/cards', exist_ok=True); keys = {}
for l in open(sys.argv[1]):
    p = l.split()
    if len(p) < 2 or not os.path.exists(p[1]): continue
    Image.open(p[1]).convert('RGB').save(f"{R}/public/img/cards/{p[0]}.webp", quality=92, method=6); keys[p[0]] = 1
ks = sorted(keys)
open(R + '/src/cardart.js', 'w').write("""// ---------- Pixel card art (Nov 11): one PixelLab painting per player card, public/img/cards/<card key>.webp (made by tools/pack_cards.py).
// Listed keys replace the older painted art in CB_ART; cards not listed keep it (or their icon).
// TO REMOVE: delete this file (and public/img/cards).
(function () { const K = %s; const A = window.CB_ART = window.CB_ART || {}; for (const k of K) A[k] = 'img/cards/' + k + '.webp'; })();
""" % json.dumps(ks))
print(len(ks), 'cards')
