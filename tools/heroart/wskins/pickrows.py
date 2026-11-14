# pickrows.py <blob> <cell w> <cell h> <columns> key=index key=index ... : one key per row of a joined "rows" preview sheet
import sys, os
from PIL import Image
H = os.path.dirname(os.path.abspath(__file__)); B = '/root/.claude/projects/-home-claude/654d5b11-96c9-5be1-9b01-ca0776c2bbeb/tool-results/mcp-remote-devices-blob-'
blob, cw, ch, cols = sys.argv[1], int(sys.argv[2]), int(sys.argv[3]), int(sys.argv[4]); im = Image.open(B + blob + '.png').convert('RGBA'); im = im.crop((0, 18, im.size[0], im.size[1])); im.save(f'{H}/src/_sheet_{blob}.png')
for r, a in enumerate(sys.argv[5:]):
    key, idx = a.split('='); idx = int(idx); c = im.crop((idx * cw, r * ch, idx * cw + cw, r * ch + ch)); px = c.load()
    for y in range(ch):
        for x in range(cw):
            if px[x, y][:3] == (31, 37, 44): px[x, y] = (0, 0, 0, 0)
    c.save(f'{H}/src/{key}.png')
