# Balance pass from the 4-class sim: soften tier 3 / elite / boss damage and HP, fix three outliers.
import re, sys
p = sys.argv[1]; s = open(p).read()
TUNE = {'3': (0.75, 1.0), 'Elite': (0.7, 0.8), 'Boss': (0.65, 0.7)}  # (damage, HP)
blocks = re.split(r'(?=\ndict\(name=)', s)
out = []
for b in blocks:
    m = re.search(r"tier=('?)(\w+)\1", b)
    t = m.group(2) if m else None
    if t in TUNE:
        dm, hm = TUNE[t]
        b = re.sub(r"((?:Deal|deal) )(\d+)( (?:Shadow )?damage)", lambda x: x.group(1) + str(max(1, round(int(x.group(2)) * dm))) + x.group(3), b)
        b = re.sub(r"(deals )(\d+)( more damage)", lambda x: x.group(1) + str(round(int(x.group(2)) * dm)) + x.group(3), b)
        b = re.sub(r"(take )(\d+)( damage back)", lambda x: x.group(1) + str(round(int(x.group(2)) * dm)) + x.group(3), b)
        b = re.sub(r"hp=(\d+)", lambda x: f"hp={round(int(x.group(1)) * hm)}", b)
    out.append(b)
s = ''.join(out)
s = s.replace("Each hit applies 2 Bleed.", "Each hit applies 1 Bleed.")
s = s.replace("('Crown Smash',5,20,", "('Crown Smash',4,20,").replace("('Bandit Guard',4,10,", "('Bandit Guard',5,10,")
s = s.replace("hits for 56 Shadow", "hits for 42 Shadow")
open(p, 'w').write(s)
print(re.findall(r"name='([^']+)', tier=[^,]+, [^h]*hp=(\d+)", s)[10:])
