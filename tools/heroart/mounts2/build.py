# Nov 13: mount sheets rebuilt from the regenerated PixelLab runs (the first set tiptoed and pranced) and nine new mounts.
# Reads the saved preview sheets (flat #1f252c ground, an 18 px label strip on top), copies them to src/, writes ../mounts/<key>.png.
import os, shutil, numpy as np
from PIL import Image
from manifest import B, RE, NEW, RE2, ALPHA, CH
H = os.path.dirname(os.path.abspath(__file__)); BG = (31, 37, 44)
def load(blob):
    dst = f'{H}/src/{blob}.png'
    if not os.path.exists(dst): shutil.copy(B + blob + '.png', dst)
    a = np.array(Image.open(dst).convert('RGBA')); a = a[18:]; m = (a[..., 0] == BG[0]) & (a[..., 1] == BG[1]) & (a[..., 2] == BG[2]); a[m] = 0; return a
def cells(a, cell, cols, rows, r0=0, c0=0, n=None, vertical=False):
    out = []
    for i in range(n if n else cols * rows):
        r, c = (r0 + i, c0) if vertical else (r0 + (c0 + i) // cols, (c0 + i) % cols)
        out.append(a[r * cell:(r + 1) * cell, c * cell:(c + 1) * cell])
    return out
def bbox(fr): m = np.any([f[..., 3] > 40 for f in fr], 0); ys = np.nonzero(m.any(1))[0]; xs = np.nonzero(m.any(0))[0]; return xs.min(), ys.min(), xs.max() + 1, ys.max() + 1
def place(sheet, row, col, f, box, foot, cx):
    x0, y0, x1, y1 = box; sp = f[y0:y1, x0:x1]; h, w = sp.shape[:2]
    if w > 128: o = (w - 128) // 2; sp = sp[:, o:o + 128]; w = 128
    if h > 128: sp = sp[h - 128:]; h = 128
    px = int(round(cx - w / 2)); px = max(0, min(128 - w, px)); py = max(0, min(128 - h, foot + 1 - h))
    cell = np.zeros((128, 128, 4), np.uint8); cell[py:py + h, px:px + w] = sp; sheet[row * 128:(row + 1) * 128, col * 128:(col + 1) * 128] = cell
ROWS = {'s': 0, 'e': 1, 'n': 2}; rep = {}
def redo(k, D):
    sheet = np.array(Image.open(f'{H}/../mounts/{k}.png').convert('RGBA'))
    for v, (blob, cell) in D.items():
        r = ROWS[v]; st = sheet[r * 128:(r + 1) * 128, :128]; m = st[..., 3] > 40; foot = int(np.nonzero(m.any(1))[0].max()); xs = np.nonzero(m.any(0))[0]; cx = (xs.min() + xs.max() + 1) / 2
        fr = cells(load(blob), cell, 3, 2); box = bbox(fr); rep[k + v] = (box[2] - box[0], box[3] - box[1])
        for i, f in enumerate(fr): place(sheet, r, 1 + i, f, box, foot, cx)
    Image.fromarray(sheet).save(f'{H}/../mounts/{k}.png')
for k, D in RE.items():
    sheet = np.array(Image.open(f'{H}/../mounts/{k}.png').convert('RGBA')); assert sheet.shape[:2] == (384, 896), sheet.shape
    for v, (blob, cell) in D.items():
        r = ROWS[v]; st = sheet[r * 128:(r + 1) * 128, :128]; m = st[..., 3] > 40; foot = int(np.nonzero(m.any(1))[0].max()); xs = np.nonzero(m.any(0))[0]; cx = (xs.min() + xs.max() + 1) / 2
        fr = cells(load(blob), cell, 3, 2); box = bbox(fr); rep[k + v] = (box[2] - box[0], box[3] - box[1])
        for i, f in enumerate(fr): place(sheet, r, 1 + i, f, box, foot, cx)
    Image.fromarray(sheet).save(f'{H}/../mounts/{k}.png')
for k, (blob, cell, (rb, rc, c0, cols, vert)) in NEW.items():
    sheet = np.zeros((384, 896, 4), np.uint8); run = load(blob); rot = cells(load(rb), rc, cols, 1, 0, c0, 3, vert) if not vert else cells(load(rb), rc, 1, 6, c0, 0, 3, True)
    for j, v in enumerate('esn'):
        r = ROWS[v]; fr = cells(run, cell, 6, 3, j, 0, 6)
        if k == 'slug' and v == 'n': fr = [fr[i] for i in (0, 1, 2, 2, 1, 0)]     # its last frames lose the lava cracks
        box = bbox(fr); rep[k + v] = (box[2] - box[0], box[3] - box[1]); sb = bbox([rot[j]])
        place(sheet, r, 0, rot[j], sb, 120, 64)
        for i, f in enumerate(fr): place(sheet, r, 1 + i, f, box, 120, 64)
    Image.fromarray(sheet).save(f'{H}/../mounts/{k}.png')
for k, D in CH.items():
    rb, rc, c0, cols = D['rot']; rot = cells(load(rb), rc, cols, 1, 0, c0, 3); sheet = np.zeros((384, 896, 4), np.uint8)
    for j, v in enumerate('esn'): place(sheet, ROWS[v], 0, rot[j], bbox([rot[j]]), 120, 64)
    Image.fromarray(sheet).save(f'{H}/../mounts/{k}.png'); redo(k, {v: D[v] for v in 'esn'})
for k, D in RE2.items(): redo(k, D)
for k, a in ALPHA.items():
    sh = np.array(Image.open(f'{H}/../mounts/{k}.png').convert('RGBA')).astype(float); sh[..., 3] *= a; Image.fromarray(sh.astype(np.uint8)).save(f'{H}/../mounts/{k}.png')
print(rep)
