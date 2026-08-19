'use client';

import { useEffect } from 'react';

export function LegacyServiceWorkerCleanup() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    void navigator.serviceWorker.getRegistrations().then((registrations) =>
      Promise.all(registrations.map((registration) => registration.unregister())),
    );

    if ('caches' in window) {
      void caches.keys().then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter((name) => /workbox|precache/i.test(name))
            .map((name) => caches.delete(name)),
        ),
      );
    }
  }, []);

  return null;
}
