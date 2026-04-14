'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

// ─── Typy a konstanty ─────────────────────────────────────────────────────────

export type CookiePreferences = {
  necessary: true;
  analytics: boolean;
  marketing: boolean;
  timestamp: string;
  version: string;
};

const STORAGE_KEY = 'mujcrm_cookie_consent';
const CONSENT_VERSION = '1';

// ─── Pomocné funkce (exportované pro použití jinde) ───────────────────────────

export function getCookieConsent(): CookiePreferences | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CookiePreferences;
    if (parsed.version !== CONSENT_VERSION) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function hasAnalyticsConsent(): boolean {
  return getCookieConsent()?.analytics === true;
}

export function hasMarketingConsent(): boolean {
  return getCookieConsent()?.marketing === true;
}

export function openCookieSettings() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('mujcrm:open-cookie-settings'));
  }
}

function saveConsent(analytics: boolean, marketing: boolean): void {
  const consent: CookiePreferences = {
    necessary: true,
    analytics,
    marketing,
    timestamp: new Date().toISOString(),
    version: CONSENT_VERSION,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(consent));

  // Pokud uživatel odmítl analytics, smaž GA cookies
  if (!analytics) {
    document.cookie = '_ga=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    document.cookie = '_gid=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
  }
}

// ─── Toggle komponenta ────────────────────────────────────────────────────────

function Toggle({ checked, onChange, disabled }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className="flex-shrink-0 relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-200"
      style={{
        background: checked ? (disabled ? '#22C55E' : '#00BFFF') : 'rgba(255,255,255,0.12)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        border: 'none',
        outline: 'none',
      }}
    >
      <span
        className="inline-block h-4 w-4 rounded-full transition-all duration-200"
        style={{
          background: '#fff',
          transform: checked ? 'translateX(28px)' : 'translateX(4px)',
          boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
        }}
      />
    </button>
  );
}

