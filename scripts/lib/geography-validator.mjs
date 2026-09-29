const prop=(obj,name,fallback=null)=>obj.properties?.find(p=>p.name===name)?.value??fallback;
const points=(obj,key)=>{const ox=obj.x??0,oy=obj.y??0;return (obj[key]??[]).map(p=>({x:p.x+ox,y:p.y+oy}));};
const layer=(map,name)=>map.layers?.find(l=>l.name===name);

function pointInPolygon(x,y,poly){
 let inside=false;
 for(let i=0,j=poly.length-1;i<poly.length;j=i++){
  const a=poly[i],b=poly[j];
  if(((a.y>y)!==(b.y>y))&&x<(b.x-a.x)*(y-a.y)/((b.y-a.y)||1e-9)+a.x)inside=!inside;
 }
 return inside;
}
function pointInRect(x,y,o){
 const cx=(o.x??0)+(o.width??0)/2,cy=(o.y??0)+(o.height??0)/2;
 const angle=-(o.rotation??0)*Math.PI/180,dx=x-cx,dy=y-cy;
 const rx=dx*Math.cos(angle)-dy*Math.sin(angle),ry=dx*Math.sin(angle)+dy*Math.cos(angle);
 return Math.abs(rx)<=(o.width??0)/2&&Math.abs(ry)<=(o.height??0)/2;
}
function substrateFactory(map){
 const polygons=(name)=>(layer(map,name)?.objects??[]).map(o=>points(o,'polygon'));
 const docks=polygons('Docks'),maritime=polygons('Maritime Structures'),water=polygons('Water Cutouts'),concrete=polygons('Concrete'),land=polygons('Land');
 return (x,y)=>{
  for(const p of docks)if(pointInPolygon(x,y,p))return 'dock';
  for(const p of maritime)if(pointInPolygon(x,y,p))return 'concrete';
  for(const p of water)if(pointInPolygon(x,y,p))return 'water';
  for(const p of concrete)if(pointInPolygon(x,y,p))return 'concrete';
  for(const p of land)if(pointInPolygon(x,y,p))return 'land';
  return 'water';
 };
}
function validateRoadSupport(map,errors){
 const roads=layer(map,'Roads')?.objects??[],bridges=layer(map,'Bridges')?.objects??[],substrate=substrateFactory(map);
 for(const road of roads){
  const line=points(road,'polyline'),width=Number(prop(road,'width',50));
  for(let k=1;k<line.length;k++){
   const a=line[k-1],b=line[k],dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy)||1;
   const nx=-dy/len,ny=dx/len,steps=Math.max(1,Math.ceil(len/24));
   for(let i=0;i<=steps;i++){
    const t=i/steps,cx=a.x+dx*t,cy=a.y+dy*t;
    for(const off of [0,-width*.36,width*.36]){
     const x=cx+nx*off,y=cy+ny*off;
     if(substrate(x,y)!=='water')continue;
     if(bridges.some(bridge=>pointInRect(x,y,bridge)))continue;
     errors.push(`Road ${road.name} has unsupported water crossing near ${Math.round(x)},${Math.round(y)}`);
     return;
    }
   }
  }
 }
}
function validateGraph(map,errors){
 const nodes=layer(map,'Road Nodes')?.objects??[];
 if(nodes.length<2){errors.push('Road Nodes layer is missing or empty');return;}
 const ids=new Set(nodes.map(n=>n.name));
 for(const road of layer(map,'Roads')?.objects??[]){
  const from=prop(road,'from_node'),to=prop(road,'to_node');
  if(!ids.has(from))errors.push(`Road ${road.name} has invalid from_node ${from}`);
  if(!ids.has(to))errors.push(`Road ${road.name} has invalid to_node ${to}`);
  for(const junction of String(prop(road,'junction_nodes','')).split(',').filter(Boolean))if(!ids.has(junction))errors.push(`Road ${road.name} has invalid junction_node ${junction}`);
 }
 for(const bridge of layer(map,'Bridges')?.objects??[]){
  const from=prop(bridge,'from_node'),to=prop(bridge,'to_node');
  if(from&&!ids.has(from))errors.push(`Bridge ${bridge.name} has invalid from_node ${from}`);
  if(to&&!ids.has(to))errors.push(`Bridge ${bridge.name} has invalid to_node ${to}`);
 }
}
function validateSockets(map,errors){
 const districtIds=new Set((layer(map,'Districts')?.objects??[]).map(d=>d.name));
 const seen=new Set();
 for(const socket of layer(map,'Sockets')?.objects??[]){
  if(seen.has(socket.name))errors.push(`Duplicate socket id ${socket.name}`);seen.add(socket.name);
  if(prop(socket,'anchor_id')!==socket.name)errors.push(`Socket ${socket.name} anchor_id must equal its stable name`);
  const district=prop(socket,'district');if(!districtIds.has(district))errors.push(`Socket ${socket.name} has invalid district ${district}`);
  if(!prop(socket,'role'))errors.push(`Socket ${socket.name} is missing role`);
 }
}

