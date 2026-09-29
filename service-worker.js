const CACHE='sky-aegis-visual-v2';
const ASSETS=['./','./index.html','./styles.css','./src/game.js','./assets/falcon.png','./assets/enemy_fighter.png','./assets/bomber.png','./assets/gunboat.png','./assets/turret.png','./assets/boss_module.png','./assets/harbour_map.png','./assets/boss_hull.png'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS))));
self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));
self.addEventListener('fetch',e=>e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request))));
