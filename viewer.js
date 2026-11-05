(() => {
  const canvas=document.getElementById('view'), stage=canvas.parentElement, ctx=canvas.getContext('2d',{alpha:false});
  let W=0,H=0,scale=1,drag=false,px=0,py=0,moved=false;
  // Coordinates map the orange footprint in 場地配置.png: x 927–1678, y 480–1279.
  // World units are approximate only; the blue shapes in the source are location markers, not final furniture outlines.
  const scene={yaw:.54,pitch:.88,radius:18,target:[4.15,.1,5.0]};
  const v=(x,y,z)=>[x,y,z],sub=(a,b)=>a.map((n,i)=>n-b[i]),dot=(a,b)=>a.reduce((s,n,i)=>s+n*b[i],0);
  const unit=a=>{const n=Math.hypot(...a)||1;return a.map(t=>t/n)};
  const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
  const clamp=(a,b,c)=>Math.max(b,Math.min(c,a));
  let basis,drawables=[];
  function camera(){const {yaw,pitch,radius,target}=scene,eye=v(target[0]+radius*Math.cos(pitch)*Math.sin(yaw),target[1]+radius*Math.sin(pitch),target[2]+radius*Math.cos(pitch)*Math.cos(yaw));const forward=unit(sub(target,eye)),right=unit(cross(forward,[0,1,0])),up=unit(cross(right,forward));basis={eye,forward,right,up}}
  function project(p){const d=sub(p,basis.eye),depth=dot(d,basis.forward),f=Math.min(W*1.35,H*1.55)*(W<600?.86:1);return {x:W/2+dot(d,basis.right)*f/depth,y:H*.51-dot(d,basis.up)*f/depth,depth}}
  function surface(points,color,stroke='#52646a55',lineWidth=1){const center=points.reduce((s,p)=>s.map((n,i)=>n+p[i]),[0,0,0]).map(n=>n/points.length);drawables.push({points,color,stroke,lineWidth,depth:project(center).depth})}
  function stroke3(a,b,color,width=2){drawables.push({segment:[a,b],color,width,depth:project(v((a[0]+b[0])/2,(a[1]+b[1])/2,(a[2]+b[2])/2)).depth})}
  function circle(x,y,z,rx,rz,color,stroke='#52646a55',steps=18){surface(Array.from({length:steps},(_,i)=>v(x+rx*Math.cos(i*2*Math.PI/steps),y,z+rz*Math.sin(i*2*Math.PI/steps))),color,stroke)}
  function glassFishbowl(z,size=1,offsetY=0){
    // Shallow relief on the glass: a rounded transparent aquarium pouch, not a solid box.
    const p=(x,y,dz)=>v(x,.82+(y-.82)*size+offsetY,z+dz*size),back=.13,water=.19,fig=.25,front=.30,trim=.34;
    const silhouette=[[1.18,-.31],[1.18,.31],[1.04,.37],[.78,.43],[.53,.38],[.35,.25],[.29,0],[.35,-.25],[.53,-.38],[.78,-.43],[1.04,-.37]];
    surface(silhouette.map(([y,dz])=>p(back,y,dz)),'#c9eef13d');
    // Blue waves and a pale sandy bottom remain visible behind the clear cover.
    surface([[.91,-.40],[.94,-.27],[.89,-.12],[.95,.04],[.90,.19],[.94,.36],[.78,.43],[.53,.38],[.35,.25],[.29,0],[.35,-.25],[.53,-.38],[.78,-.43]].map(([y,dz])=>p(water,y,dz)),'#49add5b8');
    for(let j=0;j<5;j++)stroke3(p(fig,.91+(j%2)*.035,-.39+j*.19),p(fig,.91+((j+1)%2)*.035,-.20+j*.19),'#aae9f4',2);
    surface([[.43,-.32],[.38,-.23],[.33,-.12],[.30,0],[.33,.12],[.38,.23],[.43,.32],[.52,.34],[.49,.16],[.47,-.08],[.50,-.28]].map(([y,dz])=>p(fig,y,dz)),'#e4c8a1');
    for(const dz of [-.12,.09,.25]){stroke3(p(fig,.40,dz),p(fig,.68,dz-.035),'#426c55',2.4);stroke3(p(fig,.51,dz-.015),p(fig,.60,dz-.10),'#426c55',1.5)}
    // Two small fish and a jellyfish: simplified motifs from the reference, not exact artwork.
    for(const [y,dz,c,dir] of [[.73,-.20,'#a5d66e',1],[.64,.12,'#f9d9a6',-1]]){
      surface(Array.from({length:12},(_,i)=>{const a=i*Math.PI/6;return p(fig,y+.085*Math.sin(a),dz+.105*Math.cos(a))}),c);
      surface([p(fig,y,dz-dir*.085),p(fig,y+.09,dz-dir*.20),p(fig,y-.09,dz-dir*.20)],c);
      surface(Array.from({length:8},(_,i)=>{let a=i*Math.PI/4;return p(trim,y+.014*Math.sin(a),dz+dir*.055+.014*Math.cos(a))}),'#394752');
    }
    surface(Array.from({length:9},(_,i)=>{const a=i*Math.PI/8;return p(fig,.76+.07*Math.sin(a),.25+.075*Math.cos(a))}),'#c77ac5');
    for(const dz of [.20,.25,.30])stroke3(p(fig,.76,dz),p(fig,.60,dz+.02),'#d8a8d4',1.6);
    // Glossy clear skin, thick charcoal felt piping, top lip and two attachment eyelets.
    surface(silhouette.map(([y,dz])=>p(front,y,dz)),'#e3fbff20');
    for(let i=0;i<silhouette.length;i++){let a=silhouette[i],b=silhouette[(i+1)%silhouette.length];stroke3(p(trim,a[0],a[1]),p(trim,b[0],b[1]),'#716b71',6)}
    surface([p(trim,1.35,-.32),p(trim,1.35,.32),p(trim,1.16,.34),p(trim,1.16,-.34)],'#79727a');
    for(const dz of [-.19,.19]){
      surface(Array.from({length:12},(_,i)=>{const a=i*Math.PI/6;return p(trim+.01,1.255+.035*Math.sin(a),dz+.035*Math.cos(a))}),'#d4cdd0','#4e4b50');
      surface(Array.from({length:12},(_,i)=>{const a=i*Math.PI/6;return p(trim+.02,1.255+.018*Math.sin(a),dz+.018*Math.cos(a))}),'#91c1c5');
    }
  }
  function box(x,y,z,w,h,d,top,side='#b8d7d9',front='#a6c9cd'){
    const X=x+w,Y=y+h,Z=z+d;
    surface([v(x,Y,z),v(X,Y,z),v(X,Y,Z),v(x,Y,Z)],top);
    surface([v(x,y,Z),v(X,y,Z),v(X,Y,Z),v(x,Y,Z)],front);
    surface([v(X,y,z),v(X,y,Z),v(X,Y,Z),v(X,Y,z)],side);
    surface([v(x,y,z),v(x,y,Z),v(x,Y,Z),v(x,Y,z)],side);
    surface([v(x,y,z),v(X,y,z),v(X,Y,z),v(x,Y,z)],front)
  }
  // Interior displays are straight-edged, solid plinths from the floor to the tabletop; no legs.
  function platform(x,z,rx,rz){box(x-rx,.02,z-rz,rx*2,.46,rz*2,'#7dcad5','#5fa5ae','#4c929e')}
  function windowShelf(){
    // A low continuous wavy shelf follows the blue strip against the window in the plan.
    // Its width and height are conceptual; the room's actual construction dimensions are unknown.
    const anchors=[[1.02,.07],[1.45,.40],[2.15,.48],[3.05,.36],[4.25,.20],[5.10,.27],[6.08,.24],[7.07,.34],[8.12,.49],[8.95,.43],[9.62,.07]];
    const edge=[];
    for(let i=0;i<anchors.length-1;i++){
      const a=anchors[Math.max(0,i-1)],b=anchors[i],c=anchors[i+1],d=anchors[Math.min(anchors.length-1,i+2)];
      for(let j=0;j<8;j++){
        const t=j/8,t2=t*t,t3=t2*t;
        const z=.5*((2*b[0])+(-a[0]+c[0])*t+(2*a[0]-5*b[0]+4*c[0]-d[0])*t2+(-a[0]+3*b[0]-3*c[0]+d[0])*t3);
        const x=.5*((2*b[1])+(-a[1]+c[1])*t+(2*a[1]-5*b[1]+4*c[1]-d[1])*t2+(-a[1]+3*b[1]-3*c[1]+d[1])*t3);
        edge.push([x,z]);
      }
    }
    edge.push(anchors[anchors.length-1].slice().reverse());
    const top=.27,bottom=.15;
    for(let i=0;i<edge.length-1;i++){
      const [x,z]=edge[i],[nx,nz]=edge[i+1];
      surface([v(x,bottom,z),v(nx,bottom,nz),v(nx,top,nz),v(x,top,z)],'#4c9caa',null);
    }
    surface([v(.07,top,1.02),...edge.map(([x,z])=>v(x,top,z)),v(.07,top,9.62)],'#78cbd4','#367d8b',1.5);
    for(const z of [2.05,4.82,7.25,8.85])box(.14,.02,z-.045,.08,.14,.09,'#83bbc3','#639da7','#75aab5');
  }
  function label(text,p,color){const q=project(p);if(q.depth<=0)return;const fs=clamp(Math.min(W,H)*.019,12,19);ctx.save();ctx.font=`700 ${fs}px system-ui,"Noto Sans TC",sans-serif`;const width=ctx.measureText(text).width+18;const x=clamp(q.x-width/2,4,W-width-4),y=clamp(q.y,fs+6,H-9);ctx.fillStyle='#fffdf3ea';ctx.strokeStyle='#c9c2b5';ctx.lineWidth=1;ctx.beginPath();ctx.roundRect(x,y-fs-7,width,fs+14,6);ctx.fill();ctx.stroke();ctx.fillStyle=color;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,x+width/2,y-fs/2);ctx.restore()}
  function drawShape(item){const pp=item.points.map(project);if(pp.some(t=>t.depth<=0))return;ctx.beginPath();ctx.moveTo(pp[0].x,pp[0].y);for(const p of pp.slice(1))ctx.lineTo(p.x,p.y);ctx.closePath();ctx.fillStyle=item.color;ctx.fill();if(item.stroke){ctx.strokeStyle=item.stroke;ctx.lineWidth=item.lineWidth;ctx.stroke()}}
  function drawLine(item){const [a,b]=item.segment.map(project);if(a.depth<=0||b.depth<=0)return;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.strokeStyle=item.color;ctx.lineWidth=item.width;ctx.lineCap='round';ctx.stroke()}
  function draw(){
    const dpr=Math.min(devicePixelRatio||1,2),w=stage.clientWidth,h=stage.clientHeight;
    if(canvas.width!==Math.round(w*dpr)||canvas.height!==Math.round(h*dpr)){canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr)}W=w;H=h;scale=dpr;ctx.setTransform(scale,0,0,scale,0,0);
    const bg=ctx.createLinearGradient(0,0,0,H);bg.addColorStop(0,'#f9f6ef');bg.addColorStop(1,'#e1ddd5');ctx.fillStyle=bg;ctx.fillRect(0,0,W,H);camera();drawables=[];
    const floor=[v(0,0,0),v(9.2,0,0),v(9.2,0,4.7),v(5.4,0,4.7),v(5.4,0,9.9),v(0,0,9.9)];
    drawShape({points:[v(-1,-.07,-1),v(10.3,-.07,-1),v(10.3,-.07,11),v(-1,-.07,11)],color:'#d5d2cb',stroke:null});
    drawShape({points:floor,color:'#f39439',stroke:'#dd7c2f',lineWidth:2});
    // The left glass strip belongs to the stamp-and-bag exhibits; not a fourth thematic wall.
    surface([v(.03,0,1.0),v(.03,2.0,1.0),v(.03,2.0,9.65),v(.03,0,9.65)],'#b9eff05c','#6bb0b9',1.4);
    for(const z of [1.05,5.25,9.55])stroke3(v(.04,0,z),v(.04,2.0,z),'#64a8ad',2);
    stroke3(v(.04,2,1),v(.04,2,9.65),'#64a8ad',2);
    // Interior furniture: all low, simplified tables. Source ellipses indicate locations only.
    platform(3.35,2.6,1.12,.72); // spider-leg display
    platform(6.35,1.8,.88,.59); // artificial hands / nail stickers
    platform(2.85,5.7,.45,.54); // paper doll
    platform(2.75,8.0,.48,.55); // stamp
    // Curved, low window-side shelf follows the irregular blue strip in the floor plan.
    windowShelf();
    // Color-selection pieces rest on the window shelf rather than appearing to float through it.
    for(let i=0;i<5;i++){const z=1.55+i*.5;box(.15,.29,z,.09,.10,.16,['#e8ac6d','#dc808d','#d6c27a','#a6bd91','#b895cb'][i]);circle(.26,.28,z+.08,.08,.08,['#f5cb8a','#eeb1b5','#e4d694','#c9dcaa','#d7c1e1'][i],null)}
    // Keep three conceptual pouches but vary size, height and spacing deterministically.
    for(const [z,size,dy] of [[6.30,.67,.12],[7.27,.76,-.08],[8.68,.64,.07]])glassFishbowl(z,size,dy);
    // A spider-like object: body and legs support large wearable shapes; form remains provisional.
    circle(3.35,.82,2.6,.43,.33,'#d99658');for(let i=0;i<8;i++){const a=i*Math.PI/4,dx=Math.cos(a),dz=Math.sin(a);stroke3(v(3.35+dx*.22,.78,2.6+dz*.19),v(3.35+dx*.56,.66,2.6+dz*.48),'#765f55',6);stroke3(v(3.35+dx*.56,.66,2.6+dz*.48),v(3.35+dx*.76,.34,2.6+dz*.60),'#765f55',5);if(i<3)box(3.35+dx*.68-.12,.38,2.6+dz*.54-.12,.24,.27,.24,['#eab466','#a7b9d7','#d7a5bd'][i])}
    // Three fake hands on the low nail-art table; colored nail-sticker squares.
    for(let i=0;i<3;i++){let x=5.88+i*.43;box(x,.51,1.64,.24,.06,.3,'#edc8ae','#d9ac96','#d9ac96');for(let j=0;j<4;j++)box(x+j*.055,.58,1.55,.045,.04,.14,['#d7849e','#e6bd78','#9dafc6','#b8a1c3'][(i+j)%4])}
    // Shoe voting occupies the narrow right-hand edge, upper arm of the L.
    for(let i=0;i<4;i++){let z=1.17+i*.63;for(const side of [0,.13])box(8.69,.035,z+side,.36,.07,.12,i%2?'#f5e2c8':'#fcf7ee','#a99b8d','#c7b6a4')}
    // Tree-branch coat stands: slender poles, alternating short hooks and round floor bases.
    // Preserve the existing conceptual rack positions; the reference photo does not set quantities or colors.
    for(let i=0;i<3;i++){
      const x=5.95+i*.82,z=4.2,c='#627b73';
      circle(x,.04,z,.21,.19,'#82988c','#52665e');
      stroke3(v(x,.08,z),v(x,1.55,z),c,5);
      for(let j=0;j<5;j++){
        const side=j%2===0?1:-1,y=.37+j*.23;
        const tip=v(x+side*.27,y+.19,z+(j%3-1)*.12);
        stroke3(v(x,y,z),tip,c,3);
        stroke3(tip,v(tip[0]+side*.10,tip[1]+.10,tip[2]),c,2.5)
      }
    }
    // Paper-doll stickers and a fixed large stamp, both on low tables.
    circle(2.85,.54,5.7,.15,.12,'#eac7a7');box(2.64,.52,5.79,.42,.07,.36,'#fbf0df');for(const [x,z,c] of [[2.52,5.47,'#bda3cb'],[3.04,5.54,'#dc91a1'],[2.98,5.93,'#9fbd8d']])box(x,.52,z,.14,.035,.14,c);
    box(2.55,.51,8.05,.42,.1,.28,'#edd9ad');box(2.69,.61,8.14,.15,.36,.12,'#dcaa62');circle(2.77,.99,8.20,.15,.11,'#e5b775');
    // Conceptual entrance gap on the shoe side of the footprint, not the inner lower edge.
    for(let i=0;i<floor.length;i++){let a=floor[i],b=floor[(i+1)%floor.length];if(i===1){stroke3(a,v(9.2,.02,3.65),'#bc632c',2);stroke3(v(9.2,.02,4.35),b,'#bc632c',2)}else stroke3(a,b,'#bc632c',2)}
    drawables.sort((a,b)=>b.depth-a.depth);for(const item of drawables)item.segment?drawLine(item):drawShape(item);
    const labels=[['蜘蛛腿',[3.25,1.48,2.25],'#79533b'],['美甲',[6.55,1.2,1.1],'#94516b'],['排鞋子',[8.28,1.4,2.4],'#50768c'],['掛衣服',[6.7,1.67,4.4],'#517a50'],['紙娃娃貼紙',[3.15,1.15,5.8],'#7d6289'],['蓋章',[2.84,1.5,8.35],'#976638'],['光影印章',[.77,2.15,2.45],'#99713e'],['投袋子',[.8,2.18,7.65],'#527f80']];
    for(const [text,p,color] of labels)label(text,p,color);
    label('入口 →',[8.65,.05,3.92],'#3d656a');requestAnimationFrame(draw)
  }
  canvas.addEventListener('pointerdown',e=>{drag=true;moved=false;px=e.clientX;py=e.clientY;canvas.setPointerCapture(e.pointerId);canvas.classList.add('dragging')});
  canvas.addEventListener('pointermove',e=>{if(!drag)return;const dx=e.clientX-px,dy=e.clientY-py;if(Math.abs(dx)+Math.abs(dy)>2)moved=true;scene.yaw-=dx*.006;scene.pitch=clamp(scene.pitch+dy*.005,.32,1.52);px=e.clientX;py=e.clientY});
  canvas.addEventListener('pointerup',()=>{drag=false;canvas.classList.remove('dragging')});
  canvas.addEventListener('pointercancel',()=>{drag=false;canvas.classList.remove('dragging')});
  canvas.addEventListener('wheel',e=>{e.preventDefault();scene.radius=clamp(scene.radius+e.deltaY*.013,11,30)},{passive:false});
  draw();
})();
