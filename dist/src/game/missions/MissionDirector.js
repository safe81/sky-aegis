import {cubic} from '../enemies/EncounterPaths.js';
import { Environment } from "../render/Environment.js";
import { MISSION1_EVENTS, MISSION1_ID, MISSION1_RESCUE_TOTAL } from "../content/mission1.js";
import { PLAYFIELD_WIDTH } from "../constants.js";
const LEVEL1_SCROLL_SPEED=35;
export function computeMedals(o) {
    const ratio = o.eligibleTotal > 0 ? o.eligibleDestroyed / o.eligibleTotal : 0;
    const destroy70 = o.completed && ratio >= .7;
    const destroy100 = o.completed && o.eligibleTotal > 0 && o.eligibleDestroyed >= o.eligibleTotal;
    const allRescued = o.completed && o.rescued >= o.totalRescues;
    const untouched = o.completed && o.noDamage;
    return { destroy70, destroy100, allRescued, untouched, count: [destroy70, destroy100, allRescued, untouched].filter(Boolean).length };
}
export class MissionDirector {
    environment = Environment.build();
    usedSockets = new Set();
    lastScrollDelta = 0;
    time = 0;
    elapsedTime = 0;
    scrollDistance = 0;
    objectives = { eligibleDestroyed: 0, eligibleTotal: 0, rescued: 0, totalRescues: MISSION1_RESCUE_TOTAL, noDamage: true, completed: false };
    message = 'COASTAL INTERCEPT';
    result = null;
    holdForMiniboss = false;
    bossStarted = false;
    nextEvent = 0;
    eligibleIds = new Set();
    destroyedEligible = new Set();
    seenEvents = new Set();
    rescues = new Map();
    settlementDelay = 0;
    runId = '';
    initialHp = 0;
    start(world, player) {
        this.time = 0;
        this.elapsedTime = 0;
        this.scrollDistance = 0;
        this.nextEvent = 0;
        this.objectives = { eligibleDestroyed: 0, eligibleTotal: 0, rescued: 0, totalRescues: MISSION1_RESCUE_TOTAL, noDamage: true, completed: false };
        this.message = 'COASTAL INTERCEPT';
        this.result = null;
        this.holdForMiniboss = false;
        this.bossStarted = false;
        this.eligibleIds.clear();
        this.destroyedEligible.clear();
        this.seenEvents.clear();
        this.rescues.clear();
        this.usedSockets.clear();
        this.settlementDelay = 0;
        this.initialHp = player.maxHp;
        this.runId = `run-${MISSION1_ID}-${Date.now().toString(36)}-${world.nextId('r')}`;
    }
    registerEligibleEntity(entity) {
        if (!entity.medalEligible || this.eligibleIds.has(entity.id))
            return;
        this.eligibleIds.add(entity.id);
        this.objectives.eligibleTotal = this.eligibleIds.size;
    }
    observeWorldEvents(world) {
        for (const event of world.events) {
            if (this.seenEvents.has(event.id))
                continue;
            this.seenEvents.add(event.id);
            if (event.type === 'entityDestroyed' && event.targetId && this.eligibleIds.has(event.targetId) && !this.destroyedEligible.has(event.targetId)) {
                this.destroyedEligible.add(event.targetId);
                this.objectives.eligibleDestroyed = this.destroyedEligible.size;
                world.score += 100;
                world.salvage += 8;
            }
        }
    }
    update(world, player, enemySystem, boss, dt) {
        if (this.result)
            return;
        this.elapsedTime+=dt;
        this.lastScrollDelta=0;
        this.observeWorldEvents(world);
        this.objectives.noDamage = this.objectives.noDamage && player.hp >= this.initialHp;
        if (!player.active || player.destroyed) {
            this.finish(world, false);
            return;
        }
        if (this.holdForMiniboss) {
            boss.updateState(world);
            boss.updateAttacks(world, player, dt);
            if (boss.phase === 'defeated') {
                this.holdForMiniboss = false;
                this.message = 'BREAKWATER DESTROYED';
            }
        }
        else {
            this.time += dt;
            if(!this.bossStarted){this.lastScrollDelta=LEVEL1_SCROLL_SPEED*dt;this.scrollDistance+=this.lastScrollDelta;}
            world.scrollDistance=this.scrollDistance;
            while (this.nextEvent < MISSION1_EVENTS.length && MISSION1_EVENTS[this.nextEvent].at <= this.time + 1e-9) {
                const event = MISSION1_EVENTS[this.nextEvent++];
                this.executeEvent(world, enemySystem, boss, event);
            }
        }
        for(const e of world.entities.values())if(e.active&&e.kind==='prop')e.y+=this.lastScrollDelta;
        this.updateRescues(world, player, dt);
        if (this.bossStarted) {
            boss.updateState(world);
            boss.updateAttacks(world, player, dt);
            if (boss.phase === 'defeated') {
                this.settlementDelay += dt;
                if (this.settlementDelay >= 5.5)
                    this.finish(world, true);
            }
        }
    }
    executeEvent(world, enemies, boss, event) {
        if (event.kind === 'formation') {
            for (let i = 0; i < event.count; i += 1) {
                const e = enemies.spawn(world, event.family, event.xs[i % event.xs.length], event.y - i * 32);
                this.registerEligibleEntity(e);
            }
            this.message = 'HOSTILES INBOUND';
        }
        else if (event.kind === 'mixed') {
            for (const x of event.entries)
                this.registerEligibleEntity(this.spawnAnchoredEnemy(world,enemies,x));
            this.message = 'MULTI-DOMAIN CONTACT';
        }
        else if (event.kind === 'rescue') {
            this.spawnRescue(world, event.id, event.count, event.x, event.y, event.anchorId);
            this.message = 'RESCUE BEACON';
        }
        else if (event.kind === 'miniboss') {
            const socket=this.findSocket(PLAYFIELD_WIDTH/2,210,'boss_zone',event.anchorId);
            boss.spawnBreakwater(world,socket?.x??PLAYFIELD_WIDTH/2,socket?.y??210);
            this.holdForMiniboss = true;
            this.message = 'BREAKWATER GUNSHIP';
        }
        else if (event.kind === 'boss') {
            const socket=this.findSocket(PLAYFIELD_WIDTH/2,210,'boss_zone',event.anchorId);
            boss.spawnLeviathan(world,socket?.x??PLAYFIELD_WIDTH/2,socket?.y??210);
            this.bossStarted = true;
            this.message = 'LEVIATHAN INBOUND';
        }
        else if (event.kind === 'prop') {
            const socket=this.findSocket(event.x,event.y,'prop_pad',event.anchorId);
            world.spawnEntity({kind:'prop',faction:'enemy',x:socket?.x??event.x,y:socket?.y??event.y,hp:event.hp,radius:28,medalEligible:event.medalEligible,interactiveAssetId:event.assetId,destructionPreset:'fuel',data:{propType:event.assetId,socketId:socket?.id,surface:'concrete'}});
        }
        else {
            this.message = event.label;
        }
    }
    findSocket(x,y,role=null,anchorId=null){
        const s=anchorId?this.environment.socketAtAnchor(anchorId,this.scrollDistance,role):this.environment.nearestSocket(x,y,this.scrollDistance,this.usedSockets,role);
        if(s)this.usedSockets.add(s.id);
        return s;
    }
    spawnAnchoredEnemy(world,enemies,entry){
        if(entry.family==='armoured-vehicle'){
            const route=this.environment.routeForRoadVehicle(25,this.scrollDistance,entry.roadId??'coastal-spine');
            if(route){
                const routeOffset=Math.max(0,(entry.y+30)/110)*6,t=routeOffset/18;
                return enemies.spawn(world,entry.family,cubic(...route.x,t),cubic(...route.y,t)+this.scrollDistance,{route,routeOffset,surface:'road'});
            }
        }
        const role=entry.family==='aa-turret'?'aa_pad':entry.family==='missile-battery'?'missile_pad':entry.family==='gunboat'?'water_lane':null;
        if(!role)return enemies.spawn(world,entry.family,entry.x,entry.y);
        const socket=this.findSocket(entry.x,entry.y,role,entry.anchorId);
        return enemies.spawn(world,entry.family,socket?.x??entry.x,socket?.y??entry.y,{socketId:socket?.id,surface:socket?.surface??(role==='water_lane'?'water':'concrete')});
    }
    spawnRescue(world, id, count, x, y, anchorId=null) {
        const socket=this.findSocket(x,y,'rescue_zone',anchorId);if(socket){x=socket.x;y=socket.y;}
        const state = { id, entityIds: [], progress: new Map(), completed: new Set() };
        for (let i = 0; i < count; i += 1) {
            const e = world.spawnEntity({
                id: `${id}-${i + 1}`, kind: 'rescue', faction: 'neutral', x: x + i * 42, y: y + i * 8,
                hp: 1, radius: 20, medalEligible: false, interactiveAssetId: 'rescue-person', destructionPreset: 'none',
                data: { rescue: true, location: id },
            });
            state.entityIds.push(e.id);
            state.progress.set(e.id, 0);
        }
        this.rescues.set(id, state);
    }
    updateRescues(world, player, dt) {
        for (const state of this.rescues.values()) {
            for (const id of state.entityIds) {
                if (state.completed.has(id))
                    continue;
                const e = world.getEntity(id);
                if (!e?.active)
                    continue;
                e.y += this.lastScrollDelta;
                const d = Math.hypot(e.x - player.x, e.y - player.y);
                const next = d <= 70 ? (state.progress.get(id) ?? 0) + dt : Math.max(0, (state.progress.get(id) ?? 0) - dt * .65);
                state.progress.set(id, next);
                e.data.rescueProgress = Math.min(1, next / 1.15);
                world.emit('rescueProgress', { sourceId: player.id, targetId: e.id, x: e.x, y: e.y, amount: Number(e.data.rescueProgress) });
                if (next >= 1.15) {
                    state.completed.add(id);
                    e.active = false;
                    this.objectives.rescued += 1;
                    world.score += 500;
                    world.salvage += 20;
                    world.emit('rescueComplete', { sourceId: player.id, targetId: e.id, x: e.x, y: e.y });
                }
                else if (e.y > 1320) {
                    e.active = false;
                }
            }
        }
    }
    finish(world, completed) {
        if (this.result)
            return;
        this.objectives.completed = completed;
        const medals = computeMedals(this.objectives);
        this.result = {
            runId: this.runId || `run-${MISSION1_ID}-${Date.now().toString(36)}`,
            missionId: MISSION1_ID, completed, score: world.score, salvage: world.salvage,
            rescued: this.objectives.rescued, eligibleDestroyed: this.objectives.eligibleDestroyed, eligibleTotal: this.objectives.eligibleTotal,
            medals, duration: this.elapsedTime,
        };
        world.emit('missionSettled', { data: { completed, medals: medals.count } });
    }
}
