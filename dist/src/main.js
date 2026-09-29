import { AIRCRAFT } from "./game/content/aircraft.js";
import { AudioDirector } from "./game/audio/AudioDirector.js";
import { GameSession } from "./game/GameSession.js";
import { ProgressionService } from "./game/progression/ProgressionService.js";
import { SaveRepository, createDefaultProfile } from "./game/save/SaveRepository.js";
import { UiStateMachine, commandTargetState, normalizeSettings } from "./ui/AppController.js";
import { renderBriefing, renderError, renderHangar, renderMissionMap, renderPauseOverlay, renderPauseSettings, renderPlaying, renderResults, renderResumeCountdown, renderSettings, renderTitle } from "./ui/screens.js";
function requireAppRoot() { const node = document.getElementById('app'); if (!(node instanceof HTMLElement))
    throw new Error('Missing app root'); return node; }
const root = requireAppRoot();
const saves = new SaveRepository();
const progression = new ProgressionService();
const audio = new AudioDirector();
const ui = new UiStateMachine();
let profile = createDefaultProfile('review');
let session = null;
let lastResult = null;
let settingsReturnState = 'title';
let transitionLocked = false;
let pendingBuildUpdate = false;
function selectedCraft() {
    return AIRCRAFT.find(a => a.id === profile.selectedAircraft && profile.unlockedAircraft.includes(a.id))
        ?? AIRCRAFT.find(a => profile.unlockedAircraft.includes(a.id))
        ?? AIRCRAFT[0];
}
function applyAudioSettings() {
    audio.setBusVolume('music', profile.settings.musicVolume);
    for (const bus of ['weapons', 'destruction', 'ui', 'speech', 'ambience'])
        audio.setBusVolume(bus, profile.settings.effectsVolume);
}
function render() {
    if(pendingBuildUpdate&&!session){location.reload();return;}
    const craft = selectedCraft();
    if (ui.state === 'title')
        root.innerHTML = renderTitle(profile);
    else if (ui.state === 'hangar')
        root.innerHTML = renderHangar(profile, craft);
    else if (ui.state === 'map')
        root.innerHTML = renderMissionMap(profile);
    else if (ui.state === 'briefing')
        root.innerHTML = renderBriefing(craft);
    else if (ui.state === 'results' && lastResult)
        root.innerHTML = renderResults(lastResult);
    else if (ui.state === 'settings')
        root.innerHTML = renderSettings(profile, settingsReturnState);
    else if (ui.state === 'error')
        root.innerHTML = renderError('The game entered a recoverable error state.');
}
function setState(next) {
    ui.go(next);
    if (next !== 'playing' && next !== 'paused')
        render();
}
function updateHud(h) {
    const hpPct = Math.max(0, Math.min(100, h.maxHp ? Math.round(h.hp / h.maxHp * 100) : 0));
    const hp = root.querySelector('[data-hud="hp"]');
    if (hp)
        hp.textContent = `${hpPct}%`;
    const hpBar = root.querySelector('[data-hud-bar="hp"]');
    if (hpBar)
        hpBar.style.width = `${hpPct}%`;
    const score = root.querySelector('[data-hud="score"]');
    if (score)
        score.textContent = Math.floor(h.score).toLocaleString('en-US');
    const salvage = root.querySelector('[data-hud="salvage"]');
    if (salvage)
        salvage.textContent = String(Math.floor(h.salvage));
    const rescue = root.querySelector('[data-hud="rescue"]');
    if (rescue)
        rescue.textContent = `${h.rescued}/${h.totalRescues}`;
    const objective = root.querySelector('[data-hud="objective"]');
    if (objective)
        objective.textContent = `${h.destroyed} / ${h.eligible} HOSTILES`;
    const message = root.querySelector('[data-hud="message"]');
    if (message)
        message.textContent = h.missionMessage;
    const ability = root.querySelector('[data-hud="ability"]');
    if (ability)
        ability.textContent = h.abilityReady <= .02 ? 'READY' : `${Math.ceil(h.abilityReady)}s`;
    const abilityRing = root.querySelector('[data-hud-bar="ability"]');
    if (abilityRing) {
        const ready = h.abilityCooldown > 0 ? 1 - Math.min(1, h.abilityReady / h.abilityCooldown) : 1;
        abilityRing.style.setProperty('--ready', `${Math.round(ready * 100)}%`);
    }
    const tactical = root.querySelector('[data-hud="tactical"]');
    if (tactical)
        tactical.textContent = `×${h.tacticalCharges}`;
    const bossPanel = root.querySelector('[data-hud-panel="boss"]');
    if (bossPanel) {
        const active = h.bossPhase !== 'none' && h.bossPhase !== 'defeated' && h.bossMaxHp > 0;
        bossPanel.hidden = !active;
        if (active) {
            const bossName = root.querySelector('[data-hud="boss-name"]');
            if (bossName)
                bossName.textContent = h.bossPhase === 'breakwater' ? 'BREAKWATER' : 'LEVIATHAN';
            const bossPhase = root.querySelector('[data-hud="boss-phase"]');
            if (bossPhase)
                bossPhase.textContent = h.bossPhase.toUpperCase();
            const bossBar = root.querySelector('[data-hud-bar="boss"]');
            if (bossBar)
                bossBar.style.width = `${Math.max(0, Math.min(100, h.bossHp / h.bossMaxHp * 100))}%`;
        }
    }
}
function showPauseOverlay() {
    if (ui.state !== 'playing')
        return;
    ui.go('paused');
    const stage = root.querySelector('#combat-stage');
    if (stage && !stage.querySelector('#pause-overlay'))
        stage.insertAdjacentHTML('beforeend', renderPauseOverlay());
}
async function resumeWithCountdown() {
    if (ui.state !== 'paused' || transitionLocked)
        return;
    transitionLocked = true;
    root.querySelector('#pause-overlay')?.remove();
    const stage = root.querySelector('#combat-stage');
    if (!stage) {
        transitionLocked = false;
        return;
    }
    for (let n = 3; n >= 1; n -= 1) {
        stage.querySelector('#resume-countdown')?.remove();
        stage.insertAdjacentHTML('beforeend', renderResumeCountdown(n));
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    stage.querySelector('#resume-countdown')?.remove();
    ui.go('playing');
    session?.resume();
    transitionLocked = false;
}
async function finishRun(result) {
    if (ui.state !== 'playing' && ui.state !== 'paused')
        return;
    lastResult = result;
    try {
        profile = await saves.settleRun(result);
    }
    catch (error) {
        console.error('Save settlement failed', error);
    }
    session?.destroy();
    session = null;
    if (ui.state === 'paused')
        ui.go('results');
    else
        ui.go('results');
    audio.play('result', 1);
    render();
}
async function launch() {
    if (transitionLocked)
        return;
    transitionLocked = true;
    try {
        const craft = selectedCraft();
        await audio.unlock();
        setState('playing');
        root.innerHTML = renderPlaying(craft);
        const stage = root.querySelector('#combat-stage');
        if (!stage)
            throw new Error('Combat stage failed to mount');
        session = new GameSession({ container: stage, craft, profile, audio, onHud: updateHud, onEnd: (r) => { void finishRun(r); }, onPauseRequest: showPauseOverlay });
        await session.start();
    }
    catch (error) {
        console.error(error);
        session?.destroy();
        session = null;
        if (ui.state === 'playing')
            ui.go('error');
        root.innerHTML = renderError(error instanceof Error ? error.message : String(error));
    }
    finally {
        transitionLocked = false;
    }
}
async function navigate(command) {
    if (transitionLocked)
        return;
    if (command === 'resume') {
        await resumeWithCountdown();
        return;
    }
    if (command === 'settings' && ui.state === 'paused') {
        const overlay = root.querySelector('#pause-overlay');
        if (overlay)
            overlay.outerHTML = renderPauseSettings(profile);
        audio.play('menu', .6);
        return;
    }
    if (command === 'pause-settings-back' && ui.state === 'paused') {
        const overlay = root.querySelector('#pause-overlay');
        if (overlay)
            overlay.outerHTML = renderPauseOverlay();
        audio.play('menu', .5);
        return;
    }
    if (command === 'abort') {
        if (ui.state !== 'paused')
            return;
        session?.destroy();
        session = null;
        lastResult = null;
        ui.go('hangar');
        render();
        return;
    }
    if (command === 'settings-cancel') {
        if (ui.state !== 'settings')
            return;
        ui.go(settingsReturnState);
        render();
        return;
    }
    if (command === 'settings')
        settingsReturnState = ui.state;
    const next = commandTargetState(ui.state, command);
    if (!next)
        return;
    if (next === 'playing') {
        await launch();
        return;
    }
    setState(next);
    audio.play('menu', .6);
}
root.addEventListener('pointerdown', () => { void audio.unlock(); }, { passive: true });
root.addEventListener('click', event => {
    const target = event.target instanceof Element ? event.target.closest('[data-cmd],[data-aircraft],[data-upgrade]') : null;
    if (!target)
        return;
    if (target.dataset.aircraft) {
        const id = target.dataset.aircraft;
        if (!profile.unlockedAircraft.includes(id))
            return;
        profile = { ...profile, selectedAircraft: id };
        void saves.saveProfile(profile).then(p => { profile = p; audio.play('menu', .55); render(); }).catch(e => { console.error(e); });
        return;
    }
    if (target.dataset.upgrade) {
        const key = target.dataset.upgrade;
        try {
            profile = progression.purchase(profile, key);
            void saves.saveProfile(profile).then(p => { profile = p; audio.play('upgrade', .9); render(); });
        }
        catch (error) {
            console.warn(error);
        }
        return;
    }
    const cmd = target.dataset.cmd;
    if (cmd)
        void navigate(cmd);
});
root.addEventListener('input', event => {
    const input = event.target;
    if (!(input instanceof HTMLInputElement))
        return;
    const out = input.parentElement?.querySelector('output');
    if (!out)
        return;
    const value = Number(input.value);
    out.value = input.name === 'sensitivity' ? `${value.toFixed(2)}×` : `${Math.round(value * 100)}%`;
});
root.addEventListener('submit', event => {
    const form = event.target;
    if (!(form instanceof HTMLFormElement) || (form.id !== 'settings-form' && form.id !== 'pause-settings-form'))
        return;
    event.preventDefault();
    const data = new FormData(form);
    profile = { ...profile, settings: normalizeSettings(profile.settings, { quality: String(data.get('quality') ?? profile.settings.quality), sensitivity: String(data.get('sensitivity') ?? profile.settings.sensitivity), musicVolume: String(data.get('musicVolume') ?? profile.settings.musicVolume), effectsVolume: String(data.get('effectsVolume') ?? profile.settings.effectsVolume), reduceShake: data.has('reduceShake') }) };
    void saves.saveProfile(profile).then(p => { profile = p; applyAudioSettings(); session?.applySettings(profile.settings); audio.play('menu', .7); if (form.id === 'pause-settings-form' && ui.state === 'paused') {
        const overlay = root.querySelector('#pause-overlay');
        if (overlay)
            overlay.outerHTML = renderPauseOverlay();
    }
    else if (ui.state === 'settings') {
        ui.go(settingsReturnState);
        render();
    } }).catch(error => { console.error(error); root.innerHTML = renderError('Unable to save settings. Existing progress was preserved.'); });
});
window.addEventListener('error', event => console.error('Runtime error', event.error ?? event.message));
window.addEventListener('unhandledrejection', event => console.error('Unhandled promise rejection', event.reason));
async function registerServiceWorker() {
    if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === '127.0.0.1' || location.hostname === 'localhost')) {
        try {
            const hadController=Boolean(navigator.serviceWorker.controller);
            navigator.serviceWorker.addEventListener('controllerchange',()=>{if(!hadController)return;pendingBuildUpdate=true;if(!session)location.reload();});
            const registration=await navigator.serviceWorker.register('./service-worker.js',{updateViaCache:'none'});
            void registration.update();
        }
        catch (error) {
            console.warn('Offline worker unavailable', error);
        }
    }
}
async function boot() {
    try {
        profile = await saves.loadProfile();
        if (!AIRCRAFT.some(a => a.id === profile.selectedAircraft))
            profile = { ...profile, selectedAircraft: 'falcon-07' };
        applyAudioSettings();
        ui.go('title');
        render();
        void registerServiceWorker();
    }
    catch (error) {
        console.error(error);
        ui.go('error');
        root.innerHTML = renderError(error instanceof Error ? error.message : 'Unable to load profile');
    }
}
void boot();
