# Builds the sheet of bald heads (4 bodies x 3 views) that hair and beards are painted onto, plus the paint masks.
import json, os, numpy as np
from PIL import Image
HERE = os.path.dirname(os.path.abspath(__file__)); S = 128; CW, CH = 48, 56
BODIES = ['warrior', 'paladin', 'mage', 'female']; VIEWS = ['s', 'e', 'n']
def cells():
    out = {}
    for c, b in enumerate(BODIES):
        J = json.load(open(f'{HERE}/src/{b}/skel.json'))
        for r, v in enumerate(VIEWS):
            j = {k['label']: (k['x'] * S, k['y'] * S) for k in J[v]}; im = np.array(Image.open(f'{HERE}/src/{b}/{"e_full" if v == "e" else v}.png').convert('RGBA'))
            top = int(np.nonzero(im[..., 3].any(1))[0].min()); nose, neck = j['NOSE'], j['NECK']
            hx = neck[0] + (3 if v == 'e' else 0); x0 = int(round(hx - CW / 2)); y0 = top - 9
            out[(b, v)] = dict(x0=x0, y0=y0, c=c, r=r, nose=(nose[0] - x0, nose[1] - y0), neck=(neck[0] - x0, neck[1] - y0), top=9, im=im)
    return out
if __name__ == '__main__':
    C = cells(); sheet = np.zeros((CH * 3, CW * 4, 4), np.uint8); hair = np.zeros((CH * 3, CW * 4), np.uint8); beard = hair.copy()
    yy, xx = np.mgrid[0:CH, 0:CW]
    for (b, v), k in C.items():
        cell = np.zeros((CH, CW, 4), np.uint8); y0, x0 = k['y0'], k['x0']
        sy0, sx0 = max(0, y0), max(0, x0); cell[sy0 - y0:, sx0 - x0:] = k['im'][sy0:y0 + CH, sx0:x0 + CW][:CH - (sy0 - y0), :CW - (sx0 - x0)]
        sheet[k['r'] * CH:(k['r'] + 1) * CH, k['c'] * CW:(k['c'] + 1) * CW] = cell
        nx, ny = k['nose']; kx, ky = k['neck']; chin = ny + (ky - ny) * .58
        m = np.ones((CH, CW), bool); m[:, :2] = m[:, -2:] = False; m[:2] = False
        if v == 's': m &= ~((abs(xx - nx) < 6) & (yy > ny - 5) & (yy < chin + 1)); m &= ~((yy >= chin + 1) & (abs(xx - kx) < 7)); m &= yy < ky + 12
        elif v == 'e': m &= ~((xx > nx - 9) & (yy > ny - 5) & (yy < chin + 2)); m &= ~((yy >= chin) & (xx > kx - 3)); m &= yy < ky + 12
        else: m &= yy < ky + 16
        hair[k['r'] * CH:(k['r'] + 1) * CH, k['c'] * CW:(k['c'] + 1) * CW] = m * 255
        if b != 'female' and v != 'n':
            bm = (yy > ny - 1) & (yy < ky + 9) & ((abs(xx - nx) < 10) if v == 's' else ((xx > nx - 13) & (xx < nx + 5)))
            beard[k['r'] * CH:(k['r'] + 1) * CH, k['c'] * CW:(k['c'] + 1) * CW] = bm * 255
    Image.fromarray(sheet).save(f'{HERE}/hair/heads.png'); Image.fromarray(hair).convert('RGB').save(f'{HERE}/hair/mask_hair.png'); Image.fromarray(beard).convert('RGB').save(f'{HERE}/hair/mask_beard.png')
