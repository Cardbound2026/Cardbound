# Hero puppets (Nov 12): cuts a base body into puppet parts.
#   in : tools/heroart/src/<body>/{s,n,e,e_arm}.png (128x128; e = side view with the arm painted out, e_arm = that arm alone) and skel.json
#   out: public/img/hero/<body>_<view>.webp  = 10 cells of 128x128 side by side, one per part, each still at its place on the canvas
#        tools/heroart/src/<body>/map_<view>.png = which part every canvas pixel belongs to (gear overlays are cut with the same map)
#        src/puppet_data.js = pivots and sizes for the game
# parts: 0 torso 1 head 2 upper arm A 3 lower arm A 4 upper arm B 5 lower arm B 6 thigh A 7 shin A 8 thigh B 9 shin B
#        (A = the limb on the left of the picture; in the side view A is the near side and B a darker copy behind it)
import json, sys, os, glob, numpy as np
from PIL import Image
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE)); OUT = ROOT + '/public/img/hero'; os.makedirs(OUT, exist_ok=True); S = 128; NP = 10
def seg_d(px, py, a, b):
    ax, ay = a; bx, by = b; vx, vy = bx - ax, by - ay; L2 = vx * vx + vy * vy or 1e-6
    t = np.clip(((px - ax) * vx + (py - ay) * vy) / L2, 0, 1); return np.hypot(px - (ax + t * vx), py - (ay + t * vy))
def ext(a, b, k): return (b[0] + (b[0] - a[0]) * k, b[1] + (b[1] - a[1]) * k)
def joints(sk):
    J = {k['label']: (k['x'] * S, k['y'] * S) for k in sk}; return J
