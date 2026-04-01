import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import GuidedTour from './GuidedTour';
import TourButton from './TourButton';
import TrialBanner from './TrialBanner';

const tagColors: Record<string, string> = {
  zákazník: '#00BFFF',
  lead: '#f59e0b',
  vip: '#7B2FFF',
  partner: '#10b981',
};

function fmtKc(val: number) {
  return val.toLocaleString('cs-CZ') + ' Kč';
}

const TYPES = [
  { id: 'schuzka',   label: 'Schůzka',      color: '#00BFFF' },
  { id: 'telefonat', label: 'Telefonát',     color: '#10b981' },
  { id: 'demo',      label: 'Prezentace',    color: '#7B2FFF' },
  { id: 'followup',  label: 'Follow-up',     color: '#f59e0b' },
  { id: 'deadline',  label: 'Deadline',      color: '#ef4444' },
];

const ACTIVITY_LABELS: Record<string, { label: string; color: string }> = {
  hovor:       { label: 'Hovor',        color: '#10b981' },
  email:       { label: 'Email',        color: '#00BFFF' },
  schuzka:     { label: 'Schůzka',      color: '#7B2FFF' },
  demo:        { label: 'Prezentace',   color: '#f97316' },
  zadost:      { label: 'Žádost',       color: '#f59e0b' },
  jine:        { label: 'Jiné',         color: '#6b7280' },
};

