'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';

// ─── Types ────────────────────────────────────────────────────────────────────

type Stage = { id: string; nazev: string; barva: string };

type Deal = {
  id: string;
  nazev: string;
  hodnota: number;
  pravdepodobnost: number;
  stage_id: string | null;
  datum_uzavreni: string | null;
  contacts?: { jmeno: string; prijmeni: string | null } | null;
};

type Lead = {
  id: string;
  zdroj: string;
  konvertovan: boolean;
  lead_status_id: string | null;
  created_at: string;
};

type Activity = {
  id: string;
  typ: string;
  datum: string;
};

type Goal = {
  id?: string;
  rok: number;
  typ: 'mesicni' | 'pololetni' | 'rocni';
  obdobi: number;
  cil_castka: number;
};

type Tab = 'mesicni' | 'pololetni' | 'rocni';
type TeamMember = { id: string; name: string; email: string; role: string; isOwner: boolean };
type Section = 'prijmy' | 'leady' | 'aktivita' | 'exporty';

// ─── Constants ────────────────────────────────────────────────────────────────

const SOURCES = [
  { id: 'doporuceni', label: 'Doporučení', color: '#10b981' },
  { id: 'web', label: 'Web', color: '#3B82F6' },
  { id: 'telefon', label: 'Telefon', color: '#f59e0b' },
  { id: 'email', label: 'Email', color: '#7B2FFF' },
  { id: 'socialni_site', label: 'Sociální sítě', color: '#00BFFF' },
  { id: 'jine', label: 'Jiné', color: '#6b7280' },
];

const ACT_TYPES = [
  { id: 'schuzka', label: 'Schůzka', color: '#00BFFF' },
  { id: 'telefonat', label: 'Telefonát', color: '#10b981' },
  { id: 'email', label: 'Email', color: '#7B2FFF' },
  { id: 'poznamka', label: 'Poznámka', color: '#6b7280' },
  { id: 'demo', label: 'Prezentace', color: '#f97316' },
  { id: 'followup', label: 'Follow-up', color: '#f59e0b' },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

const WON_KEYWORDS = ['vyhráno', 'vyhrano', 'uzavřeno', 'uzavreno', 'zaplaceno', 'dokončeno', 'dokonceno', 'won', 'closed'];

function isWonStage(stage: Stage | undefined): boolean {
  if (!stage) return false;
  const n = stage.nazev.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return WON_KEYWORDS.some(k => {
    const kn = k.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return n.includes(kn);
  });
}

function fmtKc(v: number) {
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(1).replace('.0', '') + ' M Kč';
  if (v >= 1_000) return Math.round(v / 1000) + ' tis. Kč';
  return Math.round(v).toLocaleString('cs-CZ') + ' Kč';
}

function fmtKcFull(v: number) {
  return Math.round(v).toLocaleString('cs-CZ') + ' Kč';
}

const MONTH_NAMES = ['Led', 'Úno', 'Bře', 'Dub', 'Kvě', 'Čvn', 'Čvc', 'Srp', 'Zář', 'Říj', 'Lis', 'Pro'];
const MONTH_NAMES_FULL = ['Leden', 'Únor', 'Březen', 'Duben', 'Květen', 'Červen', 'Červenec', 'Srpen', 'Září', 'Říjen', 'Listopad', 'Prosinec'];

function pctColor(pct: number) {
  if (pct >= 100) return '#22C55E';
  if (pct >= 80) return '#f59e0b';
  return '#ef4444';
}

const inputStyle = {
  background: 'transparent', border: 'none', outline: 'none',
  color: '#ededed', fontSize: '13px', width: '100%', textAlign: 'right' as const,
};

// ─── CSV helper ───────────────────────────────────────────────────────────────

function downloadCSV(filename: string, headers: string[], rows: string[][]) {
  const lines = [headers, ...rows].map(r =>
    r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')
  );
  const csv = '\uFEFF' + lines.join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ─── Circular Progress ────────────────────────────────────────────────────────

function CircularProgress({ pct, size = 180 }: { pct: number; size?: number }) {
  const r = (size - 20) / 2;
  const circ = 2 * Math.PI * r;
  const capped = Math.min(pct, 100);
  const color = pct >= 100 ? '#22C55E' : pct >= 80 ? '#f59e0b' : '#00BFFF';
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={14} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth={14}
        strokeDasharray={circ}
        strokeDashoffset={circ * (1 - capped / 100)}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.6s ease' }}
      />
      <text
        x={size / 2} y={size / 2 + 2}
        textAnchor="middle" dominantBaseline="middle"
        fill={color} fontSize={28} fontWeight={900}
        style={{ transform: `rotate(90deg) translateX(0)`, transformOrigin: `${size / 2}px ${size / 2}px`, fontFamily: 'inherit' }}
      >
        {Math.round(pct)} %
      </text>
    </svg>
  );
}

// ─── Tooltips ─────────────────────────────────────────────────────────────────

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px 14px', fontSize: 12 }}>
      <p style={{ color: 'rgba(237,237,237,0.6)', marginBottom: 4 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color ?? '#ededed', fontWeight: 700 }}>{p.name}: {fmtKcFull(p.value)}</p>
      ))}
    </div>
  );
}

