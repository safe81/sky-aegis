export class CombatPresentation {
 constructor(renderer){this.r=renderer;this.shadows=new Map();this.bolts=new Map();}
 silhouette(image){let mask=this.shadows.get(image);if(mask)return mask;mask=document.createElement('canvas');mask.width=image.width;mask.height=image.height;const c=mask.getContext('2d');c.drawImage(image,0,0);c.globalCompositeOperation='source-in';c.fillStyle='#031315';c.fillRect(0,0,mask.width,mask.height);this.shadows.set(image,mask);return mask;}
 shadow(ctx,image,x,y,w,h,altitude=60,rotation=0){
  ctx.save();ctx.translate(x+altitude*.62,y+altitude*.92);ctx.rotate(rotation);ctx.globalAlpha=altitude>35?.35:.45;ctx.drawImage(this.silhouette(image),-w/2,-h/2,w,h);ctx.restore();
 }
 glow(ctx,x,y,r,color,alpha=.6){ctx.save();ctx.globalCompositeOperation='screen';ctx.globalAlpha=alpha;const g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,color);g.addColorStop(.18,color+'90');g.addColorStop(1,color+'00');ctx.fillStyle=g;ctx.fillRect(x-r,y-r,r*2,r*2);ctx.restore();}
 lights(ctx,effects,world,craft){
  for(const f of effects.flashes)this.glow(ctx,f.x,f.y,f.radius*1.25,'#ffb65e',f.alpha*.45);
  for(const e of world.events){if(e.type!=='weaponFired'||world.tick-e.tick>3)continue;const src=world.getEntity(e.sourceId);if(!src?.active)continue;
   if(src.id==='player')for(const m of craft.muzzles)this.glow(ctx,src.x+m.x,src.y+m.y,30,craft.weapon.family==='laser'?'#48d8ff':craft.weapon.family==='minigun'?'#bdeba3':'#ffc273',.26);
   else this.glow(ctx,src.x,src.y+16,42,'#ffb766',.33);
  }
 }
 missileTrail(ctx,p){
  if(!p.trail?.length)return;ctx.save();ctx.lineCap='round';
  for(let i=1;i<p.trail.length;i++){const a=p.trail[i-1],b=p.trail[i],q=i/p.trail.length;
   ctx.strokeStyle=p.faction==='player'?`rgba(173,190,176,${q*.35})`:`rgba(188,167,149,${q*.42})`;ctx.lineWidth=2+(1-q)*6;
   ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();
  }ctx.restore();
 }
 wake(ctx,e,width,height,time){
  const rear=e.y+height*.34;ctx.save();ctx.lineCap='round';
  for(let i=0;i<15;i++){
   const t=(i/15+time*.10)%1,dy=t*155,spread=width*(.21+t*.17);
   ctx.strokeStyle=`rgba(191,229,215,${(1-t)*.22})`;ctx.lineWidth=1.4+(1-t)*3;
   for(const side of [-1,1]){const x=e.x+side*spread;ctx.beginPath();ctx.moveTo(x-side*14,rear+dy-5);ctx.quadraticCurveTo(x,rear+dy,x+side*(9+t*17),rear+dy+8);ctx.stroke();}
   ctx.strokeStyle=`rgba(179,219,204,${(1-t)*.09})`;ctx.lineWidth=3;
   ctx.beginPath();ctx.ellipse(e.x+Math.sin(t*24+time)*7,rear+dy,14+t*23,2.5+t*2,0,0,Math.PI);ctx.stroke();
  }ctx.restore();
 }
 friendly(ctx,p){
  if(p.assetId.includes('missile')){this.missileTrail(ctx,p);return false;}
  const laser=p.assetId.includes('laser'),speed=Math.hypot(p.vx,p.vy),len=laser?Math.min(108,speed*.062):Math.min(77,speed*.055),dx=p.vx/speed,dy=p.vy/speed;
  ctx.save();ctx.translate(p.x,p.y);ctx.rotate(Math.atan2(dy,dx)+Math.PI/2);
  const key=(laser?'laser:':'tracer:')+len;
  let sprite=this.bolts.get(key);
  if(!sprite){sprite=document.createElement('canvas');sprite.width=64;sprite.height=160;const c=sprite.getContext('2d');c.translate(32,32);this.paintBolt(c,laser,len);this.bolts.set(key,sprite);}
  ctx.drawImage(sprite,-32,-32);ctx.restore();return true;
 }
 paintBolt(ctx,laser,len){
  const color=laser?'#60deff':'#a1f4b0';ctx.shadowColor=color;ctx.shadowBlur=laser?13:8;
  const g=ctx.createLinearGradient(0,-8,0,len);g.addColorStop(0,'#ffffff');g.addColorStop(.16,color);g.addColorStop(1,color+'00');
  ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(0,-10);ctx.bezierCurveTo(6,-3,6,16,0,len);ctx.bezierCurveTo(-6,16,-6,-3,0,-10);ctx.fill();
  ctx.fillStyle='#f5fff5';ctx.fillRect(-1.4,-7,2.8,len*.48);
 }
 articulatedWeapon(ctx,e,time){
  const id=e.data.enemyId,ground=e.kind==='ground',naval=e.kind==='naval';
  if(!ground&&!naval&&id!=='gunship')return;
  ctx.save();ctx.translate(e.x,e.y);ctx.rotate(Number(e.data.weaponAngle??Math.PI/2)-Math.PI/2);
  const gun=(x)=>{ctx.fillStyle='#15282b';ctx.strokeStyle='#adc1bb';ctx.lineWidth=1.2;ctx.beginPath();ctx.roundRect(x-4,-4,8,35,2);ctx.fill();ctx.stroke();ctx.fillStyle='#415653';ctx.fillRect(x-3,4,6,21);ctx.fillStyle='#c6d0b6';ctx.fillRect(x-2,27,4,5);};
  if(id==='missile-battery'){
   ctx.strokeStyle=`rgba(153,234,191,${.35+.2*Math.sin(time*4)})`;ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(0,0,34,time*1.7,time*1.7+.75);ctx.stroke();
  }else{gun(naval?-12:0);if(naval)gun(12);ctx.fillStyle='#546862';ctx.strokeStyle='#c3c6ac';ctx.beginPath();ctx.ellipse(0,0,13,10,0,0,Math.PI*2);ctx.fill();ctx.stroke();}
  ctx.restore();
  if(id==='gunship'){
   ctx.save();ctx.translate(e.x,e.y-9);ctx.rotate(time*37);ctx.lineCap='round';ctx.strokeStyle='rgba(210,224,215,.45)';ctx.lineWidth=5;
   for(let i=0;i<2;i++){ctx.rotate(Math.PI/2);ctx.beginPath();ctx.moveTo(-69,0);ctx.lineTo(69,0);ctx.stroke();}ctx.restore();
  }
 }
 fragment(ctx,p){
  if(!p.assetId)return false;let image=this.r.cache.get(`enemy:${p.assetId}`)?.image;
  if(!image){const rec=[...this.r.cache].find(([key,v])=>v.ready&&key.startsWith(`craft:${p.assetId}:0:0`));image=rec?.[1].image;}
  if(!image&&(p.assetId.includes('leviathan')||p.assetId.includes('breakwater')))image=this.r.cache.get(`boss:${p.assetId.includes('leviathan')?'leviathan':'breakwater'}`)?.image;
  if(!image)return false;
  const k=p.fragmentIndex??0,u=[.05,.63,.36,.4][k],v=[.35,.35,.54,.1][k],sw=image.width*.3,sh=image.height*.32;
  ctx.drawImage(image,image.width*u,image.height*v,sw,sh,-p.size*1.5,-p.size*1.2,p.size*3,p.size*2.4);return true;
 }
}
