# Hero hair and beards (Nov 12): keeps only the hair from each painted head sheet (hair/raw/<style>.png, painted in grey-white so
# the game can dye it) and writes public/img/hero/hair/<style>.webp, the same 4 bodies x 3 views grid as hair/heads.png.
import glob, os, json, numpy as np
from scipy import ndimage
from PIL import Image
import head_sheet as HS
HERE = HS.HERE; OUT = os.path.dirname(os.path.dirname(HERE)) + '/public/img/hero/hair'; os.makedirs(OUT, exist_ok=True)
src = np.array(Image.open(f'{HERE}/hair/heads.png').convert('RGBA')).astype(int)
def near(m):
    o = m.copy()
    for oy in (-1, 0, 1):
        for ox in (-1, 0, 1): o |= np.roll(np.roll(m, oy, 0), ox, 1)
    return o
names = []
for f in sorted(glob.glob(f'{HERE}/hair/raw/*.png')):
    r = np.array(Image.open(f).convert('RGBA')).astype(int); R, G, B = r[..., 0], r[..., 1], r[..., 2]
    ch = (np.abs(r - src).sum(-1) > 24) & (r[..., 3] > 128); mx, mn = r[..., :3].max(-1), r[..., :3].min(-1)
    sgrey = (src[..., 3] > 0) & (np.abs(src[..., 0] - src[..., 2]) < 16) & (src[..., :3].sum(-1) > 60)      # the body's own cloth: not hair
    cand = ch & (R - B < 46) & ~sgrey; light = cand & (R + G + B >= 240)
    lab, n = ndimage.label(cand, np.ones((3, 3))); sz = ndimage.sum(cand, lab, range(1, n + 1)); lt = ndimage.sum(light, lab, range(1, n + 1))
    keep = np.zeros(n + 1, bool); keep[1:] = (sz >= 14) & (lt >= 5); hair = keep[lab]
    o = np.where(hair[..., None], r, 0).astype(np.uint8); o[..., 3] = hair * 255; n = os.path.basename(f)[:-4]
    Image.fromarray(o).save(f'{OUT}/{n}.webp', lossless=True, method=6); names.append(n); print(n, int(hair.sum()))
C = HS.cells()
json.dump({'cw': HS.CW, 'ch': HS.CH, 'bodies': HS.BODIES, 'views': HS.VIEWS, 'styles': [n for n in names if not n.startswith('beard_')], 'beards': [n for n in names if n.startswith('beard_')],
           'at': {b: {v: [C[(b, v)]['x0'], C[(b, v)]['y0']] for v in HS.VIEWS} for b in HS.BODIES}}, open(f'{HERE}/hair/cells.json', 'w'))
