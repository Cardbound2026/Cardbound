# Mouse cursors (Nov 13): 32x32 PixelLab pictures cut from the candidate sheets here, each pointing up and to the left.
# Writes public/img/cur/<key>.png and src/cursors_data.js (window.CB_CURSORS = { key: [hotspot x, hotspot y] }).
import os, json
from PIL import Image
H = os.path.dirname(os.path.abspath(__file__)); OUT = H + '/../../public/img/cur'; os.makedirs(OUT, exist_ok=True)
# key, name, sheet, index, flip ('' | 'h' | 'v'), price (0 = everyone's default)
LIST = [('gauntlet', 'Steel Gauntlet', 'gauntlet', 45, '', 0),
  ('gauntlet_gold', 'Gilded Gauntlet', 'gauntlet', 36, '', 300), ('gauntlet_jade', 'Verdigris Gauntlet', 'gauntlet', 35, '', 200), ('gauntlet_obsidian', 'Obsidian Gauntlet', 'gauntlet', 49, '', 200), ('gauntlet_spiked', 'Spiked Gauntlet', 'gauntlet', 8, '', 200), ('glove', 'Leather Glove', 'gauntlet', 50, '', 150),
  ('dagger', 'Steel Dagger', 'dagger', 0, 'h', 200), ('dagger_gold', 'Golden Dagger', 'dagger', 31, 'h', 300), ('dagger_shadow', 'Shadow Dagger', 'dagger', 37, 'h', 250), ('dagger_blood', 'Bloodied Dagger', 'dagger', 53, 'h', 250),
  ('wand', 'Star Wand', 'wand', 20, '', 250), ('wand_bone', 'Bone Wand', 'wand', 61, '', 250),
  ('quill', 'White Quill', 'quill', 1, 'v', 200), ('quill_raven', 'Raven Quill', 'quill', 8, 'v', 200), ('quill_teal', 'Teal Quill', 'quill', 35, 'v', 200),
  ('bone', 'Skeleton Finger', 'bone', 0, '', 250), ('bone_reaper', "Reaper's Finger", 'bone', 8, '', 300),
  ('claw', 'Dragon Claw', 'claw', 0, '', 250), ('claw_flame', 'Burning Claw', 'claw', 14, '', 300), ('claw_gold', 'Gold-banded Claw', 'claw', 32, '', 300),
  ('sword', 'Longsword', 'sword', 0, '', 200), ('sword_frost', 'Frost Blade', 'sword', 13, '', 300), ('sword_blood', 'Blood Blade', 'sword', 29, '', 300), ('sword_venom', 'Venom Blade', 'sword', 47, '', 300),
  ('key', 'Gold Key', 'key', 0, '', 200)]
data = {}; sheets = {}
for key, name, sh, i, flip, price in LIST:
    S = sheets.setdefault(sh, Image.open(f'{H}/{sh}_sheet.png').convert('RGBA'))
    im = S.crop((i % 8 * 32, i // 8 * 32, i % 8 * 32 + 32, i // 8 * 32 + 32))
    if flip == 'h': im = im.transpose(Image.FLIP_LEFT_RIGHT)
    if flip == 'v': im = im.transpose(Image.FLIP_TOP_BOTTOM)
    px = im.load(); pts = [(x + y, x, y) for y in range(32) for x in range(32) if px[x, y][3] > 128]
    bb = im.getbbox(); im2 = Image.new('RGBA', (32, 32)); im2.paste(im.crop(bb), (0, 0))        # push the art into the corner, so the tip is at the corner
    px = im2.load(); _, hx, hy = min((x + y, x, y) for y in range(32) for x in range(32) if px[x, y][3] > 128)
    im2.save(f'{OUT}/{key}.png'); data[key] = [name, price, hx, hy]
open(H + '/../../src/cursors_data.js', 'w').write('// made by tools/cursors/pack.py: key -> [name, Skull Token price (0 = the default), hotspot x, y]\nwindow.CB_CURSORS = ' + json.dumps(data) + ';\n')
big = Image.new('RGBA', (len(LIST) * 70, 70), (40, 40, 48, 255))
for n, (key, *_ ) in enumerate(LIST): big.alpha_composite(Image.open(f'{OUT}/{key}.png').resize((64, 64), Image.NEAREST), (n * 70 + 3, 3))
big.save(H + '/preview.png'); print(data)
