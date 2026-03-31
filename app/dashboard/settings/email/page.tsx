'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

type Tab = 'pripojeni' | 'podpis' | 'pruvodce';
type Step = { n: number; title: string; desc?: string; descNode?: ReactNode };
type Provider = {
  id: string; name: string; badge: string | null; badgeColor: string;
  icon: ReactNode; warning: string | null; steps: Step[];
  extraNote?: ReactNode;
  values: { smtp_host: string; smtp_port: string; security: string; imap_host: string; imap_port: string };
  link: { label: string; href: string } | null;
};

type Settings = {
  smtp_host: string; smtp_port: number; smtp_secure: boolean;
  smtp_user: string; smtp_password: string;
  imap_host: string; imap_port: number; imap_secure: boolean;
  display_name: string; signature: string; is_verified: boolean;
};

const empty: Settings = {
  smtp_host: '', smtp_port: 587, smtp_secure: false,
  smtp_user: '', smtp_password: '',
  imap_host: '', imap_port: 993, imap_secure: true,
  display_name: '', signature: '', is_verified: false,
};

const inputStyle = {
  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '10px', padding: '10px 14px', color: '#ededed', fontSize: '14px',
  outline: 'none', width: '100%',
};
const labelStyle = { color: 'rgba(237,237,237,0.5)' };
const focus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) =>
  (e.currentTarget.style.borderColor = 'rgba(0,191,255,0.5)');
const blur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) =>
  (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)');

