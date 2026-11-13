# Nov 13: cuts the repainted armless side torsos out of the joined result sheets (4 columns of 256x256 under an 18px title bar,
# on a flat backdrop) into gear/side/<set>_<body>.png, the size of that body's torso box in gear/side_boxes.json.
import sys, json, os, numpy as np
from PIL import Image
HERE = os.path.dirname(os.path.abspath(__file__)); BOX = json.load(open(f'{HERE}/gear/side_boxes.json')); BACK = (31, 37, 44)
def extract(sheet, names, cols=4):
    im = np.array(Image.open(sheet).convert('RGBA'))[18:]
    for i, (name, body) in enumerate(names):
        r, c = divmod(i, cols); t = im[r * 256:(r + 1) * 256, c * 256:(c + 1) * 256]; b = BOX[body]
        cut = t[b['y']:b['y'] + b['h'], b['x']:b['x'] + b['w']].copy(); back = (cut[..., :3] == BACK).all(-1); cut[back] = 0
        Image.fromarray(cut).save(f"{HERE}/gear/side/{name[:-2]}_{body}.png"); print(name, body, int((~back).sum()))
if __name__ == '__main__':
    names = [l.split()[:2] for l in open(sys.argv[2]) if l.strip()]; extract(sys.argv[1], names)