function validateSurfaceMetadata(map,errors){
 for(const shore of layer(map,'Shorelines')?.objects??[]){
  const kind=prop(shore,'contact_kind'),side=prop(shore,'water_side'),height=Number(prop(shore,'height'));
  if(!prop(shore,'district_id'))errors.push(`Shoreline ${shore.name} missing district_id`);
  if(!['beach','rock','quay','ice'].includes(kind))errors.push(`Shoreline ${shore.name} has invalid contact_kind ${kind}`);
  if(!['left','right'].includes(side))errors.push(`Shoreline ${shore.name} has invalid water_side ${side}`);
  if(!Number.isFinite(height))errors.push(`Shoreline ${shore.name} has invalid height`);
 }
 for(const region of layer(map,'Water Regions','Art Instances')?.objects??[]){
  const pts=points(region,'polygon'),depth=prop(region,'depth_class'),ice=Number(prop(region,'ice_coverage'));
  if(pts.length<3)errors.push(`Water region ${region.name} needs a polygon`);
  if(!prop(region,'body_id'))errors.push(`Water region ${region.name} missing body_id`);
  if(!['deep','shallow','river'].includes(depth))errors.push(`Water region ${region.name} has invalid depth_class ${depth}`);
  if(!Number.isFinite(ice)||ice<0||ice>1)errors.push(`Water region ${region.name} has invalid ice_coverage`);
 }
}
function validateVisualZones(map,errors){
 const districtIds=new Set((layer(map,'Districts')?.objects??[]).map(d=>d.name));
 const specs=[
  ['Relief Zones','Relief zone',o=>{
   const height=Number(prop(o,'height')),rough=Number(prop(o,'roughness')),shelves=Number(prop(o,'shelf_count'));
   if(!Number.isFinite(height)||height<=0)return 'invalid height';
   if(!Number.isFinite(rough)||rough<0||rough>1)return 'invalid roughness';
   if(!Number.isFinite(shelves)||shelves<1)return 'invalid shelf_count';
   return null;
  }],
  ['Material Zones','Material zone',o=>{
   const opacity=Number(prop(o,'opacity')),scale=Number(prop(o,'scale'));
   if(!prop(o,'material_kind'))return 'missing material_kind';
   if(!Number.isFinite(opacity)||opacity<0||opacity>1)return 'invalid opacity';
   if(!Number.isFinite(scale)||scale<=0)return 'invalid scale';
   return null;
  }],
  ['Vegetation Zones','Vegetation zone',o=>{
   const density=Number(prop(o,'density')),min=Number(prop(o,'min_size')),max=Number(prop(o,'max_size'));
   if(!prop(o,'vegetation_kind'))return 'missing vegetation_kind';
   if(!Number.isFinite(density)||density<0||density>1)return 'invalid density';
   if(!Number.isFinite(min)||!Number.isFinite(max)||min<=0||max<min)return 'invalid size range';
   return null;
  }],
  ['Shadow Casters','Shadow caster',o=>{
   const opacity=Number(prop(o,'opacity')),blur=Number(prop(o,'blur'));
   if(!Number.isFinite(opacity)||opacity<0||opacity>1)return 'invalid opacity';
   if(!Number.isFinite(blur)||blur<0)return 'invalid blur';
   return null;
  }],
 ];
 for(const [layerName,label,extra] of specs){
  for(const o of layer(map,layerName)?.objects??[]){
   if(points(o,'polygon').length<3){errors.push(`${label} ${o.name} needs polygon with at least three points`);continue;}
   const district=prop(o,'district_id');if(!districtIds.has(district))errors.push(`${label} ${o.name} has invalid district ${district}`);
   const issue=extra(o);if(issue)errors.push(`${label} ${o.name} ${issue}`);
  }
 }
}
export function validateTiledGeography(map){
 const errors=[];
 for(const name of ['Districts','Land','Water Cutouts','Water Regions','Concrete','Maritime Structures','Docks','Roads','Road Nodes','Shorelines','Bridges','Landmarks','Decorations','Sockets','Reference Trace','Atmosphere Zones','Relief Zones','Material Zones','Vegetation Zones','Shadow Casters'])if(!layer(map,name))errors.push(`Required Tiled layer missing: ${name}`);
 if(errors.length)return {ok:false,errors};
 validateRoadSupport(map,errors);validateGraph(map,errors);validateSockets(map,errors);validateSurfaceMetadata(map,errors);validateVisualZones(map,errors);
 const districts=layer(map,'Districts')?.objects??[];
 if(districts.length!==15)errors.push(`Level 1 requires exactly 15 districts; found ${districts.length}`);
 for(let i=1;i<districts.length;i++){const prevMin=Number(prop(districts[i-1],'min_y')),nextMax=Number(prop(districts[i],'max_y'));if(prevMin!==nextMax)errors.push(`District continuity break between ${districts[i-1].name} and ${districts[i].name}`);}
 const trace=layer(map,'Reference Trace')?.objects??[];for(const id of ['water-spine','west-reference-bank','east-reference-bank']){const o=trace.find(x=>x.name===id);if(!o||points(o,'polyline').length<15)errors.push(`Reference Trace ${id} missing or too short`);}
 const atmosphere=layer(map,'Atmosphere Zones')?.objects??[];if(atmosphere.length<6)errors.push('Atmosphere Zones needs at least six authored regions');
 return {ok:errors.length===0,errors};
}
