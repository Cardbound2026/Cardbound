# key out the green art window of an enemy card frame -> 600x900 webp with alpha; print the art box
import sys, json, numpy as np
from PIL import Image
from scipy import ndimage
out = {}
for name in sys.argv[1:]:
    src = f'/home/claude/cardbound/design/card-frames/enemy/{name}.png'
    im = Image.open(src).convert('RGB'); a = np.array(im).astype(np.float32)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    green = (g - np.maximum(r, b))                     # screen green ~150+
    core = (green > 90) & (r < 110) & (b < 110)
    lab, n = ndimage.label(core)
    H, W = core.shape; c = lab[int(H * 0.25), W // 2]
    win = lab == c                                     # only the window connected to the art center (keeps slime drips etc.)
    win = ndimage.binary_fill_holes(win)
    # soft edge: alpha from greenness in a 3px band around the window
    wide = name in ('shadow',)  # wispy smoke over the green: key a wider band, mixing by how green each pixel is
    band = ndimage.binary_dilation(win, iterations=40 if wide else 4) & ~win
    if wide: band &= (r < 150) & (b < 150)
    alpha = np.full((H, W), 255.0)
    alpha[win] = 0
    t = np.clip((green - 12) / 110, 0, 1) if wide else np.clip((green - 25) / 90, 0, 1)
    alpha[band] = 255 * (1 - t[band])
    # despill the band
    sp = band & (g > np.maximum(r, b))
    a[..., 1][sp] = np.maximum(r, b)[sp]
    rgba = np.dstack([a, alpha]).clip(0, 255).astype(np.uint8)
    ys, xs = np.where(win)
    box = [round(xs.min() / W, 4), round(ys.min() / H, 4), round((xs.max() - xs.min()) / W, 4), round((ys.max() - ys.min()) / H, 4)]
    Image.fromarray(rgba, 'RGBA').resize((600, 900), Image.LANCZOS).save(f'/home/claude/cardbound/public/img/eframes/{name}.webp', quality=86, method=6)
    out['E:' + name] = {'art': box, 'panel': [0.135, 0.565, 0.73, 0.3], 'gem': [0.125, 0.0835, 0.066], 'dark': True, 'src': f'img/eframes/{name}.webp'}
print(json.dumps(out))
