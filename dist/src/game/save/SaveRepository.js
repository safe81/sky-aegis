import { AIRCRAFT } from "../content/aircraft.js";
export function createDefaultProfile(type = 'review') {
    return {
        schemaVersion: 1,
        profileId: type,
        profileType: type,
        salvage: 0,
        selectedAircraft: 'falcon-07',
        unlockedAircraft: type === 'review' ? AIRCRAFT.map(a => a.id) : ['falcon-07'],
        upgrades: { hull: 0, primary: 0, secondary: 0, magnet: 0, tactical: 0 },
        medals: {},
        settledRunIds: [],
        settings: { masterVolume: .82, musicVolume: .38, effectsVolume: .72, sensitivity: 1, fingerOffset: 80, quality: 'balanced', reduceShake: false },
        updatedAt: Date.now(),
    };
}
function clone(v) { return JSON.parse(JSON.stringify(v)); }
export class MemorySaveAdapter {
    current = null;
    backup = null;
    failNext = false;
    async read() { return this.current ? clone(this.current) : null; }
    async readBackup() { return this.backup ? clone(this.backup) : null; }
    async write(current, backup) { if (this.failNext) {
        this.failNext = false;
        throw new Error('Injected save failure');
    } this.backup = backup ? clone(backup) : null; this.current = clone(current); }
}
class IndexedDbSaveAdapter {
    dbPromise;
    constructor() { this.dbPromise = this.open(); }
    open() { return new Promise((resolve, reject) => { const req = indexedDB.open('sky-aegis-save', 1); req.onupgradeneeded = () => { const db = req.result; if (!db.objectStoreNames.contains('profiles'))
        db.createObjectStore('profiles'); }; req.onsuccess = () => resolve(req.result); req.onerror = () => reject(req.error ?? new Error('IndexedDB open failed')); }); }
    async get(key) { const db = await this.dbPromise; return await new Promise((resolve, reject) => { const tx = db.transaction('profiles', 'readonly'); const req = tx.objectStore('profiles').get(key); req.onsuccess = () => resolve(req.result ? clone(req.result) : null); req.onerror = () => reject(req.error ?? new Error('IndexedDB read failed')); }); }
    async read() { return this.get('current'); }
    async readBackup() { return this.get('backup'); }
    async write(current, backup) { const db = await this.dbPromise; await new Promise((resolve, reject) => { const tx = db.transaction('profiles', 'readwrite'); const store = tx.objectStore('profiles'); if (backup)
        store.put(clone(backup), 'backup'); store.put(clone(current), 'current'); tx.oncomplete = () => resolve(); tx.onerror = () => reject(tx.error ?? new Error('IndexedDB write failed')); tx.onabort = () => reject(tx.error ?? new Error('IndexedDB write aborted')); }); }
}
export class SaveRepository {
    adapter;
    constructor(adapter) { this.adapter = adapter ?? (typeof indexedDB !== 'undefined' ? new IndexedDbSaveAdapter() : new MemorySaveAdapter()); }
    async loadProfile() {
        const current = await this.adapter.read();
        if (current && this.validate(current))
            return current;
        const backup = await this.adapter.readBackup();
        if (backup && this.validate(backup))
            return backup;
        return createDefaultProfile();
    }
    async saveProfile(profile) {
        if (!this.validate(profile))
            throw new Error('Invalid save profile');
        const previous = await this.adapter.read();
        const next = clone({ ...profile, updatedAt: Date.now() });
        await this.adapter.write(next, previous && this.validate(previous) ? previous : null);
        return next;
    }
    async settleRun(result) {
        const profile = await this.loadProfile();
        if (profile.settledRunIds.includes(result.runId))
            return profile;
        profile.salvage = Math.max(0, profile.salvage + Math.max(0, Math.floor(result.salvage)));
        if (result.completed) {
            const previous = profile.medals[result.missionId] ?? { destroy70: false, destroy100: false, allRescued: false, untouched: false };
            profile.medals[result.missionId] = {
                destroy70: previous.destroy70 || result.medals.destroy70,
                destroy100: previous.destroy100 || result.medals.destroy100,
                allRescued: previous.allRescued || result.medals.allRescued,
                untouched: previous.untouched || result.medals.untouched,
            };
        }
        profile.settledRunIds.push(result.runId);
        if (profile.settledRunIds.length > 200)
            profile.settledRunIds.splice(0, profile.settledRunIds.length - 200);
        return this.saveProfile(profile);
    }
    exportProfile(profile) { if (!this.validate(profile))
        throw new Error('Cannot export invalid profile'); return JSON.stringify(profile, null, 2); }
    async importProfile(json) { let parsed; try {
        parsed = JSON.parse(json);
    }
    catch {
        throw new Error('Save file is not valid JSON');
    } if (!this.validate(parsed))
        throw new Error('Save file failed validation'); return this.saveProfile(parsed); }
    validate(value) {
        if (!value || typeof value !== 'object')
            return false;
        const v = value;
        return v.schemaVersion === 1 && typeof v.profileId === 'string' && (v.profileType === 'review' || v.profileType === 'campaign') && Number.isFinite(v.salvage) && typeof v.selectedAircraft === 'string' && Array.isArray(v.unlockedAircraft) && !!v.upgrades && !!v.settings && Array.isArray(v.settledRunIds) && !!v.medals;
    }
}
