# Hero gear (Nov 12): turns painted dressing sheets (gear/raw/<set>_<a|b>.png, made by painting armour onto gear/bodies_<a|b>.png)
# into puppet layers: public/img/hero/gear/<set>_<body>_<view>.webp (ten part cells, the whole suit), and writes
# public/img/hero/slots_<body>_<view>.webp, which says which gear slot every pixel of a suit belongs to (red = slot number * 28).
import json, os, sys, glob, numpy as np
from PIL import Image
import bake_body as BB, gear_sheet as GS
HERE = BB.HERE; S = 128; OUT = BB.OUT + '/gear'; os.makedirs(OUT, exist_ok=True)
SLOTS = ['Helm', 'Shoulders', 'Chest', 'Bracers', 'Gloves', 'Belt', 'Pants', 'Boots']
yy, xx = np.mgrid[0:S, 0:S]; px, py = xx + .5, yy + .5
def tpos(a, b):  # how far along a -> b each pixel sits
    vx, vy = b[0] - a[0], b[1] - a[1]; return ((px - a[0]) * vx + (py - a[1]) * vy) / (vx * vx + vy * vy)
def slot_layers(body):
    sk = json.load(open(f'{HERE}/src/{body}/skel.json')); out = {}
    for view in 'sne':
        J = BB.joints(sk[view]); neck, nose = J['NECK'], J['NOSE']; chin = nose[1] + (neck[1] - nose[1]) * .58
        hipy = (J['LEFT HIP'][1] + J['RIGHT HIP'][1]) / 2; sl = np.full((S, S), 2, np.uint8)
        if view != 'e':
            part = np.array(Image.open(f'{HERE}/src/{body}/map_{view}.png')); sw = abs(J['LEFT SHOULDER'][0] - J['RIGHT SHOULDER'][0])
            A, B = ('RIGHT', 'LEFT') if J['RIGHT SHOULDER'][0] < J['LEFT SHOULDER'][0] else ('LEFT', 'RIGHT')
            sl[(part == 0) & (py > hipy - sw * .24)] = 5; sl[(part == 0) & (py > hipy - sw * .04)] = 6
            for i, sd in ((2, A), (4, B)):
                sh, el, wr = J[sd + ' SHOULDER'], J[sd + ' ELBOW'], J[sd + ' ARM']
                sl[((part == i) | (part == 0)) & (np.hypot(px - sh[0], py - sh[1]) < sw * .27) & (py < sh[1] + sw * .2) & (abs(px - neck[0]) > sw * .2)] = 1
                t = tpos(el, wr); sl[part == i + 1] = 3; sl[(part == i + 1) & (t > .82)] = 4
            for i, sd in ((6, A), (8, B)):
                kn, an = J[sd + ' KNEE'], J[sd + ' LEG']; sl[part == i] = 6; t = tpos(kn, an); sl[part == i + 1] = 6; sl[(part == i + 1) & (t > .4)] = 7
            sl[part == 1] = 0; out[view] = sl
        else:
            kn = (J['LEFT KNEE'][1] + J['RIGHT KNEE'][1]) / 2; an = max(J['LEFT LEG'][1], J['RIGHT LEG'][1])
            sl[py > hipy - 7] = 5; sl[py > hipy] = 6; sl[py > kn + (an - kn) * .4] = 7; sl[py < chin] = 0; out['e'] = sl
            arm = np.full((S, S), 2, np.uint8); best = None
            for sd in ('RIGHT', 'LEFT'):   # the near arm is the one bake_body picked; both lie close, so slot by whichever is nearer
                sh, el, wr = J[sd + ' SHOULDER'], J[sd + ' ELBOW'], J[sd + ' ARM']; d = BB.seg_d(px, py, el, BB.ext(el, wr, .5)); t = tpos(el, wr)
                m = d < 9; arm[m & (py > el[1])] = 3; arm[m & (t > .82)] = 4; arm[(np.hypot(px - sh[0], py - sh[1]) < 9) & (py < sh[1] + 7)] = 1
            out['e_full'] = arm
    return out
def as_layer(sl): im = np.zeros((S, S, 4), np.uint8); im[..., 0] = sl * 28 + 14; im[..., 3] = 255; return im
def bake_slots():
    BB.DARK = 1
    for b in sum(GS.PAIRS.values(), []):
        st = BB.bake(b, {k: as_layer(v) for k, v in slot_layers(b).items()})
        for v, strip in st.items(): Image.fromarray(strip).save(f'{BB.OUT}/slots_{b}_{v}.webp', lossless=True, method=6)
    BB.DARK = .74
def bake_set(name):
    for pk, bodies in GS.PAIRS.items():
        f = f'{HERE}/gear/raw/{name}_{pk}.png'
        if not os.path.exists(f): continue
        res = np.array(Image.open(f).convert('RGBA')).astype(int); src = np.array(Image.open(f'{HERE}/gear/bodies_{pk}.png').convert('RGBA')).astype(int)
        if res.shape != src.shape: print('size mismatch', f, res.shape); continue
        gear = (np.abs(res - src).sum(-1) > 24) & (res[..., 3] > 128); lay = np.where(gear[..., None], res, 0).astype(np.uint8); lay[..., 3] = gear * 255
        for r, b in enumerate(bodies):
            L = {}
            for c, v in enumerate(GS.VIEWS):
                _, x0, y0 = GS.origin(b, v); im = np.zeros((S, S, 4), np.uint8); cell = lay[r * GS.CH:(r + 1) * GS.CH, c * GS.CW:(c + 1) * GS.CW]
                im[y0:y0 + GS.CH, max(0, x0):x0 + GS.CW] = cell[:S - y0, max(0, -x0):]; L[v] = im
            for v, strip in BB.bake(b, L).items(): Image.fromarray(strip).save(f'{OUT}/{name}_{b}_{v}.webp', lossless=True, method=6)
    print('gear', name)
if __name__ == '__main__':
    bake_slots()
    for n in sorted({os.path.basename(f)[:-6] for f in glob.glob(f'{HERE}/gear/raw/*.png')}):
        if len(sys.argv) < 2 or n in sys.argv[1:]: bake_set(n)
