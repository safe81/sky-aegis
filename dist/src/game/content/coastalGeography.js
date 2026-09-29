import {COASTAL_GEOGRAPHY_DATA} from './coastalGeographyData.js';

export const COASTAL_GEOGRAPHY=COASTAL_GEOGRAPHY_DATA;

function pointInPolygon(x,y,points){
 let inside=false;
 for(let i=0,j=points.length-1;i<points.length;j=i++){
  const a=points[i],b=points[j];
  const crosses=((a.y>y)!==(b.y>y)) && x < (b.x-a.x)*(y-a.y)/((b.y-a.y)||1e-9)+a.x;
  if(crosses)inside=!inside;
 }
 return inside;
}

function segmentDistance(px,py,a,b){
 const dx=b.x-a.x,dy=b.y-a.y,denom=dx*dx+dy*dy||1;
 const t=Math.max(0,Math.min(1,((px-a.x)*dx+(py-a.y)*dy)/denom));
 return Math.hypot(px-(a.x+dx*t),py-(a.y+dy*t));
}

function distanceToLine(x,y,line){
 let d=Infinity;
 for(let i=1;i<line.points.length;i++)d=Math.min(d,segmentDistance(x,y,line.points[i-1],line.points[i]));
 return d;
}

function bridgeLocalPoint(x,y,bridge){
 const cx=bridge.x+bridge.width/2,cy=bridge.y+bridge.height/2;
 const a=-(bridge.rotation??0),dx=x-cx,dy=y-cy,c=Math.cos(a),sn=Math.sin(a);
 return {x:dx*c-dy*sn,y:dx*sn+dy*c};
}
function pointOnBridgeDeck(x,y,bridge){
 const p=bridgeLocalPoint(x,y,bridge);
 return Math.abs(p.x)<=bridge.width/2&&Math.abs(p.y)<=Math.max(bridge.height/2,18);
}
function pointOnBridgeSupport(x,y,bridge){
 const p=bridgeLocalPoint(x,y,bridge),nx=(p.x+bridge.width/2)/bridge.width;
 const towerHalf=Math.max(22,Math.min(58,bridge.width*.035));
 const support=(fraction)=>Math.abs(p.x-(-bridge.width/2+bridge.width*fraction))<=towerHalf;
 return Math.abs(p.y)<=Math.max(bridge.height/2,24)&&(support(.17)||support(.83)||nx<.035||nx>.965);
}

export function districtAtWorldY(y){
 const districts=COASTAL_GEOGRAPHY.districts;
 return districts.find(d=>y<=d.maxY&&y>d.minY)??(y===districts.at(-1)?.minY?districts.at(-1):null);
}
export function socketByRole(role){return COASTAL_GEOGRAPHY.sockets.filter(s=>s.role===role);}
export function surfaceAtWorldPoint(x,y,domain='ground'){
 const g=COASTAL_GEOGRAPHY;
 if(domain==='naval'){
  for(const bridge of g.bridges)if(pointOnBridgeSupport(x,y,bridge))return 'obstacle';
  for(const structure of g.maritimeStructures)if(pointInPolygon(x,y,structure.points))return 'obstacle';
  for(const dock of g.dockPolygons)if(pointInPolygon(x,y,dock.points))return 'obstacle';
  for(const zone of g.concretePolygons)if(pointInPolygon(x,y,zone.points))return 'obstacle';
  for(const land of g.landPolygons)if(pointInPolygon(x,y,land.points))return 'obstacle';
  return 'water';
 }
 for(const bridge of g.bridges)if(pointOnBridgeDeck(x,y,bridge))return 'bridge';
 for(const road of g.roads)if(distanceToLine(x,y,road)<=road.width*.5)return 'road';
 for(const dock of g.dockPolygons)if(pointInPolygon(x,y,dock.points))return 'dock';
 for(const structure of g.maritimeStructures)if(pointInPolygon(x,y,structure.points))return 'concrete';
 for(const cutout of g.waterPolygons)if(pointInPolygon(x,y,cutout.points))return 'water';
 for(const zone of g.concretePolygons)if(pointInPolygon(x,y,zone.points))return 'concrete';
 for(const land of g.landPolygons)if(pointInPolygon(x,y,land.points))return 'land';
 return 'water';
}

export function waterBodyAtWorldPoint(x,y){
 if(surfaceAtWorldPoint(x,y,'naval')!=='water')return null;
 const region=(COASTAL_GEOGRAPHY.waterRegions??[]).find(r=>pointInPolygon(x,y,r.points));
 return region?.bodyId??'coastal-river';
}



export function roadNetworkPath(fromNode,toNode){
 if(fromNode===toNode)return [];
 const segments=COASTAL_GEOGRAPHY.roadGraph?.segments??[];
 const adjacency=new Map();
 const add=(node,entry)=>{if(!adjacency.has(node))adjacency.set(node,[]);adjacency.get(node).push(entry);};
 for(const segment of segments){add(segment.from,{segment,next:segment.to});add(segment.to,{segment,next:segment.from});}
 const queue=[fromNode],seen=new Set([fromNode]),previous=new Map();
 while(queue.length){
  const node=queue.shift();
  for(const edge of adjacency.get(node)??[]){
   if(seen.has(edge.next))continue;
   seen.add(edge.next);previous.set(edge.next,{node,segment:edge.segment});
   if(edge.next===toNode){
    const path=[];let cursor=toNode;
    while(cursor!==fromNode){const step=previous.get(cursor);if(!step)return [];path.push(step.segment);cursor=step.node;}
    return path.reverse();
   }
   queue.push(edge.next);
  }
 }
 return [];
}

export function roadPointNearWorldY(roadId,y){
 const road=COASTAL_GEOGRAPHY.roads.find(r=>r.id===roadId);if(!road)return null;
 let best=null,d=Infinity;
 for(let i=1;i<road.points.length;i++){
  const a=road.points[i-1],b=road.points[i];
  const minY=Math.min(a.y,b.y),maxY=Math.max(a.y,b.y);
  const clampedY=Math.max(minY,Math.min(maxY,y));
  const t=(clampedY-a.y)/((b.y-a.y)||1);
  const p={x:a.x+(b.x-a.x)*t,y:clampedY};
  const dy=Math.abs(p.y-y);if(dy<d){d=dy;best=p;}
 }
 return best;
}

export function visibleFeatures(collection,minY,maxY,padding=0){
 return collection.filter(f=>{
  const pts=f.points??[f.a,f.b].filter(Boolean);
  if(!pts.length){const y=f.y??0,h=f.height??0;return y+h>=minY-padding&&y<=maxY+padding;}
  let lo=Infinity,hi=-Infinity;for(const p of pts){lo=Math.min(lo,p.y);hi=Math.max(hi,p.y);}return hi>=minY-padding&&lo<=maxY+padding;
 });
}
