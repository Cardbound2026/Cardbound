import sys, subprocess, os
H = os.path.dirname(os.path.abspath(__file__)); B = dict(l.split() for l in open(H + '/blobs.txt') if l.strip()); a = []; P = dict(x.split('=') for x in sys.argv[1:])
for k, i in P.items(): a += [k, B[k], i]
subprocess.run(['python3', H + '/pick.py'] + a, stdout=subprocess.DEVNULL); open(H + '/picks.txt', 'a').write(''.join(f'{k} {i}\n' for k, i in P.items()))
