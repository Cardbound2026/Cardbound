# Things carried on the back (Nov 13, Skull Shop "Back cosmetics"): 64 px PixelLab pictures -> public/img/hero/backs.webp (one row), and the circling skull aura's skull
import os
from PIL import Image
H = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(os.path.dirname(H))); B = '/root/.claude/projects/-home-claude/654d5b11-96c9-5be1-9b01-ca0776c2bbeb/tool-results/mcp-remote-devices-blob-'
P = [('grave', '1794614641757-3yl7x7', 0), ('vial', '1794614643592-08802o', 0), ('swords', '1794614644511-faj7lj', 0), ('coffin', '1794614850751-8dketl', 0), ('banner', '1794614646269-4vhmum', 0), ('sack', '1794614852400-2low6t', 0), ('anchor', '1794614853556-mvves7', 1), ('keg', '1794614854576-uvaxo6', 0)]
def cut(blob, c, cols, i):
    im = Image.open(B + blob + '.png').convert('RGBA'); im = im.crop((0, 18, im.size[0], im.size[1])); t = im.crop((i % cols * c, i // cols * c, i % cols * c + c, i // cols * c + c)); px = t.load()
    for y in range(c):
        for x in range(c):
            if px[x, y][:3] == (31, 37, 44): px[x, y] = (0, 0, 0, 0)
    return t
out = Image.new('RGBA', (64 * len(P), 64))
for n, (k, blob, i) in enumerate(P):
    f = f'{H}/{k}.png'
    if not os.path.exists(f): cut(blob, 64, 8, i).save(f)
    t = Image.open(f); bb = t.getbbox(); c = t.crop(bb); out.paste(c, (n * 64 + (64 - c.width) // 2, (64 - c.height) // 2))
out.save(ROOT + '/public/img/hero/backs.webp', lossless=True)
f = H + '/auraskull.png'
if not os.path.exists(f): cut('1794614855821-g12iqk', 32, 8, 2).save(f)
s = Image.open(f); s = s.crop(s.getbbox()); o = Image.new('RGBA', (26, 26)); o.paste(s, ((26 - s.width) // 2, (26 - s.height) // 2)); o.save(ROOT + '/public/img/hero/auraskull.png')
out.resize((out.width * 2, 128), Image.NEAREST).save(H + '/preview.png')
