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

function drawOne(ctx,instance,record,pass,scroll){
 const {image,definition}=record??{};
 if(!image||!definition||!instanceVisibleForPass(instance,pass))return;
 const {width,height,pivotX,pivotY}=renderMetrics(instance,definition);
 ctx.save();
 ctx.translate(instance.x,instance.y+scroll);
 if(instance.rotation)ctx.rotate(instance.rotation);
 if(pass==='shadow'){
  if(!definition.castsShadow){ctx.restore();return;}
  const elevation=instance.elevation??0;
  ctx.translate(Math.max(9,elevation*.28),Math.max(13,elevation*.42));
  ctx.globalAlpha=.30;
  ctx.filter='brightness(0) saturate(0)';
 }
 ctx.drawImage(image,-pivotX,-pivotY,width,height);
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
