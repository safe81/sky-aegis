export function enemyProjectileAsset(attackId) {
    if (attackId.includes('lock'))
        return 'enemy-missile-lock';
    if (attackId === 'lane-sweep')
        return 'enemy-lane-bolt';
    if (attackId === 'projectile-fan')
        return 'enemy-heavy-shell';
    if (attackId === 'aimed-aa')
        return 'enemy-aa-tracer';
    if (attackId === 'moving-cannon')
        return 'enemy-cannon-shell';
    if (attackId === 'deck-barrage')
        return 'enemy-naval-shell';
    if (attackId === 'tracking-turret')
        return 'enemy-gunship-tracer';
    if (attackId === 'aimed-pass')
        return 'enemy-interceptor-bolt';
    return 'enemy-straight-bolt';
}
export class WeaponSystem {
    playerTimers = new Map();
    enemyTimers = new Map();
    playerState(id) {
        let state = this.playerTimers.get(id);
        if (!state) {
            state = { primary: 0, secondary: 0, ability: 0, overclock: 0 };
            this.playerTimers.set(id, state);
        }
        return state;
    }
    updatePlayer(world, player, craft, dt) {
        if (!player.active)
            return;
        const state = this.playerState(player.id);
        state.primary += dt;
        state.secondary += dt;
        state.ability = Math.max(0, state.ability - dt);
        state.overclock = Math.max(0, state.overclock - dt);
        const overclockFactor = state.overclock > 0 ? .68 : 1;
        const cadence = craft.weapon.cadence * overclockFactor;
        while (state.primary + 1e-9 >= cadence) {
            state.primary -= cadence;
            this.firePrimary(world, player, craft);
        }
        if (state.secondary >= craft.secondary.cooldown) {
            state.secondary = 0;
            this.fireSecondary(world, player, craft);
        }
    }
    firePrimary(world, player, craft) {
        const family = craft.weapon.family;
        const count = Math.max(1, craft.weapon.salvo);
        for (let i = 0; i < count; i += 1) {
            const socket = craft.muzzles[i % craft.muzzles.length];
            const spreadIndex = count === 1 ? 0 : (i / (count - 1)) * 2 - 1;
            const angle = spreadIndex * craft.weapon.spread;
            const speed = craft.weapon.projectileSpeed;
            world.spawnProjectile({
                faction: 'player',
                x: player.x + socket.x,
                y: player.y + socket.y,
                vx: Math.sin(angle) * speed,
                vy: -Math.cos(angle) * speed,
                damage: craft.weapon.damage,
                radius: family === 'laser' ? 4 : family === 'minigun' ? 3.4 : 5.5,
                ttl: Math.max(.65, craft.weapon.range / speed + .25),
                sourceId: player.id,
                assetId: `player-${family}-${craft.variant}`,
                pierce: craft.weapon.pierce ?? 0,
                guidance: craft.weapon.homing ?? 0,
            });
        }
        world.emit('weaponFired', { sourceId: player.id, x: player.x, y: player.y, data: { family, weaponId: craft.weapon.id } });
    }
    fireSecondary(world, player, craft) {
        if (craft.id === 'falcon-07' || craft.id === 'raven-9' || craft.id === 'bulldog-4') {
            for (const x of [-20, 20])
                world.spawnProjectile({ faction: 'player', x: player.x + x, y: player.y - 10, vx: x * .5, vy: -700, damage: 18, radius: 5, ttl: 1.8, sourceId: player.id, assetId: 'player-missile-secondary', guidance: .07 });
            return;
        }
        if (craft.id === 'tempest-5' || craft.id === 'specter-x' || craft.id === 'aurora-1') {
            world.spawnProjectile({ faction: 'player', x: player.x, y: player.y - 20, vx: 0, vy: -1600, damage: 32, radius: 5, ttl: 1, sourceId: player.id, assetId: 'player-laser-secondary', pierce: 2 });
            return;
        }
        for (const x of [-28, 0, 28])
            world.spawnProjectile({ faction: 'player', x: player.x + x, y: player.y - 12, vx: x * .7, vy: -620, damage: 20, radius: 5.5, ttl: 2, sourceId: player.id, assetId: 'player-missile-secondary', guidance: .08 });
    }
    updateGuidance(world, dt) {
        for (const p of world.projectiles.values()) {
            if (!p.active || p.guidance <= 0)
                continue;
            if(p.faction==='enemy'&&(p.age<.18||p.age>1.45))continue;
            const targetFaction = p.faction === 'player' ? 'enemy' : 'player';
            const candidates = [...world.entities.values()].filter(e => e.active && e.faction === targetFaction);
            if (candidates.length === 0)
                continue;
            let target = null;
            let best = Infinity;
            for (const enemy of candidates) {
                const dx = enemy.x - p.x;
                const dy = enemy.y - p.y;
                const d2 = dx * dx + dy * dy;
                if (d2 < best) {
                    best = d2;
                    target = enemy;
                }
            }
            if (!target)
                continue;
            const speed = Math.max(1, Math.hypot(p.vx, p.vy));
            const dx = target.x - p.x;
            const dy = target.y - p.y;
            const len = Math.max(1, Math.hypot(dx, dy));
            const desiredX = dx / len * speed;
            const desiredY = dy / len * speed;
            if(p.faction==='enemy'){
                const current=Math.atan2(p.vy,p.vx),desired=Math.atan2(desiredY,desiredX);
                const delta=Math.atan2(Math.sin(desired-current),Math.cos(desired-current));
                const angle=current+Math.max(-.85*dt,Math.min(.85*dt,delta));p.vx=Math.cos(angle)*speed;p.vy=Math.sin(angle)*speed;
            }else{
                const turn=Math.min(.5,1-Math.pow(1-Math.min(.45,p.guidance),dt*60));
                p.vx+=(desiredX-p.vx)*turn;p.vy+=(desiredY-p.vy)*turn;
            }
        }
    }
    updateEnemy(world,enemy,def,player,dt) {
        if(!enemy.active||!player.active||enemy.data.encounterState!=='attack')return;
        const cycle=Number(enemy.data.attackCycle)||0;
        let state=this.enemyTimers.get(enemy.id);
        if(!state||state.cycle!==cycle){state={cycle,shot:0,angle:Number(enemy.data.weaponAngle??Math.atan2(player.y-enemy.y,player.x-enemy.x))};this.enemyTimers.set(enemy.id,state);}
        const timing={
          'straight-burst':[.0,.16,.32,.54], 'aimed-pass':[0,.11,.22],
          'lane-sweep':[0,.16,.32,.48,.64,.8,.96,1.12,1.28,1.44],
          'projectile-fan':[0,.37,.74,1.11,1.48], 'homing-lock':[0,.32,.75,1.05],
          'tracking-turret':[0,.12,.24,.48,.6,.72,.96,1.08,1.2,1.44,1.56,1.68],
          'aimed-aa':[0,.13,.26,.55,.68,.81], 'surface-lock':[0,.35,.8,1.1],
          'moving-cannon':[0,.24,.72], 'deck-barrage':[0,.22,.44,.82,1.04,1.26]
        }[def.attackId]??[0,.2,.4];
        while(state.shot<timing.length&&Number(enemy.data.phaseTime)+1e-8>=timing[state.shot]){
          this.fireEnemyPattern(world,enemy,def,player,state.shot,timing.length,state.angle);state.shot++;
        }
    }
    fireEnemyPattern(world,enemy,def,player,shot=0,count=1,lockedAngle) {
        const base=lockedAngle??Math.atan2(player.y-enemy.y,player.x-enemy.x);
        let offsets=[0],angle=base,muzzles=[0],asset=enemyProjectileAsset(def.attackId);
        if(def.attackId==='straight-burst'){angle=Math.PI/2;muzzles=[-10,10];}
        if(def.attackId==='projectile-fan'){offsets=[-.48,-.32,-.16,0,.16,.32,.48];angle=Math.PI/2+(shot%2?.08:-.08);}
        if(def.attackId==='lane-sweep'){angle=Math.PI/2+(-.55+1.1*shot/Math.max(1,count-1));muzzles=[-18,18];}
        if(def.attackId==='tracking-turret')angle=base+(-.25+.5*shot/Math.max(1,count-1));
        if(def.attackId==='deck-barrage'){muzzles=[shot%2?-22:22];offsets=shot%3===2?[-.14,0,.14]:[0];angle=base+(shot%2?.06:-.06);}
        if(def.attackId.includes('lock'))muzzles=[shot%2?-23:23];
        enemy.data.weaponAngle=angle;enemy.data.muzzleFlash=.07;
        for(const muzzle of muzzles)for(const offset of offsets){const a=angle+offset;
         const p=world.spawnProjectile({faction:'enemy',x:enemy.x+muzzle,y:enemy.y+16,vx:Math.cos(a)*def.projectileSpeed,vy:Math.sin(a)*def.projectileSpeed,damage:def.projectileDamage,radius:def.attackId==='projectile-fan'?6:5.5,ttl:5,sourceId:enemy.id,assetId:asset,guidance:def.attackId.includes('lock')?.018:0});
         p.trail=[];
        }
        world.emit('weaponFired',{sourceId:enemy.id,x:enemy.x,y:enemy.y,data:{family:'enemy',weaponId:def.attackId}});
    }
    activateAbility(world, player, craft) {
        const state = this.playerState(player.id);
        if (state.ability > 0)
            return false;
        state.ability = craft.ability.cooldown;
        const enemies = [...world.entities.values()].filter(e => e.active && e.faction === 'enemy');
        if (craft.id === 'falcon-07') {
            for (const p of world.projectiles.values())
                if (p.active && p.faction === 'enemy' && Math.hypot(p.x - player.x, p.y - player.y) < 230)
                    p.active = false;
            for (const e of enemies)
                if (Math.hypot(e.x - player.x, e.y - player.y) < 230)
                    world.damageEntity(e.id, 35, player.id);
        }
        else if (craft.id === 'raven-9' || craft.id === 'viper-11') {
            state.overclock = 4;
        }
        else if (craft.id === 'bulldog-4' || craft.id === 'aurora-1') {
            player.data.shield = Math.max(Number(player.data.shield ?? 0), craft.id === 'bulldog-4' ? 85 : 110);
        }
        else if (craft.id === 'specter-x') {
            player.data.phase = 1.35;
        }
        else if (craft.id === 'tempest-5') {
            for (const e of enemies)
                if (Math.hypot(e.x - player.x, e.y - player.y) < 300)
                    world.damageEntity(e.id, 58, player.id);
        }
        else if (craft.id === 'wraith-2') {
            for (const p of world.projectiles.values())
                if (p.active && p.faction === 'enemy' && Math.hypot(p.x - player.x, p.y - player.y) < 205) {
                    p.vx *= -1.2;
                    p.vy *= -1.2;
                    p.active = false;
                }
            for (const e of enemies)
                if (Math.hypot(e.x - player.x, e.y - player.y) < 190)
                    world.damageEntity(e.id, 44, player.id);
        }
        else if (craft.id === 'titan-6') {
            enemies.sort((a, b) => a.y - b.y).slice(0, 6).forEach(e => world.damageEntity(e.id, 72, player.id));
        }
        world.emit('abilityActivated', { sourceId: player.id, x: player.x, y: player.y, data: { abilityId: craft.ability.id } });
        return true;
    }
    activateTactical(world, player) {
        const charges = Number(player.data.tacticalCharges ?? 3);
        if (charges <= 0)
            return false;
        player.data.tacticalCharges = charges - 1;
        for (const p of world.projectiles.values())
            if (p.active && p.faction === 'enemy')
                p.active = false;
        for (const e of world.entities.values())
            if (e.active && e.faction === 'enemy')
                world.damageEntity(e.id, 48, player.id);
        world.emit('abilityActivated', { sourceId: player.id, x: player.x, y: player.y, data: { abilityId: 'area-bomb' } });
        return true;
    }
    abilityCooldownRemaining(playerId) {
        return this.playerState(playerId).ability;
    }
}