const PRIORITY_COLORS: Record<string, string> = {
  nizka: '#6b7280',
  stredni: '#f59e0b',
  vysoka: '#ef4444',
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const { data: profile } = await supabase.from('profiles').select('plan, trial_ends_at').eq('id', user.id).single();

  const name = (user.user_metadata?.full_name as string)?.split(' ')[0]
    || user.email?.split('@')[0]
    || 'uživateli';

  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const today = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  const tomorrow = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate() + 1 > new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate() ? 1 : now.getDate() + 1)}`;
  // safer tomorrow
  const tomorrowDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const tomorrowStr = `${tomorrowDate.getFullYear()}-${pad(tomorrowDate.getMonth() + 1)}-${pad(tomorrowDate.getDate())}`;

  const startOfMonth = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-01`;
  const startOfNextMonth = (() => {
    const d = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-01`;
  })();

  // 14 days back for overdue calendar events
  const twoWeeksAgo = (() => {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 14);
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  })();

  const [
    contactsRes,
    dealsRes,
    todayTasksRes,
    overdueTasksRes,
    todayActivitiesRes,
    todayCalendarRes,
    overdueCalendarRes,
    monthDealsRes,
    recentRes,
  ] = await Promise.all([
    supabase.from('contacts').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
    supabase.from('deals').select('hodnota, status').eq('user_id', user.id),
    supabase.from('tasks')
      .select('id, nazev, deadline, priorita, dokonceno')
      .eq('user_id', user.id)
      .eq('dokonceno', false)
      .gte('deadline', today)
      .lt('deadline', tomorrowStr)
      .order('deadline'),
    supabase.from('tasks')
      .select('id, nazev, deadline, priorita, dokonceno')
      .eq('user_id', user.id)
      .eq('dokonceno', false)
      .lt('deadline', today)
      .order('deadline', { ascending: false })
      .limit(5),
    supabase.from('activities')
      .select('id, typ, popis, datum, cas_od, cas_do, misto, contacts(jmeno, prijmeni)')
      .eq('user_id', user.id)
      .gte('datum', today)
      .lt('datum', tomorrowStr)
      .order('datum'),
    supabase.from('calendar_events')
      .select('id, nazev, typ, datum, cas_od, cas_do, popis, contacts(jmeno, prijmeni), deals(nazev)')
      .eq('user_id', user.id)
      .eq('datum', today)
      .order('cas_od'),
    supabase.from('calendar_events')
      .select('id, nazev, typ, datum, cas_od, cas_do, popis, contacts(jmeno, prijmeni), deals(nazev)')
      .eq('user_id', user.id)
      .gte('datum', twoWeeksAgo)
      .lt('datum', today)
      .order('datum', { ascending: false })
      .limit(5),
    supabase.from('deals')
      .select('id, nazev, hodnota, status, datum_uzavreni, pravdepodobnost')
      .eq('user_id', user.id),
    supabase.from('contacts').select('id, jmeno, prijmeni, firma, email, tag, created_at')
      .eq('user_id', user.id).order('created_at', { ascending: false }).limit(5),
  ]);

  const contactsCount = contactsRes.count ?? 0;
  const allDeals = dealsRes.data ?? [];
  const openDeals = allDeals.filter(d => !['vyhrano', 'prohrano'].includes(d.status)).length;
  const monthRevenue = allDeals.filter(d => d.status === 'vyhrano').reduce((s, d) => s + (d.hodnota ?? 0), 0);
  const todayTasksList = todayTasksRes.data ?? [];
  const overdueTasksList = overdueTasksRes.data ?? [];
  const todayActivitiesList = (todayActivitiesRes.data ?? []) as unknown as Array<{
    id: string; typ: string; popis: string | null; datum: string;
    cas_od: string | null; cas_do: string | null; misto: string | null;
    contacts: { jmeno: string; prijmeni: string | null } | null;
  }>;
  const todayCalendarList = (todayCalendarRes.data ?? []) as unknown as Array<{
    id: string; nazev: string; typ: string; datum: string;
    cas_od: string | null; cas_do: string | null; popis: string | null;
    contacts: { jmeno: string; prijmeni: string | null } | null;
    deals: { nazev: string } | null;
  }>;
  const overdueCalendarList = (overdueCalendarRes.data ?? []) as unknown as Array<{
    id: string; nazev: string; typ: string; datum: string;
    cas_od: string | null; cas_do: string | null; popis: string | null;
    contacts: { jmeno: string; prijmeni: string | null } | null;
    deals: { nazev: string } | null;
  }>;
  const recent = recentRes.data ?? [];

  // Monthly deals stats
  const monthDeals = monthDealsRes.data ?? [];
  const wonThisMonth = monthDeals.filter(d =>
    d.status === 'vyhrano' &&
    d.datum_uzavreni >= startOfMonth &&
    d.datum_uzavreni < startOfNextMonth
  );
  const wonThisMonthValue = wonThisMonth.reduce((s, d) => s + (d.hodnota ?? 0), 0);
  const closingThisMonth = monthDeals.filter(d =>
    !['vyhrano', 'prohrano'].includes(d.status) &&
    d.datum_uzavreni >= startOfMonth &&
    d.datum_uzavreni < startOfNextMonth
  );
  const closingThisMonthValue = closingThisMonth.reduce((s, d) => s + (d.hodnota ?? 0), 0);
  const openPipelineValue = monthDeals
    .filter(d => !['vyhrano', 'prohrano'].includes(d.status))
    .reduce((s, d) => s + (d.hodnota ?? 0), 0);
  const lostThisMonth = monthDeals.filter(d =>
    d.status === 'prohrano' &&
    d.datum_uzavreni >= startOfMonth &&
    d.datum_uzavreni < startOfNextMonth
  ).length;

  // Progress: won / (won + closing this month)
  const progressTotal = wonThisMonthValue + closingThisMonthValue;
  const progressPct = progressTotal > 0 ? Math.round((wonThisMonthValue / progressTotal) * 100) : 0;

  const stats = [
    { label: 'Zákazníků', value: contactsCount.toString(), hint: 'celkem evidovaných', accent: '#00BFFF',
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
      href: '/dashboard/contacts' },
    { label: 'Otevřené zakázky', value: openDeals.toString(), hint: 'v pipeline', accent: '#7B2FFF',
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>,
      href: '/dashboard/deals' },
    { label: 'Příjmy (vyhráno)', value: fmtKc(monthRevenue), hint: 'celkem uzavřeno', accent: '#10b981',
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
      href: '/dashboard/deals' },
    { label: 'Úkoly dnes', value: todayTasksList.length.toString(), hint: 'ke splnění dnes', accent: '#f59e0b',
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>,
      href: '/dashboard/tasks' },
  ];

  const monthName = now.toLocaleDateString('cs-CZ', { month: 'long' });

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      <GuidedTour userName={name} />

      <TrialBanner plan={profile?.plan ?? null} trialEndsAt={profile?.trial_ends_at ?? null} />

      {/* Welcome */}
      <div id="dashboard-welcome" className="flex items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white mb-1">
            Vítej, <span style={{ background: 'linear-gradient(135deg, #00BFFF, #7B2FFF)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{name}</span>!
          </h1>
          <p className="text-sm" style={{ color: 'rgba(237,237,237,0.5)' }}>
            {now.toLocaleDateString('cs-CZ', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <TourButton />
      </div>

      {/* Stat cards */}
      <div id="stat-cards" className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((s) => (
          <Link key={s.label} href={s.href}
            className="rounded-2xl p-5 transition-all"
            style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-medium" style={{ color: 'rgba(237,237,237,0.5)' }}>{s.label}</span>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: s.accent + '18', color: s.accent }}>{s.icon}</div>
            </div>
            <p className="text-2xl font-black text-white mb-0.5">{s.value}</p>
            <p className="text-xs" style={{ color: s.accent + 'bb' }}>{s.hint}</p>
          </Link>
        ))}
      </div>

      {/* Today + Monthly report */}
      <div className="grid lg:grid-cols-[1fr_300px] gap-6 mb-6">

        {/* Dnešní program */}
        <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-center gap-2">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#00BFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              <p className="text-sm font-bold text-white">Dnešní program</p>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/dashboard/tasks" className="text-xs font-semibold" style={{ color: 'rgba(237,237,237,0.4)' }}>Úkoly →</Link>
              <Link href="/dashboard/activities" className="text-xs font-semibold" style={{ color: 'rgba(237,237,237,0.4)' }}>Aktivity →</Link>
            </div>
          </div>

          {todayTasksList.length === 0 && todayActivitiesList.length === 0 && todayCalendarList.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <p className="text-sm" style={{ color: 'rgba(237,237,237,0.35)' }}>Na dnes nic naplánováno.</p>
              <div className="flex items-center justify-center gap-4 mt-3">
                <Link href="/dashboard/tasks" className="text-xs font-semibold" style={{ color: '#f59e0b' }}>+ Přidat úkol</Link>
                <Link href="/dashboard/activities" className="text-xs font-semibold" style={{ color: '#00BFFF' }}>+ Přidat aktivitu</Link>
              </div>
            </div>
          ) : (
            <div>
              {/* Tasks today */}
              {todayTasksList.map((task) => {
                const pColor = PRIORITY_COLORS[task.priorita] ?? '#6b7280';
                const timeStr = task.deadline?.length >= 16 ? task.deadline.slice(11, 16) : null;
                return (
                  <Link key={task.id} href="/dashboard/tasks"
                    className="flex items-center gap-4 px-5 py-3.5 transition-all group"
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                  >
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: '#f59e0b18', color: '#f59e0b' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white group-hover:text-[#f59e0b] transition-colors truncate">{task.nazev}</p>
                      <p className="text-xs" style={{ color: 'rgba(237,237,237,0.4)' }}>Úkol{timeStr ? ` · ${timeStr}` : ''}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className="w-2 h-2 rounded-full" style={{ background: pColor }} title={task.priorita} />
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ color: 'rgba(237,237,237,0.2)' }}><polyline points="9 18 15 12 9 6"/></svg>
                    </div>
                  </Link>
                );
              })}

              {/* Activities today */}
              {todayActivitiesList.map((act) => {
                const meta = ACTIVITY_LABELS[act.typ] ?? { label: act.typ, color: '#6b7280' };
                const contact = act.contacts ? `${act.contacts.jmeno}${act.contacts.prijmeni ? ' ' + act.contacts.prijmeni : ''}` : null;
                const timeStr = act.cas_od ? (act.cas_do ? `${act.cas_od} – ${act.cas_do}` : act.cas_od) : null;
                return (
                  <Link key={act.id} href="/dashboard/activities"
                    className="flex items-center gap-4 px-5 py-3.5 transition-all group"
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                  >
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: meta.color + '18', color: meta.color }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white group-hover:underline truncate">
                        {meta.label}{contact ? ` · ${contact}` : ''}{act.popis ? ` — ${act.popis}` : ''}
                      </p>
                      <p className="text-xs" style={{ color: 'rgba(237,237,237,0.4)' }}>
                        {timeStr ?? 'Aktivita'}{act.misto ? ` · ${act.misto}` : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs font-semibold px-1.5 py-0.5 rounded-md" style={{ background: meta.color + '18', color: meta.color }}>{meta.label}</span>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ color: 'rgba(237,237,237,0.2)' }}><polyline points="9 18 15 12 9 6"/></svg>
                    </div>
                  </Link>
                );
              })}

              {/* Calendar events today */}
              {todayCalendarList.map((ev) => {
                const calMeta = TYPES.find(t => t.id === ev.typ) ?? { label: ev.typ, color: '#00BFFF' };
                const contact = ev.contacts ? `${ev.contacts.jmeno}${ev.contacts.prijmeni ? ' ' + ev.contacts.prijmeni : ''}` : null;
                const timeStr = ev.cas_od ? (ev.cas_do ? `${ev.cas_od} – ${ev.cas_do}` : ev.cas_od) : null;
                return (
                  <Link key={ev.id} href="/dashboard/calendar"
                    className="flex items-center gap-4 px-5 py-3.5 transition-all group"
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                  >
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: calMeta.color + '18', color: calMeta.color }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white group-hover:underline truncate">
                        {ev.nazev}{contact ? ` · ${contact}` : ''}{ev.deals ? ` · ${ev.deals.nazev}` : ''}
                      </p>
                      <p className="text-xs" style={{ color: 'rgba(237,237,237,0.4)' }}>
                        {calMeta.label}{timeStr ? ` · ${timeStr}` : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs font-semibold px-1.5 py-0.5 rounded-md" style={{ background: calMeta.color + '18', color: calMeta.color }}>{calMeta.label}</span>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ color: 'rgba(237,237,237,0.2)' }}><polyline points="9 18 15 12 9 6"/></svg>
                    </div>
                  </Link>
                );
              })}

              {/* Overdue section */}
              {(overdueTasksList.length > 0 || overdueCalendarList.length > 0) && (
                <div style={{ borderTop: '1px solid rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.03)' }}>
                  <div className="px-5 py-2 flex items-center gap-2">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    <span className="text-xs font-bold" style={{ color: '#ef4444' }}>Po termínu</span>
                  </div>
                  {overdueTasksList.map((task) => (
                    <Link key={task.id} href="/dashboard/tasks"
                      className="flex items-center gap-4 px-5 py-3 transition-all group"
                      style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}
                    >
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: 'rgba(239,68,68,0.12)', color: '#f87171' }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold group-hover:underline truncate" style={{ color: '#f87171' }}>{task.nazev}</p>
                        <p className="text-xs" style={{ color: 'rgba(239,68,68,0.5)' }}>
                          Úkol · deadline {task.deadline ? new Date(task.deadline).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'short' }) : '–'}
                        </p>
                      </div>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ color: 'rgba(239,68,68,0.3)' }}><polyline points="9 18 15 12 9 6"/></svg>
                    </Link>
                  ))}
                  {overdueCalendarList.map((ev) => {
                    const calMeta = TYPES.find(t => t.id === ev.typ) ?? { label: ev.typ, color: '#ef4444' };
                    return (
                      <Link key={ev.id} href="/dashboard/calendar"
                        className="flex items-center gap-4 px-5 py-3 transition-all group"
                        style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}
                      >
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ background: 'rgba(239,68,68,0.12)', color: '#f87171' }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold group-hover:underline truncate" style={{ color: '#f87171' }}>{ev.nazev}</p>
                          <p className="text-xs" style={{ color: 'rgba(239,68,68,0.5)' }}>
                            {calMeta.label} · {new Date(ev.datum + 'T12:00:00').toLocaleDateString('cs-CZ', { day: 'numeric', month: 'short' })}{ev.cas_od ? ` · ${ev.cas_od}` : ''}
                          </p>
                        </div>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ color: 'rgba(239,68,68,0.3)' }}><polyline points="9 18 15 12 9 6"/></svg>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Měsíční report */}
        <div className="rounded-2xl overflow-hidden flex flex-col" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-center gap-2">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
              </svg>
              <p className="text-sm font-bold text-white">Zakázky — {monthName}</p>
            </div>
            <Link href="/dashboard/reports" className="text-xs font-semibold" style={{ color: 'rgba(237,237,237,0.4)' }}>Výkazy →</Link>
          </div>

          <div className="p-5 flex flex-col gap-4 flex-1">
            {/* Won this month */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium mb-0.5" style={{ color: 'rgba(237,237,237,0.5)' }}>Vyhráno tento měsíc</p>
                <p className="text-xl font-black" style={{ color: '#10b981' }}>{fmtKc(wonThisMonthValue)}</p>
              </div>
              <span className="text-xs font-bold px-2 py-1 rounded-lg" style={{ background: '#10b98118', color: '#10b981' }}>
                {wonThisMonth.length} zak.
              </span>
            </div>

            {/* Divider */}
            <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)' }} />

            {/* Closing this month */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium mb-0.5" style={{ color: 'rgba(237,237,237,0.5)' }}>Plánuje se uzavřít</p>
                <p className="text-xl font-black text-white">{fmtKc(closingThisMonthValue)}</p>
              </div>
              <span className="text-xs font-bold px-2 py-1 rounded-lg" style={{ background: 'rgba(0,191,255,0.1)', color: '#00BFFF' }}>
                {closingThisMonth.length} zak.
              </span>
            </div>

            {/* Progress bar */}
            {progressTotal > 0 && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs" style={{ color: 'rgba(237,237,237,0.4)' }}>Plnění plánu měsíce</span>
                  <span className="text-xs font-bold" style={{ color: progressPct >= 70 ? '#10b981' : progressPct >= 40 ? '#f59e0b' : '#ef4444' }}>{progressPct} %</span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                  <div className="h-full rounded-full transition-all" style={{
                    width: `${progressPct}%`,
                    background: progressPct >= 70 ? '#10b981' : progressPct >= 40 ? '#f59e0b' : '#ef4444',
                  }} />
                </div>
              </div>
            )}

            {/* Divider */}
            <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)' }} />

            {/* Open pipeline */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium mb-0.5" style={{ color: 'rgba(237,237,237,0.5)' }}>Celá pipeline</p>
                <p className="text-base font-black text-white">{fmtKc(openPipelineValue)}</p>
              </div>
              {lostThisMonth > 0 && (
                <span className="text-xs font-semibold px-2 py-1 rounded-lg" style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171' }}>
                  {lostThisMonth}× prohráno
                </span>
              )}
            </div>

            <Link href="/dashboard/deals"
              className="mt-auto flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(237,237,237,0.6)' }}>
              Otevřít pipeline
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid lg:grid-cols-[1fr_280px] gap-6">
        {/* Recent contacts */}
        <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <p className="text-sm font-bold text-white">Poslední zákazníci</p>
            <Link href="/dashboard/contacts" className="text-xs font-semibold" style={{ color: '#00BFFF' }}>Zobrazit vše →</Link>
          </div>
          {recent.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <p className="text-sm" style={{ color: 'rgba(237,237,237,0.35)' }}>Zatím žádní zákazníci.</p>
              <Link href="/dashboard/contacts/new" className="text-sm font-semibold mt-2 inline-block" style={{ color: '#00BFFF' }}>
                Přidat prvního →
              </Link>
            </div>
          ) : (
            <div>
              {recent.map((c) => {
                const initials = `${c.jmeno?.[0] ?? ''}${c.prijmeni?.[0] ?? ''}`.toUpperCase() || '?';
                const tagColor = tagColors[c.tag] ?? '#00BFFF';
                return (
                  <Link key={c.id} href={`/dashboard/contacts/${c.id}`}
                    className="flex items-center gap-4 px-5 py-3.5 transition-all"
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                  >
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                      style={{ background: tagColor + '20', color: tagColor }}>{initials}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white">{c.jmeno} {c.prijmeni}</p>
                      <p className="text-xs truncate" style={{ color: 'rgba(237,237,237,0.45)' }}>{c.firma || c.email || '–'}</p>
                    </div>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
                      style={{ background: tagColor + '18', color: tagColor }}>{c.tag}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div className="flex flex-col gap-4">
          <div data-tour="rychle-akce" className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <p className="text-sm font-bold text-white mb-4">Rychlé akce</p>
            <div className="flex flex-col gap-2">
              <Link id="btn-add-customer" href="/dashboard/contacts/new"
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all"
                style={{ background: 'rgba(0,191,255,0.1)', border: '1px solid rgba(0,191,255,0.25)', color: '#00BFFF' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                  <line x1="19" y1="5" x2="19" y2="11"/><line x1="16" y1="8" x2="22" y2="8"/>
                </svg>
                Přidat zákazníka
              </Link>
              <Link href="/dashboard/deals"
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all"
                style={{ background: 'rgba(123,47,255,0.1)', border: '1px solid rgba(123,47,255,0.25)', color: '#7B2FFF' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
                  <line x1="12" y1="12" x2="12" y2="16"/><line x1="10" y1="14" x2="14" y2="14"/>
                </svg>
                Přidat zakázku
              </Link>
              <Link href="/dashboard/tasks"
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all"
                style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)', color: '#f59e0b' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                Přidat úkol
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
