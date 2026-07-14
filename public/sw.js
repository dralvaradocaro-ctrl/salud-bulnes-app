/*
 * Service worker del portal del paciente: recibe los Web Push (aviso diario
 * de medicamentos) y abre el portal al tocar la notificación.
 * NotificationSettings lo registra como '/sw.js'.
 */
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = { body: event.data ? event.data.text() : '' };
  }
  const title = payload.title || '💊 Recordatorio de medicamentos';
  event.waitUntil(
    self.registration.showNotification(title, {
      body: payload.body || 'Revisa tus medicamentos de hoy en el portal.',
      icon: payload.icon || '/icon-192.png',
      badge: '/favicon-32.png',
      tag: payload.tag || 'aviso-diario-medicamentos', // reemplaza el aviso anterior
      data: { url: payload.url || '/' },
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes(url) && 'focus' in client) return client.focus();
      }
      return self.clients.openWindow(url);
    })
  );
});
