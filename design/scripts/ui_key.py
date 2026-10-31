# UI art: key the green, make outside-black transparent, fill the inner window with the panel color -> public/img/ui/*.webp
import numpy as np
from PIL import Image
from scipy import ndimage
FILL = (25, 20, 15)
def frame(name, out):
    a = np.array(Image.open(f'design/ui/{name}.png').convert('RGB')).astype(np.float32); r, g, b = a[..., 0], a[..., 1], a[..., 2]
    H, W = g.shape; green = g - np.maximum(r, b)
    lab, _ = ndimage.label(green > 90); win = ndimage.binary_fill_holes(lab == lab[H // 2, W // 2])
    edge = ndimage.binary_dilation(win, iterations=3) & ~win; t = np.clip((green - 25) / 90, 0, 1)
    for i, c in enumerate(FILL):  # window -> flat panel color; its edge blends from frame to panel color by greenness
        ch = a[..., i]; ch[win] = c; ch[edge] = ch[edge] * (1 - t[edge]) + c * t[edge]
    sp = edge & (a[..., 1] > np.maximum(a[..., 0], a[..., 2])); a[..., 1][sp] = np.maximum(a[..., 0], a[..., 2])[sp]
    dark = a.max(axis=2) < 22; lab2, _ = ndimage.label(dark)
    outside = np.isin(lab2, np.unique(np.concatenate([lab2[0], lab2[-1], lab2[:, 0], lab2[:, -1]]))) & dark
    alpha = np.full((H, W), 255.0); alpha[outside] = 0
    soft = ndimage.binary_dilation(outside, iterations=2) & ~outside; alpha[soft] = np.clip(a.max(axis=2)[soft] / 40 * 255, 0, 255)
    Image.fromarray(np.dstack([a, alpha]).clip(0, 255).astype(np.uint8), 'RGBA').save(out, quality=88, method=6)
def plaque(name, out):
    a = np.array(Image.open(f'design/ui/{name}.png').convert('RGB')).astype(np.float32); r, g, b = a[..., 0], a[..., 1], a[..., 2]
    green = g - np.maximum(r, b); bg = green > 60
    alpha = np.where(bg, 0, 255).astype(np.float32); band = ndimage.binary_dilation(bg, iterations=3) & ~bg
    alpha[band] = 255 * (1 - np.clip((green[band] - 20) / 80, 0, 1)); sp = band & (g > np.maximum(r, b)); a[..., 1][sp] = np.maximum(r, b)[sp]
    ys, xs = np.where(alpha > 20); y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    im = Image.fromarray(np.dstack([a, alpha]).clip(0, 255).astype(np.uint8), 'RGBA').crop((x0, y0, x1, y1)); im.save(out, quality=88, method=6); print(name, 'crop', im.size)
frame('frame_big', 'public/img/ui/frame_big.webp'); frame('frame_thin', 'public/img/ui/frame_thin.webp'); plaque('button', 'public/img/ui/button.webp')
Image.open('design/ui/bg_physical.png').convert('RGB').save('public/img/ui/bg_physical.webp', quality=80, method=6)
