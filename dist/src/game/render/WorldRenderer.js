import { CombatPresentation } from "./CombatPresentation.js";
import { PLAYFIELD_WIDTH, VIEWPORT_WIDTH, WORLD_HEIGHT } from "../constants.js";
import { AIRCRAFT } from "../content/aircraft.js";
import { BREAKWATER, ENEMIES, ENEMY_BY_ID, LEVIATHAN } from "../content/enemies.js";
import { aircraftShadowSpriteUrl, aircraftSpriteUrl, bossComponentSpriteUrl, bossSpriteUrl, effectSpriteUrl, enemySpriteUrl, environmentSpriteUrl, propSpriteUrl, wreckSpriteUrl } from "./ProductionArt.js";
import { CoastalScene } from "./CoastalScene.js";
import { Environment } from "./Environment.js";
import { initialCameraX, updateHorizontalCamera, worldToScreenX } from "../camera/HorizontalCamera.js";
export const RENDER_ORDER = ['water', 'shoreContact', 'structuralShadows', 'authoredTerrain', 'eventLight', 'wrecks', 'surfaceTargets', 'elevatedStructures', 'aircraft', 'friendlyProjectiles', 'effects', 'hostileProjectiles', 'hud'];
export function landmarkDetailBudget(kind) {
    return { road: 12, harbour: 22, dock: 14, bridge: 14, island: 10, crane: 10, warehouse: 14, helipad: 10 }[kind];
}
export function effectiveCameraImpulse(prefersReducedMotion, reduceShake, impulse) {
    return prefersReducedMotion || reduceShake ? 0 : Math.max(0, impulse);
}
export function hostileProjectileStyle(assetId) {
    if (assetId.includes('missile'))
        return 'missile';
    if (assetId.includes('tracer') || assetId.includes('interceptor'))
        return 'tracer';
    if (assetId.includes('heavy'))
        return 'heavy';
    if (assetId.includes('naval') || assetId.includes('cannon-shell'))
        return 'shell';
    if (assetId.includes('lane'))
        return 'lane';
    return 'orb';
}
export function enemyTelegraphStyle(attackId) {
    if (attackId.includes('lock'))
        return 'lock';
    if (attackId === 'lane-sweep')
        return 'lane';
    if (attackId === 'projectile-fan' || attackId === 'deck-barrage')
        return 'fan';
    if (attackId === 'aimed-aa' || attackId === 'moving-cannon' || attackId === 'tracking-turret' || attackId === 'aimed-pass')
        return 'aim';
    return 'muzzle';
}
export function particleRenderStyle(kind) {
    if (kind === 'fire')
        return 'radial-fire';
    if (kind === 'smoke')
        return 'soft-smoke';
    if (kind === 'dust')
        return 'soft-dust';
    if (kind === 'spark' || kind === 'hit')
        return 'energy-streak';
    if (kind === 'fragment')
        return 'metal-fragment';
    if (kind === 'splash')
        return 'water-streak';
    return 'expanding-ring';
}
export function decorationRenderPhase(surface) {
    return surface === 'water' || surface === 'land' ? 'under-structures' : 'over-structures';
}
export function entitySurfaceFx(domain) {
    if (domain === 'naval')
        return 'wake-shadow';
    if (domain === 'ground')
        return 'dust-shadow';
    return 'altitude-shadow';
}
export function damageStateForHp(hp, maxHp) {
    const ratio = maxHp > 0 ? hp / maxHp : 0;
    return ratio > .72 ? 0 : ratio > .38 ? 1 : 2;
}
export function wreckVisualSource(assetId) {
    if (AIRCRAFT.some(c => c.id === assetId))
        return 'aircraft';
    if (ENEMIES.some(e => e.id === assetId))
        return 'enemy';
    if (assetId === 'breakwater-hull' || assetId === 'leviathan-hull')
        return 'boss';
    if (assetId.includes('cannon-pod') || assetId.includes('missile-deck') || assetId.includes('reactor'))
        return 'component';
    return 'generic';
}
export class WorldRenderer {
    canvas;
    ctx;
    rendererName = 'Authored Level 1 geography / modular terrain + structures / live water + atmosphere';
    scene;
    combat;
    quality = 'balanced';
    viewTop = 0;
    viewHeight = 1280;
    frame = null;
    container;
    cache = new Map();
    projectileSprites = new Map();
    environment = Environment.build(0x20260910);
    lastPlayerX = PLAYFIELD_WIDTH / 2;
    cameraX = initialCameraX(PLAYFIELD_WIDTH / 2);
    lastFrameAt = 0;
    frameIntervals = [];
    reducedMotion = false;
    reduceShake = false;
    constructor(container, reduceShake = false) {
        this.container = container;
        this.canvas = document.createElement('canvas');
        this.canvas.className = 'game-canvas';
        this.canvas.width = VIEWPORT_WIDTH;
        this.canvas.height = WORLD_HEIGHT;
        this.canvas.setAttribute('aria-label', 'Sky Aegis combat field');
        const ctx = this.canvas.getContext('2d', { alpha: false, desynchronized: true });
        if (!ctx)
            throw new Error('Canvas 2D renderer unavailable');
        this.ctx = ctx;
        this.reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
        this.reduceShake = reduceShake;
        this.scene = new CoastalScene(this);
        this.combat = new CombatPresentation(this);
    }
    mount() {
        if (!this.canvas.parentElement)
            this.container.append(this.canvas);
        this.resize();
    }
    setQuality(value){this.quality=value;this.scene.water.quality=value;this.resize();}
    setReduceShake(value) { this.reduceShake = value; }
    resize() {
        const dpr = Math.min(this.quality==='low'?1:2, window.devicePixelRatio || 1);
        const rect = this.container.getBoundingClientRect();
        // Keep simulation coordinates at 720 wide; backing pixels follow the
        // actual display, avoiding a 1440-pixel canvas on a 430-pixel phone.
        const targetW = Math.max(1, Math.round(Math.max(1,rect.width) * dpr));
        const renderScale=targetW/VIEWPORT_WIDTH;
        this.viewHeight = Math.max(WORLD_HEIGHT, VIEWPORT_WIDTH * rect.height / Math.max(1,rect.width));
        this.viewTop = (WORLD_HEIGHT-this.viewHeight)/2;
        const targetH = Math.max(1, Math.round(this.viewHeight * renderScale));
        if (this.canvas.width !== targetW || this.canvas.height !== targetH) {
            this.canvas.width = targetW;
            this.canvas.height = targetH;
        }
        this.ctx.setTransform(renderScale, 0, 0, renderScale, 0, 0);
        this.ctx.imageSmoothingEnabled = true;
    }
    async preloadAssets(activeCraftId) {
        const requests = [];
        for (const craft of AIRCRAFT.filter(c=>!activeCraftId||c.id===activeCraftId)) {
            const craftWreck = wreckSpriteUrl(craft.id);
            if (craftWreck)
                requests.push(this.preload(`wreck:${craft.id}`, craftWreck));
            for (const bank of [-2, -1, 0, 1, 2]) {
                for (const damage of [0, 1, 2])
                    requests.push(this.preload(`craft:${craft.id}:${damage}:${bank}`, aircraftSpriteUrl(craft.id, damage, bank)));
            }
        }
        for (const enemy of ENEMIES)
            requests.push(this.preload(`enemy:${enemy.id}`, enemySpriteUrl(enemy.id)));
        requests.push(this.preload('boss:breakwater', bossSpriteUrl('breakwater')));
        requests.push(this.preload('boss:leviathan', bossSpriteUrl('leviathan')));
        requests.push(this.preload('component:cannon-pod', bossComponentSpriteUrl('cannon-pod')));
        requests.push(this.preload('component:missile-deck', bossComponentSpriteUrl('missile-deck')));
        requests.push(this.preload('component:reactor', bossComponentSpriteUrl('reactor')));
        for (const kind of ['fire', 'heavy-fire', 'smoke', 'splash', 'missile', 'pickup'])
            requests.push(this.preload(`fx:${kind}`, effectSpriteUrl(kind)));
        requests.push(this.preload('prop:fuel-tank', propSpriteUrl('fuel-tank')));
        requests.push(this.preload('prop:rescue-marker', propSpriteUrl('rescue-marker')));
        for (const id of ['aa-turret', 'missile-battery', 'armoured-vehicle', 'fuel-tank', 'leviathan-hull', 'breakwater-hull', 'leviathan-reactor']) {
            const url = wreckSpriteUrl(id);
            if (url)
                requests.push(this.preload(`wreck:${id}`, url));
        }
        requests.push(this.preload('wreck:component',wreckSpriteUrl('cannon-pod')));
        await Promise.all(requests);
        await this.scene.prepare();
    }
    preload(key, src) {
        const existing = this.cache.get(key);
        if (existing?.ready)
            return Promise.resolve();
        return new Promise(resolve => {
            const image = new Image();
            const record = { image, ready: false };
            this.cache.set(key, record);
            image.onload = () => { record.ready = true; resolve(); };
            image.onerror = () => { record.ready = false; resolve(); };
            image.src = src;
        });
    }
    getImage(key, src) {
        let record = this.cache.get(key);
        if (!record) {
            const image = new Image();
            record = { image, ready: false };
            this.cache.set(key, record);
            image.onload = () => { record.ready = true; };
            image.src = src();
        }
        return record.ready ? record.image : null;
    }
    tileImage(ctx, img, x, y, w, h, tileW, tileH, offsetX = 0, offsetY = 0) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(x, y, w, h);
        ctx.clip();
        let sx = x - ((offsetX % tileW) + tileW) % tileW;
        while (sx > x)
            sx -= tileW;
        let sy = y - ((offsetY % tileH) + tileH) % tileH;
        while (sy > y)
            sy -= tileH;
        for (let yy = sy; yy < y + h; yy += tileH)
            for (let xx = sx; xx < x + w; xx += tileW)
                ctx.drawImage(img, xx, yy, tileW, tileH);
        ctx.restore();
    }
    render(frame) {
        const now = performance.now();
        if (this.lastFrameAt) {
            this.frameIntervals.push(now - this.lastFrameAt);
            if (this.frameIntervals.length > 600)
                this.frameIntervals.shift();
        }
        this.lastFrameAt = now;
        this.frame=frame;
        const { world, mission, craft, effects, boss, elapsed } = frame;
        const ctx = this.ctx;
        ctx.clearRect(0, 0, VIEWPORT_WIDTH, this.viewHeight);
        const player = world.getEntity('player');
        if (player)
            this.cameraX = updateHorizontalCamera(player.x, this.cameraX);
        // Only world-space content moves with horizontal camera and camera impulse.
        // HUD/threat indicators remain anchored to the phone viewport.
        ctx.save();
        const shake = effectiveCameraImpulse(this.reducedMotion, this.reduceShake, effects.cameraImpulse);
        if (shake > 0)
            ctx.translate((Math.sin(elapsed * 77) * shake), (Math.cos(elapsed * 61) * shake * .7));
        ctx.translate(-this.cameraX, -this.viewTop);
        const terrainStart=performance.now();
        this.scene.draw(ctx,mission.scrollDistance,elapsed,this.viewTop,this.viewTop+this.viewHeight);
        const combatStart=performance.now();
        this.combat.lights(ctx,effects,world,craft);
        this.drawWrecks(ctx, effects);
        this.drawEntities(ctx, world, craft, 'surface');
        this.scene.drawElevated(ctx,mission.scrollDistance,elapsed);
        this.drawEntities(ctx, world, craft, 'air');
        this.drawProjectiles(ctx, world, 'player');
        this.drawEffects(ctx, effects);
        this.drawProjectiles(ctx, world, 'enemy');
        ctx.restore();
        this.drawWorldGrade(ctx, elapsed);
        this.drawThreatMarkers(ctx, world, this.cameraX);
        if(this.profileLayers)ctx.getImageData(0,0,1,1);
        this.renderCosts={terrainMs:combatStart-terrainStart,combatMs:performance.now()-combatStart};

    }
    metrics() {
        const a = [...this.frameIntervals].sort((x, y) => x - y);
        const p = (q) => a.length ? a[Math.min(a.length - 1, Math.floor((a.length - 1) * q))] : 0;
        return { p50: p(.5), p95: p(.95), p99: p(.99), samples: a.length };
    }
    drawWorldGrade(ctx, elapsed = 0) {
        ctx.save();
        const key=ctx.createLinearGradient(0,0,VIEWPORT_WIDTH,this.viewHeight);
        key.addColorStop(0,'rgba(255,232,179,.055)');key.addColorStop(.42,'rgba(104,183,175,.012)');key.addColorStop(1,'rgba(4,24,35,.13)');
        ctx.fillStyle=key;ctx.fillRect(0,0,VIEWPORT_WIDTH,this.viewHeight);
        const vig=ctx.createRadialGradient(VIEWPORT_WIDTH*.5,this.viewHeight*.46,VIEWPORT_WIDTH*.18,VIEWPORT_WIDTH*.5,this.viewHeight*.48,Math.max(VIEWPORT_WIDTH,this.viewHeight)*.72);
        vig.addColorStop(0,'rgba(0,0,0,0)');vig.addColorStop(.72,'rgba(0,8,12,.025)');vig.addColorStop(1,'rgba(0,7,13,.18)');
        ctx.fillStyle=vig;ctx.fillRect(0,0,VIEWPORT_WIDTH,this.viewHeight);
        ctx.globalCompositeOperation='screen';ctx.globalAlpha=.16+.03*Math.sin(elapsed*.23);
        const haze=ctx.createRadialGradient(VIEWPORT_WIDTH*.14,this.viewHeight*.12,0,VIEWPORT_WIDTH*.14,this.viewHeight*.12,VIEWPORT_WIDTH*.72);
        haze.addColorStop(0,'rgba(255,220,154,.18)');haze.addColorStop(1,'rgba(255,220,154,0)');ctx.fillStyle=haze;ctx.fillRect(0,0,VIEWPORT_WIDTH,this.viewHeight);
        ctx.restore();
    }
    wreckImage(assetId) {
        if(wreckVisualSource(assetId)==='component')return this.cache.get('wreck:component')?.image??null;
        const dedicated = wreckSpriteUrl(assetId);
        if (dedicated)
            return this.getImage(`wreck:${assetId}`, () => dedicated);
        const source = wreckVisualSource(assetId);
        if (source === 'aircraft')
            return this.getImage(`wreck:aircraft:${assetId}`, () => aircraftSpriteUrl(assetId, 2));
        if(source==='enemy')return this.cache.get(`enemy:${assetId}`)?.image??null;
        if (source === 'boss')
            return this.getImage(`wreck:boss:${assetId}`, () => bossSpriteUrl(assetId === 'breakwater-hull' ? 'breakwater' : 'leviathan'));
        if (source === 'component')
            return this.getImage(`wreck:component:${assetId}`, () => wreckSpriteUrl(assetId) ?? bossComponentSpriteUrl(assetId.includes('missile-deck') ? 'missile-deck' : assetId.includes('reactor') ? 'reactor' : 'cannon-pod'));
        return null;
    }
    imageBox(image, maxWidth, maxHeight) {
        const iw = Math.max(1, image.naturalWidth || image.width || 1), ih = Math.max(1, image.naturalHeight || image.height || 1);
        const scale = Math.min(maxWidth / iw, maxHeight / ih);
        return { width: iw * scale, height: ih * scale };
    }
    drawWrecks(ctx, effects) {
        for (const w of effects.wrecks) {
            if (w.delay > 0)
                continue;
            const a = w.persistent ? .98 : Math.min(.9, Math.max(0, w.life / 1.7));
            const source = wreckVisualSource(w.assetId), dedicated = Boolean(wreckSpriteUrl(w.assetId)), img = this.wreckImage(w.assetId);
            ctx.save();
            ctx.translate(w.x, w.y);
            ctx.rotate(w.rotation);
            if (w.surface === 'splash') {
                ctx.globalAlpha = a * .74;
                ctx.strokeStyle = 'rgba(213,250,255,.82)';
                ctx.lineWidth = 4;
                ctx.beginPath();
                ctx.ellipse(0, 5, w.size * 1.7, w.size * .5, 0, 0, Math.PI * 2);
                ctx.stroke();
                ctx.globalAlpha = a * .2;
                ctx.fillStyle = 'rgba(178,237,245,.64)';
                ctx.beginPath();
                ctx.ellipse(0, 7, w.size * 1.5, w.size * .36, 0, 0, Math.PI * 2);
                ctx.fill();
            }
            else {
                ctx.globalAlpha = a * .65;
                ctx.fillStyle = 'rgba(14,16,15,.82)';
                ctx.beginPath();
                ctx.ellipse(5, 10, w.size * 1.35, w.size * .56, .12, 0, Math.PI * 2);
                ctx.fill();
                ctx.globalAlpha = a * .32;
                ctx.strokeStyle = 'rgba(181,80,37,.62)';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.ellipse(1, 6, w.size * .92, w.size * .38, .16, 0, Math.PI * 2);
                ctx.stroke();
            }
            if (img) {
                const maxW = w.size * (source === 'boss' ? 9.4 : source === 'component' ? 4.8 : source === 'aircraft' ? 4.4 : dedicated ? 5.1 : 3.9);
                const maxH = w.size * (source === 'boss' ? 6.8 : source === 'component' ? 4.3 : source === 'aircraft' ? 4.5 : dedicated ? 4.5 : 4.0);
                const box = this.imageBox(img, maxW, maxH);
                ctx.globalAlpha = a * (w.surface === 'splash' ? .62 : .94);
                if (!dedicated)
                    ctx.filter = 'grayscale(.8) brightness(.52) contrast(1.18) sepia(.15)';
                ctx.drawImage(img, -box.width / 2, -box.height / 2 - (w.surface === 'splash' ? 8 : 0), box.width, box.height);
                ctx.filter = 'none';
            }
            // Persistent ground wrecks keep a low ember so destroyed armour remains visually alive until it scrolls away.
            if (w.persistent && w.surface !== 'splash') {
                ctx.globalAlpha = .68;
                const g = ctx.createRadialGradient(-4, -4, 0, -4, -4, Math.max(10, w.size * .62));
                g.addColorStop(0, 'rgba(255,188,77,.8)');
                g.addColorStop(.35, 'rgba(255,76,24,.42)');
                g.addColorStop(1, 'rgba(255,40,12,0)');
                ctx.fillStyle = g;
                ctx.beginPath();
                ctx.arc(-4, -4, Math.max(10, w.size * .62), 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();
        }
    }
    drawEntities(ctx, world, craft, pass) {
        for (const e of world.entities.values()) {
            if (e.id === 'player')
                continue;
            const isSurface = e.kind === 'ground' || e.kind === 'naval' || e.kind === 'prop' || e.kind === 'rescue' || e.data.boss==='leviathan';
            if ((pass === 'surface') !== isSurface)
                continue;
            if (!e.active && !e.destroyed)
                continue;
            if (e.destroyed)
                continue; // destruction is rendered by EffectsDirector wreckage, never by a faded live sprite
            if (e.kind === 'rescue') {
                if (e.active)
                    this.drawRescue(ctx, e);
                continue;
            }
            if (e.kind === 'pickup') {
                if (e.active)
                    this.drawPickup(ctx, e);
                continue;
            }
            if (e.kind === 'prop') {
                if (e.active)
                    this.drawInteractiveProp(ctx, e);
                continue;
            }
            if (e.data.hull === true) {
                this.drawBossHull(ctx, e);
                continue;
            }
            if (e.kind === 'boss') {
                this.drawBossComponent(ctx, e);
                continue;
            }
            const enemyId = e.data.enemyId;
            if (typeof enemyId === 'string')
                this.drawEnemy(ctx, e, enemyId, world);
        }
        if (pass === 'air') {
            const player = world.getEntity('player');
            if (player)
                this.drawPlayer(ctx, player, craft);
        }
    }
    drawInteractiveProp(ctx, e) {
        const span = 108;
        this.drawEntitySurfaceFx(ctx, e, 'ground', span, span * .78);
        const img = this.getImage('prop:fuel-tank', () => propSpriteUrl('fuel-tank'));
        ctx.save();
        if (img) {
            const box = this.imageBox(img, span, span * .82);
            ctx.drawImage(img, e.x - box.width / 2, e.y - box.height / 2, box.width, box.height);
        }
        else {
            const g = ctx.createLinearGradient(e.x - span * .35, e.y, e.x + span * .35, e.y);
            g.addColorStop(0, '#384149');
            g.addColorStop(.5, '#aeb9bc');
            g.addColorStop(1, '#30383e');
            ctx.fillStyle = g;
            ctx.strokeStyle = 'rgba(235,244,246,.55)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.roundRect(e.x - span * .34, e.y - span * .28, span * .68, span * .56, 10);
            ctx.fill();
            ctx.stroke();
        }
        const ratio = e.maxHp > 0 ? e.hp / e.maxHp : 0;
        if (ratio < .68) {
            const alpha = .15 + (1 - ratio) * .35;
            ctx.globalAlpha = alpha;
            ctx.fillStyle = '#2f363b';
            for (let i = 0; i < 3; i++) {
                ctx.beginPath();
                ctx.arc(e.x - 12 + i * 10, e.y - 34 - i * 5, 7 + i * 2, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        if (ratio < 1) {
            ctx.globalAlpha = 1;
            ctx.fillStyle = 'rgba(0,0,0,.62)';
            ctx.fillRect(e.x - 34, e.y - 49, 68, 4);
            ctx.fillStyle = '#ff9b45';
            ctx.fillRect(e.x - 34, e.y - 49, 68 * Math.max(0, ratio), 4);
        }
        ctx.restore();
    }
    drawEntitySurfaceFx(ctx, e, domain, spanW, spanH) {
        const fx = entitySurfaceFx(domain);
        ctx.save();
        if (fx === 'altitude-shadow') {
            const ox = domain === 'player' ? 20 : 15, oy = domain === 'player' ? 34 : 28;
            const g = ctx.createRadialGradient(e.x + ox, e.y + oy, 0, e.x + ox, e.y + oy, Math.max(18, spanW * .48));
            g.addColorStop(0, 'rgba(0,0,0,.34)');
            g.addColorStop(.62, 'rgba(0,0,0,.2)');
            g.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.ellipse(e.x + ox, e.y + oy, spanW * .48, Math.max(7, spanH * .16), .12, 0, Math.PI * 2);
            ctx.fill();
        }
        else if (fx === 'dust-shadow') {
            ctx.fillStyle = 'rgba(0,0,0,.33)';
            ctx.beginPath();
            ctx.ellipse(e.x + 5, e.y + 9, spanW * .43, spanH * .28, .08, 0, Math.PI * 2);
            ctx.fill();
            const speed = Math.hypot(e.vx, e.vy);
            if (speed > 8) {
                const dirY = e.vy >= 0 ? -1 : 1;
                for (let i = 0; i < 3; i++) {
                    const r = 7 + i * 4;
                    const g = ctx.createRadialGradient(e.x + (i - 1) * 8, e.y + dirY * (spanH * .3 + i * 8), 0, e.x + (i - 1) * 8, e.y + dirY * (spanH * .3 + i * 8), r);
                    g.addColorStop(0, 'rgba(176,153,112,.22)');
                    g.addColorStop(1, 'rgba(176,153,112,0)');
                    ctx.fillStyle = g;
                    ctx.beginPath();
                    ctx.arc(e.x + (i - 1) * 8, e.y + dirY * (spanH * .3 + i * 8), r, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        }
        else this.combat.wake(ctx,e,spanW,spanH,this.frame?.elapsed??0);
        ctx.restore();
    }
    drawPlayer(ctx, p, craft) {
        const dx = p.x - this.lastPlayerX;
        this.lastPlayerX = p.x;
        const bank = dx > 6 ? 2 : dx > 1 ? 1 : dx < -6 ? -2 : dx < -1 ? -1 : 0;
        const damage = damageStateForHp(p.hp, p.maxHp);
        const img = this.getImage(`craft:${craft.id}:${damage}:${bank}`, () => aircraftSpriteUrl(craft.id, damage, bank));
        ctx.save();
        ctx.globalAlpha = p.data.phase ? 0.48 : 1;
        const shadow = img;
        if (shadow) {
            const box=this.imageBox(shadow,craft.width*1.62,craft.width*1.56);
            this.combat.shadow(ctx,shadow,p.x,p.y,box.width,box.height,66,bank*.01);
        }
        else
            this.drawEntitySurfaceFx(ctx, p, 'player', craft.width * 1.55, craft.width * 1.35);
        const exhaustColor = craft.weapon.family === 'laser' ? '#43d9ff' : craft.weapon.family === 'missile' ? '#ff9b39' : '#59f187';
        for (const ex of craft.exhausts) {
            const gx = p.x + ex.x, gy = p.y + ex.y + 8;
            const flame = ctx.createLinearGradient(gx, gy - 4, gx, gy + 34);
            flame.addColorStop(0, 'rgba(255,255,255,.95)');
            flame.addColorStop(.2, exhaustColor);
            flame.addColorStop(1, 'rgba(20,180,255,0)');
            ctx.fillStyle = flame;
            ctx.beginPath();
            ctx.moveTo(gx - 3, gy);
            ctx.quadraticCurveTo(gx, gy + 34, gx + 3, gy);
            ctx.closePath();
            ctx.fill();
        }
        if (img) {
            const box = this.imageBox(img, craft.width * 1.68, craft.width * 1.62);
            ctx.save();ctx.translate(p.x,p.y);ctx.rotate(bank*.010);
            ctx.shadowBlur=9;ctx.shadowColor=exhaustColor;ctx.globalAlpha=.92;ctx.drawImage(img,-box.width/2,-box.height/2,box.width,box.height);
            ctx.shadowBlur=0;ctx.globalAlpha=1;ctx.drawImage(img,-box.width/2,-box.height/2,box.width,box.height);
            ctx.globalCompositeOperation='screen';ctx.globalAlpha=.12;ctx.filter='brightness(1.35) contrast(1.08)';ctx.drawImage(img,-box.width/2-1.5,-box.height/2-2.5,box.width,box.height);
            ctx.filter='none';ctx.globalCompositeOperation='source-over';ctx.globalAlpha=1;ctx.restore();
        }
        else
            this.drawCraftFallback(ctx, p.x, p.y, craft.width, craft.weapon.family);
        if (Number(p.data.shield ?? 0) > 0) {
            const g = ctx.createRadialGradient(p.x, p.y, 20, p.x, p.y, craft.width * .88);
            g.addColorStop(.58, 'rgba(95,224,255,.03)');
            g.addColorStop(.82, 'rgba(95,224,255,.14)');
            g.addColorStop(1, 'rgba(95,224,255,.64)');
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.arc(p.x, p.y, craft.width * .88, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = 'rgba(154,243,255,.85)';
            ctx.lineWidth = 2;
            ctx.stroke();
        }
        if (p.hp / p.maxHp < .7) {
            ctx.globalAlpha = .15 + (1 - p.hp / p.maxHp) * .34;
            ctx.fillStyle = '#30383e';
            for (const ex of craft.exhausts.slice(0, 2)) {
                ctx.beginPath();
                ctx.arc(p.x + ex.x, p.y + ex.y + Math.random() * 8, 7 + Math.random() * 6, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        ctx.restore();
    }
    drawCraftFallback(ctx, x, y, size, family) {
        ctx.save();
        ctx.translate(x, y);
        ctx.fillStyle = family === 'laser' ? '#43cfff' : family === 'missile' ? '#ff9a42' : '#62e88a';
        ctx.beginPath();
        ctx.moveTo(0, -size * .6);
        ctx.lineTo(-size * .48, size * .28);
        ctx.lineTo(-size * .18, size * .2);
        ctx.lineTo(0, size * .55);
        ctx.lineTo(size * .18, size * .2);
        ctx.lineTo(size * .48, size * .28);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }
    drawEnemyReadabilityHalo(ctx, e, accent, spanW, spanH) {
        const radius = Math.max(spanW, spanH) * .58;
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        const glow = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, radius);
        glow.addColorStop(0, 'rgba(255,255,255,.10)');
        glow.addColorStop(.28, accent + '22');
        glow.addColorStop(.7, accent + '0e');
        glow.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.ellipse(e.x, e.y, radius, radius * .62, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
    drawEnemy(ctx,e,id,world){
        const def=ENEMY_BY_ID.get(id);if(!def)return;
        const scale=def.domain==='air'?(id==='armoured-bomber'||id==='gunship'?4.7:4.05):def.domain==='naval'?4.45:3.9;
        const maxW=Math.max(68,def.radius*scale),maxH=Math.max(70,def.radius*(def.domain==='naval'?5.15:4.55));
        const img=this.getImage(`enemy:${id}`,()=>enemySpriteUrl(id));
        const bank=Number(e.data.bank)||0,rotation=def.domain==='air'&&id!=='gunship'?Math.PI+bank:0;
        if(img){
            const box=this.imageBox(img,maxW*1.03,maxH*1.03),accent=def.art?.accent??'#ff8254';
            if(def.domain==='air')this.combat.shadow(ctx,img,e.x,e.y,box.width,box.height,id==='gunship'?48:60,rotation);
            else this.drawEntitySurfaceFx(ctx,e,def.domain,maxW,maxH);
            this.drawEnemyReadabilityHalo(ctx,e,accent,box.width,box.height);
            ctx.save();ctx.translate(e.x,e.y);ctx.rotate(rotation);
            ctx.shadowBlur=7;ctx.shadowColor=accent;ctx.globalAlpha=.92;ctx.drawImage(img,-box.width/2,-box.height/2,box.width,box.height);
            ctx.shadowBlur=0;ctx.globalAlpha=1;ctx.drawImage(img,-box.width/2,-box.height/2,box.width,box.height);
            ctx.globalCompositeOperation='screen';ctx.globalAlpha=.085;ctx.filter='brightness(1.28)';ctx.drawImage(img,-box.width/2-1,-box.height/2-1.5,box.width,box.height);
            ctx.filter='none';ctx.globalCompositeOperation='source-over';ctx.globalAlpha=1;ctx.restore();
        }
        this.combat.articulatedWeapon(ctx,e,this.frame?.elapsed??0);
        if(e.hp<e.maxHp){ctx.fillStyle='#0b2628bb';ctx.fillRect(e.x-maxW*.3,e.y-maxH*.5,maxW*.6,4);ctx.fillStyle='#f17c67';ctx.fillRect(e.x-maxW*.3,e.y-maxH*.5,maxW*.6*e.hp/e.maxHp,4);}
        const telegraph=Number(e.data.telegraphPulse)||0;
        if(telegraph>0)this.drawEnemyTelegraph(ctx,e,def.attackId,telegraph,{x:Number(e.data.lockX??world.getEntity('player')?.x),y:Number(e.data.lockY??world.getEntity('player')?.y)});
    }
    drawEnemyTelegraph(ctx, e, attackId, pulse, player) {
        const style = enemyTelegraphStyle(attackId);
        const p = .25 + .75 * pulse;
        ctx.save();
        ctx.globalAlpha = .25 + .65 * p;
        ctx.translate(e.x, e.y);
        ctx.shadowBlur = 12;
        ctx.shadowColor = '#ff4f85';
        ctx.strokeStyle = '#ff638f';
        ctx.fillStyle = 'rgba(255,73,122,.16)';
        if (style === 'lock') {
            const r = 25 + 12 * p;
            ctx.lineWidth = 2.2;
            ctx.setLineDash([8, 5]);
            ctx.beginPath();
            ctx.arc(0, 0, r, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
            for (let i = 0; i < 4; i++) {
                const a = i * Math.PI / 2;
                ctx.beginPath();
                ctx.moveTo(Math.cos(a) * (r - 8), Math.sin(a) * (r - 8));
                ctx.lineTo(Math.cos(a) * (r + 8), Math.sin(a) * (r + 8));
                ctx.stroke();
            }
        }
        else if (style === 'lane') {
            ctx.lineWidth = 2.4;
            ctx.setLineDash([16, 10]);
            ctx.beginPath();
            ctx.moveTo(-PLAYFIELD_WIDTH, 12);
            ctx.lineTo(PLAYFIELD_WIDTH, 12);
            ctx.stroke();
            ctx.setLineDash([]);
        }
        else if (style === 'fan') {
            ctx.lineWidth = 2;
            for (const a of [-.5, -.25, 0, .25, .5]) {
                ctx.beginPath();
                ctx.moveTo(0, 12);
                ctx.lineTo(Math.sin(a) * 120, Math.cos(a) * 120);
                ctx.stroke();
            }
        }
        else if (style === 'aim' && player) {
            const dx = player.x - e.x, dy = player.y - e.y, len = Math.hypot(dx, dy) || 1;
            ctx.lineWidth = 1.7;
            ctx.setLineDash([9, 8]);
            ctx.beginPath();
            ctx.moveTo(0, 8);
            ctx.lineTo(dx / len * 160, dy / len * 160);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.beginPath();
            ctx.arc(0, 0, 19 + 5 * p, 0, Math.PI * 2);
            ctx.stroke();
        }
        else {
            const r = 9 + 8 * p;
            ctx.beginPath();
            ctx.arc(0, 10, r, 0, Math.PI * 2);
            ctx.fill();
            ctx.lineWidth = 2;
            ctx.stroke();
        }
        ctx.restore();
    }
    drawBossHull(ctx, e) {
        const bossArtId = e.id.startsWith('breakwater') ? 'breakwater' : 'leviathan';
        const boss = bossArtId === 'breakwater' ? BREAKWATER : LEVIATHAN;
        const img = this.getImage(`boss:${bossArtId}`, () => bossSpriteUrl(bossArtId));
        const maxW = bossArtId === 'leviathan' ? boss.width * 1.18 : boss.width * 1.12, maxH = bossArtId === 'leviathan' ? boss.height * 1.18 : boss.height * 1.15;
        if(bossArtId==='leviathan')this.combat.wake(ctx,e,maxW,maxH,this.frame.elapsed);
        if (img) {
            const box = this.imageBox(img, maxW, maxH);
            this.combat.shadow(ctx,img,e.x,e.y,box.width,box.height,bossArtId==='leviathan'?24:90);
            ctx.drawImage(img, e.x - box.width / 2, e.y - box.height / 2, box.width, box.height);
            // Burnt mounts remain attached to the moving hull and obscure baked gun detail.
            for(const part of boss.components){
                const component=this.frame.world.getEntity(part.id);if(!component?.destroyed)continue;
                const x=e.x+part.x,y=e.y+part.y,r=part.radius;
                ctx.save();ctx.fillStyle='#171c1b';ctx.beginPath();ctx.ellipse(x,y,r*1.25,r*1.15,0,0,Math.PI*2);ctx.fill();
                const wreck=this.cache.get('wreck:component');if(wreck?.ready)ctx.drawImage(wreck.image,x-r*1.5,y-r*1.4,r*3,r*2.8);
                this.combat.glow(ctx,x,y,r*.7,'#ff8539',.30);
                const smoke=this.cache.get('fx:smoke');if(smoke?.ready){ctx.globalAlpha=.30;ctx.drawImage(smoke.image,x-r,y-r*2.3,r*2.2,r*2.8);}ctx.restore();
            }
        }
    }
    drawBossComponent(ctx, e) {
        const componentKind = e.data.boss === 'breakwater' || e.data.componentKind === 'cannon-pod' ? 'cannon-pod' : e.data.componentKind === 'missile-deck' ? 'missile-deck' : 'reactor';
        const img = this.getImage(`component:${componentKind}`, () => bossComponentSpriteUrl(componentKind));
        const max = e.radius * (componentKind === 'reactor' ? 3.05 : componentKind === 'missile-deck' ? 3.25 : 3.0);
        ctx.save();
        if (img) {
            const box = this.imageBox(img, max, max * 1.08);
            ctx.translate(e.x,e.y);
            if(componentKind==='cannon-pod')ctx.rotate(Number(e.data.weaponAngle??Math.PI/2)+Math.PI/2);
            ctx.drawImage(img,-box.width/2,-box.height/2,box.width,box.height);
        }
        else {
            ctx.fillStyle = '#ff3f78';
            ctx.beginPath();
            ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
        if(e.data.telegraphPulse>0)this.combat.glow(ctx,e.x,e.y,e.radius*1.5,'#ffb06e',Number(e.data.telegraphPulse)*.50);
    }
    drawRescue(ctx, e) {
        const p = Number(e.data.rescueProgress ?? 0), img = this.getImage('prop:rescue-marker', () => propSpriteUrl('rescue-marker'));
        ctx.save();
        ctx.translate(e.x, e.y);
        const pulse = 1 + Math.sin(performance.now() * .004 + e.x * .01) * .035;
        if (img) {
            const box = this.imageBox(img, 56 * pulse, 56 * pulse);
            ctx.shadowBlur = 16;
            ctx.shadowColor = 'rgba(72,238,255,.78)';
            ctx.drawImage(img, -box.width / 2, -box.height / 2, box.width, box.height);
            ctx.shadowBlur = 0;
        }
        ctx.strokeStyle = 'rgba(92,244,215,.48)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, 36, 0, Math.PI * 2);
        ctx.stroke();
        ctx.strokeStyle = '#8fffe8';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.arc(0, 0, 36, -Math.PI / 2, -Math.PI / 2 + p * Math.PI * 2);
        ctx.stroke();
        ctx.strokeStyle = 'rgba(92,244,215,.38)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, -45);
        ctx.lineTo(0, -68);
        ctx.stroke();
        ctx.restore();
    }
    drawPickup(ctx, e) {
        const img=this.getImage('fx:pickup',()=>effectSpriteUrl('pickup')),t=performance.now()*.001,pulse=.5+.5*Math.sin(t*4.4);
        ctx.save();ctx.translate(e.x,e.y);ctx.globalCompositeOperation='screen';
        const halo=ctx.createRadialGradient(0,0,5,0,0,32+pulse*4);halo.addColorStop(0,'rgba(146,255,190,.28)');halo.addColorStop(.55,'rgba(72,255,147,.12)');halo.addColorStop(1,'rgba(72,255,147,0)');
        ctx.fillStyle=halo;ctx.beginPath();ctx.arc(0,0,36,0,Math.PI*2);ctx.fill();
        ctx.rotate(t*.55);ctx.strokeStyle='rgba(165,255,212,.58)';ctx.lineWidth=1.8;ctx.setLineDash([8,7]);ctx.beginPath();ctx.ellipse(0,0,24+pulse*2,13+pulse,0,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);
        ctx.rotate(-t*.92);for(let i=0;i<3;i++){const aa=i*Math.PI*2/3+t*.7,rr=25;ctx.fillStyle='rgba(224,255,239,.72)';ctx.beginPath();ctx.arc(Math.cos(aa)*rr,Math.sin(aa)*rr,1.6+pulse*.8,0,Math.PI*2);ctx.fill();}
        ctx.globalCompositeOperation='source-over';ctx.rotate(t*.37);
        if(img){const box=this.imageBox(img,38,47);ctx.shadowBlur=18;ctx.shadowColor='#66ff9a';ctx.drawImage(img,-box.width/2,-box.height/2,box.width,box.height);ctx.shadowBlur=0;}
        else{ctx.fillStyle='#6cff96';ctx.shadowBlur=12;ctx.shadowColor='#6cff96';ctx.beginPath();ctx.moveTo(0,-12);ctx.lineTo(10,0);ctx.lineTo(0,12);ctx.lineTo(-10,0);ctx.closePath();ctx.fill();}
        ctx.restore();
    }
    drawProjectiles(ctx, world, faction) {
        for (const p of world.projectiles.values()) {
            if (!p.active || p.faction !== faction)
                continue;
            if (faction === 'player')
                this.drawFriendlyProjectile(ctx, p);
            else
                this.drawHostileProjectile(ctx, p);
        }
    }
    drawFriendlyProjectile(ctx, p) {
        if(this.combat.friendly(ctx,p))return;
        ctx.save();
        ctx.translate(p.x, p.y);
        const angle = Math.atan2(p.vy, p.vx) + Math.PI / 2;
        ctx.rotate(angle);
        if (p.assetId.includes('laser')) {
            ctx.shadowBlur = 14;
            ctx.shadowColor = '#54dcff';
            ctx.fillStyle = '#e8fcff';
            ctx.fillRect(-2, -23, 4, 32);
            ctx.fillStyle = '#54dcff';
            ctx.fillRect(-4, -8, 8, 17);
        }
        else if (p.assetId.includes('missile')) {
            const img = this.getImage('fx:missile', () => effectSpriteUrl('missile'));
            if (img) {
                const box = this.imageBox(img, 18, 36);
                ctx.rotate(-Math.PI / 2);
                ctx.drawImage(img, -box.width / 2, -box.height / 2, box.width, box.height);
            }
            else {
                ctx.fillStyle = '#d8dfe1';
                ctx.beginPath();
                ctx.moveTo(0, -12);
                ctx.lineTo(5, 6);
                ctx.lineTo(0, 10);
                ctx.lineTo(-5, 6);
                ctx.closePath();
                ctx.fill();
            }
            ctx.fillStyle = '#ffae39';
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#ff8a28';
            ctx.fillRect(-2, 8, 4, 11);
        }
        else {
            ctx.shadowBlur = 9;
            ctx.shadowColor = '#65f29a';
            ctx.fillStyle = '#f0fff4';
            ctx.fillRect(-1.9, -12, 3.8, 21);
            ctx.fillStyle = '#65f29a';
            ctx.fillRect(-3, -3, 6, 8);
        }
        ctx.restore();
    }
    drawHostileProjectile(ctx, p) {
        if(p.assetId.includes("missile"))this.combat.missileTrail(ctx,p);
        const key=hostileProjectileStyle(p.assetId)+':'+p.radius;
        let sprite=this.projectileSprites.get(key);
        if(!sprite){
            sprite=document.createElement('canvas');sprite.width=sprite.height=Math.max(96,Math.ceil(p.radius*4+64));
            const c=sprite.getContext('2d');c.translate(sprite.width/2,sprite.height/2);
            this.paintHostileProjectile(c,{...p,x:0,y:0,vx:0,vy:-1});
            this.projectileSprites.set(key,sprite);
        }
        ctx.save();ctx.translate(p.x,p.y);ctx.rotate(Math.atan2(p.vy,p.vx)+Math.PI/2);
        ctx.drawImage(sprite,-sprite.width/2,-sprite.height/2);ctx.restore();
    }
    paintHostileProjectile(ctx, p) {
        ctx.save();
        ctx.translate(p.x, p.y);
        const style = hostileProjectileStyle(p.assetId);
        const angle = Math.atan2(p.vy, p.vx) + Math.PI / 2;
        ctx.rotate(angle);
        if (style === 'missile') {
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#ff4fa0';
            ctx.fillStyle = '#20242a';
            ctx.strokeStyle = '#fff5fa';
            ctx.lineWidth = 1.25;
            ctx.beginPath();
            ctx.moveTo(0, -15);
            ctx.lineTo(6, -3);
            ctx.lineTo(7, 8);
            ctx.lineTo(0, 12);
            ctx.lineTo(-7, 8);
            ctx.lineTo(-6, -3);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            ctx.fillStyle = '#ff4fa0';
            ctx.fillRect(-2, 8, 4, 13);
            ctx.fillStyle = '#ffd7ec';
            ctx.fillRect(-1, 10, 2, 8);
        }
        else if (style === 'tracer') {
            ctx.shadowBlur = 8;
            ctx.shadowColor = '#ff6a8f';
            const g = ctx.createLinearGradient(0, -18, 0, 12);
            g.addColorStop(0, 'rgba(255,255,255,.05)');
            g.addColorStop(.45, '#fff5d8');
            g.addColorStop(1, '#ff5a77');
            ctx.fillStyle = g;
            ctx.fillRect(-2.1, -18, 4.2, 30);
            ctx.fillStyle = '#ff335f';
            ctx.fillRect(-4, 3, 8, 8);
        }
        else if (style === 'heavy') {
            ctx.shadowBlur = 14;
            ctx.shadowColor = '#ff5b8c';
            ctx.fillStyle = '#3b1725';
            ctx.strokeStyle = '#ffd7e4';
            ctx.lineWidth = 1.3;
            ctx.beginPath();
            ctx.arc(0, 0, p.radius + 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            ctx.fillStyle = '#ff4d79';
            ctx.beginPath();
            ctx.arc(0, 0, p.radius + 1, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#fff4ca';
            ctx.beginPath();
            ctx.arc(-2, -2, Math.max(2, p.radius * .35), 0, Math.PI * 2);
            ctx.fill();
        }
        else if (style === 'shell') {
            ctx.shadowBlur = 9;
            ctx.shadowColor = '#ff7b68';
            ctx.fillStyle = '#f5d7be';
            ctx.beginPath();
            ctx.ellipse(0, 0, 4.5, 9, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#ff4c65';
            ctx.beginPath();
            ctx.moveTo(-4, 4);
            ctx.lineTo(0, 13);
            ctx.lineTo(4, 4);
            ctx.closePath();
            ctx.fill();
        }
        else if (style === 'lane') {
            ctx.shadowBlur = 13;
            ctx.shadowColor = '#ff3eb7';
            ctx.fillStyle = '#ffe9fb';
            ctx.fillRect(-2.2, -14, 4.4, 27);
            ctx.fillStyle = '#ff43b9';
            ctx.fillRect(-5, -2, 10, 11);
        }
        else {
            ctx.shadowBlur = 12;
            ctx.shadowColor = '#ff42a5';
            ctx.fillStyle = '#281221';
            ctx.beginPath();
            ctx.arc(0, 0, p.radius + 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#ff4fa7';
            ctx.beginPath();
            ctx.arc(0, 0, p.radius + 1.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(-1, -1, Math.max(2, p.radius * .42), 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }
    drawEffects(ctx, effects) {
        for (const f of effects.flashes) {
            ctx.save();
            ctx.globalCompositeOperation="screen";
            ctx.globalAlpha = f.alpha*.55;
            const g = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.radius);
            g.addColorStop(0, f.color);
            g.addColorStop(.24, 'rgba(255,174,74,.74)');
            g.addColorStop(1, 'rgba(255,89,48,0)');
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.arc(f.x, f.y, f.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
        for (const p of effects.particles)
            this.drawParticle(ctx, p);
    }
    drawParticle(ctx, p) {
        if (p.delay > 0)
            return;
        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        const style = particleRenderStyle(p.kind);
        if (style === 'radial-fire') {
            const progress=1-p.life/p.maxLife;
            const radius=Math.max(5,p.size*(.40+Math.min(1,progress*3.4)*.85)),heavy=radius>34;
            const img = this.getImage(heavy ? 'fx:heavy-fire' : 'fx:fire', () => effectSpriteUrl(heavy ? 'heavy-fire' : 'fire'));
            if (img) {
                const box = this.imageBox(img, radius * 3.15, radius * 3.15);
                ctx.globalCompositeOperation="source-over";
                ctx.shadowBlur = radius * .20;
                ctx.shadowColor = p.color;
                const f=Math.min(3,Math.max(0,Math.floor(progress*4))),sw=img.width/2,sh=img.height/2;
                ctx.drawImage(img,(f%2)*sw,Math.floor(f/2)*sh,sw,sh,-box.width/2,-box.height/2,box.width,box.height);
            }
            else {
                const g = ctx.createRadialGradient(-radius * .18, -radius * .2, 0, 0, 0, radius);
                g.addColorStop(0, 'rgba(255,255,238,1)');
                g.addColorStop(.24, 'rgba(255,233,128,.98)');
                g.addColorStop(.58, p.color);
                g.addColorStop(.82, 'rgba(224,55,31,.72)');
                g.addColorStop(1, 'rgba(112,18,20,0)');
                ctx.shadowBlur = radius * .45;
                ctx.shadowColor = p.color;
                ctx.fillStyle = g;
                ctx.beginPath();
                ctx.ellipse(0, 0, radius, radius * .78, 0, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        else if (style === 'soft-smoke' || style === 'soft-dust') {
            const smoke=this.cache.get('fx:smoke');
            if(smoke?.ready){
                ctx.globalAlpha=p.alpha*(style==='soft-dust'?.30:.72);
                ctx.drawImage(smoke.image,-p.size*1.25,-p.size,p.size*2.5,p.size*2);
                ctx.restore();return;
            }
            const radius = Math.max(3, p.size);
            const inner = style === 'soft-smoke' ? 'rgba(35,40,45,.82)' : 'rgba(151,128,94,.64)';
            const mid = style === 'soft-smoke' ? 'rgba(62,69,75,.52)' : 'rgba(164,143,111,.38)';
            const g = ctx.createRadialGradient(-radius * .2, -radius * .2, radius * .08, 0, 0, radius);
            g.addColorStop(0, inner);
            g.addColorStop(.5, mid);
            g.addColorStop(1, 'rgba(40,44,46,0)');
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.ellipse(0, 0, radius * 1.15, radius * .82, .15, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha *= .24;
            ctx.fillStyle = 'rgba(255,255,255,.38)';
            ctx.beginPath();
            ctx.ellipse(-radius * .22, -radius * .2, radius * .35, radius * .2, 0, 0, Math.PI * 2);
            ctx.fill();
        }
        else if (style === 'energy-streak') {
            const length = Math.max(7, Math.hypot(p.vx, p.vy) * .04);
            ctx.lineCap = 'round';
            ctx.shadowBlur = 7;
            ctx.shadowColor = p.color;
            ctx.strokeStyle = p.color;
            ctx.lineWidth = Math.max(1.2, p.size);
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(-Math.cos(p.rotation) * length, -Math.sin(p.rotation) * length);
            ctx.stroke();
            ctx.globalAlpha *= .72;
            ctx.strokeStyle = '#fffbe5';
            ctx.lineWidth = Math.max(.8, p.size * .42);
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(-Math.cos(p.rotation) * length * .72, -Math.sin(p.rotation) * length * .72);
            ctx.stroke();
        }