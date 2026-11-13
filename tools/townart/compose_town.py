# Town art (Nov 12): paints Emberwatch in pixel art from the layout in src/city.js.
#   ground  = seamless textures (src/g,p,a,b,w.png) with ragged blended edges, the city wall, the bridges and soft prop shadows,
#             baked into 12 x 12 tile chunks: public/img/town/g_<i>_<j>.webp (32 art px per tile)
#   sprites = every building and prop cropped to its pixels: public/img/town/<name>.webp, sizes listed in src/townart_data.js
#   mini    = the whole city small, for the minimap: public/img/town/mini.webp
# usage: python3 tools/townart/compose_town.py [preview.png x0 y0 x1 y1]   (re-run after changing the layout in src/city.js)
import json, sys, os, subprocess, glob, numpy as np
from PIL import Image, ImageFilter, ImageEnhance, ImageDraw
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE)); SRC = HERE + '/src'; OUT = ROOT + '/public/img/town'; T = 32; CH = 12
os.makedirs(OUT, exist_ok=True)
js = open(ROOT + '/src/city.js').read(); js = js[:js.index('  const districtAt')] + "\nprocess.stdout.write(JSON.stringify({MW,MH,ground,PROPS,ARN}));"
d = json.loads(subprocess.check_output(['node', '-e', js])); MW, MH, PROPS, ARN = d['MW'], d['MH'], d['PROPS'], d['ARN']
W, H = MW * T, MH * T
G = np.array([[{'g': 0, 'p': 1, 'a': 2, 'b': 3, '~': 4}[c] for c in row] for row in d['ground']])
def tex(name, bright=1.0, sat=1.0):
    im = Image.open(f'{SRC}/{name}.png').convert('RGB'); im = ImageEnhance.Brightness(im).enhance(bright); im = ImageEnhance.Color(im).enhance(sat)
    a = np.array(im).astype(np.float32); b = 32; Pd = a.shape[0] - b; w = (np.arange(b) / b).astype(np.float32)   # cross-fade the edges so it repeats without a seam
    a[:, :b] = a[:, Pd:Pd + b] * (1 - w)[None, :, None] + a[:, :b] * w[None, :, None]; a[:b] = a[Pd:Pd + b] * (1 - w)[:, None, None] + a[:b] * w[:, None, None]
    a = a[:Pd, :Pd]; return a[np.arange(H) % Pd][:, np.arange(W) % Pd]
