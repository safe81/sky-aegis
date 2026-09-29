export function routeAudioEvent(id) {
    if (id.includes('explosion') || id.includes('destroy') || id.includes('impact'))
        return 'destruction';
    if (id.includes('laser') || id.includes('minigun') || id.includes('missile') || id.includes('cannon') || id.includes('weapon'))
        return 'weapons';
    if (id.includes('boss-warning') || id.includes('inbound'))
        return 'speech';
    if (id.includes('rescue') || id.includes('pickup') || id.includes('menu') || id.includes('upgrade') || id.includes('result'))
        return 'ui';
    if (id.includes('music'))
        return 'music';
    return 'ambience';
}
export class AudioDirector {
    context = null;
    master = null;
    buses = new Map();
    volumes = { music: .38, weapons: .72, destruction: .72, ui: .62, speech: .7, ambience: .32 };
    musicNodes = [];
    musicGain = null;
    variant = 0;
    unlocked = false;
    setBusVolume(bus, value) {
        const v = Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
        this.volumes[bus] = v;
        const node = this.buses.get(bus);
        if (node && this.context)
            node.gain.setTargetAtTime(v, this.context.currentTime, .025);
    }
    getBusVolume(bus) { return this.volumes[bus]; }
    async unlock() {
        if (typeof window === 'undefined' || typeof AudioContext === 'undefined')
            return false;
        try {
            if (!this.context) {
                this.context = new AudioContext();
                this.master = this.context.createGain();
                this.master.gain.value = .82;
                this.master.connect(this.context.destination);
                for (const bus of ['music', 'weapons', 'destruction', 'ui', 'speech', 'ambience']) {
                    const g = this.context.createGain();
                    g.gain.value = this.volumes[bus];
                    g.connect(this.master);
                    this.buses.set(bus, g);
                }
            }
            if (this.context.state === 'suspended')
                await this.context.resume();
            this.unlocked = this.context.state === 'running';
            return this.unlocked;
        }
        catch {
            return false;
        }
    }
    play(id, intensity = 1) {
        if (!this.context || !this.unlocked)
            return;
        const bus = routeAudioEvent(id);
        const out = this.buses.get(bus);
        if (!out)
            return;
        const recipe = this.recipe(id);
        this.spawnVoice(recipe, out, Math.max(.15, Math.min(1.4, intensity)));
    }
    recipe(id) {
        this.variant = (this.variant + 1) % 7;
        const drift = (this.variant - 3) * 6;
        if (id.includes('minigun'))
            return { type: 'square', start: 210 + drift, end: 110, duration: .055, gain: .09 };
        if (id.includes('laser'))
            return { type: 'sawtooth', start: 720 + drift * 3, end: 260, duration: .11, gain: .075 };
        if (id.includes('missile'))
            return { type: 'triangle', start: 145 + drift, end: 62, duration: .19, gain: .1, noise: true };
        if (id.includes('explosion-boss'))
            return { type: 'sawtooth', start: 92, end: 34, duration: .72, gain: .24, noise: true };
        if (id.includes('explosion'))
            return { type: 'triangle', start: 150, end: 46, duration: .34, gain: .17, noise: true };
        if (id.includes('hit'))
            return { type: 'square', start: 380, end: 180, duration: .045, gain: .055 };
        if (id.includes('rescue'))
            return { type: 'sine', start: 620, end: 980, duration: .28, gain: .08 };
        if (id.includes('pickup'))
            return { type: 'sine', start: 830, end: 1320, duration: .13, gain: .06 };
        if (id.includes('boss-warning'))
            return { type: 'square', start: 78, end: 58, duration: .55, gain: .11 };
        if (id.includes('upgrade'))
            return { type: 'triangle', start: 420, end: 840, duration: .32, gain: .075 };
        return { type: 'sine', start: 300, end: 260, duration: .08, gain: .045 };
    }
    spawnVoice(recipe, out, intensity) {
        const c = this.context;
        const now = c.currentTime;
        const osc = c.createOscillator();
        const gain = c.createGain();
        osc.type = recipe.type;
        osc.frequency.setValueAtTime(recipe.start, now);
        osc.frequency.exponentialRampToValueAtTime(Math.max(20, recipe.end), now + recipe.duration);
        gain.gain.setValueAtTime(recipe.gain * intensity, now);
        gain.gain.exponentialRampToValueAtTime(.0001, now + recipe.duration);
        osc.connect(gain);
        gain.connect(out);
        osc.start(now);
        osc.stop(now + recipe.duration + .02);
        if (recipe.noise) {
            const n = c.createBuffer(1, Math.max(64, Math.floor(c.sampleRate * recipe.duration)), c.sampleRate);
            const data = n.getChannelData(0);
            for (let i = 0; i < data.length; i++)
                data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
            const src = c.createBufferSource();
            const ng = c.createGain();
            ng.gain.setValueAtTime(recipe.gain * .34 * intensity, now);
            ng.gain.exponentialRampToValueAtTime(.0001, now + recipe.duration);
            src.buffer = n;
            src.connect(ng);
            ng.connect(out);
            src.start(now);
        }
    }
    startMusic() {
        if (!this.context || !this.unlocked || this.musicNodes.length)
            return;
        const c = this.context;
        const out = this.buses.get('music');
        if (!out)
            return;
        const g = c.createGain();
        g.gain.value = .045;
        g.connect(out);
        this.musicGain = g;
        const freqs = [55, 82.41, 110];
        for (const f of freqs) {
            const o = c.createOscillator();
            o.type = 'sawtooth';
            o.frequency.value = f;
            const og = c.createGain();
            og.gain.value = f === 55 ? .45 : .18;
            o.connect(og);
            og.connect(g);
            o.start();
            this.musicNodes.push(o);
        }
        const lfo = c.createOscillator();
        const lg = c.createGain();
        lfo.frequency.value = .18;
        lg.gain.value = .018;
        lfo.connect(lg);
        lg.connect(g.gain);
        lfo.start();
        this.musicNodes.push(lfo);
    }
    stopMusic() { for (const o of this.musicNodes.splice(0)) {
        try {
            o.stop();
        }
        catch { }
    } this.musicGain?.disconnect(); this.musicGain = null; }
    async suspend() { try {
        await this.context?.suspend();
    }
    catch { } }
    async resume() { try {
        await this.context?.resume();
    }
    catch { } }
    dispose() { this.stopMusic(); this.context?.close().catch(() => { }); this.context = null; this.buses.clear(); this.unlocked = false; }
}
