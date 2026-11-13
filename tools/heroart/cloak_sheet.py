# Paint masks for cloaks on the dressing sheets: the back view is covered from the shoulders to the calves; from the front only a
# collar and the cloth showing past the body's edge; from the side the cloth hanging behind the back.
import json, numpy as np
from PIL import Image
import gear_sheet as GS
HERE = GS.HERE; S = 128
yy, xx = np.mgrid[0:GS.CH, 0:GS.CW]
for pk, bodies in GS.PAIRS.items():
    mask = np.zeros((GS.CH * 2, GS.CW * 4), bool)
    for r, b in enumerate(bodies):
        J = json.load(open(f'{HERE}/src/{b}/skel.json'))
        for c, v in enumerate(['s', 'n', 'e']):
            im, x0, y0 = GS.origin(b, v); pad = np.zeros((S + 2 * GS.CH, S + 2 * GS.CW, 4), np.uint8); pad[GS.CH:GS.CH + S, GS.CW:GS.CW + S] = im
            cell = pad[GS.CH + y0:GS.CH + y0 + GS.CH, GS.CW + x0:GS.CW + x0 + GS.CW]; body = cell[..., 3] > 0
            j = {k['label']: (k['x'] * S - x0, k['y'] * S - y0) for k in J[v]}; ny = j['NOSE'][1]; kx, ky = j['NECK']; chin = ny + (ky - ny) * .58
            knee = (j['LEFT KNEE'][1] + j['RIGHT KNEE'][1]) / 2; ank = (j['LEFT LEG'][1] + j['RIGHT LEG'][1]) / 2; low = knee + (ank - knee) * .55
            sw = abs(j['LEFT SHOULDER'][0] - j['RIGHT SHOULDER'][0]); band = (yy > chin + 1) & (yy < low)
            if v == 's': m = (GS.dil(body, 6) & ~body & band & (yy > ky - 1)) | (body & (yy > chin + 1) & (yy < ky + 3) & (abs(xx - kx) < sw * .5) & (abs(xx - kx) > 4))
            elif v == 'n': m = GS.dil(body, 4) & band & (abs(xx - kx) < sw * .5 + 9)
            else: hx = (j['LEFT HIP'][0] + j['RIGHT HIP'][0]) / 2; m = GS.dil(body, 7) & band & (xx < hx + 1) & ((xx < kx + 2) | (yy < ky + 6))
            m[:1] = m[-1:] = False; m[:, :1] = m[:, -1:] = False
            mask[r * GS.CH:(r + 1) * GS.CH, c * GS.CW:(c + 1) * GS.CW] = m
    Image.fromarray((mask * 255).astype(np.uint8)).convert('RGB').save(f'{HERE}/gear/mask_cloak_{pk}.png')
    a = Image.open(f'{HERE}/gear/bodies_{pk}.png'); t = Image.new('RGB', a.size, (50, 60, 90)); t.paste(a, (0, 0), a)
    t = Image.composite(Image.blend(t, Image.new('RGB', a.size, (255, 0, 255)), .45), t, Image.fromarray((mask * 255).astype(np.uint8))); t.save(f'/tmp/cm_{pk}.png')
