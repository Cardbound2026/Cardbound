# The arena floor (Nov 13): build.py -> public/img/town/g_<3..8>_<10..13>.webp, tools/arenafloor/floor.png
# A 72 x 48 tile field (2304 x 1536 art px, 32 px a tile) put together from three PixelLab paintings in this folder:
#   wall_top.png    688x256  the far wall: stands, arches, banners, braziers (repeated, every other copy mirrored)
#   wall_bottom.png 688x128  the near wall seen from above: its stone cap, then its dark outer face
#   sand.png        512x464  plain arena sand (repeated, mirrored both ways so the joins do not show)
# plus chalk duelling rings drawn here. The grid position (chunks 3..8, 10..13) matches AFL in src/city.js.
import os, random
from PIL import Image, ImageDraw
H = os.path.dirname(os.path.abspath(__file__)); R = os.path.dirname(os.path.dirname(H)); W, HT, T = 2304, 1536, 32
top = Image.open(H + '/wall_top.png').convert('RGB'); bot = Image.open(H + '/wall_bottom.png').convert('RGB'); sand = Image.open(H + '/sand.png').convert('RGB')
im = Image.new('RGB', (W, HT), (8, 5, 14))
def tile(src, x0, y0, x1, y1, flipy=False):
    for j, y in enumerate(range(y0, y1, src.height)):
        for i, x in enumerate(range(x0, x1, src.width)):
            s = src
            if i % 2: s = s.transpose(Image.FLIP_LEFT_RIGHT)
            if flipy and j % 2: s = s.transpose(Image.FLIP_TOP_BOTTOM)
            s = s.crop((0, 0, min(s.width, x1 - x), min(s.height, y1 - y))); im.paste(s, (x, y))
SIDE = 64; FLOOR_T, FLOOR_B = 244, HT - 128
# the sand: no straight repeats (they read as a pattern). The blood stains are lifted off the painting, then soft-edged pieces of the clean
# sand are scattered at random over a flat sand colour, turned and flipped, so they overlap and blend; six stains go back on at random spots.
import numpy as np
from PIL import ImageFilter
rnd = random.Random(5); a = np.asarray(sand).astype(int); red = (a[..., 0] - a[..., 1] > 34) & (a[..., 0] < 190)
mask = Image.fromarray((red * 255).astype('uint8')).filter(ImageFilter.MaxFilter(15)); m = np.asarray(mask) > 0
clean = a.copy(); sh = np.roll(a, 150, axis=1); clean[m] = sh[m]; clean_im = Image.fromarray(clean.astype('uint8'))
base = tuple(int(v) for v in np.median(clean.reshape(-1, 3), axis=0)); im.paste(base, (SIDE, FLOOR_T, W - SIDE, FLOOR_B + 8))
fe = Image.new('L', (512, 464), 0); ImageDraw.Draw(fe).ellipse((40, 36, 472, 428), fill=255); fe = fe.filter(ImageFilter.GaussianBlur(34))
for i in range(90):
    t = clean_im; f = fe
    if rnd.random() < .5: t = t.transpose(Image.FLIP_LEFT_RIGHT)
    if rnd.random() < .5: t = t.transpose(Image.FLIP_TOP_BOTTOM)
    x = rnd.randint(SIDE - 200, W - SIDE - 312); y = rnd.randint(FLOOR_T - 180, FLOOR_B - 280); im.paste(t, (x, y), f)
ys, xs = np.nonzero(m); st_box = (max(0, xs[xs > 256].min() - 4), max(0, ys[ys < 232].min() - 4), min(512, xs.max() + 4), min(464, ys[ys < 232].max() + 4)) if len(xs) else None
if st_box:
    st = sand.crop(st_box); sm = mask.crop(st_box).filter(ImageFilter.GaussianBlur(3))
    for i in range(6):
        t, f = st, sm
        if rnd.random() < .5: t, f = t.transpose(Image.FLIP_LEFT_RIGHT), f.transpose(Image.FLIP_LEFT_RIGHT)
        im.paste(t, (rnd.randint(SIDE + 80, W - SIDE - 200), rnd.randint(FLOOR_T + 80, FLOOR_B - 200)), f)
