'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

type TeamMember = { id: string; name: string; email: string; role: string; isOwner: boolean };

const inputCls = 'w-full px-4 py-3 rounded-xl text-sm transition-all outline-none';
const inputStyle = {
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)',
  color: '#ededed',
};

const TAGS = ['zákazník', 'lead', 'vip', 'partner'];

export default function NewContactPage() {
  const router = useRouter();
  const supabase = createClient();

  const [form, setForm] = useState({
    jmeno: '', prijmeni: '', email: '', telefon: '',
    firma: '', tag: 'zákazník', poznamky: '', assigned_to: '', datum_narozeni: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);

  useEffect(() => {
    fetch('/api/team/members').then(r => r.json()).then(d => setTeamMembers(d.members ?? []));
  }, []);

  const set = (key: string, val: string) => setForm(f => ({ ...f, [key]: val }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.jmeno.trim()) { setError('Jméno je povinné.'); return; }
    setLoading(true);
    setError('');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/auth/login'); return; }

    const { error: err } = await supabase.from('contacts').insert({
      user_id: user.id,
      jmeno: form.jmeno.trim(),
      prijmeni: form.prijmeni.trim() || null,
      email: form.email.trim() || null,
      telefon: form.telefon.trim() || null,
      firma: form.firma.trim() || null,
      tag: form.tag,
      poznamky: form.poznamky.trim() || null,
      assigned_to: form.assigned_to || null,
      datum_narozeni: form.datum_narozeni || null,
    });

    if (err) {
      setError('Nepodařilo se uložit zákazníka. Zkus to znovu.');
      setLoading(false);
    } else {
      router.push('/dashboard/contacts');
    }
  };

  const Field = ({ label, id, required, children }: { label: string; id: string; required?: boolean; children: React.ReactNode }) => (
    <div>
      <label htmlFor={id} className="block text-xs font-semibold mb-1.5" style={{ color: 'rgba(237,237,237,0.6)' }}>
        {label}{required && <span style={{ color: '#f87171' }}> *</span>}
      </label>
      {children}
    </div>
  );

  return (
    <div className="p-6 lg:p-8 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Link href="/dashboard/contacts" className="w-9 h-9 rounded-xl flex items-center justify-center transition-all"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(237,237,237,0.6)' }}
          onMouseEnter={undefined}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M19 12H5"/><polyline points="12 19 5 12 12 5"/></svg>
        </Link>
        <div>
          <h1 className="text-xl font-black text-white">Nový zákazník</h1>
          <p className="text-xs" style={{ color: 'rgba(237,237,237,0.45)' }}>Vyplň kontaktní údaje</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="rounded-2xl p-6 mb-4 flex flex-col gap-5"
          style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}>

          <div className="grid sm:grid-cols-2 gap-5">
            <Field label="Jméno" id="jmeno" required>
              <input id="jmeno" type="text" value={form.jmeno} onChange={e => set('jmeno', e.target.value)}
                placeholder="Jan" className={inputCls} style={inputStyle}
                onFocus={e => (e.currentTarget.style.borderColor = 'rgba(0,191,255,0.5)')}
                onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')} />
            </Field>
            <Field label="Příjmení" id="prijmeni">
              <input id="prijmeni" type="text" value={form.prijmeni} onChange={e => set('prijmeni', e.target.value)}
                placeholder="Novák" className={inputCls} style={inputStyle}
                onFocus={e => (e.currentTarget.style.borderColor = 'rgba(0,191,255,0.5)')}
                onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')} />
            </Field>
          </div>

          <div className="grid sm:grid-cols-2 gap-5">
            <Field label="E-mail" id="email">
              <input id="email" type="email" value={form.email} onChange={e => set('email', e.target.value)}
                placeholder="jan@firma.cz" className={inputCls} style={inputStyle}
                onFocus={e => (e.currentTarget.style.borderColor = 'rgba(0,191,255,0.5)')}
                onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')} />
            </Field>
            <Field label="Telefon" id="telefon">
              <input id="telefon" type="tel" value={form.telefon} onChange={e => set('telefon', e.target.value)}
                placeholder="+420 123 456 789" className={inputCls} style={inputStyle}
                onFocus={e => (e.currentTarget.style.borderColor = 'rgba(0,191,255,0.5)')}
                onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')} />
            </Field>
          </div>

          <div className="grid sm:grid-cols-2 gap-5">
            <Field label="Firma" id="firma">
              <input id="firma" type="text" value={form.firma} onChange={e => set('firma', e.target.value)}
                placeholder="Novák s.r.o." className={inputCls} style={inputStyle}
                onFocus={e => (e.currentTarget.style.borderColor = 'rgba(0,191,255,0.5)')}
                onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')} />
            </Field>
            <Field label="Tag" id="tag">
              <select id="tag" value={form.tag} onChange={e => set('tag', e.target.value)}
                className={inputCls} style={{ ...inputStyle, cursor: 'pointer' }}>
                {TAGS.map(t => <option key={t} value={t} style={{ background: '#1a1a1a' }}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
              </select>
            </Field>
          </div>

          <div className="grid sm:grid-cols-2 gap-5">
            <Field label="Datum narození" id="datum_narozeni">
              <input id="datum_narozeni" type="date" value={form.datum_narozeni} onChange={e => set('datum_narozeni', e.target.value)}
                className={inputCls} style={{ ...inputStyle, colorScheme: 'dark' }}
                onFocus={e => (e.currentTarget.style.borderColor = 'rgba(0,191,255,0.5)')}
                onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')} />
            </Field>
          </div>

          <Field label="Poznámky" id="poznamky">
            <textarea id="poznamky" value={form.poznamky} onChange={e => set('poznamky', e.target.value)}
              placeholder="Interní poznámky ke kontaktu…" rows={4}
              className={inputCls} style={{ ...inputStyle, resize: 'vertical' }}
              onFocus={e => (e.currentTarget.style.borderColor = 'rgba(0,191,255,0.5)')}
              onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')} />
          </Field>

          {teamMembers.length > 1 && (
            <Field label="Přiřadit členovi týmu" id="assigned_to">
              <select id="assigned_to" value={form.assigned_to} onChange={e => set('assigned_to', e.target.value)}
                className={inputCls} style={{ ...inputStyle, cursor: 'pointer' }}>
                <option value="" style={{ background: '#1a1a1a' }}>– Nepřiřazeno –</option>
                {teamMembers.map(m => (
                  <option key={m.id} value={m.id} style={{ background: '#1a1a1a' }}>
                    {m.name} {m.isOwner ? '(Admin)' : `(${m.role === 'clen' ? 'Člen' : m.role === 'cteni' ? 'Čtení' : m.role})`}
                  </option>
                ))}
              </select>
            </Field>
          )}
        </div>

        {error && (
          <p className="text-xs px-4 py-2.5 rounded-xl mb-4"
            style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }}>
            {error}
          </p>
        )}

        <div className="flex gap-3">
          <button type="submit" disabled={loading}
            className="flex-1 py-3 rounded-xl text-sm font-bold transition-all disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg, #00BFFF, #0090cc)', color: '#0a0a0a' }}>
            {loading ? 'Ukládám…' : 'Uložit zákazníka'}
          </button>
          <Link href="/dashboard/contacts"
            className="px-6 py-3 rounded-xl text-sm font-semibold transition-all"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(237,237,237,0.7)' }}>
            Zrušit
          </Link>
        </div>
      </form>
    </div>
  );
}
