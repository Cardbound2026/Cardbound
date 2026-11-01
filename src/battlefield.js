// ---------- Battlefield (Nov 1): the fight as a scene. A painted road receding to a ruined gate, heroes on the left diagonal
// facing right, enemies on the right diagonal facing left, nameplates on the outside and intents above them.
// The scenery painter below is the PAPERFORGE v0.5 "Hollow March" battlefield (by the design tester), with a per-map tint added.
// TO REMOVE IT: delete this file; the fight falls back to the old side-by-side stage.
(function () {
'use strict';
const themes=[
 {sky:'#101e24',mist:'#456367',stone:'#293b3b',edge:'#62726a',moss:'#37483c',glow:'#d4a363',moon:'#b4c7b7',accent:'#859f94'},
 {sky:'#182226',mist:'#4f6563',stone:'#343f3b',edge:'#6a7666',moss:'#46503a',glow:'#d7ae69',moon:'#c3cab2',accent:'#a4aa7a'},
 {sky:'#1a202a',mist:'#555467',stone:'#353642',edge:'#6a6772',moss:'#3d4144',glow:'#c5a47b',moon:'#c7c2d0',accent:'#9e96af'},
 {sky:'#241c22',mist:'#715653',stone:'#44373a',edge:'#7c685d',moss:'#48413b',glow:'#e0a46d',moon:'#d2b6a1',accent:'#b99d80'},
 {sky:'#151b23',mist:'#4c5b68',stone:'#333c47',edge:'#69757e',moss:'#3b4346',glow:'#e2bc83',moon:'#d6d5c1',accent:'#afb8ad'}
];
function random(seed){let n=seed>>>0;return ()=>((n=(Math.imul(n,1664525)+1013904223)>>>0)/4294967296);}
function poly(c,points,fill,stroke=null,lw=1){c.beginPath();points.forEach((p,i)=>i?c.lineTo(p[0],p[1]):c.moveTo(p[0],p[1]));c.closePath();if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=lw;c.stroke();}}
function line(c,p,color,width=1){c.beginPath();p.forEach((pt,i)=>i?c.lineTo(pt[0],pt[1]):c.moveTo(pt[0],pt[1]));c.strokeStyle=color;c.lineWidth=width;c.stroke();}
function ellipse(c,x,y,rx,ry,color){c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fillStyle=color;c.fill();}
function glow(c,x,y,r,color,alpha=.25,sy=1){c.save();c.translate(x,y);c.scale(1,sy);let g=c.createRadialGradient(0,0,0,0,0,r);g.addColorStop(0,color);g.addColorStop(.25,color);g.addColorStop(1,'transparent');c.globalAlpha=alpha;c.fillStyle=g;c.fillRect(-r,-r,2*r,2*r);c.restore();}
function archPath(c,x,y,w,h){c.beginPath();c.moveTo(x-w/2,y);c.lineTo(x-w/2,y-h*.53);c.bezierCurveTo(x-w*.48,y-h*.79,x-w*.16,y-h*.9,x,y-h);c.bezierCurveTo(x+w*.16,y-h*.9,x+w*.48,y-h*.79,x+w/2,y-h*.53);c.lineTo(x+w/2,y);}
function pointedArch(c,x,y,w,h,thick,p,damaged=false){
 c.save();archPath(c,x,y,w,h);c.lineWidth=thick;c.lineJoin='miter';c.strokeStyle=p.stone;c.stroke();
 archPath(c,x-1,y,w+thick*.24,h+thick*.13);c.lineWidth=1.3;c.strokeStyle=p.edge;c.globalAlpha=.65;c.stroke();c.globalAlpha=1;
 // Thin ashlar cuts describe the arch without a tiled floor.
 for(let side=-1;side<=1;side+=2){for(let i=0;i<6;i++){const yy=y-i*h*.087;line(c,[[x+side*(w/2-thick*.43),yy],[x+side*(w/2+thick*.45),yy-1]],'#111d22',1.4);} }
 if(damaged){poly(c,[[x+w*.19,y-h*.93],[x+w*.34,y-h*.86],[x+w*.38,y-h*.74],[x+w*.31,y-h*.76],[x+w*.24,y-h*.88]],p.mist);}
 c.restore();
}
function spire(c,x,y,w,h,p,r,broken=false){
 c.save();const top=y-h;
 let points=[[x-w/2,y],[x-w*.53,top+h*.3],[x-w*.34,top+h*.3],[x-w*.34,top+h*.13],[x-w*.14,top+h*.13],[x,top],[x+w*.14,top+h*.13],[x+w*.34,top+h*.13],[x+w*.34,top+h*.3],[x+w*.53,top+h*.3],[x+w/2,y]];
 if(broken)points=[[x-w/2,y],[x-w*.54,top+h*.45],[x-w*.3,top+h*.45],[x-w*.22,top+h*.28],[x-w*.02,top+h*.35],[x+w*.13,top+h*.25],[x+w*.26,top+h*.48],[x+w*.53,top+h*.43],[x+w/2,y]];
 poly(c,points,p.stone);poly(c,[[x+w*.03,y],[x+w*.03,top+h*.25],[x+w*.18,top+h*.31],[x+w*.42,top+h*.31],[x+w*.47,y]],'#16272b');
 line(c,[[x-w*.46,y],[x-w*.49,top+h*.33],[x-w*.31,top+h*.33]],p.edge,1.5);
 archPath(c,x,top+h*.7,w*.36,h*.29);c.fillStyle='#102024';c.fill();c.strokeStyle=p.edge;c.lineWidth=1;c.stroke();
 line(c,[[x,top+h*.7],[x,top+h*.48]],p.stone,2);
 for(let i=0;i<10;i++){let yy=top+h*(.43+r()*.57);line(c,[[x-w*.41,yy],[x-w*(.15+r()*.1),yy-1]],'#15282b',1);}
 c.restore();
}
function tree(c,x,y,h,r,alpha=1){
 c.save();c.globalAlpha=alpha;const w=h*.065,lean=(r()-.5)*h*.11;
 poly(c,[[x-w,y],[x-w*.58,y-h*.4],[x+lean-w*.3,y-h*.78],[x+lean+w*.2,y-h],[x+lean+w*.45,y-h*.55],[x+w*.6,y-h*.21],[x+w,y]],'#0c1b20');
 for(let i=0;i<8;i++){const a=.23+i*.087,side=i%2?1:-1,bx=x+lean*a,by=y-h*a,reach=h*(.1+r()*.14),up=h*(.11+r()*.18);
 poly(c,[[bx,by],[bx+side*reach*.55,by-up*.44],[bx+side*reach,by-up],[bx+side*reach*.66,by-up*.39],[bx+w*.1,by+h*.035]],'#0d1d23');
 line(c,[[bx+side*reach*.55,by-up*.44],[bx+side*reach*.4,by-up*.86]],'#102128',1.5);
 }
 c.restore();
}
function rubble(c,x,y,s,p,r){
 poly(c,[[x-s,y],[x-s*.55,y-s*.62],[x+s*.35,y-s*.68],[x+s,y-s*.2],[x+s*.7,y+s*.12]],p.stone,'#142224',.8);
 poly(c,[[x-s*.55,y-s*.62],[x+s*.35,y-s*.68],[x+s*.72,y-s*.31],[x-s*.12,y-s*.27]],p.edge);
 line(c,[[x-s*.12,y-s*.27],[x-s*.18,y+s*.04]],'#182729',1);
}
function lantern(c,x,y,s,p){
 glow(c,x,y-s*1.65,s*8,p.glow,.12,.8);glow(c,x,y-s*1.65,s*3.2,p.glow,.3);
 poly(c,[[x-s*.3,y],[x-s*.25,y-s],[x-s*.65,y-s*1.18],[x-s*.55,y-s*2.12],[x+s*.55,y-s*2.12],[x+s*.65,y-s*1.18],[x+s*.25,y-s],[x+s*.3,y]],'#111b1c');
 poly(c,[[x-s*.3,y-s*1.25],[x-s*.29,y-s*1.98],[x+s*.29,y-s*1.98],[x+s*.31,y-s*1.27]],p.glow);
 line(c,[[x,y-s*1.2],[x,y-s*2]],'#66513a',s*.09);
 ellipse(c,x,y-s*1.62,s*.09,s*.24,'#f2d7a5');
 line(c,[[x-s*.7,y-s*2.13],[x,y-s*2.48],[x+s*.7,y-s*2.13]],'#172123',s*.13);
 line(c,[[x,y-s*2.49],[x,y-s*2.7]],p.edge,1);
}
function draw(canvas,options={}){
 const width=Math.max(320,options.width||canvas.clientWidth||1440),height=Math.max(220,options.height||canvas.clientHeight||450),dpr=Math.min(2,Math.max(1,options.dpr||1.5)),chapter=Math.max(0,Math.min(4,Math.floor(options.chapter||0))),tint=options.tint;
 canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);const c=canvas.getContext('2d');c.setTransform(dpr,0,0,dpr,0,0);
 const p=themes[chapter],r=random(73061+chapter*4057),W=width,H=height;
 let g=c.createLinearGradient(0,0,0,H);g.addColorStop(0,p.sky);g.addColorStop(.36,p.mist);g.addColorStop(.61,'#263937');g.addColorStop(1,'#142523');c.fillStyle=g;c.fillRect(0,0,W,H);
 // The moon and its halo sit on the vanishing point, beyond the ruined passage.
 const mx=W*.5,my=H*.055,mr=H*.115;glow(c,mx,my,mr*3.8,p.moon,.11);
 ellipse(c,mx,my,mr,mr,p.moon);ellipse(c,mx+mr*.22,my-mr*.16,mr*.81,mr*.82,p.moon);
 c.save();c.globalAlpha=.1;for(let i=0;i<15;i++){const a=r()*Math.PI*2,rr=r()*mr*.8;ellipse(c,mx+Math.cos(a)*rr,my+Math.sin(a)*rr,mr*(.04+r()*.14),mr*(.03+r()*.08),p.mist);}c.restore();
 // Three silhouette depths keep the scenery soft behind the actor lines.
 for(let layer=0;layer<3;layer++){
  const y=H*(.27+layer*.035),pts=[[0,H*.48]],step=W/22;
  for(let i=0;i<=22;i++)pts.push([i*step,y-H*(.045+r()*.07)]);pts.push([W,H*.48]);
  poly(c,pts,layer===0?'#2e4449':layer===1?'#273e40':'#253838');
  c.save();c.globalAlpha=.25+layer*.11;
  for(let i=0;i<19;i++){const x=r()*W;if(Math.abs(x-W*.5)<W*.12)continue;tree(c,x,y+H*.07,H*(.18+r()*.2),r,.7);}
  c.restore();
 }
 // Distant abbey: a bright open doorway, broken wings and slender spires.
 const gateY=H*.305,gateX=W*.5,gateW=H*.20,gateH=H*.27;
 glow(c,gateX,gateY-H*.05,H*.21,p.moon,.18,.8);
 const rear={...p,stone:'#263b3d',edge:'#667c75'};
 pointedArch(c,gateX,gateY,gateW,gateH,H*.026,rear);
 pointedArch(c,gateX,gateY,gateW+H*.055,gateH+H*.035,H*.019,rear,true);
 for(let side=-1;side<=1;side+=2){
  const sx=gateX+side*H*.175;
  spire(c,sx,gateY,H*.055,H*.37,rear,r,side>0);
  poly(c,[[sx+side*H*.03,gateY],[sx+side*H*.03,gateY-H*.15],[sx+side*H*.085,gateY-H*.17],[sx+side*H*.11,gateY-H*.12],[sx+side*H*.19,gateY-H*.13],[sx+side*H*.21,gateY]],rear.stone);
  for(let i=0;i<2;i++)pointedArch(c,sx+side*H*(.08+i*.085),gateY-H*.015,H*.048,H*.12,H*.011,rear,i===1);
 }
 // Fog veils the architectural foundations, with broad painted bands.
 for(let i=0;i<7;i++){const y=H*(.26+i*.022),gg=c.createLinearGradient(0,y-H*.02,0,y+H*.027);gg.addColorStop(0,'transparent');gg.addColorStop(.5,p.mist);gg.addColorStop(1,'transparent');c.save();c.globalAlpha=.055+i*.008;c.fillStyle=gg;c.fillRect(0,y-H*.02,W,H*.05);c.restore();}
 // The center road recedes between two worn raised banks; no grid or tiles.
 const ground=c.createLinearGradient(0,H*.27,0,H);ground.addColorStop(0,'#2c4240');ground.addColorStop(.45,'#233a32');ground.addColorStop(1,'#162a26');c.fillStyle=ground;c.fillRect(0,H*.32,W,H*.68);
 let road=c.createLinearGradient(0,H*.29,0,H);road.addColorStop(0,'#4a5d55');road.addColorStop(.36,'#3c4c43');road.addColorStop(1,'#24342c');
 poly(c,[[W*.453,H*.29],[W*.548,H*.29],[W*.656,H],[W*.344,H]],road);
 const left=[[W*.056,H],[W*.277,H*.31],[W*.448,H*.29],[W*.435,H*.36],[W*.349,H]];
 const right=left.map(([x,y])=>[W-x,y]).reverse();
 let bank=c.createLinearGradient(0,H*.3,0,H);bank.addColorStop(0,'#354a3f');bank.addColorStop(.6,p.moss);bank.addColorStop(1,'#293b2b');
 poly(c,left,bank);poly(c,right,bank);
 // Uneven moss wash, flattened brush daubs and exposed stone beneath the turf.
 for(let side=-1;side<=1;side+=2){
  c.save();poly(c,side<0?left:right,null);c.clip();
  for(let i=0;i<95;i++){
   const t=r(),y=H*(.3+t*.7),x=W*(.5+side*(.1+r()*.34));
   c.globalAlpha=.018+r()*.026;ellipse(c,x,y,(9+r()*43)*(.3+t),(2+r()*7)*(.3+t),i%3===0?'#aab78c':i%3===1?'#0a1f1c':'#8c9a72');
  }
  c.globalAlpha=.22;
  for(let i=0;i<12;i++){
   const t=.1+r()*.87,y=H*(.32+t*.68),x=W*(.5+side*(.08+t*.12+r()*.13)),sz=(3+r()*8)*(.4+t);
   poly(c,[[x-sz*2,y],[x-sz,y-sz*.3],[x+sz,y-sz*.4],[x+sz*2.5,y],[x+sz*.5,y+sz*.3]],p.edge);
   line(c,[[x-sz*2,y+1],[x+sz*.5,y+sz*.3+1],[x+sz*2.5,y+1]],'#112320',.8);
  }
  c.restore();
 }

 // Broken, irregular edges give the ground a natural field shape.
 for(let side=-1;side<=1;side+=2){
  const inner=[];for(let i=0;i<=23;i++){const t=i/23,y=H*(.31+t*.69),x=W*(.5+side*(.047+t*.105))+(r()-.5)*W*.006*t;inner.push([x,y]);}
  line(c,inner,'#6b7554',1.2);line(c,inner.map(([x,y])=>[x+side*4,y+3]),'#162721',2.7);
  c.save();c.globalAlpha=.17;line(c,inner.map(([x,y])=>[x-side*8,y+1]),p.moon,2);c.restore();
 }
 // Road texture: long, shallow scars with perspective-scaled grit.
 c.save();
 for(let i=0;i<450;i++){
  const t=Math.sqrt(r()),y=H*(.32+t*.68),half=W*(.045+t*.11),x=W*.5+(r()-.5)*half*2;
  c.globalAlpha=.045+r()*.12;c.fillStyle=r()>.64?p.edge:'#0d221d';
  c.fillRect(x,y,(1+r()*8)*(.3+t),(r()*.7+.3)*(.3+t));
 }
 c.restore();
 // Weathering across the banks avoids the exact character foot positions.
 const anchors=[[.20,.82],[.257,.67],[.314,.52],[.371,.37],[.80,.82],[.743,.67],[.686,.52],[.629,.37]];
 function nearActor(x,y){return anchors.some(([ax,ay])=>Math.hypot((x/W-ax)*1.5,(y/H-ay))<.072);}
 for(let i=0;i<215;i++){
  const side=i%2?-1:1,t=.07+r()*.92,y=H*(.32+t*.68),inner=.047+t*.105,outer=.22+t*.22,x=W*(.5+side*(inner+(outer-inner)*r()));
  if(nearActor(x,y))continue;
  const scale=.25+t;
  if(i%5===0){c.save();c.globalAlpha=.28;line(c,[[x,y],[x+9*scale,y-3*scale],[x+17*scale,y],[x+26*scale,y-2*scale]],'#0e2420',.8);c.restore();}
  else{
   c.save();c.globalAlpha=.17+r()*.17;
   for(let j=0;j<3;j++)line(c,[[x+(j-1)*2*scale,y],[x+(j-1)*4*scale,y-(2+r()*5)*scale]],j===1?p.edge:'#71815a',.65);
   c.restore();
  }
 }
 // Quiet grave markers at the outer boundaries, farther than the party.
 for(let side=-1;side<=1;side+=2){
  for(let i=0;i<4;i++){
   const x=W*(.5+side*(.34+i*.035)),y=H*(.4+i*.09),s=H*(.022+i*.007);
   c.save();c.globalAlpha=.46;
   poly(c,[[x-s*.45,y],[x-s*.48,y-s*1.55],[x-s*.25,y-s*1.8],[x+s*.3,y-s*1.82],[x+s*.5,y-s*1.55],[x+s*.45,y]],p.stone,'#172a29',1);
   line(c,[[x-s*.24,y-s*1.45],[x+s*.25,y-s*1.45]],p.edge,.8);line(c,[[x,y-s*1.55],[x,y-s*.7]],p.edge,.8);c.restore();
  }
 }
 // Large ruined outer masonry frames the scene, leaving the party lines open.
 for(let side=-1;side<=1;side+=2){
  const x=W*(side<0?.015:.985),y=H*.82;
  c.save();c.globalAlpha=.87;
  poly(c,[[x-side*H*.11,y+H*.2],[x-side*H*.09,y-H*.7],[x+side*H*.006,y-H*.73],[x+side*H*.027,y-H*.59],[x+side*H*.08,y-H*.6],[x+side*H*.11,y+H*.2]],'#17292c');
  line(c,[[x-side*H*.1,y-H*.69],[x-side*H*.075,y+H*.05]],'#465754',1.5);
  for(let i=0;i<8;i++)line(c,[[x-side*H*.1,y-H*(.62-i*.095)],[x+side*H*.04,y-H*(.62-i*.095)]],'#0e2025',2);
  const limbX=x-side*H*.07;tree(c,limbX,H*1.1,H*1.2,r,.65);c.restore();
  for(let i=0;i<7;i++)rubble(c,W*(side<0?.065:.935)+(r()-.5)*W*.08,H*(.75+r()*.23),H*(.009+r()*.015),p,r);
 }
 // Twin warm lights on the central road act as subtle perspective markers.
 lantern(c,W*.445,H*.45,H*.018,p);lantern(c,W*.555,H*.45,H*.018,p);
 lantern(c,W*.353,H*.965,H*.032,p);lantern(c,W*.647,H*.965,H*.032,p);
 // Thin mist crossing the field, kept behind the characters by the caller.
 for(let i=0;i<5;i++){
  const x=W*(.13+i*.18),y=H*(.54+(i%3)*.13);glow(c,x,y,W*.24,p.mist,.055,.045);
 }
 // Hand-printed grain and a vignette, no screen-space grid.
 c.save();c.globalAlpha=.028;c.fillStyle='#d7d6ae';for(let i=0;i<2200;i++)c.fillRect(r()*W,r()*H,1+r()*1.3,.6);c.restore();
 let vign=c.createRadialGradient(W*.5,H*.46,H*.12,W*.5,H*.46,W*.57);vign.addColorStop(0,'transparent');vign.addColorStop(.47,'#0814170c');vign.addColorStop(1,'#061015b3');c.fillStyle=vign;c.fillRect(0,0,W,H);
 let bottom=c.createLinearGradient(0,H*.8,0,H);bottom.addColorStop(0,'transparent');bottom.addColorStop(1,'#0c181a77');c.fillStyle=bottom;c.fillRect(0,H*.8,W,H*.2);
 if(tint){c.save();c.globalCompositeOperation='color';c.globalAlpha=tint[1];c.fillStyle=tint[0];c.fillRect(0,0,W,H);c.restore();}
 return {width,height,chapter,dpr};
}

