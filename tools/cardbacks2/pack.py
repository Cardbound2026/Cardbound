# Card backs sheet: tools/cardbacks/00..19.png (5 class backs, the first 15 shop ones) then tools/cardbacks2/<key>.png in list.txt order
# -> public/img/cardbacks.webp (10 across) and src/cardbacks_data.js (rows, and the shop entries for the second set)
import os, json
from PIL import Image
H = os.path.dirname(os.path.abspath(__file__)); R = os.path.dirname(os.path.dirname(H))
ims = [Image.open(f'{R}/tools/cardbacks/{i:02d}.png').convert('RGB') for i in range(20)]; extra = []
for l in open(H + '/list.txt'):
    k, name, _ = l.strip().split('|', 2)
    if os.path.exists(f'{H}/{k}.png'): ims.append(Image.open(f'{H}/{k}.png').convert('RGB')); extra.append([k, name, len(ims) - 1])
rows = (len(ims) + 9) // 10; sh = Image.new('RGB', (960, 136 * rows))
for i, im in enumerate(ims): assert im.size == (96, 136), im.size; sh.paste(im, ((i % 10) * 96, (i // 10) * 136))
sh.save(R + '/public/img/cardbacks.webp', lossless=True, method=6)
open(R + '/src/cardbacks_data.js', 'w').write('// made by tools/cardbacks2/pack.py\nwindow.CB_CARDBACKS = ' + json.dumps({'rows': rows, 'extra': extra}) + ';\n')
print(len(ims), 'backs', rows, 'rows')
