function instanceVisibleForPass(instance,pass){
 if(pass==='shadow')return true;
 return instance.renderLayer===pass;
}

function renderMetrics(instance,definition){
 const ppu=definition.pixelsPerWorldUnit||1;
 const naturalWidth=definition.sourcePixelWidth/ppu;
 const naturalHeight=definition.sourcePixelHeight/ppu;
 const targetWidth=(instance.visualBounds?.maxX??NaN)-(instance.visualBounds?.minX??NaN);
 const targetHeight=(instance.visualBounds?.maxY??NaN)-(instance.visualBounds?.minY??NaN);
 let scale=1;
 if(Number.isFinite(targetWidth)&&targetWidth>0&&Number.isFinite(targetHeight)&&targetHeight>0){
  // Fit the authored sprite inside its registered visual envelope using ONE scale.
  // This preserves landmark proportions and prevents the non-uniform squeezing rejected by the handoff.
  scale=Math.min(targetWidth/naturalWidth,targetHeight/naturalHeight);
 }
 return {
  width:naturalWidth*scale,
  height:naturalHeight*scale,
  pivotX:(definition.pivotX/ppu)*scale,
  pivotY:(definition.pivotY/ppu)*scale,
 };
}

function instanceHash(id=''){let h=2166136261;for(const c of String(id)){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return(h>>>0)/4294967295;}
function drawOne(ctx,instance,record,pass,scroll){
 const {image,definition}=record??{};
 if(!image||!definition||!instanceVisibleForPass(instance,pass))return;
 let {width,height,pivotX,pivotY}=renderMetrics(instance,definition);
 const boat=instance.assetId==='civil-boat',variation=boat?(.92+instanceHash(instance.id)*.16):1;
 if(boat){width*=variation;height*=variation;pivotX*=variation;pivotY*=variation;}
 ctx.save();ctx.translate(instance.x,instance.y+scroll);if(instance.rotation)ctx.rotate(instance.rotation);
 if(pass==='shadow'){
  if(!definition.castsShadow){ctx.restore();return;}
  const elevation=instance.elevation??0;ctx.translate(Math.max(9,elevation*.28),Math.max(13,elevation*.42));ctx.globalAlpha=boat?.22:.30;ctx.filter='brightness(0) saturate(0)';
 }else if(boat){
  ctx.save();ctx.globalCompositeOperation='screen';ctx.strokeStyle='rgba(190,235,231,.22)';ctx.lineWidth=2.2;
  for(const side of [-1,1]){ctx.beginPath();ctx.moveTo(side*width*.09,height*.08);ctx.quadraticCurveTo(side*width*.28,height*.36,side*width*.38,height*.82);ctx.stroke();}ctx.restore();
 }
 ctx.drawImage(image,-pivotX,-pivotY,width,height);
 if(pass!=='shadow'&&boat){ctx.globalCompositeOperation='screen';ctx.globalAlpha=.10;ctx.filter='brightness(1.4)';ctx.drawImage(image,-pivotX-1,-pivotY-1.5,width,height);ctx.filter='none';}
 ctx.restore();
}

/** Draws registered Level 1 modular artwork. Instances are in persistent world coordinates. */
export function drawAuthoredStructures(ctx,instances,assets,pass,scroll=0){
 if(!ctx||!Array.isArray(instances)||!(assets instanceof Map))return;
 for(const instance of instances){
  if(pass!=='shadow'&&instance.renderLayer!==pass)continue;
  drawOne(ctx,instance,assets.get(instance.assetId),pass,scroll);
 }
}