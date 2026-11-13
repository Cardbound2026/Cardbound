# save.py <joined.png> name1 name2 ...: split a workbench "join" of 792x336 room paintings (one per row), trim any flat border, save
# tools/interiors/<name>.png and public/img/bg/in_<name>.webp
import sys, numpy as np
from PIL import Image
a = np.array(Image.open(sys.argv[1]).convert('RGB')); a = a[a.shape[0] % 336:]
for i, n in enumerate(sys.argv[2:]):
    c = a[i * 336:(i + 1) * 336]; g = c.astype(int)
    rows = np.nonzero(g.std(axis=(1, 2)) > 6)[0]; cols = np.nonzero(g.std(axis=(0, 2)) > 6)[0]
    c = c[rows.min():rows.max() + 1, cols.min():cols.max() + 1]
    for _ in range(2):   # a flat margin in the corner's colour
        k = c[2, 2].astype(int); near = (np.abs(c.astype(int) - k).sum(-1) < 30); rk = np.nonzero(near.mean(1) < .9)[0]; ck = np.nonzero(near.mean(0) < .9)[0]
        if len(rk) and len(ck) and (rk.min() > 3 or ck.min() > 3): c = c[rk.min():rk.max() + 1, ck.min():ck.max() + 1]
    im = Image.fromarray(c); im.save(f'tools/interiors/{n}.png'); im.save(f'public/img/bg/in_{n}.webp', quality=88, method=6); print(n, im.size)
