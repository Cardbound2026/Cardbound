# Compose a top-down run-map background for any map, the same way physical.png was made (compose.py):
# a tiled ground texture, the map's landmark behind the boss at the top centre, and clusters of props in the two side bands.
# usage: python3 compose_map.py <mapkey>     reads tools/mapart/<mapkey>/{ground.png, landmark.png, p*.png}
#                                            writes tools/mapart/<mapkey>.png and public/img/map/<mapkey>.webp
import random, sys, os, glob
from PIL import Image, ImageFilter, ImageEnhance, ImageDraw
import numpy as np
key = sys.argv[1]; here = os.path.dirname(os.path.abspath(__file__)); src = os.path.join(here, key)
W, H = 1040, 938
g = Image.open(os.path.join(src, 'ground.png')).convert('RGB').resize((256, 256), Image.NEAREST)
t = Image.new('RGB', (512, 512))
if os.environ.get('MIRROR', '0') == '1': t.paste(g, (0, 0)); t.paste(g.transpose(Image.FLIP_LEFT_RIGHT), (256, 0)); t.paste(g.transpose(Image.FLIP_TOP_BOTTOM), (0, 256)); t.paste(g.transpose(Image.ROTATE_180), (256, 256))
else: [t.paste(g, (x, y)) for x in (0, 256) for y in (0, 256)]  # PixelLab's ground tiles are seamless: plain repeats, no kaleidoscope
GS = int(os.environ.get('GS', '1')); t = t.resize((512 * GS, 512 * GS), Image.NEAREST)  # GS 2 doubles the ground pixels (physical); 1 keeps the tile's own scale
bg = Image.new('RGB', (W, H))
for x in range(0, W + 8, t.width):
    for y in range(0, H, t.height): bg.paste(t, (x - 8, y))
bg = ImageEnhance.Brightness(bg).enhance(float(os.environ.get('GB', '0.62'))); bg = ImageEnhance.Color(bg).enhance(float(os.environ.get('GC', '0.8')))
if os.path.exists(os.path.join(src, 'ground_full.png')): bg = Image.open(os.path.join(src, 'ground_full.png')).convert('RGB')   # Nov 13: a map may bring its whole ground, painted plain (fire: ash with a few burning patches)
bg = bg.convert('RGBA')
props = [Image.open(f).convert('RGBA') for f in sorted(glob.glob(os.path.join(src, 'p*.png')))]
PS = int(os.environ.get('PS', '2')); props = [p.crop(p.getbbox()) for p in props if p.getbbox()]; props = [p.resize((p.width * PS, p.height * PS), Image.NEAREST) for p in props]
def put(im, x, y, flip=False):
    if flip: im = im.transpose(Image.FLIP_LEFT_RIGHT)
    a = np.array(im); sh = Image.fromarray(np.dstack([np.zeros(a.shape[:2] + (3,), np.uint8), (a[..., 3] * 0.55).astype(np.uint8)]))
    sh = sh.filter(ImageFilter.GaussianBlur(3)); bg.alpha_composite(sh, (int(x + 4), int(y + 5)))
    bg.alpha_composite(im, (int(x), int(y)))
# the landmark behind the boss, top centre (its foot ends around y 150-170, where the boss node stands)
c = Image.open(os.path.join(src, 'landmark.png')).convert('RGBA'); c = c.crop(c.getbbox()); LS = float(os.environ.get('LS', '2')); c = c.resize((int(c.width * LS), int(c.height * LS)), Image.NEAREST)
put(c, W // 2 - c.width // 2, max(-80, 175 - c.height))
rng = random.Random(11)
order = sorted(range(len(props)), key=lambda i: -props[i].width * props[i].height)
nh = max(2, len(order) // 3); heavy, light = order[:nh], order[nh:]
def draw(pool, cache):
    if not cache: cache.extend(pool); rng.shuffle(cache)
    return cache.pop()
items = []
for side in (0, 1):
    hc, lc = [], []
    ys = [rng.randint(170, 270), rng.randint(430, 560), rng.randint(720, 830)]
    if side: ys = [y + rng.randint(-60, 60) for y in ys]
    for cy in ys:
        cx = rng.randint(90, 230) if side == 0 else W - rng.randint(90, 230)
        group = [draw(heavy, hc)] + [draw(light, lc) for _ in range(rng.choice((2, 2, 3)))]
        for j, i in enumerate(group):
            w, h = props[i].size
            r = 0 if j == 0 else rng.uniform(40, 78); ang = rng.uniform(0, 6.283)
            x = cx + r * np.cos(ang) * 1.3 - w / 2; y = cy + r * np.sin(ang) * 0.8 - h / 2
            x = max(4, min(W - 4 - w, x)); x = min(x, 330 - w) if side == 0 else max(x, 710)
            items.append((y + h, i, x, y))
    for _ in range(rng.choice((1, 2))):
        i = draw(light, lc); w, h = props[i].size
        x = rng.randint(20, max(21, 300 - w)) if side == 0 else rng.randint(740, W - 20 - w); y = rng.randint(330, 660)
        items.append((y + h, i, x, y))
for _, i, x, y in sorted(items):
    put(props[i], x, y, flip=rng.random() < 0.5)
v = Image.new('L', (W, H), 0); d = ImageDraw.Draw(v)
for i in range(60):
    d.rectangle((i * 3, i * 2, W - i * 3, H - i * 2), fill=int(150 - i * 2.5))
v = v.filter(ImageFilter.GaussianBlur(30))
dark = Image.new('RGBA', (W, H), (8, 6, 5, 0)); dark.putalpha(v); bg.alpha_composite(dark)
band = Image.new('L', (W, H), 0); ImageDraw.Draw(band).rectangle((330, 0, 710, H), fill=30); band = band.filter(ImageFilter.GaussianBlur(40))
b2 = Image.new('RGBA', (W, H), (10, 8, 6, 0)); b2.putalpha(band); bg.alpha_composite(b2)
bg.convert('RGB').save(os.path.join(here, key + '.png'))
out = os.path.join(here, '..', '..', 'public', 'img', 'map', key + '.webp'); bg.convert('RGB').save(out, quality=88, method=6)
print(key, len(props), 'props', os.path.getsize(out))
