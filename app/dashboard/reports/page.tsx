'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line,
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

type Goal = {
  id?: string;
  rok: number;
  typ: 'mesicni' | 'pololetni' | 'rocni';
  obdobi: number;
  cil_castka: number;
};

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

// ─── Custom Tooltip ───────────────────────────────────────────────────────────

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

// ─── Main Page ────────────────────────────────────────────────────────────────

type Tab = 'mesicni' | 'pololetni' | 'rocni';

export default function ReportsPage() {
  const supabase = createClient();
  const now = new Date();
  const thisYear = now.getFullYear();
  const thisMonth = now.getMonth() + 1;
  const thisHalf = thisMonth <= 6 ? 1 : 2;

  const [stages, setStages] = useState<Stage[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('mesicni');
  const [savingGoal, setSavingGoal] = useState<string | null>(null);

  // Draft goal edits (key: `typ-rok-obdobi`)
  const [goalDrafts, setGoalDrafts] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    const [{ data: stagesData }, { data: dealsData }, { data: goalsData }] = await Promise.all([
      supabase.from('pipeline_stages').select('id, nazev, barva').order('poradi'),
      supabase.from('deals').select('id, nazev, hodnota, pravdepodobnost, stage_id, datum_uzavreni, contacts(jmeno, prijmeni)'),
      supabase.from('revenue_goals').select('id, rok, typ, obdobi, cil_castka').order('rok').order('obdobi'),
    ]);
    setStages(stagesData ?? []);
    setDeals((dealsData as unknown as Deal[]) ?? []);
    setGoals(goalsData ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── Derived data ─────────────────────────────────────────────────────────

  const wonStageIds = useMemo(
    () => new Set(stages.filter(isWonStage).map(s => s.id)),
    [stages]
  );

  const wonDeals = useMemo(
    () => deals.filter(d => d.stage_id && wonStageIds.has(d.stage_id)),
    [deals, wonStageIds]
  );

  // Revenue by month (from won deals with datum_uzavreni)
  const revenueByMonth = useMemo(() => {
    const map: Record<string, number> = {};
    wonDeals.forEach(d => {
      if (!d.datum_uzavreni) return;
      const dt = new Date(d.datum_uzavreni);
      const key = `${dt.getFullYear()}-${dt.getMonth() + 1}`;
      map[key] = (map[key] ?? 0) + d.hodnota;
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

  // ── Overview cards ────────────────────────────────────────────────────────

  const revenueThisMonth = getRevenue(thisYear, thisMonth);
  const revenueThisHalf = getRevenueHalf(thisYear, thisHalf);
  const revenueThisYear = getRevenueYear(thisYear);
  const winRate = deals.length > 0 ? Math.round((wonDeals.length / deals.length) * 100) : 0;

  // ── Goal helpers ─────────────────────────────────────────────────────────

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

  // ── Monthly chart data (last 12 months) ──────────────────────────────────

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

  // ── Half-year chart data ──────────────────────────────────────────────────

  const halfData = useMemo(() => [
    { label: `H1 ${thisYear - 1}`, actual: getRevenueHalf(thisYear - 1, 1), goal: getGoal('pololetni', thisYear - 1, 1) },
    { label: `H2 ${thisYear - 1}`, actual: getRevenueHalf(thisYear - 1, 2), goal: getGoal('pololetni', thisYear - 1, 2) },
    { label: `H1 ${thisYear}`, actual: getRevenueHalf(thisYear, 1), goal: getGoal('pololetni', thisYear, 1) },
    { label: `H2 ${thisYear}`, actual: getRevenueHalf(thisYear, 2), goal: getGoal('pololetni', thisYear, 2) },
  ], [goals, revenueByMonth, thisYear]);

  // ── Yearly table ──────────────────────────────────────────────────────────

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

  // ── Outlook ───────────────────────────────────────────────────────────────

  const openDeals = deals.filter(d => !wonStageIds.has(d.stage_id ?? ''));
  const openTotal = openDeals.reduce((s, d) => s + d.hodnota, 0);
  const weightedTotal = openDeals.reduce((s, d) => s + d.hodnota * (d.pravdepodobnost ?? 50) / 100, 0);
  const closingThisMonth = openDeals.filter(d => {
    if (!d.datum_uzavreni) return false;
    const dt = new Date(d.datum_uzavreni);
    return dt.getFullYear() === thisYear && dt.getMonth() + 1 === thisMonth;
  }).reduce((s, d) => s + d.hodnota, 0);

  const monthGoal = getGoal('mesicni', thisYear, thisMonth);
  const outlookMax = Math.max(monthGoal, revenueThisMonth + closingThisMonth, 1);

  // ── Pipeline analysis ─────────────────────────────────────────────────────

  const pipelineData = useMemo(() => {
    return stages.map(s => {
      const stageDeals = deals.filter(d => d.stage_id === s.id);
      return {
        name: s.nazev,
        count: stageDeals.length,
        hodnota: stageDeals.reduce((a, d) => a + d.hodnota, 0),
        color: s.barva,
      };
    }).filter(s => s.count > 0);
  }, [deals, stages]);

  // ── Top 5 won deals ───────────────────────────────────────────────────────

  const top5 = useMemo(() =>
    [...wonDeals]
      .sort((a, b) => b.hodnota - a.hodnota)
      .slice(0, 5),
    [wonDeals]
  );

  // ─── UI ──────────────────────────────────────────────────────────────────

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
      <div className="mb-8">
        <h1 className="text-2xl font-black text-white">Reporting</h1>
        <p className="text-sm mt-0.5" style={{ color: 'rgba(237,237,237,0.45)' }}>
          Přehled příjmů, plnění cílů a výhled pipeline
        </p>
      </div>

      {/* ── Overview cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Příjmy tento měsíc', value: revenueThisMonth, sub: MONTH_NAMES_FULL[thisMonth - 1] + ' ' + thisYear, color: '#00BFFF' },
          { label: `Příjmy H${thisHalf} ${thisYear}`, value: revenueThisHalf, sub: thisHalf === 1 ? 'Leden – Červen' : 'Červenec – Prosinec', color: '#7B2FFF' },
          { label: `Příjmy ${thisYear}`, value: revenueThisYear, sub: 'Celý rok', color: '#22C55E' },
          { label: 'Win rate', value: null, sub: `${wonDeals.length} z ${deals.length} zakázek`, color: winRate >= 50 ? '#22C55E' : '#f59e0b', winRate },
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

      {/* ── Goals tabs ── */}
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

        {/* ── Tab: Měsíční ── */}
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

        {/* ── Tab: Pololetní ── */}
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

        {/* ── Tab: Roční ── */}
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

      {/* ── Bottom grid ── */}
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

          {/* Mini progress */}
          <div>
            <div className="flex justify-between text-xs mb-1.5" style={{ color: 'rgba(237,237,237,0.4)' }}>
              <span>Tento měsíc</span>
              {monthGoal > 0 && <span>Cíl: {fmtKc(monthGoal)}</span>}
            </div>
            <div className="relative h-3 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
              {/* Potential */}
              <div className="absolute h-full rounded-full" style={{
                width: `${Math.min((revenueThisMonth + closingThisMonth) / outlookMax * 100, 100)}%`,
                background: 'rgba(0,191,255,0.2)',
              }} />
              {/* Actual */}
              <div className="absolute h-full rounded-full" style={{
                width: `${Math.min(revenueThisMonth / outlookMax * 100, 100)}%`,
                background: revenueThisMonth >= monthGoal && monthGoal > 0 ? '#22C55E' : '#00BFFF',
              }} />
              {/* Goal marker */}
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

      {/* ── Top 5 ── */}
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
    </div>
  );
}
