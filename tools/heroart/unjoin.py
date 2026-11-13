# Splits a sheet fetched with the workbench's "join" (18px title bar, dark backdrop) back into its pictures, with the backdrop made clear.
#   python3 unjoin.py <joined.png> <cell w> <cell h> <columns> <out dir> name1 name2 ...
import sys, numpy as np
from PIL import Image
f, w, h, cols, out = sys.argv[1], int(sys.argv[2]), int(sys.argv[3]), int(sys.argv[4]), sys.argv[5]; names = sys.argv[6:]
a = np.array(Image.open(f).convert('RGBA')); a = a[a.shape[0] % h:]; bg = a[0, 0, :3].copy()
for i, n in enumerate(names):
    c = a[(i // cols) * h:(i // cols + 1) * h, (i % cols) * w:(i % cols + 1) * w].copy(); c[(c[..., :3] == bg).all(-1)] = 0
    if n != '-': Image.fromarray(c).save(f'{out}/{n}.png')
print('bg', bg, len(names))