// ─── Hlavní komponenta ────────────────────────────────────────────────────────

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const consent = getCookieConsent();
    if (!consent) {
      // Krátká prodleva – nechceme banner okamžitě při SSR hydrataci
      const timer = setTimeout(() => setVisible(true), 600);
      return () => clearTimeout(timer);
    }
    // Načti uložené preference do stavu (pro případ otevření nastavení)
    setAnalytics(consent.analytics);
    setMarketing(consent.marketing);

    // Posluchač pro "Správa cookies" z footeru / nastavení
    const handler = () => {
      const c = getCookieConsent();
      if (c) { setAnalytics(c.analytics); setMarketing(c.marketing); }
      setShowSettings(true);
      setVisible(true);
    };
    window.addEventListener('mujcrm:open-cookie-settings', handler);
    return () => window.removeEventListener('mujcrm:open-cookie-settings', handler);
  }, []);

  // Přidej posluchač i při prvním zobrazení
  useEffect(() => {
    const handler = () => {
      const c = getCookieConsent();
      if (c) { setAnalytics(c.analytics); setMarketing(c.marketing); }
      setShowSettings(true);
      setVisible(true);
    };
    window.addEventListener('mujcrm:open-cookie-settings', handler);
    return () => window.removeEventListener('mujcrm:open-cookie-settings', handler);
  }, []);

  if (!mounted || !visible) return null;

  const acceptAll = () => {
    saveConsent(true, true);
    setVisible(false);
    setShowSettings(false);
  };

  const rejectOptional = () => {
    saveConsent(false, false);
    setVisible(false);
    setShowSettings(false);
  };

  const saveCustom = () => {
    saveConsent(analytics, marketing);
    setVisible(false);
    setShowSettings(false);
  };

  const closeSettings = () => {
    setShowSettings(false);
    // Pokud ještě nemá souhlas, neskrývej banner
    if (getCookieConsent()) setVisible(false);
  };

  // ── Modal s nastavením ───────────────────────────────────────────────────

  if (showSettings) {
    return (
      <div
        className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-4"
        style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}
        role="dialog"
        aria-modal="true"
        aria-label="Nastavení cookies"
      >
        <div
          className="w-full max-w-lg rounded-2xl"
          style={{ background: '#141414', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 20px 60px rgba(0,0,0,0.6)' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 pt-6 pb-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
            <div>
              <h2 className="text-base font-black text-white">Nastavení cookies</h2>
              <p className="text-xs mt-0.5" style={{ color: 'rgba(237,237,237,0.4)' }}>
                Vyberte, které cookies povolíte
              </p>
            </div>
            {getCookieConsent() && (
              <button onClick={closeSettings} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(237,237,237,0.4)', padding: 4 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            )}
          </div>

          {/* Obsah */}
          <div className="px-6 py-5 flex flex-col gap-3">
            <p className="text-xs" style={{ color: 'rgba(237,237,237,0.45)' }}>
              Detailní informace o každém druhu cookies najdete v{' '}
              <Link href="/zasady-soukromi" style={{ color: '#00BFFF', textDecoration: 'underline' }} target="_blank">
                Zásadách soukromí
              </Link>.
              Souhlas lze kdykoliv změnit kliknutím na „Správa cookies" v patičce.
            </p>

            {/* Nezbytné — vždy zapnuto */}
            <div
              className="flex items-start gap-4 rounded-xl p-4"
              style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.14)' }}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-bold text-white">Nezbytné cookies</p>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: 'rgba(34,197,94,0.15)', color: '#22C55E' }}>
                    Vždy aktivní
                  </span>
                </div>
                <p className="text-xs" style={{ color: 'rgba(237,237,237,0.45)' }}>
                  Přihlášení, bezpečnost relace (sb-auth-token), ochrana před CSRF, základní funkce platební brány Stripe (__stripe_mid).
                  Bez nich aplikace nefunguje.
                </p>
              </div>
              <Toggle checked={true} onChange={() => {}} disabled />
            </div>

            {/* Analytické */}
            <div
              className="flex items-start gap-4 rounded-xl p-4"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white mb-1">Analytické cookies</p>
                <p className="text-xs" style={{ color: 'rgba(237,237,237,0.45)' }}>
                  Google Analytics (_ga, _gid) – anonymizovaná statistika návštěvnosti a průchodu aplikací.
                  Data jsou anonymizována a slouží výhradně ke zlepšování produktu.
                  Právní základ: souhlas (čl. 6 odst. 1 písm. a) GDPR).
                </p>
              </div>
              <Toggle checked={analytics} onChange={setAnalytics} />
            </div>

            {/* Marketingové */}
            <div
              className="flex items-start gap-4 rounded-xl p-4"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white mb-1">Marketingové cookies</p>
                <p className="text-xs" style={{ color: 'rgba(237,237,237,0.45)' }}>
                  Facebook Pixel (_fbp), Google Ads (_gcl_au) – personalizace reklam a měření kampaní.
                  Data mohou být sdílena s Facebookem (Meta) a Googlem.
                  Právní základ: souhlas (čl. 6 odst. 1 písm. a) GDPR).
                </p>
              </div>
              <Toggle checked={marketing} onChange={setMarketing} />
            </div>
          </div>

          {/* Tlačítka — GDPR: odmítnutí musí být stejně dostupné jako přijetí */}
          <div
            className="px-6 pb-6 pt-4 flex flex-col sm:flex-row gap-2"
            style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}
          >
            <button
              onClick={rejectOptional}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(237,237,237,0.7)', cursor: 'pointer' }}
            >
              Odmítnout volitelné
            </button>
            <button
              onClick={saveCustom}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all"
              style={{ background: 'rgba(0,191,255,0.1)', border: '1px solid rgba(0,191,255,0.3)', color: '#00BFFF', cursor: 'pointer' }}
            >
              Uložit nastavení
            </button>
            <button
              onClick={acceptAll}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all"
              style={{ background: 'linear-gradient(135deg, #00BFFF, #0090cc)', color: '#0a0a0a', cursor: 'pointer', border: 'none' }}
            >
              Přijmout vše
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Lišta (banner) ────────────────────────────────────────────────────────

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-[9998] p-3 sm:p-4"
      role="region"
      aria-label="Souhlas s cookies"
      style={{ pointerEvents: 'none' }}
    >
      <div
        className="max-w-5xl mx-auto rounded-2xl px-5 py-4 flex flex-col sm:flex-row items-start sm:items-center gap-4"
        style={{
          background: 'rgba(18,18,18,0.97)',
          border: '1px solid rgba(255,255,255,0.12)',
          boxShadow: '0 -4px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(0,191,255,0.08)',
          backdropFilter: 'blur(12px)',
          pointerEvents: 'all',
        }}
      >
        {/* Text */}
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <span style={{ fontSize: 20, lineHeight: 1, flexShrink: 0, marginTop: 2 }}>🍪</span>
          <div>
            <p className="text-sm font-bold text-white mb-0.5">Tato stránka používá cookies</p>
            <p className="text-xs" style={{ color: 'rgba(237,237,237,0.5)', lineHeight: 1.5 }}>
              Nezbytné cookies jsou vždy aktivní. Analytické a marketingové cookies aktivujeme pouze s vaším souhlasem dle{' '}
              <Link
                href="/zasady-soukromi"
                style={{ color: '#00BFFF', textDecoration: 'underline' }}
                target="_blank"
              >
                Zásad soukromí
              </Link>
              {' '}a nařízení EU 2016/679 (GDPR).
            </p>
          </div>
        </div>

        {/* Tlačítka — odmítnutí vlevo/nahoře, přijetí vpravo/dole (GDPR: stejná dostupnost) */}
        <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
          <button
            onClick={rejectOptional}
            className="px-4 py-2 rounded-xl text-xs font-semibold transition-all"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(237,237,237,0.7)', cursor: 'pointer' }}
          >
            Odmítnout nezbytné
          </button>
          <button
            onClick={() => setShowSettings(true)}
            className="px-4 py-2 rounded-xl text-xs font-semibold transition-all"
            style={{ background: 'rgba(0,191,255,0.08)', border: '1px solid rgba(0,191,255,0.2)', color: '#00BFFF', cursor: 'pointer' }}
          >
            Nastavení
          </button>
          <button
            onClick={acceptAll}
            className="px-4 py-2 rounded-xl text-xs font-bold transition-all"
            style={{ background: 'linear-gradient(135deg, #00BFFF, #0090cc)', color: '#0a0a0a', cursor: 'pointer', border: 'none' }}
          >
            Přijmout vše
          </button>
        </div>
      </div>
    </div>
  );
}