// which painting and tint each map uses
const MAPLOOK = { physical: [0, null], fire: [3, ['#b2502a', .32]], frost: [4, ['#5b86a8', .3]], nature: [1, ['#5f8a3c', .22]], arcane: [2, ['#7a4fb0', .3]], shadow: [2, ['#4a3a5a', .35]] };
const BF = { on: true, key: '', w: 0, h: 0 };
function sceneFor(stage, map) {
  let cv = stage.querySelector('#bfScene'); if (!cv) { cv = document.createElement('canvas'); cv.id = 'bfScene'; cv.setAttribute('aria-hidden', 'true'); stage.prepend(cv); }
  const w = stage.clientWidth, h = stage.clientHeight, key = map + ':' + w + 'x' + h;
  if (key !== BF.key && w > 50 && h > 50) { const L = MAPLOOK[map] || MAPLOOK.physical; draw(cv, { width: w, height: h, chapter: L[0], tint: L[1], dpr: Math.min(window.devicePixelRatio || 1, 1.75) }); BF.key = key; }
  return [w, h];
}
// diagonal slots, front (low, big) to back (high, small); the right side mirrors the left
const XS = [.20, .257, .314, .371], YS = [.80, .665, .53, .40];
const lerp = (arr, j) => { const a = Math.max(0, Math.min(arr.length - 1, Math.floor(j))), b = Math.min(arr.length - 1, a + 1); return arr[a] + (arr[b] - arr[a]) * (j - a); };
function slots(n, enemy) {
  // up to 4 on one diagonal; more go on two parallel diagonals (front line nearer the road)
  if (n <= 4) { const idx = enemy ? [[1.4], [2.4, .6], [2.9, 1.5, .1], [3, 2, 1, 0]][n - 1] : [0, 1, 2, 3].slice(0, n); return idx.map(j => ({ x: lerp(XS, j), y: lerp(YS, j), d: j, k: 1 })); }
  const per = Math.ceil(n / 2), out = [];
  for (let i = 0; i < n; i++) { const row = i % 2, col = Math.floor(i / 2), j = per > 1 ? (enemy ? 3 - col * 3 / (per - 1) : col * 3 / (per - 1)) : 1.5; out.push({ x: lerp(XS, j) + (row ? .075 : -.01), y: lerp(YS, j) + (row ? .05 : 0), d: j - row * .4, k: n > 6 ? .62 : .78 }); }
  return out;
}
function layout(cb, opts) {
  const stage = document.querySelector('#scrCombat .stage'); if (!stage || !BF.on) return;
  const map = (opts && opts.map) || 'physical';
  document.getElementById('scrCombat').classList.add('bf');
  const [W, H] = sceneFor(stage, map); if (!W) return;
  const base = Math.min(170, Math.max(90, H * .27)), plateW = W < 820 ? 118 : 150;
  stage.classList.toggle('narrow', W < 820);
  const place = (sel, enemy) => {
    const units = [...document.querySelectorAll(sel + ' > .unit')], S = slots(units.length, enemy);
    // push the diagonal inward when the field is narrow, so the outer nameplates stay on screen
    const minX = (plateW + base * .36 + 26) / W, shift = Math.max(0, minX - Math.min(...S.map(t => t.x)));
    units.forEach((el, i) => {
      const s = S[i], sx = s.x + shift * (1 - (s.x - XS[0]) * 1.2), x = enemy ? 1 - sx : sx, size = Math.round(base * (1 - s.d * .055) * s.k * (el.dataset.boss ? 1.22 : 1));
      el.style.left = Math.round(x * W) + 'px'; el.style.top = Math.round(s.y * H) + 'px';
      el.style.setProperty('--fh', size + 'px'); el.style.setProperty('--plate', Math.round(size * .36 + 8) + 'px'); el.style.zIndex = String(20 + Math.round((4 - s.d) * 4));
    });
  };
  place('#playerSlot', false); place('#foes', true);
  for (const el of stage.querySelectorAll('.unit')) { const pl = el.querySelector('.uplate'); if (pl) el.style.setProperty('--ih', (pl.offsetHeight + 6) + 'px'); }
  watch(() => layout(cb, opts));
}
let ro = null;
let again = null;
function watch(rerender) {
  again = rerender; const stage = document.querySelector('#scrCombat .stage'); if (!stage || ro || !window.ResizeObserver) return;
  let t = null; ro = new ResizeObserver(() => { clearTimeout(t); t = setTimeout(() => { if (again && !document.getElementById('scrCombat').hidden) again(); }, 60); }); ro.observe(stage);
}
const css = document.createElement('style'); css.id = 'bf-css';
css.textContent = `
#scrCombat.bf .stage { position: relative; display: block; height: auto; min-height: 300px; padding: 0; border: 0; border-radius: 8px; overflow: hidden; isolation: isolate; }
#scrCombat.bf .field-panel { grid-template-rows: minmax(300px, 1fr) auto; padding: 0 0 8px; row-gap: 0; }
#scrCombat.bf .field-panel > .stage { grid-row: 1; grid-column: 1; }
#scrCombat.bf .field-panel > .hud { grid-row: 1; grid-column: 1; align-self: end; z-index: 45; margin: 0; padding: 8px 14px; background: linear-gradient(180deg, #0c141300, #0c1413d9 40%, #0c1413f2); border-radius: 0 0 8px 8px; }
#scrCombat.bf .field-panel > .hint { grid-row: 1; grid-column: 1; align-self: end; justify-self: center; z-index: 46; margin: 0 0 72px; padding: 5px 14px; background: #0e1716e6; border: 1px solid #3b4337; border-radius: 4px; color: #cfd6c4; font-size: 12px; min-height: 0; max-width: 70%; text-align: center; }
#scrCombat.bf .field-panel > .hint:empty { display: none; }
#scrCombat.bf .field-panel > .hand { grid-row: 2; margin: -6px 12px 0; padding-top: 10px; }
#scrCombat.bf .hand .cf { --cw: min(185px, max(130px, calc((100vh - 660px) / 1.4))); }
#scrCombat.bf { grid-template-columns: minmax(0, 1fr) var(--ledgerW, 290px); }
#scrCombat.bf.withchat { grid-template-columns: var(--chatW, 220px) minmax(0, 1fr) var(--ledgerW, 290px); }
@media (max-width: 1180px) { #scrCombat.bf.withchat { grid-template-columns: minmax(0, 1fr) var(--ledgerW, 280px); } }
#scrCombat.bf .field-panel > .hud .mana .orb { width: 46px; height: 46px; font-size: 20px; }
#scrCombat.bf .stage.narrow .uplate { width: 118px; } #scrCombat.bf .stage.narrow .uplate .uname b { font-size: 13px; }
#scrCombat.bf .order .otile .ofig, #scrCombat.bf .order .otile .ofig svg, #scrCombat.bf .order .otile .ofig .inkfig { height: 40px; }
#scrCombat.bf .order .otile { padding: 3px 3px 4px; } #scrCombat.bf .order .otile .onm { font-size: 11px; }
#scrCombat.bf .order .lbl { color: #b4bda6; }
@media (min-width: 900px) and (min-height: 560px) { #scrCombat.bf .field-panel { height: calc(100vh - var(--fpTop, 84px) - 12px); min-height: 0; } #scrCombat.bf .stage { height: auto; } }
#bfScene { position: absolute; inset: 0; width: 100%; height: 100%; z-index: 0; pointer-events: none; }
#scrCombat.bf .order { position: absolute; top: 10px; left: 12px; right: 12px; z-index: 40; pointer-events: auto; }
#scrCombat.bf .order .otile { background: linear-gradient(#141c1bdd, #0d1312dd); }
#scrCombat.bf .vs { display: none; }
#scrCombat.bf #playerSlot, #scrCombat.bf #foes { position: absolute; inset: 0; display: block; pointer-events: none; z-index: 2; }
#scrCombat.bf .stage .unit { position: absolute; width: 1px; height: 1px; padding: 0; border: 0; background: none; display: block; overflow: visible; pointer-events: none; box-shadow: none; }
#scrCombat.bf .stage .unit::before { content: ''; position: absolute; left: calc(var(--fh) * -.32); top: calc(var(--fh) * -.06); width: calc(var(--fh) * .64); height: calc(var(--fh) * .13); border-radius: 50%; border: 1px solid #a7b98d44; background: #08120e66; box-shadow: 0 3px 7px #03080544; z-index: -1; }
#scrCombat.bf .stage #foes .unit::before { border-color: #c29c8138; }
#scrCombat.bf .stage .unit.active::before { border-color: #d6a14a; box-shadow: 0 0 16px #d6a14a66; background: #d6a14a1c; }
#scrCombat.bf .stage .unit.targetable::before, #scrCombat.bf .stage .unit.droptgt::before { border-color: #d7c67c; box-shadow: 0 0 14px #ecd17166; }
#scrCombat.bf .stage .unit.dropover::before, #scrCombat.bf .stage .unit.targetable:hover::before { border-color: #ffe2a1; background: #e0c97e2a; box-shadow: 0 0 0 5px #dbc78c18, 0 0 24px #dfbc5d55; }
#scrCombat.bf .stage .unit.dropover, #scrCombat.bf .stage .unit.targetable, #scrCombat.bf .stage .unit.targetable:hover { background: none; box-shadow: none; }
#scrCombat.bf .stage .unit .figure { position: absolute; left: 0; bottom: calc(var(--fh) * -.02); transform: translateX(-50%); height: auto; min-height: 0; overflow: visible; pointer-events: auto; }
#scrCombat.bf .stage .unit .figure .inkfig { height: calc(var(--fh) * var(--s, 1)); max-width: none; }
#scrCombat.bf .stage .unit .figure svg { height: var(--fh); width: auto; max-width: none; }
#scrCombat.bf .stage .unit.targetable .figure, #scrCombat.bf .stage .unit.targetable .uplate { cursor: crosshair; }
#scrCombat.bf .stage .uplate { position: absolute; bottom: 0; width: 150px; pointer-events: auto; padding: 6px 9px 6px 8px; color: #dce1ce; display: grid; gap: 3px; }
#scrCombat.bf .stage #playerSlot .uplate { right: var(--plate); background: linear-gradient(90deg, #0f1c17e8, #0e1916b5 86%, #0e191600); border-left: 2px solid var(--uc, #b79b6b); border-radius: 3px 0 0 3px; }
#scrCombat.bf .stage #foes .uplate { left: var(--plate); background: linear-gradient(270deg, #0f1c17ed, #0e1916af 86%, #0e191600); border-right: 2px solid #ad7a5c; border-radius: 0 3px 3px 0; padding-left: 12px; }
#scrCombat.bf .stage .uplate .uname { display: grid; gap: 1px; }
#scrCombat.bf .stage .uplate .uname b { font: 15px var(--f-display, Georgia); letter-spacing: .3px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
#scrCombat.bf .stage .uplate .uname small { font-size: 9px; letter-spacing: 1.1px; text-transform: uppercase; color: #8f9f8e; white-space: normal; line-height: 1.25; }
#scrCombat.bf .stage .uplate .bar { height: 12px; border-radius: 2px; background: #0b100e; border: 1px solid #00000088; box-shadow: none; }
#scrCombat.bf .stage #playerSlot .uplate .bar i { background: linear-gradient(90deg, #6a8b66, #a0b786); }
#scrCombat.bf .stage #foes .uplate .bar i { background: linear-gradient(90deg, #874f46, #ba7a59); }
#scrCombat.bf .stage .uplate .bar span { font-size: 10px; line-height: 10px; }
#scrCombat.bf .stage .uplate .tags { min-height: 0; gap: 3px; } #scrCombat.bf .stage .uplate .tag { font-size: 10px; padding: 0 4px; line-height: 15px; }
#scrCombat.bf .stage .uintent { position: absolute; left: var(--plate); bottom: var(--ih, 92px); display: grid; justify-items: start; gap: 3px; pointer-events: auto; }
#scrCombat.bf .stage .uintent .intents { min-height: 0; } #scrCombat.bf .stage .uintent .intent { box-shadow: 0 3px 10px #0006; }
#scrCombat.bf .stage .uplate { grid-template-columns: minmax(0, 1fr) auto; column-gap: 5px; }
#scrCombat.bf .stage .uplate .uname, #scrCombat.bf .stage .uplate .tags { grid-column: 1 / -1; }
#scrCombat.bf .stage .uplate .bar { grid-column: 1; align-self: center; }
#scrCombat.bf .stage #playerSlot .uplate .bar { grid-column: 1 / -1; }
#scrCombat.bf .stage .uplate .deckbtn .dlong { display: none; } #scrCombat.bf .stage .uplate .deckbtn .dshort { display: inline; }
#scrCombat.bf .stage.tight .uplate .tags:empty { display: none; }
#scrCombat.bf .stage .uplate .deckbtn { grid-column: 2; justify-self: start; font-size: 10px; padding: 0 6px; line-height: 16px; opacity: .8; }
#scrCombat.bf .stage .unit.dead .uplate, #scrCombat.bf .stage .unit.dead .uintent { opacity: .35; }
#scrCombat.bf .stage .unit.dead .figure { opacity: .25; filter: grayscale(1); }
#scrCombat.bf .stage .unit.viewing .uplate { box-shadow: inset 0 0 0 1px #d6a14a88; }
#scrCombat.bf .stage .unit .pop { top: auto; bottom: calc(var(--fh) * .9); z-index: 80; }
#scrCombat.bf .stage.tight .uplate { width: 118px; } #scrCombat.bf .stage.tight .uplate .uname b { font-size: 13px; }
#scrCombat.bf .bfcap { position: absolute; bottom: 10px; z-index: 3; font-size: 10px; letter-spacing: 2.5px; text-transform: uppercase; color: #b4bda6aa; pointer-events: none; display: flex; align-items: center; gap: 8px; }
#scrCombat.bf .bfcap::before, #scrCombat.bf .bfcap::after { content: ''; width: 22px; height: 1px; background: currentColor; opacity: .5; }
#scrCombat.bf .bfcap.l { left: 16px; } #scrCombat.bf .bfcap.r { right: 16px; color: #c0a38baa; }
#scrCombat.bf .stage .playedpeek { top: 120px; z-index: 60; }
`;
document.head.appendChild(css);
window.CB_BF = { layout, watch, draw, get on() { return BF.on; } };
})();