def bake(body):
    src = f'{HERE}/src/{body}'; skel = json.load(open(src + '/skel.json')); info = {}
    yy, xx = np.mgrid[0:S, 0:S]; px, py = xx + .5, yy + .5
    for view in 'sne':
        im = np.array(Image.open(f'{src}/{view}.png').convert('RGBA')); J = joints(skel[view]); neck, nose = J['NECK'], J['NOSE']
        A, B = ('RIGHT', 'LEFT') if J['RIGHT SHOULDER'][0] < J['LEFT SHOULDER'][0] else ('LEFT', 'RIGHT')
        chin = nose[1] + (neck[1] - nose[1]) * .58
        part = np.zeros((S, S), np.uint8); cells = np.zeros((NP, S, S, 4), np.uint8)
        if view != 'e':
            sw = abs(J['LEFT SHOULDER'][0] - J['RIGHT SHOULDER'][0]); mh = ((J['LEFT HIP'][0] + J['RIGHT HIP'][0]) / 2, (J['LEFT HIP'][1] + J['RIGHT HIP'][1]) / 2)
            D = [seg_d(px, py, neck, mh) / (sw * .50)]; D.append(np.full((S, S), 9.0))
            for sd in (A, B):
                sh, el, wr = J[sd + ' SHOULDER'], J[sd + ' ELBOW'], J[sd + ' ARM']
                D.append(seg_d(px, py, sh, el) / (sw * .24)); D.append(seg_d(px, py, el, ext(el, wr, .5)) / (sw * .24))
            for sd in (A, B):
                hp, kn, an = J[sd + ' HIP'], J[sd + ' KNEE'], J[sd + ' LEG']
                D.append(seg_d(px, py, hp, kn) / (sw * .36)); D.append(seg_d(px, py, kn, ext(kn, an, .6)) / (sw * .33))
            part = np.argmin(np.stack(D), 0).astype(np.uint8); part[py < chin] = 1
            piv = [mh, (neck[0], chin + 1), J[A + ' SHOULDER'], J[A + ' ELBOW'], J[B + ' SHOULDER'], J[B + ' ELBOW'], J[A + ' HIP'], J[A + ' KNEE'], J[B + ' HIP'], J[B + ' KNEE']]
            for i in range(NP): cells[i][part == i] = im[part == i]
            nk = (part == 0) & (py < chin + 5) & (abs(px - neck[0]) < sw * .3); cells[1][nk] = im[nk]   # the head keeps a little neck, so a nod leaves no gap
            capr = {2: sw * .22, 4: sw * .22, 3: sw * .2, 5: sw * .2, 6: 0, 8: 0, 7: sw * .3, 9: sw * .3}; par = {2: 0, 4: 0, 3: 2, 5: 4, 7: 6, 9: 8}
            for c, p in par.items():   # a round cap of the parent's pixels at each joint, so a turned limb leaves no gap
                m = (np.hypot(px - piv[c][0], py - piv[c][1]) < capr[c]) & (part == p); cells[c][m] = im[m]
            order = [7, 6, 9, 8, 0, 1, 2, 3, 4, 5] if view == 's' else [7, 6, 9, 8, 2, 3, 4, 5, 0, 1]
        else:
            arm = np.array(Image.open(f'{src}/e_full.png').convert('RGBA')); gone = (arm != im).any(-1)   # what the arm-less repaint changed
            cand = {}
            for sd in ('RIGHT', 'LEFT'):
                sh, el, wr = J[sd + ' SHOULDER'], J[sd + ' ELBOW'], J[sd + ' ARM']; d = np.minimum(seg_d(px, py, sh, el), seg_d(px, py, el, ext(el, wr, .6))); cand[sd] = (gone & (d < 6)).sum()
            near = max(cand, key=cand.get); sh, el, wr = J[near + ' SHOULDER'], J[near + ' ELBOW'], J[near + ' ARM']
            full = np.array(Image.open(f'{src}/e_full.png').convert('RGBA'))   # the side view as generated, arm included: the arm is everything near its bones
            ar = 6.6 if body in ('warrior', 'paladin') else 4.4; d = np.minimum(seg_d(px, py, sh, el), seg_d(px, py, el, ext(el, wr, .42))); am = (full[..., 3] > 0) & (d < ar); arm = full
            # only skin (and the outline hugging it) belongs to the arm: the shorts behind the hand stay with the body
            R, G, B = (full[..., k].astype(int) for k in range(3)); skin = am & (R - B > 22) & (R > 70)
            nb = np.zeros_like(skin)
            for oy in (-1, 0, 1):
                for ox in (-1, 0, 1): nb |= np.roll(np.roll(skin, oy, 0), ox, 1)
            am = skin | (am & nb & (R + G + B < 150)) | (am & (d < 2.2))
            hip = ((J['LEFT HIP'][0] + J['RIGHT HIP'][0]) / 2, (J['LEFT HIP'][1] + J['RIGHT HIP'][1]) / 2); knee = ((J['LEFT KNEE'][0] + J['RIGHT KNEE'][0]) / 2, (J['LEFT KNEE'][1] + J['RIGHT KNEE'][1]) / 2)
            part[:] = 0; part[py < chin] = 1; part[py >= hip[1] + 6] = 6; part[py >= knee[1]] = 7
            for i in (0, 1, 6, 7): cells[i][part == i] = im[part == i]
            nk = (part == 0) & (py < chin + 5) & (im[..., 3] > 0); cells[1][nk] = im[nk]
            m = (part == 6) & (py < knee[1]) | ((part == 0) & (py > hip[1] - 2)); cells[6][(py > hip[1] - 4) & (py < knee[1]) & (im[..., 3] > 0)] = im[(py > hip[1] - 4) & (py < knee[1]) & (im[..., 3] > 0)]  # the thigh keeps a cap up into the hip
            cells[7][(py > knee[1] - 5) & (im[..., 3] > 0)] = im[(py > knee[1] - 5) & (im[..., 3] > 0)]
            cells[2][am & (py < el[1] + 1)] = arm[am & (py < el[1] + 1)]; cells[3][am & (py >= el[1] - 3)] = arm[am & (py >= el[1] - 3)]
            def dark(c): o = c.copy(); o[..., :3] = (o[..., :3] * .74).astype(np.uint8); return o
            def shift(c, dx): o = np.zeros_like(c); o[:, dx:] = c[:, :S - dx] if dx > 0 else c; return o
            cells[4], cells[5], cells[8], cells[9] = shift(dark(cells[2]), 3), shift(dark(cells[3]), 3), shift(dark(cells[6]), 2), shift(dark(cells[7]), 2)
            piv = [hip, (neck[0], chin + 1), sh, el, (sh[0] + 3, sh[1]), (el[0] + 3, el[1]), (hip[0], hip[1] + 2), knee, (hip[0] + 2, hip[1] + 2), (knee[0] + 2, knee[1])]
            # the part map for gear: arm pieces come from the picture's own arm layer, so the body map only needs torso / head / legs
            order = [9, 8, 7, 6, 0, 1, 2, 3]   # the far arm stays hidden behind the body
        strip = np.concatenate(list(cells), 1); Image.fromarray(strip).save(f'{OUT}/{body}_{view}.webp', lossless=True, method=6)
        Image.fromarray(part, 'L').save(f'{src}/map_{view}.png')
        ys = np.nonzero(im[..., 3].any(1))[0]; xs = np.nonzero(im[..., 3].any(0))[0]
        info[view] = {'piv': [[round(p[0], 1), round(p[1], 1)] for p in piv], 'order': order, 'foot': int(ys.max()) + 1, 'top': int(ys.min()), 'cx': round((xs.min() + xs.max() + 1) / 2, 1)}
    return info
data = {}
for b in sorted(os.listdir(HERE + '/src')):
    if os.path.exists(f'{HERE}/src/{b}/skel.json'): data[b] = bake(b); print('baked', b)
open(ROOT + '/src/puppet_data.js', 'w').write('// made by tools/heroart/bake_body.py: hero puppet bodies (pivots per part and view, art size ' + str(S) + ')\nwindow.CB_PUPPET_DATA = ' + json.dumps({'S': S, 'bodies': data}) + ';\n')
