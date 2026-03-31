'use client';

import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

const LS_KEY = 'mujcrm_last_email_sync';
const AUTO_SYNC_INTERVAL = 10 * 60 * 1000;
const MIN_SYNC_GAP = 30 * 60 * 1000;
const NEW_EMAIL_WINDOW = 10 * 60 * 1000; // 10 minut

type EmailSyncCtx = {
  syncing: boolean;
  lastSync: Date | null;
  newEmailCount: number;
  clearNewEmails: () => void;
  triggerSync: () => Promise<void>;
};

const EmailSyncContext = createContext<EmailSyncCtx>({
  syncing: false,
  lastSync: null,
  newEmailCount: 0,
  clearNewEmails: () => {},
  triggerSync: async () => {},
});

export function useEmailSync() {
  return useContext(EmailSyncContext);
}

export default function EmailSyncProvider({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(() => {
    if (typeof window === 'undefined') return null;
    const ts = localStorage.getItem(LS_KEY);
    return ts ? new Date(parseInt(ts)) : null;
  });
  const [newEmailCount, setNewEmailCount] = useState(0);
  const [showFloating, setShowFloating] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasEmailRef = useRef<boolean | null>(null);

  const checkHasEmail = useCallback(async () => {
    if (hasEmailRef.current !== null) return hasEmailRef.current;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { hasEmailRef.current = false; return false; }
    const { data } = await supabase
      .from('email_settings')
      .select('is_verified')
      .eq('user_id', user.id)
      .single();
    hasEmailRef.current = data?.is_verified ?? false;
    return hasEmailRef.current;
  }, [supabase]);

  const checkNewEmails = useCallback(async () => {
    const since = new Date(Date.now() - NEW_EMAIL_WINDOW).toISOString();
    const { count } = await supabase
      .from('emails')
      .select('id', { count: 'exact', head: true })
      .eq('direction', 'received')
      .gte('sent_at', since);
    const n = count ?? 0;
    if (n > 0) {
      setNewEmailCount(n);
      setShowFloating(true);
    }
  }, [supabase]);

  const triggerSync = useCallback(async () => {
    if (syncing) return;
    const hasEmail = await checkHasEmail();
    if (!hasEmail) return;
    setSyncing(true);
    try {
      await fetch('/api/email/sync', { method: 'POST' });
      const now = new Date();
      setLastSync(now);
      localStorage.setItem(LS_KEY, now.getTime().toString());
      await checkNewEmails();
    } finally {
      setSyncing(false);
    }
  }, [syncing, checkHasEmail, checkNewEmails]);

  const clearNewEmails = useCallback(() => {
    setNewEmailCount(0);
    setShowFloating(false);
  }, []);

  useEffect(() => {
    const ts = localStorage.getItem(LS_KEY);
    const lastSyncTime = ts ? parseInt(ts) : 0;
    if (Date.now() - lastSyncTime > MIN_SYNC_GAP) {
      triggerSync();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    intervalRef.current = setInterval(() => { triggerSync(); }, AUTO_SYNC_INTERVAL);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [triggerSync]);

  return (
    <EmailSyncContext.Provider value={{ syncing, lastSync, newEmailCount, clearNewEmails, triggerSync }}>
      {children}

      {/* Plovoucí tlačítko – nové emaily */}
      {showFloating && (
        <div
          className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl"
          style={{
            background: 'linear-gradient(135deg, #141414, #1a1a1a)',
            border: '1px solid rgba(0,191,255,0.3)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.6), 0 0 0 1px rgba(0,191,255,0.1)',
          }}
        >
          <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
              <polyline points="22,6 12,13 2,6"/>
            </svg>
          </div>
          <div>
            <p className="text-sm font-bold text-white leading-tight">
              {newEmailCount === 1 ? '1 nový email' : `${newEmailCount} nové emaily`}
            </p>
            <a href="/dashboard/email"
              onClick={clearNewEmails}
              className="text-xs font-semibold"
              style={{ color: '#00BFFF' }}>
              Zobrazit →
            </a>
          </div>
          <button
            onClick={clearNewEmails}
            className="ml-1 flex-shrink-0"
            style={{ color: 'rgba(237,237,237,0.3)' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#ededed')}
            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(237,237,237,0.3)')}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      )}
    </EmailSyncContext.Provider>
  );
}
