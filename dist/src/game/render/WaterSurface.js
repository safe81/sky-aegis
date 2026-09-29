// A moving, non-tiled GPU water field. The simulation never depends on shader state.
export class WaterSurface {
 constructor(){
  this.canvas=document.createElement('canvas');
  this.gl=this.canvas.getContext('webgl',{alpha:false,antialias:false,preserveDrawingBuffer:true,powerPreference:'low-power'});
  if(!this.gl){this.prepareFallback();return;}
  const gl=this.gl;
  const shader=(kind,source)=>{const s=gl.createShader(kind);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;};
  try{
   const program=gl.createProgram();
   gl.attachShader(program,shader(gl.VERTEX_SHADER,'attribute vec2 a; varying vec2 uv; void main(){uv=a*.5+.5;gl_Position=vec4(a,0.,1.);}'));
   gl.attachShader(program,shader(gl.FRAGMENT_SHADER,`precision highp float;
    varying vec2 uv; uniform vec2 resolution; uniform vec2 camera; uniform float time;
    float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
    float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
    float sea(vec2 p){float n=0.;float a=.52;for(int i=0;i<4;i++){n+=a*noise(p);p=mat2(1.63,-1.12,1.12,1.63)*p+3.7;a*=.46;}return n;}
    void main(){
     vec2 world=vec2(uv.x*resolution.x, (1.-uv.y)*resolution.y)+camera;
     vec2 p=world*.010;
     float swell=sea(p*.23+vec2(time*.020,-time*.014));
     vec2 drift=vec2(swell*.8+time*.065,time*-.042);
     float ripples=sea(p*vec2(1.,2.8)+drift);
     float fine=sea(p*3.5+vec2(time*.055,-time*.11));
     float ridge=pow(max(0.,1.-abs(ripples-.46)*13.),5.);
     float glint=pow(fine,8.)*.9;
     float depth=sea(p*.10+8.);
     vec3 water=mix(vec3(.019,.19,.22),vec3(.045,.32,.33),depth);
     water+=vec3(.06,.135,.12)*(swell-.35);
     water+=vec3(.18,.27,.23)*ridge*.36;
     float wave=sin(p.y*11.+ripples*17.+time*.7);
     float spark=pow(max(0.,wave)*fine,3.);
     water+=vec3(.25,.40,.36)*spark;
     water+=vec3(.38,.54,.47)*glint;
     water+=vec3(.04,.13,.13)*(fine-.4);
     float caustic=pow(max(0.,1.-abs(fine-.49)*19.),7.);
     water+=vec3(.04,.10,.09)*caustic*.24;
     gl_FragColor=vec4(water,1.);
    }`));
   gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));
   gl.useProgram(program);this.program=program;
   const b=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
   const a=gl.getAttribLocation(program,'a');gl.enableVertexAttribArray(a);gl.vertexAttribPointer(a,2,gl.FLOAT,false,0,0);
   this.u=Object.fromEntries(['resolution','camera','time'].map(n=>[n,gl.getUniformLocation(program,n)]));
  }catch(error){console.warn('Water shader unavailable; using the layered fallback.',error);this.gl=null;this.prepareFallback();}
 }
 prepareFallback(){
  // The CPU path uses independent depth, swell and reflection layers too. It is
  // deliberately renderable on browsers that decline a WebGL context.
  const size=384,h=768,base=document.createElement('canvas');base.width=size;base.height=h;
  const bc=base.getContext('2d'),data=bc.createImageData(size,h);
  const fract=n=>n-Math.floor(n),hash=(x,y)=>fract(Math.sin(x*127.1+y*311.7)*43758.5453);
  const noise=(x,y)=>{const ix=Math.floor(x),iy=Math.floor(y);let u=fract(x),v=fract(y);u=u*u*(3-2*u);v=v*v*(3-2*v);const a=hash(ix,iy),b=hash(ix+1,iy),c=hash(ix,iy+1),d=hash(ix+1,iy+1);return (a+(b-a)*u)*(1-v)+(c+(d-c)*u)*v;};
  for(let yy=0;yy<h;yy++)for(let xx=0;xx<size;xx++){
   const depth=noise(xx*.012,yy*.012),swell=noise(xx*.039,yy*.08),detail=noise(xx*.24,yy*.53);
   const crest=Math.pow(Math.max(0,Math.sin(yy*.72+swell*10))*detail,3);
   const i=(yy*size+xx)*4;
   data.data[i]=8+depth*8+swell*5+crest*38;
   data.data[i+1]=57+depth*29+swell*12+crest*66;
   data.data[i+2]=65+depth*25+swell*10+crest*60;data.data[i+3]=255;
  }
  bc.putImageData(data,0,0);this.cpuBase=base;
  const glints=document.createElement('canvas');glints.width=768;glints.height=1152;const c=glints.getContext('2d');
  c.lineCap='round';
  for(let i=0;i<1000;i++){
   const x=hash(i,19)*768,y=hash(i,47)*1152,len=5+hash(i,11)*38;
   c.strokeStyle=`rgba(151,210,199,${.04+hash(i,61)*.13})`;c.lineWidth=.5+hash(i,78)*1.4;
   c.beginPath();c.moveTo(x,y);c.bezierCurveTo(x+len*.25,y-2,x+len*.6,y+3,x+len,y);c.stroke();
  }
  this.cpuGlints=glints;
  this.cpuFrame=document.createElement('canvas');
 }
 drawFallback(ctx,{x,y,width,height,scroll,time}){
  if(!this.cpuBase)this.prepareFallback();
  const tileH=2304,offset=((scroll*.85+time*4)%tileH+tileH)%tileH;
  ctx.save();ctx.beginPath();ctx.rect(x,y,width,height);ctx.clip();
  for(let yy=y-tileH+offset;yy<y+height;yy+=tileH)ctx.drawImage(this.cpuBase,x,yy,width,tileH);
  ctx.globalCompositeOperation='screen';
  const gy=((scroll*.91+time*13)%1152+1152)%1152,gx=Math.sin(time*.09)*18;
  for(let yy=y-1152+gy;yy<y+height;yy+=1152)for(let xx=x-768+gx;xx<x+width;xx+=768)ctx.drawImage(this.cpuGlints,xx,yy);
  if(this.quality==='low'){ctx.restore();return;}
  ctx.globalAlpha=.32;
  const sy=((scroll*.7-time*8)%1382+1382)%1382;
  for(let yy=y-1382+sy;yy<y+height;yy+=1382)ctx.drawImage(this.cpuGlints,x-90+Math.sin(time*.13)*12,yy,width+180,1382);
  ctx.restore();
 }
 drawRegionOverlays(ctx,regions,scroll,time,visibleTop,visibleBottom){
  if(!Array.isArray(regions)||!regions.length)return;
  for(const region of regions){
   const pts=region.points??[];if(pts.length<3)continue;
   let minY=Infinity,maxY=-Infinity,minX=Infinity,maxX=-Infinity;
   for(const p of pts){minY=Math.min(minY,p.y+scroll);maxY=Math.max(maxY,p.y+scroll);minX=Math.min(minX,p.x);maxX=Math.max(maxX,p.x);}
   if(maxY<visibleTop-80||minY>visibleBottom+80)continue;
   ctx.save();ctx.beginPath();ctx.moveTo(pts[0].x,pts[0].y+scroll);for(let i=1;i<pts.length;i++)ctx.lineTo(pts[i].x,pts[i].y+scroll);ctx.closePath();ctx.clip();
   if(region.depthClass==='shallow'){ctx.globalCompositeOperation='screen';ctx.fillStyle='rgba(52,204,196,.22)';}
   else if(region.depthClass==='river'){ctx.globalCompositeOperation='screen';ctx.fillStyle='rgba(18,128,147,.15)';}
   else {ctx.globalCompositeOperation='multiply';ctx.fillStyle='rgba(2,32,64,.14)';}
   ctx.fillRect(minX,minY,maxX-minX,maxY-minY);
   const flowX=Number(region.flowX??0),flowY=Number(region.flowY??0),flow=Math.hypot(flowX,flowY);
   if(flow>0.01&&this.quality!=='low'&&region.depthClass==='river'){
    const ux=flowX/flow,uy=flowY/flow,px=-uy,py=ux;
    const currentStrokeCount=Math.max(8,Math.min(34,Math.round((maxX-minX)*(maxY-minY)/52000)));
    const hh=n=>((Math.sin((region.id?.length??7)*19.17+n*73.13)*43758.5453)%1+1)%1;
    ctx.globalCompositeOperation='screen';ctx.lineCap='round';
    for(let i=0;i<currentStrokeCount;i++){
     const phase=(time*flow*(10+hh(i+21)*8)+hh(i+32)*140)%140;
     let sx=minX+hh(i+1)*(maxX-minX),sy=minY+hh(i+11)*(maxY-minY);
     sx+=ux*(phase-70);sy+=uy*(phase-70);
     const spanX=Math.max(1,maxX-minX),spanY=Math.max(1,maxY-minY);
     sx=minX+((sx-minX)%spanX+spanX)%spanX;sy=minY+((sy-minY)%spanY+spanY)%spanY;
     const len=18+hh(i+51)*46,bend=(hh(i+61)-.5)*18;
     ctx.strokeStyle=`rgba(179,229,224,${.045+hh(i+71)*.065})`;ctx.lineWidth=.7+hh(i+81)*1.4;
     ctx.beginPath();ctx.moveTo(sx,sy);ctx.bezierCurveTo(sx+ux*len*.33+px*bend,sy+uy*len*.33+py*bend,sx+ux*len*.67-px*bend*.45,sy+uy*len*.67-py*bend*.45,sx+ux*len,sy+uy*len);ctx.stroke();
    }
   }
   const iceCoverage=Math.max(0,Math.min(1,Number(region.iceCoverage??0)));
   if(iceCoverage>0){
    ctx.globalCompositeOperation='screen';ctx.fillStyle=`rgba(221,239,244,${.05+iceCoverage*.16})`;ctx.fillRect(minX,minY,maxX-minX,maxY-minY);
    ctx.strokeStyle=`rgba(235,248,251,${.14+iceCoverage*.26})`;ctx.lineWidth=2;
    const span=Math.max(64,150-iceCoverage*70);for(let yy=minY+32;yy<maxY;yy+=span){const drift=Math.sin(yy*.019+time*.08)*22;ctx.beginPath();ctx.moveTo(minX+18+drift,yy);ctx.lineTo(Math.min(maxX-18,minX+95+drift),yy+Math.sin(time*.2+yy)*7);ctx.stroke();}
   }
   ctx.restore();
  }
 }
 draw(ctx,{x=0,y=0,width=1152,height=1280,scroll=0,time=0,regions=[]}){
  const gl=this.gl;
  if(!gl){
   // Composite moving reflections at their display resolution, then copy the
   // opaque water field once. Screen-blending large layers on the main canvas
   // otherwise forces expensive full-resolution work on CPU-only browsers.
   const scale=this.quality==='low'?.42:this.quality==='high'?.8:.58;
   const w=Math.ceil(width*scale),h=Math.ceil(height*scale),buffer=this.cpuFrame;
   if(buffer.width!==w||buffer.height!==h){buffer.width=w;buffer.height=h;}
   const c=buffer.getContext('2d',{alpha:false});c.setTransform(w/width,0,0,h/height,-x*w/width,-y*h/height);
   this.drawFallback(c,{x,y,width,height,scroll,time});
   ctx.drawImage(buffer,x,y,width,height);
   this.drawRegionOverlays(ctx,regions,scroll,time,y,y+height);return;
  }
  const scale=this.quality==='low'?.42:this.quality==='high'?.8:.65;
  const w=Math.ceil(width*scale),h=Math.ceil(height*scale);
  if(this.canvas.width!==w||this.canvas.height!==h){this.canvas.width=w;this.canvas.height=h;}
  gl.viewport(0,0,w,h);gl.useProgram(this.program);
  gl.uniform2f(this.u.resolution,width,height);gl.uniform2f(this.u.camera,x,y-scroll*.85);gl.uniform1f(this.u.time,time);
  gl.drawArrays(gl.TRIANGLES,0,6);ctx.drawImage(this.canvas,x,y,width,height);
  this.drawRegionOverlays(ctx,regions,scroll,time,y,y+height);
 }
 destroy(){this.gl?.getExtension('WEBGL_lose_context')?.loseContext();if(this.cpuFrame)this.cpuFrame.width=1;}
}
