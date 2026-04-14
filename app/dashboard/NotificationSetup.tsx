'use client';

import { useEffect, useState } from 'react';

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export default function NotificationSetup() {
  const [shown, setShown] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission | null>(null);

  useEffect(() => {
    if (!('Notification' in window) || !('serviceWorker' in navigator)) return;
    setPermission(Notification.permission);
    if (Notification.permission === 'default') {
      // Show prompt after 3s so it's not immediately jarring
      const t = setTimeout(() => setShown(true), 3000);
      return () => clearTimeout(t);
    }
    if (Notification.permission === 'granted') {
      registerAndSubscribe();
    }
  }, []);

  async function registerAndSubscribe() {
    try {
      const reg = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;
      const existing = await reg.pushManager.getSubscription();
      if (existing) return; // already subscribed
      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription),
      });
    } catch {
      // Silently fail (e.g. incognito mode)
    }
  }

  async function handleAllow() {
    setShown(false);
    const result = await Notification.requestPermission();
    setPermission(result);
    if (result === 'granted') {
      await registerAndSubscribe();
    }
  }

  if (!shown || permission !== 'default') return null;

  return (
    <div
      className="fixed bottom-6 right-6 z-40 max-w-sm w-full rounded-2xl p-5 shadow-2xl"
      style={{ background: '#161618', border: '1px solid rgba(0,191,255,0.25)', boxShadow: '0 8px 40px rgba(0,0,0,0.5)' }}
    >
      <div className="flex items-start gap-4">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
          style={{ background: 'rgba(0,191,255,0.12)', color: '#00BFFF' }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-white mb-1">Zapnout připomínky</p>
          <p className="text-xs leading-relaxed" style={{ color: 'rgba(237,237,237,0.55)' }}>
            Dostávej notifikace pro úkoly, aktivity a události v čas, který si zvolíš.
          </p>
          <div className="flex items-center gap-2 mt-3">
            <button
              onClick={handleAllow}
              className="px-4 py-1.5 rounded-lg text-xs font-bold transition-all"
              style={{ background: 'linear-gradient(135deg, #00BFFF, #0090cc)', color: '#0a0a0a' }}
            >
              Povolit
            </button>
            <button
              onClick={() => setShown(false)}
              className="px-4 py-1.5 rounded-lg text-xs font-semibold transition-all"
              style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(237,237,237,0.5)' }}
            >
              Teď ne
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
