import {COASTAL_GEOGRAPHY_DATA} from './content/coastalGeographyData.js';

export const VIEWPORT_WIDTH = 720;
export const VIEWPORT_HEIGHT = 1280;
// Level 1 is wider than the portrait camera. Keep gameplay bounds derived from the compiled authored map.
export const PLAYFIELD_WIDTH = COASTAL_GEOGRAPHY_DATA.bounds.maxX-COASTAL_GEOGRAPHY_DATA.bounds.minX;
// Backward-compatible viewport aliases. Simulation world-space X bounds use PLAYFIELD_WIDTH.
export const WORLD_WIDTH = VIEWPORT_WIDTH;
export const WORLD_HEIGHT = VIEWPORT_HEIGHT;
export const FIXED_DT = 1 / 60;
export const FIXED_HZ = 60;
export const LayerId = {
    Terrain: 0,
    Decals: 1,
    Scenery: 2,
    Structures: 3,
    Debris: 4,
    SurfaceTargets: 5,
    Aircraft: 6,
    FriendlyProjectiles: 7,
    Effects: 8,
    HostileProjectiles: 9,
    Hud: 10,
};
