import { FAMILY_ACCENTS, FAMILY_GLOW } from "../content/assets.js";
const poly = (points) => points.map(([x, y]) => `${x},${y}`).join(' ');
const esc = (value) => value.replace(/[&<>'\"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&apos;', '\"': '&quot;' }[c]));
const detailSeed = (id) => [...id].reduce((n, c) => ((n * 33 + c.charCodeAt(0)) >>> 0), 5381);
const svgInject = (svg, content) => svg.replace('</svg>', `${content}</svg>`);
function aircraftMicrodetail(craft) {
    const accent = FAMILY_ACCENTS[craft.weapon.family];
    const seed = detailSeed(craft.id);
    const y0 = -22 + (seed % 11);
    const hardware = craft.weapon.family === 'laser'
        ? `<g data-part="weapon-hardware" fill="#101820" stroke="${accent}" stroke-width="1"><rect x="-34" y="${y0 + 22}" width="10" height="19" rx="4"/><rect x="24" y="${y0 + 22}" width="10" height="19" rx="4"/><circle cx="-29" cy="${y0 + 31}" r="2.6" fill="#d9fbff"/><circle cx="29" cy="${y0 + 31}" r="2.6" fill="#d9fbff"/></g>`
        : craft.weapon.family === 'minigun'
            ? `<g data-part="weapon-hardware" stroke="#d4dce0" stroke-width="2.1" stroke-linecap="round"><path d="M-31 ${y0 + 19}v18m4-18v18m54-18v18m4-18v18"/><g fill="${accent}" stroke="none"><circle cx="-29" cy="${y0 + 38}" r="2.5"/><circle cx="29" cy="${y0 + 38}" r="2.5"/></g></g>`
            : `<g data-part="weapon-hardware" fill="#131b21" stroke="${accent}" stroke-width="1"><rect x="-43" y="${y0 + 18}" width="17" height="22" rx="3"/><rect x="26" y="${y0 + 18}" width="17" height="22" rx="3"/>${[-38, -32, 32, 38].map(x => `<circle cx="${x}" cy="${y0 + 28}" r="2.5" fill="#2b3339"/>`).join('')}</g>`;
    return `
 <g data-part="surface-grain" clip-path="url(#clip-${craft.id})" opacity=".24"><rect x="-70" y="-75" width="140" height="150" fill="url(#brush-${craft.id})"/></g>
 <g data-part="specular-rake" opacity=".5"><path d="M-4 -57L-10 26" stroke="#eef8fb" stroke-width="1.1"/><path d="M4 -56L11 25" stroke="#05090c" stroke-opacity=".48" stroke-width="1.2"/><path d="M-45 ${y0 + 35}L-18 ${y0 + 25}M45 ${y0 + 35}L18 ${y0 + 25}" stroke="#d5e1e6" stroke-opacity=".22"/></g>
 <g data-part="intake-detail"><path d="M-19 ${y0 + 25}q7-7 13-2l-4 12q-7 2-12-3z" fill="#10171d" stroke="#7d8c95" stroke-width=".8"/><path d="M19 ${y0 + 25}q-7-7-13-2l4 12q7 2 12-3z" fill="#10171d" stroke="#7d8c95" stroke-width=".8"/></g>
 ${hardware}
 <g data-part="warning-decals" fill="${accent}" opacity=".72"><path d="M-19 ${y0 + 7}l7 0-3.5 5z"/><path d="M19 ${y0 + 7}l-7 0 3.5 5z"/><rect x="-2.5" y="${y0 + 48}" width="5" height="1.4"/></g>
 <g data-part="rivet-strip" fill="#d5dde1" opacity=".5">${[-32, -20, -8, 8, 20, 32].map((x, i) => `<circle cx="${x}" cy="${y0 + 42 + (i % 2) * 3}" r=".9"/>`).join('')}</g>`;
}
function enemyMicrodetail(enemy) {
    const a = enemy.art.accent;
    const seed = detailSeed(enemy.id);
    const y = -6 + (seed % 9);
    return `<g data-part="surface-grain" opacity=".18" stroke="#e2e8ea" stroke-width=".7"><path d="M-42 ${y - 17}L35 ${y + 4}M-37 ${y - 7}L31 ${y + 12}M-28 ${y + 7}L24 ${y + 20}"/><path d="M-36 ${y + 18}L27 ${y - 9}" stroke="#05080b" stroke-opacity=".55"/></g><g data-part="armour-microdetail"><g fill="#cbd3d7" opacity=".55">${[-26, -13, 13, 26].map((x, i) => `<circle cx="${x}" cy="${y + 25 + (i % 2) * 4}" r="1.05"/>`).join('')}</g><path d="M-23 ${y + 31}H23" stroke="${a}" stroke-opacity=".46" stroke-width="1"/><path d="M-6 ${y - 28}h12" stroke="#d9e1e4" stroke-opacity=".5" stroke-width="1.2"/></g>`;
}
function aircraftProductionDetail(craft) {
    const accent = FAMILY_ACCENTS[craft.weapon.family];
    const glow = FAMILY_GLOW[craft.weapon.family];
    const code = craft.name.replace(/[^A-Z0-9]/gi, '').slice(0, 5).toUpperCase();
    const hardpoints = craft.weapon.family === 'laser'
        ? `<g data-part="family-hardpoints" data-family="laser"><path d="M-33 -8L-26 -29M33 -8L26 -29" stroke="${accent}" stroke-width="3.1" stroke-linecap="round"/><path d="M-33 -8L-26 -29M33 -8L26 -29" stroke="#e9feff" stroke-width=".8" stroke-linecap="round"/><circle cx="-27" cy="-28" r="3.2" fill="${glow}"/><circle cx="27" cy="-28" r="3.2" fill="${glow}"/></g>`
        : craft.weapon.family === 'minigun'
            ? `<g data-part="family-hardpoints" data-family="minigun" fill="#151c22" stroke="#9ba8af" stroke-width=".9"><rect x="-38" y="-15" width="13" height="25" rx="5"/><rect x="25" y="-15" width="13" height="25" rx="5"/><g stroke="#e2e8eb" stroke-width="1.4"><path d="M-35 -17v-18m4 18v-18m58 18v-18m4 18v-18"/></g><circle cx="-31.5" cy="7" r="2.5" fill="${accent}" stroke="none"/><circle cx="31.5" cy="7" r="2.5" fill="${accent}" stroke="none"/></g>`
            : `<g data-part="family-hardpoints" data-family="missile" fill="#141b21" stroke="#819099" stroke-width=".9"><path d="M-48 -7h20l4 23h-23z"/><path d="M48 -7H28l-4 23h23z"/>${[-42, -35, 35, 42].map((x, i) => `<circle cx="${x}" cy="${5 + (i % 2) * 5}" r="3.1" fill="#0b1014" stroke="${accent}"/><circle cx="${x}" cy="${5 + (i % 2) * 5}" r="1.2" fill="#dfffe7" stroke="none"/>`).join('')}</g>`;
    return `
 <g data-part="edge-bevel" fill="none" stroke-linecap="round">
  <path d="M-9 -43Q0 -56 9 -43" stroke="rgba(255,255,255,.55)" stroke-width="1.25"/>
  <path d="M-43 12Q-28 22 -16 18M43 12Q28 22 16 18" stroke="rgba(235,247,250,.28)" stroke-width="1.1"/>
  <path d="M-11 38Q0 48 11 38" stroke="rgba(3,8,12,.7)" stroke-width="1.3"/>
 </g>
 <g data-part="service-stencils" opacity=".7" font-family="Arial, sans-serif" font-weight="700">
  <text x="-37" y="25" fill="#e4edf0" font-size="4.2" transform="rotate(-8 -37 25)">${code}</text>
  <text x="25" y="25" fill="${accent}" font-size="3.5" letter-spacing=".7">${craft.variant.toUpperCase().slice(0, 3)}</text>
  <path d="M-17 31h8M9 31h8" stroke="${accent}" stroke-width="1.1"/>
 </g>
 ${hardpoints}`;
}
function enemyProductionDetail(enemy) {
    const a = enemy.art.accent;
    const seed = detailSeed(enemy.id);
    const x = 8 + (seed % 9);
    return `<g data-part="enemy-specular" opacity=".62" fill="none" stroke-linecap="round"><path d="M-${x + 22} -27Q-${x} -38 ${x + 15} -20" stroke="rgba(255,255,255,.48)" stroke-width="1.35"/><path d="M-${x + 28} 12Q0 23 ${x + 28} 12" stroke="rgba(222,233,238,.2)" stroke-width="1"/><path d="M-20 30H20" stroke="rgba(0,0,0,.55)" stroke-width="1.6"/></g><g data-part="enemy-access-panels" fill="#1a2026" stroke="#8a959c" stroke-width=".65" opacity=".88"><rect x="-19" y="6" width="11" height="8" rx="1.5"/><rect x="8" y="6" width="11" height="8" rx="1.5"/><path d="M-16 10h5M11 10h5" stroke="${a}" stroke-width=".8"/></g><g data-part="enemy-weapon-mounts">${enemy.art.hardpoints.map((h, i) => `<g transform="translate(${h.x} ${h.y})"><circle r="${4.3 + (i % 2)}" fill="none" stroke="#d3dadd" stroke-opacity=".45" stroke-width="1"/><path d="M-3 0H3M0-3V3" stroke="${a}" stroke-width="1.1"/></g>`).join('')}</g>`;
}
function bossMicrodetail(boss) {
    const a = boss.art.accent;
    const span = boss.id === 'leviathan' ? 220 : 88;
    return `<g data-part="boss-surface-detail" opacity=".58"><g fill="#d7dfe2" opacity=".42">${[-1, -.66, -.33, .33, .66, 1].map((f, i) => `<circle cx="${Math.round(span * f)}" cy="${36 + (i % 2) * 22}" r="${boss.id === 'leviathan' ? 2.1 : 1.4}"/>`).join('')}</g><path d="M-${span} 78H-${Math.round(span * .45)}M${Math.round(span * .45)} 78H${span}" stroke="${a}" stroke-opacity=".42" stroke-width="2"/><path d="M-${Math.round(span * .72)} -58L-${Math.round(span * .45)} -74M${Math.round(span * .72)} -58L${Math.round(span * .45)} -74" stroke="#eef4f6" stroke-opacity=".28" stroke-width="2"/></g>`;
}
export class AssetFactory {
    static createAircraftSvg(craft, bank = 0, damage = 0) {
        const accent = FAMILY_ACCENTS[craft.weapon.family];
        const glow = FAMILY_GLOW[craft.weapon.family];
        const bankScale = 1 - Math.abs(bank) * .055;
        const bankSkew = bank * 2.1;
        const wingShadeL = bank > 0 ? '#28333c' : '#4b5b66';
        const wingShadeR = bank < 0 ? '#28333c' : '#4b5b66';
        const armour = craft.art.armourPlates ?? [];
        const vents = craft.art.vents ?? [];
        const damageOpacity = damage === 0 ? 0 : damage === 1 ? .55 : .9;
        const bankLabel = bank < 0 ? `L${Math.abs(bank)}` : bank > 0 ? `R${bank}` : 'N';
        return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-76 -82 152 164" role="img" aria-label="${esc(craft.name)} ${bankLabel}">
<defs>
 <linearGradient id="metal-${craft.id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#dbe5e9"/><stop offset=".18" stop-color="#788995"/><stop offset=".5" stop-color="#26313a"/><stop offset=".78" stop-color="#596975"/><stop offset="1" stop-color="#131b22"/></linearGradient>
 <linearGradient id="body-${craft.id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8999a4"/><stop offset=".42" stop-color="#35434e"/><stop offset="1" stop-color="#161f27"/></linearGradient>
 <linearGradient id="glass-${craft.id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#d7f8ff"/><stop offset=".22" stop-color="#4ea8c3"/><stop offset=".6" stop-color="#123948"/><stop offset="1" stop-color="#071a24"/></linearGradient>
 <radialGradient id="engine-${craft.id}"><stop offset="0" stop-color="#fff"/><stop offset=".2" stop-color="${glow}"/><stop offset=".65" stop-color="${accent}"/><stop offset="1" stop-color="${accent}" stop-opacity="0"/></radialGradient>
 <filter id="shadow-${craft.id}" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="3"/></filter>
 <filter id="glow-${craft.id}" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
 <pattern id="brush-${craft.id}" width="9" height="9" patternUnits="userSpaceOnUse"><path d="M0 1H9M0 5H9" stroke="#fff" stroke-opacity=".14" stroke-width=".45"/><path d="M2 0v9M7 0v9" stroke="#05090c" stroke-opacity=".16" stroke-width=".35"/></pattern>
 <clipPath id="clip-${craft.id}"><polygon points="${poly(craft.art.leftWing)}"/><polygon points="${poly(craft.art.rightWing)}"/><polygon points="${poly(craft.art.tailLeft)}"/><polygon points="${poly(craft.art.tailRight)}"/><polygon points="${poly(craft.art.body)}"/></clipPath>
</defs>
<ellipse cx="4" cy="8" rx="51" ry="59" fill="#000" opacity=".32" filter="url(#shadow-${craft.id})" transform="translate(6 8)"/>
<g transform="skewX(${bankSkew}) scale(${bankScale} 1)">
 <g data-part="aero-depth" transform="translate(0 3.2)" opacity=".92">
  <polygon points="${poly(craft.art.leftWing)}" fill="#111820" stroke="#05080b" stroke-width="2.8"/>
  <polygon points="${poly(craft.art.rightWing)}" fill="#111820" stroke="#05080b" stroke-width="2.8"/>
  <polygon points="${poly(craft.art.tailLeft)}" fill="#111820" stroke="#05080b" stroke-width="2.4"/>
  <polygon points="${poly(craft.art.tailRight)}" fill="#111820" stroke="#05080b" stroke-width="2.4"/>
  <polygon points="${poly(craft.art.body)}" fill="#10171d" stroke="#05080b" stroke-width="2.5"/>
 </g>
 <polygon points="${poly(craft.art.leftWing)}" fill="${wingShadeL}" stroke="#a7b5be" stroke-width="1.2"/>
 <polygon points="${poly(craft.art.rightWing)}" fill="${wingShadeR}" stroke="#899aa5" stroke-width="1.2"/>
 <polygon points="${poly(craft.art.tailLeft)}" fill="#3b4852" stroke="#82929d" stroke-width="1"/>
 <polygon points="${poly(craft.art.tailRight)}" fill="#303c46" stroke="#82929d" stroke-width="1"/>
 ${armour.map((a, i) => `<polygon points="${poly(a)}" fill="${i % 2 ? '#465660' : '#53636d'}" stroke="${accent}" stroke-opacity=".42" stroke-width="1"/>`).join('')}
 <polygon points="${poly(craft.art.body)}" fill="url(#body-${craft.id})" stroke="#b7c3c9" stroke-width="1.3"/>
 <polygon points="${poly(craft.art.noseDetail)}" fill="url(#metal-${craft.id})" stroke="${accent}" stroke-width="1"/>
 <polygon points="${poly(craft.art.canopy)}" fill="url(#glass-${craft.id})" stroke="#aeeaff" stroke-opacity=".72" stroke-width="1.1"/>
 ${craft.art.enginePods.map(e => `<ellipse cx="${e.x}" cy="${e.y}" rx="${e.rx}" ry="${e.ry}" fill="#171f26" stroke="#6f7d86" stroke-width="1.1"/><ellipse cx="${e.x}" cy="${e.y + e.ry * .52}" rx="${Math.max(2, e.rx * .55)}" ry="${Math.max(3, e.ry * .35)}" fill="url(#engine-${craft.id})" filter="url(#glow-${craft.id})"/>`).join('')}
 ${craft.art.panelLines.map(line => `<polyline points="${poly(line)}" fill="none" stroke="#b9c5cb" stroke-opacity=".34" stroke-width=".8"/>`).join('')}
 ${vents.map(v => `<g opacity=".72"><rect x="${v.x}" y="${v.y}" width="${v.w}" height="${v.h}" rx="1" fill="#12191f" stroke="#798892" stroke-width=".5"/><path d="M${v.x + 1} ${v.y + 3}h${v.w - 2}m-${v.w - 2} 3h${v.w - 2}m-${v.w - 2} 3h${v.w - 2}" stroke="${accent}" stroke-opacity=".5" stroke-width=".6"/></g>`).join('')}
 <path d="M-4 -50 L0 -62 L4 -50" fill="none" stroke="${accent}" stroke-width="1.7" opacity=".9"/>
 <path d="M-28 8 L-18 11 M28 8 L18 11" stroke="${accent}" stroke-width="2.2" opacity=".72"/>
 <circle cx="0" cy="14" r="3.6" fill="${accent}" opacity=".9" filter="url(#glow-${craft.id})"/>
 ${aircraftMicrodetail(craft)}
 ${aircraftProductionDetail(craft)}
 <g opacity="${damageOpacity}">
   <path d="M-18 -3 l9 8 -6 10 13 7" fill="none" stroke="#0b0b0b" stroke-width="3.2"/>
   <path d="M21 9 l-8 7 9 8 -12 9" fill="none" stroke="#1a0e08" stroke-width="${damage === 2 ? 4.2 : 2.5}"/>
   <circle cx="-13" cy="8" r="${damage === 2 ? 8 : 5}" fill="#111" opacity=".72"/><circle cx="-11" cy="6" r="2" fill="#ff7548"/>
 </g>
</g>
</svg>`;
    }
    static createEnemySvg(enemy) {
        let svg;
        switch (enemy.id) {
            case 'aa-turret':
                svg = this.createAaTurretSvg(enemy);
                break;
            case 'missile-battery':
                svg = this.createMissileBatterySvg(enemy);
                break;
            case 'armoured-vehicle':
                svg = this.createArmouredVehicleSvg(enemy);
                break;
            case 'gunboat':
                svg = this.createGunboatSvg(enemy);
                break;
            case 'gunship':
                svg = this.createGunshipSvg(enemy);
                break;
            default:
                svg = this.createAirEnemySvg(enemy);
                break;
        }
        return svgInject(svg, `${enemyMicrodetail(enemy)}${enemyProductionDetail(enemy)}`);
    }
    static enemyDefs(enemy) {
        const accent = enemy.art.accent;
        return `<defs>
 <linearGradient id="enemyMetal-${enemy.id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#c8d0d4"/><stop offset=".22" stop-color="#6d747b"/><stop offset=".58" stop-color="#31343b"/><stop offset="1" stop-color="#12161c"/></linearGradient>
 <linearGradient id="enemyDark-${enemy.id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4e555d"/><stop offset="1" stop-color="#171b22"/></linearGradient>
 <linearGradient id="enemyEdge-${enemy.id}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#20252b"/><stop offset=".48" stop-color="#8b9398"/><stop offset="1" stop-color="#20252b"/></linearGradient>
 <radialGradient id="enemyGlow-${enemy.id}"><stop offset="0" stop-color="#fff"/><stop offset=".25" stop-color="${accent}"/><stop offset="1" stop-color="${accent}" stop-opacity="0"/></radialGradient>
 <filter id="enemyShadow-${enemy.id}" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="3"/></filter>
</defs>`;
    }
    static createAirEnemySvg(enemy) {
        const a = enemy.art;
        const accent = a.accent;
        return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-72 -82 144 164" role="img" aria-label="${esc(enemy.name)}">
${this.enemyDefs(enemy)}
<ellipse cx="5" cy="10" rx="42" ry="42" fill="#000" opacity=".33" filter="url(#enemyShadow-${enemy.id})"/>
<polygon points="${poly(a.silhouette)}" fill="url(#enemyMetal-${enemy.id})" stroke="#aeb7bd" stroke-width="1.5"/>
<polygon points="${poly(a.inner)}" fill="url(#enemyDark-${enemy.id})" stroke="${accent}" stroke-opacity=".55" stroke-width="1"/>
${a.details.map((line, i) => `<polyline points="${poly(line)}" fill="none" stroke="${i % 2 ? accent : '#d1d7da'}" stroke-opacity="${i % 2 ? .72 : .4}" stroke-width="${i % 2 ? 1.6 : 1}"/>`).join('')}
${a.hardpoints.map(h => `<g><circle cx="${h.x}" cy="${h.y}" r="5.2" fill="#171a20" stroke="${accent}" stroke-width="1.2"/><circle cx="${h.x}" cy="${h.y}" r="2.2" fill="${accent}"/></g>`).join('')}
${a.engines.map(e => `<ellipse cx="${e.x}" cy="${e.y}" rx="5.5" ry="10" fill="#171a20" stroke="#6d737a"/><ellipse cx="${e.x}" cy="${e.y + 5}" rx="3.5" ry="7" fill="url(#enemyGlow-${enemy.id})"/>`).join('')}
<path d="M-16 -8 L0 -17 L16 -8" fill="none" stroke="${accent}" stroke-width="1.8" opacity=".8"/>
</svg>`;
    }
    static createAaTurretSvg(enemy) {
        const a = enemy.art.accent;
        return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-72 -82 144 164" role="img" aria-label="${esc(enemy.name)}">
${this.enemyDefs(enemy)}
<ellipse cx="4" cy="29" rx="38" ry="22" fill="#000" opacity=".38" filter="url(#enemyShadow-${enemy.id})"/>
<g data-part="armoured-base"><path d="M-35 14 L-28 -22 L-15 -33 H16 L29 -22 L35 14 L25 32 H-25Z" fill="url(#enemyMetal-${enemy.id})" stroke="#b8c0c5" stroke-width="1.7"/><path d="M-28 17H28M-23 24H23" stroke="#161b21" stroke-width="5" opacity=".72"/><path d="M-24 9H24" stroke="#d3d9dc" stroke-opacity=".27"/></g>
<g data-part="turret-ring"><ellipse cx="0" cy="-10" rx="23" ry="17" fill="#1b2027" stroke="#7f8990" stroke-width="2"/><ellipse cx="0" cy="-13" rx="16" ry="12" fill="url(#enemyDark-${enemy.id})" stroke="${a}" stroke-opacity=".75"/></g>
<g data-part="twin-barrels"><path d="M-8 -18 L-12 -61" stroke="#20252c" stroke-width="8" stroke-linecap="round"/><path d="M8 -18 L12 -61" stroke="#20252c" stroke-width="8" stroke-linecap="round"/><path d="M-8 -19 L-12 -60" stroke="url(#enemyEdge-${enemy.id})" stroke-width="4" stroke-linecap="round"/><path d="M8 -19 L12 -60" stroke="url(#enemyEdge-${enemy.id})" stroke-width="4" stroke-linecap="round"/><rect x="-17" y="-64" width="10" height="7" rx="2" fill="#11171d" stroke="${a}"/><rect x="7" y="-64" width="10" height="7" rx="2" fill="#11171d" stroke="${a}"/></g>
<g data-part="radar" transform="translate(27 -31)"><path d="M-2 8V-6" stroke="#aab2b8" stroke-width="2"/><path d="M-12 -9 Q0 -21 12 -9 Q2 2 -12 -9Z" fill="#59626a" stroke="${a}" stroke-width="1.4"/><circle cx="0" cy="-9" r="2.5" fill="${a}"/></g>
<g data-part="armour-bolts" fill="#d2d8dc"><circle cx="-26" cy="7" r="1.5"/><circle cx="26" cy="7" r="1.5"/><circle cx="-18" cy="26" r="1.5"/><circle cx="18" cy="26" r="1.5"/></g>
</svg>`;
    }
    static createMissileBatterySvg(enemy) {
        const a = enemy.art.accent;
        const tread = (x) => `<g transform="translate(${x} 16)"><rect x="-13" y="-30" width="26" height="58" rx="10" fill="#14191f" stroke="#788188" stroke-width="2"/>${[-20, -10, 0, 10, 20].map(y => `<rect x="-10" y="${y - 3}" width="20" height="6" rx="2" fill="#4a5158"/>`).join('')}</g>`;
        return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-72 -82 144 164" role="img" aria-label="${esc(enemy.name)}">
${this.enemyDefs(enemy)}
<ellipse cx="3" cy="31" rx="46" ry="23" fill="#000" opacity=".4" filter="url(#enemyShadow-${enemy.id})"/>
<g data-part="tracks">${tread(-31)}${tread(31)}</g>
<g data-part="chassis"><path d="M-35 -19 H34 L41 -7 L35 31 H-37 L-43 11Z" fill="url(#enemyMetal-${enemy.id})" stroke="#b1bac0" stroke-width="1.8"/><path d="M-25 18H26" stroke="#171c22" stroke-width="5"/><rect x="-24" y="-12" width="48" height="19" rx="5" fill="url(#enemyDark-${enemy.id})" stroke="${a}" stroke-opacity=".55"/></g>
<g data-part="missile-rack" transform="rotate(-8 0 -23)"><path d="M-31 -3 L-20 -45 H-8 L-9 -1Z" fill="#252b31" stroke="#9da6ac"/><path d="M-11 -1 L-5 -50 H7 L9 -1Z" fill="#31383f" stroke="#a7b0b5"/><path d="M10 -2 L14 -45 H27 L30 1Z" fill="#252b31" stroke="#9da6ac"/>${[-14, 1, 20].map((x, i) => `<g><path d="M${x - 5} ${-44 - i * 2} L${x} ${-57 - i * 2} L${x + 5} ${-44 - i * 2}Z" fill="${a}"/><rect x="${x - 4}" y="${-44 - i * 2}" width="8" height="35" rx="4" fill="url(#enemyEdge-${enemy.id})"/></g>`).join('')}</g>
<g data-part="radar-dome"><path d="M-31 -16v-13" stroke="#a6afb4"/><circle cx="-31" cy="-31" r="7" fill="#22282e" stroke="${a}"/><path d="M-37 -32Q-31 -39 -25 -32" fill="none" stroke="#c8d0d4"/></g>
</svg>`;
    }
    static createArmouredVehicleSvg(enemy) {
        const a = enemy.art.accent;
        const treadBlocks = (x) => `<g transform="translate(${x} 9)"><rect x="-12" y="-38" width="24" height="73" rx="9" fill="#12171c" stroke="#747d84" stroke-width="2"/>${[-27, -15, -3, 9, 21].map(y => `<rect x="-9" y="${y}" width="18" height="7" rx="2" fill="#4a5157"/>`).join('')}</g>`;
        return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-72 -82 144 164" role="img" aria-label="${esc(enemy.name)}">
${this.enemyDefs(enemy)}
<ellipse cx="4" cy="27" rx="47" ry="25" fill="#000" opacity=".4" filter="url(#enemyShadow-${enemy.id})"/>
<g data-part="tracks">${treadBlocks(-35)}${treadBlocks(35)}</g>
<g data-part="hull"><path d="M-35 -27 L27 -29 L39 -15 L36 31 L22 39 H-25 L-39 28 L-41 -14Z" fill="url(#enemyMetal-${enemy.id})" stroke="#b1b9be" stroke-width="1.8"/><path d="M-24 18H26M-23 28H22" stroke="#1a2026" stroke-width="4"/><rect x="-25" y="-21" width="50" height="17" rx="5" fill="#343b42" stroke="#7d878e"/></g>
<g data-part="turret"><ellipse cx="0" cy="-17" rx="22" ry="17" fill="#20262d" stroke="#939da3" stroke-width="2"/><path d="M-13 -18 L-8 -36 H9 L15 -17 L10 -4 H-10Z" fill="url(#enemyDark-${enemy.id})" stroke="${a}" stroke-opacity=".7"/><path d="M0 -31 V-63" stroke="#1d2228" stroke-width="8" stroke-linecap="round"/><path d="M0 -31 V-63" stroke="url(#enemyEdge-${enemy.id})" stroke-width="4" stroke-linecap="round"/><rect x="-5" y="-67" width="10" height="8" rx="2" fill="#11161b" stroke="${a}"/></g>
<g data-part="hatches"><rect x="-19" y="2" width="14" height="10" rx="2" fill="#1e242a" stroke="#7b858b"/><rect x="6" y="2" width="14" height="10" rx="2" fill="#1e242a" stroke="#7b858b"/><circle cx="26" cy="21" r="3" fill="${a}"/></g>
</svg>`;
    }
    static createGunboatSvg(enemy) {
        const a = enemy.art.accent;
        return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-72 -82 144 164" role="img" aria-label="${esc(enemy.name)}">
${this.enemyDefs(enemy)}
<ellipse cx="4" cy="15" rx="34" ry="57" fill="#000" opacity=".32" filter="url(#enemyShadow-${enemy.id})"/>
<g data-part="hull"><path d="M0 -60 L-23 -40 L-34 -5 L-31 39 L-15 57 H15 L31 39 L34 -5 L23 -40Z" fill="url(#enemyMetal-${enemy.id})" stroke="#c0c8cc" stroke-width="1.8"/><path d="M0 -52 L-18 -34 L-23 34 L-11 47 H11 L23 34 L18 -34Z" fill="#333b42" stroke="#7c868c"/><path d="M-31 17Q0 25 31 17" stroke="${a}" stroke-width="2" fill="none" opacity=".8"/></g>
<g data-part="bridge"><path d="M-16 -8 L-11 -27 H11 L16 -8 L11 5 H-11Z" fill="#1b232a" stroke="#89969e"/><path d="M-8 -22H8" stroke="#98eaff" stroke-width="5" opacity=".65"/><rect x="-6" y="8" width="12" height="17" rx="3" fill="#262d34" stroke="#778188"/></g>
<g data-part="deck-guns"><g transform="translate(0 -39)"><circle r="9" fill="#1c2228" stroke="${a}"/><path d="M0 -5V-21" stroke="#bec6ca" stroke-width="4" stroke-linecap="round"/></g><g transform="translate(-16 18)"><circle r="7" fill="#1c2228" stroke="${a}"/><path d="M0 -4V-17" stroke="#aeb7bc" stroke-width="3"/></g><g transform="translate(16 18)"><circle r="7" fill="#1c2228" stroke="${a}"/><path d="M0 -4V-17" stroke="#aeb7bc" stroke-width="3"/></g></g>
<g data-part="missile-cells" fill="#12181d" stroke="#737d84">${[-12, -4, 4, 12].map(x => `<rect x="${x - 3}" y="31" width="6" height="10" rx="1"/>`).join('')}</g>
</svg>`;
    }
    static createGunshipSvg(enemy) {
        const a = enemy.art.accent;
        const rotor = (x) => `<g transform="translate(${x} 0)"><circle r="19" fill="#11161b" stroke="#778087" stroke-width="2"/><circle r="5" fill="#6f7980" stroke="${a}"/><g data-part="rotors" stroke="#aeb6ba" stroke-width="3" stroke-linecap="round"><path d="M-25 0H25"/><path d="M0 -25V25"/><path d="M-18 -18L18 18"/><path d="M18 -18L-18 18"/></g></g>`;
        return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-78 -82 156 164" role="img" aria-label="${esc(enemy.name)}">
${this.enemyDefs(enemy)}
<ellipse cx="5" cy="16" rx="55" ry="39" fill="#000" opacity=".31" filter="url(#enemyShadow-${enemy.id})"/>
${rotor(-45)}${rotor(45)}
<g data-part="gunship-hull"><path d="M0 -42 L-18 -27 L-29 -5 L-25 29 L-12 45 H12 L25 29 L29 -5 L18 -27Z" fill="url(#enemyMetal-${enemy.id})" stroke="#b8c1c6" stroke-width="1.7"/><path d="M0 -31 L-10 -17 L-11 8 L0 22 L11 8 L10 -17Z" fill="#163642" stroke="#8ddcf2" stroke-opacity=".65"/><path d="M-18 22L-32 34M18 22L32 34" stroke="#667179" stroke-width="7"/></g>
<g data-part="chin-turret"><circle cx="0" cy="24" r="9" fill="#1c2228" stroke="${a}"/><path d="M-4 27L-7 43M4 27L7 43" stroke="#c1c9cd" stroke-width="3"/><circle cx="0" cy="23" r="2.4" fill="${a}"/></g>
<g data-part="engine-exhausts"><ellipse cx="-14" cy="35" rx="6" ry="9" fill="#161c21" stroke="#69747b"/><ellipse cx="14" cy="35" rx="6" ry="9" fill="#161c21" stroke="#69747b"/></g>
</svg>`;
    }
    static createBossSvg(boss) {
        const svg = boss.id === 'leviathan' ? this.createLeviathanSvg(boss) : this.createBreakwaterSvg(boss);
        return svgInject(svg, bossMicrodetail(boss));
    }
    static createBreakwaterSvg(boss) {
        const a = boss.art.accent;
        const enemy = { id: 'gunship', art: boss.art };
        return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-130 -95 260 190" role="img" aria-label="${esc(boss.name)}">
${this.enemyDefs(enemy).replaceAll('gunship', 'breakwater')}
<ellipse cx="8" cy="25" rx="112" ry="61" fill="#000" opacity=".33" filter="url(#enemyShadow-breakwater)"/>
<g data-part="breakwater-vtol"><g transform="translate(-88 3)"><circle r="31" fill="#151a20" stroke="#6e777d" stroke-width="3"/><circle r="23" fill="#252b31" stroke="${a}"/><circle r="7" fill="#889198"/><path d="M-26 0H26M0-26V26M-18-18L18 18M18-18L-18 18" stroke="#adb6ba" stroke-width="4" opacity=".85"/></g><g transform="translate(88 3)"><circle r="31" fill="#151a20" stroke="#6e777d" stroke-width="3"/><circle r="23" fill="#252b31" stroke="${a}"/><circle r="7" fill="#889198"/><path d="M-26 0H26M0-26V26M-18-18L18 18M18-18L-18 18" stroke="#adb6ba" stroke-width="4" opacity=".85"/></g></g>
<g data-part="breakwater-hull"><path d="M0 -66 L-47 -52 L-79 -24 L-73 37 L-42 57 L0 71 L42 57 L73 37 L79 -24 L47 -52Z" fill="url(#enemyMetal-breakwater)" stroke="#c1c9cd" stroke-width="2.2"/><path d="M0 -49 L-31 -35 L-39 21 L0 49 L39 21 L31 -35Z" fill="url(#enemyDark-breakwater)" stroke="${a}" stroke-opacity=".65" stroke-width="1.5"/><path d="M-49 -38L-65 30M49 -38L65 30M-36 43H36" stroke="#d1d7da" stroke-opacity=".36"/></g>
<g data-part="breakwater-cockpit"><path d="M0 -45 L-17 -29 L-12 -3 L0 8 L12 -3 L17 -29Z" fill="#123541" stroke="#b0ecff" stroke-opacity=".7"/><path d="M-10 -26H10" stroke="#d6f6ff" stroke-opacity=".45"/></g>
<g data-part="component-sockets">${boss.components.map(c => `<g transform="translate(${c.x} ${c.y})"><circle r="31" fill="#181d23" stroke="#6d767d" stroke-width="3"/><circle r="23" fill="#272e35" stroke="${a}" stroke-width="2" stroke-dasharray="5 4"/><circle r="5" fill="${a}" opacity=".7"/></g>`).join('')}</g>
<g data-part="breakwater-engines"><ellipse cx="-42" cy="51" rx="11" ry="16" fill="#11171c" stroke="#6f797f"/><ellipse cx="42" cy="51" rx="11" ry="16" fill="#11171c" stroke="#6f797f"/><ellipse cx="-42" cy="58" rx="6" ry="11" fill="url(#enemyGlow-breakwater)"/><ellipse cx="42" cy="58" rx="6" ry="11" fill="url(#enemyGlow-breakwater)"/></g>
</svg>`;
    }
    static createLeviathanSvg(boss) {
        const a = boss.art.accent;
        const enemy = { id: 'gunship', art: boss.art };
        const socket = (x, y, r, part) => `<g data-part="${part}" transform="translate(${x} ${y})"><circle r="${r + 7}" fill="#10151a" stroke="#576169" stroke-width="3"/><circle r="${r}" fill="#252b32" stroke="${a}" stroke-opacity=".7" stroke-width="2" stroke-dasharray="8 6"/></g>`;
        return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-290 -170 580 340" role="img" aria-label="${esc(boss.name)}">
${this.enemyDefs(enemy).replaceAll('gunship', 'leviathan')}
<ellipse cx="13" cy="28" rx="263" ry="135" fill="#000" opacity=".36" filter="url(#enemyShadow-leviathan)"/>
<g data-part="carrier-hull"><path d="M0 -144 L-92 -111 L-195 -94 L-268 -38 L-256 61 L-177 126 L-80 149 L0 135 L80 149 L177 126 L256 61 L268 -38 L195 -94 L92 -111Z" fill="url(#enemyMetal-leviathan)" stroke="#c4ccd0" stroke-width="3"/><path d="M-226 -46 L-242 45 L-166 103 L-137 76 L-160 -62Z" fill="#252c33" stroke="#6e7880"/><path d="M226 -46 L242 45 L166 103 L137 76 L160 -62Z" fill="#252c33" stroke="#6e7880"/></g>
<g data-part="carrier-deck"><path d="M0 -119 L-72 -89 L-103 66 L0 111 L103 66 L72 -89Z" fill="#20262c" stroke="#7f8990" stroke-width="2"/><path d="M0 -103V92" stroke="#d3d9dc" stroke-opacity=".52" stroke-width="4" stroke-dasharray="16 12"/><path d="M-55 -70H55M-72 34H72M-58 67H58" stroke="#d3d9dc" stroke-opacity=".25" stroke-width="2"/><path d="M-42 -37H42" stroke="${a}" stroke-width="3" opacity=".65"/></g>
<g data-part="armour-bays"><path d="M-211 -61L-151 -73L-126 63L-171 100L-225 46Z" fill="#333b43" stroke="#7e8991"/><path d="M211 -61L151 -73L126 63L171 100L225 46Z" fill="#333b43" stroke="#7e8991"/><path d="M-209 -34H-149M149 -34H209M-198 11H-139M139 11H198" stroke="#cbd2d6" stroke-opacity=".25" stroke-width="3"/></g>
<g data-part="component-sockets">${socket(-176, -18, 31, 'cannon-socket')}${socket(176, -18, 31, 'cannon-socket')}${socket(-104, 48, 36, 'missile-socket')}${socket(104, 48, 36, 'missile-socket')}${socket(0, 26, 47, 'reactor-socket')}</g>
<g data-part="reactor-conduit"><path d="M0 -23V-71M-47 26H-72M47 26H72M-34 61L-58 84M34 61L58 84" stroke="${a}" stroke-width="5" opacity=".7"/><circle cx="0" cy="26" r="19" fill="url(#enemyGlow-leviathan)" opacity=".85"/></g>
<g data-part="engine-bank">${[-146, -92, -38, 38, 92, 146].map((x, i) => `<g transform="translate(${x} ${i === 0 || i === 5 ? 111 : 124})"><ellipse rx="16" ry="21" fill="#11171c" stroke="#68737a" stroke-width="2"/><ellipse cy="7" rx="9" ry="15" fill="url(#enemyGlow-leviathan)"/></g>`).join('')}</g>
<g data-part="deck-details"><path d="M-84 -91L-117 -70M84 -91L117 -70M-130 91L-170 111M130 91L170 111" stroke="#d0d7da" stroke-opacity=".32" stroke-width="3"/><g fill="#12181e" stroke="#768188">${[-194, -166, 166, 194].map(x => `<rect x="${x - 7}" y="60" width="14" height="25" rx="2"/>`).join('')}</g></g>
</svg>`;
    }
    static enemyDataUri(enemy) {
        return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(this.createEnemySvg(enemy))}`;
    }
    static bossDataUri(boss) {
        return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(this.createBossSvg(boss))}`;
    }
    static createBossComponentSvg(assetId) {
        const reactor = assetId.includes('reactor');
        const missile = assetId.includes('missile');
        const accent = assetId.startsWith('breakwater') ? '#ff6a67' : '#ff3f78';
        const shape = reactor
            ? `<circle cx="0" cy="0" r="34" fill="url(#metal)" stroke="#b5c0c7" stroke-width="2"/><circle cx="0" cy="0" r="23" fill="#181c24" stroke="${accent}" stroke-width="2"/><circle cx="0" cy="0" r="13" fill="url(#core)"/><path d="M-29 0h10M19 0h10M0-29v10M0 19v10" stroke="${accent}" stroke-width="3"/>`
            : missile
                ? `<path d="M-34-25h68l8 13-7 38h-70l-7-38z" fill="url(#metal)" stroke="#aab4bb" stroke-width="2"/><g fill="#171b21" stroke="${accent}" stroke-width="1.5"><rect x="-25" y="-15" width="16" height="31" rx="4"/><rect x="-7" y="-15" width="14" height="31" rx="4"/><rect x="9" y="-15" width="16" height="31" rx="4"/></g><g fill="${accent}"><circle cx="-17" cy="-7" r="4"/><circle cx="0" cy="-7" r="4"/><circle cx="17" cy="-7" r="4"/></g>`
                : `<path d="M-37-23h74l7 17-9 30h-70l-9-30z" fill="url(#metal)" stroke="#b2bcc2" stroke-width="2"/><circle cx="0" cy="0" r="18" fill="#1a1f27" stroke="${accent}" stroke-width="2"/><path d="M-8-3v-35h6v35M2-3v-35h6v35" stroke="#d5dde1" stroke-width="5" stroke-linecap="round"/><circle cx="0" cy="2" r="5" fill="${accent}"/>`;
        return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-52 -52 104 104"><defs><linearGradient id="metal" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#929da5"/><stop offset=".45" stop-color="#3c454e"/><stop offset="1" stop-color="#171c22"/></linearGradient><radialGradient id="core"><stop offset="0" stop-color="#fff"/><stop offset=".25" stop-color="#ffb5cf"/><stop offset=".55" stop-color="${accent}"/><stop offset="1" stop-color="${accent}" stop-opacity="0"/></radialGradient></defs>${shape}<path d="M-30 33h60" stroke="#111820" stroke-width="5" opacity=".7"/></svg>`;
    }
    static bossComponentDataUri(assetId) {
        return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(this.createBossComponentSvg(assetId))}`;
    }
    static aircraftDataUri(craft, bank = 0, damage = 0) {
        return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(this.createAircraftSvg(craft, bank, damage))}`;
    }
}
