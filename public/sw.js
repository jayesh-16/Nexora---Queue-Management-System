// Nexora — Push Notification Service Worker
// Handles incoming push events and notification clicks

self.addEventListener("push", (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || "Nexora";
  const options = {
    body: data.body || "Queue update",
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-72.png",
    vibrate: [200, 100, 200, 100, 200],
    data: {
      url: data.url || "/track",
    },
    actions: [
      { action: "open", title: "View queue" },
      { action: "dismiss", title: "Dismiss" },
    ],
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  if (event.action === "dismiss") return;
  const url = event.notification.data?.url || "/track";
  event.waitUntil(clients.openWindow(url));
});
