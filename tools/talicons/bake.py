# Talent icons (Nov 13): bake.py <joined sheet.png> [<joined sheet 2.png> ...] -> public/img/ui/talents.webp
# Each sheet is rows of 256x48 with six dark rounded-square icons on white; every icon is cut out and centred in a 40 px cell (6 per row).
import sys, numpy as np
from PIL import Image
from scipy import ndimage
rows = []
for f in sys.argv[1:]:
    a = np.array(Image.open(f).convert('RGBA')); a = a[a.shape[0] % 48:]
    for r in range(a.shape[0] // 48): rows.append(a[r * 48:(r + 1) * 48])
C = 40; out = np.zeros((C * len(rows), C * 6, 4), np.uint8)
for r, row in enumerate(rows):
    dark = (row[..., :3].astype(int).sum(-1) < 600)
    cols = dark.sum(0) > 10; lab, n = ndimage.label(cols); runs = [np.nonzero(lab == i)[0] for i in range(1, n + 1)]; runs = [(x.min(), x.max() + 1) for x in runs if len(x) > 20]
    if len(runs) != 6: xs = np.nonzero(cols)[0]; x0, x1 = xs.min(), xs.max() + 1; runs = [(int(x0 + (x1 - x0) * i / 6 + 1), int(x0 + (x1 - x0) * (i + 1) / 6 - 1)) for i in range(6)]; print('row', r, 'even split')
    boxes = []
    for x0, x1 in runs: ys = np.nonzero(dark[:, x0:x1].sum(1) > 10)[0]; boxes.append((x0, ys.min(), x1, ys.max() + 1))
    for i, (x0, y0, x1, y1) in enumerate(boxes[:6]):
        sp = row[y0:y1, x0:x1].copy(); h, w = sp.shape[:2]
        # the white outside the rounded corners: flood from the four corners
        wh = sp[..., :3].astype(int).sum(-1) > 600; l2, _ = ndimage.label(wh); kill = np.zeros_like(wh)
        for cy, cx in ((0, 0), (0, w - 1), (h - 1, 0), (h - 1, w - 1)):
            if l2[cy, cx]: kill |= l2 == l2[cy, cx]
        sp[kill] = 0; im = Image.fromarray(sp)
        if max(w, h) > C: im = im.resize((min(C, round(w * C / max(w, h))), min(C, round(h * C / max(w, h)))), Image.NEAREST)
        cell = Image.new('RGBA', (C, C)); cell.paste(im, ((C - im.width) // 2, (C - im.height) // 2)); out[r * C:(r + 1) * C, i * C:(i + 1) * C] = np.array(cell)
Image.fromarray(out).save('public/img/ui/talents.webp', lossless=True, method=6); Image.fromarray(out).save('tools/talicons/atlas.png'); print(out.shape)