const providers: Provider[] = [
  {
    id: 'gmail',
    name: 'Gmail / Google Workspace',
    badge: 'Nejpoužívanější',
    badgeColor: '#10b981',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M22 6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6z" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5"/>
        <path d="M2 6l10 7 10-7" stroke="#00BFFF" strokeWidth="1.8" strokeLinecap="round"/>
      </svg>
    ),
    warning: 'Gmail NEpovoluje přihlášení běžným heslem. Musíš vygenerovat speciální App Password. Bez toho připojení nebude fungovat.',
    steps: [
      { n: 1, title: 'Povol 2-faktorové ověření', desc: 'Jdi na myaccount.google.com → Zabezpečení → Dvoufázové ověření' },
      { n: 2, title: 'Vygeneruj App Password (heslo pro aplikaci)', descNode: (
        <div className="flex flex-col gap-1.5 mt-1.5">
          <p className="text-xs font-bold" style={{ color: 'rgba(237,237,237,0.75)' }}>Způsob A – přímý odkaz (nejrychlejší):</p>
          <div className="flex flex-col gap-0.5 text-xs pl-2" style={{ color: 'rgba(237,237,237,0.55)' }}>
            <p>→ Otevři přímo: <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener noreferrer" style={{ color: '#00BFFF' }}>myaccount.google.com/apppasswords</a></p>
            <p>→ Do pole „Název aplikace" napiš <strong style={{ color: 'rgba(237,237,237,0.8)' }}>MujCRM</strong></p>
            <p>→ Klikni <strong style={{ color: 'rgba(237,237,237,0.8)' }}>Vytvořit</strong></p>
            <p>→ Zobrazí se 16místný kód – <strong style={{ color: '#fff' }}>TEN POUŽIJ jako heslo</strong> (bez mezer)</p>
          </div>
          <p className="text-xs font-bold mt-1" style={{ color: 'rgba(237,237,237,0.75)' }}>Způsob B – přes menu:</p>
          <div className="flex flex-col gap-0.5 text-xs pl-2" style={{ color: 'rgba(237,237,237,0.55)' }}>
            <p>→ Jdi na <span style={{ color: 'rgba(237,237,237,0.75)' }}>myaccount.google.com</span></p>
            <p>→ Vlevo klikni <strong style={{ color: 'rgba(237,237,237,0.8)' }}>Zabezpečení a přihlašování</strong></p>
            <p>→ Scrolluj dolů na sekci <strong style={{ color: 'rgba(237,237,237,0.8)' }}>Jak se přihlašujete do Googlu</strong></p>
            <p>→ Klikni <strong style={{ color: 'rgba(237,237,237,0.8)' }}>Hesla aplikací</strong> (zobrazí se pouze pokud máš zapnuté 2-faktorové ověření)</p>
            <p>→ Do pole „Název aplikace" napiš <strong style={{ color: 'rgba(237,237,237,0.8)' }}>MujCRM</strong> → Vytvořit</p>
            <p>→ Zobrazí se 16místný kód – <strong style={{ color: '#fff' }}>TEN POUŽIJ jako heslo</strong></p>
          </div>
        </div>
      ) },
      { n: 3, title: 'Zadej do MujCRM', desc: '' },
    ],
    extraNote: (
      <div className="flex flex-col gap-1.5 px-3.5 py-3 rounded-xl text-xs"
        style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', color: '#fbbf24' }}>
        <p className="font-bold flex items-center gap-1.5">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ flexShrink: 0 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          Pokud možnost „Hesla aplikací" nevidíš, ujisti se že:
        </p>
        <p>1. Máš zapnuté <strong>2-faktorové ověření</strong> (Dvoufázové ověření)</p>
        <p>2. Přihlašuješ se přes <strong>Authenticator nebo fyzický klíč</strong> (ne jen SMS kód)</p>
        <p>3. Pro <strong>Google Workspace</strong> účty musí administrátor povolit App Passwords v Google Admin Console → <span style={{ color: 'rgba(251,191,36,0.85)' }}>admin.google.com</span> → Zabezpečení → Méně bezpečné aplikace</p>
      </div>
    ),
    values: { smtp_host: 'smtp.gmail.com', smtp_port: '587', security: 'STARTTLS', imap_host: 'imap.gmail.com', imap_port: '993' },
    link: { label: 'Otevřít App Passwords →', href: 'https://myaccount.google.com/apppasswords' },
  },
  {
    id: 'seznam',
    name: 'Seznam.cz',
    badge: null,
    badgeColor: '',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <rect x="2" y="4" width="20" height="16" rx="3" fill="rgba(239,68,68,0.12)" stroke="#ef4444" strokeWidth="1.5"/>
        <text x="12" y="15" textAnchor="middle" fill="#ef4444" fontSize="8" fontWeight="bold">SZ</text>
      </svg>
    ),
    warning: null,
    steps: [
      { n: 1, title: 'Otevři nastavení Seznamu', desc: 'email.seznam.cz → Nastavení (ozubené kolo) → Nastavení účtu' },
      { n: 2, title: 'Povol přístup přes IMAP a SMTP', desc: 'Klikni na "Přístupy a aplikace" a povol přístup' },
      { n: 3, title: 'Zadej do MujCRM', desc: '' },
    ],
    values: { smtp_host: 'smtp.seznam.cz', smtp_port: '465', security: 'SSL/TLS', imap_host: 'imap.seznam.cz', imap_port: '993' },
    link: { label: 'Otevřít nastavení Seznamu →', href: 'https://email.seznam.cz' },
  },
  {
    id: 'outlook',
    name: 'Microsoft Outlook / Office 365',
    badge: null,
    badgeColor: '',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <rect x="2" y="4" width="20" height="16" rx="3" fill="rgba(0,120,212,0.12)" stroke="#0078d4" strokeWidth="1.5"/>
        <text x="12" y="15" textAnchor="middle" fill="#0078d4" fontSize="8" fontWeight="bold">OL</text>
      </svg>
    ),
    warning: 'Pro firemní Office 365 musí správce IT povolit SMTP AUTH. Ověř to u svého IT oddělení.',
    steps: [
      { n: 1, title: 'Povol IMAP přístup', desc: 'outlook.live.com → Nastavení → Pošta → Synchronizace → Povol POP a IMAP přístup' },
      { n: 2, title: 'Zadej do MujCRM', desc: '' },
    ],
    values: { smtp_host: 'smtp.office365.com', smtp_port: '587', security: 'STARTTLS', imap_host: 'outlook.office365.com', imap_port: '993' },
    link: { label: 'Otevřít nastavení Outlooku →', href: 'https://outlook.live.com/mail/options' },
  },
  {
    id: 'centrum',
    name: 'Centrum.cz / Volny.cz',
    badge: null,
    badgeColor: '',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <rect x="2" y="4" width="20" height="16" rx="3" fill="rgba(123,47,255,0.12)" stroke="#7B2FFF" strokeWidth="1.5"/>
        <text x="12" y="15" textAnchor="middle" fill="#7B2FFF" fontSize="8" fontWeight="bold">CT</text>
      </svg>
    ),
    warning: null,
    steps: [{ n: 1, title: 'Zadej do MujCRM', desc: '' }],
    values: { smtp_host: 'smtp.centrum.cz', smtp_port: '465', security: 'SSL/TLS', imap_host: 'imap.centrum.cz', imap_port: '993' },
    link: null,
  },
  {
    id: 'icloud',
    name: 'iCloud Mail (Apple)',
    badge: null,
    badgeColor: '',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <rect x="2" y="4" width="20" height="16" rx="3" fill="rgba(237,237,237,0.06)" stroke="rgba(237,237,237,0.25)" strokeWidth="1.5"/>
        <text x="12" y="15" textAnchor="middle" fill="rgba(237,237,237,0.6)" fontSize="8" fontWeight="bold"></text>
        <path d="M12 8c1.5 0 2.8.8 3.5 2-.7-.1-2.5-.1-3.5 1.5C11 10 9.2 10 8.5 10 9.2 8.8 10.5 8 12 8z" fill="rgba(237,237,237,0.5)"/>
        <path d="M8.5 10c-.8 1-1 2.5-.5 4 .5 1.5 1.8 2 2.5 2s1.2-.3 1.5-.3c.3 0 .8.3 1.5.3s2-.5 2.5-2c.2-.5.3-1 .3-1.5-.8.2-2-.2-2.8-1.5-.7 1.3-2 1.7-2.8 1.5C10 11 9 10.2 8.5 10z" fill="rgba(237,237,237,0.5)"/>
      </svg>
    ),
    warning: 'Apple vyžaduje App Password — běžné heslo Apple ID nefunguje.',
    steps: [
      { n: 1, title: 'Vygeneruj App Password', desc: 'Jdi na appleid.apple.com → Přihlás se → sekce Zabezpečení → Hesla aplikací → vygeneruj nové heslo pro "MujCRM".' },
      { n: 2, title: 'Zadej do MujCRM', desc: '' },
    ],
    values: { smtp_host: 'smtp.mail.me.com', smtp_port: '587', security: 'STARTTLS', imap_host: 'imap.mail.me.com', imap_port: '993' },
    link: { label: 'Otevřít Apple ID →', href: 'https://appleid.apple.com' },
  },
  {
    id: 'yahoo',
    name: 'Yahoo Mail',
    badge: null,
    badgeColor: '',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <rect x="2" y="4" width="20" height="16" rx="3" fill="rgba(99,32,183,0.12)" stroke="#6320b7" strokeWidth="1.5"/>
        <text x="12" y="15" textAnchor="middle" fill="#6320b7" fontSize="8" fontWeight="bold">Y!</text>
      </svg>
    ),
    warning: 'Yahoo vyžaduje App Password — běžné heslo nefunguje.',
    steps: [
      { n: 1, title: 'Vygeneruj App Password', desc: 'Jdi na security.yahoo.com → sekce App passwords → vygeneruj nové heslo pro "MujCRM".' },
      { n: 2, title: 'Zadej do MujCRM', desc: '' },
    ],
    values: { smtp_host: 'smtp.mail.yahoo.com', smtp_port: '587', security: 'STARTTLS', imap_host: 'imap.mail.yahoo.com', imap_port: '993' },
    link: { label: 'Otevřít zabezpečení Yahoo →', href: 'https://security.yahoo.com' },
  },
  {
    id: 'hosting-cz',
    name: 'Wedos / Active24 / Forpsi (hosting)',
    badge: null,
    badgeColor: '',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgba(16,185,129,0.7)" strokeWidth="1.8" strokeLinecap="round">
        <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>
        <path d="M6 8h.01M6 11h.01M9 8h6M9 11h6"/>
      </svg>
    ),
    warning: null,
    steps: [
      { n: 1, title: 'Zjisti SMTP/IMAP údaje', desc: 'Přesné hodnoty najdeš v administraci svého hostingu (administrace.wedos.com, administrace.active24.cz…) nebo v uvítacím emailu od poskytovatele při zřízení schránky.' },
      { n: 2, title: 'Zadej do MujCRM', desc: 'Heslo je stejné jako do webmail klienta (webmail.tvadomena.cz).' },
    ],
    values: { smtp_host: 'mail.[tvadomena].cz', smtp_port: '465 nebo 587', security: 'SSL/TLS nebo STARTTLS', imap_host: 'imap.[tvadomena].cz', imap_port: '993' },
    link: null,
  },
  {
    id: 'vlastni',
    name: 'Firemní email (vlastní hosting)',
    badge: null,
    badgeColor: '',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgba(237,237,237,0.4)" strokeWidth="1.8" strokeLinecap="round">
        <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>
      </svg>
    ),
    warning: null,
    steps: [
      { n: 1, title: 'Zjisti SMTP/IMAP údaje', desc: 'Pokud máš firemní email na vlastní doméně (např. ty@tvefirma.cz), zjisti přihlašovací údaje u svého poskytovatele hostingu (Wedos, Active24, Forpsi, Blueghost…) nebo u IT správce.' },
    ],
    values: { smtp_host: '', smtp_port: '587 nebo 465', security: 'STARTTLS nebo SSL/TLS', imap_host: '', imap_port: '993' },
    link: { label: 'Kontaktovat podporu MujCRM', href: '/#kontakt' },
  },
];

