import { AIRCRAFT } from "../game/content/aircraft.js";
import { ENEMIES } from "../game/content/enemies.js";
import { ProgressionService } from "../game/progression/ProgressionService.js";
import { aircraftHangarSpriteUrl, aircraftPortraitSpriteUrl } from "../game/render/ProductionArt.js";
const progression = new ProgressionService();
const esc = (s) => s.replace(/[&<>'"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[c]));
const pct = (value, min, max) => Math.round(Math.max(.08, Math.min(1, (value - min) / (max - min || 1))) * 100);
const familyTitle = (craft) => craft.weapon.family === 'laser' ? 'LASER SYSTEM' : craft.weapon.family === 'minigun' ? 'MINIGUN SYSTEM' : 'MISSILE SYSTEM';
const variantTitle = (craft) => craft.variant === 'rapid' ? 'RAPID FIRE' : craft.variant === 'tank' ? 'HEAVY / TANK' : 'BALANCED';
const mins = { speed: Math.min(...AIRCRAFT.map(a => a.speed)), hp: Math.min(...AIRCRAFT.map(a => a.maxHp)), dps: Math.min(...AIRCRAFT.map(a => a.weapon.damage / a.weapon.cadence)) };
const maxs = { speed: Math.max(...AIRCRAFT.map(a => a.speed)), hp: Math.max(...AIRCRAFT.map(a => a.maxHp)), dps: Math.max(...AIRCRAFT.map(a => a.weapon.damage / a.weapon.cadence)) };
function shell(content, klass = '') {
    return `<main class="screen ${klass}">${content}</main>`;
}
function topBar(label, right = '') {
    return `<div class="topbar"><div class="brand-lockup"><span class="brand-chevron">▲</span><span>SKY AEGIS</span></div><div class="topbar-label">${esc(label)}</div>${right}</div>`;
}
function stat(label, value, percent, suffix = '') {
    return `<div class="stat-row"><div class="stat-copy"><span>${esc(label)}</span><strong>${Math.round(value)}${suffix}</strong></div><div class="stat-track"><span style="width:${percent}%"></span></div></div>`;
}
function medal(label, earned) {
    return `<div class="medal ${earned ? 'earned' : ''}"><span class="medal-glyph">${earned ? '★' : '◇'}</span><span>${esc(label)}</span></div>`;
}
function medalState(profile) {
    return profile.medals['coastal-intercept'] ?? { destroy70: false, destroy100: false, allRescued: false, untouched: false };
}
export function renderTitle(profile) {
    const craft = AIRCRAFT.find(a => a.id === profile.selectedAircraft) ?? AIRCRAFT[0];
    const craftUri = aircraftHangarSpriteUrl(craft.id);
    return shell(`
    <section class="title-scene">
      <div class="title-radar" aria-hidden="true"></div>
      <div class="title-grid" aria-hidden="true"></div>
      <div class="title-aircraft-wrap"><img class="title-aircraft" src="${craftUri}" alt="${esc(craft.name)}"></div>
      <div class="title-copy">
        <div class="eyebrow">ORIGINAL VERTICAL COMBAT SYSTEM</div>
        <h1>SKY<br><span>AEGIS</span></h1>
        <p>COASTAL DEFENCE WING // COMBAT BUILD</p>
      </div>
      <div class="title-actions glass-panel">
        <div class="profile-line"><span>PROFILE</span><strong>${profile.profileType === 'review' ? 'REVIEW FLEET' : 'CAMPAIGN'}</strong></div>
        <button class="primary-action" data-cmd="enter-hangar"><span>ENTER HANGAR</span><small>9 AIRCRAFT AVAILABLE</small></button>
        <button class="secondary-action" data-cmd="settings">SETTINGS</button>
      </div>
      <div class="build-stamp">WEB/PWA // BUILD 1.1</div>
    </section>
  `, 'title-screen');
}
export function renderHangar(profile, craft) {
    const craftUri = aircraftHangarSpriteUrl(craft.id);
    const unlocked = new Set(profile.unlockedAircraft);
    const dps = craft.weapon.damage / craft.weapon.cadence;
    const upgrades = ['hull', 'primary', 'secondary', 'magnet', 'tactical'].map(key => {
        const q = progression.quote(profile, key);
        const label = { hull: 'HULL', primary: 'PRIMARY', secondary: 'SECONDARY', magnet: 'SALVAGE MAGNET', tactical: 'TACTICAL' }[key];
        const disabled = q.maxed || profile.salvage < q.cost;
        return `<button class="upgrade-row ${disabled ? 'disabled' : ''}" data-upgrade="${key}" ${disabled ? 'disabled' : ''}>
      <span><b>${label}</b><small>LV ${q.level}${q.maxed ? ' / MAX' : ` → ${q.nextLevel}`}</small></span>
      <strong>${q.maxed ? 'MAX' : `${q.cost} ◈`}</strong>
    </button>`;
    }).join('');
    const cards = AIRCRAFT.map(a => {
        const selected = a.id === craft.id;
        const owned = unlocked.has(a.id);
        const uri = aircraftPortraitSpriteUrl(a.id);
        return `<button class="aircraft-card family-${a.weapon.family} ${selected ? 'selected' : ''} ${owned ? '' : 'locked'}" data-aircraft="${a.id}" ${owned ? '' : 'disabled'} aria-pressed="${selected}">
      <span class="aircraft-thumb"><img src="${uri}" alt=""></span>
      <span class="aircraft-card-copy"><b>${esc(a.name)}</b><small>${esc(a.familyLabel)}</small></span>
      ${owned ? '' : '<span class="lock-chip">LOCKED</span>'}
    </button>`;
    }).join('');
    return shell(`
    ${topBar('HANGAR', `<div class="resource-pill"><span>◈</span><strong>${profile.salvage}</strong></div>`)}
    <section class="hangar-layout family-${craft.weapon.family}">
      <div class="hangar-bay">
        <div class="hangar-light"></div><div class="hangar-floor"></div><div class="hangar-lines"></div>
        <div class="craft-class-badge"><span>${familyTitle(craft)}</span><strong>${variantTitle(craft)}</strong></div>
        <img class="hangar-aircraft" src="${craftUri}" alt="${esc(craft.name)}">
        <div class="craft-nameplate"><div><small>${esc(craft.callsign)}</small><h2>${esc(craft.name)}</h2></div><span>${esc(craft.role)}</span></div>
      </div>
      <aside class="hangar-data glass-panel">
        <div class="hangar-description">${esc(craft.description)}</div>
        ${stat('SPEED', craft.speed, pct(craft.speed, mins.speed, maxs.speed))}
        ${stat('HULL', craft.maxHp, pct(craft.maxHp, mins.hp, maxs.hp))}
        ${stat('FIREPOWER', dps, pct(dps, mins.dps, maxs.dps))}
        <div class="weapon-card"><div><span>PRIMARY</span><strong>${esc(craft.weapon.id.replaceAll('-', ' ').toUpperCase())}</strong></div><small>${Math.round(1 / craft.weapon.cadence * 10) / 10} SHOTS/S · ${craft.weapon.salvo} BARREL${craft.weapon.salvo === 1 ? '' : 'S'}</small></div>
        <div class="ability-card"><span>SIGNATURE</span><strong>${esc(craft.ability.name)}</strong><small>${esc(craft.ability.description)}</small></div>
      </aside>
      <aside class="upgrade-panel glass-panel"><div class="panel-heading"><span>FLEET UPGRADES</span><small>SHARED ACROSS AIRCRAFT</small></div>${upgrades}</aside>
      <div class="aircraft-carousel" aria-label="Aircraft roster">${cards}</div>
      <div class="hangar-actions"><button class="secondary-action" data-cmd="title">BACK</button><button class="primary-action compact" data-cmd="mission-map"><span>MISSION SELECT</span><small>COASTAL INTERCEPT</small></button></div>
    </section>
  `, 'hangar-screen');
}
export function renderMissionMap(profile) {
    const m = medalState(profile);
    const earned = [m.destroy70, m.destroy100, m.allRescued, m.untouched].filter(Boolean).length;
    return shell(`
    ${topBar('MISSION MAP', `<div class="resource-pill"><span>★</span><strong>${earned}/4</strong></div>`)}
    <section class="mission-map-scene">
      <div class="map-water"></div><div class="map-coast"></div><div class="map-route"></div>
      <div class="map-node node-1 active"><span>01</span><strong>COASTAL<br>INTERCEPT</strong></div>
      <div class="map-node node-2 locked"><span>02</span><strong>LOCKED</strong></div>
      <div class="map-node node-3 locked"><span>03</span><strong>LOCKED</strong></div>
      <article class="mission-card glass-panel">
        <div class="eyebrow">SECTOR 01 // COASTAL DEFENCE</div>
        <h2>COASTAL INTERCEPT</h2>
        <p>Break an enemy push through the harbour, recover stranded personnel and destroy the Leviathan assault carrier.</p>
        <div class="medal-grid">
          ${medal('DESTROY 70%', m.destroy70)}${medal('DESTROY 100%', m.destroy100)}${medal('RESCUE ALL 6', m.allRescued)}${medal('NO HULL DAMAGE', m.untouched)}
        </div>
        <div class="mission-meta"><span><b>4–5 MIN</b> SORTIE</span><span><b>10</b> ENEMY FAMILIES</span><span><b>2</b> BOSSES</span></div>
        <button class="primary-action compact" data-cmd="briefing"><span>MISSION BRIEFING</span><small>NORMAL DIFFICULTY</small></button>
      </article>
      <button class="map-back" data-cmd="hangar">← HANGAR</button>
    </section>
  `, 'map-screen');
}
export function renderBriefing(craft) {
    const threats = ENEMIES.map(e => `<span class="threat-chip">${esc(e.name.toUpperCase())}</span>`).join('');
    const uri = aircraftHangarSpriteUrl(craft.id);
    return shell(`
    ${topBar('MISSION BRIEFING')}
    <section class="briefing-layout">
      <div class="briefing-hero">
        <div class="briefing-sector">SECTOR 01</div><h2>COASTAL<br>INTERCEPT</h2><p>Breakwater approaches. Leviathan follows.</p>
        <div class="briefing-route"><span></span><span></span><span></span><span></span></div>
      </div>
      <div class="briefing-panel glass-panel">
        <div class="briefing-craft"><img src="${uri}" alt="${esc(craft.name)}"><div><small>SELECTED AIRCRAFT</small><strong>${esc(craft.name)}</strong><span>${esc(craft.familyLabel)}</span></div></div>
        <div class="objective-list"><div><span>01</span><p>Destroy hostile air, land and naval forces.</p></div><div><span>02</span><p>Rescue all six stranded personnel.</p></div><div><span>03</span><p>Break the gunship, then dismantle Leviathan component by component.</p></div></div>
        <div class="threat-heading"><span>THREAT DATABASE</span><strong>10 ENEMY FAMILIES</strong></div><div class="threats">${threats}</div>
        <div class="loadout-strip"><div><span>SIGNATURE</span><strong>${esc(craft.ability.name)}</strong></div><div><span>TACTICAL</span><strong>AREA BOMB ×3</strong></div></div>
        <div class="briefing-actions"><button class="secondary-action" data-cmd="map">BACK</button><button class="primary-action compact launch" data-cmd="launch"><span>LAUNCH SORTIE</span><small>AUTO-FIRE ENABLED</small></button></div>
      </div>
    </section>
  `, 'briefing-screen');
}
export function renderPlaying(craft) {
    return `<main class="combat-screen family-${craft.weapon.family}" id="combat-stage">
    <div class="combat-vignette" aria-hidden="true"></div>
    <div class="combat-hud hud-top">
      <div class="hud-block hp-block"><div class="hud-caption"><span>HULL</span><strong data-hud="hp">100%</strong></div><div class="hud-meter"><span data-hud-bar="hp" style="width:100%"></span></div></div>
      <div class="hud-center"><strong data-hud="message">COASTAL INTERCEPT</strong><span data-hud="objective">0 / 0 HOSTILES</span></div>
      <button class="hud-pause" data-action="pause" aria-label="Pause">Ⅱ</button>
    </div>
    <div class="combat-hud hud-bottom">
      <div class="score-stack"><span>SCORE <b data-hud="score">0</b></span><span>RESCUE <b data-hud="rescue">0/6</b></span><span>SALVAGE <b data-hud="salvage">0</b></span></div>
      <div class="combat-actions">
        <button class="combat-button ability" data-action="ability"><span class="action-ring" data-hud-bar="ability"></span><small>SIGNATURE</small><strong>${esc(craft.ability.name)}</strong><em data-hud="ability">READY</em></button>
        <button class="combat-button tactical" data-action="tactical"><small>TACTICAL</small><strong>AREA BOMB</strong><em data-hud="tactical">×3</em></button>
      </div>
    </div>
    <div class="boss-hud" data-hud-panel="boss" hidden><span data-hud="boss-name">LEVIATHAN</span><div><i data-hud-bar="boss" style="width:100%"></i></div><strong data-hud="boss-phase"></strong></div>
  </main>`;
}
export function renderPauseOverlay() {
    return `<div class="pause-overlay" id="pause-overlay"><div class="pause-panel glass-panel"><div class="eyebrow">SORTIE SUSPENDED</div><h2>PAUSED</h2><p>Simulation and cooldowns are frozen.</p><button class="primary-action compact" data-cmd="resume"><span>RESUME</span><small>3-SECOND COUNTDOWN</small></button><button class="secondary-action" data-cmd="settings">SETTINGS</button><button class="secondary-action" data-cmd="abort">ABORT TO HANGAR</button></div></div>`;
}
export function renderPauseSettings(profile) {
    const s = profile.settings;
    return `<div class="pause-overlay" id="pause-overlay"><form class="pause-panel pause-settings glass-panel" id="pause-settings-form">
    <div class="eyebrow">SORTIE SUSPENDED // SETTINGS</div><h2>COMBAT SETTINGS</h2>
    <label class="setting-row"><span><b>VISUAL QUALITY</b><small>Water detail and effect density</small></span><select name="quality"><option value="low" ${s.quality === 'low' ? 'selected' : ''}>LOW</option><option value="balanced" ${s.quality === 'balanced' ? 'selected' : ''}>BALANCED</option><option value="high" ${s.quality === 'high' ? 'selected' : ''}>HIGH</option></select></label>
    <label class="setting-row"><span><b>CONTROL SENSITIVITY</b><small>Relative-drag response</small></span><input name="sensitivity" type="range" min="0.65" max="1.6" step="0.05" value="${s.sensitivity}"><output>${s.sensitivity.toFixed(2)}×</output></label>
    <label class="setting-row"><span><b>MUSIC</b></span><input name="musicVolume" type="range" min="0" max="1" step="0.05" value="${s.musicVolume}"><output>${Math.round(s.musicVolume * 100)}%</output></label>
    <label class="setting-row"><span><b>EFFECTS</b></span><input name="effectsVolume" type="range" min="0" max="1" step="0.05" value="${s.effectsVolume}"><output>${Math.round(s.effectsVolume * 100)}%</output></label>
    <label class="setting-row switch-row"><span><b>REDUCE CAMERA SHAKE</b></span><input name="reduceShake" type="checkbox" ${s.reduceShake ? 'checked' : ''}></label>
    <div class="settings-actions"><button type="button" class="secondary-action" data-cmd="pause-settings-back">BACK</button><button type="submit" class="primary-action compact"><span>APPLY SETTINGS</span><small>WITHOUT LEAVING SORTIE</small></button></div>
  </form></div>`;
}
export function renderResumeCountdown(value) {
    return `<div class="resume-countdown" id="resume-countdown"><span>RESUMING</span><strong>${Math.max(1, Math.min(3, Math.round(value)))}</strong></div>`;
}
export function renderResults(result) {
    const medals = [['DESTROY 70%', result.medals.destroy70], ['DESTROY 100%', result.medals.destroy100], ['RESCUE ALL', result.medals.allRescued], ['NO DAMAGE', result.medals.untouched]];
    return shell(`
    ${topBar('AFTER ACTION REPORT')}
    <section class="results-layout ${result.completed ? 'success' : 'failure'}">
      <div class="result-crest"><span>${result.completed ? '★' : '!'}</span></div>
      <div class="eyebrow">SECTOR 01 // COASTAL INTERCEPT</div>
      <h2>${result.completed ? 'MISSION COMPLETE' : 'AIRCRAFT LOST'}</h2>
      <div class="result-score"><small>FINAL SCORE</small><strong>${result.score.toLocaleString('en-US')}</strong></div>
      <div class="result-metrics glass-panel"><div><span>SALVAGE</span><strong>+${result.salvage} ◈</strong></div><div><span>RESCUED</span><strong>${result.rescued}/6</strong></div><div><span>HOSTILES</span><strong>${result.eligibleDestroyed}/${result.eligibleTotal}</strong></div><div><span>TIME</span><strong>${Math.floor(result.duration / 60)}:${String(Math.floor(result.duration % 60)).padStart(2, '0')}</strong></div></div>
      <div class="result-medals"><div class="result-medal-count"><strong>${result.medals.count} / 4</strong><span>MISSION MEDALS</span></div>${medals.map(([l, e]) => medal(l, e)).join('')}</div>
      <div class="results-actions"><button class="secondary-action" data-cmd="hangar">HANGAR</button><button class="primary-action compact" data-cmd="replay"><span>REPLAY MISSION</span><small>COASTAL INTERCEPT</small></button></div>
    </section>
  `, 'results-screen');
}
export function renderSettings(profile, returnState) {
    const s = profile.settings;
    return shell(`
    ${topBar('SETTINGS')}
    <form class="settings-panel glass-panel" id="settings-form" data-return="${returnState}">
      <div class="settings-heading"><div><span>FLIGHT SYSTEMS</span><h2>SETTINGS</h2></div><p>Combat rules never change with visual quality.</p></div>
      <label class="setting-row"><span><b>VISUAL QUALITY</b><small>Water detail and effect density</small></span><select name="quality"><option value="low" ${s.quality === 'low' ? 'selected' : ''}>LOW</option><option value="balanced" ${s.quality === 'balanced' ? 'selected' : ''}>BALANCED</option><option value="high" ${s.quality === 'high' ? 'selected' : ''}>HIGH</option></select></label>
      <label class="setting-row"><span><b>CONTROL SENSITIVITY</b><small>Relative-drag response</small></span><input name="sensitivity" type="range" min="0.65" max="1.6" step="0.05" value="${s.sensitivity}"><output>${s.sensitivity.toFixed(2)}×</output></label>
      <label class="setting-row"><span><b>MUSIC</b><small>Electronic combat score</small></span><input name="musicVolume" type="range" min="0" max="1" step="0.05" value="${s.musicVolume}"><output>${Math.round(s.musicVolume * 100)}%</output></label>
      <label class="setting-row"><span><b>EFFECTS</b><small>Weapons, hits and explosions</small></span><input name="effectsVolume" type="range" min="0" max="1" step="0.05" value="${s.effectsVolume}"><output>${Math.round(s.effectsVolume * 100)}%</output></label>
      <label class="setting-row switch-row"><span><b>REDUCE CAMERA SHAKE</b><small>Does not change gameplay or hitboxes</small></span><input name="reduceShake" type="checkbox" ${s.reduceShake ? 'checked' : ''}></label>
      <div class="settings-actions"><button type="button" class="secondary-action" data-cmd="settings-cancel">CANCEL</button><button type="submit" class="primary-action compact" data-cmd="settings-save"><span>SAVE SETTINGS</span><small>APPLY NOW</small></button></div>
    </form>
  `, 'settings-screen');
}
export function renderError(message) {
    return shell(`${topBar('SYSTEM ERROR')}<section class="error-panel glass-panel"><div class="result-crest"><span>!</span></div><h2>FLIGHT SYSTEM FAULT</h2><p>${esc(message)}</p><button class="primary-action compact" data-cmd="title"><span>RETURN TO TITLE</span><small>SAFE RECOVERY</small></button></section>`, 'error-screen');
}
