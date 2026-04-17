'use client';

import { useEffect, useRef, useState, Suspense } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter, useSearchParams } from 'next/navigation';
import { openCookieSettings } from '@/app/components/CookieConsent';

// ─── Constants ────────────────────────────────────────────────────────────────

const TIMEZONES = [
  { value: 'Europe/Prague', label: 'Praha / Bratislava (CET/CEST)' },
  { value: 'Europe/Warsaw', label: 'Varšava (CET/CEST)' },
  { value: 'Europe/Vienna', label: 'Vídeň (CET/CEST)' },
  { value: 'Europe/Berlin', label: 'Berlín (CET/CEST)' },
  { value: 'Europe/Paris', label: 'Paříž (CET/CEST)' },
  { value: 'Europe/London', label: 'Londýn (GMT/BST)' },
  { value: 'UTC', label: 'UTC' },
  { value: 'America/New_York', label: 'New York (EST/EDT)' },
  { value: 'America/Los_Angeles', label: 'Los Angeles (PST/PDT)' },
];

const LANGUAGES = [
  { value: 'cs', label: '🇨🇿  Čeština' },
  { value: 'sk', label: '🇸🇰  Slovenčina' },
  { value: 'en', label: '🇬🇧  English' },
];

// ─── Styles ───────────────────────────────────────────────────────────────────

const inputStyle = {
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '10px',
  padding: '10px 14px',
  color: '#ededed',
  fontSize: '14px',
  outline: 'none',
  width: '100%',
};

const cardStyle = {
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.07)',
  borderRadius: '16px',
  padding: '24px',
  marginBottom: '20px',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '12px',
  fontWeight: 600,
  marginBottom: '6px',
  color: 'rgba(237,237,237,0.45)',
};

// ─── Main Page ────────────────────────────────────────────────────────────────

type CompanySettings = {
  company_name: string;
  company_address: string;
  ico: string;
  dic: string;
  logo_url: string;
  timezone: string;
  language: string;
  gdpr_data_retention_months: number;
};

const DEFAULT_COMPANY: CompanySettings = {
  company_name: '',
  company_address: '',
  ico: '',
  dic: '',
  logo_url: '',
  timezone: 'Europe/Prague',
  language: 'cs',
  gdpr_data_retention_months: 24,
};

