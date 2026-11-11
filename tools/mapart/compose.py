import random
from PIL import Image, ImageFilter, ImageEnhance, ImageDraw
import numpy as np
W, H = 1040, 938
g = Image.open('ground.png').convert('RGB')
t = Image.new('RGB', (512, 512)); t.paste(g, (0, 0)); t.paste(g.transpose(Image.FLIP_LEFT_RIGHT), (256, 0))
t.paste(g.transpose(Image.FLIP_TOP_BOTTOM), (0, 256)); t.paste(g.transpose(Image.ROTATE_180), (256, 256))
t = t.resize((1024, 1024), Image.NEAREST)
bg = Image.new('RGB', (W, H))
for x in range(0, W, 1024):
    for y in range(0, H, 1024): bg.paste(t, (x - 8, y))
bg = ImageEnhance.Brightness(bg).enhance(0.62); bg = ImageEnhance.Color(bg).enhance(0.8)
bg = bg.convert('RGBA')
props = [Image.open(f'p{i:02d}.png').convert('RGBA') for i in range(21)]
def put(im, x, y, flip=False, alpha=1.0):
    if flip: im = im.transpose(Image.FLIP_LEFT_RIGHT)
    a = np.array(im); sh = Image.fromarray(np.dstack([np.zeros(a.shape[:2] + (3,), np.uint8), (a[..., 3] * 0.55).astype(np.uint8)]))
    sh = sh.filter(ImageFilter.GaussianBlur(3)); bg.alpha_composite(sh, (int(x + 4), int(y + 5)))
    if alpha < 1: a = a.copy(); a[..., 3] = (a[..., 3] * alpha).astype(np.uint8); im = Image.fromarray(a)
    bg.alpha_composite(im, (int(x), int(y)))
# castle behind the boss at the top centre
c = Image.open('castle.png').convert('RGBA'); c = c.resize((c.width * 2, c.height * 2), Image.NEAREST)
put(c, W // 2 - c.width // 2, -70)
# props in the side bands (Nov 11 rework): a few natural clusters per side instead of an even scatter. Each cluster is a big prop
# with two or three smaller ones heaped around it (they may overlap a little), plus one or two strays; drawn back to front.
rng = random.Random(11)
area = lambda i: props[i].width * props[i].height
big = sorted(range(21), key=lambda i: -area(i))
heavy, light = big[:9], big[9:]
items = []
for side in (0, 1):
    hv = heavy[:]; lt = light[:]; rng.shuffle(hv); rng.shuffle(lt)
    ys = [rng.randint(150, 260), rng.randint(430, 560), rng.randint(720, 830)]
    if side: ys = [y + rng.randint(-60, 60) for y in ys]
    for ci, cy in enumerate(ys):
        cx = rng.randint(90, 230) if side == 0 else W - rng.randint(90, 230)
        group = [hv.pop()] + [lt.pop() for _ in range(rng.choice((2, 2, 3)))]
        for j, i in enumerate(group):
            w, h = props[i].size
            r = 0 if j == 0 else rng.uniform(40, 78); ang = rng.uniform(0, 6.283)
            x = cx + r * np.cos(ang) * 1.3 - w / 2; y = cy + r * np.sin(ang) * 0.8 - h / 2
            x = max(4, min(W - 4 - w, x)); x = min(x, 330 - w) if side == 0 else max(x, 710)
            items.append((y + h, i, x, y))
    for _ in range(rng.choice((1, 2))):
        i = lt.pop(); w, h = props[i].size
        x = rng.randint(20, 300 - w) if side == 0 else rng.randint(740, W - 20 - w); y = rng.randint(330, 660)
        items.append((y + h, i, x, y))
for _, i, x, y in sorted(items):
    put(props[i], x, y, flip=rng.random() < 0.5)
# vignette: darker to the sides and the bottom, a soft dim band under the node map so the nodes read
v = Image.new('L', (W, H), 0); d = ImageDraw.Draw(v)
for i in range(60):
    d.rectangle((i * 3, i * 2, W - i * 3, H - i * 2), fill=int(150 - i * 2.5))
v = v.filter(ImageFilter.GaussianBlur(30))
dark = Image.new('RGBA', (W, H), (8, 6, 5, 0)); dark.putalpha(v); bg.alpha_composite(dark)
band = Image.new('L', (W, H), 0); ImageDraw.Draw(band).rectangle((330, 0, 710, H), fill=30); band = band.filter(ImageFilter.GaussianBlur(40))
b2 = Image.new('RGBA', (W, H), (10, 8, 6, 0)); b2.putalpha(band); bg.alpha_composite(b2)
bg.convert('RGB').save('physical.png'); bg.convert('RGB').save('physical.webp', quality=88, method=6)
import os; print(os.path.getsize('physical.webp'))
