# fix_ecards.py <done.tsv> : re-pack the enemy card paintings whose white-margin trim (pack_ecards.py) cut into a snowy picture.
# Trims only from the outer edges inwards, only rows/columns that are almost all white, and never more than a fifth of a side.
import sys, os
import numpy as np
from PIL import Image
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
def old_box(a):
    h, w = a.shape[:2]; white = lambda v: (v.min(-1) > 225).mean() > 0.15
    def span(n, get):
        lo = hi = n // 2
        while lo > 0 and not white(get(lo - 1)): lo -= 1
        while hi < n - 1 and not white(get(hi + 1)): hi += 1
        return lo, hi + 1
    y0, y1 = span(h, lambda y: a[y]); x0, x1 = span(w, lambda x: a[:, x]); return x0, y0, x1, y1
def new_box(a):
    h, w = a.shape[:2]; white = lambda v: (v.min(-1) > 222).mean() > 0.85
    def edge(n, get):
        lo, hi, cap = 0, n, n // 5
        while lo < cap and white(get(lo)): lo += 1
        while n - hi < cap and white(get(hi - 1)): hi -= 1
        return lo, hi
    y0, y1 = edge(h, lambda y: a[y]); x0, x1 = edge(w, lambda x: a[:, x]); return x0, y0, x1, y1
done = []
for l in open(sys.argv[1]):
    p = l.split()
    if len(p) < 2 or not os.path.exists(p[1]): continue
    im = Image.open(p[1]).convert('RGB'); a = np.asarray(im).astype(int); h, w = a.shape[:2]
    x0, y0, x1, y1 = old_box(a)
    if (x1 - x0) >= 0.8 * w and (y1 - y0) >= 0.8 * h: continue
    x0, y0, x1, y1 = new_box(a)
    im.crop((x0, y0, x1, y1)).resize((208, 140), Image.LANCZOS if (x1 - x0) > 300 else Image.NEAREST).save(f"{R}/public/img/ecards/{p[0]}.webp", quality=92, method=6); done.append(p[0])
print(len(done), ' '.join(done))
