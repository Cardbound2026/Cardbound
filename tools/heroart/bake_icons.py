# Item pictures (Nov 12): one 64x64 picture per kind of item and map, cut from the art the heroes wear, so an item's picture is the piece
# you see on the hero. public/img/items.webp: one row per kind (ROWS below, the same list as src/itemicons.js), six columns
# (physical, fire, frost, nature, arcane, shadow; codexes: Warrior, Rogue, Mage, Paladin, Warlock, Shaman).
import os, numpy as np
from PIL import Image
import bake_gear as BG, gear_sheet as GS, bake_weapons as BW
HERE = GS.HERE; C = 64; MAPS = ['physical', 'fire', 'frost', 'nature', 'arcane', 'shadow']; TYPES = ['Plate', 'Leather', 'Cloth']
ROWS = [f'{s}_{t}' for s in BG.SLOTS for t in TYPES] + BW.TYPES + ['Cloak', 'Ring', 'Amulet', 'Codex']
def fit(sp):
    a = sp[..., 3] > 40; ys = np.nonzero(a.any(1))[0]; xs = np.nonzero(a.any(0))[0]
    if not len(ys): return np.zeros((C, C, 4), np.uint8)
    sp = sp[ys.min():ys.max() + 1, xs.min():xs.max() + 1]; h, w = sp.shape[:2]
    if h > 58: sp = sp[:58]; h = 58                       # long weapons: show the head
    if w > 58: sp = sp[:, (w - 58) // 2:(w - 58) // 2 + 58]; w = 58
    k = max(1, min(3, 56 / max(h, w))); k = int(k * 2) / 2; W2, H2 = int(w * k), int(h * k); im = Image.fromarray(sp).resize((W2, H2), Image.NEAREST); out = Image.new('RGBA', (C, C)); out.paste(im, ((C - W2) // 2, (C - H2) // 2)); return np.array(out)
atlas = np.zeros((C * len(ROWS), C * 6, 4), np.uint8)
def put(row, col, sp): r = ROWS.index(row); atlas[r * C:(r + 1) * C, col * C:(col + 1) * C] = fit(sp)
sl = BG.slot_layers('paladin')['s']; _, x0, y0 = GS.origin('paladin', 's'); src = np.array(Image.open(f'{HERE}/gear/bodies_a.png').convert('RGBA')).astype(int)[GS.CH:, :GS.CW]
slc = np.zeros((GS.CH, GS.CW), np.uint8); slc[:, max(0, -x0):] = sl[y0:y0 + GS.CH, max(0, x0):x0 + GS.CW][:, :GS.CW - max(0, -x0)]
for mi, m in enumerate(MAPS):
    for t in TYPES:
        res = np.array(Image.open(f'{HERE}/gear/raw/{m}_{t}_a.png').convert('RGBA')).astype(int)[GS.CH:, :GS.CW]
        gear = (np.abs(res - src).sum(-1) > 24) & (res[..., 3] > 128)
        for si, s in enumerate(BG.SLOTS):
            pm = gear & (slc == si)
            if s in ('Shoulders', 'Bracers', 'Gloves'): pm = pm & (np.arange(GS.CW)[None, :] < GS.CW // 2 - 1)   # one of the pair, so it shows large
            sp = np.where(pm[..., None], res, 0).astype(np.uint8); put(f'{s}_{t}', mi, sp)
wa = np.array(Image.open(f'{BW.OUT}/weapons.webp').convert('RGBA'))
for ti, t in enumerate(BW.TYPES):
    for i in range(6): put(t, i, wa[ti * BW.CH:(ti + 1) * BW.CH, i * BW.CW:(i + 1) * BW.CW])
cl = np.array(Image.open(f'{BW.OUT}/cloak.webp').convert('RGBA'))[256:384, 128:256]   # the paladin's cloak from behind
COL = [[124, 104, 86], [156, 46, 38], [150, 182, 208], [72, 108, 62], [112, 72, 164], [54, 50, 66]]
ys = np.nonzero((cl[..., 3] > 0).any(1))[0]; xs = np.nonzero((cl[..., 3] > 0).any(0))[0]; cl = cl[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
small = np.array(Image.fromarray(cl).resize((cl.shape[1] * 56 // cl.shape[0], 56), Image.NEAREST))
for i, c in enumerate(COL):
    o = small.copy(); k = o[..., :1].astype(float) / 150; o[..., :3] = np.clip(np.array(c) * k, 0, 255).astype(np.uint8); put('Cloak', i, o)
for name in ('ring', 'amulet', 'codex'):
    a = np.array(Image.open(f'{HERE}/icons/{name}.png').convert('RGBA')); al = (a[..., 3] > 40); cols = al.any(0)
    from scipy import ndimage
    lab, n = ndimage.label(ndimage.binary_closing(cols, np.ones(5)) | cols); runs = [np.nonzero(lab == i)[0] for i in range(1, n + 1)]; runs = [r for r in runs if al[:, r].sum() > 40]
    if len(runs) != 6: print(name, 'pieces', len(runs)); w = a.shape[1] / 6; runs = [np.arange(int(i * w), int((i + 1) * w)) for i in range(6)]
    for i, r in enumerate(runs): put(name.capitalize(), i, a[:, r.min():r.max() + 1])
Image.fromarray(atlas).save(os.path.dirname(os.path.dirname(HERE)) + '/public/img/items.webp', lossless=True, method=6)
print(len(ROWS), ROWS)
