// Retired: QiuQ no longer uses a service worker (it blocked installing on phones
// without Google services). This stub removes itself and its cache from devices
// that registered the old one.
self.addEventListener("install", function () { self.skipWaiting(); });
self.addEventListener("activate", function () {
  caches.keys().then(function (keys) { keys.forEach(function (k) { caches.delete(k); }); });
  self.registration.unregister();
});
