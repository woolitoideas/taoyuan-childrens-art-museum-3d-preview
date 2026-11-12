(() => {
  const canvas=document.getElementById('view'), stage=canvas.parentElement, ctx=canvas.getContext('2d',{alpha:false});
  let W=0,H=0,drag=false,px=0,py=0,pendingFrame=false;
  function scheduleDraw(){if(!pendingFrame){pendingFrame=true;requestAnimationFrame(()=>{pendingFrame=false;draw()})}}
  // One world unit = one metre. Plan dimensions: 14.60 × 14.50 m;
  // south arm 7.80 m, east arm 6.80 m deep, inner notch 6.80 × 7.70 m.
  // The PNG's far-right pink edge extends beyond its 1460 cm dimension line;
  // the explicit dimension controls the footprint, not those extra pixels.
  const geometry={width:14.6,depth:14.5,innerX:7.8,innerZ:6.8,glassEdges:['north','west']};
  const contours=window.planContours;
  if(!contours)throw new Error('Plan contour data was not loaded');
  window.viewerGeometry=Object.freeze(geometry);
  const scene={yaw:.62,pitch:1.02,radius:28,target:[6.1,.15,6.8]};
  const v=(x,y,z)=>[x,y,z],sub=(a,b)=>a.map((n,i)=>n-b[i]),dot=(a,b)=>a.reduce((s,n,i)=>s+n*b[i],0);
  const unit=a=>{const n=Math.hypot(...a)||1;return a.map(t=>t/n)};
  const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
  const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
  let basis,drawables=[];
  function camera(){const {yaw,pitch,radius,target}=scene,eye=v(target[0]+radius*Math.cos(pitch)*Math.sin(yaw),target[1]+radius*Math.sin(pitch),target[2]+radius*Math.cos(pitch)*Math.cos(yaw));const forward=unit(sub(target,eye)),right=unit(cross(forward,[0,1,0])),up=unit(cross(right,forward));basis={eye,forward,right,up}}
  function project(p){const d=sub(p,basis.eye),depth=dot(d,basis.forward),f=Math.min(W*1.15,H*1.52)*(W<600?.98:1);return {x:W/2+dot(d,basis.right)*f/depth,y:H*.53-dot(d,basis.up)*f/depth,depth}}
  function surface(points,color,stroke='#52646a55',lineWidth=1){const center=points.reduce((s,p)=>s.map((n,i)=>n+p[i]),[0,0,0]).map(n=>n/points.length);drawables.push({points,color,stroke,lineWidth,depth:project(center).depth})}
  function line(a,b,color='#616b6b',width=2){drawables.push({segment:[a,b],color,width,depth:project(v((a[0]+b[0])/2,(a[1]+b[1])/2,(a[2]+b[2])/2)).depth})}
  function disk(x,y,z,rx,rz,color,steps=24){surface(Array.from({length:steps},(_,i)=>v(x+rx*Math.cos(i*2*Math.PI/steps),y,z+rz*Math.sin(i*2*Math.PI/steps))),color)}
  function box(x,y,z,w,h,d,top,side='#55a7b5'){
    const X=x+w,Y=y+h,Z=z+d;
    surface([v(x,Y,z),v(X,Y,z),v(X,Y,Z),v(x,Y,Z)],top);
    surface([v(x,y,Z),v(X,y,Z),v(X,Y,Z),v(x,Y,Z)],side);
    surface([v(X,y,z),v(X,y,Z),v(X,Y,Z),v(X,Y,z)],side);
    surface([v(x,y,z),v(x,y,Z),v(x,Y,Z),v(x,Y,z)],side);
    surface([v(x,y,z),v(X,y,z),v(X,Y,z),v(x,Y,z)],side)
  }
  // Direct extrusion of the sampled, native AI Bézier outlines in metre coordinates.
  function extrudeOutline(points,height){
    for(let i=0;i<points.length;i++){
      const [x,z]=points[i],[nx,nz]=points[(i+1)%points.length];
      surface([v(x,.015,z),v(nx,.015,nz),v(nx,height,nz),v(x,height,z)],'#58a7b4',null);
    }
    surface(points.map(([x,z])=>v(x,height,z)),'#70cad8','#388d9b',1.1);
  }
  function glassWall(a,b){surface([v(a[0],0,a[1]),v(b[0],0,b[1]),v(b[0],2.65,b[1]),v(a[0],2.65,a[1])],'#a9dfe52d','#67a9b280');for(let i=0;i<=4;i++){const t=i/4,x=a[0]+(b[0]-a[0])*t,z=a[1]+(b[1]-a[1])*t;line(v(x,0,z),v(x,2.65,z),'#609faa8a',1.4)}line(v(a[0],2.65,a[1]),v(b[0],2.65,b[1]),'#609faa8a',1.4)}
  function magnetPanel(cx,cz,angle=0){
    // Deck p.12: two sloped faces meet a narrow flat top; the side profile is a trapezoid.
    // Overall 120 × 100 × 65 cm is provisional per the current deck, not a construction detail.
    const w=1.20,h=.65,frontFoot=.50,rearFoot=-.50,frontTop=.12,rearTop=-.12;
    const cs=Math.cos(angle),sn=Math.sin(angle),p=(x,y,z)=>v(cx+x*cs-z*sn,y,cz+x*sn+z*cs);
    const faceZ=y=>frontFoot+(frontTop-frontFoot)*(y-.02)/(h-.02)+.012;
    surface([p(-w/2,.02,rearFoot),p(w/2,.02,rearFoot),p(w/2,h,rearTop),p(-w/2,h,rearTop)],'#5ea9b7','#608d99',1.1);
    for(const x of [-w/2,w/2])surface([p(x,.02,frontFoot),p(x,.02,rearFoot),p(x,h,rearTop),p(x,h,frontTop)],'#78b7c2','#608d99',1.1);
    surface([p(-w/2,h,frontTop),p(-w/2,h,rearTop),p(w/2,h,rearTop),p(w/2,h,frontTop)],'#85bcc5','#608d99',1.1);
    surface([p(-w/2,.02,frontFoot),p(w/2,.02,frontFoot),p(w/2,h,frontTop),p(-w/2,h,frontTop)],'#d5e9e9','#608d99',1.7);
    for(let i=0;i<4;i++){const x=-.42+i*.27;surface([p(x,.32,faceZ(.32)),p(x+.13,.32,faceZ(.32)),p(x+.13,.39,faceZ(.39)),p(x,.39,faceZ(.39))],['#e6bd72','#db9dab','#91c2ce','#a8bb91'][i],null)}
  }
  function pouch(z,y){
    // Abstract wall-mounted voting pockets; location is schematic, not installation engineering.
    const x=.075,outline=[[-.27,-.24],[.27,-.24],[.32,.17],[.18,.27],[-.18,.27],[-.32,.17]];
    surface(outline.map(([dz,dy])=>v(x,y+dy,z+dz)),'#bce7ea7a','#548a94',2);
    line(v(x+.025,y+.12,z-.22),v(x+.025,y+.12,z+.22),'#6ab0b9',2);
    disk(.11,y-.13,z,.02,.10,'#edc48e');
  }
  function label(text,p,color='#3f6870'){const q=project(p);if(q.depth<=0)return;const fs=clamp(Math.min(W,H)*.019,11,18);ctx.save();ctx.font=`700 ${fs}px system-ui,"Noto Sans TC",sans-serif`;const width=ctx.measureText(text).width+18;const x=clamp(q.x-width/2,4,W-width-4),y=clamp(q.y,fs+6,H-8);ctx.fillStyle='#fffdf3ea';ctx.strokeStyle='#c9c2b5';ctx.beginPath();ctx.roundRect(x,y-fs-7,width,fs+14,6);ctx.fill();ctx.stroke();ctx.fillStyle=color;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,x+width/2,y-fs/2);ctx.restore()}
  function drawShape(item){const pp=item.points.map(project);if(pp.some(t=>t.depth<=0))return;ctx.beginPath();ctx.moveTo(pp[0].x,pp[0].y);for(const p of pp.slice(1))ctx.lineTo(p.x,p.y);ctx.closePath();ctx.fillStyle=item.color;ctx.fill();if(item.stroke){ctx.strokeStyle=item.stroke;ctx.lineWidth=item.lineWidth;ctx.stroke()}}
  function drawLine(item){const [a,b]=item.segment.map(project);if(a.depth<=0||b.depth<=0)return;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.strokeStyle=item.color;ctx.lineWidth=item.width;ctx.lineCap='round';ctx.stroke()}
  function draw(){
    const dpr=Math.min(devicePixelRatio||1,2),w=stage.clientWidth,h=stage.clientHeight;
    if(canvas.width!==Math.round(w*dpr)||canvas.height!==Math.round(h*dpr)){canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr)}W=w;H=h;ctx.setTransform(dpr,0,0,dpr,0,0);
    const bg=ctx.createLinearGradient(0,0,0,H);bg.addColorStop(0,'#faf7f0');bg.addColorStop(1,'#e5e0d9');ctx.fillStyle=bg;ctx.fillRect(0,0,W,H);camera();drawables=[];
    const floor=[v(0,0,0),v(14.6,0,0),v(14.6,0,6.8),v(7.8,0,6.8),v(7.8,0,14.5),v(0,0,14.5)];
    drawShape({points:[v(-1,-.06,-1),v(15.6,-.06,-1),v(15.6,-.06,15.5),v(-1,-.06,15.5)],color:'#d8d4cb'});
    drawShape({points:floor,color:'#f3bcd1',stroke:'#d5859e',lineWidth:2});
    // The two longest perimeter edges (north and west) are glass.
    glassWall([0,0],[14.6,0]);glassWall([0,0],[0,14.5]);
    // PNG stations are ordered by their purple marks, but the marks themselves are not modelled.
    // 01: native three-lobed 300 × 200 cm contour; 70 cm height from deck.
    extrudeOutline(contours.ring,.70);
    for(const [x,z,c] of [[8.96,1.86,'#efa866'],[9.60,2.08,'#a6c695'],[10.18,1.96,'#d8aac7']]){disk(x,.73,z,.17,.17,c);line(v(x-.16,.77,z),v(x+.16,.77,z),'#a36655',2)}
    // 02: native rotated double-circle, with 350 × 200 cm along its drawn axes;
    // 60 cm conceptual height (not specified by plan).
    extrudeOutline(contours.hands,.60);
    for(let i=0;i<4;i++){let x=3.45+i*.55;box(x,.60,2.70,.30,.055,.38,'#efd0b8','#d5b29d');for(let j=0;j<4;j++)box(x+j*.065,.66,2.62,.045,.035,.12,['#d78ca7','#eed386','#9bbdce','#ba9cc6'][(i+j)%4])}
    // 03: 350 × 200 cm floor zone only. Clothing lies directly on the floor;
    // no raised platform, coat rack, legs or implied construction footprint.
    const shirt=(cx,cz,angle,color)=>{
      const ca=Math.cos(angle),sa=Math.sin(angle),p=(x,z)=>v(cx+x*ca-z*sa,.025,cz+x*sa+z*ca);
      const outline=[[-.24,-.43],[-.10,-.43],[0,-.34],[.10,-.43],[.24,-.43],[.40,-.25],[.28,-.10],[.22,-.17],[.22,.43],[-.22,.43],[-.22,-.17],[-.28,-.10],[-.40,-.25]];
      surface(outline.map(([x,z])=>p(x,z)),color,'#6c838b',1.4);
      line(p(-.12,.21),p(.12,.21),'#ffffff99',1.4);
    };
    shirt(11.11,5.20,-.28,'#e8bc85');shirt(12.36,5.28,.16,'#b5c5dc');shirt(13.25,5.63,-.40,'#daaabb');
    for(const [x,z,angle,color] of [[11.28,6.11,.10,'#a7c5ad'],[12.40,6.14,-.16,'#f2d7a3']]){
      const ca=Math.cos(angle),sa=Math.sin(angle),p=(dx,dz,y)=>v(x+dx*ca-dz*sa,y,z+dx*sa+dz*ca);
      surface([p(-.32,-.23,.030),p(.32,-.23,.030),p(.32,.23,.030),p(-.32,.23,.030)],color,'#718e96',1.2);
      line(p(-.25,0,.034),p(.25,0,.034),'#ffffffaa',1.2);
    }
    // 04: the deck explicitly shows an inclined two-sided magnet display (not a plinth).
    magnetPanel(3.58,7.86,-.52);magnetPanel(5.25,7.12,-.52);
    // 05: native 130 × 90 cm silhouettes, each 55 cm high per deck.
    for(const name of ['stampA','stampB','stampC']){
      const points=contours[name],cx=points.reduce((s,p)=>s+p[0],0)/points.length,cz=points.reduce((s,p)=>s+p[1],0)/points.length;
      extrudeOutline(points,.55);box(cx-.08,.56,cz-.09,.16,.18,.16,'#e3ae66','#c99869');
    }
    // 06/07: actual AI window-side wavy footprint (maximum 120 cm wide).
    // The low 60 cm solid support is conceptual; plan contains only its footprint.
    extrudeOutline(contours.windowStrip,.60);
    for(let i=0;i<5;i++){const z=1.15+i*.48;box(.22,.605,z,.12,.07,.18,['#e6b170','#d996ad','#dbcd84','#9fc7ae','#aa9fce'][i])}
    // The 07 pockets remain attached to the glass; remove the two freestanding blue bins.
    for(const z of [8.05,9.05,10.05,11.05])for(const y of [1.12,1.92])pouch(z,y);
    // Unknown entry location: do not draw an opening or a misleading entry arrow.
    for(let i=0;i<floor.length;i++){const a=floor[i],b=floor[(i+1)%floor.length];line(a,b,'#c16c87',1.8)}
    drawables.sort((a,b)=>b.depth-a.depth);for(const item of drawables)item.segment?drawLine(item):drawShape(item);
    for(const [name,pos] of [['套圈圈',[9.55,1.18,2.05]],['手部貼票',[4.38,1.15,2.85]],['掛／摺衣服',[12.22,.38,5.48]],['磁鐵',[4.40,1.40,7.37]],['蓋章',[4.28,1.19,12.20]],['光影印章',[.66,1.42,2.50]],['投袋子',[.84,1.95,9.64]]])label(name,pos);
  }
  canvas.addEventListener('pointerdown',e=>{drag=true;px=e.clientX;py=e.clientY;canvas.setPointerCapture(e.pointerId);canvas.classList.add('dragging')});
  canvas.addEventListener('pointermove',e=>{if(!drag)return;scene.yaw-=(e.clientX-px)*.006;scene.pitch=clamp(scene.pitch+(e.clientY-py)*.005,.30,1.53);px=e.clientX;py=e.clientY;scheduleDraw()});
  for(const type of ['pointerup','pointercancel'])canvas.addEventListener(type,()=>{drag=false;canvas.classList.remove('dragging')});
  canvas.addEventListener('wheel',e=>{e.preventDefault();scene.radius=clamp(scene.radius+e.deltaY*.018,17,42);scheduleDraw()},{passive:false});
  window.addEventListener('resize',scheduleDraw);
  scheduleDraw();
})();
