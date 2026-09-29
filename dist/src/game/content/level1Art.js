const sprite=(name,w,h,{pivotX=w/2,pivotY=h,layer='ground',shadow=true,ppu=1}={})=>Object.freeze({
 url:`art/level1/${name}.svg`,sourcePixelWidth:w,sourcePixelHeight:h,pivotX,pivotY,
 pixelsPerWorldUnit:ppu,renderLayer:layer,castsShadow:shadow,
});

/**
 * Level 1 modular environment art. Runtime uses rasterized sprites for sharp mobile output;
 * editable SVG masters remain beside them for revision. Instance visual bounds are authored
 * in the TMJ and applied uniformly by AuthoredStructures.
 */
export const LEVEL1_ART=Object.freeze({
 'civil-house':sprite('civil-house',420,308),
 'industrial-hall':sprite('industrial-hall',406,249),
 'crane':sprite('crane',212,401,{layer:'elevated'}),
 'warship-static':sprite('warship',166,420),
 'radar':sprite('radar',234,346,{layer:'elevated'}),
 'dam-face':sprite('dam-face',1400,700,{layer:'elevated'}),
 'dam-abutment':sprite('dam-abutment',760,760,{layer:'elevated'}),
 'dam-service-gallery':sprite('dam-service-gallery',900,420,{layer:'elevated'}),
 'canyon-retaining-wall':sprite('canyon-retaining-wall',1000,300),
 'fortress-terrace':sprite('fortress-terrace',416,218),
 'citadel-gate':sprite('citadel-gate',1200,820,{layer:'elevated'}),
 'citadel-wing':sprite('citadel-wing',1000,620,{layer:'elevated'}),
 'citadel-tower':sprite('citadel-tower',520,760,{layer:'elevated'}),
 'tunnel-mouth':sprite('tunnel-mouth',416,276),
 'coastal-watchtower':sprite('coastal-watchtower',520,700,{layer:'elevated'}),
 'gateway-keep':sprite('gateway-keep',900,1100,{layer:'elevated'}),
 'gateway-terrace':sprite('gateway-terrace',1000,420),
 'gateway-arch-support':sprite('gateway-arch-support',500,700,{layer:'elevated'}),
 'harbour-office':sprite('harbour-office',840,560),
 'fuel-tank':sprite('fuel-tank',840,840),
 'naval-bunker':sprite('naval-bunker',840,560),
 'fortress-wall':sprite('fortress-wall',840,560,{layer:'elevated'}),
 'fortress-buttress':sprite('fortress-buttress',900,900,{layer:'elevated'}),
 'fortress-snow-terrace':sprite('fortress-snow-terrace',1200,520,{layer:'elevated'}),
 'quay-edge':sprite('quay-edge',1000,180),
 'marina-pier':sprite('marina-pier',900,180),
 'harbour-ramp':sprite('harbour-ramp',700,400),
 'service-yard':sprite('service-yard',900,600),
 'citadel-bunker':sprite('citadel-bunker',840,560,{layer:'elevated'}),
 'gateway-cliff-bank':sprite('gateway-cliff-bank',1400,1100),
 'dam-canyon-shoulder':sprite('dam-canyon-shoulder',1500,1500),
 'citadel-mountain-shoulder':sprite('citadel-mountain-shoulder',1500,1500),
 'civil-boat':sprite('civil-boat',300,600),
});