export default function EmailSettingsPage() {
  const supabase = createClient();
  const [tab, setTab] = useState<Tab>('pripojeni');
  const [settings, setSettings] = useState<Settings>(empty);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [savingSignature, setSavingSignature] = useState(false);
  const [verifyResult, setVerifyResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [signatureSaved, setSignatureSaved] = useState(false);
  const [openProvider, setOpenProvider] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from('email_settings').select('*').eq('user_id', user.id).single();
      if (data) setSettings({ ...empty, ...data });
      setLoading(false);
    };
    load();
  }, []);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerifying(true);
    setVerifyResult(null);
    try {
      const res = await fetch('/api/email/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      const json = await res.json();
      if (res.ok) {
        setVerifyResult({ ok: true, msg: 'Připojení funguje! Nastavení bylo uloženo.' });
        setSettings(s => ({ ...s, is_verified: true }));
      } else {
        setVerifyResult({ ok: false, msg: json.error || 'Chyba připojení' });
      }
    } catch {
      setVerifyResult({ ok: false, msg: 'Síťová chyba' });
    } finally {
      setVerifying(false);
    }
  };

  const handleSaveSignature = async () => {
    setSavingSignature(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSavingSignature(false); return; }
    await supabase.from('email_settings').upsert({
      user_id: user.id,
      signature: settings.signature,
    }, { onConflict: 'user_id' });
    setSignatureSaved(true);
    setTimeout(() => setSignatureSaved(false), 2500);
    setSavingSignature(false);
  };

  const TABS: { id: Tab; label: string }[] = [
    { id: 'pripojeni', label: 'Nastavení připojení' },
    { id: 'podpis', label: 'Podpis emailu' },
    { id: 'pruvodce', label: 'Průvodce nastavením' },
  ];

  if (loading) return (
    <div className="flex items-center justify-center h-full" style={{ color: 'rgba(237,237,237,0.35)' }}>Načítám…</div>
  );

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <Link href="/dashboard/settings" className="text-sm transition-colors" style={{ color: 'rgba(237,237,237,0.4)' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#00BFFF')}
          onMouseLeave={e => (e.currentTarget.style.color = 'rgba(237,237,237,0.4)')}>
          ← Nastavení
        </Link>
      </div>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(0,191,255,0.12)', color: '#00BFFF' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
          </svg>
        </div>
        <div>
          <h1 className="text-xl font-black text-white">Emailová schránka</h1>
          <p className="text-sm" style={{ color: 'rgba(237,237,237,0.4)' }}>
            {settings.is_verified
              ? <span style={{ color: '#10b981' }}>✓ Připojeno · {settings.smtp_user}</span>
              : 'Propoj svou emailovou schránku'}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 p-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className="flex-1 py-2 rounded-lg text-sm font-semibold transition-all"
            style={{
              background: tab === t.id ? 'rgba(0,191,255,0.12)' : 'transparent',
              color: tab === t.id ? '#00BFFF' : 'rgba(237,237,237,0.5)',
              border: tab === t.id ? '1px solid rgba(0,191,255,0.25)' : '1px solid transparent',
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── TAB: Připojení ── */}
      {tab === 'pripojeni' && (
        <form onSubmit={handleVerify} className="flex flex-col gap-6">
          {/* SMTP */}
          <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00BFFF" strokeWidth="2.5" strokeLinecap="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
              SMTP — Odesílání
            </h2>
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-[1fr_120px] gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={labelStyle}>SMTP Host</label>
                  <input type="text" placeholder="smtp.gmail.com" value={settings.smtp_host}
                    onChange={e => setSettings(s => ({ ...s, smtp_host: e.target.value }))}
                    style={inputStyle} onFocus={focus} onBlur={blur} />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={labelStyle}>Port</label>
                  <input type="number" value={settings.smtp_port}
                    onChange={e => setSettings(s => ({ ...s, smtp_port: parseInt(e.target.value) || 587 }))}
                    style={inputStyle} onFocus={focus} onBlur={blur} />
                </div>
              </div>

              {/* Zabezpečení */}
              <div>
                <label className="block text-xs font-semibold mb-2" style={labelStyle}>Zabezpečení</label>
                <div className="flex gap-2">
                  {[
                    { label: 'STARTTLS', port: 587, secure: false },
                    { label: 'SSL/TLS', port: 465, secure: true },
                  ].map(opt => (
                    <button key={opt.label} type="button"
                      onClick={() => setSettings(s => ({ ...s, smtp_secure: opt.secure, smtp_port: opt.port }))}
                      className="flex-1 py-2.5 rounded-xl text-xs font-semibold"
                      style={{
                        background: settings.smtp_secure === opt.secure ? 'rgba(0,191,255,0.12)' : 'rgba(255,255,255,0.04)',
                        border: `1px solid ${settings.smtp_secure === opt.secure ? 'rgba(0,191,255,0.35)' : 'rgba(255,255,255,0.08)'}`,
                        color: settings.smtp_secure === opt.secure ? '#00BFFF' : 'rgba(237,237,237,0.5)',
                      }}>
                      {opt.label} (port {opt.port})
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5" style={labelStyle}>Email / Uživatelské jméno</label>
                <input type="email" placeholder="ty@gmail.com" value={settings.smtp_user}
                  onChange={e => setSettings(s => ({ ...s, smtp_user: e.target.value }))}
                  style={inputStyle} onFocus={focus} onBlur={blur} />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={labelStyle}>Heslo / App Password</label>
                <input type="password" placeholder="••••••••••••••••" value={settings.smtp_password}
                  onChange={e => setSettings(s => ({ ...s, smtp_password: e.target.value }))}
                  style={inputStyle} onFocus={focus} onBlur={blur} />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={labelStyle}>Zobrazované jméno odesílatele</label>
                <input type="text" placeholder="Jan Novák" value={settings.display_name}
                  onChange={e => setSettings(s => ({ ...s, display_name: e.target.value }))}
                  style={inputStyle} onFocus={focus} onBlur={blur} />
              </div>
            </div>
          </div>

          {/* IMAP */}
          <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>
              IMAP — Příchozí pošta
            </h2>
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-[1fr_120px] gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={labelStyle}>IMAP Host</label>
                  <input type="text" placeholder="imap.gmail.com" value={settings.imap_host}
                    onChange={e => setSettings(s => ({ ...s, imap_host: e.target.value }))}
                    style={inputStyle} onFocus={focus} onBlur={blur} />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={labelStyle}>Port</label>
                  <input type="number" value={settings.imap_port}
                    onChange={e => setSettings(s => ({ ...s, imap_port: parseInt(e.target.value) || 993 }))}
                    style={inputStyle} onFocus={focus} onBlur={blur} />
                </div>
              </div>
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <div
                  onClick={() => setSettings(s => ({ ...s, imap_secure: !s.imap_secure }))}
                  className="relative w-10 h-5 rounded-full transition-all flex-shrink-0"
                  style={{ background: settings.imap_secure ? '#00BFFF' : 'rgba(255,255,255,0.12)', cursor: 'pointer' }}>
                  <div className="absolute top-0.5 w-4 h-4 rounded-full transition-all"
                    style={{ background: '#fff', left: settings.imap_secure ? '22px' : '2px' }} />
                </div>
                <span className="text-xs font-semibold" style={{ color: 'rgba(237,237,237,0.6)' }}>
                  Použít SSL/TLS (port 993) — vypnout pro STARTTLS (port 143)
                </span>
              </label>
              <p className="text-xs" style={{ color: 'rgba(237,237,237,0.35)' }}>
                Email a heslo jsou stejné jako u SMTP.
              </p>
            </div>
          </div>

          {/* Result banner */}
          {verifyResult && (
            <div className="flex items-start gap-3 px-4 py-3.5 rounded-xl text-sm font-semibold"
              style={{
                background: verifyResult.ok ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
                border: `1px solid ${verifyResult.ok ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'}`,
                color: verifyResult.ok ? '#10b981' : '#f87171',
              }}>
              {verifyResult.ok
                ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="flex-shrink-0 mt-0.5"><polyline points="20 6 9 17 4 12"/></svg>
                : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="flex-shrink-0 mt-0.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>}
              {verifyResult.msg}
            </div>
          )}

          <button type="submit" disabled={verifying}
            className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg, #00BFFF, #0090cc)', color: '#0a0a0a' }}>
            {verifying ? (
              <>
                <svg className="animate-spin" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" strokeOpacity=".25"/><path d="M12 2a10 10 0 0 1 10 10" strokeOpacity=".75"/></svg>
                Ověřuji připojení…
              </>
            ) : 'Ověřit a uložit připojení'}
          </button>
        </form>
      )}

      {/* ── TAB: Podpis ── */}
      {tab === 'podpis' && (
        <div className="flex flex-col gap-5">
          <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <h2 className="text-sm font-bold text-white mb-3">Podpis emailu</h2>
            <p className="text-xs mb-4" style={{ color: 'rgba(237,237,237,0.4)' }}>
              Podpis se automaticky přidá na konec každého odeslaného emailu. Podporuje HTML.
            </p>
            <textarea
              rows={8}
              placeholder={'S pozdravem,\nJan Novák\ntel: +420 123 456 789'}
              value={settings.signature}
              onChange={e => setSettings(s => ({ ...s, signature: e.target.value }))}
              style={{ ...inputStyle, resize: 'vertical', lineHeight: '1.6', fontSize: 13 }}
              onFocus={focus} onBlur={blur}
            />
            <button onClick={handleSaveSignature} disabled={savingSignature}
              className="mt-3 flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg, #00BFFF, #0090cc)', color: '#0a0a0a' }}>
              {savingSignature ? 'Ukládám…' : signatureSaved ? '✓ Uloženo' : 'Uložit podpis'}
            </button>
          </div>

          {settings.signature && (
            <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <p className="text-xs font-semibold mb-3" style={{ color: 'rgba(237,237,237,0.4)' }}>Náhled</p>
              <div className="p-4 rounded-xl" style={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.06)' }}>
                <p className="text-xs mb-2" style={{ color: 'rgba(237,237,237,0.3)' }}>— podpis —</p>
                <div className="text-sm" style={{ color: '#ededed', whiteSpace: 'pre-wrap' }}
                  dangerouslySetInnerHTML={{ __html: settings.signature }} />
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TAB: Průvodce ── */}
      {tab === 'pruvodce' && (
        <div className="flex flex-col gap-4">
          <p className="text-sm" style={{ color: 'rgba(237,237,237,0.5)' }}>
            Vyber svého poskytovatele emailu a postupuj podle návodu.
          </p>
          {providers.map(p => (
            <div key={p.id} className="rounded-2xl overflow-hidden"
              style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <button
                onClick={() => setOpenProvider(openProvider === p.id ? null : p.id)}
                className="w-full flex items-center justify-between px-5 py-4 text-left"
              >
                <div className="flex items-center gap-3">
                  {p.icon}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">{p.name}</span>
                      {p.badge && (
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                          style={{ background: p.badgeColor + '18', color: p.badgeColor, border: `1px solid ${p.badgeColor}30` }}>
                          {p.badge}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                  style={{ color: 'rgba(237,237,237,0.3)', transform: openProvider === p.id ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </button>

              {openProvider === p.id && (
                <div className="px-5 pb-5 flex flex-col gap-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  {/* Warning */}
                  {p.warning && (
                    <div className="flex items-start gap-2.5 mt-4 px-3.5 py-3 rounded-xl text-xs"
                      style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', color: '#fbbf24' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="flex-shrink-0 mt-0.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                      {p.warning}
                    </div>
                  )}

                  {/* Steps */}
                  <div className="flex flex-col gap-3 mt-1">
                    {p.steps.map(step => (
                      <div key={step.n} className="flex gap-3">
                        <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5"
                          style={{ background: 'rgba(0,191,255,0.15)', color: '#00BFFF' }}>
                          {step.n}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-white">{step.title}</p>
                          {step.descNode
                            ? step.descNode
                            : step.desc
                              ? <p className="text-xs mt-0.5" style={{ color: 'rgba(237,237,237,0.5)' }}>{step.desc}</p>
                              : null}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Extra note (e.g. Gmail App Password warning) */}
                  {p.extraNote && p.extraNote}

                  {/* Values box */}
                  <div className="rounded-xl p-4 font-mono text-xs flex flex-col gap-1.5"
                    style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    {[
                      ['SMTP Host', p.values.smtp_host],
                      ['SMTP Port', p.values.smtp_port],
                      ['Zabezpečení', p.values.security],
                      ['IMAP Host', p.values.imap_host],
                      ['IMAP Port', p.values.imap_port],
                    ].map(([k, v]) => v ? (
                      <div key={k} className="flex gap-3">
                        <span className="w-28 flex-shrink-0" style={{ color: 'rgba(237,237,237,0.35)' }}>{k}:</span>
                        <span style={{ color: '#00BFFF' }}>{v}</span>
                      </div>
                    ) : null)}
                  </div>

                  {/* Link */}
                  {p.link && (
                    <a href={p.link.href} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm font-semibold"
                      style={{ color: '#00BFFF' }}>
                      {p.link.label}
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                    </a>
                  )}

                  {/* Quick fill */}
                  {p.values.smtp_host && (
                    <button
                      onClick={() => {
                        setSettings(s => ({
                          ...s,
                          smtp_host: p.values.smtp_host,
                          smtp_port: parseInt(p.values.smtp_port) || 587,
                          smtp_secure: p.values.security === 'SSL/TLS',
                          imap_host: p.values.imap_host,
                          imap_port: parseInt(p.values.imap_port) || 993,
                          imap_secure: true,
                        }));
                        setTab('pripojeni');
                      }}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold self-start"
                      style={{ background: 'rgba(0,191,255,0.1)', border: '1px solid rgba(0,191,255,0.25)', color: '#00BFFF' }}>
                      Použít tato nastavení →
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