function MicrosoftCalendarCard({ showToast }: { showToast: (msg: string, color: string) => void }) {
  const searchParams = useSearchParams();
  const [connected, setConnected] = useState(false);
  const [msEmail, setMsEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [disconnecting, setDisconnecting] = useState(false);

  useEffect(() => {
    fetch('/api/microsoft-calendar/status')
      .then(r => r.json())
      .then(d => { setConnected(d.connected); setMsEmail(d.email ?? null); setLoading(false); });
  }, []);

  useEffect(() => {
    const mscal = searchParams.get('mscal');
    if (mscal === 'connected') showToast('Microsoft Kalendář úspěšně propojen!', '#10b981');
    if (mscal === 'error') showToast('Propojení Microsoft Kalendáře selhalo.', '#ef4444');
  }, [searchParams]);

  const disconnect = async () => {
    setDisconnecting(true);
    await fetch('/api/microsoft-calendar/disconnect', { method: 'DELETE' });
    setConnected(false);
    setMsEmail(null);
    setDisconnecting(false);
    showToast('Microsoft Kalendář odpojen.', '#f59e0b');
  };

  return (
    <div style={cardStyle}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
            style={{ background: 'rgba(0,120,212,0.15)', color: '#0078D4' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M11.5 2H2v9.5h9.5V2zm0 10.5H2V22h9.5v-9.5zM22 2h-9.5v9.5H22V2zm0 10.5h-9.5V22H22v-9.5z"/>
            </svg>
          </div>
          <div>
            <h2 className="text-base font-bold text-white mb-0.5">Microsoft Kalendář</h2>
            <p className="text-sm" style={{ color: 'rgba(237,237,237,0.45)' }}>
              {loading ? 'Načítám…' : connected
                ? <>Propojeno{msEmail ? `: ${msEmail}` : ''} · Události se zobrazí v kalendáři MujCRM.</>
                : 'Propoj Outlook / Microsoft 365 kalendář a zobrazuj události v MujCRM.'}
            </p>
          </div>
        </div>
        <div className="flex-shrink-0">
          {!loading && !connected && (
            <a href="/api/microsoft-calendar/connect"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all"
              style={{ background: 'rgba(0,120,212,0.12)', border: '1px solid rgba(0,120,212,0.3)', color: '#0078D4' }}>
              Propojit →
            </a>
          )}
          {!loading && connected && (
            <button onClick={disconnect} disabled={disconnecting}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all"
              style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}>
              {disconnecting ? 'Odpojuji…' : 'Odpojit'}
            </button>
          )}
        </div>
      </div>
      {!loading && connected && (
        <div className="mt-3 flex items-center gap-2 text-xs" style={{ color: '#10b981' }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
          Aktivní synchronizace
        </div>
      )}
    </div>
  );
}

function GoogleCalendarCard({ showToast }: { showToast: (msg: string, color: string) => void }) {
  const searchParams = useSearchParams();
  const [connected, setConnected] = useState(false);
  const [gcalEmail, setGcalEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [disconnecting, setDisconnecting] = useState(false);

  useEffect(() => {
    fetch('/api/google-calendar/status')
      .then(r => r.json())
      .then(d => { setConnected(d.connected); setGcalEmail(d.email ?? null); setLoading(false); });
  }, []);

  useEffect(() => {
    const gcal = searchParams.get('gcal');
    if (gcal === 'connected') showToast('Google Kalendář úspěšně propojen!', '#10b981');
    if (gcal === 'error') showToast('Propojení Google Kalendáře selhalo.', '#ef4444');
  }, [searchParams]);

  const disconnect = async () => {
    setDisconnecting(true);
    await fetch('/api/google-calendar/disconnect', { method: 'DELETE' });
    setConnected(false);
    setGcalEmail(null);
    setDisconnecting(false);
    showToast('Google Kalendář odpojen.', '#f59e0b');
  };

  return (
    <div style={cardStyle}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
            style={{ background: 'rgba(66,133,244,0.15)', color: '#4285F4' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="4" width="18" height="17" rx="2" stroke="currentColor" strokeWidth="1.8"/>
              <line x1="3" y1="9" x2="21" y2="9" stroke="currentColor" strokeWidth="1.8"/>
              <line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
              <line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          </div>
          <div>
            <h2 className="text-base font-bold text-white mb-0.5">Google Kalendář</h2>
            <p className="text-sm" style={{ color: 'rgba(237,237,237,0.45)' }}>
              {loading ? 'Načítám…' : connected
                ? <>Propojeno{gcalEmail ? `: ${gcalEmail}` : ''} · Události se zobrazí v kalendáři MujCRM.</>
                : 'Propoj svůj Google Kalendář a zobrazuj události přímo v MujCRM.'}
            </p>
          </div>
        </div>
        <div className="flex-shrink-0">
          {!loading && !connected && (
            <a href="/api/google-calendar/connect"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all"
              style={{ background: 'rgba(66,133,244,0.12)', border: '1px solid rgba(66,133,244,0.3)', color: '#4285F4' }}>
              Propojit →
            </a>
          )}
          {!loading && connected && (
            <button onClick={disconnect} disabled={disconnecting}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all"
              style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}>
              {disconnecting ? 'Odpojuji…' : 'Odpojit'}
            </button>
          )}
        </div>
      </div>
      {!loading && connected && (
        <div className="mt-3 flex items-center gap-2 text-xs" style={{ color: '#10b981' }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
          Aktivní synchronizace
        </div>
      )}
    </div>
  );
}

export default function SettingsPage() {
  const supabase = createClient();
  const router = useRouter();
  const logoInputRef = useRef<HTMLInputElement>(null);

  // User
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [loadingUser, setLoadingUser] = useState(true);

  // Email change
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [emailSending, setEmailSending] = useState(false);
  const [emailPending, setEmailPending] = useState(false);
  const [emailError, setEmailError] = useState('');

  // Company settings
  const [company, setCompany] = useState<CompanySettings>(DEFAULT_COMPANY);
  const [savingCompany, setSavingCompany] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);

  // GDPR / delete
  const [exportingData, setExportingData] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleting, setDeleting] = useState(false);

  // Toast
  const [toast, setToast] = useState<{ message: string; color: string } | null>(null);
  const showToast = (message: string, color: string) => {
    setToast({ message, color });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setEmail(user.email ?? '');
        setFullName(user.user_metadata?.full_name ?? '');
      }
      setLoadingUser(false);
    });

    supabase.from('company_settings').select('*').maybeSingle().then(({ data }) => {
      if (data) {
        setCompany({
          company_name: data.company_name ?? '',
          company_address: data.company_address ?? '',
          ico: data.ico ?? '',
          dic: data.dic ?? '',
          logo_url: data.logo_url ?? '',
          timezone: data.timezone ?? 'Europe/Prague',
          language: data.language ?? 'cs',
          gdpr_data_retention_months: data.gdpr_data_retention_months ?? 24,
        });
      }
    });
  }, []);

  // ── Save company settings ─────────────────────────────────────────────────

  const saveCompany = async () => {
    setSavingCompany(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSavingCompany(false); return; }

    const { error } = await supabase.from('company_settings').upsert(
      { user_id: user.id, ...company, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    );

    setSavingCompany(false);
    if (error) showToast('Chyba při ukládání: ' + error.message, '#ef4444');
    else showToast('Nastavení uloženo.', '#22C55E');
  };

  // ── Logo upload ───────────────────────────────────────────────────────────

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      showToast('Logo je příliš velké (max 2 MB).', '#ef4444');
      return;
    }

    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'png';
    if (!['png', 'jpg', 'jpeg', 'webp', 'svg'].includes(ext)) {
      showToast('Podporované formáty: PNG, JPG, WEBP, SVG.', '#ef4444');
      return;
    }

    setLogoUploading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLogoUploading(false); return; }

    const path = `${user.id}/logo.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from('logos')
      .upload(path, file, { upsert: true, contentType: file.type });

    if (uploadError) {
      showToast('Chyba při nahrávání loga: ' + uploadError.message, '#ef4444');
      setLogoUploading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage.from('logos').getPublicUrl(path);
    const logoWithCache = publicUrl + '?t=' + Date.now();

    setCompany(c => ({ ...c, logo_url: logoWithCache }));

    // Immediately save logo_url
    await supabase.from('company_settings').upsert(
      { user_id: user.id, logo_url: logoWithCache, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    );

    setLogoUploading(false);
    showToast('Logo bylo nahráno.', '#22C55E');
  };

  const removeLogo = async () => {
    setCompany(c => ({ ...c, logo_url: '' }));
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('company_settings').upsert(
      { user_id: user.id, logo_url: null, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    );
    showToast('Logo bylo odstraněno.', '#f59e0b');
  };

  // ── Email change ──────────────────────────────────────────────────────────

  const handleEmailChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim() || newEmail.trim() === email) return;
    setEmailSending(true);
    setEmailError('');

    const { error } = await supabase.auth.updateUser({ email: newEmail.trim() });
    if (error) { setEmailError(error.message); setEmailSending(false); return; }

    setEmailPending(true);
    setShowEmailForm(false);
    setNewEmail('');
    setEmailSending(false);
    showToast('Potvrzovací e-mail byl odeslán na novou adresu.', '#f59e0b');
  };

  // ── Export data ───────────────────────────────────────────────────────────

  const handleExportData = async () => {
    setExportingData(true);
    const res = await fetch('/api/settings/export-data');
    const data = await res.json();
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mujcrm-export-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setExportingData(false);
    showToast('Export dokončen.', '#22C55E');
  };

  // ── Delete account ────────────────────────────────────────────────────────

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== 'SMAZAT') return;
    setDeleting(true);
    const res = await fetch('/api/settings/delete-account', { method: 'DELETE' });
    if (!res.ok) {
      const d = await res.json();
      showToast('Chyba: ' + d.error, '#ef4444');
      setDeleting(false);
      return;
    }
    await supabase.auth.signOut();
    router.replace('/auth/login');
  };

  if (loadingUser) {
    return (
      <div className="flex items-center justify-center h-full" style={{ color: 'rgba(237,237,237,0.35)' }}>
        Načítám…
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-black text-white mb-2">Nastavení</h1>
      <p className="text-sm mb-8" style={{ color: 'rgba(237,237,237,0.45)' }}>
        Správa účtu, firmy a dat.
      </p>

      {/* ══════════════════════════════════════
          PROFIL
      ══════════════════════════════════════ */}
      <div style={cardStyle}>
        <h2 className="text-base font-bold text-white mb-5">Profil</h2>
        <div className="flex flex-col gap-5">
          <div>
            <label style={labelStyle}>Jméno</label>
            <input type="text" value={fullName} readOnly style={{ ...inputStyle, color: 'rgba(237,237,237,0.5)', cursor: 'default' }} />
          </div>

          <div>
            <label style={labelStyle}>E-mail</label>
            <div className="flex items-center gap-2 mb-2">
              <input type="email" value={email} readOnly style={{ ...inputStyle, color: 'rgba(237,237,237,0.5)', cursor: 'default' }} />
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              {emailPending && (
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.3)' }}>
                  ⏳ Čeká na potvrzení
                </span>
              )}
              {!showEmailForm && (
                <button onClick={() => { setShowEmailForm(true); setEmailPending(false); }}
                  style={{ color: '#00BFFF', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: 12, fontWeight: 600 }}>
                  Změnit e-mail
                </button>
              )}
            </div>

            {showEmailForm && (
              <div className="mt-3 rounded-xl p-4" style={{ background: 'rgba(0,191,255,0.05)', border: '1px solid rgba(0,191,255,0.15)' }}>
                <p className="text-xs font-semibold mb-3" style={{ color: 'rgba(237,237,237,0.6)' }}>Nová e-mailová adresa</p>
                <form onSubmit={handleEmailChange} className="flex flex-col gap-3">
                  <input type="email" placeholder="novy@email.cz" value={newEmail}
                    onChange={e => { setNewEmail(e.target.value); setEmailError(''); }}
                    autoFocus required style={inputStyle}
                    onFocus={e => (e.currentTarget.style.borderColor = 'rgba(0,191,255,0.5)')}
                    onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')}
                  />
                  {emailError && <p className="text-xs" style={{ color: '#f87171' }}>{emailError}</p>}
                  <div className="flex gap-2">
                    <button type="submit" disabled={emailSending || !newEmail.trim()}
                      className="px-4 py-2 rounded-lg text-xs font-bold disabled:opacity-50"
                      style={{ background: 'linear-gradient(135deg, #00BFFF, #0090cc)', color: '#0a0a0a' }}>
                      {emailSending ? 'Odesílám…' : 'Odeslat potvrzení'}
                    </button>
                    <button type="button" onClick={() => { setShowEmailForm(false); setNewEmail(''); setEmailError(''); }}
                      className="px-4 py-2 rounded-lg text-xs font-semibold"
                      style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(237,237,237,0.6)' }}>
                      Zrušit
                    </button>
                  </div>
                </form>
                <p className="text-xs mt-3" style={{ color: 'rgba(237,237,237,0.35)' }}>
                  Na novou adresu zašleme potvrzovací e-mail. Změna se projeví až po potvrzení.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════
          FIRMA
      ══════════════════════════════════════ */}
      <div style={cardStyle}>
        <h2 className="text-base font-bold text-white mb-5">Firma</h2>

        {/* Logo */}
        <div className="mb-6">
          <label style={labelStyle}>Logo firmy</label>
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center flex-shrink-0 overflow-hidden"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
              {company.logo_url ? (
                <img src={company.logo_url} alt="Logo" className="w-full h-full object-contain p-1" />
              ) : (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(237,237,237,0.2)" strokeWidth="1.5" strokeLinecap="round">
                  <rect x="3" y="3" width="18" height="18" rx="3"/>
                  <circle cx="8.5" cy="8.5" r="1.5"/>
                  <polyline points="21 15 16 10 5 21"/>
                </svg>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <input ref={logoInputRef} type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml"
                className="hidden" onChange={handleLogoUpload} />
              <button onClick={() => logoInputRef.current?.click()} disabled={logoUploading}
                className="px-4 py-2 rounded-xl text-xs font-bold disabled:opacity-50"
                style={{ background: 'rgba(0,191,255,0.1)', border: '1px solid rgba(0,191,255,0.25)', color: '#00BFFF' }}>
                {logoUploading ? 'Nahrávám…' : company.logo_url ? 'Změnit logo' : 'Nahrát logo'}
              </button>
              {company.logo_url && (
                <button onClick={removeLogo} className="px-4 py-2 rounded-xl text-xs font-semibold"
                  style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444' }}>
                  Odstranit logo
                </button>
              )}
              <p className="text-xs" style={{ color: 'rgba(237,237,237,0.3)' }}>PNG, JPG, WEBP, SVG · max 2 MB</p>
            </div>
          </div>
        </div>

        {/* Název firmy */}
        <div className="flex flex-col gap-4">
          <div>
            <label style={labelStyle}>Název firmy</label>
            <input type="text" value={company.company_name}
              onChange={e => setCompany(c => ({ ...c, company_name: e.target.value }))}
              placeholder="Moje firma s.r.o."
              style={inputStyle}
              onFocus={e => (e.currentTarget.style.borderColor = 'rgba(0,191,255,0.4)')}
              onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')}
            />
          </div>

          <div>
            <label style={labelStyle}>Adresa</label>
            <input type="text" value={company.company_address}
              onChange={e => setCompany(c => ({ ...c, company_address: e.target.value }))}
              placeholder="Ulice 123, 110 00 Praha 1"
              style={inputStyle}
              onFocus={e => (e.currentTarget.style.borderColor = 'rgba(0,191,255,0.4)')}
              onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label style={labelStyle}>IČO</label>
              <input type="text" value={company.ico}
                onChange={e => setCompany(c => ({ ...c, ico: e.target.value }))}
                placeholder="12345678"
                maxLength={8}
                style={inputStyle}
                onFocus={e => (e.currentTarget.style.borderColor = 'rgba(0,191,255,0.4)')}
                onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')}
              />
            </div>
            <div>
              <label style={labelStyle}>DIČ</label>
              <input type="text" value={company.dic}
                onChange={e => setCompany(c => ({ ...c, dic: e.target.value }))}
                placeholder="CZ12345678"
                style={inputStyle}
                onFocus={e => (e.currentTarget.style.borderColor = 'rgba(0,191,255,0.4)')}
                onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')}
              />
            </div>
          </div>

          <button onClick={saveCompany} disabled={savingCompany}
            className="w-full py-2.5 rounded-xl text-sm font-bold disabled:opacity-50 transition-all mt-1"
            style={{ background: 'linear-gradient(135deg, #00BFFF, #0090cc)', color: '#0a0a0a' }}>
            {savingCompany ? 'Ukládám…' : 'Uložit nastavení firmy'}
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════
          ZOBRAZENÍ
      ══════════════════════════════════════ */}
      <div style={cardStyle}>
        <h2 className="text-base font-bold text-white mb-5">Zobrazení</h2>

        <div className="flex flex-col gap-4">
          <div>
            <label style={labelStyle}>Časová zóna</label>
            <select
              value={company.timezone}
              onChange={e => setCompany(c => ({ ...c, timezone: e.target.value }))}
              style={{ ...inputStyle, cursor: 'pointer' }}
            >
              {TIMEZONES.map(tz => (
                <option key={tz.value} value={tz.value}>{tz.label}</option>
              ))}
            </select>
            <p className="text-xs mt-1.5" style={{ color: 'rgba(237,237,237,0.3)' }}>
              Nyní: {new Date().toLocaleTimeString('cs-CZ', { timeZone: company.timezone, hour: '2-digit', minute: '2-digit' })} v {company.timezone}
            </p>
          </div>

          <div>
            <label style={labelStyle}>Jazyk aplikace</label>
            <select
              value={company.language}
              onChange={e => setCompany(c => ({ ...c, language: e.target.value }))}
              style={{ ...inputStyle, cursor: 'pointer' }}
            >
              {LANGUAGES.map(l => (
                <option key={l.value} value={l.value}>{l.label}</option>
              ))}
            </select>
          </div>

          <button onClick={saveCompany} disabled={savingCompany}
            className="w-full py-2.5 rounded-xl text-sm font-bold disabled:opacity-50 transition-all mt-1"
            style={{ background: 'rgba(0,191,255,0.1)', border: '1px solid rgba(0,191,255,0.25)', color: '#00BFFF' }}>
            {savingCompany ? 'Ukládám…' : 'Uložit zobrazení'}
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════
          GDPR & DATA
      ══════════════════════════════════════ */}
      <div style={cardStyle}>
        <h2 className="text-base font-bold text-white mb-2">GDPR a ochrana dat</h2>
        <p className="text-sm mb-5" style={{ color: 'rgba(237,237,237,0.4)' }}>
          V souladu s GDPR máš právo na přístup ke svým datům, jejich přenositelnost a výmaz.
        </p>

        {/* Info box */}
        <div className="rounded-xl p-4 mb-5" style={{ background: 'rgba(0,191,255,0.05)', border: '1px solid rgba(0,191,255,0.12)' }}>
          <p className="text-xs font-semibold mb-2" style={{ color: '#00BFFF' }}>Co uchováváme</p>
          <ul className="text-xs space-y-1" style={{ color: 'rgba(237,237,237,0.5)' }}>
            <li>• Zákazníci, zakázky, leady a aktivity, které jsi vytvořil</li>
            <li>• Nastavení účtu a firmy</li>
            <li>• Přihlašovací údaje a e-mailová adresa</li>
          </ul>
        </div>

        {/* Retention */}
        <div className="mb-5">
          <label style={labelStyle}>Doba uchování dat po zrušení účtu (měsíce)</label>
          <select
            value={company.gdpr_data_retention_months}
            onChange={e => setCompany(c => ({ ...c, gdpr_data_retention_months: Number(e.target.value) }))}
            style={{ ...inputStyle, cursor: 'pointer', maxWidth: 200 }}
          >
            <option value={1}>1 měsíc</option>
            <option value={3}>3 měsíce</option>
            <option value={6}>6 měsíců</option>
            <option value={12}>12 měsíců</option>
            <option value={24}>24 měsíců</option>
          </select>
          <button onClick={saveCompany} disabled={savingCompany}
            className="ml-3 px-4 py-2 rounded-xl text-xs font-bold disabled:opacity-50 transition-all"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(237,237,237,0.7)' }}>
            Uložit
          </button>
        </div>

        {/* Export + Delete */}
        <div className="flex flex-col gap-3">
          <button onClick={handleExportData} disabled={exportingData}
            className="flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-semibold disabled:opacity-50 transition-all"
            style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', color: '#22C55E' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            {exportingData ? 'Připravuji export…' : 'Exportovat všechna moje data (JSON)'}
          </button>

          <button onClick={() => setShowDeleteModal(true)}
            className="flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-semibold transition-all"
            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6l-1 14H6L5 6"/>
              <path d="M10 11v6M14 11v6"/>
              <path d="M9 6V4h6v2"/>
            </svg>
            Smazat účet a všechna data
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════
          COOKIES
      ══════════════════════════════════════ */}
      <div style={cardStyle}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
              style={{ background: 'rgba(245,158,11,0.12)', color: '#f59e0b', fontSize: 18 }}>
              🍪
            </div>
            <div>
              <h2 className="text-base font-bold text-white mb-0.5">Souhlas s cookies</h2>
              <p className="text-sm" style={{ color: 'rgba(237,237,237,0.45)' }}>
                Zobraz nebo změň svůj souhlas s analytickými a marketingovými cookies.
              </p>
            </div>
          </div>
          <button
            onClick={openCookieSettings}
            className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all"
            style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)', color: '#f59e0b', cursor: 'pointer' }}>
            Správa cookies
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════
          PRŮVODCE
      ══════════════════════════════════════ */}
      <div style={cardStyle}>
        <h2 className="text-base font-bold text-white mb-1">Průvodce aplikací</h2>
        <p className="text-sm mb-4" style={{ color: 'rgba(237,237,237,0.45)' }}>
          Spusť interaktivního průvodce, který tě znovu provede všemi sekcemi MujCRM.
        </p>
        <button
          onClick={() => { localStorage.removeItem('mujcrm_tour_completed'); window.location.href = '/dashboard'; }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
          style={{ background: 'rgba(0,191,255,0.1)', border: '1px solid rgba(0,191,255,0.25)', color: '#00BFFF' }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          Spustit průvodce znovu
        </button>
      </div>

      {/* ══════════════════════════════════════
          EMAILOVÁ SCHRÁNKA
      ══════════════════════════════════════ */}
      <div style={cardStyle}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
              style={{ background: 'rgba(0,191,255,0.12)', color: '#00BFFF' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
            </div>
            <div>
              <h2 className="text-base font-bold text-white mb-0.5">Emailová schránka</h2>
              <p className="text-sm" style={{ color: 'rgba(237,237,237,0.45)' }}>
                Propoj vlastní emailovou schránku a piš emaily přímo z CRM.
              </p>
            </div>
          </div>
          <a href="/dashboard/settings/email"
            className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all"
            style={{ background: 'rgba(0,191,255,0.1)', border: '1px solid rgba(0,191,255,0.25)', color: '#00BFFF' }}>
            Nastavit email →
          </a>
        </div>
      </div>

      {/* ══════════════════════════════════════
          GOOGLE KALENDÁŘ
      ══════════════════════════════════════ */}
      <Suspense fallback={null}>
        <GoogleCalendarCard showToast={showToast} />
      </Suspense>

      {/* ══════════════════════════════════════
          MICROSOFT KALENDÁŘ
      ══════════════════════════════════════ */}
      <Suspense fallback={null}>
        <MicrosoftCalendarCard showToast={showToast} />
      </Suspense>

      {/* ══════════════════════════════════════
          MODAL — Smazat účet
      ══════════════════════════════════════ */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}>
          <div className="w-full max-w-md rounded-2xl p-6"
            style={{ background: '#111', border: '1px solid rgba(239,68,68,0.3)' }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/>
                  <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
              </div>
              <div>
                <h3 className="text-base font-black text-white">Smazat účet</h3>
                <p className="text-xs" style={{ color: 'rgba(237,237,237,0.45)' }}>Tato akce je nevratná</p>
              </div>
            </div>

            <p className="text-sm mb-4" style={{ color: 'rgba(237,237,237,0.6)' }}>
              Dojde ke smazání <strong className="text-white">všech tvých dat</strong> — zákazníků, zakázek, leadů, aktivit i nastavení. Účet nelze obnovit.
            </p>

            <div className="rounded-xl p-3 mb-4" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
              <p className="text-xs mb-2" style={{ color: 'rgba(237,237,237,0.5)' }}>
                Pro potvrzení napiš <strong className="font-mono" style={{ color: '#ef4444' }}>SMAZAT</strong>
              </p>
              <input
                type="text"
                value={deleteConfirm}
                onChange={e => setDeleteConfirm(e.target.value)}
                placeholder="SMAZAT"
                autoFocus
                style={{ ...inputStyle, borderColor: 'rgba(239,68,68,0.3)', fontFamily: 'monospace' }}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleDeleteAccount}
                disabled={deleteConfirm !== 'SMAZAT' || deleting}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold disabled:opacity-40 transition-all"
                style={{ background: '#ef4444', color: '#fff' }}>
                {deleting ? 'Mažu…' : 'Smazat účet natrvalo'}
              </button>
              <button
                onClick={() => { setShowDeleteModal(false); setDeleteConfirm(''); }}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(237,237,237,0.6)' }}>
                Zrušit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-semibold shadow-xl"
          style={{ background: toast.color + '18', border: `1px solid ${toast.color}40`, color: toast.color, backdropFilter: 'blur(8px)' }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          {toast.message}
        </div>
      )}
    </div>
  );
}
