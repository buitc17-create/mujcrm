'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type Recipient = {
  id: string;
  email: string;
  jmeno: string | null;
  firma: string | null;
  status: 'pending' | 'sent' | 'failed' | 'unsubscribed';
  sent_at: string | null;
  error: string | null;
  created_at: string;
};

type Stats = { total: number; pending: number; sent: number; failed: number; unsubscribed: number };

const STATUS_LABELS: Record<string, string> = {
  pending: 'Čeká', sent: 'Odesláno', failed: 'Chyba', unsubscribed: 'Odhlášeno',
};
const STATUS_COLORS: Record<string, string> = {
  pending: '#f59e0b', sent: '#22C55E', failed: '#ef4444', unsubscribed: 'rgba(237,237,237,0.35)',
};

export default function OutreachPanel() {
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, pending: 0, sent: 0, failed: 0, unsubscribed: 0 });
  const [loading, setLoading] = useState(true);
  const [importText, setImportText] = useState('');
  const [importing, setImporting] = useState(false);
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState<{ msg: string; color: string } | null>(null);
  const [filter, setFilter] = useState<'vse' | Recipient['status']>('vse');

  function showToast(msg: string, color: string) {
    setToast({ msg, color });
    setTimeout(() => setToast(null), 4000);
  }

  async function load() {
    setLoading(true);
    const res = await fetch('/api/admin/outreach');
    if (res.ok) {
      const json = await res.json();
      setRecipients(json.recipients ?? []);
      setStats(json.stats ?? stats);
    } else {
      showToast('Nepodařilo se načíst data (jsi přihlášen/a v /admin?).', '#ef4444');
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleImport() {
    if (!importText.trim()) return;
    setImporting(true);
    const res = await fetch('/api/admin/outreach/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: importText }),
    });
    const json = await res.json();
    setImporting(false);
    if (!res.ok) { showToast(json.error ?? 'Chyba při importu.', '#ef4444'); return; }
    showToast(`Naimportováno ${json.imported}, přeskočeno ${json.skipped} duplicit.`, '#22C55E');
    setImportText('');
    load();
  }

  async function handleSendBatch() {
    setSending(true);
    const res = await fetch('/api/admin/outreach/send-batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ batchSize: 10 }),
    });
    const json = await res.json();
    setSending(false);
    if (!res.ok) { showToast(json.error ?? 'Chyba při odesílání.', '#ef4444'); return; }
    if (json.message) { showToast(json.message, '#00BFFF'); return; }
    showToast(`Odesláno ${json.sent}, selhalo ${json.failed}.`, json.failed > 0 ? '#f59e0b' : '#22C55E');
    load();
  }

  async function handleDelete(id: string, email: string) {
    if (!confirm(`Smazat kontakt "${email}" ze seznamu?`)) return;
    const res = await fetch('/api/admin/outreach', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    if (res.ok) setRecipients(prev => prev.filter(r => r.id !== id));
  }

  const filtered = filter === 'vse' ? recipients : recipients.filter(r => r.status === filter);

  const inputStyle = {
    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '10px', padding: '10px 14px', color: '#ededed', fontSize: '13px',
    outline: 'none', width: '100%',
  };

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/dashboard/admin" className="w-9 h-9 rounded-xl flex items-center justify-center transition-all"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(237,237,237,0.6)' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M19 12H5"/><polyline points="12 19 5 12 12 5"/></svg>
        </Link>
        <div>
          <h1 className="text-xl font-black text-white">Outreach kampaň — makléři</h1>
          <p className="text-xs mt-0.5" style={{ color: 'rgba(237,237,237,0.45)' }}>
            Studená nabídka MujCRM. Posíláno přes samostatnou identitu (Resend), po dávkách.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
        {[
          { label: 'Celkem', value: stats.total, color: '#00BFFF' },
          { label: 'Čeká', value: stats.pending, color: '#f59e0b' },
          { label: 'Odesláno', value: stats.sent, color: '#22C55E' },
          { label: 'Chyba', value: stats.failed, color: '#ef4444' },
          { label: 'Odhlášeno', value: stats.unsubscribed, color: 'rgba(237,237,237,0.4)' },
        ].map((c, i) => (
          <div key={i} className="rounded-2xl px-4 py-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <p className="text-xs font-semibold mb-1" style={{ color: 'rgba(237,237,237,0.4)' }}>{c.label}</p>
            <p className="text-xl font-black" style={{ color: c.color }}>{c.value}</p>
          </div>
        ))}
      </div>

      {/* Import */}
      <div className="rounded-2xl p-5 mb-6" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}>
        <p className="text-sm font-bold text-white mb-2">Import kontaktů</p>
        <p className="text-xs mb-3" style={{ color: 'rgba(237,237,237,0.4)' }}>
          Vlož řádky z Google Sheets — jeden kontakt na řádek: <code>email</code>, nebo <code>email, jméno</code>, nebo <code>email, jméno, firma</code>.
        </p>
        <textarea rows={5} value={importText} onChange={e => setImportText(e.target.value)}
          placeholder={'jan.novak@realitka.cz, Jan Novák\nanna.svobodova@realitka.cz, Anna Svobodová, Realitka s.r.o.'}
          style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5, fontFamily: 'monospace' }} />
        <button onClick={handleImport} disabled={importing || !importText.trim()}
          className="mt-3 px-4 py-2.5 rounded-xl text-sm font-bold disabled:opacity-50"
          style={{ background: 'linear-gradient(135deg, #00BFFF, #0090cc)', color: '#0a0a0a' }}>
          {importing ? 'Importuji…' : 'Naimportovat'}
        </button>
      </div>

      {/* Send batch */}
      <div className="rounded-2xl p-5 mb-6 flex items-center justify-between flex-wrap gap-3" style={{ background: 'rgba(0,191,255,0.05)', border: '1px solid rgba(0,191,255,0.2)' }}>
        <div>
          <p className="text-sm font-bold text-white">Odeslat další dávku</p>
          <p className="text-xs mt-0.5" style={{ color: 'rgba(237,237,237,0.45)' }}>
            Pošle e-mail dalším 10 kontaktům se stavem &quot;Čeká&quot;. Klikni podle toho, jak rychle chceš postupovat — jednou denně to navíc pošle i automatický cron.
          </p>
        </div>
        <button onClick={handleSendBatch} disabled={sending || stats.pending === 0}
          className="px-5 py-3 rounded-xl text-sm font-bold disabled:opacity-40 flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #00BFFF, #0090cc)', color: '#0a0a0a' }}>
          {sending ? 'Odesílám…' : `Odeslat dalších ${Math.min(10, stats.pending)}`}
        </button>
      </div>

      {/* Toast */}
      {toast && (
        <div className="mb-4 px-4 py-3 rounded-xl text-sm font-semibold" style={{ background: toast.color + '18', border: `1px solid ${toast.color}40`, color: toast.color }}>
          {toast.msg}
        </div>
      )}

      {/* Table */}
      <div className="flex items-center gap-2 mb-3">
        {(['vse', 'pending', 'sent', 'failed', 'unsubscribed'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold"
            style={{
              background: filter === f ? 'rgba(0,191,255,0.12)' : 'rgba(255,255,255,0.04)',
              color: filter === f ? '#00BFFF' : 'rgba(237,237,237,0.5)',
              border: `1px solid ${filter === f ? 'rgba(0,191,255,0.3)' : 'rgba(255,255,255,0.08)'}`,
            }}>
            {f === 'vse' ? 'Vše' : STATUS_LABELS[f]}
          </button>
        ))}
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', color: 'rgba(237,237,237,0.35)', fontSize: 11 }}>
                <th className="pl-4 pr-2 py-3 text-left font-semibold uppercase tracking-wider">Email</th>
                <th className="px-2 py-3 text-left font-semibold uppercase tracking-wider">Jméno / firma</th>
                <th className="px-2 py-3 text-left font-semibold uppercase tracking-wider">Stav</th>
                <th className="px-2 py-3 hidden md:table-cell text-left font-semibold uppercase tracking-wider">Odesláno</th>
                <th className="pr-4 py-3 text-right font-semibold uppercase tracking-wider">Akce</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="py-14 text-center" style={{ color: 'rgba(237,237,237,0.35)' }}>Načítám…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={5} className="py-14 text-center" style={{ color: 'rgba(237,237,237,0.35)' }}>Žádné kontakty.</td></tr>
              ) : filtered.map((r, i) => (
                <tr key={r.id} style={{ borderBottom: i === filtered.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.05)' }}>
                  <td className="pl-4 pr-2 py-3 text-white font-medium">{r.email}</td>
                  <td className="px-2 py-3" style={{ color: 'rgba(237,237,237,0.55)', fontSize: 12 }}>
                    {[r.jmeno, r.firma].filter(Boolean).join(' · ') || '–'}
                  </td>
                  <td className="px-2 py-3">
                    <span className="text-xs font-semibold px-2 py-1 rounded-full" style={{ background: STATUS_COLORS[r.status] + '18', color: STATUS_COLORS[r.status] }}>
                      {STATUS_LABELS[r.status]}
                    </span>
                    {r.error && <div className="text-xs mt-1" style={{ color: '#ef4444', maxWidth: 240 }} title={r.error}>{r.error.slice(0, 60)}</div>}
                  </td>
                  <td className="px-2 py-3 hidden md:table-cell" style={{ color: 'rgba(237,237,237,0.4)', fontSize: 12 }}>
                    {r.sent_at ? new Date(r.sent_at).toLocaleString('cs-CZ') : '–'}
                  </td>
                  <td className="pr-4 py-3 text-right">
                    <button onClick={() => handleDelete(r.id, r.email)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold"
                      style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}>
                      Smazat
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
