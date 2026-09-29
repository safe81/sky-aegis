import {
 COASTAL_GEOGRAPHY,
 districtAtWorldY,
 roadPointNearWorldY,
 socketByRole,
 surfaceAtWorldPoint,
 visibleFeatures,
} from '../content/coastalGeography.js';

export const MODULE_ART={
 bridge:{url:'art/modules/bridge-module.png',width:1536,height:1024,elevation:92},
};

export class Environment{
 static build(seed=0x20260910){return new Environment(seed);}
 constructor(seed){
  this.seed=seed;
  this.map=COASTAL_GEOGRAPHY;
  this.landmarks=this.map.landmarks;
  // Only genuinely elevated structural modules remain here. Terrain and port composition live in the authored map.
  this.modules=[...this.map.bridges];
  this.sockets=this.map.sockets;
 }
 districtAtWorldY(y){return districtAtWorldY(y);}
 surfaceAtWorld(x,y,domain='ground'){return surfaceAtWorldPoint(x,y,domain);}
 roadPointNearWorldY(roadId,y){return roadPointNearWorldY(roadId,y);}
 socketsByRole(role){return socketByRole(role);}
 visibleModules(scroll,top=-320,bottom=1620){return this.modules.filter(m=>m.y+scroll+m.height>top&&m.y+scroll<bottom);}
 visibleLand(scroll,top=-320,bottom=1620){return visibleFeatures(this.map.landPolygons,top-scroll,bottom-scroll,180);}
 visibleConcrete(scroll,top=-320,bottom=1620){return visibleFeatures(this.map.concretePolygons,top-scroll,bottom-scroll,180);}
 visibleDocks(scroll,top=-320,bottom=1620){return visibleFeatures(this.map.dockPolygons,top-scroll,bottom-scroll,180);}
 visibleWaterCutouts(scroll,top=-320,bottom=1620){return visibleFeatures(this.map.waterPolygons??[],top-scroll,bottom-scroll,180);}
 visibleMaritimeStructures(scroll,top=-320,bottom=1620){return visibleFeatures(this.map.maritimeStructures??[],top-scroll,bottom-scroll,180);}
 visibleRoads(scroll,top=-320,bottom=1620){return visibleFeatures(this.map.roads,top-scroll,bottom-scroll,180);}
 visibleShorelines(scroll,top=-320,bottom=1620){return visibleFeatures(this.map.shorelines,top-scroll,bottom-scroll,180);}
 visibleDecorations(scroll,top=-320,bottom=1620){return visibleFeatures(this.map.decorations??[],top-scroll,bottom-scroll,180);}
 visibleArtInstances(scroll,top=-320,bottom=1620){return (this.map.artInstances??[]).filter(i=>i.visualBounds.maxY+scroll>top-180&&i.visualBounds.minY+scroll<bottom+180);}
 visibleBridges(scroll,top=-320,bottom=1620){return this.map.bridges.filter(m=>m.y+scroll+m.height>top&&m.y+scroll<bottom);}
 visibleAtmosphere(scroll,top=-320,bottom=1620){return (this.map.atmosphereZones??[]).filter(z=>z.y+scroll+z.height>top&&z.y+scroll<bottom);}
 visibleReliefZones(scroll,top=-320,bottom=1620){return visibleFeatures(this.map.reliefZones??[],top-scroll,bottom-scroll,220);}
 visibleMaterialZones(scroll,top=-320,bottom=1620){return visibleFeatures(this.map.materialZones??[],top-scroll,bottom-scroll,160);}
 visibleVegetationZones(scroll,top=-320,bottom=1620){return visibleFeatures(this.map.vegetationZones??[],top-scroll,bottom-scroll,160);}
 visibleShadowCasters(scroll,top=-320,bottom=1620){return visibleFeatures(this.map.shadowCasters??[],top-scroll,bottom-scroll,260);}
 referenceTrace(id){return (this.map.referenceTrace??[]).find(x=>x.id===id)??null;}
 socketAt(id,scroll){const s=this.sockets.find(x=>x.id===id);return s?{...s,y:s.y+scroll,surface:this.surfaceAtWorld(s.x,s.y)}:null;}
 socketAtAnchor(anchorId,scroll,expectedRole=null){
  const s=this.sockets.find(x=>x.anchorId===anchorId||x.id===anchorId);
  if(!s)throw Error(`Unknown geography anchor ${anchorId}`);
  if(expectedRole&&s.role!==expectedRole)throw Error(`Anchor ${anchorId} expected role ${expectedRole} but is ${s.role}`);
  return {...s,y:s.y+scroll,surface:this.surfaceAtWorld(s.x,s.y)};
 }
 nearestSocket(x,y,scroll,used=new Set(),role=null){
  const source=role?this.socketsByRole(role):this.sockets;
  let best=null,d=Infinity;
  for(const s of source){if(used.has(s.id))continue;const sy=s.y+scroll;
   const minX=this.map.bounds.minX+35,maxX=this.map.bounds.maxX-35;
   if(s.x<minX||s.x>maxX||sy<-250||sy>1500)continue;
   const ds=(s.x-x)**2+(sy-y)**2;if(ds<d){d=ds;best={...s,y:sy,surface:this.surfaceAtWorld(s.x,s.y)};}
  }return best;
 }
 routeForRoadVehicle(screenY,scroll,roadId='coastal-spine'){
  const worldY=screenY-scroll;
  const road=this.map.roads.find(r=>r.id===roadId);
  if(!road)return null;
  const near=roadPointNearWorldY(roadId,worldY);
  if(!near)return null;
  // Build four ordered points surrounding the requested world Y for the existing cubic mover.
  const pts=[...road.points].sort((a,b)=>b.y-a.y);
  let idx=pts.findIndex(p=>p.y<=near.y);if(idx<0)idx=pts.length-1;
  const pick=(i)=>pts[Math.max(0,Math.min(pts.length-1,i))];
  const slice=[pick(idx-1),pick(idx),pick(idx+1),pick(idx+2)];
  return {x:slice.map(p=>p.x),y:slice.map(p=>p.y),surface:'road'};
 }
}
