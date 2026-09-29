const AIRCRAFT_IDS = new Set(['specter-x', 'tempest-5', 'aurora-1', 'raven-9', 'falcon-07', 'bulldog-4', 'wraith-2', 'viper-11', 'titan-6']);
const ENEMY_IDS = new Set(['light-fighter', 'interceptor', 'side-sweeper', 'armoured-bomber', 'missile-aircraft', 'gunship', 'aa-turret', 'missile-battery', 'armoured-vehicle', 'gunboat']);
const BANK_NAME = {
    [-2]: 'hard-left',
    [-1]: 'mild-left',
    [0]: 'neutral',
    [1]: 'mild-right',
    [2]: 'hard-right',
};
const DAMAGE_NAME = { 0: 'clean', 1: 'damaged', 2: 'critical' };
export function aircraftSpriteUrl(id, damage = 0, bank = 0) {
    if (!AIRCRAFT_IDS.has(id))
        throw new Error(`Unknown production aircraft art: ${id}`);
    return `art/aircraft-banks/${id}/${BANK_NAME[bank]}-${DAMAGE_NAME[damage]}.png`;
}
export function aircraftHangarSpriteUrl(id) {
    if (!AIRCRAFT_IDS.has(id))
        throw new Error(`Unknown production aircraft hangar art: ${id}`);
    return `art/aircraft-hangar/${id}.png`;
}
export function aircraftPortraitSpriteUrl(id) {
    if (!AIRCRAFT_IDS.has(id))
        throw new Error(`Unknown production aircraft portrait art: ${id}`);
    return `art/aircraft-portraits/${id}.png`;
}
export function aircraftShadowSpriteUrl(id) {
    if (!AIRCRAFT_IDS.has(id))
        throw new Error(`Unknown production aircraft shadow art: ${id}`);
    return `art/aircraft-shadows/${id}.png`;
}
export function aircraftWreckSpriteUrl(id) {
    if (!AIRCRAFT_IDS.has(id))
        throw new Error(`Unknown production aircraft wreck art: ${id}`);
    return `art/aircraft-wrecks/${id}.png`;
}
export function enemySpriteUrl(id) {
    if (!ENEMY_IDS.has(id))
        throw new Error(`Unknown production enemy art: ${id}`);
    return `art/enemies/${id}.png`;
}
export function bossSpriteUrl(id) {
    return `art/bosses/${id}.png`;
}
export function bossComponentSpriteUrl(kind) {
    return `art/bosses/components/${kind}.png`;
}
export function wreckSpriteUrl(assetId) {
    if (AIRCRAFT_IDS.has(assetId))
        return aircraftWreckSpriteUrl(assetId);
    if (assetId === 'aa-turret')
        return 'art/wrecks/aa-turret.png';
    if (assetId === 'missile-battery')
        return 'art/wrecks/missile-battery.png';
    if (assetId === 'armoured-vehicle')
        return 'art/wrecks/armoured-vehicle.png';
    if (assetId === 'fuel-tank')
        return 'art/wrecks/fuel.png';
    if (assetId.includes('cannon-pod') || assetId.includes('missile-deck') || assetId.includes('reactor'))
        return 'art/wrecks/boss-component.png';
    if (assetId === 'leviathan-hull' || assetId === 'breakwater-hull')
        return 'art/wrecks/boss-final.png';
    return null;
}
export function propSpriteUrl(id) { return `art/props/${id}.png`; }
export function effectSpriteUrl(kind) {
    if (kind === 'fire')
        return 'art/effects/fireball-sequence-v2.png';
    if (kind === 'heavy-fire')
        return 'art/effects/fireball-sequence-v2.png';
    if(kind==='smoke')return 'art/effects/smoke-volume-v2.png';
    return `art/effects/${kind}.png`;
}
const ENVIRONMENT_ART = ['water-tile', 'land-tile', 'asphalt-tile', 'concrete-tile', 'dock-metal-tile', 'foam-strip', 'palm', 'rock-cluster', 'container-stack', 'street-lamp', 'crate-pile', 'scenic-wreck', 'rocky-island', 'helipad-mark'];
export function environmentSpriteUrl(id) { return `art/environment/${id}.png`; }
export function allEnvironmentArtUrls() { return ENVIRONMENT_ART.map(environmentSpriteUrl); }
export function allProductionArtUrls() {
    const banks = [-2, -1, 0, 1, 2];
    const damage = [0, 1, 2];
    const craft = [...AIRCRAFT_IDS].flatMap(id => banks.flatMap(bank => damage.map(state => aircraftSpriteUrl(id, state, bank))));
    const presentation = [...AIRCRAFT_IDS].flatMap(id => [aircraftHangarSpriteUrl(id), aircraftPortraitSpriteUrl(id), aircraftShadowSpriteUrl(id), aircraftWreckSpriteUrl(id)]);
    const enemies = [...ENEMY_IDS].map(id => enemySpriteUrl(id));
    const bosses = [bossSpriteUrl('breakwater'), bossSpriteUrl('leviathan'), bossComponentSpriteUrl('cannon-pod'), bossComponentSpriteUrl('missile-deck'), bossComponentSpriteUrl('reactor')];
    const wrecks = ['art/wrecks/aa-turret.png', 'art/wrecks/missile-battery.png', 'art/wrecks/armoured-vehicle.png', 'art/wrecks/ground-generic.png', 'art/wrecks/fuel.png', 'art/wrecks/boss-component.png', 'art/wrecks/boss-final.png'];
    const effects = [effectSpriteUrl('fire'), effectSpriteUrl('heavy-fire'), effectSpriteUrl('smoke'), effectSpriteUrl('splash'), effectSpriteUrl('missile'), effectSpriteUrl('pickup')];
    const props = [propSpriteUrl('fuel-tank'), propSpriteUrl('rescue-marker')];
    return [...craft, ...presentation, ...enemies, ...bosses, ...wrecks, ...effects, ...props, ...allEnvironmentArtUrls()];
}
