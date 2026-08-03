'use client';

import { useEffect, useState, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

// ─── Types ────────────────────────────────────────────────────────────────────

type PoptavkaTyp = 'investor' | 'kupujici_fo';

type Poptavka = {
  id: string;
  typ: PoptavkaTyp;
  jmeno: string;
  prijmeni: string | null;
  telefon: string | null;
  email: string | null;
  co_shani: string | null;
  castka_do: number | null;
  poznamky: string | null;
  created_at: string;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const TYP_OPTIONS: { id: PoptavkaTyp; label: string; color: string }[] = [
  { id: 'investor', label: 'Investor', color: '#7B2FFF' },
  { id: 'kupujici_fo', label: 'Kupující (fyzická osoba)', color: '#00BFFF' },
];

const typInfo = (typ: PoptavkaTyp) => TYP_OPTIONS.find(t => t.id === typ) ?? TYP_OPTIONS[1];

const inputStyle = {
  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '10px', padding: '10px 14px', color: '#ededed', fontSize: '14px',
  outline: 'none', width: '100%',
};

function fmtKc(v: number | null) {
  return v != null ? v.toLocaleString('cs-CZ') + ' Kč' : '–';
}

export default function PoptavkyPage() {
  const supabase = createClient();
  const [poptavky, setPoptavky] = useState<Poptavka[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterTyp, setFilterTyp] = useState<'vse' | PoptavkaTyp>('vse');
  const [showModal, setShowModal] = useState<'add' | Poptavka | null>(null);
  const [saving, setSaving] = useState(false);
  const [noteModal, setNoteModal] = useState<{ title: string; text: string } | null>(null);
  const [form, setForm] = useState({
    typ: 'kupujici_fo' as PoptavkaTyp, jmeno: '', prijmeni: '', telefon: '', email: '',
    co_shani: '', castka_do: '', poznamky: '',
  });

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    const { data } = await supabase
      .from('poptavky')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    setPoptavky((data as Poptavka[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const filtered = useMemo(() => {
    let list = poptavky;
    if (filterTyp !== 'vse') list = list.filter(p => p.typ === filterTyp);
    const s = search.trim().toLowerCase();
    if (!s) return list;
    return list.filter(p =>
      p.jmeno.toLowerCase().includes(s) ||
      (p.prijmeni ?? '').toLowerCase().includes(s) ||
      (p.email ?? '').toLowerCase().includes(s) ||
      (p.telefon ?? '').toLowerCase().includes(s) ||
      (p.co_shani ?? '').toLowerCase().includes(s)
    );
  }, [poptavky, search, filterTyp]);

  const investoriCount = poptavky.filter(p => p.typ === 'investor').length;
  const kupujiciCount = poptavky.filter(p => p.typ === 'kupujici_fo').length;

  function resetForm() {
    setForm({ typ: 'kupujici_fo', jmeno: '', prijmeni: '', telefon: '', email: '', co_shani: '', castka_do: '', poznamky: '' });
  }

  function openAdd() {
    resetForm();
    setShowModal('add');
  }

  function openEdit(p: Poptavka) {
    setForm({
      typ: p.typ, jmeno: p.jmeno, prijmeni: p.prijmeni ?? '', telefon: p.telefon ?? '', email: p.email ?? '',
      co_shani: p.co_shani ?? '', castka_do: p.castka_do != null ? String(p.castka_do) : '', poznamky: p.poznamky ?? '',
    });
    setShowModal(p);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.jmeno.trim()) return;
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }

    const record = {
      typ: form.typ,
      jmeno: form.jmeno.trim(),
      prijmeni: form.prijmeni.trim() || null,
      telefon: form.telefon.trim() || null,
      email: form.email.trim() || null,
      co_shani: form.co_shani.trim() || null,
      castka_do: form.castka_do ? parseFloat(form.castka_do) : null,
      poznamky: form.poznamky.trim() || null,
    };

    if (showModal === 'add' || showModal === null) {
      const { data, error } = await supabase.from('poptavky').insert({ user_id: user.id, ...record }).select().single();
      if (!error && data) setPoptavky(prev => [data as Poptavka, ...prev]);
    } else {
      const { data, error } = await supabase.from('poptavky').update(record).eq('id', showModal.id).select().single();
      if (!error && data) setPoptavky(prev => prev.map(p => p.id === (data as Poptavka).id ? data as Poptavka : p));
    }

    setSaving(false);
    setShowModal(null);
    resetForm();
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Smazat poptávku "${name}"?`)) return;
    await supabase.from('poptavky').delete().eq('id', id);
    setPoptavky(prev => prev.filter(p => p.id !== id));
  }

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-white">Poptávky</h1>
          <p className="text-sm mt-0.5" style={{ color: 'rgba(237,237,237,0.45)' }}>
            {poptavky.length} celkem · {investoriCount} investorů · {kupujiciCount} kupujících
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/poptavky/import"
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(237,237,237,0.5)' }}
            title="Import z tabulky"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
          </Link>
          <button
            onClick={openAdd}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold"
            style={{ background: 'linear-gradient(135deg, #00BFFF, #0090cc)', color: '#0a0a0a' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Přidat poptávku
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Celkem poptávek', value: poptavky.length, color: '#00BFFF' },
          { label: 'Investoři', value: investoriCount, color: '#7B2FFF' },
          { label: 'Kupující (FO)', value: kupujiciCount, color: '#22C55E' },
        ].map((c, i) => (
          <div key={i} className="rounded-2xl px-5 py-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <p className="text-xs font-semibold mb-1" style={{ color: 'rgba(237,237,237,0.4)' }}>{c.label}</p>
            <p className="text-2xl font-black" style={{ color: c.color }}>{c.value}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(237,237,237,0.35)" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input type="text" placeholder="Hledat jméno, kontakt, co shání…" value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#ededed', outline: 'none' }} />
        </div>
        <select value={filterTyp} onChange={e => setFilterTyp(e.target.value as 'vse' | PoptavkaTyp)}
          className="px-3 py-2.5 rounded-xl text-sm font-semibold"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(237,237,237,0.7)', outline: 'none', cursor: 'pointer' }}>
          <option value="vse" style={{ background: '#1a1a1a' }}>Všechny typy</option>
          {TYP_OPTIONS.map(t => <option key={t.id} value={t.id} style={{ background: '#1a1a1a' }}>{t.label}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24" style={{ color: 'rgba(237,237,237,0.35)' }}>Načítám…</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl py-20 text-center" style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.1)' }}>
          <p className="text-sm font-semibold text-white mb-1">{search || filterTyp !== 'vse' ? 'Žádné výsledky' : 'Zatím žádné poptávky'}</p>
          <p className="text-sm" style={{ color: 'rgba(237,237,237,0.4)' }}>{search || filterTyp !== 'vse' ? 'Zkus jiné hledání.' : 'Přidej první poptávku nebo naimportuj z tabulky.'}</p>
        </div>
      ) : (
        <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', color: 'rgba(237,237,237,0.35)', fontSize: 11 }}>
                  <th className="pl-4 pr-2 py-3 text-left font-semibold uppercase tracking-wider">Typ</th>
                  <th className="px-2 py-3 text-left font-semibold uppercase tracking-wider">Jméno</th>
                  <th className="px-2 py-3 hidden md:table-cell text-left font-semibold uppercase tracking-wider">Kontakt</th>
                  <th className="px-2 py-3 hidden lg:table-cell text-left font-semibold uppercase tracking-wider">Co shání</th>
                  <th className="px-2 py-3 text-right font-semibold uppercase tracking-wider">Do částky</th>
                  <th className="pr-4 py-3 text-right font-semibold uppercase tracking-wider">Akce</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p, i) => {
                  const ti = typInfo(p.typ);
                  const isLast = i === filtered.length - 1;
                  return (
                    <tr key={p.id} style={{ borderBottom: isLast ? 'none' : '1px solid rgba(255,255,255,0.05)' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                      <td className="pl-4 pr-2 py-3">
                        <span className="text-xs font-semibold px-2 py-1 rounded-full" style={{ background: ti.color + '18', color: ti.color, border: `1px solid ${ti.color}30` }}>
                          {ti.label}
                        </span>
                      </td>
                      <td className="px-2 py-3">
                        <button onClick={() => openEdit(p)} className="font-semibold text-white hover:text-cyan-400 transition-colors text-left">
                          {p.jmeno} {p.prijmeni ?? ''}
                        </button>
                      </td>
                      <td className="px-2 py-3 hidden md:table-cell" style={{ color: 'rgba(237,237,237,0.5)', fontSize: 12 }}>
                        <div>{p.telefon || '–'}</div>
                        {p.email && <div style={{ color: 'rgba(237,237,237,0.35)' }}>{p.email}</div>}
                      </td>
                      <td className="px-2 py-3 hidden lg:table-cell" style={{ maxWidth: 260 }}>
                        {p.co_shani ? (
                          <button
                            onClick={() => setNoteModal({ title: `${p.jmeno} ${p.prijmeni ?? ''}`.trim(), text: p.co_shani! })}
                            className="text-left underline decoration-dotted truncate block"
                            style={{ color: 'rgba(237,237,237,0.6)', maxWidth: 260 }}
                            title="Klikni pro zobrazení celého textu"
                          >
                            {p.co_shani}
                          </button>
                        ) : <span style={{ color: 'rgba(237,237,237,0.25)' }}>–</span>}
                      </td>
                      <td className="px-2 py-3 text-right tabular-nums" style={{ color: 'rgba(237,237,237,0.7)' }}>{fmtKc(p.castka_do)}</td>
                      <td className="pr-4 py-3">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => openEdit(p)}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold"
                            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(237,237,237,0.6)' }}>
                            Upravit
                          </button>
                          <button onClick={() => handleDelete(p.id, `${p.jmeno} ${p.prijmeni ?? ''}`.trim())}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold"
                            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}>
                            Smazat
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add/Edit modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.7)' }} onClick={() => setShowModal(null)} />
          <div className="relative w-full max-w-md rounded-2xl p-6 overflow-y-auto max-h-[90vh]"
            style={{ background: '#141414', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-white">{showModal === 'add' ? 'Nová poptávka' : 'Upravit poptávku'}</h2>
              <button onClick={() => setShowModal(null)} style={{ color: 'rgba(237,237,237,0.4)' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: 'rgba(237,237,237,0.5)' }}>Typ</label>
                <div className="grid grid-cols-2 gap-2">
                  {TYP_OPTIONS.map(t => (
                    <button key={t.id} type="button" onClick={() => setForm(p => ({ ...p, typ: t.id }))}
                      className="py-2.5 rounded-xl text-xs font-semibold transition-all"
                      style={{
                        background: form.typ === t.id ? t.color + '18' : 'rgba(255,255,255,0.04)',
                        border: `1px solid ${form.typ === t.id ? t.color + '50' : 'rgba(255,255,255,0.08)'}`,
                        color: form.typ === t.id ? t.color : 'rgba(237,237,237,0.5)',
                      }}>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: 'rgba(237,237,237,0.5)' }}>Jméno *</label>
                  <input type="text" value={form.jmeno} onChange={e => setForm(p => ({ ...p, jmeno: e.target.value }))} style={inputStyle}
                    onFocus={e => (e.currentTarget.style.borderColor = 'rgba(0,191,255,0.5)')}
                    onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')} />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: 'rgba(237,237,237,0.5)' }}>Příjmení</label>
                  <input type="text" value={form.prijmeni} onChange={e => setForm(p => ({ ...p, prijmeni: e.target.value }))} style={inputStyle}
                    onFocus={e => (e.currentTarget.style.borderColor = 'rgba(0,191,255,0.5)')}
                    onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: 'rgba(237,237,237,0.5)' }}>Telefon</label>
                  <input type="tel" value={form.telefon} onChange={e => setForm(p => ({ ...p, telefon: e.target.value }))} style={inputStyle}
                    onFocus={e => (e.currentTarget.style.borderColor = 'rgba(0,191,255,0.5)')}
                    onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')} />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: 'rgba(237,237,237,0.5)' }}>Email</label>
                  <input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} style={inputStyle}
                    onFocus={e => (e.currentTarget.style.borderColor = 'rgba(0,191,255,0.5)')}
                    onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: 'rgba(237,237,237,0.5)' }}>Co shání</label>
                <textarea rows={3} value={form.co_shani} onChange={e => setForm(p => ({ ...p, co_shani: e.target.value }))}
                  placeholder="Např. byt 2+kk v centru, do 15 min pěšky na tramvaj…"
                  style={{ ...inputStyle, resize: 'vertical', lineHeight: '1.5' }}
                  onFocus={e => (e.currentTarget.style.borderColor = 'rgba(0,191,255,0.5)')}
                  onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')} />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: 'rgba(237,237,237,0.5)' }}>Do jaké částky (Kč)</label>
                <input type="number" min={0} step={1} value={form.castka_do} onChange={e => setForm(p => ({ ...p, castka_do: e.target.value }))} placeholder="0"
                  style={inputStyle}
                  onFocus={e => (e.currentTarget.style.borderColor = 'rgba(0,191,255,0.5)')}
                  onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')} />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: 'rgba(237,237,237,0.5)' }}>Poznámky</label>
                <textarea rows={2} value={form.poznamky} onChange={e => setForm(p => ({ ...p, poznamky: e.target.value }))}
                  style={{ ...inputStyle, resize: 'vertical', lineHeight: '1.5' }}
                  onFocus={e => (e.currentTarget.style.borderColor = 'rgba(0,191,255,0.5)')}
                  onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')} />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="submit" disabled={saving || !form.jmeno.trim()}
                  className="flex-1 py-3 rounded-xl text-sm font-bold disabled:opacity-60"
                  style={{ background: 'linear-gradient(135deg, #00BFFF, #0090cc)', color: '#0a0a0a' }}>
                  {saving ? 'Ukládám…' : showModal === 'add' ? 'Přidat poptávku' : 'Uložit změny'}
                </button>
                <button type="button" onClick={() => setShowModal(null)}
                  className="px-4 py-3 rounded-xl text-sm font-semibold"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(237,237,237,0.7)' }}>
                  Zrušit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Note modal (co shání) */}
      {noteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.7)' }} onClick={() => setNoteModal(null)} />
          <div className="relative w-full max-w-md rounded-2xl p-6" style={{ background: '#141414', border: '1px solid rgba(255,255,255,0.1)' }}>
            <h3 className="text-sm font-bold text-white mb-2">{noteModal.title}</h3>
            <p className="text-sm whitespace-pre-wrap leading-relaxed" style={{ color: 'rgba(237,237,237,0.7)' }}>{noteModal.text}</p>
            <button onClick={() => setNoteModal(null)}
              className="mt-5 px-4 py-2 rounded-xl text-sm font-semibold"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(237,237,237,0.7)' }}>
              Zavřít
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
