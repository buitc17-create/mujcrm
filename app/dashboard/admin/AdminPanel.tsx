'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';

interface AdminUser {
  id: string;
  email: string;
  fullName: string | null;
  createdAt: string;
  plan: string;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  pendingPlan: string | null;
  pendingPlanDate: string | null;
  billingInterval: 'monthly' | 'yearly' | null;
  periodStart: string | null;
  periodEnd: string | null;
  subscriptionStatus: string | null;
}

const PLAN_LABELS: Record<string, string> = {
  free: 'Free',
  start: 'Start',
  tym: 'Tým',
  business: 'Business',
  enterprise: 'Enterprise',
};

const PLAN_COLORS: Record<string, string> = {
  free: 'rgba(237,237,237,0.3)',
  start: '#22C55E',
  tym: '#00BFFF',
  business: '#7B2FFF',
  enterprise: '#FFB400',
};

const STATUS_LABELS: Record<string, string> = {
  active: 'Aktivní',
  trialing: 'Trial',
  past_due: 'Nezaplaceno',
  canceled: 'Zrušeno',
  incomplete: 'Neúplné',
  incomplete_expired: 'Expirováno',
  paused: 'Pozastaveno',
};

const STATUS_COLORS: Record<string, string> = {
  active: '#22C55E',
  trialing: '#00BFFF',
  past_due: '#FF5050',
  canceled: 'rgba(237,237,237,0.3)',
  incomplete: '#FFB400',
  incomplete_expired: 'rgba(237,237,237,0.3)',
  paused: '#FFB400',
};

function formatDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'numeric', year: 'numeric' });
}

function formatDateTime(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'numeric', year: 'numeric' });
}

