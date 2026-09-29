export const EFFECT_PRESETS = {
    'small-air': { id: 'small-air', fireballs: 1, sparks: 14, fragments: 4, smoke: 3, scale: .72, surface: 'air', shake: 2, flash: .65 },
    'heavy-air': { id: 'heavy-air', fireballs: 3, sparks: 26, fragments: 7, smoke: 6, scale: 1.08, surface: 'air', shake: 3.5, flash: .78 },
    'ground-armour': { id: 'ground-armour', fireballs: 2, sparks: 22, fragments: 8, smoke: 5, scale: .96, surface: 'dust', shake: 3, flash: .72 },
    'fuel': { id: 'fuel', fireballs: 5, sparks: 34, fragments: 6, smoke: 8, scale: 1.25, surface: 'fire', shake: 4.2, flash: .94 },
    'water': { id: 'water', fireballs: 2, sparks: 16, fragments: 5, smoke: 4, scale: 1.02, surface: 'splash', shake: 3.2, flash: .68 },
    'boss-component': { id: 'boss-component', fireballs: 5, sparks: 42, fragments: 10, smoke: 9, scale: 1.42, surface: 'metal', shake: 5.2, flash: .88 },
    'boss-final': { id: 'boss-final', fireballs: 12, sparks: 78, fragments: 18, smoke: 16, scale: 2.05, surface: 'splash', shake: 8.5, flash: 1 },
};
export class EffectsDirector {
    surfaceAt = () => "water";
    pendingReactions = [];
    particles = [];
    flashes = [];
    wrecks = [];
    cameraImpulse = 0;
    quality;
    seen = new Set();
    state = 0x9e3779b9;
    constructor(quality = 'balanced') { this.quality = quality; }
    setQuality(q) { this.quality = q; }
    reset() {
        this.particles = [];
        this.pendingReactions = [];
        this.flashes = [];
        this.wrecks = [];
        this.cameraImpulse = 0;
        this.seen.clear();
        this.state = 0x9e3779b9;
    }
    random() {
        let x = this.state;
        x ^= x << 13;
        x ^= x >>> 17;
        x ^= x << 5;
        this.state = x >>> 0;
        return this.state / 0x100000000;
    }
    consumeEvents(world) {
        for (const event of world.events) {
            if (this.seen.has(event.id))
                continue;
            this.seen.add(event.id);
            if (event.type === 'entityDestroyed')
                this.spawnDestruction(event);
            else if (event.type === 'entityHit')
                this.spawnHit(event);
            else if (event.type === 'rescueComplete')
                this.spawnRescue(event);
            else if (event.type === 'abilityActivated')
                this.spawnAbility(event);
        }
    }
    qualityScale() { return this.quality === 'low' ? .42 : this.quality === 'high' ? 1.18 : .72; }
    spawnDestruction(event) {
        const id = (event.material && event.material in EFFECT_PRESETS ? event.material : 'small-air');
        const preset = EFFECT_PRESETS[id];
        const x = event.x ?? 0, y = event.y ?? 0, q = this.qualityScale();
        this.flashes.push({ x, y, life: .19, maxLife: .19, radius: 136 * preset.scale, alpha: preset.flash, color: '#fff1c4' });
        this.cameraImpulse = Math.max(this.cameraImpulse, preset.shake);
        const firstParticle=this.particles.length;
        const n = (v) => Math.max(1, Math.round(v * q));
        for(let i=0;i<n(preset.fireballs);i++){
            const final=id==='boss-final',spread=final?220:id==='boss-component'?45:12;
            const p=this.makeParticle('fire',x+(this.random()-.5)*spread*2,y+(this.random()-.5)*spread*1.5,preset.scale,i);
            p.maxLife=p.life;p.delay+=i*(final?.16:.045);this.particles.push(p);
        }
        for (let i = 0; i < n(preset.sparks); i += 1)
            this.particles.push(this.makeParticle('spark', x, y, preset.scale, i));
        for (let i = 0; i < n(preset.fragments); i += 1)
            this.particles.push(this.makeParticle('fragment', x, y, preset.scale, i));
        for (let i = 0; i < n(preset.smoke); i += 1)
            this.particles.push(this.makeParticle('smoke', x, y, preset.scale, i));
        if (preset.surface === 'splash') {
            for (let i = 0; i < n(18); i += 1)
                this.particles.push(this.makeParticle('splash', x, y, preset.scale, i));
            for (let i = 0; i < 3; i += 1)
                this.particles.push({ kind: 'ring', x, y, vx: 0, vy: 0, life: .75 + i * .2, maxLife: .75 + i * .2, size: 18 + i * 11, rotation: 0, angular: 0, alpha: .75, color: '#b9f5ff', gravity: 0, delay: .12 + i * .06 });
        }
        else if (preset.surface === 'dust') {
            for (let i = 0; i < n(10); i += 1)
                this.particles.push(this.makeParticle('dust', x, y, preset.scale, i));
        }
        const destroyedAssetId = typeof event.data?.assetId === 'string' ? event.data.assetId : (event.targetId ?? id);
        const persistent = event.data?.kind === 'ground' || event.data?.kind === 'prop';
        for(const p of this.particles.slice(firstParticle)){
            if(p.kind==='fragment'){p.assetId=destroyedAssetId;p.fragmentIndex=Math.floor(this.random()*4);}
            if(persistent&&(p.kind==='smoke'||p.kind==='dust'||p.kind==='fire'))p.worldAnchored=true;
        }
        const residue={x,y,life:persistent?Infinity:10,maxLife:persistent?Infinity:10,rotation:(this.random()-.5)*.3,size:34*preset.scale,surface:preset.surface,assetId:destroyedAssetId,persistent,worldAnchored:true,delay:.25,smokeClock:0};
        if(preset.surface==='air')this.pendingReactions.push({delay:.55,x:x+40,y:y+62,scale:preset.scale,residue});
        else this.wrecks.push(residue);
        const cap=this.quality==='low'?260:this.quality==='high'?900:600;
        if(this.particles.length>cap)this.particles.splice(0,this.particles.length-cap);
    }
    makeParticle(kind, x, y, scale, i) {
        const a = this.random() * Math.PI * 2;
        const r = this.random();
        if (kind === 'spark') {
            const speed = (120 + this.random() * 360) * scale;
            return { kind, x, y, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed, life: .2 + this.random() * .35, maxLife: .55, size: 1.5 + this.random() * 2.1, rotation: a, angular: 0, alpha: 1, color: i % 3 === 0 ? '#fff7d6' : '#ffb44f', gravity: 210, delay: .025 + this.random() * .035 };
        }
        if (kind === 'fragment') {
            const speed = (45 + this.random() * 155) * scale;
            return { kind, x, y, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed, life: .75 + this.random() * .55, maxLife: 1.3, size: (4 + this.random() * 7) * scale, rotation: a, angular: (this.random() - .5) * 9, alpha: 1, color: '#59636b', gravity: 180, delay: .06 + this.random() * .08 };
        }
        if (kind === 'smoke') {
            return { kind, x: x + (this.random() - .5) * 18 * scale, y: y + (this.random() - .5) * 14 * scale, vx: (this.random() - .5) * 30, vy: -18 - this.random() * 30, life: 1.3 + this.random() * 1.1, maxLife: 2.4, size: (29 + this.random() * 33) * scale, rotation: a, angular: (this.random() - .5) * .8, alpha: .58, color: i % 2 ? '#41474d' : '#2c3238', gravity: -2, delay: .14 + this.random() * .14 };
        }
        if (kind === 'splash') {
            const speed = (80 + this.random() * 230) * scale;
            return { kind, x, y, vx: Math.cos(a) * speed * .55, vy: -Math.abs(Math.sin(a) * speed) - 80, life: .4 + this.random() * .5, maxLife: .9, size: 2 + this.random() * 5, rotation: a, angular: 0, alpha: .8, color: '#d8fbff', gravity: 360, delay: .08 + this.random() * .10 };
        }
        if (kind === 'dust') {
            return { kind, x: x + (this.random() - .5) * 20, y: y + (this.random() - .5) * 10, vx: (this.random() - .5) * 70, vy: -25 - this.random() * 45, life: .6 + this.random() * .7, maxLife: 1.3, size: (11 + this.random() * 18) * scale, rotation: a, angular: .2, alpha: .45, color: '#a28e75', gravity: 12, delay: .16 + this.random() * .10 };
        }
        const speed = 18 + this.random() * 75 * scale;
        return { kind: 'fire', x: x + (this.random() - .5) * 18 * scale, y: y + (this.random() - .5) * 18 * scale, vx: Math.cos(a) * speed * .3, vy: -20 - Math.abs(Math.sin(a) * speed), life: .28 + this.random() * .38, maxLife: .66, size: (27 + this.random() * 28) * scale, rotation: a, angular: (this.random() - .5) * 2, alpha: .95, color: r > .62 ? '#fff0a6' : r > .28 ? '#ff9a3d' : '#ff4b2d', gravity: -8, delay: .015 + this.random() * .035 };
    }
    spawnHit(event) {
        const x = event.x ?? 0, y = event.y ?? 0;
        for (let i = 0; i < (this.quality === 'low' ? 2 : 4); i += 1) {
            const a = this.random() * Math.PI * 2;
            this.particles.push({ kind: 'hit', x, y, vx: Math.cos(a) * 120, vy: Math.sin(a) * 120, life: .12, maxLife: .12, size: 2, rotation: a, angular: 0, alpha: .85, color: '#ffe59a', gravity: 0, delay: 0 });
        }
    }
    spawnRescue(event) {
        const x = event.x ?? 0, y = event.y ?? 0;
        this.flashes.push({ x, y, life: .4, maxLife: .4, radius: 38, alpha: .7, color: '#65f4d4' });
        for (let i = 0; i < 10 * this.qualityScale(); i += 1) {
            const a = this.random() * Math.PI * 2;
            this.particles.push({ kind: 'spark', x, y, vx: Math.cos(a) * 80, vy: Math.sin(a) * 80, life: .45, maxLife: .45, size: 2, rotation: a, angular: 0, alpha: .9, color: '#65f4d4', gravity: 0, delay: i * .012 });
        }
    }
    spawnAbility(event) {
        const x = event.x ?? 0, y = event.y ?? 0;
        this.flashes.push({ x, y, life: .35, maxLife: .35, radius: 125, alpha: .5, color: '#65d9ff' });
        for (let i = 0; i < 18 * this.qualityScale(); i += 1) {
            const a = this.random() * Math.PI * 2;
            this.particles.push({ kind: 'ring', x, y, vx: Math.cos(a) * 90, vy: Math.sin(a) * 90, life: .55, maxLife: .55, size: 4, rotation: a, angular: 0, alpha: .8, color: '#65d9ff', gravity: 0, delay: i * .008 });
        }
    }
    update(dt, scrollDelta = 0) {
        for(const impact of this.pendingReactions){
            impact.delay-=dt;impact.y+=scrollDelta;
            if(impact.delay>0)continue;
            const water=this.surfaceAt(impact.x,impact.y)==='water';
            const w=impact.residue;w.x=impact.x;w.y=impact.y;w.surface=water?'splash':'dust';w.persistent=!water;w.life=water?8:Infinity;w.delay=0;this.wrecks.push(w);
            for(let i=0;i<(water?12:7);i++){const p=this.makeParticle(water?'splash':'dust',impact.x,impact.y,impact.scale,i);p.worldAnchored=true;this.particles.push(p);}
            if(water)this.particles.push({kind:'ring',x:impact.x,y:impact.y,vx:0,vy:0,life:1.1,maxLife:1.1,size:18,rotation:0,angular:0,alpha:.8,color:'#b9f5ed',gravity:0,delay:0,worldAnchored:true});
        }
        this.pendingReactions=this.pendingReactions.filter(p=>p.delay>0);
        for (const p of this.particles) {
            if(p.worldAnchored)p.y+=scrollDelta;
            if (p.delay > 0) {
                p.delay = Math.max(0, p.delay - dt);
                continue;
            }
            p.life -= dt;
            p.vy += p.gravity * dt;
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.rotation += p.angular * dt;
            p.alpha = Math.max(0, Math.min(1, p.life / Math.max(.001, p.maxLife)));
            if (p.kind === 'smoke' || p.kind === 'dust')
                p.size += dt * 13;
        }
        this.particles = this.particles.filter(p => p.life > 0);
        for (const f of this.flashes) {
            f.life -= dt;
            f.alpha = Math.max(0, f.life / f.maxLife);
            f.radius += dt * 75;
        }
        this.flashes = this.flashes.filter(f => f.life > 0);
        for (const w of this.wrecks) {
            if(w.worldAnchored||w.persistent)w.y+=scrollDelta;
            w.smokeClock=(w.smokeClock??0)+dt;
            if(w.persistent&&w.smokeClock>.32&&this.particles.length<500){
                w.smokeClock=0;const p=this.makeParticle('smoke',w.x,w.y-.3*w.size,.5,0);p.worldAnchored=true;p.alpha=.35;this.particles.push(p);
            }
            if (w.delay > 0) {
                w.delay = Math.max(0, w.delay - dt);
                continue;
            }
            if (!w.persistent)
                w.life -= dt;
        }
        this.wrecks = this.wrecks.filter(w => w.persistent ? w.y < 1460 && w.y > -220 : w.life > 0);
        this.cameraImpulse = Math.max(0, this.cameraImpulse - dt * 24);
    }
}
