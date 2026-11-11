# pack_fx.py <fx.txt> -> src/pixfx.js : one lossless webp atlas (a row of frames per effect) + manifest, inlined
import sys, json, base64, io
from PIL import Image
rows = []
for l in open(sys.argv[1]):
    p = l.split()
    if not p: continue
    k, f, fw, fh, n, fps = p[0], p[1], *map(int, p[2:6])
    ax, ay = (int(p[6]), int(p[7])) if len(p) > 7 else (fw // 2, fh // 2)
    im = Image.open(f).convert('RGBA'); cols = im.width // fw
    fr = [im.crop(((i % cols) * fw, (i // cols) * fh, (i % cols) * fw + fw, (i // cols) * fh + fh)) for i in range(n)]
    rows.append((k, fw, fh, n, fps, ax, ay, fr))
W = max(r[1] * r[3] for r in rows); H = sum(r[2] for r in rows)
at = Image.new('RGBA', (W, H), (0, 0, 0, 0)); man = {}; y = 0
for k, fw, fh, n, fps, ax, ay, fr in rows:
    for i, im in enumerate(fr): at.paste(im, (i * fw, y))
    man[k] = [y, fw, fh, n, fps, ax, ay]; y += fh
b = io.BytesIO(); at.save(b, 'WEBP', lossless=True, quality=100, method=6)
uri = 'data:image/webp;base64,' + base64.b64encode(b.getvalue()).decode()
at.save('/tmp/claude-0/-home-claude/654d5b11-96c9-5be1-9b01-ca0776c2bbeb/scratchpad/fx/atlas.png')
js = open(sys.argv[2]).read().replace('/*PIXFX-MAN*/{}', json.dumps(man, separators=(',', ':'))).replace("'/*PIXFX-IMG*/'", json.dumps(uri))
open(sys.argv[3], 'w').write(js)
print(W, H, len(b.getvalue()), 'bytes', len(man), 'effects')
