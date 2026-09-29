import {PLAYFIELD_WIDTH} from '../constants.js';

const LEGACY_WORLD_WIDTH=1152;
const X=(value)=>value/LEGACY_WORLD_WIDTH*PLAYFIELD_WIDTH;
const XS=(values)=>values.map(X);

export const MISSION1_EVENTS = [
    { at: 1, kind: 'formation', family: 'light-fighter', count: 5, xs: XS([180, 375, 576, 775, 972]), y: -45 },
    { at: 7, kind: 'formation', family: 'light-fighter', count: 4, xs: XS([250, 415, 737, 902]), y: -50 },
    { at: 9, kind: 'prop', assetId: 'fuel-tank', anchorId: 'fuel-cliff', x: X(565), y: -80, hp: 120, medalEligible: false },
    { at: 15, kind: 'mixed', entries: [
            { family: 'light-fighter', x: X(180), y: -45 }, { family: 'light-fighter', x: X(390), y: -75 }, { family: 'light-fighter', x: X(765), y: -75 }, { family: 'light-fighter', x: X(980), y: -45 },
            { family: 'aa-turret', anchorId: 'aa-cliff-main', x: X(166), y: 90 }, { family: 'aa-turret', anchorId: 'aa-cliff-offshore', x: X(890), y: -40 },
        ] },
    { at: 24, kind: 'formation', family: 'light-fighter', count: 5, xs: XS([210, 390, 576, 760, 940]), y: -50 },
    { at: 35, kind: 'rescue', id: 'rescue-alpha', anchorId: 'rescue-alpha', count: 2, x: X(185), y: 390 },
    { at: 50, kind: 'mixed', entries: [
            { family: 'side-sweeper', x: X(175), y: -55 }, { family: 'side-sweeper', x: X(930), y: -100 }, { family: 'side-sweeper', x: X(560), y: -155 },
            { family: 'gunboat', anchorId: 'water-outer-1', x: X(660), y: 120 },
        ] },
    { at: 62, kind: 'mixed', entries: [{family:'side-sweeper',x:X(170),y:-55},{family:'gunboat',anchorId:'water-outer-2',x:X(590),y:80}] },
    { at: 75, kind: 'mixed', entries: [
            { family: 'armoured-bomber', x: X(576), y: -70 }, { family: 'interceptor', x: X(185), y: -95 }, { family: 'interceptor', x: X(965), y: -115 },
        ] },
    { at: 84, kind: 'formation', family: 'interceptor',count:3,xs:XS([210,480,950]),y:-80 },
    { at: 88, kind: 'prop', assetId: 'fuel-tank', anchorId: 'fuel-narrows', x: X(560), y: -90, hp: 120, medalEligible: false },
    { at: 95, kind: 'mixed', entries: [
            { family: 'armoured-vehicle', roadId:'coastal-spine', x: X(166), y: 80 }, { family: 'armoured-vehicle', roadId:'coastal-spine', x: X(205), y: -30 }, { family: 'missile-battery', anchorId: 'missile-narrows', x: X(890), y: -130 },
        ] },
    { at: 110, kind: 'recovery', label: 'RESUPPLY WINDOW' },
    { at: 112, kind: 'rescue', id: 'rescue-bravo', anchorId: 'rescue-bravo', count: 2, x: X(845), y: 390 },
    { at: 120, kind: 'miniboss', anchorId:'boss-breakwater-arena' },
    { at: 150, kind: 'recovery', label: 'HARBOR APPROACH' },
    { at: 160, kind: 'prop', assetId: 'fuel-tank', anchorId: 'fuel-military', x: X(585), y: -85, hp: 135, medalEligible: false },
    { at: 170, kind: 'mixed', entries: [
            { family: 'missile-aircraft', x: X(195), y: -55 }, { family: 'missile-aircraft', x: X(950), y: -95 }, { family: 'gunship', x: X(576), y: -140 },
            { family: 'light-fighter', x: X(110), y: -190 }, { family: 'light-fighter', x: X(1040), y: -190 },
        ] },
    { at: 183, kind:'mixed',entries:[{family:'missile-aircraft',x:X(340),y:-65},{family:'gunship',x:X(810),y:-140}] },
    { at: 195, kind: 'rescue', id: 'rescue-charlie', anchorId: 'rescue-charlie', count: 2, x: X(935), y: 400 },
    { at: 210, kind: 'boss', anchorId:'boss-citadel-arena' },
];
export const MISSION1_ID = 'coastal-intercept';
export const MISSION1_NAME = 'COASTAL INTERCEPT';
export const MISSION1_RESCUE_TOTAL = 6;
