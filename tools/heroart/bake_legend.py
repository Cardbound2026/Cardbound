# The Skull Shop's legendary weapon looks (Nov 13): weapons/raw/legend.png (six upright weapons in a row) is appended to
# public/img/hero/weapons.webp as the row "legend", and its grips are written to weapons/data.json and src/puppet_data.js.
# Run after bake_weapons.py (which rebuilds the atlas without this row).
import numpy as np, json, os
from PIL import Image
from scipy import ndimage
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE)); CW, CH = 48, 112; GR = [.88, .88, .58, .66, .64, .55]
a = np.array(Image.open(HERE + '/weapons/raw/legend.png').convert('RGBA')); al = a[..., 3] > 40; cols = al.any(0)
lab, n = ndimage.label(ndimage.binary_closing(cols, np.ones(3)) | cols); runs = [np.nonzero(lab == i)[0] for i in range(1, n + 1)]; runs = [r for r in runs if al[:, r].sum() > 25]
if len(runs) != 6: w = a.shape[1] / 6; runs = [np.arange(int(i * w), int((i + 1) * w)) for i in range(6)]
row = np.zeros((CH, CW * 6, 4), np.uint8); grips = []
for i, r in enumerate(runs):
    sp = a[:, r.min():r.max() + 1]; ys = np.nonzero((sp[..., 3] > 40).any(1))[0]; xs = np.nonzero((sp[..., 3] > 40).any(0))[0]; sp = sp[ys.min():ys.max() + 1, xs.min():xs.max() + 1].copy(); sp[sp[..., 3] <= 40] = 0
    h, w = sp.shape[:2]
    if w > CW or h > CH: sp = sp[max(0, h - CH):, (w - min(w, CW)) // 2:(w - min(w, CW)) // 2 + min(w, CW)]; h, w = sp.shape[:2]
    gy = int(h * GR[i]); rr = np.nonzero(sp[min(h - 1, gy), :, 3] > 40)[0]; gx = float(rr.mean()) if len(rr) else w / 2
    x0 = (CW - w) // 2; y0 = CH - h; row[y0:y0 + h, i * CW + x0:i * CW + x0 + w] = sp; grips.append([round(x0 + gx, 1), y0 + gy])
d = json.load(open(HERE + '/weapons/data.json')); W = d['weapons']; at = np.array(Image.open(ROOT + '/public/img/hero/weapons.webp').convert('RGBA'))
if 'legend' in W['types']: at = at[:CH * W['types'].index('legend')]; W['types'].remove('legend')
at = np.concatenate([at, row], 0); W['types'].append('legend'); W['grip']['legend'] = grips
Image.fromarray(at).save(ROOT + '/public/img/hero/weapons.webp', lossless=True, method=6); json.dump(d, open(HERE + '/weapons/data.json', 'w'))
s = open(ROOT + '/src/puppet_data.js').read(); pre, js = s.split('window.CB_PUPPET_DATA = ', 1); p = json.loads(js.rstrip().rstrip(';')); p['weapons'] = W
open(ROOT + '/src/puppet_data.js', 'w').write(pre + 'window.CB_PUPPET_DATA = ' + json.dumps(p) + ';\n'); print('legend row added', grips)
