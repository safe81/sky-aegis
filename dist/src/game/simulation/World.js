import { PLAYFIELD_WIDTH, WORLD_HEIGHT } from "../constants.js";
import { sweptCircleHit } from "./geometry.js";
export class World {
    entities = new Map();
    projectiles = new Map();
    events = [];
    tick = 0;
    time = 0;
    score = 0;
    salvage = 0;
    sequence = 0;
    rngState;
    constructor(seed = 0x51a9f00d) {
        this.rngState = seed >>> 0 || 1;
    }
    random() {
        let x = this.rngState;
        x ^= x << 13;
        x ^= x >>> 17;
        x ^= x << 5;
        this.rngState = x >>> 0;
        return this.rngState / 0x100000000;
    }
    nextId(prefix) {
        this.sequence += 1;
        return `${prefix}-${this.sequence.toString(36)}`;
    }
    spawnEntity(def) {
        const id = def.id ?? this.nextId(def.kind);
        if (this.entities.has(id))
            throw new Error(`Duplicate entity id: ${id}`);
        const state = {
            id,
            kind: def.kind,
            faction: def.faction,
            x: def.x,
            y: def.y,
            vx: def.vx ?? 0,
            vy: def.vy ?? 0,
            hp: def.hp,
            maxHp: def.hp,
            radius: def.radius,
            active: true,
            destroyed: false,
            medalEligible: def.medalEligible ?? false,
            interactiveAssetId: def.interactiveAssetId,
            destructionPreset: def.destructionPreset ?? 'small-air',
            tags: [...(def.tags ?? [])],
            data: { ...(def.data ?? {}) },
        };
        this.entities.set(id, state);
        this.emit('entitySpawned', { targetId: id, x: state.x, y: state.y });
        return state;
    }
    spawnProjectile(def) {
        const id = def.id ?? this.nextId('p');
        if (this.projectiles.has(id))
            throw new Error(`Duplicate projectile id: ${id}`);
        const state = {
            id,
            faction: def.faction,
            x: def.x,
            y: def.y,
            previousX: def.x,
            previousY: def.y,
            vx: def.vx,
            vy: def.vy,
            damage: def.damage,
            radius: def.radius,
            ttl: def.ttl,
            sourceId: def.sourceId ?? '',
            assetId: def.assetId ?? (def.faction === 'player' ? 'friendly-bolt' : 'hostile-orb'),
            pierce: Math.max(0, def.pierce ?? 0),
            guidance: Math.max(0, def.guidance ?? 0),
            active: true,
            age: 0,
            hitIds: new Set(),
        };
        this.projectiles.set(id, state);
        this.emit('projectileSpawned', { sourceId: state.sourceId, targetId: id, x: state.x, y: state.y });
        return state;
    }
    getEntity(id) {
        return this.entities.get(id);
    }
    damageEntity(id, amount, sourceId = '') {
        const entity = this.entities.get(id);
        if (!entity || !entity.active || entity.destroyed || amount <= 0)
            return false;
        if (entity.kind === 'player') {
            const phase = Number(entity.data.phase ?? 0);
            const invulnerable = Number(entity.data.invulnerable ?? 0);
            if (phase > 0 || invulnerable > 0)
                return false;
            const shield = Math.max(0, Number(entity.data.shield ?? 0));
            if (shield > 0) {
                const absorbed = Math.min(shield, amount);
                entity.data.shield = shield - absorbed;
                amount -= absorbed;
                this.emit('entityHit', { sourceId, targetId: id, x: entity.x, y: entity.y, amount: 0, data: { shieldAbsorbed: absorbed } });
                if (amount <= 0)
                    return true;
            }
            entity.data.invulnerable = 0.7;
        }
        entity.hp = Math.max(0, entity.hp - amount);
        this.emit('entityHit', { sourceId, targetId: id, x: entity.x, y: entity.y, amount });
        if (entity.hp <= 0 && !entity.destroyed) {
            entity.destroyed = true;
            entity.active = false;
            this.emit('entityDestroyed', {
                sourceId,
                targetId: id,
                x: entity.x,
                y: entity.y,
                material: entity.destructionPreset,
                data: { assetId: entity.interactiveAssetId, kind: entity.kind },
            });
        }
        return true;
    }
    step(dt) {
        this.tick += 1;
        this.time += dt;
        for (const entity of this.entities.values()) {
            if (!entity.active)
                continue;
            entity.x += entity.vx * dt;
            entity.y += entity.vy * dt;
            if (entity.kind === 'player') {
                const phase = Number(entity.data.phase ?? 0);
                const invulnerable = Number(entity.data.invulnerable ?? 0);
                if (phase > 0)
                    entity.data.phase = Math.max(0, phase - dt);
                if (invulnerable > 0)
                    entity.data.invulnerable = Math.max(0, invulnerable - dt);
            }
        }
        const activeTargets = [...this.entities.values()].filter(e => e.active && !e.destroyed);
        for (const projectile of this.projectiles.values()) {
            if (!projectile.active){this.projectiles.delete(projectile.id);continue;}
            if(projectile.assetId.includes('missile')){
                projectile.trail??=[];projectile.trail.push({x:projectile.x,y:projectile.y});
                if(projectile.trail.length>18)projectile.trail.shift();
            }
            projectile.previousX = projectile.x;
            projectile.previousY = projectile.y;
            projectile.x += projectile.vx * dt;
            projectile.y += projectile.vy * dt;
            projectile.age += dt;
            const targetFaction = projectile.faction === 'player' ? 'enemy' : 'player';
            let best = null;
            for (const entity of activeTargets) {
                if (!entity.active || entity.faction !== targetFaction || projectile.hitIds.has(entity.id))
                    continue;
                const t = sweptCircleHit({ x: projectile.previousX, y: projectile.previousY }, { x: projectile.x, y: projectile.y }, { x: entity.x, y: entity.y }, entity.radius + projectile.radius);
                if (t !== null && (!best || t < best.t))
                    best = { entity, t };
            }
            if (best) {
                projectile.hitIds.add(best.entity.id);
                this.damageEntity(best.entity.id, projectile.damage, projectile.sourceId || projectile.id);
                if (projectile.pierce > 0)
                    projectile.pierce -= 1;
                else
                    projectile.active = false;
            }
            if (projectile.active && (projectile.age >= projectile.ttl || projectile.x < -80 || projectile.x > PLAYFIELD_WIDTH + 80 || projectile.y < -120 || projectile.y > WORLD_HEIGHT + 120)) {
                projectile.active = false;
                this.emit('projectileExpired', { sourceId: projectile.id, x: projectile.x, y: projectile.y });
            }
        }
    }
    clearTransientEvents(beforeTick = this.tick) {
        let firstKeep = 0;
        while (firstKeep < this.events.length && this.events[firstKeep].tick < beforeTick)
            firstKeep += 1;
        if (firstKeep > 0)
            this.events.splice(0, firstKeep);
    }
    emit(type, partial = {}) {
        const event = { id: `ev-${this.tick}-${this.nextId('e')}`, tick: this.tick, type, ...partial };
        this.events.push(event);
        return event;
    }
}
