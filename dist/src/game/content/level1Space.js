import {COASTAL_GEOGRAPHY_DATA} from './coastalGeographyData.js';

export const LEVEL1_SPACE=Object.freeze({...COASTAL_GEOGRAPHY_DATA.referenceRegistration});

export function blueprintToWorld(u,v){
 const r=LEVEL1_SPACE;
 return {x:r.originX+u*r.scaleX,y:r.originY+v*r.scaleY};
}
export function worldToBlueprint(x,y){
 const r=LEVEL1_SPACE;
 return {u:(x-r.originX)/r.scaleX,v:(y-r.originY)/r.scaleY};
}
export function scrollForBlueprintRow(v,screenY,viewTop=0){
 return screenY+viewTop-blueprintToWorld(0,v).y;
}
export function scrollLimits(viewTop,viewHeight,bounds){
 return {min:viewTop+viewHeight-bounds.maxY,max:viewTop-bounds.minY};
}
