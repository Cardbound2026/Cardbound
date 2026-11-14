# pack_ecards.py <done.tsv> : enemy/status card art -> public/img/ecards/<key>.webp + src/ecardart.js
# Trims the white margin PixelLab Pro Flash leaves around the painting, then fits back to 208x140.
import sys, os, json
import numpy as np
from PIL import Image
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.makedirs(R + '/public/img/ecards', exist_ok=True); keys = {}
for l in open(sys.argv[1]):
    p = l.split()
    if len(p) < 2 or not os.path.exists(p[1]): continue
    im = Image.open(p[1]).convert('RGB'); a = np.asarray(im).astype(int); h, w = a.shape[:2]
    # Nov 13: trim only from the outer edges, only rows/columns that are nearly all white, never more than a fifth of a side
    # (the old "grow from the middle" trim cut snowy Frost paintings down to a strip: see tools/fix_ecards.py)
    white = lambda v: (v.min(-1) > 222).mean() > 0.85
    def edge(n, get):
        lo, hi, cap = 0, n, n // 5
        while lo < cap and white(get(lo)): lo += 1
        while n - hi < cap and white(get(hi - 1)): hi -= 1
        return lo, hi
    y0, y1 = edge(h, lambda y: a[y]); x0, x1 = edge(w, lambda x: a[:, x])
    if (x0, y0, x1, y1) != (0, 0, w, h): im = im.crop((x0, y0, x1, y1)).resize((208, 140), Image.NEAREST)
    im.save(f"{R}/public/img/ecards/{p[0]}.webp", quality=92, method=6); keys[p[0]] = 1
ks = sorted(keys)
open(R + '/src/ecardart.js', 'w').write("""// ---------- Enemy and status card art (Nov 12): one PixelLab painting per enemy card name ('e_<slug>') and per status card ('status_<key>'),
// public/img/ecards/<key>.webp (made by tools/pack_ecards.py). cardFace looks these up by name. TO REMOVE: delete this file (and public/img/ecards).
(function () { const K = %s; const A = window.CB_ART = window.CB_ART || {}; for (const k of K) A[k] = 'img/ecards/' + k + '.webp'; })();
""" % json.dumps(ks))
print(len(ks), 'enemy/status cards')
