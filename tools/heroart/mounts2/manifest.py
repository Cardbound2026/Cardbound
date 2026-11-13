B = '/root/.claude/projects/-home-claude/654d5b11-96c9-5be1-9b01-ca0776c2bbeb/tool-results/mcp-remote-devices-blob-'
# re-animated: key -> {dir: (blob, cell)} sheets of 3 columns x 2 rows
RE = {'sabertooth': {'e': ('1794611473020-ctys9m', 176), 's': ('1794611474179-53q4ag', 132), 'n': ('1794611476635-tziks0', 148)},
  'panther': {'e': ('1794611487967-6ossr0', 172), 's': ('1794611489400-4206sz', 132), 'n': ('1794611491564-lc9dn2', 152)},
  'stag': {'e': ('1794611493574-ajw9vi', 156), 's': ('1794611495253-hfapi7', 152), 'n': ('1794611497033-aajntp', 164)},
  'wolf': {'e': ('1794611507704-w5k5su', 168), 's': ('1794611509594-73x908', 132), 'n': ('1794611511845-41dted', 152)},
  'bear': {'e': ('1794611513074-dd8r79', 156), 's': ('1794611515933-kntl3a', 136), 'n': ('1794611517941-x2rxen', 152)},
  'boar': {'e': ('1794611519561-8kj0h9', 172), 's': ('1794611520960-fw1m9u', 140), 'n': ('1794611523650-0dtnxy', 156)}}
# new: key -> (run rows blob [rows e, s, n; 6 columns], cell, (rotation blob, cell, first column, columns in sheet, vertical?))
NEW = {'dragon': ('1794611759254-tvujx0', 136, ('1794611832918-oz119q', 136, 3, 1, True)),
  'ghost': ('1794611830025-75bs7k', 128, ('1794611832918-oz119q', 136, 0, 1, True)),
  'scorpion': ('1794611761412-tefl7v', 136, ('1794611847375-ki776y', 136, 0, 6, False)),
  'chicken': ('1794611768397-v5x2nw', 136, ('1794611847375-ki776y', 136, 3, 6, False)),
  'blackchicken': ('1794611770773-frc5c1', 136, ('1794611851841-oylebj', 136, 0, 6, False)),
  'spider': ('1794614181010-fxv201', 136, ('1794611851841-oylebj', 136, 3, 6, False)),
  'gryphon': ('1794611814153-l89b7f', 136, ('1794611854714-rhl8fh', 136, 0, 6, False)),
  'raptor': ('1794611817118-no7vjz', 136, ('1794611854714-rhl8fh', 136, 3, 6, False)),
  'slug': ('1794611819636-6ihndq', 136, ('1794611857549-kpc0df', 136, 0, 3, False))}
# second pass (Nov 13): runs redone after review. key -> {dir: (blob, cell)}; the standing cells already in the sheet are kept
RE2 = {'ghost': {'e': ('1794614182577-wdkh9d', 168), 's': ('1794614184804-tpw59t', 148), 'n': ('1794614186536-h0hhm0', 160)}}
ALPHA = {'ghost': 0.72}   # the ghost horse is see-through
# third pass (Nov 13): the dragon and gryphon redrawn as detailed characters (the first ones were too coarse). rot: (blob, cell, first column, columns) in order east, south, north
CH = {'dragon': {'rot': ('1794614288919-bbiw8f', 128, 0, 6), 'e': ('1794614280182-mdhcfs', 172), 's': ('1794614281697-l5uml5', 132), 'n': ('1794614283552-1y3oy8', 160)},
  'gryphon': {'rot': ('1794614288919-bbiw8f', 128, 3, 6), 'e': ('1794614284656-qw9b17', 180), 's': ('1794614286364-an5cks', 160), 'n': ('1794614287683-1gcrxl', 160)}}
