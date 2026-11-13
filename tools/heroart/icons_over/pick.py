# pick.py <key> <blob id> <index>: cut candidate <index> out of a saved 8x8 preview sheet (flat #1f252c ground, label strip on top)
import sys, os
from PIL import Image
H = os.path.dirname(os.path.abspath(__file__)); B = '/root/.claude/projects/-home-claude/654d5b11-96c9-5be1-9b01-ca0776c2bbeb/tool-results/mcp-remote-devices-blob-'
a = sys.argv[1:]
for i in range(0, len(a), 3):
    key, blob, idx = a[i], a[i + 1], int(a[i + 2]); im = Image.open(B + blob + '.png').convert('RGBA'); im = im.crop((0, im.size[1] - 256, 256, im.size[1])); c = im.crop((idx % 8 * 32, idx // 8 * 32, idx % 8 * 32 + 32, idx // 8 * 32 + 32)); px = c.load()
    for y in range(32):
        for x in range(32):
            if px[x, y][:3] == (31, 37, 44): px[x, y] = (0, 0, 0, 0)
    c.save(f'{H}/{key}.png'); print(key, idx, c.getbbox())
