const BASE_COST = { hull: 80, primary: 95, secondary: 110, magnet: 65, tactical: 125 };
export class ProgressionService {
    quote(profile, key) { const level = profile.upgrades[key]; const maxed = level >= 10; return { key, level, nextLevel: Math.min(10, level + 1), cost: maxed ? 0 : Math.round(BASE_COST[key] * Math.pow(1.43, level)), maxed }; }
    canPurchase(profile, key) { const q = this.quote(profile, key); return !q.maxed && profile.salvage >= q.cost; }
    purchase(profile, key) { const q = this.quote(profile, key); if (q.maxed)
        throw new Error(`${key} is already max level`); if (profile.salvage < q.cost)
        throw new Error('Insufficient salvage'); return { ...profile, salvage: profile.salvage - q.cost, upgrades: { ...profile.upgrades, [key]: q.nextLevel } }; }
    playerMultipliers(profile) { return { hp: 1 + profile.upgrades.hull * .055, primary: 1 + profile.upgrades.primary * .065, secondary: 1 + profile.upgrades.secondary * .06, magnet: 1 + profile.upgrades.magnet * .07 }; }
}
