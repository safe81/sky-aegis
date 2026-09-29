function hash(n){return ((Math.sin(n*91.7+17.3)*43758.5453)%1+1)%1;}
const maxWispWidth=220;

function wispInstance(zone,i,scroll,time,bounds){
 const seed=zone.id.length*43+i*29;
 const worldWidth=bounds.maxX-bounds.minX;
 const w=Math.min(maxWispWidth,82+hash(seed+1)*138),h=16+hash(seed+2)*34;
 const speed=(zone.speed??8)*(.28+hash(seed+3)*.42);
 const span=worldWidth+w*2,base=bounds.minX+hash(seed+4)*span-w;
 const drift=(time*speed+scroll*.006*(.35+hash(seed+5)))%span;
 const x=bounds.minX+((base-bounds.minX+drift+w)%span)-w;
 const y=zone.y+zone.height*(.12+hash(seed+6)*.76)+scroll;
 return {x,y,w,h,seed};
}

function drawWisp(ctx,wisp,alpha,tint='235,244,243'){
 const {x,y,w,h,seed}=wisp;
 ctx.save();ctx.globalAlpha=alpha;ctx.fillStyle=`rgba(${tint},.82)`;
 ctx.beginPath();
 ctx.moveTo(x-w*.50,y+h*.08);
 ctx.bezierCurveTo(x-w*.33,y-h*(.46+.10*hash(seed+2)),x-w*.09,y-h*.26,x+w*.04,y-h*.10);
 ctx.bezierCurveTo(x+w*.20,y-h*.42,x+w*.42,y-h*.18,x+w*.50,y+h*.05);
 ctx.bezierCurveTo(x+w*.31,y+h*.29,x+w*.06,y+h*.24,x-w*.13,y+h*.19);
 ctx.bezierCurveTo(x-w*.31,y+h*.32,x-w*.46,y+h*.22,x-w*.50,y+h*.08);
 ctx.closePath();ctx.fill();
 ctx.globalAlpha*=.42;ctx.fillStyle=`rgba(${tint},.62)`;ctx.beginPath();ctx.moveTo(x-w*.36,y);ctx.quadraticCurveTo(x,y-h*.22,x+w*.37,y+h*.02);ctx.quadraticCurveTo(x,y+h*.13,x-w*.36,y);ctx.fill();
 ctx.restore();
}

function drawDepthMistBand(ctx,zone,scroll,bounds,alpha){
 const y=zone.y+scroll,h=zone.height,w=bounds.maxX-bounds.minX;
 ctx.save();
 const g=ctx.createLinearGradient(0,y,0,y+h);
 g.addColorStop(0,'rgba(204,224,227,0)');
 g.addColorStop(.22,`rgba(204,224,227,${alpha*.28})`);
 g.addColorStop(.52,`rgba(219,234,235,${alpha})`);
 g.addColorStop(.78,`rgba(204,224,227,${alpha*.36})`);
 g.addColorStop(1,'rgba(204,224,227,0)');
 ctx.fillStyle=g;ctx.fillRect(bounds.minX,y,w,h);
 // Thin lateral strata create atmospheric perspective without opaque circular blobs.
 for(let i=0;i<3;i++){
  const seed=zone.id.length*59+i*23,yy=y+h*(.28+i*.18)+(hash(seed)-.5)*h*.06;
  const gg=ctx.createLinearGradient(bounds.minX,0,bounds.maxX,0);
  gg.addColorStop(0,'rgba(224,238,239,0)');gg.addColorStop(.35,`rgba(224,238,239,${alpha*.45})`);gg.addColorStop(.68,`rgba(224,238,239,${alpha*.30})`);gg.addColorStop(1,'rgba(224,238,239,0)');
  ctx.globalAlpha=.72;ctx.fillStyle=gg;ctx.fillRect(bounds.minX,yy,w,6+hash(seed+4)*11);
 }
 ctx.restore();
}

/** Draws restrained world-anchored atmosphere in explicit shadow / low / high passes. */
export function drawAtmosphere(ctx,zones,scroll,time,pass='high',quality='balanced',bounds={minX:0,maxX:2606}){
 if(!ctx||!Array.isArray(zones))return;
 const qualityScale=quality==='low'?.65:quality==='high'?1.08:1;
 for(const zone of zones){
  const mist=zone.kind==='mountain-mist'||zone.kind==='dam-spray';
  const snow=zone.kind==='snow-clouds';
  if(pass==='low'){
   if(zone.fogAlpha>0)drawDepthMistBand(ctx,zone,scroll,bounds,Math.min(.095,zone.fogAlpha*.72));
   if(!mist)continue;
  }
  if(pass==='high'&&mist)continue;
  const count=Math.max(1,Math.min(5,Math.round((1+zone.cloudDensity*5)*qualityScale)));
  for(let i=0;i<count;i++){
   const w=wispInstance(zone,i,scroll,time,bounds);
   if(pass==='shadow'){
    if(mist)continue;
    ctx.save();ctx.globalAlpha=Math.min(.095,(zone.shadowOpacity??.08)*.65);ctx.fillStyle='rgba(8,24,29,.72)';ctx.beginPath();ctx.ellipse(w.x+28,w.y+38,w.w*.34,w.h*.42,-.08,0,Math.PI*2);ctx.fill();ctx.restore();
   }else{
    const base=mist?.075:snow?.105:.065;
    drawWisp(ctx,w,base+Math.min(.055,zone.cloudDensity*.06),snow?'240,246,250':'235,244,243');
   }
  }
 }
}

export {drawDepthMistBand,drawWisp,maxWispWidth};
