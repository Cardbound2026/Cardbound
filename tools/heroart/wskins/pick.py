# pick.py <key> <blob id> <cell w> <cell h> <columns> <index>: cut one candidate out of a saved preview sheet
import sys, os
from PIL import Image
H = os.path.dirname(os.path.abspath(__file__)); B = '/root/.claude/projects/-home-claude/654d5b11-96c9-5be1-9b01-ca0776c2bbeb/tool-results/mcp-remote-devices-blob-'
key, blob, cw, ch, cols, idx = sys.argv[1], sys.argv[2], int(sys.argv[3]), int(sys.argv[4]), int(sys.argv[5]), int(sys.argv[6])
im = Image.open(B + blob + '.png').convert('RGBA'); im = im.crop((0, 18, im.size[0], im.size[1])); c = im.crop((idx % cols * cw, idx // cols * ch, idx % cols * cw + cw, idx // cols * ch + ch)); px = c.load()
for y in range(ch):
    for x in range(cw):
        if px[x, y][:3] == (31, 37, 44): px[x, y] = (0, 0, 0, 0)
c.save(f'{H}/src/{key}.png'); print(key, c.getbbox())