im.paste((8, 5, 14), (0, 0, SIDE, HT)); im.paste((8, 5, 14), (W - SIDE, 0, W, HT)); im.paste((8, 5, 14), (0, 0, W, FLOOR_T))
# chalk duelling rings: 7 x 4, a little out of line, with gaps like worn chalk
rnd = random.Random(11); d = ImageDraw.Draw(im); px = im.load()
import math
for r in range(4):
    for c in range(7):
        cx = SIDE + 190 + c * 300 + rnd.randint(-22, 22); cy = FLOOR_T + 190 + r * 262 + rnd.randint(-16, 16); rx, ry = 92, 50
        if r == 3 and c == 3: continue   # keep the lane to the near gate clear
        for a in range(0, 3600):
            th = a / 3600 * 2 * math.pi
            if math.sin(th * 9 + c * 2 + r) > 0.86 or rnd.random() < 0.12: continue
            for k in (0, 1):
                x = int(cx + (rx - k) * math.cos(th)); y = int(cy + (ry - k) * math.sin(th)); p = px[x, y]; px[x, y] = tuple(min(255, int(v * 0.35 + w * 0.65)) for v, w in zip(p, (244, 238, 224)))
# side walls: the near wall's stone cap turned on its side
cap = bot.crop((0, 0, 688, 66)).rotate(90, expand=True)   # 66 wide, 688 tall
for x, s in ((0, cap), (W - 66, cap.transpose(Image.FLIP_LEFT_RIGHT))):
    for j, y in enumerate(range(200, FLOOR_B + 20, 688)): t = s.transpose(Image.FLIP_TOP_BOTTOM) if j % 2 else s; im.paste(t.crop((0, 0, 66, min(688, FLOOR_B + 20 - y))), (x, y))
# soft shade on the sand beside the walls
ov = Image.new('RGBA', (W, HT), (0, 0, 0, 0)); od = ImageDraw.Draw(ov)
for k in range(14): od.rectangle((66 + k, 250, 66 + k, FLOOR_B), fill=(20, 10, 16, 90 - k * 6)); od.rectangle((W - 67 - k, 250, W - 67 - k, FLOOR_B), fill=(20, 10, 16, 60 - k * 4))
for k in range(10): od.rectangle((66, FLOOR_B - 1 - k, W - 66, FLOOR_B - 1 - k), fill=(20, 10, 16, 50 - k * 5))
im = Image.alpha_composite(im.convert('RGBA'), ov).convert('RGB')
tile(top, 0, 0, W, 256); tile(bot, 0, FLOOR_B, W, HT)
# the near gate: a sand lane through the near wall, between two stone posts
gx = (72 - 36) * T + T // 2; lane = 44
im.paste(sand.crop((100, 100, 100 + lane * 2, 228)), (gx - lane, FLOOR_B)); d = ImageDraw.Draw(im, 'RGBA')
for k in range(128): d.line((gx - lane, FLOOR_B + k, gx + lane - 1, FLOOR_B + k), fill=(8, 5, 14, int(k * 1.7)))
post = bot.crop((40, 0, 62, 66))
for x in (gx - lane - 22, gx + lane): im.paste(post, (x, FLOOR_B - 6)); d.rectangle((x - 1, FLOOR_B - 7, x + 22, FLOOR_B + 60), outline=(18, 14, 20, 255))
im.save(H + '/floor.png')
for j in range(4):
    for i in range(6): im.crop((i * 384, j * 384, i * 384 + 384, j * 384 + 384)).save(f'{R}/public/img/town/g_{3 + i}_{10 + j}.webp', quality=90, method=6)
print('ok', im.size)
