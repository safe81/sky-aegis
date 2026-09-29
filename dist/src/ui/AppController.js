const TRANSITIONS = {
    boot: ['title', 'error'],
    title: ['hangar', 'settings', 'error'],
    hangar: ['title', 'map', 'settings', 'error'],
    map: ['hangar', 'briefing', 'settings', 'error'],
    briefing: ['map', 'hangar', 'playing', 'settings', 'error'],
    playing: ['paused', 'results', 'error'],
    paused: ['playing', 'results', 'hangar', 'settings', 'error'],
    results: ['hangar', 'map', 'briefing', 'error'],
    settings: ['title', 'hangar', 'map', 'briefing', 'paused', 'error'],
    error: ['title'],
};
export function canTransition(from, to) {
    return TRANSITIONS[from].includes(to);
}
const clamp = (value, min, max) => Math.max(min, Math.min(max, Number.isFinite(value) ? value : min));
export function normalizeSettings(base, input) {
    const quality = input.quality === 'low' || input.quality === 'high' || input.quality === 'balanced' ? input.quality : base.quality;
    const sensitivityRaw = input.sensitivity === undefined ? base.sensitivity : Number(input.sensitivity);
    const musicRaw = input.musicVolume === undefined ? base.musicVolume : Number(input.musicVolume);
    const effectsRaw = input.effectsVolume === undefined ? base.effectsVolume : Number(input.effectsVolume);
    return {
        ...base,
        quality,
        sensitivity: clamp(sensitivityRaw, .65, 1.6),
        musicVolume: clamp(musicRaw, 0, 1),
        effectsVolume: clamp(effectsRaw, 0, 1),
        reduceShake: input.reduceShake ?? base.reduceShake,
    };
}
export function commandTargetState(state, command) {
    const map = {
        boot: { ready: 'title' },
        title: { 'enter-hangar': 'hangar', settings: 'settings' },
        hangar: { title: 'title', 'mission-map': 'map', settings: 'settings' },
        map: { hangar: 'hangar', briefing: 'briefing', settings: 'settings' },
        briefing: { map: 'map', hangar: 'hangar', launch: 'playing', settings: 'settings' },
        playing: {},
        paused: { resume: 'playing', abort: 'hangar', settings: 'settings' },
        results: { hangar: 'hangar', replay: 'briefing' },
        settings: {},
        error: { title: 'title' },
    };
    return map[state]?.[command] ?? null;
}
export class UiStateMachine {
    state;
    previous = null;
    constructor(initial = 'boot') { this.state = initial; }
    go(next) {
        if (next === this.state)
            return;
        if (!canTransition(this.state, next))
            throw new Error(`Invalid UI transition ${this.state} -> ${next}`);
        this.previous = this.state;
        this.state = next;
    }
}
