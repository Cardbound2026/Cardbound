# Builds the dressing sheets that armour sets are painted onto: two bodies per sheet, each seen from the front, the back,
# the side without its arm, and the side with it (256x224), plus the paint mask (everything but the face).
import json, os, numpy as np
from PIL import Image
HERE = os.path.dirname(os.path.abspath(__file__)); S = 128; CW, CH = 64, 112
PAIRS = {'a': ['warrior', 'paladin'], 'b': ['mage', 'female']}; VIEWS = ['s', 'n', 'e', 'e_full']
def origin(body, v):
    im = np.array(Image.open(f'{HERE}/src/{body}/{v}.png').convert('RGBA')); a = im[..., 3] > 0
    ys = np.nonzero(a.any(1))[0]; xs = np.nonzero(a.any(0))[0]; cx = (xs.min() + xs.max() + 1) // 2
    return im, int(cx - CW // 2), int(ys.max() + 1 - (CH - 3))
def dil(m, n):
    for _ in range(n): m = m | np.roll(m, 1, 0) | np.roll(m, -1, 0) | np.roll(m, 1, 1) | np.roll(m, -1, 1)
    return m
if __name__ == '__main__':
    yy, xx = np.mgrid[0:CH, 0:CW]
    for pk, bodies in PAIRS.items():
        sheet = np.zeros((CH * 2, CW * 4, 4), np.uint8); mask = np.zeros((CH * 2, CW * 4), bool)
        for r, b in enumerate(bodies):
            J = json.load(open(f'{HERE}/src/{b}/skel.json'))
            for c, v in enumerate(VIEWS):
                im, x0, y0 = origin(b, v); pad = np.zeros((S + 2 * CH, S + 2 * CW, 4), np.uint8); pad[CH:CH + S, CW:CW + S] = im
                cell = pad[CH + y0:CH + y0 + CH, CW + x0:CW + x0 + CW]; print(b, v, x0, y0, 'lost', int((im[..., 3] > 0).sum() - (cell[..., 3] > 0).sum()))
                j = {k['label']: (k['x'] * S - x0, k['y'] * S - y0) for k in J[v[0]]}; nx, ny = j['NOSE']; ky = j['NECK'][1]; chin = ny + (ky - ny) * .58
                m = dil(cell[..., 3] > 0, 5)
                if v == 's': m &= ~((abs(xx - nx) < 6) & (yy > ny - 5) & (yy < chin + 1))
                elif v != 'n': m &= ~((xx > nx - 8) & (yy > ny - 5) & (yy < chin + 1))
                m[:1] = m[-1:] = False; m[:, :1] = m[:, -1:] = False
                sheet[r * CH:(r + 1) * CH, c * CW:(c + 1) * CW] = cell; mask[r * CH:(r + 1) * CH, c * CW:(c + 1) * CW] = m
        Image.fromarray(sheet).save(f'{HERE}/gear/bodies_{pk}.png'); Image.fromarray((mask * 255).astype(np.uint8)).convert('RGB').save(f'{HERE}/gear/mask_{pk}.png')
