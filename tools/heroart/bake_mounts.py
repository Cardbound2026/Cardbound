# Mounts (Nov 13). tools/heroart/mounts/<key>.png: 7 columns x 3 rows of 128 px cells (rows facing the camera, sideways, away; the first
# cell stands, the next six run), the same layout as horse.png -> public/img/hero/mounts/<key>.webp and src/mounts_data.js (where the
# rider sits on each: seat = the rider's hips from the middle of the beast's feet, in beast pixels). SEAT overrides the measured guess.
import os, json, glob, sys, numpy as np
from PIL import Image
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE))
SEAT = json.load(open(HERE + '/mounts/seats.json')) if os.path.exists(HERE + '/mounts/seats.json') else {}
out = {}
for f in sorted(glob.glob(HERE + '/mounts/*.png')):
    k = os.path.basename(f)[:-4]; a = np.array(Image.open(f).convert('RGBA')); a[a[..., 3] < 40] = 0
    Image.fromarray(a).save(f'{ROOT}/public/img/hero/mounts/{k}.webp', lossless=True, method=6)
    d = {'cell': 128, 'frames': 6, 'k': 1.55, 'hip': 61}
    for r, v in enumerate('sen'):
        c = a[r * 128:(r + 1) * 128, :128]; m = c[..., 3] > 40; ys = np.nonzero(m.any(1))[0]; xs = np.nonzero(m.any(0))[0]; foot = int(ys.max()); top = int(ys.min())
        if v == 'e':
            x0, x1 = xs.min(), xs.max(); mid = m[:, int(x0 + (x1 - x0) * .32):int(x0 + (x1 - x0) * .58)]; back = int(np.median([np.nonzero(col)[0].min() for col in mid.T if col.any()]))
            seat = [int((x0 + (x1 - x0) * .44) - 64), -(foot - back - 23)]
        elif v == 's': seat = [int(np.nonzero(m)[1].mean() - 64), -(foot - top - 20)]
        else: seat = [int(np.nonzero(m)[1].mean() - 64), -(foot - top - 43)]
        if k in SEAT and v in SEAT[k]: seat = SEAT[k][v]
        d[v] = {'row': r, 'foot': foot, 'seat': seat}
    if k in SEAT and 'k' in SEAT[k]: d['k'] = SEAT[k]['k']
    out[k] = d
open(ROOT + '/src/mounts_data.js', 'w').write('// made by tools/heroart/bake_mounts.py: where the rider sits on each mount\nwindow.CB_MOUNTS = ' + json.dumps(out) + ';\n')
print(json.dumps(out))
