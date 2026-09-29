function drawPolyline(ctx,points,scroll,offset=0,side='right'){
 if(points.length<2)return;
 ctx.beginPath();
 for(let i=0;i<points.length;i++){
  const p=points[i],a=points[Math.max(0,i-1)],b=points[Math.min(points.length-1,i+1)];
  const dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy)||1,sign=side==='right'?1:-1;
  const x=p.x+(-dy/len)*offset*sign,y=p.y+scroll+(dx/len)*offset*sign;
  if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);
 }
}
function brokenCrests(ctx,line,scroll,time,{spacing=25,offset=5,length=12},index){
 const pts=line.points??[];if(pts.length<2)return;
 for(let s=0;s<pts.length-1;s++){
  const a=pts[s],b=pts[s+1],dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy)||1,nx=-dy/len,ny=dx/len,sign=line.waterSide==='right'?1:-1;
  const phase=(time*18+index*13+s*7)%spacing;
  for(let d=phase;d<len;d+=spacing){
   const t=d/len,x=a.x+dx*t+nx*sign*offset,y=a.y+dy*t+scroll+ny*sign*offset,seg=Math.min(length,len-d);
   ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+dx/len*seg,y+dy/len*seg);ctx.stroke();
  }
 }
}

function drawShallowShelf(ctx,line,scroll,kind){
 const pts=line.points??[];if(pts.length<2||kind==='quay'||kind==='ice')return;
 const beach=kind==='beach';
 drawPolyline(ctx,pts,scroll,beach?46:32,line.waterSide);ctx.strokeStyle=beach?'rgba(46,211,200,.18)':'rgba(38,178,184,.12)';ctx.lineWidth=beach?88:64;ctx.stroke();
 drawPolyline(ctx,pts,scroll,beach?25:17,line.waterSide);ctx.strokeStyle=beach?'rgba(128,232,216,.21)':'rgba(93,202,199,.14)';ctx.lineWidth=beach?46:34;ctx.stroke();
 drawPolyline(ctx,pts,scroll,beach?10:8,line.waterSide);ctx.strokeStyle=beach?'rgba(202,246,231,.13)':'rgba(151,226,218,.09)';ctx.lineWidth=beach?21:16;ctx.stroke();
}

function drawBeachWash(ctx,line,scroll,time,index,quality){
 const pts=line.points;
 drawPolyline(ctx,pts,scroll,18,line.waterSide);ctx.strokeStyle='rgba(50,218,205,.18)';ctx.lineWidth=31;ctx.stroke();
 drawPolyline(ctx,pts,scroll,9,line.waterSide);ctx.strokeStyle='rgba(157,235,215,.32)';ctx.lineWidth=15;ctx.stroke();
 drawPolyline(ctx,pts,scroll,1,line.waterSide);ctx.strokeStyle='rgba(244,235,197,.60)';ctx.lineWidth=7;ctx.stroke();
 if(quality!=='low'){
  ctx.strokeStyle='rgba(247,255,250,.78)';ctx.lineWidth=2.8;brokenCrests(ctx,line,scroll,time,{spacing:27,offset:8,length:13},index);
  ctx.strokeStyle='rgba(211,249,242,.46)';ctx.lineWidth=1.8;brokenCrests(ctx,line,scroll,time*.72,{spacing:39,offset:15,length:18},index+11);
 }
}
function drawRockContact(ctx,line,scroll,time,index,quality){
 const pts=line.points;
 drawPolyline(ctx,pts,scroll,9,line.waterSide);ctx.strokeStyle='rgba(18,85,94,.22)';ctx.lineWidth=22;ctx.stroke();
 drawPolyline(ctx,pts,scroll,3,line.waterSide);ctx.strokeStyle='rgba(156,220,211,.22)';ctx.lineWidth=5;ctx.stroke();
 drawPolyline(ctx,pts,scroll,0,line.waterSide);ctx.strokeStyle='rgba(22,35,34,.42)';ctx.lineWidth=2.4;ctx.stroke();
 if(quality!=='low'){ctx.strokeStyle='rgba(238,252,248,.48)';ctx.lineWidth=1.9;brokenCrests(ctx,line,scroll,time,{spacing:24,offset:6,length:10},index);}
}
function drawQuayContact(ctx,line,scroll,time,index,quality){
 const pts=line.points;
 drawPolyline(ctx,pts,scroll,0,line.waterSide);ctx.strokeStyle='rgba(14,25,28,.62)';ctx.lineWidth=5.5;ctx.stroke();
 drawPolyline(ctx,pts,scroll,4,line.waterSide);ctx.strokeStyle='rgba(100,193,193,.20)';ctx.lineWidth=5;ctx.stroke();
 if(quality!=='low'){ctx.strokeStyle='rgba(190,231,226,.34)';ctx.lineWidth=1.6;brokenCrests(ctx,line,scroll,time*.6,{spacing:44,offset:6,length:16},index+5);}
}
function drawIceContact(ctx,line,scroll,time,index,quality){
 const pts=line.points;
 drawPolyline(ctx,pts,scroll,11,line.waterSide);ctx.strokeStyle='rgba(174,225,235,.20)';ctx.lineWidth=23;ctx.stroke();
 drawPolyline(ctx,pts,scroll,3,line.waterSide);ctx.strokeStyle='rgba(229,247,249,.63)';ctx.lineWidth=7;ctx.stroke();
 drawPolyline(ctx,pts,scroll,0,line.waterSide);ctx.strokeStyle='rgba(248,253,252,.76)';ctx.lineWidth=2.6;ctx.stroke();
 if(quality!=='low'){
  ctx.strokeStyle='rgba(206,239,244,.50)';ctx.lineWidth=1.5;brokenCrests(ctx,line,scroll,time*.25,{spacing:51,offset:13,length:21},index+17);
 }
}
/** Boundary-following live shoreline contact; each material keeps a distinct physical edge. */
export function drawShoreEffects(ctx,shorelines,waterRegions,scroll,time,quality='balanced'){
 if(!ctx||!Array.isArray(shorelines))return;
 ctx.save();ctx.lineCap='round';ctx.lineJoin='round';
 for(let i=0;i<shorelines.length;i++){
  const line=shorelines[i],pts=line.points??[];if(pts.length<2)continue;
  drawShallowShelf(ctx,line,scroll,line.contactKind);
  if(line.contactKind==='beach')drawBeachWash(ctx,line,scroll,time,i,quality);
  else if(line.contactKind==='quay')drawQuayContact(ctx,line,scroll,time,i,quality);
  else if(line.contactKind==='ice')drawIceContact(ctx,line,scroll,time,i,quality);
  else drawRockContact(ctx,line,scroll,time,i,quality);
 }
 ctx.restore();
}