# Hero weapons and cloaks (Nov 12).
#  weapons/raw/<type>.png: six versions of a weapon in a row (iron, fire, frost, nature, arcane, shadow), upright. Each is cut out and
#  packed into public/img/hero/weapons.webp (one row per type, 48x112 cells, the grip at the cell's middle bottom mark);
#  gear/cloak_<a|b>.png: cloaks painted on the dressing sheets -> public/img/hero/cloak.webp (bodies across, views down, 128 cells), grey so the game dyes them.
import os, json, glob, numpy as np
from PIL import Image
from scipy import ndimage
import gear_sheet as GS
HERE = GS.HERE; OUT = os.path.dirname(os.path.dirname(HERE)) + '/public/img/hero'; CW, CH = 48, 112
TYPES = ['sword1h', 'axe1h', 'mace1h', 'dagger', 'wand', 'sword2h', 'axe2h', 'maul', 'hammer', 'scythe', 'staff', 'kite', 'tower', 'focus']
GRIP = {'sword1h': .88, 'axe1h': .86, 'mace1h': .86, 'dagger': .84, 'wand': .85, 'sword2h': .86, 'axe2h': .62, 'maul': .64, 'hammer': .64, 'scythe': .56, 'staff': .52, 'kite': .5, 'tower': .5, 'focus': .6}
atlas = np.zeros((CH * len(TYPES), CW * 6, 4), np.uint8); data = {}
for ti, t in enumerate(TYPES):
    f = f'{HERE}/weapons/raw/{t}.png'
    if not os.path.exists(f): continue
    a = np.array(Image.open(f).convert('RGBA')); al = a[..., 3] > 40; cols = al.any(0)
    lab, n = ndimage.label(ndimage.binary_closing(cols, np.ones(3)) | cols); runs = [np.nonzero(lab == i)[0] for i in range(1, n + 1)]; runs = [r for r in runs if al[:, r].sum() > 25]
    if len(runs) != 6:   # not six clean columns: cut into six even slots instead
        print(t, 'found', len(runs), 'pieces; using even slots'); w = a.shape[1] / 6; runs = [np.arange(int(i * w), int((i + 1) * w)) for i in range(6)]
    grips = []
    for i, r in enumerate(runs[:6]):
        sp = a[:, r.min():r.max() + 1]; ys = np.nonzero((sp[..., 3] > 40).any(1))[0]; xs = np.nonzero((sp[..., 3] > 40).any(0))[0]; sp = sp[ys.min():ys.max() + 1, xs.min():xs.max() + 1]; sp[sp[..., 3] <= 40] = 0
        h, w = sp.shape[:2]
        if w > CW or h > CH: sp = sp[max(0, h - CH):, (w - min(w, CW)) // 2:(w - min(w, CW)) // 2 + min(w, CW)]; h, w = sp.shape[:2]
        gy = int(h * GRIP[t]); row = np.nonzero(sp[min(h - 1, gy), :, 3] > 40)[0]; gx = float(row.mean()) if len(row) else w / 2
        if t in ('kite', 'tower', 'focus'): gx = w / 2
        x0 = (CW - w) // 2; y0 = CH - h; atlas[ti * CH + y0:ti * CH + y0 + h, i * CW + x0:i * CW + x0 + w] = sp; grips.append([round(x0 + gx, 1), y0 + gy])
    data[t] = grips
Image.fromarray(atlas).save(f'{OUT}/weapons.webp', lossless=True, method=6)
# cloaks
cl = np.zeros((128 * 3, 128 * 4, 4), np.uint8); bi = 0; ok = True
for pk, bodies in GS.PAIRS.items():
    f = f'{HERE}/gear/cloak_{pk}.png'
    if not os.path.exists(f): ok = False; bi += 2; continue
    res = np.array(Image.open(f).convert('RGBA')).astype(int); src = np.array(Image.open(f'{HERE}/gear/bodies_{pk}.png').convert('RGBA')).astype(int)
    m = (np.abs(res - src).sum(-1) > 24) & (res[..., 3] > 128) & (res[..., 0] - res[..., 2] < 45)
    lab, n = ndimage.label(m, np.ones((3, 3))); sz = ndimage.sum(m, lab, range(1, n + 1)); keep = np.zeros(n + 1, bool); keep[1:] = sz >= 30; m = keep[lab]
    lum = (res[..., :3].sum(-1) / 3); g = np.clip(lum * 2.1, 0, 255).astype(np.uint8)
    for r, b in enumerate(bodies):
        for vi, v in enumerate(['s', 'e', 'n']):
            c = {'s': 0, 'n': 1, 'e': 2}[v]; _, x0, y0 = GS.origin(b, v); cm = m[r * GS.CH:(r + 1) * GS.CH, c * GS.CW:(c + 1) * GS.CW]; cg = g[r * GS.CH:(r + 1) * GS.CH, c * GS.CW:(c + 1) * GS.CW]
            im = np.zeros((128, 128, 4), np.uint8); sub = np.zeros((GS.CH, GS.CW, 4), np.uint8); sub[..., 0] = sub[..., 1] = sub[..., 2] = cg; sub[..., 3] = cm * 255
            im[y0:y0 + GS.CH, max(0, x0):x0 + GS.CW] = sub[:128 - y0, max(0, -x0):]; cl[vi * 128:(vi + 1) * 128, (bi + r) * 128:(bi + r + 1) * 128] = im
    bi += 2
Image.fromarray(cl).save(f'{OUT}/cloak.webp', lossless=True, method=6)
json.dump({'weapons': {'cw': CW, 'ch': CH, 'types': TYPES, 'grip': data}}, open(f'{HERE}/weapons/data.json', 'w'))
print('weapons', len(data), 'cloaks', 'ok' if ok else 'partial')
