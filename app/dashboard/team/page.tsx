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
  member_user_id: string | null;
};

const ROLES = [
  { id: 'admin', label: 'Admin' },
  { id: 'clen', label: 'Člen' },
  { id: 'cteni', label: 'Pouze čtení' },
];

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  aktivni:   { label: 'Aktivní',   color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
  pozvan:    { label: 'Čeká na přijetí', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  neaktivni: { label: 'Neaktivní', color: '#6b7280', bg: 'rgba(107,114,128,0.12)' },
};

const MEMBER_LIMITS: Record<string, number> = {
  trial: 10, start: 0, tym: 3, business: 10, enterprise: 999, active: 10, free: 0,
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
  const [plan, setPlan] = useState('free');
  const [isMember, setIsMember] = useState(false); // je člen cizího týmu, ne admin
  const [sendingReport, setSendingReport] = useState<string | null>(null);
  const [reportMsg, setReportMsg] = useState<{ id: string; ok: boolean; text: string } | null>(null);
  const [sendingMyReport, setSendingMyReport] = useState(false);
  const [myReportMsg, setMyReportMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const inputStyle = {
    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '10px', padding: '10px 14px', color: '#ededed', fontSize: '14px',
    outline: 'none', width: '100%',
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const [{ data: membersData }, { data: profile }, membershipRes] = await Promise.all([
      supabase.from('team_members').select('*').order('created_at', { ascending: false }),
      supabase.from('profiles').select('plan').eq('id', user.id).single(),
      fetch('/api/team/my-membership'),
    ]);

    const ownedMembers = (membersData as Member[]) ?? [];
    const membershipData = await membershipRes.json();

    setMembers(ownedMembers);
    setPlan(profile?.plan ?? 'free');
    setIsMember(membershipData.isMember === true);
    setLoading(false);
  };

  const limit = MEMBER_LIMITS[plan] ?? 0;
  const activeCount = members.filter(m => m.status !== 'neaktivni').length;
  const atLimit = activeCount >= limit;

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email.trim()) { setError('Email je povinný.'); return; }
    setSaving(true);
    setError('');

    const res = await fetch('/api/team/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: form.email, name: form.name, role: form.role }),
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? 'Nepodařilo se pozvat člena.');
      setSaving(false);
      return;
    }

    setForm({ email: '', name: '', role: 'clen' });
    setShowModal(false);
    setSaving(false);
    fetchAll();
  };

  const handleRemove = async (id: string, email: string) => {
    if (!confirm(`Odebrat člena ${email}?`)) return;
    await supabase.from('team_members').update({ status: 'neaktivni', member_user_id: null }).eq('id', id);
    setMembers(prev => prev.map(m => m.id === id ? { ...m, status: 'neaktivni', member_user_id: null } : m));
  };

  const handleRoleChange = async (id: string, role: string) => {
    await supabase.from('team_members').update({ role }).eq('id', id);
    setMembers(prev => prev.map(m => m.id === id ? { ...m, role } : m));
  };

  const handleSendMyReport = async () => {
    setSendingMyReport(true);
    setMyReportMsg(null);
    const res = await fetch('/api/team/send-my-report', { method: 'POST' });
    const data = await res.json();
    setSendingMyReport(false);
    setMyReportMsg({
      ok: res.ok,
      text: res.ok ? 'Výkaz byl odeslán vašemu nadřízenému.' : (data.error ?? 'Nepodařilo se odeslat výkaz.'),
    });
    setTimeout(() => setMyReportMsg(null), 6000);
  };

  const handleSendReport = async (memberUserId: string, memberId: string) => {
    setSendingReport(memberId);
    setReportMsg(null);
    const res = await fetch('/api/team/send-report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ memberUserId }),
    });
    const data = await res.json();
    setSendingReport(null);
    if (res.ok) {
      setReportMsg({ id: memberId, ok: true, text: 'Výkaz byl odeslán na váš e-mail.' });
    } else {
      setReportMsg({ id: memberId, ok: false, text: data.error ?? 'Nepodařilo se odeslat výkaz.' });
    }
    setTimeout(() => setReportMsg(null), 5000);
  };

  const handleResendInvite = async (email: string, name: string | null, role: string) => {
    const res = await fetch('/api/team/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name, role }),
    });
    if (res.ok) alert(`Pozvánka znovu odeslána na ${email}`);
    else alert('Nepodařilo se znovu odeslat pozvánku.');
  };

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto">
      {/* Člen týmu — info panel + tlačítko pro odeslání výkazu */}
      {isMember && (
        <div className="mb-6 rounded-xl overflow-hidden" style={{ border: '1px solid rgba(123,47,255,0.2)' }}>
          {/* Info hlavička */}
          <div className="flex items-start gap-3 p-4" style={{ background: 'rgba(123,47,255,0.06)' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-0.5">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            <p className="text-sm" style={{ color: 'rgba(237,237,237,0.6)' }}>
              Jste členem týmu. Předplatné a správu členů řídí váš nadřízený. Výkaz vaší práce za aktuální měsíc můžete odeslat nadřízenému přímo níže.
            </p>
          </div>

          {/* Akce — odeslat výkaz */}
          <div className="flex items-center justify-between px-4 py-3 gap-4" style={{ background: 'rgba(255,255,255,0.02)', borderTop: '1px solid rgba(123,47,255,0.12)' }}>
            <div>
              <p className="text-sm font-semibold text-white">Odeslat výkaz nadřízenému</p>
              <p className="text-xs mt-0.5" style={{ color: 'rgba(237,237,237,0.4)' }}>
                Aktuální stav zakázek za tento měsíc — odešle se na e-mail vašeho nadřízeného.
              </p>
            </div>
            <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
              <button
                onClick={handleSendMyReport}
                disabled={sendingMyReport}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #7B2FFF, #5b1fd4)', color: '#fff' }}
              >
                {sendingMyReport ? (
                  <>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ animation: 'spin 1s linear infinite' }}>
                      <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                    </svg>
                    Odesílám…
                  </>
                ) : (
                  <>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 4l16 8-16 8V4z"/>
                    </svg>
                    Odeslat výkaz
                  </>
                )}
              </button>
              {myReportMsg && (
                <span className="text-xs" style={{ color: myReportMsg.ok ? '#10b981' : '#f87171' }}>
                  {myReportMsg.text}
                </span>
              )}
            </div>
          </div>

          {/* Automatický reporting info */}
          <div className="px-4 py-3" style={{ background: 'rgba(255,255,255,0.015)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <p className="text-xs" style={{ color: 'rgba(237,237,237,0.35)' }}>
              Výkaz se také odesílá automaticky každý 1. den v měsíci za předchozí měsíc.
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-white">Tým</h1>
          {!isMember && (
            <p className="text-sm mt-0.5" style={{ color: 'rgba(237,237,237,0.45)' }}>
              {activeCount} / {limit === 999 ? '∞' : limit} členů
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          {/* Upgrade tlačítko jen pro adminy, kteří mají tarif s limitem a jsou na něm */}
          {!isMember && atLimit && limit > 0 && limit < 999 && (
            <a href="/dashboard/billing"
              className="text-xs font-semibold px-3 py-2 rounded-xl transition-all"
              style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', color: '#f59e0b' }}>
              Upgrade pro více míst →
            </a>
          )}
          {!isMember && <button
            onClick={() => { setError(''); setShowModal(true); }}
            disabled={atLimit}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: 'linear-gradient(135deg, #00BFFF, #0090cc)', color: '#0a0a0a' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Pozvat člena
          </button>}
        </div>
      </div>

      {/* Limit bar */}
      {!isMember && limit > 0 && limit < 999 && (
        <div className="mb-6 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs" style={{ color: 'rgba(237,237,237,0.5)' }}>Využití týmu</span>
            <span className="text-xs font-semibold" style={{ color: activeCount >= limit ? '#f87171' : '#00BFFF' }}>{activeCount}/{limit}</span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
            <div className="h-full rounded-full transition-all" style={{
              width: `${Math.min(100, (activeCount / limit) * 100)}%`,
              background: activeCount >= limit ? '#ef4444' : 'linear-gradient(90deg, #00BFFF, #0090cc)',
            }} />
          </div>
        </div>
      )}

      {/* Members list */}
      {loading ? (
        <div className="text-center py-20" style={{ color: 'rgba(237,237,237,0.35)' }}>Načítám…</div>
      ) : members.filter(m => m.status !== 'neaktivni').length === 0 ? (
        <div className="rounded-2xl py-16 text-center" style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.1)' }}>
          <svg className="mx-auto mb-4" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="rgba(237,237,237,0.2)" strokeWidth="1.5" strokeLinecap="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
          <p className="text-sm font-semibold text-white mb-1">Zatím žádní členové</p>
          <p className="text-sm" style={{ color: 'rgba(237,237,237,0.4)' }}>
            {limit === 0 ? 'Upgraduj tarif pro přidání členů týmu.' : 'Pozvi kolegy a spolupracuj na CRM.'}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {members.filter(m => m.status !== 'neaktivni').map((m, i) => {
            const sm = STATUS_META[m.status] ?? STATUS_META.neaktivni;
            const avatarColor = AVATAR_COLORS[i % AVATAR_COLORS.length];
            return (
              <div key={m.id}
                className="flex items-center gap-4 px-5 py-4 rounded-2xl group"
                style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}
              >
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                  style={{ background: avatarColor + '22', color: avatarColor }}>
                  {initials(m.member_name, m.member_email)}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-white">{m.member_name ?? m.member_email}</p>
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: sm.bg, color: sm.color }}>
                      {sm.label}
                    </span>
                  </div>
                  <p className="text-xs mt-0.5 truncate" style={{ color: 'rgba(237,237,237,0.4)' }}>{m.member_email}</p>
                </div>

                {/* Resend invite */}
                {m.status === 'pozvan' && (
                  <button
                    onClick={() => handleResendInvite(m.member_email, m.member_name, m.role)}
                    className="text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                    style={{ color: 'rgba(0,191,255,0.7)' }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#00BFFF')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'rgba(0,191,255,0.7)')}
                  >
                    Znovu odeslat
                  </button>
                )}

                {/* Send report button — only active members who have accepted */}
                {m.status === 'aktivni' && m.member_user_id && (
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <button
                      onClick={() => handleSendReport(m.member_user_id!, m.id)}
                      disabled={sendingReport === m.id}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all disabled:opacity-50"
                      style={{
                        background: 'rgba(123,47,255,0.1)',
                        border: '1px solid rgba(123,47,255,0.25)',
                        color: '#a855f7',
                      }}
                      onMouseEnter={e => { if (sendingReport !== m.id) e.currentTarget.style.background = 'rgba(123,47,255,0.18)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(123,47,255,0.1)'; }}
                    >
                      {sendingReport === m.id ? (
                        <>
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ animation: 'spin 1s linear infinite' }}>
                            <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                          </svg>
                          Odesílám…
                        </>
                      ) : (
                        <>
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M4 4l16 8-16 8V4z"/>
                          </svg>
                          Odeslat výkaz
                        </>
                      )}
                    </button>
                    {reportMsg?.id === m.id && (
                      <span className="text-xs" style={{ color: reportMsg.ok ? '#10b981' : '#f87171' }}>
                        {reportMsg.text}
                      </span>
                    )}
                  </div>
                )}

                {/* Role select */}
                <select value={m.role} onChange={e => handleRoleChange(m.id, e.target.value)}
                  className="text-xs rounded-lg px-2.5 py-1.5 outline-none"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(237,237,237,0.7)', cursor: 'pointer' }}>
                  {ROLES.map(r => <option key={r.id} value={r.id} style={{ background: '#1a1a1a' }}>{r.label}</option>)}
                </select>

                {/* Remove */}
                <button onClick={() => handleRemove(m.id, m.member_email)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                  style={{ color: 'rgba(239,68,68,0.5)' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#f87171')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'rgba(239,68,68,0.5)')}>
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
            { role: 'Admin',       desc: 'Vidí vše v týmu, spravuje členy a fakturaci' },
            { role: 'Člen',        desc: 'Vlastní workspace + přiřazené záznamy od ostatních' },
            { role: 'Pouze čtení', desc: 'Vidí svá data, nemůže nic měnit' },
          ].map(r => (
            <div key={r.role} className="flex items-center gap-2">
              <span className="text-xs font-semibold w-28 flex-shrink-0" style={{ color: 'rgba(237,237,237,0.6)' }}>{r.role}</span>
              <span className="text-xs" style={{ color: 'rgba(237,237,237,0.35)' }}>{r.desc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Automatické reporty info */}
      <div className="mt-6 p-4 rounded-xl" style={{ background: 'rgba(123,47,255,0.05)', border: '1px solid rgba(123,47,255,0.15)' }}>
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
            style={{ background: 'rgba(123,47,255,0.15)', color: '#a855f7' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 4l16 8-16 8V4z"/>
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold mb-1" style={{ color: '#a855f7' }}>Automatické měsíční výkazy</p>
            <p className="text-xs leading-relaxed" style={{ color: 'rgba(237,237,237,0.5)' }}>
              Každý 1. den v měsíci obdržíte na svůj e-mail automatický výkaz za každého aktivního člena týmu — zakázky, pipeline a hodnoty za uplynulý měsíc. Výkaz lze odeslat i okamžitě tlačítkem u každého člena.
            </p>
          </div>
        </div>
      </div>

      {/* Modal – pozvat člena */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.7)' }} onClick={() => setShowModal(false)} />
          <div className="relative w-full max-w-md rounded-2xl p-6"
            style={{ background: '#141414', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold text-white">Pozvat člena</h2>
                <p className="text-xs mt-0.5" style={{ color: 'rgba(237,237,237,0.4)' }}>
                  Zbývá {limit - activeCount} místo{limit - activeCount === 1 ? '' : limit - activeCount < 5 ? 'a' : ''}
                </p>
              </div>
              <button onClick={() => setShowModal(false)} style={{ color: 'rgba(237,237,237,0.4)' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            <div className="mb-4 px-3 py-2.5 rounded-lg text-xs" style={{ background: 'rgba(0,191,255,0.06)', border: '1px solid rgba(0,191,255,0.15)', color: 'rgba(0,191,255,0.8)' }}>
              Člen obdrží email s pozvánkou. Po přijetí získá vlastní workspace v MujCRM.
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
                  {saving ? 'Odesílám pozvánku…' : 'Odeslat pozvánku'}
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
