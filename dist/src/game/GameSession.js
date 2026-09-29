import { FIXED_DT, PLAYFIELD_WIDTH, VIEWPORT_WIDTH, WORLD_HEIGHT } from "./constants.js";
import { BossController } from "./bosses/BossController.js";
import { EffectsDirector } from "./effects/EffectsDirector.js";
import { EnemySystem } from "./enemies/EnemySystem.js";
import { PointerController } from "./input/PointerController.js";
import { MissionDirector } from "./missions/MissionDirector.js";
import { WorldRenderer } from "./render/WorldRenderer.js";
import { World } from "./simulation/World.js";
import { WeaponSystem } from "./weapons/WeaponSystem.js";
export function computePlayerStats(craft, profile) {
    return { maxHp: Math.round(craft.maxHp * (1 + profile.upgrades.hull * .055)), damageMultiplier: 1 + profile.upgrades.primary * .065, secondaryMultiplier: 1 + profile.upgrades.secondary * .06, magnetMultiplier: 1 + profile.upgrades.magnet * .07 };
}
export function applyMovementDelta(pos, dx, dy, speed, dt, sensitivity) {
    const margin = 54;
    const targetX = Math.max(margin, Math.min(PLAYFIELD_WIDTH - margin, pos.x + dx * sensitivity));
    const targetY = Math.max(170, Math.min(WORLD_HEIGHT - 74, pos.y + dy * sensitivity));
    let vx = targetX - pos.x, vy = targetY - pos.y;
    const d = Math.hypot(vx, vy);
    const max = Math.max(0, speed * dt);
    if (d > max && d > 0) {
        vx = vx / d * max;
        vy = vy / d * max;
    }
    return { x: pos.x + vx, y: pos.y + vy };
}
export class GameSession {
    world;
    mission;
    boss;
    effects;
    renderer;
    input;
    weapons;
    enemies;
    stage;
    craft;
    runtimeCraft;
    profile;
    audio;
    onHud;
    onEnd;
    onPauseRequest;
    raf = 0;
    previous = 0;
    accumulator = 0;
    paused = false;
    ended = false;
    seenAudio = new Set();
    startAt = 0;
    resizeHandler;
    visibilityHandler;
    constructor(options) {
        this.stage = options.container;
        this.craft = options.craft;
        this.profile = options.profile;
        this.audio = options.audio;
        this.onHud = options.onHud;
        this.onEnd = options.onEnd;
        this.onPauseRequest = options.onPauseRequest;
        this.world = new World(0x20260910);
        this.weapons = new WeaponSystem();
        this.enemies = new EnemySystem(this.weapons);
        this.boss = new BossController();
        this.mission = new MissionDirector();
        this.effects = new EffectsDirector(options.profile.settings.quality);
        this.renderer = new WorldRenderer(this.stage, options.profile.settings.reduceShake);
        this.renderer.setQuality(options.profile.settings.quality);
        this.input = new PointerController();
        this.effects.surfaceAt=(x,y)=>this.renderer.scene.surfaceAt(x,y,this.mission.scrollDistance);
        const stats = computePlayerStats(this.craft, this.profile);
        this.runtimeCraft = { ...this.craft, weapon: { ...this.craft.weapon, damage: this.craft.weapon.damage * stats.damageMultiplier } };
        const player = this.world.spawnEntity({ id: 'player', kind: 'player', faction: 'player', x: PLAYFIELD_WIDTH / 2, y: 1070, hp: stats.maxHp, radius: this.craft.coreRadius, interactiveAssetId: this.craft.id, destructionPreset: 'small-air', data: { tacticalCharges: 3, shield: 0, phase: 0, invulnerable: 0 } });
        this.mission.start(this.world, player);
        this.resizeHandler = () => this.renderer.resize();
        this.visibilityHandler = () => { if (document.hidden && !this.paused && !this.ended) {
            this.pause();
            this.onPauseRequest();
        } };
    }
    async start() {
        this.renderer.mount();
        await this.renderer.preloadAssets(this.craft.id);
        this.input.attach(this.stage);
        window.addEventListener('resize', this.resizeHandler);
        document.addEventListener('visibilitychange', this.visibilityHandler);
        this.startAt = performance.now();
        this.previous = this.startAt;
        this.audio.startMusic();
        this.raf = requestAnimationFrame(this.loop);
    }
    loop = (now) => {
        const raw = Math.max(0, Math.min(.1, (now - this.previous) / 1000));
        this.previous = now;
        if (!this.paused && !this.ended) {
            this.accumulator += raw;
            let steps = 0;
            while (this.accumulator >= FIXED_DT && steps < 6) {
                this.step(FIXED_DT);
                this.accumulator -= FIXED_DT;
                steps += 1;
            }
            if (steps === 6 && this.accumulator > FIXED_DT * 4)
                this.accumulator = 0;
        }
        this.renderer.render({ world: this.world, mission: this.mission, craft: this.craft, effects: this.effects, boss: this.boss, elapsed: (now - this.startAt) / 1000 });
        this.emitHud();
        if (!this.ended)
            this.raf = requestAnimationFrame(this.loop);
    };
    step(dt) {
        const player = this.world.getEntity('player');
        if (!player)
            return;
        const rect = this.stage.getBoundingClientRect();
        const scale = rect.width > 0 ? VIEWPORT_WIDTH / rect.width : 1;
        const move = this.input.consumeMovement();
        const next = applyMovementDelta(player, move.dx * scale, move.dy * scale, this.craft.speed, dt, this.profile.settings.sensitivity);
        player.x = next.x;
        player.y = next.y;
        if (this.input.consumeAction('pause')) {
            this.pause();
            this.onPauseRequest();
            return;
        }
        if (this.input.consumeAction('ability')) {
            if (this.weapons.activateAbility(this.world, player, this.runtimeCraft))
                this.audio.play(`player-${this.craft.weapon.family}`, 1.15);
        }
        if (this.input.consumeAction('tactical')) {
            if (this.weapons.activateTactical(this.world, player))
                this.audio.play('explosion-boss', .65);
        }
        const scrollBefore = this.mission.scrollDistance;
        this.mission.update(this.world, player, this.enemies, this.boss, dt);
        this.enemies.update(this.world, player, dt, this.mission.scrollDistance-scrollBefore);
        this.weapons.updatePlayer(this.world, player, this.runtimeCraft, dt);
        this.weapons.updateGuidance(this.world, dt);
        this.world.step(dt);
        this.effects.consumeEvents(this.world);
        this.effects.update(dt, this.mission.scrollDistance - scrollBefore);
        this.consumeAudioEvents();
        this.world.clearTransientEvents(this.world.tick-2);
        if(this.world.tick%300===0){const recent=new Set(this.world.events.map(e=>e.id));const prune=seen=>new Set([...seen].filter(id=>recent.has(id)));this.seenAudio=prune(this.seenAudio);this.effects.seen=prune(this.effects.seen);this.mission.seenEvents=prune(this.mission.seenEvents);}
        if (this.mission.result && !this.ended) {
            this.ended = true;
            cancelAnimationFrame(this.raf);
            this.audio.stopMusic();
            this.onEnd(this.mission.result);
        }
    }
    consumeAudioEvents() {
        for (const e of this.world.events) {
            if (this.seenAudio.has(e.id))
                continue;
            this.seenAudio.add(e.id);
            if (e.type === 'weaponFired') {
                const source = this.world.getEntity(e.sourceId ?? '');
                if (source?.faction === 'player')
                    this.audio.play(`player-${this.craft.weapon.family}`, this.craft.variant === 'tank' ? 1.15 : .65);
                else if (Math.random() < .22)
                    this.audio.play('enemy-weapon', .35);
            }
            else if (e.type === 'entityDestroyed')
                this.audio.play(e.material === 'boss-final' ? 'explosion-boss' : 'explosion', e.material === 'boss-component' ? 1.25 : .75);
            else if (e.type === 'entityHit' && Number(e.amount ?? 0) > 0 && Math.random() < .28)
                this.audio.play('hit', .45);
            else if (e.type === 'rescueComplete')
                this.audio.play('rescue', .9);
            else if (e.type === 'bossPhase' && e.data?.phase !== 'defeated')
                this.audio.play('boss-warning', .9);
        }
    }
    emitHud() {
        const player = this.world.getEntity('player');
        if (!player)
            return;
        const hp = this.boss.currentHp(this.world);
        this.onHud({ hp: player.hp, maxHp: player.maxHp, score: this.world.score, salvage: this.world.salvage, rescued: this.mission.objectives.rescued, totalRescues: this.mission.objectives.totalRescues, destroyed: this.mission.objectives.eligibleDestroyed, eligible: this.mission.objectives.eligibleTotal, abilityReady: this.weapons.abilityCooldownRemaining(player.id), abilityCooldown: this.craft.ability.cooldown, tacticalCharges: Number(player.data.tacticalCharges ?? 0), missionMessage: this.mission.message, bossPhase: this.boss.phase, bossHp: hp.current, bossMaxHp: hp.max, elapsed: this.mission.time });
    }
    applySettings(settings) {
        this.profile = { ...this.profile, settings: { ...settings } };
        this.effects.setQuality(settings.quality);
        this.renderer.setQuality(settings.quality);
        this.renderer.setReduceShake(settings.reduceShake);
    }
    pause() { if (this.ended)
        return; this.paused = true; this.accumulator = 0; void this.audio.suspend(); }
    resume() { if (this.ended)
        return; this.paused = false; this.previous = performance.now(); void this.audio.resume(); }
    isPaused() { return this.paused; }
    destroy() { this.ended = true; cancelAnimationFrame(this.raf); this.input.dispose(); this.renderer.destroy(); window.removeEventListener('resize', this.resizeHandler); document.removeEventListener('visibilitychange', this.visibilityHandler); this.audio.stopMusic(); }
}
