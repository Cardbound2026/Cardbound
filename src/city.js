  // ---------- the City of Emberwatch (Nov 2): the camp grew into a walled city. 150 x 110 tiles: Ember Square in the middle, Market Row,
  // the Grand Bazaar, the Colosseum, the Wagon Yard at the South Gate, the Barracks, Guild Row, the Scholars' Quarter, the Keep, the Cathedral.
  // The ground is drawn in 12 x 12 tile chunks as you walk (src/inkart.js ground), props are drawn only on screen, and buildings are solid.
  const MW = 150, MH = 110;
  const BAZ = { x0: 94, y0: 48, x1: 140, y1: 72 }; // the Grand Bazaar: set up shop anywhere inside
  const inBazaar = (x, y) => x >= BAZ.x0 && x <= BAZ.x1 && y >= BAZ.y0 && y <= BAZ.y1;
  const ARN = { x: 118, y: 91, rx: 11.2, ry: 5.3, RX: 17.3, RY: 11.6 }; // the Colosseum: sand floor and the outer wall (Nov 12: measured from the painting, tools/townart)
  const inArena = (x, y) => ((x + .5 - ARN.x) / ARN.RX) ** 2 + ((y + .5 - ARN.y) / ARN.RY) ** 2 <= 1;
  const CITY_SPAWN = { x: 74, y: 64 }, CITY_RETURN = { x: 75, y: 99 }; // log in at Ember Square; come home from a run in the Wagon Yard
  const TOWN = { running: false, last: 0, t: 0, TS: 48, dpr: 1, chunks: new Map(), dark: null, sprites: {}, embers: [], district: '', districtAt: 0 };
  const P = { x: CITY_SPAWN.x, y: CITY_SPAWN.y, dir: 'down', mv: null, path: [], held: [], talkTo: null, step: 0 };
  const STEP_MS = 165;
  const ground = []; const solid = new Set(); const K = (x, y) => x + ',' + y;
  for (let y = 0; y < MH; y++) { ground.push([]); for (let x = 0; x < MW; x++) ground[y].push('g'); }
  const setG = (x, y, v) => { if (x >= 0 && y >= 0 && x < MW && y < MH) ground[y][x] = v; };
  const gRect = (x0, y0, x1, y1, v) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) setG(x, y, v); };
  const gDisc = (cx, cy, rx, ry, v) => { for (let y = Math.floor(cy - ry); y <= cy + ry; y++) for (let x = Math.floor(cx - rx); x <= cx + rx; x++) if (((x + .5 - cx) / rx) ** 2 + ((y + .5 - cy) / ry) ** 2 <= 1) setG(x, y, v); };
  // the River Ash, then the streets: the King's Road (South Gate to the Keep), Market Street (west gate to east gate), lanes
  const riverY = (x) => 30 + Math.round(Math.sin(x / 13) * 1.5);
  for (let x = 0; x < MW; x++) gRect(x, riverY(x), x, riverY(x) + 3, '~');
  gRect(72, 18, 77, 105, 'b'); gRect(4, 58, 145, 61, 'b');
  gRect(30, 18, 32, 104, 'p'); gRect(116, 18, 118, 56, 'p'); gRect(4, 82, 70, 83, 'p'); gRect(18, 44, 70, 45, 'p'); gRect(80, 44, 140, 45, 'p'); gRect(55, 61, 56, 90, 'p'); gRect(78, 74, 100, 75, 'p'); gRect(90, 61, 93, 90, 'p');
  gDisc(74.5, 60, 13, 10.5, 'b');                 // Ember Square
  gRect(58, 90, 91, 104, 'p');                    // the Wagon Yard
  gRect(94, 48, 140, 72, 'b');                    // the Grand Bazaar
  gRect(97, 86, 105, 96, 'b');                    // the Colosseum's west plaza
  gDisc(ARN.x, ARN.y, ARN.rx, ARN.ry, 'a');       // the Colosseum's sand
  for (let x = Math.round(ARN.x - ARN.RX); x < ARN.x - ARN.rx + 1; x++) gRect(x, ARN.y - 2, x, ARN.y, 'a'); // the west gate into the ring
  for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) if (ground[y][x] !== 'a' && ((x + .5 - ARN.x) / (ARN.RX + .6)) ** 2 + ((y + .5 - ARN.y) / (ARN.RY + .6)) ** 2 <= 1) setG(x, y, 'b'); // the stands stand on stone
  gRect(60, 14, 89, 22, 'b');                     // the Keep's courtyard
  gRect(14, 88, 44, 103, 'a');                    // the training yard
  gRect(34, 63, 52, 76, 'b');                     // the Old Market
  for (const [a, b] of [[72, 77], [30, 32], [116, 118]]) for (let x = a; x <= b; x++) gRect(x, riverY(x) - 1, x, riverY(x) + 4, 'p'); // bridges (drawn as props)
  // props: x, y = footprint top-left; w, h in tiles. Buildings, walls and water are solid; NPCs stand at the doors.
  const PROPS = [];
  const B = (x, y, w, h, o) => PROPS.push(Object.assign({ kind: 'bld', x, y, w, h }, o || {}));
  for (const [a, b] of [[72, 77], [30, 32], [116, 118]]) PROPS.push({ kind: 'bridge', x: a - 1, y: 28, w: b - a + 3, h: 7, nosolid: true });
  // the city wall: a block per tile, a tower every 18 tiles, the gatehouse over the South Gate
  for (let x = 2; x < MW - 2; x++) { PROPS.push({ kind: 'wallseg', x, y: 2, w: 1, h: 1, side: 'h' }); if (x < 71 || x > 78) PROPS.push({ kind: 'wallseg', x, y: MH - 3, w: 1, h: 1, side: 'h' }); }
  for (let y = 3; y < MH - 3; y++) { PROPS.push({ kind: 'wallseg', x: 2, y, w: 1, h: 1, side: 'v' }); PROPS.push({ kind: 'wallseg', x: MW - 3, y, w: 1, h: 1, side: 'v' }); }
  for (let x = 2; x < MW - 2; x += 18) { PROPS.push({ kind: 'tower', x: x - 1, y: 1, w: 3, h: 2 }); if (x < 66 || x > 82) PROPS.push({ kind: 'tower', x: x - 1, y: MH - 4, w: 3, h: 2 }); }
  for (let y = 20; y < MH - 6; y += 18) { PROPS.push({ kind: 'tower', x: 1, y: y - 1, w: 3, h: 2 }); PROPS.push({ kind: 'tower', x: MW - 4, y: y - 1, w: 3, h: 2 }); }
  PROPS.push({ kind: 'tower', x: 68, y: MH - 4, w: 3, h: 2 }, { kind: 'tower', x: 79, y: MH - 4, w: 3, h: 2 }, { kind: 'gatehouse', x: 71, y: MH - 4, w: 8, h: 2 });
  PROPS.push({ kind: 'keep', x: 62, y: 4, w: 26, h: 10 });
  B(58, 12, 4, 6, { roof: 'slate', wall: 'stone' }); B(88, 12, 4, 6, { roof: 'slate', wall: 'stone' });
  PROPS.push({ kind: 'hall', x: 67, y: 41, w: 15, h: 7, name: 'Hall of Records' });
  B(32, 52, 7, 5, { roof: 'slate', wall: 'stone', sign: 'bank', name: 'The Bank' }); B(40, 52, 7, 5, { roof: 'red', sign: 'Dace' }); B(48, 52, 6, 5, { roof: 'gold', sign: 'gem' }); B(55, 52, 6, 5, { roof: 'slate', wall: 'stone', sign: 'vault' });
  B(22, 52, 7, 5, { roof: 'thatch' }); B(14, 52, 7, 5, { roof: 'red' }); B(7, 52, 6, 5, { roof: 'slate' });
  B(7, 63, 6, 5, { roof: 'thatch' }); B(15, 63, 7, 5, { roof: 'red' }); B(23, 63, 6, 5, { roof: 'slate', sign: 'gear' });
  B(57, 65, 8, 6, { roof: 'red', sign: 'mug' });
  PROPS.push({ kind: 'hall', x: 12, y: 9, w: 15, h: 8, name: 'Grand Library', roof: 'slate' });
  B(36, 10, 12, 7, { roof: 'green', wall: 'stone' }); B(12, 21, 6, 5, { roof: 'thatch' }); B(20, 21, 7, 5, { roof: 'slate' }); B(36, 21, 6, 5, { roof: 'red' }); B(44, 21, 8, 5, { roof: 'green' });
  PROPS.push({ kind: 'hall', x: 100, y: 7, w: 20, h: 11, name: 'Cathedral of the Ember', roof: 'slate', spire: true });
  for (const [x, y, w, r] of [[124, 8, 6, 'red'], [132, 8, 7, 'thatch'], [124, 18, 7, 'slate'], [133, 18, 6, 'red'], [94, 20, 6, 'thatch'], [102, 21, 6, 'red'], [123, 37, 6, 'red'], [131, 37, 7, 'thatch'], [96, 36, 7, 'slate'], [105, 36, 6, 'thatch'], [10, 36, 7, 'red'], [19, 36, 6, 'slate'], [36, 36, 7, 'thatch'], [45, 36, 6, 'red'], [52, 36, 6, 'slate'], [8, 92, 5, 'thatch'], [62, 76, 6, 'slate'], [82, 78, 6, 'red'], [82, 84, 6, 'thatch'], [138, 76, 6, 'red'], [138, 84, 6, 'slate']]) B(x, y, w, 5, { roof: r });
  for (let row = 0; row < 3; row++) for (let i = 0; i < 6; i++) if (!(row === 1 && (i === 2 || i === 3))) PROPS.push({ kind: 'awning', x: 97 + i * 7, y: 50 + row * 7, w: 5, h: 3, c: ['red', 'cream', 'blue', 'green'][(i + row) % 4] });
  PROPS.push({ kind: 'fountain', x: 115, y: 58, w: 4, h: 3 });
  for (const [x, y] of [[36, 65], [42, 65], [48, 65], [36, 71], [48, 71]]) PROPS.push({ kind: 'stall', x, y, w: 4, h: 2 });
  { const cx0 = Math.round(ARN.x - ARN.RX), cy0 = Math.round(ARN.y - ARN.RY), cw = Math.round(ARN.RX * 2), ch = Math.round(ARN.RY * 2);
    PROPS.push({ kind: 'colosseum', part: 'back', x: cx0, y: cy0, w: cw, h: Math.round(ARN.RY - ARN.ry), nosolid: true, cy0, ch }, { kind: 'colosseum', part: 'front', x: cx0, y: cy0 + ch - 1, w: cw, h: 1, nosolid: true, cy0, ch }); }
  B(12, 74, 14, 7, { roof: 'slate', wall: 'stone', sign: 'shield' });
  PROPS.push({ kind: 'hall', x: 34, y: 73, w: 15, h: 8, name: 'Guild Hall', roof: 'green' });
  for (const [x, y] of [[48, 85], [48, 95]]) B(x, y, 6, 5, { roof: 'red', banner: true });
  B(94, 97, 10, 6, { roof: 'thatch', sign: 'horse' });
  for (const [x, y] of [[61, 95], [65, 100], [83, 95], [86, 100]]) PROPS.push({ kind: 'wagon', x, y, w: 3, h: 2 });
  PROPS.push({ kind: 'brazier', x: 73, y: 57, w: 3, h: 3 });
  PROPS.push({ kind: 'statue', x: 68, y: 55, w: 1, h: 1 });
  PROPS.push({ kind: 'board', x: 73, y: 49, w: 1, h: 1 }, { kind: 'board', x: 76, y: 49, w: 1, h: 1 });
  /* Nov 13: the Wager Board moved inside, onto the arena floor (extras.js: exArFrame) */
  PROPS.push({ kind: 'fountain', x: 63, y: 61, w: 4, h: 3 }, { kind: 'fountain', x: 82, y: 61, w: 4, h: 3 });
  PROPS.push({ kind: 'sign', x: 79, y: 102, w: 1, h: 1 }, { kind: 'chest', x: 61, y: 57, w: 1, h: 1 });
  for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2 + .3; const x = Math.round(74.5 + Math.cos(a) * 12), y = Math.round(60 + Math.sin(a) * 9.4); if (ground[y][x] === 'b') PROPS.push({ kind: 'torch', x, y, w: 1, h: 1 }); }
  for (let y = 20; y < 104; y += 6) if (ground[y][71] !== '~' && ground[y][78] !== '~') { PROPS.push({ kind: 'torch', x: 71, y, w: 1, h: 1 }); PROPS.push({ kind: 'torch', x: 78, y, w: 1, h: 1 }); }
  for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; PROPS.push({ kind: 'torch', x: Math.round(ARN.x + Math.cos(a) * (ARN.RX + 1.2)), y: Math.round(ARN.y + Math.sin(a) * (ARN.RY + 1)), w: 1, h: 1 }); }
  for (const [x, y] of [[93, 49], [141, 49], [93, 72], [141, 72], [117, 47]]) PROPS.push({ kind: 'torch', x, y, w: 1, h: 1 });
  // solid: walls round the edge, water, building footprints, the Colosseum's stands
  for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) { if (x <= 3 || x >= MW - 4 || y <= 3 || y >= MH - 4 || ground[y][x] === '~') solid.add(K(x, y)); }
  for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) { const o = ((x + .5 - ARN.x) / ARN.RX) ** 2 + ((y + .5 - ARN.y) / ARN.RY) ** 2, i = ((x + .5 - ARN.x) / ARN.rx) ** 2 + ((y + .5 - ARN.y) / ARN.ry) ** 2; if (o <= 1) solid.add(K(x, y)); }   // Nov 13: the whole Colosseum is solid from outside (stands and sand): you go in through Kord's gate
  for (const p of PROPS) if (!p.nosolid) for (let y = p.y; y < p.y + p.h; y++) for (let x = p.x; x < p.x + p.w; x++) solid.add(K(x, y));
  // trees in the open ground (seeded, so every player sees the same city)
  { let s = 7; const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < 420 && PROPS.filter(p => p.kind === 'tree').length < 170; i++) { const x = 5 + Math.floor(r() * (MW - 10)), y = 5 + Math.floor(r() * (MH - 10));
      if (ground[y][x] !== 'g' || solid.has(K(x, y)) || [[0, 1], [0, -1], [1, 0], [-1, 0], [0, 2]].some(([dx, dy]) => solid.has(K(x + dx, y + dy)) || (ground[y + dy] || [])[x + dx] !== 'g')) continue;
      PROPS.push({ kind: 'tree', x, y, w: 1, h: 1, v: i % 3 }); solid.add(K(x, y)); } }
  for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) if (ground[y][x] === 'p' && solid.has(K(x, y)) && PROPS.some(p => p.kind === 'bridge' && x >= p.x && x < p.x + p.w)) solid.delete(K(x, y)); // walk over the bridges
  // where each townsperson stands (in front of their building)
  const CITY_NPC = { wagon: [74, 97, 'down'], tinker: [77, 58, 'left'], qm: [58, 57, 'down'], merchant: [43, 57, 'down'], jeweler: [51, 57, 'down'], scribe: [19, 18, 'down'], archivist: [42, 17, 'down'],
    chron: [70, 49, 'down'], barber: [17, 57, 'down'], boutique: [25, 57, 'down'], tavern: [61, 71, 'down'], captain: [19, 81, 'down'], guildmaster: [41, 81, 'down'], raidwarden: [75, 16, 'down'], arena: [99, 91, 'right'], dummy: [18, 92, 'down'], banker: [35, 57, 'down'] };
  // districts: the name shows when you walk in
  const DISTRICTS = [['Ember Square', 61, 49, 88, 71], ['The Grand Bazaar', 93, 47, 141, 73], ['The Colosseum', 97, 77, 137, 105], ['The Wagon Yard', 57, 88, 92, 105], ['Market Row', 4, 50, 60, 62], ['The Old Market', 33, 62, 53, 77],
    ['The Barracks', 4, 72, 47, 105], ['Guild Row', 33, 72, 56, 87], ["Scholars' Quarter", 4, 4, 56, 28], ['The Keep', 57, 4, 92, 24], ['Cathedral Hill', 93, 4, 146, 28], ['The River Ash', 4, 27, 146, 35], ['Riverside', 4, 35, 146, 49], ['The Stables', 93, 94, 106, 105]];
  const districtAt = (x, y) => { const d = DISTRICTS.find(([n, a, b, c, e]) => x >= a && x <= c && y >= b && y <= e); return d ? d[0] : 'Emberwatch'; };
  // ---------- city drawing (Nov 2): the new buildings in the same cut-paper ink as the town art pack (src/inkart.js)
  const CITYDRAW = (function () {
const INK = '#0b0a07';
let seed = 7; const R = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const path = (g, pts) => { g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]); g.closePath(); };
const ink = (g, lw) => { g.lineWidth = lw; g.strokeStyle = INK; g.lineJoin = 'miter'; g.miterLimit = 2.4; g.stroke(); };
const P = (g, pts, fill, lw) => { path(g, pts); if (fill) { g.fillStyle = fill; g.fill(); } if (lw) ink(g, lw); };
const L = (g, pts, col, lw) => { g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]); g.strokeStyle = col || INK; g.lineWidth = lw; g.lineJoin = 'bevel'; g.stroke(); };
const bbox = (pts) => { let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (const [x, y] of pts) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); } return [x0, y0, x1 - x0, y1 - y0]; };
function S(g, pts, pal, lw, o) {
  o = o || {}; const [x, y, w, h] = bbox(pts), k = o.mass == null ? .5 : o.mass;
  path(g, pts); g.fillStyle = pal[0]; g.fill(); g.save(); g.clip();
  P(g, [[x + w * (1 - k), y - 2], [x + w + 2, y - 2], [x + w + 2, y + h + 2], [x + w * (.75 - k), y + h + 2], [x + w * (1.02 - k), y + h * .55]], pal[1]);
  if (pal[2]) { g.globalAlpha = .7; P(g, [[x + w * .08, y + h * .3], [x + w * .2, y + h * .08], [x + w * .42, y + h * .06], [x + w * .2, y + h * .16], [x + w * .12, y + h * .42]], pal[2]); g.globalAlpha = 1; }
  if (o.cuts) for (let i = 0; i < o.cuts; i++) { const px = x + w * (.15 + R() * .7), py = y + h * (.2 + R() * .65); L(g, [[px, py], [px + 3 + R() * 4, py - 1.5 - R() * 2]], INK, 1.1); }
  g.restore(); path(g, pts); if (lw) ink(g, lw);
}
const shadow = (g, cx, cy, rx, ry, a) => { g.fillStyle = `rgba(0,0,0,${a || .45})`; g.beginPath(); g.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); g.fill(); };
const STONE = ['#4a4640', '#1e1c19', '#7a746a'], STONE2 = ['#3d3a35', '#181614', '#6a645b'], W8 = ['#4a3622', '#1c140c', '#7a5c3c'], PLASTER = ['#8c8270', '#3a342b', '#c4b89e'];
const ROOFS = { red: ['#5b2a22', '#220d0a', '#9a5040'], slate: ['#2e3540', '#0f1216', '#5d6878'], thatch: ['#6b5a34', '#2a2212', '#a08c58'], green: ['#2f4430', '#0e160f', '#5f7c58'], gold: ['#7a5a20', '#2a1e08', '#c8a050'] };

