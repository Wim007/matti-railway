const CACHE_NAME = "matti-v2";
const STATIC_ASSETS = ["/", "/manifest.json", "/icon-192.png", "/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});

// Push notification ontvangen
self.addEventListener("push", (event) => {
  if (!event.data) return;
  let data;
  try { data = event.data.json(); } catch (e) { data = { title: "Matti", body: event.data.text(), type: null, url: "/" }; }
  const options = {
    body: data.body || "",
    icon: "/icon-192.png",
    badge: "/favicon-32.png",
    tag: data.type || "matti-routine",
    renotify: true,
    requireInteraction: true,
    data: { url: data.url || "/", type: data.type || null },
    actions: [
      { action: "yes", title: "Ja" },
      { action: "no", title: "Nee" },
    ],
  };
  event.waitUntil(self.registration.showNotification(data.title || "Matti", options));
});

// Klik op notificatie
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const notifData = event.notification.data || {};
  const type = notifData.type;
  const action = event.action;
  const response = action === "no" ? "no" : "yes";
  const url = type ? `/chat?routine=${type}&response=${response}` : "/";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes("/chat") && "focus" in client) {
          client.postMessage({ type: "ROUTINE_RESPONSE", routineType: type, response: action || "yes" });
          return client.focus();
        }
      }
      return clients.openWindow(url);
    })
  );
});