rng = np.random.default_rng(5)
def noise(scale):
    n = rng.random((H // scale + 3, W // scale + 3)); im = Image.fromarray((n * 255).astype(np.uint8)).resize(((W // scale + 3) * scale, (H // scale + 3) * scale), Image.BICUBIC)
    return (np.array(im)[:H, :W] / 255.0).astype(np.float32)
N = noise(12) * .6 + noise(5) * .4
canvas = tex('g', .8, .85)
canvas *= (0.9 + 0.2 * noise(90))[..., None]   # big soft light and dark patches so the grass doesn't read as a repeat
for k, name, br, sat, blur, rim in [(1, 'p', .8, .8, 9, .25), (2, 'a', .62, .7, 9, .2), (3, 'b', .72, .45, 9, .45), (4, 'w', .85, .9, 10, .6)]:
    m = Image.fromarray(((G == k) * 255).astype(np.uint8)).resize((W, H), Image.NEAREST).filter(ImageFilter.GaussianBlur(blur))
    hard = (np.array(m) / 255.0 + (N - .5) * .35) > .5
    hm = Image.fromarray((hard * 255).astype(np.uint8)); grow = np.array(hm.filter(ImageFilter.MaxFilter(5))) > 0; shrink = np.array(hm.filter(ImageFilter.MinFilter(5))) > 0
    canvas[grow & ~hard] *= (1 - rim); tx = tex(name, br, sat); canvas[hard] = tx[hard]; canvas[hard & ~shrink] *= (1 - rim * .5); del tx
img = Image.fromarray(np.clip(canvas, 0, 255).astype(np.uint8)).convert('RGBA'); del canvas
def spr(name):
    im = Image.open(f'{SRC}/{name}.png').convert('RGBA'); return im.crop(im.getbbox())
def shadow(cx, by, w, h=18, a=110):
    sh = Image.new('L', (int(w) + 32, h + 32), 0); ImageDraw.Draw(sh).ellipse([12, 12, sh.width - 12, sh.height - 12], fill=a); sh = sh.filter(ImageFilter.GaussianBlur(5))
    blk = Image.new('RGBA', sh.size, (0, 0, 0, 255)); blk.putalpha(sh); img.alpha_composite(blk, (max(0, int(cx - sh.width / 2)), max(0, int(by - sh.height / 2))))
# the bridges (walked over, so they are part of the ground)
for p in PROPS:
    if p['kind'] != 'bridge': continue
    s = spr('bridge_8' if p['w'] >= 8 else 'bridge_5'); s = Image.merge('RGBA', (*ImageEnhance.Brightness(s.convert('RGB')).enhance(.78).split(), s.split()[3])); s = s.resize((s.width * 2, s.height * 2), Image.NEAREST); hh = p['h'] * T; top = (s.height - hh) // 2; s = s.crop((0, top, s.width, top + hh))
    img.alpha_composite(s, (int((p['x'] + p['w'] / 2) * T - s.width / 2), p['y'] * T))
# the city wall: the front face along the top and bottom, the wall top along the sides
wh = Image.open(SRC + '/wall_h.png').convert('RGBA'); _a = np.array(wh); _a[:16][_a[:16, :, :3].sum(-1) < 60] = 0; wh = Image.fromarray(_a)  # the black sky above the crenels is see-through
hs = sorted((p['y'], p['x']) for p in PROPS if p['kind'] == 'wallseg' and p['side'] == 'h'); vs = sorted((p['x'], p['y']) for p in PROPS if p['kind'] == 'wallseg' and p['side'] == 'v')
wl = wh.crop((0, 0, wh.width, 48)).transpose(Image.ROTATE_90); wr = wh.crop((0, 0, wh.width, 48)).transpose(Image.ROTATE_270)   # the sides: the same stonework turned, crenels facing out
for x, y in vs:
    side = wl if x < MW / 2 else wr; oy = (y * T) % side.height; img.alpha_composite(side.crop((0, oy, side.width, oy + T)), (x * T - (0 if x < MW / 2 else 16), y * T))
for y, x in hs: img.alpha_composite(wh.crop(((x * T) % wh.width, 0, (x * T) % wh.width + T, wh.height)), (x * T, y * T + T - wh.height + 8))
# soft shadows under everything that stands on the ground
SH = {'bld': 1.0, 'hall': 1.0, 'keep': 1.0, 'tower': .8, 'gatehouse': 0, 'awning': .9, 'stall': .9, 'wagon': .9, 'fountain': .9, 'brazier': 1.0, 'tree': 2.2, 'torch': .9, 'statue': 1.4, 'board': 1.3, 'arenaboard': 1.3, 'sign': .9, 'chest': .9}
for p in PROPS:
    k = SH.get(p['kind'])
    if k: shadow((p['x'] + p['w'] / 2) * T + 4, (p['y'] + p['h']) * T - 2, p['w'] * T * k, 14 if p['w'] <= 1 else 22)
if len(sys.argv) > 1 and sys.argv[1].endswith('.png'):   # a preview with the sprites placed the way the game places them
    x0, y0, x1, y1 = [int(v) for v in sys.argv[2:6]]; pv = img.copy(); items = []
    def name_of(p):
        k = p['kind']
        if k == 'bld': n = f"bld_{p.get('roof', 'red')}{'stone' if p.get('wall') == 'stone' else ''}_{p['w']}"; return n + 'b' if n == 'bld_red_6' and (p['x'] + p['y']) % 2 else n
        if k == 'hall': return {'Hall of Records': 'hall_records', 'Grand Library': 'hall_library', 'Cathedral of the Ember': 'hall_cathedral', 'Guild Hall': 'hall_guild'}[p['name']]
        if k == 'awning': return 'awning_' + p['c']
        if k == 'tree': return f"tree_{p['v']}"
        return k
    co = Image.open(SRC + '/colosseum.png').convert('RGBA'); co = co.resize((co.width * 2, co.height * 2), Image.NEAREST); pv.alpha_composite(co, (int(ARN['x'] * T - 281 * 2), int(ARN['y'] * T - 217 * 2)))
    for p in PROPS:
        if p['kind'] in ('wallseg', 'bridge', 'colosseum'): continue
        f = f"{SRC}/{name_of(p)}.png"
        if os.path.exists(f): items.append((p['y'] + p['h'], spr(name_of(p)), (p['x'] + p['w'] / 2) * T, (p['y'] + p['h']) * T + (4 if p['w'] == 1 else 0)))
        else: print('missing', name_of(p))
    for _, s, cx, by in sorted(items, key=lambda t: t[0]):
        x, y = int(cx - s.width / 2), int(by - s.height); bx = (max(0, -x), max(0, -y), min(s.width, W - x), min(s.height, H - y))
        if bx[2] > bx[0] and bx[3] > bx[1]: pv.alpha_composite(s.crop(bx), (max(0, x), max(0, y)))
    pv.crop((x0 * T, y0 * T, x1 * T, y1 * T)).save(sys.argv[1]); print('preview', sys.argv[1]); sys.exit()
for j in range((MH + CH - 1) // CH):
    for i in range((MW + CH - 1) // CH):
        c = Image.new('RGB', (CH * T, CH * T), (11, 9, 7)); c.paste(img.crop((i * CH * T, j * CH * T, min(W, (i + 1) * CH * T), min(H, (j + 1) * CH * T))).convert('RGB'), (0, 0)); c.save(f'{OUT}/g_{i}_{j}.webp', quality=82, method=6)
sizes = {}
for f in sorted(glob.glob(SRC + '/*.png')):
    n = os.path.basename(f)[:-4]
    if n in ('g', 'p', 'a', 'b', 'w', 'wall_h', 'wall_v', 'bridge_8', 'bridge_5') or n.endswith('_v1'): continue
    s = Image.open(f).convert('RGBA') if n == 'colosseum' else spr(n)  # the Colosseum keeps its whole canvas: the game lines its sand up by pixel
    s.save(f'{OUT}/{n}.webp', lossless=True, method=6); sizes[n] = [s.width, s.height]
open(ROOT + '/src/townart_data.js', 'w').write('// made by tools/townart/compose_town.py: the town sprites and their sizes in art pixels (32 to a tile)\nwindow.CB_TOWNART_DATA = ' + json.dumps({'T': T, 'CH': CH, 'sprites': sizes}) + ';\n')
full = img.copy(); items = []
for p in PROPS:
    k = p['kind']
    if k in ('wallseg', 'bridge', 'colosseum'): continue
    n = (f"bld_{p.get('roof', 'red')}{'stone' if p.get('wall') == 'stone' else ''}_{p['w']}" if k == 'bld' else {'Hall of Records': 'hall_records', 'Grand Library': 'hall_library', 'Cathedral of the Ember': 'hall_cathedral', 'Guild Hall': 'hall_guild'}[p['name']] if k == 'hall' else 'awning_' + p['c'] if k == 'awning' else f"tree_{p['v']}" if k == 'tree' else k)
    if os.path.exists(f'{SRC}/{n}.png'): items.append((p['y'] + p['h'], spr(n), (p['x'] + p['w'] / 2) * T, (p['y'] + p['h']) * T))
co = Image.open(SRC + '/colosseum.png').convert('RGBA'); co = co.resize((co.width * 2, co.height * 2), Image.NEAREST); full.alpha_composite(co, (int(ARN['x'] * T - 281 * 2), int(ARN['y'] * T - 217 * 2)))
for _, s, cx, by in sorted(items, key=lambda t: t[0]):
    x, y = int(cx - s.width / 2), int(by - s.height); bx = (max(0, -x), max(0, -y), min(s.width, W - x), min(s.height, H - y))
    if bx[2] > bx[0] and bx[3] > bx[1]: full.alpha_composite(s.crop(bx), (max(0, x), max(0, y)))
full.convert('RGB').resize((MW * 4, MH * 4), Image.LANCZOS).save(OUT + '/mini.webp', quality=85, method=6)
print(len(sizes), 'sprites,', len(glob.glob(OUT + '/g_*.webp')), 'ground chunks')
