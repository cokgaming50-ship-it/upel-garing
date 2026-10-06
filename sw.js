// Service worker KontrakanKu: aplikasi tetap terbuka saat sinyal lemah.
// Strategi: coba internet dulu (supaya selalu versi terbaru), kalau gagal pakai salinan tersimpan.
// Data (Firebase) tidak disimpan di sini.
const NAMA_CACHE = "kontrakanku-v1";
const FILE_INTI = [
    "./", "./index.html", "./style.css", "./style-tambahan.css",
    "./script.js", "./cloud.js", "./firebase-config.js",
    "./manifest.webmanifest", "./icon-192.png", "./icon-512.png"
];

self.addEventListener("install", function (event) {
    event.waitUntil(
        caches.open(NAMA_CACHE).then(function (cache) { return cache.addAll(FILE_INTI); })
    );
    self.skipWaiting();
});

self.addEventListener("activate", function (event) {
    event.waitUntil(
        caches.keys().then(function (nama) {
            return Promise.all(nama.filter(function (n) { return n !== NAMA_CACHE; })
                .map(function (n) { return caches.delete(n); }));
        })
    );
    self.clients.claim();
});

self.addEventListener("fetch", function (event) {

    const req = event.request;
    const url = new URL(req.url);

    // hanya file milik aplikasi sendiri; Firebase/Chart.js lewat jaringan biasa
    if (req.method !== "GET" || url.origin !== self.location.origin) return;

    event.respondWith(
        fetch(req).then(function (res) {
            const salinan = res.clone();
            caches.open(NAMA_CACHE).then(function (cache) { cache.put(req, salinan); });
            return res;
        }).catch(function () {
            return caches.match(req).then(function (hit) { return hit || caches.match("./index.html"); });
        })
    );

});