'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

type Member = {
  id: string;
  member_email: string;
  member_name: string | null;
  role: string;
  status: string;
  created_at: string;
};

const ROLES = [
  { id: 'admin', label: 'Admin' },
  { id: 'clen', label: 'Člen' },
  { id: 'cteni', label: 'Pouze čtení' },
];

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  aktivni: { label: 'Aktivní', color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
  pozvan: { label: 'Pozván', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  neaktivni: { label: 'Neaktivní', color: '#6b7280', bg: 'rgba(107,114,128,0.12)' },
};

function initials(name: string | null, email: string) {
  if (name) {
    const parts = name.trim().split(' ');
    return parts.length >= 2 ? parts[0][0] + parts[1][0] : parts[0].slice(0, 2);
  }
  return email.slice(0, 2).toUpperCase();
}

const AVATAR_COLORS = ['#00BFFF', '#7B2FFF', '#10b981', '#f59e0b', '#f97316'];

export default function TeamPage() {
  const supabase = createClient();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ email: '', name: '', role: 'clen' });
  const [error, setError] = useState('');

  const inputStyle = {
    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '10px', padding: '10px 14px', color: '#ededed', fontSize: '14px',
    outline: 'none', width: '100%',
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    const { data } = await supabase
      .from('team_members')
      .select('*')
      .order('created_at', { ascending: false });
    setMembers((data as Member[]) ?? []);
    setLoading(false);
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email.trim()) { setError('Email je povinný.'); return; }
    setSaving(true);
    setError('');
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error: err } = await supabase.from('team_members').insert({
      owner_id: user.id,
      member_email: form.email.trim().toLowerCase(),
      member_name: form.name.trim() || null,
      role: form.role,
      status: 'pozvan',
    });

    if (err) {
      setError('Nepodařilo se pozvat člena. Zkus to znovu.');
      setSaving(false);
      return;
    }
    setForm({ email: '', name: '', role: 'clen' });
    setShowModal(false);
    setSaving(false);
    fetchMembers();
  };

  const handleRemove = async (id: string, email: string) => {
    if (!confirm(`Odebrat člena ${email}?`)) return;
    await supabase.from('team_members').delete().eq('id', id);
    setMembers(prev => prev.filter(m => m.id !== id));
  };

  const handleRoleChange = async (id: string, role: string) => {
    await supabase.from('team_members').update({ role }).eq('id', id);
    setMembers(prev => prev.map(m => m.id === id ? { ...m, role } : m));
  };

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-white">Tým</h1>
          <p className="text-sm mt-0.5" style={{ color: 'rgba(237,237,237,0.45)' }}>
            {members.length} {members.length === 1 ? 'člen' : members.length < 5 ? 'členové' : 'členů'}
          </p>
        </div>
        <button
          onClick={() => { setError(''); setShowModal(true); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold"
          style={{ background: 'linear-gradient(135deg, #00BFFF, #0090cc)', color: '#0a0a0a' }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Pozvat člena
        </button>
      </div>

      {/* Members list */}
      {loading ? (
        <div className="text-center py-20" style={{ color: 'rgba(237,237,237,0.35)' }}>Načítám…</div>
      ) : members.length === 0 ? (
        <div className="rounded-2xl py-16 text-center" style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.1)' }}>
          <svg className="mx-auto mb-4" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="rgba(237,237,237,0.2)" strokeWidth="1.5" strokeLinecap="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
          <p className="text-sm font-semibold text-white mb-1">Zatím žádní členové</p>
          <p className="text-sm" style={{ color: 'rgba(237,237,237,0.4)' }}>Pozvi kolegy a spolupracuj na CRM.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {members.map((m, i) => {
            const sm = STATUS_META[m.status] ?? STATUS_META.neaktivni;
            const avatarColor = AVATAR_COLORS[i % AVATAR_COLORS.length];
            return (
              <div
                key={m.id}
                className="flex items-center gap-4 px-5 py-4 rounded-2xl group"
                style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}
              >
                {/* Avatar */}
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                  style={{ background: avatarColor + '22', color: avatarColor }}
                >
                  {initials(m.member_name, m.member_email)}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-white">
                      {m.member_name ?? m.member_email}
                    </p>
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: sm.bg, color: sm.color }}>
                      {sm.label}
                    </span>
                  </div>
                  <p className="text-xs mt-0.5 truncate" style={{ color: 'rgba(237,237,237,0.4)' }}>
                    {m.member_email}
                  </p>
                </div>

                {/* Role select */}
                <select
                  value={m.role}
                  onChange={e => handleRoleChange(m.id, e.target.value)}
                  className="text-xs rounded-lg px-2.5 py-1.5 outline-none"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(237,237,237,0.7)', cursor: 'pointer' }}
                >
                  {ROLES.map(r => <option key={r.id} value={r.id} style={{ background: '#1a1a1a' }}>{r.label}</option>)}
                </select>

                {/* Remove */}
                <button
                  onClick={() => handleRemove(m.id, m.member_email)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                  style={{ color: 'rgba(239,68,68,0.5)' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#f87171')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'rgba(239,68,68,0.5)')}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Role legend */}
      <div className="mt-8 p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <p className="text-xs font-semibold mb-3" style={{ color: 'rgba(237,237,237,0.4)' }}>Přehled rolí</p>
        <div className="flex flex-col gap-1.5">
          {[
            { role: 'Admin', desc: 'Plný přístup, správa týmu, fakturace' },
            { role: 'Člen', desc: 'Může přidávat a upravovat záznamy' },
            { role: 'Pouze čtení', desc: 'Vidí data, nemůže měnit' },
          ].map(r => (
            <div key={r.role} className="flex items-center gap-2">
              <span className="text-xs font-semibold w-24 flex-shrink-0" style={{ color: 'rgba(237,237,237,0.6)' }}>{r.role}</span>
              <span className="text-xs" style={{ color: 'rgba(237,237,237,0.35)' }}>{r.desc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Modal – pozvat člena */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.7)' }} onClick={() => setShowModal(false)} />
          <div className="relative w-full max-w-md rounded-2xl p-6"
            style={{ background: '#141414', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-white">Pozvat člena</h2>
              <button onClick={() => setShowModal(false)} style={{ color: 'rgba(237,237,237,0.4)' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <form onSubmit={handleInvite} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'rgba(237,237,237,0.5)' }}>Email *</label>
                <input type="email" placeholder="kolega@firma.cz" value={form.email}
                  onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                  style={inputStyle}
                  onFocus={e => (e.currentTarget.style.borderColor = 'rgba(0,191,255,0.5)')}
                  onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')} />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'rgba(237,237,237,0.5)' }}>Jméno (volitelné)</label>
                <input type="text" placeholder="Jan Novák" value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  style={inputStyle}
                  onFocus={e => (e.currentTarget.style.borderColor = 'rgba(0,191,255,0.5)')}
                  onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')} />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'rgba(237,237,237,0.5)' }}>Role</label>
                <select value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))}
                  style={{ ...inputStyle, cursor: 'pointer' }}>
                  {ROLES.map(r => <option key={r.id} value={r.id} style={{ background: '#1a1a1a' }}>{r.label}</option>)}
                </select>
              </div>
              {error && (
                <p className="text-xs px-3 py-2 rounded-lg" style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }}>
                  {error}
                </p>
              )}
              <div className="flex gap-3 pt-1">
                <button type="submit" disabled={saving}
                  className="flex-1 py-3 rounded-xl text-sm font-bold disabled:opacity-60"
                  style={{ background: 'linear-gradient(135deg, #00BFFF, #0090cc)', color: '#0a0a0a' }}>
                  {saving ? 'Ukládám…' : 'Pozvat člena'}
                </button>
                <button type="button" onClick={() => setShowModal(false)}
                  className="px-5 py-3 rounded-xl text-sm font-semibold"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(237,237,237,0.7)' }}>
                  Zrušit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
