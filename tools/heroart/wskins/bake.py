# Weapon looks for the Skull Shop (Nov 13). list.txt: key|type|name|price|job id|candidate picked. src/<key>.png is the picked
# candidate (cut from a saved preview sheet by pick.py). Each is trimmed, scaled to the height the type's own weapons have, and
# packed into public/img/hero/wskins.webp (10 across, 48x112 cells, grip measured like bake_weapons.py) -> src/wskins_data.js.
import os, json, numpy as np
from PIL import Image
H = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(os.path.dirname(H))); CW, CH, COLS = 48, 112, 10
GRIP = {'sword1h': .88, 'axe1h': .86, 'mace1h': .86, 'dagger': .84, 'wand': .85, 'sword2h': .86, 'axe2h': .62, 'maul': .64, 'hammer': .64, 'scythe': .56, 'staff': .52, 'kite': .5, 'tower': .5, 'focus': .6}
TALL = {'sword1h': 58, 'axe1h': 58, 'mace1h': 55, 'dagger': 43, 'wand': 45, 'sword2h': 90, 'axe2h': 85, 'maul': 90, 'hammer': 79, 'scythe': 99, 'staff': 91, 'kite': 54, 'tower': 62, 'focus': 33}
L = [l.rstrip('\n').split('|') for l in open(H + '/list.txt') if l.strip() and not l.startswith('#')]; L = [x for x in L if os.path.exists(f'{H}/src/{x[0]}.png')]
atlas = np.zeros((CH * ((len(L) + COLS - 1) // COLS or 1), CW * COLS, 4), np.uint8); out = {'cols': COLS, 'cw': CW, 'ch': CH, 'list': []}
for i, (key, t, name, price, *_ ) in enumerate(L):
    im = Image.open(f'{H}/src/{key}.png').convert('RGBA'); im = im.crop(im.getbbox()); w, h = im.size
    if h > TALL[t] + 3 or h < TALL[t] - 8 or w > CW: k = min(TALL[t] / h, CW / w); im = im.resize((max(1, round(w * k)), max(1, round(h * k))), Image.NEAREST); w, h = im.size
    sp = np.array(im); sp[sp[..., 3] <= 40] = 0; gy = int(h * GRIP[t]); row = np.nonzero(sp[min(h - 1, gy), :, 3] > 40)[0]; gx = float(row.mean()) if len(row) and t not in ('kite', 'tower', 'focus') else w / 2
    x0 = (CW - w) // 2; y0 = CH - h; r, c = divmod(i, COLS); atlas[r * CH + y0:r * CH + y0 + h, c * CW + x0:c * CW + x0 + w] = sp
    out['list'].append({'k': key, 't': t, 'n': name, 'p': int(price), 'g': [round(x0 + gx, 1), y0 + gy]})
Image.fromarray(atlas).save(ROOT + '/public/img/hero/wskins.webp', lossless=True, method=6)
open(ROOT + '/src/wskins_data.js', 'w').write('// made by tools/heroart/wskins/bake.py: weapon looks sold in the Skull Shop (k key, t weapon type, n name, p price, g grip in its 48x112 cell)\nwindow.CB_WSKINS = ' + json.dumps(out) + ';\n')
Image.fromarray(atlas).resize((atlas.shape[1] * 2, atlas.shape[0] * 2), Image.NEAREST).save(H + '/preview.png'); print(len(L), 'weapon looks')