export default function AdminPanel({ onLogout }: { onLogout?: boolean }) {
  const router = useRouter();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'createdAt' | 'plan' | 'periodEnd'>('createdAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/users')
      .then(r => r.json())
      .then(d => {
        if (d.error) setError(d.error);
        else setUsers(d.users ?? []);
      })
      .catch(() => setError('Nepodařilo se načíst data.'))
      .finally(() => setLoading(false));
  }, []);

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      const res = await fetch('/api/admin/delete-user', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: deleteTarget.id }),
      });
      const data = await res.json();
      if (data.success) {
        setUsers(prev => prev.filter(u => u.id !== deleteTarget.id));
        setDeleteTarget(null);
      } else {
        setDeleteError(data.error ?? 'Chyba při mazání.');
      }
    } catch {
      setDeleteError('Nepodařilo se smazat uživatele.');
    } finally {
      setDeleting(false);
    }
  }

  const paidUsers = users.filter(u => u.plan !== 'free');
  const freeUsers = users.filter(u => u.plan === 'free');
  const monthlyUsers = paidUsers.filter(u => u.billingInterval === 'monthly');
  const yearlyUsers = paidUsers.filter(u => u.billingInterval === 'yearly');

  const planCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const u of users) {
      counts[u.plan] = (counts[u.plan] ?? 0) + 1;
    }
    return counts;
  }, [users]);

  const filtered = useMemo(() => {
    let list = [...users];
    if (planFilter !== 'all') list = list.filter(u => u.plan === planFilter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(u =>
        u.email.toLowerCase().includes(q) ||
        (u.fullName ?? '').toLowerCase().includes(q)
      );
    }
    list.sort((a, b) => {
      let av: string, bv: string;
      if (sortBy === 'createdAt') { av = a.createdAt; bv = b.createdAt; }
      else if (sortBy === 'plan') { av = a.plan; bv = b.plan; }
      else { av = a.periodEnd ?? ''; bv = b.periodEnd ?? ''; }
      return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
    });
    return list;
  }, [users, search, planFilter, sortBy, sortDir]);

  function toggleSort(col: typeof sortBy) {
    if (sortBy === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortBy(col); setSortDir('desc'); }
  }

  const SortIcon = ({ col }: { col: typeof sortBy }) => (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
      style={{ opacity: sortBy === col ? 1 : 0.3, transform: sortBy === col && sortDir === 'asc' ? 'rotate(180deg)' : undefined }}>
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center" style={{ minHeight: 300 }}>
        <div className="flex items-center gap-3" style={{ color: 'rgba(237,237,237,0.4)' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="animate-spin">
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          </svg>
          Načítám data…
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="px-4 py-3 rounded-xl text-sm" style={{ background: 'rgba(255,80,80,0.08)', border: '1px solid rgba(255,80,80,0.25)', color: '#FF5050' }}>
          Chyba: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Potvrzovací dialog smazání */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
          <div className="w-full max-w-md rounded-2xl p-6" style={{ background: '#161616', border: '1px solid rgba(255,80,80,0.3)' }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(255,80,80,0.15)', border: '1px solid rgba(255,80,80,0.3)' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FF5050" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                </svg>
              </div>
              <div>
                <h3 className="text-base font-black text-white">Smazat uživatele?</h3>
                <p className="text-xs mt-0.5" style={{ color: 'rgba(237,237,237,0.45)' }}>Tato akce je nevratná</p>
              </div>
            </div>

            <div className="rounded-xl px-4 py-3 mb-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <p className="text-sm font-semibold text-white">{deleteTarget.email}</p>
              {deleteTarget.fullName && <p className="text-xs mt-0.5" style={{ color: 'rgba(237,237,237,0.4)' }}>{deleteTarget.fullName}</p>}
            </div>

            <p className="text-sm mb-1" style={{ color: 'rgba(237,237,237,0.6)', lineHeight: 1.6 }}>
              Budou trvale smazána <strong style={{ color: '#fff' }}>veškerá data uživatele</strong> — kontakty, zakázky, leady, úkoly, aktivity, e-maily a nastavení.
            </p>
            <p className="text-xs mb-5" style={{ color: 'rgba(237,237,237,0.4)', lineHeight: 1.6 }}>
              Uživateli bude odesláno e-mailové oznámení o smazání účtu.
              {deleteTarget.stripeSubscriptionId && ' Aktivní Stripe předplatné bude zrušeno.'}
            </p>

            {deleteError && (
              <div className="mb-4 px-3 py-2 rounded-lg text-xs" style={{ background: 'rgba(255,80,80,0.1)', border: '1px solid rgba(255,80,80,0.25)', color: '#FF5050' }}>
                {deleteError}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => { setDeleteTarget(null); setDeleteError(null); }}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(237,237,237,0.6)' }}
              >
                Zrušit
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all"
                style={{ background: deleting ? 'rgba(255,80,80,0.3)' : 'rgba(255,80,80,0.9)', color: '#fff', opacity: deleting ? 0.7 : 1 }}
              >
                {deleting ? 'Mažu…' : 'Smazat trvale'}
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(255,80,80,0.15)', border: '1px solid rgba(255,80,80,0.3)' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FF5050" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <h1 className="text-2xl font-black text-white">Super Admin</h1>
          </div>
          <p className="text-sm" style={{ color: 'rgba(237,237,237,0.4)' }}>Správa uživatelů a předplatných napříč celou platformou.</p>
        </div>
        {onLogout && (
          <button
            onClick={async () => {
              await fetch('/api/admin/auth', { method: 'DELETE' });
              router.push('/admin');
              router.refresh();
            }}
            className="px-4 py-2 rounded-xl text-sm font-semibold flex-shrink-0"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(237,237,237,0.5)' }}
          >
            Odhlásit
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Celkem uživatelů', value: users.length, color: 'rgba(237,237,237,0.8)' },
          { label: 'Platící uživatelé', value: paidUsers.length, color: '#22C55E' },
          { label: 'Měsíční platby', value: monthlyUsers.length, color: '#00BFFF' },
          { label: 'Roční platby', value: yearlyUsers.length, color: '#7B2FFF' },
        ].map(stat => (
          <div key={stat.label} className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <p className="text-xs font-medium mb-2" style={{ color: 'rgba(237,237,237,0.45)' }}>{stat.label}</p>
            <p className="text-3xl font-black" style={{ color: stat.color }}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Plan breakdown */}
      <div className="rounded-2xl p-5 mb-8" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}>
        <p className="text-xs font-semibold mb-4" style={{ color: 'rgba(237,237,237,0.45)' }}>ROZLOŽENÍ DLE TARIFU</p>
        <div className="flex flex-wrap gap-3">
          {['free', 'start', 'tym', 'business', 'enterprise'].map(plan => {
            const count = planCounts[plan] ?? 0;
            if (count === 0) return null;
            return (
              <button
                key={plan}
                onClick={() => setPlanFilter(planFilter === plan ? 'all' : plan)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition-all"
                style={{
                  background: planFilter === plan ? `${PLAN_COLORS[plan]}20` : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${planFilter === plan ? PLAN_COLORS[plan] + '60' : 'rgba(255,255,255,0.07)'}`,
                  color: planFilter === plan ? PLAN_COLORS[plan] : 'rgba(237,237,237,0.6)',
                }}
              >
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: PLAN_COLORS[plan] }} />
                {PLAN_LABELS[plan]}
                <span className="font-black">{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'rgba(237,237,237,0.3)' }}>
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Hledat podle emailu nebo jména…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#ededed' }}
          />
        </div>
        {planFilter !== 'all' && (
          <button
            onClick={() => setPlanFilter('all')}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(237,237,237,0.6)' }}
          >
            Zrušit filtr ×
          </button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                <th className="text-left px-4 py-3 font-semibold" style={{ color: 'rgba(237,237,237,0.45)' }}>Uživatel</th>
                <th className="text-left px-4 py-3 font-semibold cursor-pointer select-none" style={{ color: 'rgba(237,237,237,0.45)' }} onClick={() => toggleSort('plan')}>
                  <span className="flex items-center gap-1.5">Tarif <SortIcon col="plan" /></span>
                </th>
                <th className="text-left px-4 py-3 font-semibold" style={{ color: 'rgba(237,237,237,0.45)' }}>Fakturace</th>
                <th className="text-left px-4 py-3 font-semibold cursor-pointer select-none" style={{ color: 'rgba(237,237,237,0.45)' }} onClick={() => toggleSort('periodEnd')}>
                  <span className="flex items-center gap-1.5">Období <SortIcon col="periodEnd" /></span>
                </th>
                <th className="text-left px-4 py-3 font-semibold" style={{ color: 'rgba(237,237,237,0.45)' }}>Status</th>
                <th className="text-left px-4 py-3 font-semibold cursor-pointer select-none" style={{ color: 'rgba(237,237,237,0.45)' }} onClick={() => toggleSort('createdAt')}>
                  <span className="flex items-center gap-1.5">Registrace <SortIcon col="createdAt" /></span>
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-sm" style={{ color: 'rgba(237,237,237,0.3)' }}>
                    Žádní uživatelé nenalezeni.
                  </td>
                </tr>
              ) : filtered.map((u, i) => (
                <tr
                  key={u.id}
                  style={{
                    borderBottom: i < filtered.length - 1 ? '1px solid rgba(255,255,255,0.05)' : undefined,
                    background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)',
                  }}
                >
                  {/* Uživatel */}
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-semibold text-white truncate max-w-[200px]">{u.email}</p>
                      {u.fullName && (
                        <p className="text-xs truncate max-w-[200px]" style={{ color: 'rgba(237,237,237,0.4)' }}>{u.fullName}</p>
                      )}
                    </div>
                  </td>

                  {/* Tarif */}
                  <td className="px-4 py-3">
                    <span
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold"
                      style={{
                        background: `${PLAN_COLORS[u.plan]}18`,
                        border: `1px solid ${PLAN_COLORS[u.plan]}40`,
                        color: PLAN_COLORS[u.plan],
                      }}
                    >
                      {PLAN_LABELS[u.plan] ?? u.plan}
                      {u.pendingPlan && (
                        <span style={{ color: '#FFB400', fontSize: 9 }}>→ {PLAN_LABELS[u.pendingPlan]}</span>
                      )}
                    </span>
                  </td>

                  {/* Fakturace */}
                  <td className="px-4 py-3">
                    {u.billingInterval ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold"
                        style={{
                          background: u.billingInterval === 'yearly' ? 'rgba(123,47,255,0.12)' : 'rgba(0,191,255,0.1)',
                          border: `1px solid ${u.billingInterval === 'yearly' ? 'rgba(123,47,255,0.3)' : 'rgba(0,191,255,0.25)'}`,
                          color: u.billingInterval === 'yearly' ? '#b48cff' : '#00BFFF',
                        }}>
                        {u.billingInterval === 'yearly' ? 'Ročně' : 'Měsíčně'}
                      </span>
                    ) : (
                      <span style={{ color: 'rgba(237,237,237,0.25)' }}>—</span>
                    )}
                  </td>

                  {/* Období */}
                  <td className="px-4 py-3">
                    {u.periodStart && u.periodEnd ? (
                      <div>
                        <p className="text-xs font-medium" style={{ color: 'rgba(237,237,237,0.7)' }}>
                          {formatDate(u.periodStart)} — {formatDate(u.periodEnd)}
                        </p>
                        {u.pendingPlan && u.pendingPlanDate && (
                          <p className="text-xs" style={{ color: 'rgba(255,180,0,0.7)' }}>
                            Změna {formatDate(u.pendingPlanDate)}
                          </p>
                        )}
                      </div>
                    ) : (
                      <span style={{ color: 'rgba(237,237,237,0.25)' }}>—</span>
                    )}
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3">
                    {u.subscriptionStatus ? (
                      <span
                        className="inline-flex items-center gap-1.5 text-xs font-semibold"
                        style={{ color: STATUS_COLORS[u.subscriptionStatus] ?? 'rgba(237,237,237,0.5)' }}
                      >
                        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                          style={{ background: STATUS_COLORS[u.subscriptionStatus] ?? 'rgba(237,237,237,0.3)' }} />
                        {STATUS_LABELS[u.subscriptionStatus] ?? u.subscriptionStatus}
                      </span>
                    ) : (
                      <span style={{ color: 'rgba(237,237,237,0.25)' }}>—</span>
                    )}
                  </td>

                  {/* Registrace */}
                  <td className="px-4 py-3 text-xs" style={{ color: 'rgba(237,237,237,0.45)' }}>
                    {formatDateTime(u.createdAt)}
                  </td>

                  {/* Akce */}
                  <td className="px-4 py-3">
                    <button
                      onClick={() => { setDeleteTarget(u); setDeleteError(null); }}
                      title="Smazat uživatele"
                      className="w-7 h-7 flex items-center justify-center rounded-lg transition-all"
                      style={{ background: 'rgba(255,80,80,0.08)', border: '1px solid rgba(255,80,80,0.2)', color: 'rgba(255,80,80,0.6)' }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,80,80,0.18)'; e.currentTarget.style.color = '#FF5050'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,80,80,0.08)'; e.currentTarget.style.color = 'rgba(255,80,80,0.6)'; }}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 flex items-center justify-between" style={{ borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
          <p className="text-xs" style={{ color: 'rgba(237,237,237,0.3)' }}>
            {filtered.length} z {users.length} uživatelů
            {planFilter !== 'all' && ` · filtr: ${PLAN_LABELS[planFilter]}`}
          </p>
          <p className="text-xs" style={{ color: 'rgba(237,237,237,0.2)' }}>
            Platící: {paidUsers.length} · Free: {freeUsers.length}
          </p>
        </div>
      </div>
    </div>
  );
}