function CountTooltip({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px 14px', fontSize: 12 }}>
      <p style={{ color: 'rgba(237,237,237,0.6)', marginBottom: 4 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color ?? '#ededed', fontWeight: 700 }}>{p.name}: {p.value}</p>
      ))}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ReportsPage() {
  const supabase = createClient();
  const now = new Date();
  const thisYear = now.getFullYear();
  const thisMonth = now.getMonth() + 1;
  const thisHalf = thisMonth <= 6 ? 1 : 2;

  const [section, setSection] = useState<Section>('prijmy');
  const [stages, setStages] = useState<Stage[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('mesicni');
  const [savingGoal, setSavingGoal] = useState<string | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [memberDeals, setMemberDeals] = useState<Deal[] | null>(null);
  const [memberLeads, setMemberLeads] = useState<Lead[] | null>(null);
  const [memberActivities, setMemberActivities] = useState<Activity[] | null>(null);
  const [loadingMember, setLoadingMember] = useState(false);
  const [goalDrafts, setGoalDrafts] = useState<Record<string, string>>({});
  const [exporting, setExporting] = useState<string | null>(null);

  const load = useCallback(async () => {
    // Zjisti zda je přihlášený uživatel člen (ne admin)
    const membershipRes = await fetch('/api/team/my-membership');
    const { isMember } = await membershipRes.json();

    if (isMember) {
      // Člen: načti kombinovaná data (vlastní + přiřazená adminem) přes server endpoint
      const [myDealsRes, { data: goalsData }] = await Promise.all([
        fetch('/api/team/my-deals'),
        supabase.from('revenue_goals').select('id, rok, typ, obdobi, cil_castka').order('rok').order('obdobi'),
      ]);
      const myData = await myDealsRes.json();
      setStages(myData.stages ?? []);
      setDeals((myData.deals as unknown as Deal[]) ?? []);
      setLeads(myData.leads ?? []);
      setActivities(myData.activities ?? []);
      setGoals(goalsData ?? []);
    } else {
      // Admin: standardní load vlastních dat
      const [{ data: stagesData }, { data: dealsData }, { data: goalsData }, { data: leadsData }, { data: activitiesData }] = await Promise.all([
        supabase.from('pipeline_stages').select('id, nazev, barva').order('poradi'),
        supabase.from('deals').select('id, nazev, hodnota, pravdepodobnost, stage_id, datum_uzavreni, contacts(jmeno, prijmeni)').is('assigned_to', null),
        supabase.from('revenue_goals').select('id, rok, typ, obdobi, cil_castka').order('rok').order('obdobi'),
        supabase.from('leads').select('id, zdroj, konvertovan, lead_status_id, created_at'),
        supabase.from('activities').select('id, typ, datum').order('datum', { ascending: false }),
      ]);
      setStages(stagesData ?? []);
      setDeals((dealsData as unknown as Deal[]) ?? []);
      setGoals(goalsData ?? []);
      setLeads(leadsData ?? []);
      setActivities(activitiesData ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    fetch('/api/team/members').then(r => r.json()).then(d => setTeamMembers(d.members ?? []));
  }, [load]);

  const handleMemberSwitch = async (memberId: string | null) => {
    setSelectedMemberId(memberId);
    if (!memberId) {
      setMemberDeals(null);
      setMemberLeads(null);
      setMemberActivities(null);
      return;
    }
    setLoadingMember(true);
    const res = await fetch(`/api/team/member-data?user_id=${memberId}`);
    const data = await res.json();
    setMemberDeals((data.deals as Deal[]) ?? []);
    setMemberLeads((data.leads as Lead[]) ?? []);
    setMemberActivities((data.activities as Activity[]) ?? []);
    setLoadingMember(false);
  };

  const activeDeals = memberDeals ?? deals;
  const activeLeads = memberLeads ?? leads;
  const activeActivities = memberActivities ?? activities;

  // ── Deal derived data ──────────────────────────────────────────────────────

  const wonStageIds = useMemo(
    () => new Set(stages.filter(isWonStage).map(s => s.id)),
    [stages]
  );

  const lostStageIds = useMemo(
    () => new Set(stages.filter(s => /prohr/i.test(s.nazev)).map(s => s.id)),
    [stages]
  );

  const wonDeals = useMemo(
    () => activeDeals.filter(d => d.stage_id && wonStageIds.has(d.stage_id)),
    [activeDeals, wonStageIds]
  );

  const lostDeals = useMemo(
    () => activeDeals.filter(d => d.stage_id && lostStageIds.has(d.stage_id)),
    [activeDeals, lostStageIds]
  );

  const revenueByMonth = useMemo(() => {
    const map: Record<string, number> = {};
    wonDeals.forEach(d => {
      // Pokud není datum uzavření, počítáme příjem do aktuálního měsíce
      const dt = d.datum_uzavreni ? new Date(d.datum_uzavreni) : new Date();
      const key = `${dt.getFullYear()}-${dt.getMonth() + 1}`;
      map[key] = (map[key] ?? 0) + (d.hodnota ?? 0);
    });
    return map;
  }, [wonDeals]);

  function getRevenue(rok: number, mesic: number) {
    return revenueByMonth[`${rok}-${mesic}`] ?? 0;
  }
  function getRevenueHalf(rok: number, half: number) {
    const months = half === 1 ? [1, 2, 3, 4, 5, 6] : [7, 8, 9, 10, 11, 12];
    return months.reduce((s, m) => s + getRevenue(rok, m), 0);
  }
  function getRevenueYear(rok: number) {
    return Array.from({ length: 12 }, (_, i) => getRevenue(rok, i + 1)).reduce((a, b) => a + b, 0);
  }

  const revenueThisMonth = getRevenue(thisYear, thisMonth);
  const revenueThisHalf = getRevenueHalf(thisYear, thisHalf);
  const revenueThisYear = getRevenueYear(thisYear);
  const decidedDeals = wonDeals.length + lostDeals.length;
  const winRate = decidedDeals > 0 ? Math.round((wonDeals.length / decidedDeals) * 100) : 0;

  function getGoal(typ: 'mesicni' | 'pololetni' | 'rocni', rok: number, obdobi: number): number {
    return goals.find(g => g.typ === typ && g.rok === rok && g.obdobi === obdobi)?.cil_castka ?? 0;
  }

  const goalKey = (typ: string, rok: number, obdobi: number) => `${typ}-${rok}-${obdobi}`;

  const getDraft = (typ: string, rok: number, obdobi: number) => {
    const key = goalKey(typ, rok, obdobi);
    return goalDrafts[key] ?? String(getGoal(typ as 'mesicni' | 'pololetni' | 'rocni', rok, obdobi) || '');
  };

  const setDraft = (typ: string, rok: number, obdobi: number, val: string) => {
    setGoalDrafts(p => ({ ...p, [goalKey(typ, rok, obdobi)]: val }));
  };

  const saveGoal = async (typ: 'mesicni' | 'pololetni' | 'rocni', rok: number, obdobi: number) => {
    const key = goalKey(typ, rok, obdobi);
    const raw = goalDrafts[key];
    if (raw === undefined) return;
    const val = parseFloat(raw) || 0;
    setSavingGoal(key);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const existing = goals.find(g => g.typ === typ && g.rok === rok && g.obdobi === obdobi);
    if (existing?.id) {
      await supabase.from('revenue_goals').update({ cil_castka: val }).eq('id', existing.id);
      setGoals(p => p.map(g => g.id === existing.id ? { ...g, cil_castka: val } : g));
    } else {
      const { data } = await supabase.from('revenue_goals')
        .upsert({ user_id: user.id, rok, typ, obdobi, cil_castka: val }, { onConflict: 'user_id,rok,typ,obdobi' })
        .select().single();
      if (data) setGoals(p => [...p.filter(g => !(g.typ === typ && g.rok === rok && g.obdobi === obdobi)), data]);
    }
    setGoalDrafts(p => { const n = { ...p }; delete n[key]; return n; });
    setSavingGoal(null);
  };

  const monthlyData = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const d = new Date(thisYear, thisMonth - 12 + i);
      const m = d.getMonth() + 1;
      const y = d.getFullYear();
      const actual = getRevenue(y, m);
      const goal = getGoal('mesicni', y, m);
      return { label: `${MONTH_NAMES[m - 1]} ${y !== thisYear ? "'" + String(y).slice(2) : ''}`.trim(), m, y, actual, goal };
    });
  }, [goals, revenueByMonth, thisYear, thisMonth]);

  const halfData = useMemo(() => [
    { label: `H1 ${thisYear - 1}`, actual: getRevenueHalf(thisYear - 1, 1), goal: getGoal('pololetni', thisYear - 1, 1) },
    { label: `H2 ${thisYear - 1}`, actual: getRevenueHalf(thisYear - 1, 2), goal: getGoal('pololetni', thisYear - 1, 2) },
    { label: `H1 ${thisYear}`, actual: getRevenueHalf(thisYear, 1), goal: getGoal('pololetni', thisYear, 1) },
    { label: `H2 ${thisYear}`, actual: getRevenueHalf(thisYear, 2), goal: getGoal('pololetni', thisYear, 2) },
  ], [goals, revenueByMonth, thisYear]);

  const yearlyRows = useMemo(() => [thisYear - 2, thisYear - 1, thisYear].map(y => ({
    rok: y,
    actual: getRevenueYear(y),
    goal: getGoal('rocni', y, y),
  })), [goals, revenueByMonth, thisYear]);

  const yearGoal = getGoal('rocni', thisYear, thisYear);
  const yearActual = getRevenueYear(thisYear);
  const yearPct = yearGoal > 0 ? (yearActual / yearGoal) * 100 : 0;
  const monthsLeft = 12 - thisMonth;
  const remaining = Math.max(yearGoal - yearActual, 0);
  const neededPerMonth = monthsLeft > 0 ? remaining / monthsLeft : remaining;

  // Otevřené zakázky = vše kromě vyhráno a prohráno
  const openDeals = activeDeals.filter(d => !wonStageIds.has(d.stage_id ?? '') && !lostStageIds.has(d.stage_id ?? ''));
  const openTotal = openDeals.reduce((s, d) => s + d.hodnota, 0);
  const weightedTotal = openDeals.reduce((s, d) => s + d.hodnota * (d.pravdepodobnost ?? 50) / 100, 0);
  const closingThisMonth = openDeals.filter(d => {
    if (!d.datum_uzavreni) return false;
    const dt = new Date(d.datum_uzavreni);
    return dt.getFullYear() === thisYear && dt.getMonth() + 1 === thisMonth;
  }).reduce((s, d) => s + d.hodnota, 0);

  const monthGoal = getGoal('mesicni', thisYear, thisMonth);
  const outlookMax = Math.max(monthGoal, revenueThisMonth + closingThisMonth, 1);

  const pipelineData = useMemo(() => {
    return stages.map(s => {
      const stageDeals = activeDeals.filter(d => d.stage_id === s.id);
      return {
        name: s.nazev,
        count: stageDeals.length,
        hodnota: stageDeals.reduce((a, d) => a + d.hodnota, 0),
        color: s.barva,
      };
    }).filter(s => s.count > 0);
  }, [deals, stages]);

  const top5 = useMemo(() =>
    [...wonDeals]
      .sort((a, b) => b.hodnota - a.hodnota)
      .slice(0, 5),
    [wonDeals]
  );

  // ── Lead derived data ──────────────────────────────────────────────────────

  const totalLeads = activeLeads.length;
  const convertedLeads = activeLeads.filter(l => l.konvertovan).length;
  const conversionRate = totalLeads > 0 ? Math.round((convertedLeads / totalLeads) * 100) : 0;
  const newLeadsThisMonth = activeLeads.filter(l => {
    if (!l.created_at) return false;
    const d = new Date(l.created_at);
    return d.getFullYear() === thisYear && d.getMonth() + 1 === thisMonth;
  }).length;

  const leadsBySource = useMemo(() => {
    return SOURCES.map(s => {
      const sl = activeLeads.filter(l => l.zdroj === s.id);
      return { name: s.label, color: s.color, celkem: sl.length, konvertovano: sl.filter(l => l.konvertovan).length };
    }).filter(s => s.celkem > 0);
  }, [activeLeads]);

  const leadMonthlyTrend = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(thisYear, thisMonth - 6 + i);
      const m = d.getMonth() + 1;
      const y = d.getFullYear();
      const ml = activeLeads.filter(l => {
        if (!l.created_at) return false;
        const ld = new Date(l.created_at);
        return ld.getFullYear() === y && ld.getMonth() + 1 === m;
      });
      return { label: MONTH_NAMES[m - 1], celkem: ml.length, konvertovano: ml.filter(l => l.konvertovan).length };
    });
  }, [activeLeads, thisYear, thisMonth]);

  // ── Activity derived data ─────────────────────────────────────────────────

  const thirtyDaysAgo = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d;
  }, []);

  const recentActivities = useMemo(
    () => activeActivities.filter(a => a.datum && new Date(a.datum) >= thirtyDaysAgo),
    [activeActivities, thirtyDaysAgo]
  );

  const activityByType = useMemo(() => {
    return ACT_TYPES.map(t => ({
      ...t,
      count: recentActivities.filter(a => a.typ === t.id).length,
    })).filter(t => t.count > 0);
  }, [recentActivities]);

  const activityMonthlyData = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(thisYear, thisMonth - 6 + i);
      const m = d.getMonth() + 1;
      const y = d.getFullYear();
      const ma = activeActivities.filter(a => {
        if (!a.datum) return false;
        const ad = new Date(a.datum);
        return ad.getFullYear() === y && ad.getMonth() + 1 === m;
      });
      return {
        label: MONTH_NAMES[m - 1],
        Schůzky: ma.filter(a => a.typ === 'schuzka').length,
        Telefonáty: ma.filter(a => a.typ === 'telefonat').length,
        Emaily: ma.filter(a => a.typ === 'email').length,
        Ostatní: ma.filter(a => !['schuzka', 'telefonat', 'email'].includes(a.typ)).length,
      };
    });
  }, [activeActivities, thisYear, thisMonth]);

  // ── Export handlers ───────────────────────────────────────────────────────

  const handleExport = async (type: 'leady' | 'zakaznici' | 'zakazky' | 'aktivity') => {
    setExporting(type);
    try {
      if (type === 'leady') {
        const { data } = await supabase.from('leads').select('jmeno, prijmeni, email, telefon, firma, zdroj, konvertovan, skore, poznamky, created_at');
        if (data) downloadCSV('leady.csv',
          ['Jméno', 'Příjmení', 'Email', 'Telefon', 'Firma', 'Zdroj', 'Konvertován', 'Skóre', 'Poznámky', 'Přidán'],
          (data as any[]).map(l => [l.jmeno, l.prijmeni ?? '', l.email ?? '', l.telefon ?? '', l.firma ?? '',
            SOURCES.find(s => s.id === l.zdroj)?.label ?? l.zdroj,
            l.konvertovan ? 'Ano' : 'Ne', String(l.skore ?? ''), l.poznamky ?? '',
            l.created_at ? new Date(l.created_at).toLocaleDateString('cs-CZ') : ''])
        );
      } else if (type === 'zakaznici') {
        const { data } = await supabase.from('contacts').select('jmeno, prijmeni, email, telefon, firma, created_at');
        if (data) downloadCSV('zakaznici.csv',
          ['Jméno', 'Příjmení', 'Email', 'Telefon', 'Firma', 'Přidán'],
          (data as any[]).map(c => [c.jmeno, c.prijmeni ?? '', c.email ?? '', c.telefon ?? '', c.firma ?? '',
            c.created_at ? new Date(c.created_at).toLocaleDateString('cs-CZ') : ''])
        );
      } else if (type === 'zakazky') {
        // Exportujeme z načteného stavu — zahrnuje i zakázky přiřazené adminem (správné pro členy i adminy)
        const stageNameMap = Object.fromEntries(stages.map(s => [s.id, s.nazev]));
        downloadCSV('zakazky.csv',
          ['Název', 'Zákazník', 'Fáze', 'Hodnota (Kč)', 'Pravděpodobnost (%)', 'Datum uzavření'],
          activeDeals.map(d => {
            const contact = d.contacts as { jmeno?: string; prijmeni?: string | null } | null;
            return [
              d.nazev ?? '',
              contact ? `${contact.jmeno ?? ''}${contact.prijmeni ? ' ' + contact.prijmeni : ''}`.trim() : '',
              stageNameMap[d.stage_id ?? ''] ?? '',
              String(Math.round(d.hodnota ?? 0)),
              String(d.pravdepodobnost ?? ''),
              d.datum_uzavreni ? new Date(d.datum_uzavreni).toLocaleDateString('cs-CZ') : '',
            ];
          })
        );
      } else if (type === 'aktivity') {
        const { data } = await supabase.from('activities').select('typ, popis, datum, misto, created_at, contacts(jmeno, prijmeni), deals(nazev)');
        if (data) downloadCSV('aktivity.csv',
          ['Typ', 'Popis', 'Datum', 'Místo', 'Zákazník', 'Zakázka', 'Přidáno'],
          (data as any[]).map(a => [
            ACT_TYPES.find(t => t.id === a.typ)?.label ?? a.typ,
            a.popis ?? '',
            a.datum ? new Date(a.datum).toLocaleDateString('cs-CZ') : '',
            a.misto ?? '',
            a.contacts ? `${a.contacts.jmeno}${a.contacts.prijmeni ? ' ' + a.contacts.prijmeni : ''}` : '',
            a.deals?.nazev ?? '',
            a.created_at ? new Date(a.created_at).toLocaleDateString('cs-CZ') : '',
          ])
        );
      }
    } finally {
      setExporting(null);
    }
  };

  // ─── UI styles ────────────────────────────────────────────────────────────

  const cardStyle = {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 16,
    padding: '20px 24px',
  };

  const tabBtnStyle = (active: boolean) => ({
    padding: '8px 18px',
    borderRadius: 10,
    fontSize: 13,
    fontWeight: 700,
    cursor: 'pointer',
    background: active ? 'rgba(0,191,255,0.12)' : 'transparent',
    color: active ? '#00BFFF' : 'rgba(237,237,237,0.45)',
    border: active ? '1px solid rgba(0,191,255,0.3)' : '1px solid transparent',
    transition: 'all 0.15s',
  });

  const sectionTabStyle = (active: boolean) => ({
    padding: '10px 22px',
    borderRadius: 12,
    fontSize: 14,
    fontWeight: 700,
    cursor: 'pointer',
    background: active ? 'rgba(0,191,255,0.12)' : 'rgba(255,255,255,0.04)',
    color: active ? '#00BFFF' : 'rgba(237,237,237,0.5)',
    border: active ? '1px solid rgba(0,191,255,0.3)' : '1px solid rgba(255,255,255,0.07)',
    transition: 'all 0.15s',
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full" style={{ color: 'rgba(237,237,237,0.35)' }}>
        Načítám…
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h1 className="text-2xl font-black text-white">Reporting</h1>
          <p className="text-sm mt-0.5" style={{ color: 'rgba(237,237,237,0.45)' }}>
            {section === 'prijmy' ? 'Přehled příjmů, plnění cílů a výhled pipeline' :
             section === 'leady' ? 'Konverze a zdroje leadů' :
             section === 'aktivita' ? 'Přehled aktivit týmu' :
             'Export dat do CSV'}
          </p>
        </div>
        {teamMembers.length > 1 && section !== 'exporty' && (
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => handleMemberSwitch(null)}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
              style={{
                background: selectedMemberId === null ? 'rgba(0,191,255,0.15)' : 'rgba(255,255,255,0.05)',
                border: `1px solid ${selectedMemberId === null ? 'rgba(0,191,255,0.4)' : 'rgba(255,255,255,0.1)'}`,
                color: selectedMemberId === null ? '#00BFFF' : 'rgba(237,237,237,0.5)',
              }}
            >
              Moje data
            </button>
            {teamMembers.filter(m => !m.isOwner).map(m => (
              <button
                key={m.id}
                onClick={() => handleMemberSwitch(m.id)}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
                style={{
                  background: selectedMemberId === m.id ? 'rgba(123,47,255,0.15)' : 'rgba(255,255,255,0.05)',
                  border: `1px solid ${selectedMemberId === m.id ? 'rgba(123,47,255,0.4)' : 'rgba(255,255,255,0.1)'}`,
                  color: selectedMemberId === m.id ? '#7B2FFF' : 'rgba(237,237,237,0.5)',
                }}
              >
                {loadingMember && selectedMemberId === m.id ? '…' : m.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Section tabs */}
      <div className="flex gap-2 mb-8 flex-wrap">
        {(['prijmy', 'leady', 'aktivita', 'exporty'] as Section[]).map(s => (
          <button key={s} onClick={() => setSection(s)} style={sectionTabStyle(section === s)}>
            {s === 'prijmy' ? 'Příjmy' : s === 'leady' ? 'Leady' : s === 'aktivita' ? 'Aktivita' : 'Exporty'}
          </button>
        ))}
      </div>

      {/* ════════════════════════════════════════════════════════════
          PŘÍJMY
      ════════════════════════════════════════════════════════════ */}
      {section === 'prijmy' && (
        <>
          {/* Overview cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Příjmy tento měsíc', value: revenueThisMonth, sub: MONTH_NAMES_FULL[thisMonth - 1] + ' ' + thisYear, color: '#00BFFF' },
              { label: `Příjmy H${thisHalf} ${thisYear}`, value: revenueThisHalf, sub: thisHalf === 1 ? 'Leden – Červen' : 'Červenec – Prosinec', color: '#7B2FFF' },
              { label: `Příjmy ${thisYear}`, value: revenueThisYear, sub: 'Celý rok', color: '#22C55E' },
              { label: 'Win rate', value: null, sub: `${wonDeals.length} z ${activeDeals.length} zakázek`, color: winRate >= 50 ? '#22C55E' : '#f59e0b', winRate },
            ].map((c, i) => (
              <div key={i} style={cardStyle}>
                <p className="text-xs font-semibold mb-2" style={{ color: 'rgba(237,237,237,0.45)' }}>{c.label}</p>
                {c.winRate !== undefined ? (
                  <p className="text-2xl font-black" style={{ color: c.color }}>{c.winRate} %</p>
                ) : (
                  <p className="text-xl font-black" style={{ color: c.color }}>{fmtKc(c.value!)}</p>
                )}
                <p className="text-xs mt-1" style={{ color: 'rgba(237,237,237,0.3)' }}>{c.sub}</p>
              </div>
            ))}
          </div>

          {/* Goals tabs */}
          <div style={{ ...cardStyle, marginBottom: 24 }}>
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
              <h2 className="text-base font-bold text-white">Cíle příjmů</h2>
              <div className="flex gap-1">
                {(['mesicni', 'pololetni', 'rocni'] as Tab[]).map(t => (
                  <button key={t} style={tabBtnStyle(tab === t)} onClick={() => setTab(t)}>
                    {t === 'mesicni' ? 'Měsíční' : t === 'pololetni' ? 'Pololetní' : 'Roční'}
                  </button>
                ))}
              </div>
            </div>

            {/* Měsíční */}
            {tab === 'mesicni' && (
              <div>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={monthlyData} barSize={18} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey="label" tick={{ fill: 'rgba(237,237,237,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: 'rgba(237,237,237,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => fmtKc(v)} width={70} />
                    <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                    <Bar dataKey="actual" name="Skutečnost" radius={[4, 4, 0, 0]}>
                      {monthlyData.map((entry, i) => (
                        <Cell key={i} fill={entry.goal > 0 ? (entry.actual >= entry.goal ? '#22C55E' : '#ef4444') : '#00BFFF'} />
                      ))}
                    </Bar>
                    <Bar dataKey="goal" name="Cíl" fill="rgba(0,191,255,0.2)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>

                <div className="mt-6 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ color: 'rgba(237,237,237,0.35)', fontSize: 11 }}>
                        <th className="text-left pb-2 font-semibold uppercase tracking-wider">Měsíc</th>
                        <th className="text-right pb-2 font-semibold uppercase tracking-wider">Cíl</th>
                        <th className="text-right pb-2 font-semibold uppercase tracking-wider">Skutečnost</th>
                        <th className="text-right pb-2 font-semibold uppercase tracking-wider">Splnění</th>
                      </tr>
                    </thead>
                    <tbody>
                      {monthlyData.map((row, i) => {
                        const pct = row.goal > 0 ? Math.round((row.actual / row.goal) * 100) : null;
                        const isCurrent = row.y === thisYear && row.m === thisMonth;
                        return (
                          <tr key={i} style={{ borderTop: '1px solid rgba(255,255,255,0.05)', background: isCurrent ? 'rgba(0,191,255,0.04)' : 'transparent' }}>
                            <td className="py-2.5 text-sm font-semibold" style={{ color: isCurrent ? '#00BFFF' : '#ededed' }}>{MONTH_NAMES_FULL[row.m - 1]} {row.y}</td>
                            <td className="py-2.5 text-right">
                              <input
                                type="number"
                                value={getDraft('mesicni', row.y, row.m)}
                                onChange={e => setDraft('mesicni', row.y, row.m, e.target.value)}
                                onBlur={() => saveGoal('mesicni', row.y, row.m)}
                                style={{ ...inputStyle, color: savingGoal === goalKey('mesicni', row.y, row.m) ? '#f59e0b' : 'rgba(237,237,237,0.6)', width: 110 }}
                                placeholder="— nastavit —"
                              />
                            </td>
                            <td className="py-2.5 text-right font-semibold" style={{ color: '#ededed' }}>{fmtKcFull(row.actual)}</td>
                            <td className="py-2.5 text-right">
                              {pct !== null ? (
                                <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: pctColor(pct) + '20', color: pctColor(pct) }}>
                                  {pct} %
                                </span>
                              ) : <span style={{ color: 'rgba(237,237,237,0.2)' }}>–</span>}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Pololetní */}
            {tab === 'pololetni' && (
              <div>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={halfData} barSize={36} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey="label" tick={{ fill: 'rgba(237,237,237,0.4)', fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: 'rgba(237,237,237,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => fmtKc(v)} width={70} />
                    <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                    <Bar dataKey="actual" name="Skutečnost" radius={[6, 6, 0, 0]}>
                      {halfData.map((entry, i) => (
                        <Cell key={i} fill={entry.goal > 0 ? (entry.actual >= entry.goal ? '#22C55E' : '#ef4444') : '#3B82F6'} />
                      ))}
                    </Bar>
                    <Bar dataKey="goal" name="Cíl" fill="rgba(0,191,255,0.18)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>

                <div className="mt-6 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ color: 'rgba(237,237,237,0.35)', fontSize: 11 }}>
                        <th className="text-left pb-2 font-semibold uppercase tracking-wider">Období</th>
                        <th className="text-right pb-2 font-semibold uppercase tracking-wider">Cíl</th>
                        <th className="text-right pb-2 font-semibold uppercase tracking-wider">Skutečnost</th>
                        <th className="text-right pb-2 font-semibold uppercase tracking-wider">Splnění</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { label: `H1 ${thisYear - 1}`, rok: thisYear - 1, half: 1 },
                        { label: `H2 ${thisYear - 1}`, rok: thisYear - 1, half: 2 },
                        { label: `H1 ${thisYear}`, rok: thisYear, half: 1 },
                        { label: `H2 ${thisYear}`, rok: thisYear, half: 2 },
                      ].map((row, i) => {
                        const actual = getRevenueHalf(row.rok, row.half);
                        const goal = getGoal('pololetni', row.rok, row.half);
                        const pct = goal > 0 ? Math.round((actual / goal) * 100) : null;
                        const isCurrent = row.rok === thisYear && row.half === thisHalf;
                        return (
                          <tr key={i} style={{ borderTop: '1px solid rgba(255,255,255,0.05)', background: isCurrent ? 'rgba(0,191,255,0.04)' : 'transparent' }}>
                            <td className="py-2.5 font-semibold" style={{ color: isCurrent ? '#00BFFF' : '#ededed' }}>{row.label}</td>
                            <td className="py-2.5 text-right">
                              <input
                                type="number"
                                value={getDraft('pololetni', row.rok, row.half)}
                                onChange={e => setDraft('pololetni', row.rok, row.half, e.target.value)}
                                onBlur={() => saveGoal('pololetni', row.rok, row.half)}
                                style={{ ...inputStyle, color: 'rgba(237,237,237,0.6)', width: 120 }}
                                placeholder="— nastavit —"
                              />
                            </td>
                            <td className="py-2.5 text-right font-semibold" style={{ color: '#ededed' }}>{fmtKcFull(actual)}</td>
                            <td className="py-2.5 text-right">
                              {pct !== null ? (
                                <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: pctColor(pct) + '20', color: pctColor(pct) }}>
                                  {pct} %
                                </span>
                              ) : <span style={{ color: 'rgba(237,237,237,0.2)' }}>–</span>}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Roční */}
            {tab === 'rocni' && (
              <div>
                <div className="flex flex-col lg:flex-row gap-8 items-center mb-8">
                  <div className="flex flex-col items-center gap-3">
                    <CircularProgress pct={yearPct} size={180} />
                    <p className="text-xs font-semibold" style={{ color: 'rgba(237,237,237,0.4)' }}>Roční cíl {thisYear}</p>
                  </div>
                  <div className="flex-1 grid grid-cols-2 gap-4">
                    {[
                      { label: 'Roční cíl', value: fmtKcFull(yearGoal) || '—', color: '#00BFFF' },
                      { label: 'Skutečnost', value: fmtKcFull(yearActual), color: '#22C55E' },
                      { label: 'Zbývá do cíle', value: yearGoal > 0 ? fmtKcFull(remaining) : '—', color: remaining > 0 ? '#ef4444' : '#22C55E' },
                      { label: 'Měsíců do konce roku', value: String(monthsLeft), color: '#f59e0b' },
                    ].map((item, i) => (
                      <div key={i} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '14px 16px' }}>
                        <p className="text-xs font-semibold mb-1" style={{ color: 'rgba(237,237,237,0.4)' }}>{item.label}</p>
                        <p className="text-lg font-black" style={{ color: item.color }}>{item.value}</p>
                      </div>
                    ))}
                    {monthsLeft > 0 && neededPerMonth > 0 && (
                      <div className="col-span-2 rounded-xl px-4 py-3" style={{ background: 'rgba(0,191,255,0.06)', border: '1px solid rgba(0,191,255,0.15)' }}>
                        <p className="text-xs" style={{ color: 'rgba(237,237,237,0.5)' }}>
                          Průměrně potřebuješ <span className="font-bold" style={{ color: '#00BFFF' }}>{fmtKcFull(neededPerMonth)}</span> měsíčně, abys splnil roční cíl.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ color: 'rgba(237,237,237,0.35)', fontSize: 11 }}>
                        <th className="text-left pb-2 font-semibold uppercase tracking-wider">Rok</th>
                        <th className="text-right pb-2 font-semibold uppercase tracking-wider">Cíl</th>
                        <th className="text-right pb-2 font-semibold uppercase tracking-wider">Skutečnost</th>
                        <th className="text-right pb-2 font-semibold uppercase tracking-wider">Splnění</th>
                      </tr>
                    </thead>
                    <tbody>
                      {yearlyRows.map((row, i) => {
                        const pct = row.goal > 0 ? Math.round((row.actual / row.goal) * 100) : null;
                        const isCurrent = row.rok === thisYear;
                        return (
                          <tr key={i} style={{ borderTop: '1px solid rgba(255,255,255,0.05)', background: isCurrent ? 'rgba(0,191,255,0.04)' : 'transparent' }}>
                            <td className="py-2.5 font-bold" style={{ color: isCurrent ? '#00BFFF' : '#ededed' }}>{row.rok}</td>
                            <td className="py-2.5 text-right">
                              <input
                                type="number"
                                value={getDraft('rocni', row.rok, row.rok)}
                                onChange={e => setDraft('rocni', row.rok, row.rok, e.target.value)}
                                onBlur={() => saveGoal('rocni', row.rok, row.rok)}
                                style={{ ...inputStyle, color: 'rgba(237,237,237,0.6)', width: 130 }}
                                placeholder="— nastavit —"
                              />
                            </td>
                            <td className="py-2.5 text-right font-semibold" style={{ color: '#ededed' }}>{fmtKcFull(row.actual)}</td>
                            <td className="py-2.5 text-right">
                              {pct !== null ? (
                                <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: pctColor(pct) + '20', color: pctColor(pct) }}>
                                  {pct} %
                                </span>
                              ) : <span style={{ color: 'rgba(237,237,237,0.2)' }}>–</span>}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Bottom grid */}
          <div className="grid lg:grid-cols-2 gap-6 mb-6">
            {/* Outlook */}
            <div style={cardStyle}>
              <h2 className="text-base font-bold text-white mb-5">Výhled</h2>
              <div className="flex flex-col gap-3 mb-5">
                {[
                  { label: 'Otevřené zakázky', value: fmtKcFull(openTotal), color: '#00BFFF', sub: `${openDeals.length} zakázek` },
                  { label: 'Vážený výhled', value: fmtKcFull(weightedTotal), color: '#7B2FFF', sub: 'hodnota × pravděpodobnost' },
                  { label: 'K uzavření tento měsíc', value: fmtKcFull(closingThisMonth), color: '#f59e0b', sub: 'dle data uzavření' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-white">{item.label}</p>
                      <p className="text-xs" style={{ color: 'rgba(237,237,237,0.35)' }}>{item.sub}</p>
                    </div>
                    <p className="text-sm font-black" style={{ color: item.color }}>{item.value}</p>
                  </div>
                ))}
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1.5" style={{ color: 'rgba(237,237,237,0.4)' }}>
                  <span>Tento měsíc</span>
                  {monthGoal > 0 && <span>Cíl: {fmtKc(monthGoal)}</span>}
                </div>
                <div className="relative h-3 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <div className="absolute h-full rounded-full" style={{
                    width: `${Math.min((revenueThisMonth + closingThisMonth) / outlookMax * 100, 100)}%`,
                    background: 'rgba(0,191,255,0.2)',
                  }} />
                  <div className="absolute h-full rounded-full" style={{
                    width: `${Math.min(revenueThisMonth / outlookMax * 100, 100)}%`,
                    background: revenueThisMonth >= monthGoal && monthGoal > 0 ? '#22C55E' : '#00BFFF',
                  }} />
                  {monthGoal > 0 && outlookMax > 0 && (
                    <div className="absolute top-0 h-full w-0.5" style={{
                      left: `${Math.min(monthGoal / outlookMax * 100, 100)}%`,
                      background: 'rgba(255,255,255,0.5)',
                    }} />
                  )}
                </div>
                <div className="flex justify-between text-xs mt-1" style={{ color: 'rgba(237,237,237,0.3)' }}>
                  <span>Skutečnost: {fmtKc(revenueThisMonth)}</span>
                  <span>Potenciál: {fmtKc(revenueThisMonth + closingThisMonth)}</span>
                </div>
              </div>
            </div>

            {/* Pipeline analysis */}
            <div style={cardStyle}>
              <h2 className="text-base font-bold text-white mb-5">Pipeline analýza</h2>
              {pipelineData.length === 0 ? (
                <p className="text-sm text-center py-8" style={{ color: 'rgba(237,237,237,0.3)' }}>Žádné zakázky v pipeline</p>
              ) : (
                <div className="flex gap-6 items-center">
                  <div className="flex-shrink-0">
                    <PieChart width={150} height={150}>
                      <Pie data={pipelineData} dataKey="hodnota" cx={70} cy={70} innerRadius={40} outerRadius={68} paddingAngle={2}>
                        {pipelineData.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(v) => fmtKcFull(Number(v))}
                        contentStyle={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }}
                        labelStyle={{ color: 'rgba(237,237,237,0.6)' }}
                      />
                    </PieChart>
                  </div>
                  <div className="flex-1 flex flex-col gap-2">
                    {pipelineData.map((s, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: s.color }} />
                        <span className="text-xs flex-1 truncate" style={{ color: 'rgba(237,237,237,0.7)' }}>{s.name}</span>
                        <span className="text-xs font-semibold" style={{ color: s.color }}>{s.count}</span>
                        <span className="text-xs" style={{ color: 'rgba(237,237,237,0.4)' }}>{fmtKc(s.hodnota)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Top 5 */}
          <div style={cardStyle}>
            <h2 className="text-base font-bold text-white mb-5">Top 5 uzavřených zakázek</h2>
            {top5.length === 0 ? (
              <p className="text-sm text-center py-6" style={{ color: 'rgba(237,237,237,0.3)' }}>Zatím žádné uzavřené zakázky</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ color: 'rgba(237,237,237,0.35)', fontSize: 11 }}>
                      <th className="text-left pb-2 font-semibold uppercase tracking-wider">#</th>
                      <th className="text-left pb-2 font-semibold uppercase tracking-wider">Název</th>
                      <th className="text-left pb-2 font-semibold uppercase tracking-wider">Zákazník</th>
                      <th className="text-right pb-2 font-semibold uppercase tracking-wider">Hodnota</th>
                      <th className="text-right pb-2 font-semibold uppercase tracking-wider">Datum uzavření</th>
                    </tr>
                  </thead>
                  <tbody>
                    {top5.map((d, i) => {
                      const c = d.contacts;
                      return (
                        <tr key={d.id} style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                          <td className="py-2.5 font-bold" style={{ color: 'rgba(237,237,237,0.3)' }}>{i + 1}</td>
                          <td className="py-2.5 font-semibold text-white">{d.nazev}</td>
                          <td className="py-2.5" style={{ color: 'rgba(237,237,237,0.55)' }}>
                            {c ? `${c.jmeno}${c.prijmeni ? ' ' + c.prijmeni : ''}` : '–'}
                          </td>
                          <td className="py-2.5 text-right font-black" style={{ color: '#22C55E' }}>{fmtKcFull(d.hodnota)}</td>
                          <td className="py-2.5 text-right" style={{ color: 'rgba(237,237,237,0.45)' }}>
                            {d.datum_uzavreni ? new Date(d.datum_uzavreni).toLocaleDateString('cs-CZ') : '–'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* ════════════════════════════════════════════════════════════
          LEADY
      ════════════════════════════════════════════════════════════ */}
      {section === 'leady' && (
        <>
          {/* Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Celkem leadů', value: String(totalLeads), color: '#00BFFF', sub: 'celkový počet' },
              { label: 'Konvertovaných', value: String(convertedLeads), color: '#22C55E', sub: `z ${totalLeads} leadů` },
              { label: 'Míra konverze', value: `${conversionRate} %`, color: conversionRate >= 30 ? '#22C55E' : conversionRate >= 15 ? '#f59e0b' : '#ef4444', sub: 'konverze na zákazníka' },
              { label: 'Nových tento měsíc', value: String(newLeadsThisMonth), color: '#7B2FFF', sub: MONTH_NAMES_FULL[thisMonth - 1] + ' ' + thisYear },
            ].map((c, i) => (
              <div key={i} style={cardStyle}>
                <p className="text-xs font-semibold mb-2" style={{ color: 'rgba(237,237,237,0.45)' }}>{c.label}</p>
                <p className="text-2xl font-black" style={{ color: c.color }}>{c.value}</p>
                <p className="text-xs mt-1" style={{ color: 'rgba(237,237,237,0.3)' }}>{c.sub}</p>
              </div>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-6 mb-6">
            {/* Konverze podle zdroje */}
            <div style={cardStyle}>
              <h2 className="text-base font-bold text-white mb-5">Konverze podle zdroje</h2>
              {leadsBySource.length === 0 ? (
                <p className="text-sm text-center py-8" style={{ color: 'rgba(237,237,237,0.3)' }}>Žádná data</p>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={leadsBySource} barSize={20} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                      <XAxis dataKey="name" tick={{ fill: 'rgba(237,237,237,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: 'rgba(237,237,237,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                      <Tooltip content={<CountTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                      <Bar dataKey="celkem" name="Celkem" fill="rgba(0,191,255,0.25)" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="konvertovano" name="Konvertovaných" fill="#22C55E" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                  <div className="mt-4 flex flex-col gap-2">
                    {leadsBySource.map((s, i) => {
                      const rate = s.celkem > 0 ? Math.round((s.konvertovano / s.celkem) * 100) : 0;
                      return (
                        <div key={i} className="flex items-center gap-3">
                          <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: s.color }} />
                          <span className="text-xs flex-1" style={{ color: 'rgba(237,237,237,0.7)' }}>{s.name}</span>
                          <span className="text-xs font-semibold text-white">{s.celkem}</span>
                          <span className="text-xs px-1.5 py-0.5 rounded-full font-semibold" style={{ background: pctColor(rate) + '20', color: pctColor(rate) }}>{rate} %</span>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            {/* Měsíční trend */}
            <div style={cardStyle}>
              <h2 className="text-base font-bold text-white mb-5">Trend přidávání leadů</h2>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={leadMonthlyTrend} barSize={18} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="label" tick={{ fill: 'rgba(237,237,237,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'rgba(237,237,237,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip content={<CountTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                  <Bar dataKey="celkem" name="Nových leadů" fill="rgba(0,191,255,0.3)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="konvertovano" name="Konvertovaných" fill="#22C55E" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
              <div className="flex gap-4 mt-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm" style={{ background: 'rgba(0,191,255,0.3)' }} />
                  <span className="text-xs" style={{ color: 'rgba(237,237,237,0.5)' }}>Nových leadů</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm" style={{ background: '#22C55E' }} />
                  <span className="text-xs" style={{ color: 'rgba(237,237,237,0.5)' }}>Konvertovaných</span>
                </div>
              </div>
            </div>
          </div>

          {/* Celkový souhrn */}
          {totalLeads > 0 && (
            <div style={cardStyle}>
              <h2 className="text-base font-bold text-white mb-5">Souhrn leadů</h2>
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm" style={{ color: 'rgba(237,237,237,0.6)' }}>Celkem leadů</span>
                  <span className="text-sm font-bold text-white">{totalLeads}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm" style={{ color: 'rgba(237,237,237,0.6)' }}>Konvertovaných</span>
                  <span className="text-sm font-bold" style={{ color: '#22C55E' }}>{convertedLeads}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm" style={{ color: 'rgba(237,237,237,0.6)' }}>Nekonvertovaných</span>
                  <span className="text-sm font-bold" style={{ color: '#f59e0b' }}>{totalLeads - convertedLeads}</span>
                </div>
                <div className="mt-2 h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <div className="h-full rounded-full" style={{
                    width: `${conversionRate}%`,
                    background: 'linear-gradient(90deg, #22C55E, #00BFFF)',
                  }} />
                </div>
                <div className="flex justify-between text-xs" style={{ color: 'rgba(237,237,237,0.35)' }}>
                  <span>0 %</span>
                  <span className="font-bold" style={{ color: '#22C55E' }}>{conversionRate} % konverze</span>
                  <span>100 %</span>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* ════════════════════════════════════════════════════════════
          AKTIVITA
      ════════════════════════════════════════════════════════════ */}
      {section === 'aktivita' && (
        <>
          {/* Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Aktivit za 30 dní', value: String(recentActivities.length), color: '#00BFFF', sub: 'všechny typy' },
              { label: 'Schůzky', value: String(recentActivities.filter(a => a.typ === 'schuzka').length), color: '#00BFFF', sub: 'za posledních 30 dní' },
              { label: 'Telefonáty', value: String(recentActivities.filter(a => a.typ === 'telefonat').length), color: '#10b981', sub: 'za posledních 30 dní' },
              { label: 'Emaily', value: String(recentActivities.filter(a => a.typ === 'email').length), color: '#7B2FFF', sub: 'za posledních 30 dní' },
            ].map((c, i) => (
              <div key={i} style={cardStyle}>
                <p className="text-xs font-semibold mb-2" style={{ color: 'rgba(237,237,237,0.45)' }}>{c.label}</p>
                <p className="text-2xl font-black" style={{ color: c.color }}>{c.value}</p>
                <p className="text-xs mt-1" style={{ color: 'rgba(237,237,237,0.3)' }}>{c.sub}</p>
              </div>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-6 mb-6">
            {/* Měsíční trend aktivit */}
            <div style={cardStyle}>
              <h2 className="text-base font-bold text-white mb-5">Aktivity po měsících</h2>
              {activeActivities.length === 0 ? (
                <p className="text-sm text-center py-8" style={{ color: 'rgba(237,237,237,0.3)' }}>Žádné aktivity</p>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={activityMonthlyData} barSize={14} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                      <XAxis dataKey="label" tick={{ fill: 'rgba(237,237,237,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: 'rgba(237,237,237,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                      <Tooltip content={<CountTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                      <Bar dataKey="Schůzky" stackId="a" fill="#00BFFF" />
                      <Bar dataKey="Telefonáty" stackId="a" fill="#10b981" />
                      <Bar dataKey="Emaily" stackId="a" fill="#7B2FFF" />
                      <Bar dataKey="Ostatní" stackId="a" fill="#6b7280" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                  <div className="flex flex-wrap gap-3 mt-4">
                    {[
                      { label: 'Schůzky', color: '#00BFFF' },
                      { label: 'Telefonáty', color: '#10b981' },
                      { label: 'Emaily', color: '#7B2FFF' },
                      { label: 'Ostatní', color: '#6b7280' },
                    ].map((t, i) => (
                      <div key={i} className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-sm" style={{ background: t.color }} />
                        <span className="text-xs" style={{ color: 'rgba(237,237,237,0.5)' }}>{t.label}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Rozložení typů */}
            <div style={cardStyle}>
              <h2 className="text-base font-bold text-white mb-5">Rozložení aktivit (30 dní)</h2>
              {recentActivities.length === 0 ? (
                <p className="text-sm text-center py-8" style={{ color: 'rgba(237,237,237,0.3)' }}>Žádné aktivity za posledních 30 dní</p>
              ) : (
                <div className="flex gap-6 items-center">
                  <div className="flex-shrink-0">
                    <PieChart width={150} height={150}>
                      <Pie
                        data={activityByType}
                        dataKey="count"
                        cx={70} cy={70}
                        innerRadius={40} outerRadius={68}
                        paddingAngle={2}
                      >
                        {activityByType.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(v) => [`${v}×`, '']}
                        contentStyle={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }}
                        labelStyle={{ color: 'rgba(237,237,237,0.6)' }}
                      />
                    </PieChart>
                  </div>
                  <div className="flex-1 flex flex-col gap-2.5">
                    {activityByType.map((t, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: t.color }} />
                        <span className="text-xs flex-1" style={{ color: 'rgba(237,237,237,0.7)' }}>{t.label}</span>
                        <span className="text-xs font-bold" style={{ color: t.color }}>{t.count}×</span>
                        <span className="text-xs" style={{ color: 'rgba(237,237,237,0.35)' }}>
                          {Math.round((t.count / recentActivities.length) * 100)} %
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Celkový přehled */}
          <div style={cardStyle}>
            <h2 className="text-base font-bold text-white mb-5">Přehled všech aktivit</h2>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              {ACT_TYPES.map(t => {
                const count = activeActivities.filter(a => a.typ === t.id).length;
                return (
                  <div key={t.id} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 12, padding: '14px 16px' }}>
                    <p className="text-xs font-semibold mb-2" style={{ color: 'rgba(237,237,237,0.4)' }}>{t.label}</p>
                    <p className="text-2xl font-black" style={{ color: t.color }}>{count}</p>
                    <p className="text-xs mt-1" style={{ color: 'rgba(237,237,237,0.25)' }}>celkem</p>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* ════════════════════════════════════════════════════════════
          EXPORTY
      ════════════════════════════════════════════════════════════ */}
      {section === 'exporty' && (
        <>
          <div className="grid lg:grid-cols-2 gap-6">
            {[
              {
                key: 'leady' as const,
                title: 'Leady',
                desc: 'Všechny leady včetně zdroje, skóre, stavu konverze a poznámek.',
                color: '#10b981',
                icon: (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                    <circle cx="9" cy="7" r="4"/>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                  </svg>
                ),
              },
              {
                key: 'zakaznici' as const,
                title: 'Zákazníci',
                desc: 'Seznam zákazníků s kontaktními údaji a datem přidání.',
                color: '#3B82F6',
                icon: (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                ),
              },
              {
                key: 'zakazky' as const,
                title: 'Zakázky',
                desc: 'Zakázky s hodnotou, fází pipeline, pravděpodobností a datem uzavření.',
                color: '#7B2FFF',
                icon: (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <rect x="2" y="3" width="20" height="14" rx="2"/>
                    <line x1="8" y1="21" x2="16" y2="21"/>
                    <line x1="12" y1="17" x2="12" y2="21"/>
                  </svg>
                ),
              },
              {
                key: 'aktivity' as const,
                title: 'Aktivity',
                desc: 'Všechny aktivity včetně typu, popisu, zákazníka a zakázky.',
                color: '#00BFFF',
                icon: (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                  </svg>
                ),
              },
            ].map(item => (
              <div key={item.key} style={cardStyle}>
                <div className="flex items-start gap-4 mb-5">
                  <div className="rounded-xl p-3 flex-shrink-0" style={{ background: item.color + '18', color: item.color }}>
                    {item.icon}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">{item.title}</h3>
                    <p className="text-sm mt-1" style={{ color: 'rgba(237,237,237,0.45)' }}>{item.desc}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleExport(item.key)}
                  disabled={exporting === item.key}
                  className="w-full py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2"
                  style={{
                    background: exporting === item.key ? 'rgba(255,255,255,0.05)' : item.color + '18',
                    border: `1px solid ${item.color}40`,
                    color: exporting === item.key ? 'rgba(237,237,237,0.3)' : item.color,
                    cursor: exporting === item.key ? 'not-allowed' : 'pointer',
                  }}
                >
                  {exporting === item.key ? (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ animation: 'spin 1s linear infinite' }}>
                        <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                      </svg>
                      Připravuji…
                    </>
                  ) : (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="7 10 12 15 17 10"/>
                        <line x1="12" y1="15" x2="12" y2="3"/>
                      </svg>
                      Stáhnout CSV
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-2xl px-5 py-4" style={{ background: 'rgba(0,191,255,0.05)', border: '1px solid rgba(0,191,255,0.12)' }}>
            <p className="text-sm" style={{ color: 'rgba(237,237,237,0.5)' }}>
              CSV soubory jsou kódovány v UTF-8 s BOM pro správné zobrazení diakritiky v Microsoft Excel.
              Export obsahuje pouze vaše vlastní data.
            </p>
          </div>
        </>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
