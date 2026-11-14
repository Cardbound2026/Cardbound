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
    dk2 = (row[..., :3].astype(int).sum(-1) < 430)   # Nov 13: the icon's own dark plate only (a pale shadow strip under it was being kept, which left a white bar and a small icon)
    for x0, x1 in runs:
        yy = dk2[:, x0:x1].sum(1) > (x1 - x0) * 0.3; l3, n3 = ndimage.label(yy); best = max(range(1, n3 + 1), key=lambda i: (l3 == i).sum()); ys = np.nonzero(l3 == best)[0]
        xx = np.nonzero(dk2[ys.min():ys.max() + 1, x0:x1].sum(0) > 4)[0]; boxes.append((x0 + xx.min(), ys.min(), x0 + xx.max() + 1, ys.max() + 1))
    for i, (x0, y0, x1, y1) in enumerate(boxes[:6]):
        if abs((x1 - x0) - (y1 - y0)) > 3:   # a lopsided find (bright art broke the plate): square it up around the column's middle
            rx0, rx1 = runs[i]; sz = min(max(x1 - x0, y1 - y0, rx1 - rx0 - 2), row.shape[0]); cx = (rx0 + rx1) // 2; cy = (y0 + y1) // 2 if (y1 - y0) >= sz - 3 else row.shape[0] // 2 - 3
            x0 = max(0, cx - sz // 2); x1 = min(row.shape[1], x0 + sz); y0 = max(0, min(row.shape[0] - sz, cy - sz // 2)); y1 = y0 + sz; print('squared', r, i, sz)
        sp = row[y0:y1, x0:x1].copy(); h, w = sp.shape[:2]
        # the white outside the rounded corners: flood from the four corners
        wh = sp[..., :3].astype(int).sum(-1) > 600; l2, _ = ndimage.label(wh); kill = np.zeros_like(wh)
        for cy, cx in ((0, 0), (0, w - 1), (h - 1, 0), (h - 1, w - 1)):
            if l2[cy, cx]: kill |= l2 == l2[cy, cx]
        sp[kill] = 0; im = Image.fromarray(sp)
        im = im.resize((C, C), Image.NEAREST if abs(w - C) < 3 and abs(h - C) < 3 else Image.LANCZOS)   # fill the cell
        cell = Image.new('RGBA', (C, C)); cell.paste(im, ((C - im.width) // 2, (C - im.height) // 2)); out[r * C:(r + 1) * C, i * C:(i + 1) * C] = np.array(cell)
Image.fromarray(out).save('public/img/ui/talents.webp', lossless=True, method=6); Image.fromarray(out).save('tools/talicons/atlas.png'); print(out.shape)