// ---------- drawing the new pieces
function bld(g, p, TS) {
  const s = TS / 48, x0 = p.x * TS, y0 = p.y * TS, w = p.w * TS, h = p.h * TS, lw = 2.4 * s, wall = p.wall === 'stone' ? STONE : p.wall || PLASTER, roof = ROOFS[p.roof || 'red'];
  const wallH = Math.min(h * .45, TS * 1.6), by = y0 + h, wy = by - wallH;
  shadow(g, x0 + w / 2 + 6 * s, by, w * .55, TS * .3, .45);
  S(g, [[x0, wy], [x0 + w, wy], [x0 + w, by], [x0, by]], wall, lw, { mass: .3, cuts: Math.round(p.w * 1.5) });
  if (wall === PLASTER) for (let i = 1; i < p.w; i++) L(g, [[x0 + i * TS, wy], [x0 + i * TS, by]], 'rgba(40,28,16,.85)', 3 * s); // timber frame
  if (wall === PLASTER) L(g, [[x0, wy + wallH * .5], [x0 + w, wy + wallH * .5]], 'rgba(40,28,16,.85)', 3 * s);
  // roof: a gable seen from the front and above
  const ry = y0, eave = wy + 3 * s, over = 8 * s;
  S(g, [[x0 - over, eave], [x0 + w * .12, ry + TS * .2], [x0 + w * .88, ry + TS * .2], [x0 + w + over, eave]], roof, 2.8 * s, { mass: .42, cuts: Math.round(p.w * 2) });
  for (let i = 1; i < p.w * 2; i++) { const u = i / (p.w * 2); L(g, [[x0 + w * (.12 + u * .76), ry + TS * .25], [x0 - over + (w + over * 2) * u, eave - 2 * s]], 'rgba(0,0,0,.55)', 1.2 * s); }
  L(g, [[x0 + w * .12, ry + TS * .2], [x0 + w * .88, ry + TS * .2]], INK, 3 * s);
  if (p.w >= 6) { const cx = x0 + w * .78; S(g, [[cx, ry + TS * .5], [cx, ry - TS * .15], [cx + TS * .45, ry - TS * .15], [cx + TS * .45, ry + TS * .6]], STONE2, 2 * s); }
  // door and lit windows
  const dx = x0 + w / 2; P(g, [[dx - TS * .38, by], [dx - TS * .38, by - TS * .95], [dx, by - TS * 1.1], [dx + TS * .38, by - TS * .95], [dx + TS * .38, by]], '#1a110a', 2.2 * s);
  for (let i = 0; i < p.w; i++) { const wx = x0 + (i + .5) * TS; if (Math.abs(wx - dx) < TS * .9) continue; P(g, [[wx - TS * .2, wy + TS * .25], [wx + TS * .2, wy + TS * .25], [wx + TS * .2, wy + TS * .62], [wx - TS * .2, wy + TS * .62]], i % 3 ? '#f2a14e' : '#3a2c1c', 1.8 * s); L(g, [[wx, wy + TS * .25], [wx, wy + TS * .62]], INK, 1.6 * s); }
  if (p.sign) { const sx = dx + TS * .9, sy = by - TS * 1.25; L(g, [[sx - TS * .1, sy - TS * .25], [sx + TS * .6, sy - TS * .25]], INK, 3 * s); S(g, [[sx, sy - TS * .2], [sx + TS * .55, sy - TS * .2], [sx + TS * .55, sy + TS * .25], [sx, sy + TS * .25]], W8, 2 * s);
    g.fillStyle = '#e4c27a'; g.font = `700 ${Math.round(14 * s)}px serif`; g.textAlign = 'center'; g.fillText({ Dace: '$', gem: '♦', vault: '▣', gear: '⚙', mug: '☕', shield: '✦', horse: '♘' }[p.sign] || '', sx + TS * .275, sy + TS * .14); }
  if (p.banner) { const bx = x0 + TS * .5; L(g, [[bx, wy - TS * .4], [bx, by - TS * .2]], INK, 2.5 * s); S(g, [[bx, wy - TS * .35], [bx + TS * .55, wy - TS * .35], [bx + TS * .55, wy + TS * .55], [bx + TS * .27, wy + TS * .4], [bx, wy + TS * .55]], ['#6a2a7a', '#26102c', '#a060b0'], 1.8 * s); }
}
function hall(g, p, TS) { // a grand stone building with a colonnade (Hall of Records, Library, Cathedral, Guild Hall)
  const s = TS / 48, x0 = p.x * TS, y0 = p.y * TS, w = p.w * TS, h = p.h * TS, by = y0 + h, lw = 2.6 * s, roof = ROOFS[p.roof || 'slate'];
  shadow(g, x0 + w / 2 + 8 * s, by, w * .55, TS * .4, .5);
  const wallH = TS * 2.4, wy = by - wallH;
  S(g, [[x0, wy], [x0 + w, wy], [x0 + w, by], [x0, by]], STONE, lw, { mass: .3, cuts: p.w * 2 });
  for (let r = 1; r < 5; r++) L(g, [[x0, wy + r * wallH / 5], [x0 + w, wy + r * wallH / 5]], 'rgba(0,0,0,.4)', 1.2 * s);
  S(g, [[x0 - 10 * s, wy + 4 * s], [x0 + w * .08, y0 + TS * .3], [x0 + w * .92, y0 + TS * .3], [x0 + w + 10 * s, wy + 4 * s]], roof, 3 * s, { mass: .42, cuts: p.w * 2 });
  for (let i = 1; i < p.w; i++) { const u = i / p.w; L(g, [[x0 + w * (.08 + u * .84), y0 + TS * .35], [x0 - 10 * s + (w + 20 * s) * u, wy]], 'rgba(0,0,0,.5)', 1.2 * s); }
  // pediment and steps
  const cx = x0 + w / 2; S(g, [[cx - TS * 3, wy + 6 * s], [cx, wy - TS * 1.2], [cx + TS * 3, wy + 6 * s]], ['#6a645a', '#26231f', '#a09888'], 2.6 * s, { mass: .45 });
  for (let i = 0; i < 3; i++) S(g, [[cx - TS * (3.4 + i * .3), by + i * 5 * s], [cx + TS * (3.4 + i * .3), by + i * 5 * s], [cx + TS * (3.4 + i * .3), by + (i + 1) * 5 * s], [cx - TS * (3.4 + i * .3), by + (i + 1) * 5 * s]], STONE2, 1.6 * s);
  for (let i = 0; i < 6; i++) { const px = cx - TS * 2.6 + i * TS * 1.04; S(g, [[px - 7 * s, wy + 8 * s], [px + 7 * s, wy + 8 * s], [px + 7 * s, by], [px - 7 * s, by]], ['#9a9282', '#3a362e', '#d0c8b4'], 1.8 * s, { mass: .4 }); }
  P(g, [[cx - TS * .6, by], [cx - TS * .6, by - TS * 1.5], [cx, by - TS * 1.8], [cx + TS * .6, by - TS * 1.5], [cx + TS * .6, by]], '#140d08', 2.2 * s);
  for (const wx of [x0 + TS * 1.5, x0 + w - TS * 1.5]) { P(g, [[wx - TS * .35, wy + TS * .5], [wx + TS * .35, wy + TS * .5], [wx + TS * .35, wy + TS * 1.4], [wx, wy + TS * 1.6], [wx - TS * .35, wy + TS * 1.4]], '#f2a14e', 2 * s); }
  if (p.spire) { const sx = x0 + w * .2; S(g, [[sx - TS, wy], [sx - TS, y0 - TS * 2], [sx, y0 - TS * 5], [sx + TS, y0 - TS * 2], [sx + TS, wy]], STONE, 2.6 * s, { mass: .4, cuts: 6 }); P(g, [[sx - TS * .3, y0 - TS * 1.2], [sx + TS * .3, y0 - TS * 1.2], [sx + TS * .3, y0 - TS * .2], [sx - TS * .3, y0 - TS * .2]], '#f2a14e', 2 * s); }
  if (p.name && TS >= 20) { g.font = `700 ${Math.round(13 * s)}px "Barlow Semi Condensed", sans-serif`; g.textAlign = 'center'; const tw = g.measureText(p.name).width + 14 * s; g.fillStyle = 'rgba(10,8,6,.82)'; g.fillRect(cx - tw / 2, wy - TS * 1.75, tw, 18 * s); g.fillStyle = '#e4c27a'; g.fillText(p.name, cx, wy - TS * 1.75 + 13 * s); }
}
function keep(g, p, TS) {
  const s = TS / 48, x0 = p.x * TS, y0 = p.y * TS, w = p.w * TS, h = p.h * TS, by = y0 + h;
  shadow(g, x0 + w / 2, by, w * .55, TS * .5, .5);
  S(g, [[x0 + TS * 3, y0 + TS], [x0 + w - TS * 3, y0 + TS], [x0 + w - TS * 3, by], [x0 + TS * 3, by]], STONE, 3 * s, { mass: .32, cuts: 30 });
  for (let i = 0; i < 14; i++) { const cx = x0 + TS * 3 + i * (w - TS * 6) / 13; S(g, [[cx - 6 * s, y0 + TS], [cx - 6 * s, y0 + TS * .55], [cx + 8 * s, y0 + TS * .55], [cx + 8 * s, y0 + TS]], STONE2, 1.8 * s); }
  for (const tx of [x0, x0 + w - TS * 4]) { S(g, [[tx, y0], [tx + TS * 4, y0], [tx + TS * 4, by + TS * .4], [tx, by + TS * .4]], STONE, 3 * s, { mass: .35, cuts: 12 }); S(g, [[tx - TS * .3, y0 + TS * .2], [tx + TS * 2, y0 - TS * 2.8], [tx + TS * 4.3, y0 + TS * .2]], ROOFS.slate, 3 * s, { mass: .45 });
    P(g, [[tx + TS * 1.7, y0 + TS * 2], [tx + TS * 2.3, y0 + TS * 2], [tx + TS * 2.3, y0 + TS * 3.2], [tx + TS * 1.7, y0 + TS * 3.2]], '#f2a14e', 2 * s);
    L(g, [[tx + TS * 2, y0 - TS * 2.8], [tx + TS * 2, y0 - TS * 4]], INK, 2.5 * s); S(g, [[tx + TS * 2, y0 - TS * 4], [tx + TS * 3.2, y0 - TS * 3.6], [tx + TS * 2, y0 - TS * 3.2]], ['#8a2a22', '#3a0d0a', '#c8584a'], 1.6 * s); }
  const cx = x0 + w / 2; P(g, [[cx - TS * 1.6, by], [cx - TS * 1.6, by - TS * 3], [cx, by - TS * 4], [cx + TS * 1.6, by - TS * 3], [cx + TS * 1.6, by]], '#100b07', 3 * s);
  for (let i = 0; i < 6; i++) L(g, [[cx - TS * 1.5 + i * TS * .6, by - TS * 3.2], [cx - TS * 1.5 + i * TS * .6, by]], '#3a3026', 3 * s);
  for (const bx of [cx - TS * 3.2, cx + TS * 2.6]) S(g, [[bx, by - TS * 4.5], [bx + TS * .6, by - TS * 4.5], [bx + TS * .6, by - TS * 1.8], [bx + TS * .3, by - TS * 2.2], [bx, by - TS * 1.8]], ['#6b1f1a', '#2a0b09', '#b8584a'], 2 * s);
}
function wallseg(g, p, TS) { // one tile of the city wall: big shaded blocks with a crenel
  const s = TS / 48, x0 = p.x * TS, y0 = p.y * TS, i = p.x + p.y;
  if (p.side === 'h') { S(g, [[x0, y0 - TS * .35], [x0 + TS, y0 - TS * .35], [x0 + TS, y0 + TS * 1.1], [x0, y0 + TS * 1.1]], i % 2 ? STONE : STONE2, 2 * s, { mass: .3, cuts: 2 }); L(g, [[x0, y0 + TS * .35], [x0 + TS, y0 + TS * .35]], 'rgba(0,0,0,.45)', 1.2 * s); S(g, [[x0 + TS * .15, y0 - TS * .6], [x0 + TS * .55, y0 - TS * .6], [x0 + TS * .55, y0 - TS * .35], [x0 + TS * .15, y0 - TS * .35]], STONE2, 1.6 * s); }
  else S(g, [[x0 + TS * .1, y0 - TS * .3], [x0 + TS * .9, y0 - TS * .3], [x0 + TS * .9, y0 + TS], [x0 + TS * .1, y0 + TS]], i % 2 ? STONE : STONE2, 2 * s, { mass: .35, cuts: 2 });
}
function tower(g, p, TS) {
  const s = TS / 48, cx = (p.x + p.w / 2) * TS, cy = (p.y + p.h) * TS - TS * .4;
  shadow(g, cx, cy + TS * .4, TS * 1.4, TS * .4, .5); S(g, [[cx - TS * 1.1, cy - TS * 2.2], [cx + TS * 1.1, cy - TS * 2.2], [cx + TS * 1.1, cy + TS * .3], [cx - TS * 1.1, cy + TS * .3]], STONE, 2.6 * s, { mass: .35, cuts: 5 });
  S(g, [[cx - TS * 1.3, cy - TS * 2.1], [cx, cy - TS * 3.7], [cx + TS * 1.3, cy - TS * 2.1]], ROOFS.slate, 2.6 * s, { mass: .45 }); P(g, [[cx - TS * .15, cy - TS * 1.5], [cx + TS * .15, cy - TS * 1.5], [cx + TS * .15, cy - TS * .9], [cx - TS * .15, cy - TS * .9]], '#f2a14e', 1.6 * s);
}
function gatehouse(g, p, TS) {
  const s = TS / 48, x0 = p.x * TS, w = p.w * TS, by = (p.y + p.h) * TS;
  S(g, [[x0, by - TS * 3], [x0 + w, by - TS * 3], [x0 + w, by - TS * 1.6], [x0, by - TS * 1.6]], STONE, 2.6 * s, { mass: .3, cuts: 6 });
  for (let i = 0; i < p.w; i++) S(g, [[x0 + i * TS + TS * .2, by - TS * 3.35], [x0 + i * TS + TS * .6, by - TS * 3.35], [x0 + i * TS + TS * .6, by - TS * 3], [x0 + i * TS + TS * .2, by - TS * 3]], STONE2, 1.6 * s);
  for (let i = 0; i < p.w * 2; i++) L(g, [[x0 + (i + .5) * TS / 2, by - TS * 1.6], [x0 + (i + .5) * TS / 2, by - TS * .2]], '#2a2016', 3 * s);
  L(g, [[x0, by - TS * 1.1], [x0 + w, by - TS * 1.1]], '#2a2016', 3 * s);
  for (const bx of [x0 + TS * .3, x0 + w - TS * .9]) S(g, [[bx, by - TS * 2.9], [bx + TS * .6, by - TS * 2.9], [bx + TS * .6, by - TS * 1.7], [bx + TS * .3, by - TS * 1.9], [bx, by - TS * 1.7]], ['#6b1f1a', '#2a0b09', '#b8584a'], 2 * s);
}
function colosseum(g, p, TS) {
  const s = TS / 48, cx = (ARN.x) * TS, cy = (ARN.y) * TS, RX = TS * ARN.RX, RY = TS * ARN.RY, rx = TS * ARN.rx, ry = TS * ARN.ry, front = p.part === 'front';
  if (!front) shadow(g, cx, cy + RY * .1, RX * 1.05, RY * 1.02, .5);
  const N = 56, o = (a, r1, r2) => [cx + Math.cos(a) * r1, cy + Math.sin(a) * r2];
  for (let i = 0; i < N; i++) {
    const a0 = i / N * Math.PI * 2, a1 = (i + 1) / N * Math.PI * 2, mid = (a0 + a1) / 2, isFront = Math.sin(mid) > 0; if (isFront !== front) continue;
    if (Math.abs(Math.cos(mid) + 1) < .02 + 1.4 / ARN.RY * .5) continue; // the west gate
    const hgt = isFront ? TS * 2.4 : TS * 1.2, lit = Math.cos(mid + 2.3);
    const top = [o(a0, RX, RY), o(a1, RX, RY), o(a1, RX - TS * 1.6, RY - TS * 1.3), o(a0, RX - TS * 1.6, RY - TS * 1.3)];
    if (isFront) { const A = o(a0, RX, RY), B2 = o(a1, RX, RY); S(g, [[A[0], A[1] - hgt], [B2[0], B2[1] - hgt], [B2[0], B2[1]], [A[0], A[1]]], lit > 0 ? STONE : STONE2, 2 * s, { mass: .3 });
      const mx = (A[0] + B2[0]) / 2, my = (A[1] + B2[1]) / 2; P(g, [[mx - TS * .28, my - hgt * .15], [mx - TS * .28, my - hgt * .55], [mx, my - hgt * .7], [mx + TS * .28, my - hgt * .55], [mx + TS * .28, my - hgt * .15]], '#120c08', 1.6 * s);
      S(g, top.map(([x, y]) => [x, y - hgt]), ['#5a544b', '#24211d', '#8a8478'], 1.6 * s, { mass: .4 }); }
    else S(g, top.map(([x, y]) => [x, y - hgt * .3]), ['#4e4943', '#1e1c19', '#7a746a'], 1.4 * s, { mass: .4 });
  }
  if (front) return;
  const T = ARN.RY - ARN.ry - 1.6, rows = Math.max(3, Math.floor(T / .9));
  for (let t = 0; t < rows; t++) { const r1 = RX - TS * (1.6 + t * .9), r2 = RY - TS * (1.3 + t * .9); g.lineWidth = TS * .55; g.strokeStyle = t % 2 ? '#3a3530' : '#45403a'; g.beginPath(); g.ellipse(cx, cy - TS * .6, r1 - TS * .3, r2 - TS * .3, 0, Math.PI * 1.03, Math.PI * 1.97); g.stroke(); g.lineWidth = 1.4 * s; g.strokeStyle = INK; g.beginPath(); g.ellipse(cx, cy - TS * .6, r1 - TS * .58, r2 - TS * .58, 0, Math.PI * 1.03, Math.PI * 1.97); g.stroke(); }
  let rs = 5; const rr = () => (rs = (rs * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 420; i++) { const a = Math.PI * 1.04 + rr() * Math.PI * .92, t = rr() * (rows - .6), r1 = RX - TS * (1.9 + t * .9), r2 = RY - TS * (1.6 + t * .9); const x = cx + Math.cos(a) * r1, y = cy - TS * .6 + Math.sin(a) * r2; g.fillStyle = ['#8a3a2a', '#c8b48a', '#3a5a7a', '#6a6a4a', '#2a2622'][i % 5]; g.beginPath(); g.arc(x, y, 3.2 * s, 0, Math.PI * 2); g.fill(); g.strokeStyle = INK; g.lineWidth = 1 * s; g.stroke(); }
  g.lineWidth = 3 * s; g.strokeStyle = INK; g.beginPath(); g.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); g.stroke();
  for (let i = 0; i < 10; i++) { const a = Math.PI + (i + .5) / 10 * Math.PI, x = cx + Math.cos(a) * (RX - TS * .8), y = cy + Math.sin(a) * (RY - TS * .6) - TS * 1.3; L(g, [[x, y + TS * .2], [x, y - TS * 1.6]], INK, 2.4 * s); S(g, [[x, y - TS * 1.55], [x + TS * .7, y - TS * 1.55], [x + TS * .7, y - TS * .7], [x + TS * .35, y - TS * .9], [x, y - TS * .7]], i % 2 ? ['#8a2a22', '#3a0d0a', '#c8584a'] : ['#b08a3a', '#3e2e10', '#f0d08a'], 1.6 * s); }
}
function awning(g, p, TS) {
  const s = TS / 48, x0 = p.x * TS, y0 = p.y * TS, W2 = p.w * TS, H2 = p.h * TS, cols = { red: ['#6b2a22', '#2a0e0a', '#a8584a'], cream: ['#9a8c74', '#3a332a', '#d8ccb0'], blue: ['#2e4260', '#0e1622', '#5f7ea8'], green: ['#3a5230', '#121c0e', '#6a8c58'] }[p.c];
  shadow(g, x0 + W2 / 2, y0 + H2, W2 * .55, TS * .3, .4);
  S(g, [[x0 + 6 * s, y0 + TS * 1.2], [x0 + W2 - 6 * s, y0 + TS * 1.2], [x0 + W2 - 6 * s, y0 + H2 - 4 * s], [x0 + 6 * s, y0 + H2 - 4 * s]], W8, 2 * s, { mass: .32, cuts: 3 });
  for (let i = 0; i < 5; i++) { const ix = x0 + 12 * s + i * (W2 - 24 * s) / 5; S(g, [[ix, y0 + TS * 1.15], [ix + TS * .5, y0 + TS * 1.15], [ix + TS * .5, y0 + TS * .85], [ix, y0 + TS * .85]], [['#b08a3a', '#3e2e10', '#f0d08a'], ['#4f7f48', '#1a2a18', '#8ab080'], ['#8a8e92', '#2a2c2e', '#d0d4d8'], ['#6a2a5a', '#240e20', '#a8689a']][i % 4], 1.4 * s); }
  for (let i = 0; i < 5; i++) S(g, [[x0 + i * W2 / 5, y0 + TS * .95], [x0 + i * W2 / 5 + 5 * s, y0], [x0 + (i + 1) * W2 / 5 + 5 * s, y0], [x0 + (i + 1) * W2 / 5, y0 + TS * .95], [x0 + (i + .5) * W2 / 5, y0 + TS * .82]], i % 2 ? cols : ['#9a8c7c', '#3a332c', '#d8ccb8'], 1.8 * s, { mass: .4 });
  L(g, [[x0 + 4 * s, y0 + TS * .9], [x0 + 4 * s, y0 + H2 - 4 * s]], INK, 3 * s); L(g, [[x0 + W2 - 4 * s, y0 + TS * .9], [x0 + W2 - 4 * s, y0 + H2 - 4 * s]], INK, 3 * s);
}
function fountain(g, p, TS) {
  const s = TS / 48, cx = (p.x + p.w / 2) * TS, cy = (p.y + p.h / 2) * TS, rx = p.w * TS * .5, ry = p.h * TS * .42;
  shadow(g, cx, cy + ry * .3, rx * 1.05, ry, .45);
  const ring = (r1, r2, dy) => Array.from({ length: 16 }, (_, i) => [cx + Math.cos(i / 16 * Math.PI * 2) * r1, cy + dy + Math.sin(i / 16 * Math.PI * 2) * r2]);
  S(g, ring(rx, ry, 0), STONE, 2.6 * s, { mass: .4, cuts: 6 }); P(g, ring(rx * .8, ry * .72, -3 * s), '#16303e', 2 * s);
  for (let i = 0; i < 5; i++) L(g, [[cx - rx * .5 + R() * rx, cy - ry * .2 + R() * ry * .4], [cx - rx * .4 + R() * rx, cy - ry * .2 + R() * ry * .4]], '#5f8aa0', 1.4 * s);
  S(g, [[cx - 7 * s, cy], [cx - 5 * s, cy - TS * 1.1], [cx + 5 * s, cy - TS * 1.1], [cx + 7 * s, cy]], STONE, 2 * s); S(g, ring(TS * .45, TS * .18, -TS * 1.1), STONE, 2 * s);
  for (const d of [-1, 1]) L(g, [[cx + d * 4 * s, cy - TS * 1.2], [cx + d * TS * .5, cy - TS * 1.45], [cx + d * TS * .75, cy - TS * .6]], '#7ab0c8', 2.4 * s);
}
function bridge(g, p, TS) {
  const s = TS / 48, x0 = p.x * TS, y0 = p.y * TS, w = p.w * TS, h = p.h * TS;
  S(g, [[x0, y0], [x0 + w, y0], [x0 + w, y0 + h], [x0, y0 + h]], ['#4a3e30', '#1e1810', '#7a6650'], 2.4 * s, { mass: .3, cuts: 8 });
  for (let i = 1; i < p.h; i++) L(g, [[x0, y0 + i * TS], [x0 + w, y0 + i * TS]], 'rgba(0,0,0,.5)', 1.4 * s);
  for (const xx of [x0 + 4 * s, x0 + w - 10 * s]) S(g, [[xx, y0 - TS * .3], [xx + 6 * s, y0 - TS * .3], [xx + 6 * s, y0 + h], [xx, y0 + h]], STONE2, 1.8 * s);
}
function dummy(g, p, TS, t) { if (CB_INK.scarecrow) CB_INK.scarecrow(g, p.x * TS + TS / 2, p.y * TS + TS * .92, TS / 48, t); }
function brazier(g, p, TS, t) { // the eternal flame: a stepped stone dais and a great iron bowl
  const s = TS / 48, cx = (p.x + p.w / 2) * TS, by = (p.y + p.h) * TS;
  shadow(g, cx, by - TS * .2, TS * 2.4, TS * .7, .5);
  for (let i = 0; i < 3; i++) { const w2 = TS * (2.2 - i * .45), y = by - TS * (.3 + i * .38); S(g, [[cx - w2, y - TS * .38], [cx + w2, y - TS * .38], [cx + w2, y], [cx - w2, y]], i % 2 ? STONE2 : STONE, 2.2 * s, { mass: .3, cuts: 3 }); }
  const top = by - TS * 1.45; S(g, [[cx - TS * .35, top], [cx + TS * .35, top], [cx + TS * .25, top - TS * .7], [cx - TS * .25, top - TS * .7]], ['#3a3632', '#141210', '#6a645a'], 2.2 * s);
  const bw = TS * 1.3, bt = top - TS * .7; S(g, [[cx - bw, bt - TS * .45], [cx + bw, bt - TS * .45], [cx + bw * .7, bt + TS * .1], [cx - bw * .7, bt + TS * .1]], ['#3a3230', '#120e0c', '#7a6a60'], 2.6 * s, { mass: .4 });
  for (let k = -2; k <= 2; k++) { const fx = cx + k * TS * .45, h = TS * (1.6 - Math.abs(k) * .35); P(g, [[fx - TS * .35, bt - TS * .4], [fx - TS * .2, bt - TS * .4 - h * .6], [fx, bt - TS * .4 - h], [fx + TS * .18, bt - TS * .4 - h * .55], [fx + TS * .35, bt - TS * .4]], '#d6542a', 1.8 * s); P(g, [[fx - TS * .18, bt - TS * .4], [fx, bt - TS * .4 - h * .62], [fx + TS * .18, bt - TS * .4]], '#ffc463'); }
}
function brazier(g, p, TS, t) { // the eternal flame: a stepped stone dais and a great iron bowl
  const s = TS / 48, cx = (p.x + p.w / 2) * TS, by = (p.y + p.h) * TS;
  shadow(g, cx, by - TS * .2, TS * 2.2, TS * .7, .5);
  for (let i = 0; i < 3; i++) { const w2 = TS * (1.9 - i * .4), y = by - TS * (.3 + i * .38); S(g, [[cx - w2, y - TS * .38], [cx + w2, y - TS * .38], [cx + w2, y], [cx - w2, y]], i % 2 ? STONE2 : STONE, 2.2 * s, { mass: .3, cuts: 3 }); }
  const top = by - TS * 1.45; S(g, [[cx - TS * .35, top], [cx + TS * .35, top], [cx + TS * .25, top - TS * .7], [cx - TS * .25, top - TS * .7]], ['#3a3632', '#141210', '#6a645a'], 2.2 * s);
  const bw = TS * 1.2, bt = top - TS * .7; S(g, [[cx - bw, bt - TS * .45], [cx + bw, bt - TS * .45], [cx + bw * .7, bt + TS * .1], [cx - bw * .7, bt + TS * .1]], ['#3a3230', '#120e0c', '#7a6a60'], 2.6 * s, { mass: .4 });
  for (let k = -2; k <= 2; k++) { const fx = cx + k * TS * .42, f = 1 + Math.sin(t / 110 + k * 1.7) * .1 + Math.sin(t / 43 + k) * .05, h = TS * (1.6 - Math.abs(k) * .35) * f, sw = Math.sin(t / 130 + k) * TS * .08;
    P(g, [[fx - TS * .33, bt - TS * .4], [fx - TS * .2, bt - TS * .4 - h * .6], [fx + sw, bt - TS * .4 - h], [fx + TS * .18, bt - TS * .4 - h * .55], [fx + TS * .33, bt - TS * .4]], '#d6542a', 1.8 * s); P(g, [[fx - TS * .17, bt - TS * .4], [fx + sw * .6, bt - TS * .4 - h * .62], [fx + TS * .17, bt - TS * .4]], '#ffc463'); }
}

    const DRAW = { brazier, bld, hall, keep, wallseg, tower, gatehouse, colosseum, awning, fountain, bridge };
    const STATIC = { bld: 1, hall: 1, keep: 1, tower: 1, gatehouse: 1, colosseum: 1, awning: 1, fountain: 1, bridge: 1 }, CACHE = new WeakMap();
    // static pieces are drawn once into their own canvas (per tile size and pixel ratio) and blitted after that
    function cached(g, p, TS, dpr) {
      let c = CACHE.get(p); if (c && c.TS === TS && c.dpr === dpr) { g.drawImage(c.cv, c.bx, c.by, c.bw, c.bh); return; }
      const big = p.kind === 'colosseum', py = big ? p.cy0 : p.y, ph = big ? p.ch : p.h, bx = (p.x - 2) * TS, by = (py - (big ? 4 : 6)) * TS, bw = (p.w + 4) * TS, bh = (ph + (big ? 7 : 8)) * TS;
      const cv = document.createElement('canvas'); cv.width = Math.ceil(bw * dpr); cv.height = Math.ceil(bh * dpr); const cg = cv.getContext('2d'); cg.setTransform(dpr, 0, 0, dpr, -bx * dpr, -by * dpr);
      seed = 7 + p.x * 131 + p.y * 977; DRAW[p.kind](cg, p, TS, 0);
      CACHE.set(p, c = { cv, TS, dpr, bx, by, bw, bh }); g.drawImage(cv, bx, by, bw, bh);
    }
    return { prop: (g, p, TS, t, dpr) => { if (!DRAW[p.kind]) return false; if (STATIC[p.kind]) cached(g, p, TS, dpr || 1); else { seed = 7 + p.x * 131 + p.y * 977; DRAW[p.kind](g, p, TS, t); } return true; } };
  })();
  // ---------- city runtime: ground chunks, lights, day and night (New York time), the minimap
  const CH = 12; // ground chunk size in tiles
  function groundChunk(ci, cj) {
    const key = ci + ',' + cj, TS = TOWN.TS, d = TOWN.dpr; let c = TOWN.chunks.get(key);
    if (c) { TOWN.chunks.delete(key); TOWN.chunks.set(key, c); return c; } // most recently used last
    const sub = []; for (let y = cj * CH - 1; y <= cj * CH + CH; y++) { const row = []; for (let x = ci * CH - 1; x <= ci * CH + CH; x++) row.push((ground[y] || [])[x] || 'g'); sub.push(row); }
    c = document.createElement('canvas'); c.width = CH * TS * d; c.height = CH * TS * d; const g = c.getContext('2d');
    if (window.CB_INK && CB_INK.ground) { const full = CB_INK.ground({ MW: CH + 2, MH: CH + 2, TS, dpr: d, ground: sub, seed: 77 + ci * 131 + cj * 7919 }); g.drawImage(full, TS * d, TS * d, CH * TS * d, CH * TS * d, 0, 0, CH * TS * d, CH * TS * d); }
    else { g.fillStyle = '#1c2117'; g.fillRect(0, 0, c.width, c.height); }
    TOWN.chunks.set(key, c); while (TOWN.chunks.size > 28) TOWN.chunks.delete(TOWN.chunks.keys().next().value);
    return c;
  }
  function drawGround(cam) {
    if (window.CB_TOWNART && CB_TOWNART.ground(gx, cam, TOWN, MW, MH, heroPos(), DIRS[P.dir])) return; // painted pixel-art ground (src/townart.js)
    const TS = TOWN.TS, d = TOWN.dpr, i0 = Math.floor(cam.x / (CH * TS)), j0 = Math.floor(cam.y / (CH * TS)), i1 = Math.floor((cam.x + TOWN.vw) / (CH * TS)), j1 = Math.floor((cam.y + TOWN.vh) / (CH * TS));
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) { if (i < 0 || j < 0 || i * CH >= MW || j * CH >= MH) continue; gx.drawImage(groundChunk(i, j), Math.round((i * CH * TS - cam.x) * d), Math.round((j * CH * TS - cam.y) * d)); }
    // warm up the next chunks in the direction you're heading, one per frame
    const [dx, dy] = DIRS[P.dir] || [0, 0]; const ni = Math.floor(((heroPos().x + dx * CH * .8) * TS) / (CH * TS)), nj = Math.floor(((heroPos().y + dy * CH * .8) * TS) / (CH * TS));
    if (ni >= 0 && nj >= 0 && ni * CH < MW && nj * CH < MH && !TOWN.chunks.has(ni + ',' + nj)) groundChunk(ni, nj);
  }
  const LIGHTS = (vx0, vy0, vx1, vy1) => {
    const L = [], inV = (x, y) => x > vx0 - 4 && x < vx1 + 4 && y > vy0 - 4 && y < vy1 + 4;
    for (const p of PROPS) { if (!inV(p.x, p.y) && !inV(p.x + p.w, p.y + p.h)) continue;
      if (p.kind === 'torch') L.push({ x: p.x + 0.5, y: p.y + 0.1, r: 3.2, c: '255,150,60' });
      else if (p.kind === 'brazier') L.push({ x: p.x + 1.5, y: p.y + .5, r: 8, c: '255,140,50' });
      else if (p.kind === 'fire') L.push({ x: p.x + 1, y: p.y + 0.4, r: 5.5, c: '255,140,50' });
      else if (p.kind === 'lectern') L.push({ x: p.x + 0.5, y: p.y + 0.1, r: 1.6, c: '255,200,120' });
      else if (p.kind === 'wagon') L.push({ x: p.x + 0.2, y: p.y + 0.4, r: 2.4, c: '255,170,80' });
      else if (p.kind === 'bld' || p.kind === 'hall') L.push({ x: p.x + p.w / 2, y: p.y + p.h + .2, r: Math.min(4.5, 1.6 + p.w * .3), c: '255,165,80' });
      else if (p.kind === 'awning') L.push({ x: p.x + p.w / 2, y: p.y + p.h, r: 2.6, c: '255,170,90' });
      else if (p.kind === 'tower') L.push({ x: p.x + 1.5, y: p.y + .6, r: 2, c: '255,160,80' });
      else if (p.kind === 'colosseum' && p.part === 'back') { for (const [dx, dy] of [[-6, 0], [0, -2], [6, 0], [0, 3], [-3, 3], [3, -3]]) L.push({ x: ARN.x + dx, y: ARN.y + dy, r: 6, c: '255,170,90' }); }
    }
    return L;
  };
  // day and night follow the time in New York: night 9pm-5am, dawn 5-7, day 7am-6pm, dusk 6-9
  const NY = (() => { try { return new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', hour: 'numeric', minute: 'numeric', hourCycle: 'h23' }); } catch (e) { return null; } })();
  let nightCache = { at: -1e12, v: 1 };
  function nightness(now) {
    if (now - nightCache.at < 20000) return nightCache.v;
    let h = 22; try { if (NY) { const parts = NY.formatToParts(new Date()); h = +parts.find(x => x.type === 'hour').value + +parts.find(x => x.type === 'minute').value / 60; } } catch (e) {}
    const v = h >= 21 || h < 5 ? 1 : h < 7 ? 1 - (h - 5) / 2 : h < 18 ? 0 : (h - 18) / 3;
    nightCache = { at: now, v }; return v;
  }
  // the minimap: the whole city at 2 px a tile, with you, the townspeople and everyone else on it (click it to walk there)
  const MINI = { cv: null, base: null, open: true, k: 2 };
  function miniBase() {
    const k = MINI.k, c = document.createElement('canvas'); c.width = MW * k; c.height = MH * k; const g = c.getContext('2d');
    const COL = { g: '#1d2418', p: '#3e3224', b: '#3b3833', a: '#5a4830', '~': '#1d3a4c' };
    for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) { g.fillStyle = COL[ground[y][x]] || '#1d2418'; g.fillRect(x * k, y * k, k, k); }
    const ROOF = { red: '#7a3a2c', slate: '#4a5566', thatch: '#8a7444', green: '#4a6644', gold: '#9a7a34' };
    for (const p of PROPS) { if (p.kind === 'tree') { g.fillStyle = '#14200f'; g.fillRect(p.x * k, p.y * k, k, k); continue; }
      const col = p.kind === 'bld' ? ROOF[p.roof] || '#6a4a3a' : p.kind === 'hall' ? ROOF[p.roof || 'slate'] : p.kind === 'keep' || p.kind === 'wallseg' || p.kind === 'tower' || p.kind === 'gatehouse' ? '#5a564f' : p.kind === 'awning' ? '#8a5a3a' : p.kind === 'fountain' ? '#3a6a80' : p.kind === 'brazier' ? '#e08a3a' : p.kind === 'bridge' ? '#6a5640' : null;
      if (col) { g.fillStyle = col; g.fillRect(p.x * k, p.y * k, p.w * k, p.h * k); } }
    g.strokeStyle = '#6a645a'; g.lineWidth = k * 3; g.beginPath(); g.ellipse(ARN.x * k, ARN.y * k, (ARN.RX - 1.5) * k, (ARN.RY - 1.5) * k, 0, 0, Math.PI * 2); g.stroke();
    return c;
  }
  function drawMini(t) {
    let cv2 = MINI.cv;
    if (!cv2) { cv2 = MINI.cv = document.createElement('canvas'); cv2.className = 'minimap'; cv2.title = 'Emberwatch: click to walk there'; $('townWrap').appendChild(cv2);
      const btn = document.createElement('button'); btn.className = 'minibtn'; btn.textContent = 'Map'; btn.title = 'Show or hide the city map'; $('townWrap').appendChild(btn); btn.onclick = () => { MINI.open = !MINI.open; cv2.hidden = !MINI.open; };
      cv2.addEventListener('click', (ev) => { const r = cv2.getBoundingClientRect(), tx = Math.floor((ev.clientX - r.left) / r.width * MW), ty = Math.floor((ev.clientY - r.top) / r.height * MH); if (townBusy()) return;
        let best = null; for (let rr = 0; rr < 6 && !best; rr++) for (let dy = -rr; dy <= rr && !best; dy++) for (let dx = -rr; dx <= rr; dx++) if (free(tx + dx, ty + dy)) { best = [tx + dx, ty + dy]; break; }
        if (best) { const path = bfs(best[0], best[1], false); if (path) { P.path = path; P.talkTo = null; P.target = { x: best[0], y: best[1] }; } } }); }
    if (!MINI.open) return;
    if (!MINI.base) MINI.base = miniBase();
    const W2 = Math.min(240, Math.max(150, TOWN.vw * .2)), H2 = W2 * MH / MW, d = TOWN.dpr;
    if (cv2.width !== Math.round(W2 * d)) { cv2.width = Math.round(W2 * d); cv2.height = Math.round(H2 * d); cv2.style.width = W2 + 'px'; cv2.style.height = H2 + 'px'; }
    const g = cv2.getContext('2d'), sx = cv2.width / MW, sy = cv2.height / MH; g.imageSmoothingEnabled = false;
    g.drawImage((window.CB_TOWNART && CB_TOWNART.mini()) || MINI.base, 0, 0, cv2.width, cv2.height);
    g.fillStyle = `rgba(6,5,12,${0.35 * nightness(t)})`; g.fillRect(0, 0, cv2.width, cv2.height);
    const cam = camera(); g.strokeStyle = 'rgba(228,194,122,.8)'; g.lineWidth = d; g.strokeRect(cam.x / TOWN.TS * sx, cam.y / TOWN.TS * sy, TOWN.vw / TOWN.TS * sx, TOWN.vh / TOWN.TS * sy);
    for (const n of NPCS) { g.fillStyle = '#d6a14a'; g.fillRect(n.x * sx - d, n.y * sy - d, 3 * d, 3 * d); }
    if (typeof SOC !== 'undefined') for (const o of SOC.others.values()) { const q = otherPos(o); g.fillStyle = CC[o.cls] || '#ede3d0'; g.fillRect(q.x * sx - d, q.y * sy - d, 3 * d, 3 * d); }
    const hp = heroPos(), bl = (Math.floor(t / 400) % 2) ? '#ffffff' : '#e4c27a'; g.fillStyle = bl; g.beginPath(); g.arc((hp.x + .5) * sx, (hp.y + .5) * sy, 3 * d, 0, Math.PI * 2); g.fill(); g.strokeStyle = '#0b0a07'; g.lineWidth = d; g.stroke();
  }
