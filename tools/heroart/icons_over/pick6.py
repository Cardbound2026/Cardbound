# pick6.py <blob id> key=index ... : six 64-candidate jobs joined as one sheet of 32 columns (two rows a job, in the order given);
# cuts candidate <index> (0-63) of each job, in order, into icons_over/<key>.png
import sys, os
from PIL import Image
H = os.path.dirname(os.path.abspath(__file__)); B = '/root/.claude/projects/-home-claude/654d5b11-96c9-5be1-9b01-ca0776c2bbeb/tool-results/mcp-remote-devices-blob-'
im = Image.open(B + sys.argv[1] + '.png').convert('RGBA'); im = im.crop((0, 18, im.size[0], im.size[1]))
for j, a in enumerate(sys.argv[2:]):
    key, idx = a.split('='); idx = int(idx); x, y = idx % 32 * 32, (j * 2 + idx // 32) * 32; c = im.crop((x, y, x + 32, y + 32)); px = c.load()
    for yy in range(32):
        for xx in range(32):
            if px[xx, yy][:3] == (31, 37, 44): px[xx, yy] = (0, 0, 0, 0)
    c.save(f'{H}/{key}.png'); print(key, idx, c.getbbox())
