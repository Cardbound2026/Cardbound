# contact.py <out.png> <first line> <count>: rows of the first 12 candidates per key, 3x, numbered
import sys, os
from PIL import Image, ImageDraw
H = os.path.dirname(os.path.abspath(__file__)); B = '/root/.claude/projects/-home-claude/654d5b11-96c9-5be1-9b01-ca0776c2bbeb/tool-results/mcp-remote-devices-blob-'
L = [l.split() for l in open(H + '/blobs.txt') if l.strip()][int(sys.argv[2]):int(sys.argv[2]) + int(sys.argv[3])]
N = 14; out = Image.new('RGBA', (N * 98 + 4, len(L) * 112), (31, 37, 44, 255)); d = ImageDraw.Draw(out)
for r, (key, blob) in enumerate(L):
    im = Image.open(B + blob + '.png').convert('RGBA'); im = im.crop((0, im.size[1] - 256, 256, im.size[1])); d.text((4, r * 112), key, fill=(255, 255, 0))
    for i in range(N): out.paste(im.crop((i % 8 * 32, i // 8 * 32, i % 8 * 32 + 32, i // 8 * 32 + 32)).resize((96, 96), Image.NEAREST), (i * 98 + 2, r * 112 + 14)); d.text((i * 98 + 4, r * 112 + 14), str(i), fill=(255, 255, 255))
out.save(sys.argv[1])
