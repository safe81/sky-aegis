import { BREAKWATER, LEVIATHAN } from "../content/enemies.js";
import { PLAYFIELD_WIDTH } from "../constants.js";
export class BossController {
    phase = 'none';
    bossId = '';
    emitted = new Set();
    attackTimers = new Map();
    age=0;
    phaseAge=0;
    entryDuration=3;
    target={x:576,y:260};
    prepareEntrance(x,y,duration){this.age=0;this.phaseAge=0;this.target={x,y};this.entryDuration=duration;this.attackTimers.clear();return -340;}
    spawnBreakwater(world, x = PLAYFIELD_WIDTH / 2, y = 240) {
        this.phase = 'breakwater';
        this.bossId = 'breakwater';
        y=this.prepareEntrance(x,y,2.4);
        world.spawnEntity({ id: 'breakwater-hull', kind: 'boss', faction: 'neutral', x, y, hp: 1, radius: 90, interactiveAssetId: 'breakwater-hull', destructionPreset: 'heavy-air', data: { boss: 'breakwater', hull: true } });
        for (const c of BREAKWATER.components)
            this.spawnComponent(world, c, x, y, 'enemy', 'breakwater');
        this.emitPhase(world, 'breakwater');
    }
    spawnLeviathan(world, x = PLAYFIELD_WIDTH / 2, y = 225) {
        this.phase = 'cannons';
        this.bossId = 'leviathan';
        y=this.prepareEntrance(x,y,3.6);
        world.spawnEntity({ id: 'leviathan-hull', kind: 'boss', faction: 'neutral', x, y, hp: 1, radius: 235, interactiveAssetId: 'leviathan-hull', destructionPreset: 'boss-final', data: { boss: 'leviathan', hull: true } });
        for (const c of LEVIATHAN.components) {
            const faction = c.kind === 'cannon-pod' ? 'enemy' : 'neutral';
            this.spawnComponent(world, c, x, y, faction, 'leviathan');
        }
        this.emitPhase(world, 'cannons');
    }
    spawnComponent(world, c, parentX, parentY, faction, boss) {
        world.spawnEntity({
            id: c.id, kind: 'boss', faction,
            x: parentX + c.x, y: parentY + c.y, hp: c.hp, radius: c.radius,
            medalEligible: false, interactiveAssetId: `${boss}-${c.kind}`, destructionPreset: 'boss-component',
            data: { boss, componentKind: c.kind, localX: c.x, localY: c.y, attackId: c.attackId, telegraphPulse: 0 },
        });
    }
    updateState(world) {
        if (this.phase === 'breakwater') {
            if (BREAKWATER.components.every(c => world.getEntity(c.id)?.destroyed)) {
                this.phase = 'defeated';
                const hull = world.getEntity('breakwater-hull');
                if(hull&&!hull.destroyed)world.damageEntity(hull.id,hull.hp,'breakwater');
                this.emitPhase(world, 'defeated');
            }
            return;
        }
        if (this.bossId !== 'leviathan' || this.phase === 'none' || this.phase === 'defeated')
            return;
        if (this.phase === 'cannons' && LEVIATHAN.components.filter(c => c.kind === 'cannon-pod').every(c => world.getEntity(c.id)?.destroyed)) {
            this.phase = 'missiles';this.phaseAge=0;this.attackTimers.clear();
            for (const c of LEVIATHAN.components.filter(c => c.kind === 'missile-deck')) {
                const e = world.getEntity(c.id);
                if (e && !e.destroyed)
                    e.faction = 'enemy';
            }
            this.emitPhase(world, 'missiles');
        }
        if (this.phase === 'missiles' && LEVIATHAN.components.filter(c => c.kind === 'missile-deck').every(c => world.getEntity(c.id)?.destroyed)) {
            this.phase = 'reactor';this.phaseAge=0;this.attackTimers.clear();
            const reactor = world.getEntity('lev-reactor');
            if (reactor && !reactor.destroyed)
                reactor.faction = 'enemy';
            this.emitPhase(world, 'reactor');
        }
        if (this.phase === 'reactor' && world.getEntity('lev-reactor')?.destroyed) {
            this.phase = 'defeated';
            const hull = world.getEntity('leviathan-hull');
            if (hull && !hull.destroyed)
                world.damageEntity(hull.id, hull.hp, 'lev-reactor');
            for (const p of world.projectiles.values())
                if (p.faction === 'enemy')
                    p.active = false;
            this.emitPhase(world, 'defeated');
        }
    }
    updateAttacks(world,player,dt){
        if(this.phase==='none'||this.phase==='defeated')return;
        this.age+=dt;
        const hull=world.getEntity(`${this.bossId}-hull`);
        const u=Math.min(1,this.age/this.entryDuration),ease=1-Math.pow(1-u,3);
        if(hull){
            hull.x=this.target.x+Math.sin(Math.max(0,this.age-this.entryDuration)*.38)*16;
            hull.y=-340+(this.target.y+340)*ease;
            hull.data.entryProgress=u;
            for(const e of world.entities.values())if(e.data.boss===this.bossId&&e.data.componentKind){e.x=hull.x+Number(e.data.localX);e.y=hull.y+Number(e.data.localY);}
        }
        if(u<1)return;
        this.phaseAge+=dt;
        const ids=this.phase==='breakwater'?['breakwater-left-pod','breakwater-right-pod']:this.phase==='cannons'?['lev-cannon-l','lev-cannon-r']:this.phase==='missiles'?['lev-missile-l','lev-missile-r']:['lev-reactor'];
        const length=this.phase==='reactor'?4.4:this.phase==='missiles'?5.5:3.8;
        for(let index=0;index<ids.length;index++){
            const e=world.getEntity(ids[index]);if(!e?.active||e.destroyed||e.faction!=='enemy')continue;
            const total=Math.max(0,this.phaseAge-index*(this.phase==='missiles'?2.3:1.8));
            if(this.phaseAge<index*(this.phase==='missiles'?2.3:1.8))continue;
            const cycle=Math.floor(total/length),local=total%length;
            const tell=this.phase==='reactor'?.95:this.phase==='missiles'?1.0:.62;
            const times=this.phase==='reactor'?[1.0,1.38,1.76,2.14]:this.phase==='missiles'?[1.05,1.43,1.81]:[.66,.81,.96,1.11];
            let state=this.attackTimers.get(e.id);const token=`${this.phase}:${cycle}`;
            if(!state||state.token!==token){state={token,shot:0,angle:Math.atan2(player.y-e.y,player.x-e.x)};this.attackTimers.set(e.id,state);}
            e.data.telegraphPulse=local<tell?Math.max(.03,local/tell):0;
            if(local<tell){state.angle=Math.atan2(player.y-e.y,player.x-e.x);e.data.weaponAngle=state.angle;}
            while(state.shot<times.length&&local>=times[state.shot]){this.firePattern(world,e,player,state.shot,state.angle,cycle);state.shot++;}
        }
    }
    firePattern(world,source,player,shot=0,angle=Math.PI/2,cycle=0){
        const isMissile=this.phase==='missiles',reactor=this.phase==='reactor';
        const offsets=reactor?[-.75,-.5,-.25,0,.25,.5,.75]:(isMissile?[0]:[-.04,.04]);
        const base=reactor?Math.PI/2+(shot%2?.12:-.12):angle;
        source.data.weaponAngle=base;source.data.muzzleFlash=.09;
        for(const o of offsets){const a=base+o;const speed=isMissile?270:reactor?320+shot*14:440;
            world.spawnProjectile({faction:'enemy',x:source.x,y:source.y+15,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,damage:reactor?14:11,radius:isMissile?7:6,ttl:5,sourceId:source.id,assetId:isMissile?'enemy-missile-boss':reactor?'enemy-heavy-boss':'enemy-aa-tracer',guidance:isMissile?.018:0});
        }
        world.emit('weaponFired',{sourceId:source.id,x:source.x,y:source.y,data:{family:'boss',weaponId:String(source.data.attackId)}});
    }
    currentHp(world) {
        if (this.bossId === 'breakwater') {
            const comps = BREAKWATER.components.map(c => world.getEntity(c.id));
            return { current: comps.reduce((s, e) => s + (e?.hp ?? 0), 0), max: BREAKWATER.hpVisual };
        }
        if (this.bossId === 'leviathan') {
            const comps = LEVIATHAN.components.map(c => world.getEntity(c.id));
            return { current: comps.reduce((s, e) => s + (e?.hp ?? 0), 0), max: LEVIATHAN.hpVisual };
        }
        return { current: 0, max: 0 };
    }
    emitPhase(world, phase) {
        const key = `${this.bossId}:${phase}`;
        if (this.emitted.has(key))
            return;
        this.emitted.add(key);
        world.emit('bossPhase', { sourceId: this.bossId, data: { phase } });
    }
}
